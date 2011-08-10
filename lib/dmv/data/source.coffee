###
Abstract base class for data sources.
For a working example, see ./mock
###
class Source
  # 1. indicate the DZI source:
  dzi_url : null # 'http://conobox.com/TSO/flags/latest/cl.xml'
  # Optionally include the XML contents here to avoid a cross-domain XHR to the conobox server
  # as it won't allow it
  dzi_str: null # '<Image xmlns="http://schemas.microsoft.com/deepzoom/2008" TileSize="254" Overlap="1" Format="jpg"><Size Width="7500" Height="5000"/></Image>'
  
  # 2. query methods you must implement to allow hovering over cells, etc
  
  # id --> one Cell or null
  by_id : ( id, cb ) ->
  
  # same as id but you can pass in an array
  by_ids : ( ids, cb ) ->
  
  # ( x, y ) -> a Cell or null
  by_coords : ( x, y, cb ) ->
  
  # instead of asking for each coordinate,
  # this allows you to ask for a region ( save some requests )
  by_rect : ( x, y, w, h, cb ) ->

exports.Source = Source