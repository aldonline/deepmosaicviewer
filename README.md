Deep Mosaic Viewer

Based on Seadragon, provides extra features to operate with mosaics.
Mosaics are DeepZoom images that are made of tiles of multiple images, where each image is itself an object.

The standard DZI viewer takes a DZI url as the only input.
The DMV also takes a service object, containing a set of async query methods. These methods let the viewer find and display cells, etc.

## Usage

Dependencies

* Seadragon JS
* jQuery

Then include the script in /build/dmv.js

( this script is built using some nodejs magic, and it will create one global function called require )




Create a new DMV by passing in the ID of a container.

now, pass on a datasource object. IT must contain the following fields.

You can pass many different datasource objects over the lifetime of a viewer.



While the "widget" can be compiled into one javascript file, we contain it within a node.js project to use node's code testing and package management abilities.

Usage

