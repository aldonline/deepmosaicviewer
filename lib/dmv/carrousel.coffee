util = require './util/util'

dest = util.get_base_url() + '/flags/latest'

# draws the carrousel on a given container
init = (items, container_id) ->
  i = 0
  $ ->
    $container = $ '#' + container_id
    viewer = new Seadragon.Viewer container_id
    loopz = new util.Loop items, 5000, (v) ->
      viewer.openDzi "#{dest}/#{v.id}.xml"
      viewer.addEventListener 'open', ->
        # TODO: remove this event listener now
        # in order to do this we need to make sure we don't get a race condition
        # so Loop must learn to wait. We can achieve this by returning a function
        # from the loop handler, which takes a callback
        # ( double callback pattern )
        # see http://expression.microsoft.com/es-cl/gg413352(en-us).aspx
        viewer.viewport.zoomTo .2, null, yes
        util.to 400, ->
          viewer.viewport.zoomTo .8
    $container.hover ( -> loopz.pause() ), ( -> loopz.resume() )

exports.init = init