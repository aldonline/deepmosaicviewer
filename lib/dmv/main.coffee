util = require './util/util'
core = require './core'
mock = require './data/mock'

test1 = -> $ ->
  mc = new core.MosaicContainer 'viewer'
  $(mc).bind 'change', ->
    console.log ['MosaicContainer.change!', mc.current_cell]
  mc.set mock.source

exports.test1 = test1