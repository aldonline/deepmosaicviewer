Source = require('./source').Source

DELAY = 300

data = """
00 00 01 02 xx
00 00 xx 03 xx
xx xx xx xx 04
"""
matrix = ( ( Number item for item in line.split ' ' ) for line in data.split '\n' )

get_cell = ( id ) ->
  for y in [0...matrix.length]
    row = matrix[y]
    for x in [0...row.length]
      item = row[x]
      if item is id
        size = 1
        size++ while row[x + size] is id
        return x:x, y:y, size: size * size, id:id
  null

get_cells = ( ids ) -> get_cell id for id in ids

get_id = ( x, y ) ->
  try
    return matrix[y][x]
  null

get_ids = ( x, y, w, h, cb ) ->
  ids = []
  for [x...(x+w)]
    for [y...(y+h)]
      ids.push matrix[y][x]
  ids

delay = ( cb ) -> setTimeout cb, DELAY

class MockSource extends Source
  # 1. indicate the DZI source:
  dzi_url : 'http://conobox.com/TSO/flags/latest/cl.xml'
  # We include the XML contents here to avoid a cross-domain XHR to the conobox server
  # as it won't allow it
  dzi_str: '<Image xmlns="http://schemas.microsoft.com/deepzoom/2008" TileSize="254" Overlap="1" Format="jpg"><Size Width="7500" Height="5000"/></Image>'
  
  
  # 2. query methods you must implement to allow hovering over cells, etc
  
  # id --> one Cell or null
  by_id : ( id, cb ) -> delay -> cb get_cell id
  
  # same as id but you can pass in an array
  by_ids : ( ids, cb ) -> delay -> cb get_cells ids
  
  # ( x, y ) -> a Cell or null
  by_coords : ( x, y, cb ) -> delay -> 
    id = get_id x, y
    if id is null
      cb null
    else
      cb get_cell id
  
  # instead of asking for each coordinate,
  # this allows you to ask for a region ( save some requests )
  by_rect : ( x, y, w, h, cb ) -> delay -> 
    ids = get_ids x, y, w, h
    cb get_cells ids

exports.source = new MockSource
