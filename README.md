# Deep Mosaic Viewer

Based on Seadragon, provides extra features to operate with mosaics.
Mosaics are DeepZoom images that are made of tiles of multiple images, where each image is itself an object.

The standard DZI viewer takes a DZI url as the only input.
The DMV also takes a service object, containing a set of async query methods. These methods let the viewer find and display cells, etc.

## Usage

Take a look at: /example1.html

You fill find dmv.js in the /build directory

In a nutshell:

* Include the necesary scripts ( seadragon, jquery, dmv )
* Create a new DMV by passing in the ID of a container ( a div )
* Pass on a datasource object. This contains the DZI url and some callbacks that you must implement:


    datasource =
      dzi_url : 'http://conobox.com/TSO/flags/latest/cl.xml'
      # We include the XML contents here to avoid a cross-domain XHR to the conobox server
      # as it won't allow it. This is optional
      dzi_str: '<Image xmlns="http://schemas.microsoft.com/deepzoom/2008" TileSize="254" Overlap="1" Format="jpg"><Size Width="7500" Height="5000"/></Image>'
      by_id : ( id, cb ) ->
      by_ids : ( ids, cb ) ->
      by_coords : ( x, y, cb ) ->
      by_rect : ( x, y, w, h, cb ) ->


Notes:

* You can pass many different datasource objects over the lifetime of a viewer, it will reload the images, etc