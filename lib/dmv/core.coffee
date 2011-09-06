sd = Seadragon
util = require './util/util'
sdutil = require './util/seadragon_util'
cell_service_module = require './cell_service'

SEARCHING = '#ff0'
FOUND = '#0f0'
NOT_FOUND = '#f00'

PENDING = {}

DEBUG = no

# some configurations
# see http://expression.microsoft.com/en-us/gg413300
sd.Config.visibilityRatio = .7


class MosaicContainer
  @current_cell = null
  constructor: ( @container_id ) ->
    @container = $ '#' + @container_id
    @viewer = new sd.Viewer @container_id
    @highlighter = new sdutil.Highlighter @viewer
  set: ( source ) ->
    if (cm = @current_mosaic)?
      $(cm).unbind 'change'
      cm.destroy()
    cm = @current_mosaic = new Mosaic @, source
    $(cm).bind 'change', =>
      @current_cell = cm.current_cell
      $(@).trigger 'change'
    cm.setup()
  go_to: ( id ) ->
    @current_mosaic?.go_to id

class Mosaic
  constructor: (@mosaic_container, @source) ->
  setup: ->
    @cell_service = new cell_service_module.CellService @source
    @current_cell = null
    @current_hover = null
    viewer = @mosaic_container.viewer
    @open_handler = =>
      # TODO: zoom limit must be calculated from image dimensions
      @zlw = new sdutil.ZoomLimitWatcher viewer.viewport, 2, 1000
      @bucket_manager = new sdutil.BufferedGridManager viewer, 50, 100
      $(@zlw).bind 'change', =>
        console.log "zoom change #{@zlw.value}"
        if @zlw.value
          if ( buck = @bucket_manager.cell )?
            @hover_on_bucket buck
        else
          @hover_on_bucket null # remove current hover
      $(@bucket_manager).bind 'change', (event) => # every time a bucket changes...
        if @zlw.value
          @hover_on_bucket @bucket_manager.cell # terminology warning: cell here acutally means 'bucket'
    viewer.addEventListener 'open', @open_handler
    viewer.openDzi @source.dzi_url, @source.dzi_str
    @zoom_interval = setInterval @handle_zoom , 200
  hover_on_bucket: ( bucket ) ->
    if @current_cell?
      if bucket? and @current_cell.contains_bucket bucket.x, bucket.y
        return # we are within the same cell, do nothing
      else # exited the cell, remove current cell
        @current_cell = null
        @mosaic_container.highlighter.draw null
        $(@).trigger 'change'
    else
      @mosaic_container.highlighter.draw null
    if @current_hover?
      @current_hover.cancel()
      $(@current_hover).unbind 'change'
    if bucket?
      @current_hover = new CellHover bucket, @cell_service, @bucket_manager.mapper, @mosaic_container.highlighter
      $(@current_hover).bind 'change', =>
        if @current_cell isnt @current_hover.cell
          @current_cell = @current_hover.cell
          $(@).trigger 'change'
      @current_hover.start()
  hover_on_cell: ( cell ) ->
    if cell?
      # transform cell to bucket manually
      # finding out the top-left bucket is trivial
      bucket = new sd.Point
      bucket.x = cell.x
      bucket.y = cell.y
      bucket.inside = yes
      @hover_on_bucket bucket
    else
      @hover_on_bucket null
  # will try to position the viewport on the cell that has the given id
  # returns false if no id was found, etc
  go_to: ( id ) ->
    @cell_service.by_id id, (cell) =>
      if cell?
        mapper = @bucket_manager.mapper
        # get the cell's projected rectangle
        rect = cell.get_rect mapper
        
        # add a margin ( we make it equal to width, but could be different )
        margin = rect.width
        rect.x = rect.x - margin
        rect.y = rect.y - margin
        rect.width = rect.width + margin * 2
        rect.height = rect.height + margin * 2
        
        # TODO: make sure we don't scroll 'out' of the mosaic
        # this may happen if the image is on or near a border
        
        # start a hover on the cell
        @hover_on_cell cell
        
        # start animation
        @mosaic_container?.viewer.viewport?.fitBounds rect
      else
        no
  destroy: ->
    @mosaic_container.viewer.removeEventListener 'open', @open_handler
    try
       @zlw.destroy()

# A cell hover represents the user gesture of hovering over a cell
# The important thing about this object is that it contains the lifecycle
# ( hover, query, result ) and can be cancelled at any time
# This allows us to make one hover "cancel" the previous one even if the query
# has not yet arrived
class CellHover
  constructor: ( @bucket, @cell_service, @mapper, @highlighter ) ->
    @cell = null
  start : ->
    if @bucket?
      rect = @mapper.cell2rect @bucket
      answered = no
      @cell_service.get_cell @bucket.x, @bucket.y, (c) =>
        return if @_canceled
        answered = yes
        if c?
          @highlighter.draw c.get_rect(@mapper), FOUND
        else
          @highlighter.draw rect, NOT_FOUND
        @cell = c
        $(@).trigger 'change'
      if not answered # it is async...
        @highlighter.draw rect, SEARCHING
    else
      @highlighter.draw null # remove any highlight
  cancel : -> @_canceled = yes

exports.MosaicContainer = MosaicContainer