Source = require('./source').Source

DEBUG = no

# transforms result objects form the server API to the format required
# by the client. There are slight differences
# TODO: consider modifying the generator API to resemble this API, or viceversa
massage = ( objs ) ->
  for obj in objs
    obj.size = obj.cells
    obj.id = obj.image
    # no need to delete, but I'm a maniac...
    delete obj.cells
    delete obj.image
    delete obj.side

class MosaicSource extends Source
  
  constructor: ( @dzi_url, @dzi_str, @endpoint, @mosaic_id, @version ) ->
    # Some Assertions
    unless @mosaic_id?
      throw new Error 'mosaic_id cannot be null or undefined'
    unless @dzi_url?
      throw new Error 'dzi_url cannot be null or undefined'
    unless @version?
      throw new Error '(mosaic) version cannot be null or undefined'
    
    # TODO: remove this once Eduardo adds cross domain permissions to generators
    @dzi_str =  '<Image xmlns="http://schemas.microsoft.com/deepzoom/2008" TileSize="254" Overlap="1" Format="jpg"><Size Width="7500" Height="5000"/></Image>'
  
  # id --> one Cell or null
  by_id : ( id, cb ) ->
    @_ 'find_by_image', [@mosaic_id, @version, id], ( err, res ) ->
      # filter out results for other mosaics/versions
      res = ( r for r in res when ( res.id is @mosaic_id and res.version is @version ) )
      massage res
      # return first image found or null
      if res.length is 0
        cb null
      else
        cb res[0]
  
  by_ids : ( ids, cb ) ->
    throw new Error 'tried to call unimplemented method on mosaic source ( by_ids )'
  
  # ( x, y ) -> a Cell or null
  by_coords : ( x, y, cb ) ->
    @_ 'find_by_coord', [ @mosaic_id, @version, x, y ], ( err, res ) ->
      if res.length is 0
        cb null
      else
        massage res
        cb res[0]
  
  # instead of asking for each coordinate,
  # this allows you to ask for a region ( save some requests )
  by_rect : ( x, y, w, h, cb ) ->
    @_ 'find_by_rect', [@mosaic_id, @version, x, y, w, h], ( err, res ) ->
      massage res
      cb res

  _: ( method, params, cb ) -> rpc @endpoint, method, params, cb


### 
curl --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "load_test_data", "params": [] }' -H 'content-type: text/plain;' http://localhost:3000/api
curl --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "get_mosaic_info", "params": ["cl"] }' -H 'content-type: text/plain;' http://localhost:3000/api
###


dbg = ( msg ) ->
  if DEBUG
    try
      console.log msg

serial = 0
cbs = {}
rpc = ( endpoint, method, params, cb ) ->
  dbg [ endpoint, method, params ]
  id = serial++
  cbs[id] = cb
  data = JSON.stringify method:method, params:params, id:id, jsonrpc:'1.0'
  handle_res = ( res ) ->
    dbg [ 'result:', res ]
    if res.error?
      throw new Error 'JSONRPC Error: ' + res.error
    cbs[id] res.error, res.result
    delete cbs[id]
  jQuery.post endpoint, data, handle_res, 'json'

# gets the source for a given mosaic
# if version is null, then the latest version is returned
create = ( endpoint, id, version, cb ) ->
  # Some Assertions
  unless endpoint?
    throw new Error 'endpoint cannot be null or undefined'
  unless id?
    throw new Error 'id cannot be null or undefined'
  rpc endpoint, 'get_mosaic_info', [id], ( err, res ) ->
    if version?
      v = null
      for _v in res.versions when v.version is version
        v = _v
        break
    else
      if res.versions.length isnt 0
        v = res.versions.pop()
    if v is null
      cb 'requested mosaic version not found', null
    else
      source = new MosaicSource v.url, null, endpoint, id, v.version
      cb null, source


exports.create = create