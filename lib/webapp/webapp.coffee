# ------ imports
express = require 'express'
coffeekup = require 'coffeekup'
browserify = require 'browserify'

# --------

server = express.createServer()

server.register '.coffee', coffeekup
server.set 'view engine', 'coffee'
server.set 'views', __dirname + '/views'

pub = __dirname + '/public'
server.use express.compiler src: pub, enable: ['less']
server.use express.static pub

# serve the javascript API
server.use browserify 
  require: __dirname + '/../dmv/main'
  mount: '/dmv.js'
  watch: yes

server.get '/', (req, res) ->
  res.render 'home'

server.listen 9876
console.log 'HTTP server started at 9876'