var fs = require('fs')
var b = require('browserify')({
  require: __dirname + '/lib/dmv/dmv'
})
var source = b.bundle()
fs.writeFile(__dirname + "/build/dmv.js", source, function(err) {
    if(err) {
        console.log(err)
    } else {
        console.log("Build OK")
    }
})