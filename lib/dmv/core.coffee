sd = Seadragon
util = require './util/util'
sdutil = require './util/seadragon_util'
cell_service_module = require './cell_service'

SEARCHING = '#ff0'
FOUND = '#0f0'
NOT_FOUND = '#f00'

PENDING = {}

DEBUG = no

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

class Mosaic
  constructor: (@mosaic_container, @source) ->
  setup: ->
    cs = new cell_service_module.CellService @source
    viewer = @mosaic_container.viewer
    highlighter = @mosaic_container.highlighter
    @current_cell = null
    @open_handler = =>
      bucket_manager = new sdutil.BufferedGridManager viewer, 50, 100
      current_hover = null
      $(bucket_manager).bind 'change', (event) => # every time a bucket changes...
        bucket = bucket_manager.cell
        if @current_cell?
          if bucket? and @current_cell.contains_bucket bucket.x, bucket.y
            return # we are within the same cell, do nothing
          else # exited the cell, remove current cell
            @current_cell = null
            highlighter.draw null
            $(@).trigger 'change'
        if current_hover?
          current_hover.cancel()
          $(current_hover).unbind 'change'
        if bucket?
          current_hover = new CellHover bucket, cs, bucket_manager.mapper, highlighter
          $(current_hover).bind 'change', =>
            if @current_cell isnt current_hover.cell
              @current_cell = current_hover.cell
              $(@).trigger 'change'
          current_hover.start()
    viewer.addEventListener 'open', @open_handler
    viewer.openDzi @source.dzi_url, @source.dzi_str
  destroy: ->
    @mosaic_container.viewer.removeEventListener 'open', @open_handler

# A cell hover represents the user gesture of hovering over a cell
# The important thing about this object is that it contains the lifecycle
# ( hover, query, result ) and can be cancelled at any time
# This allows us to make one hover "cancel" the previous one even if the query
# has not yet arrived
# TODO: dispatches a 'found' event whenever a cell is found
# it contains a 'cell' property
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