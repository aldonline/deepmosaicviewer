sd = Seadragon

###
The service layer operates atop the source.
It provides
* caching for remote requests
* some bulk optimizations ( requesting a region of cells at once )
* different semantics
No other classes/modules should use the 'source' directly. Only a cellservice instance.
###

# TODO: clear cache after a certain heuristic to avoid mem leaks

# Cell is the model class representing one Cell.
# A cell is defined by its position in a mosaic and its size
# it can be 1, 4, 8 .. buckets big
# all coords start from zero 
class Cell
  constructor : (@x, @y, @buckets, @id) ->
    @side = Math.sqrt @buckets
  contains_bucket : (x, y) -> (@x <= x < @x + @side) and (@y <= y < @y + @side)
  get_rect : ( mapper ) ->
    tl = mapper.cell2point new sd.Point @x, @y
    br = mapper.cell2point new sd.Point @x + @side, @y + @side
    new sd.Rect tl.x, tl.y, br.x - tl.x, br.y - tl.y
  equals : ( other ) ->
    try return other.x is @x and other.y is @y
    no

# A CellQuery corresponds to an invocation of the CellService
# it can be canceled mid-flight and no callback is fired
class CellQuery
  constructor: (cell_service, x, y, cb) ->
    cell_service.get_cell x, y, (res) => cb res unless @canceled
  cancel : -> @canceled = yes

# service atop the api that provides caching and smart lookup for cells
# it exposes one method: get_cell(x, y, cb)
class CellService
  constructor: (@source) ->
    @cells = []
    @cache = {}
  by_id : ( id, cb ) ->
    @source.by_id id, ( res ) ->
      # TODO: cache this too
      cb new Cell res.x, res.y, res.size, res.id
  get_cell : ( x, y, cb ) ->
    key = x + '_' + y
    unless @cache[key] is undefined
      cb @cache[key]
    else
      @_get_cell x, y, (cell) => cb @cache[key] = cell
  _get_cell : (x, y, cb) ->
    # optimization: search if bucket is contained in a cell that's already loaded
    return cb cell for cell in @cells when cell.contains_bucket x, y
    # else, hit the service
    @source.by_coords x, y, (res) =>
      if res is null
        cb null
      else
        @cells.push c = new Cell res.x, res.y, res.size, res.id
        cb c

exports.CellService = CellService
exports.CellQuery = CellQuery