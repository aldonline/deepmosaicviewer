
# helpers
_metaprop = (p, c) -> (meta property:p, content:c) if c?
_s = (src) -> script src: src
_c = (href) -> link rel: 'stylesheet', href: href

# start HTML doc
doctype 5
html ->
  head ->
    meta charset: 'utf-8'
    # start Facebook Open Graph tags for "share" plugin compatibility
    _metaprop 'og:title', @og_title
    _metaprop 'og:description', @og_description
    _metaprop 'og:image', @og_image
    # end Facebook Open Graph tags for "share" plugin compatibility
    title ( if @title? then @title + ' @ ' else '' ) + 'Supermodel'
    meta(name: 'description', content: @description) if @description?
    _c '/css/styles.css'
    _s '/js-lib/jquery-1.4.4.min.js'
    _s '/dmv.js'
    coffeescript ->
      console.log 'loaded!'
  body ->
    div id:'maincontainer', ->
      div id:'content', ->  @body
      img src:'/assets/models/Miranda_Kerr13.jpg'