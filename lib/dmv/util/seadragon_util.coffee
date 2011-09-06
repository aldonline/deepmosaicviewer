util = require './util'

###
Utilities to enhance the Seadragon API
http://expression.microsoft.com/en-us/gg413351.aspx
###

sd = Seadragon

# Takes a Seadragon viewer and adds a new jQuery event called 'sdmousemove'
# this event triggers when the user hovers the viewer
# and it exposes a "point" property that corresponds to the hovered point
# in the Seadragon coord space
ensure_sdmousemove_event = ( viewer ) ->
  unless viewer.___sdmousemove # check if we alread did it
    $( viewer.elmt ).mousemove (event) ->
      viewer.___sdmousemove = yes
      pixels = sd.Utils.getMousePosition(event).minus sd.Utils.getElementPosition viewer.elmt
      point = viewer.viewport.pointFromPixel pixels
      event = new $.Event 'sdmousemove'
      event.point = point
      $( viewer ).trigger event

# allows you to go from points in SD coord space to cells
class BasicGridMapper
  constructor : ( @xcells ) -> @cell_size = 1 / @xcells
  cell2point : ( cell ) -> new sd.Point cell.x * @cell_size, cell.y * @cell_size
  cell2rect : ( cell ) -> new sd.Rect cell.x * @cell_size, cell.y * @cell_size, @cell_size, @cell_size
  point2cell : ( point ) -> new sd.Point Math.floor( point.x / @cell_size ), Math.floor( point.y / @cell_size )

# same as BasicGridMapper, but will add a flag to each point returned
# marking is as "inside"
class LimitedGridMapper extends BasicGridMapper
  constructor : ( @xcells, @ycells ) ->
    super @xcells
  cell2point : ( cell ) ->
    p = super cell
    p.inside = @test_cell cell
    p
  cell2rect : ( cell ) ->
    r = super cell
    r.inside = @test_cell cell
    r
  point2cell : ( point ) ->
    c = super point
    c.inside = @test_cell c
    c
  test_cell : ( cell ) ->
    ( 0 <= cell.x < @xcells ) and ( 0 <= cell.y < @ycells )

point_is_visible = (viewport, point) ->
  vb = viewport.getBounds true
  xmin = vb.x
  xmax = vb.width + vb.x
  ymin = vb.y
  ymax = vb.height + vb.y
  (xmin < point.x < xmax) and (ymin < point.y < ymax)

# lifecycle: must be constructed when viewer has content
# if content changes, then this grid manager must be discarded
# and a new one must be created
# it dispatches one event: 'change'. The event has a 'cell' property
# and it exposes one property: mapper, which contains a GridMapper
class GridManager
  constructor: ( @viewer, @cell_size ) ->
    # http://expression.microsoft.com/en-us/gg413351.aspx
    s = @viewer.source
    xcells = Math.floor s.width / @cell_size
    ycells = Math.floor s.height / @cell_size
    @mapper = new LimitedGridMapper xcells, ycells
    ensure_sdmousemove_event @viewer
    @cell = null
    $( @viewer ).bind 'sdmousemove', ( event ) =>
      new_cell = @mapper.point2cell event.point
      if new_cell.inside is false
        new_cell = null
      unless @cell is new_cell or @cell?.equals new_cell
        @cell = new_cell
        event2 = new $.Event 'change'
        event2.cell = new_cell
        $(@).trigger event2

# adds buffering to GridManager via composition
class BufferedGridManager
  constructor: ( @viewer, @cell_size, delay ) ->
    @gm = new GridManager @viewer, @cell_size
    @vb = new util.EqualsValueBuffer delay
    @mapper = @gm.mapper
    $(@gm).bind 'change', (evt) =>
      @vb.set_value evt.cell
    $(@vb).bind 'change', =>
      event2 = new $.Event 'change'
      @cell = event2.cell = @vb.value
      $(@).trigger event2

class Highlighter
  constructor: ( @viewer ) ->
     @hl_elm = $ '<div>'
  draw : ( rect, color = '#ff0' ) ->
    @hl_elm.css background: color
    elm = @hl_elm[0]
    drawer = @viewer.drawer
    if rect?
      if @last_rect?
        unless @last_rect.equals rect
          drawer.updateOverlay elm, rect
      else
        drawer.addOverlay elm, rect
      @hl_elm.css opacity: 0
      @hl_elm.animate (opacity: .4), 300
    else
      if @last_rect?
        drawer.removeOverlay elm
    @last_rect = rect

###
Watches for zoom changes in a Seadragon.Viewport instance.
Has one property called "value", which is always equal to : min_zoom < zoom < max_zoom
Fires a 'change' event when this property changes
###
class ZoomLimitWatcher extends util.ValueBuffer
  constructor: ( @viewport, @min_zoom, @max_zoom ) ->
    super 100, false
    @interval = setInterval @_check, 50
  _check : =>
    @set_value @min_zoom < @viewport.getZoom() < @max_zoom
  destroy: ->
    clearInterval @interval
    delete @viewport
    delete @interval

exports.point_is_visible = point_is_visible
exports.GridManager = GridManager
exports.BufferedGridManager = BufferedGridManager
exports.Highlighter = Highlighter
exports.ZoomLimitWatcher = ZoomLimitWatcher