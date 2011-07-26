
###
General utilities and patterns
###


###

service = ( query, cb ) -> ...
receive = ( result ) -> ...

buff = new AsyncCallBuffer service, receive

buff.do_exec 'query 1', ( res ) -> ..
buff.do_exec 'query 2', ( res ) -> ..
buff.do_exec 'query 3', ( res ) -> ..

only query3 will fire

###

class AsyncCallBuffer
  constructor: ( @exec_func, @cb_func ) ->
  do_exec: ( arg ) ->
    @current_arg = arg
    @exec_func arg, ( res ) =>
      if @current_arg is arg
        @cb_func res
        delete @current_arg

###
cumulative = Increasing or increased in quantity, degree, or force by successive additions.

s = new CumulativeSwitch()
// s.is_active = yes
s.activate()
// s.is_active = yes
s.deactivate()
// s.is_active = no
s.activate()
// s.is_active = yes
s.deactivate()
s.deactivate()
// s.is_active = no
s.activate()
// s.is_active = no
s.activate()
// s.is_active = yes

###

class CumulativeSwitch
  constructor: ->
    @$ = $ this
    @counter = 0
  is_active : -> @counter is 0
  activate : ->
    oldcounter = @counter
    @counter--
    @counter = 0 if @counter < 0
    if oldcounter is 1
      @$.trigger 'activate'
      @$.trigger 'change'
  deactivate : ->
    oldcounter = @counter++
    if oldcounter is 0
      @$.trigger 'deactivate'
      @$.trigger 'change'

###
Allows you to buffer changes to a value. It introduces a delay.
Useful to prevent flickrs caused by rapidly changing a value and then reverting.
###
class ValueBuffer
  constructor: ( @delay, @value ) ->
    @delay ?= 300
  set_value : (new_value) ->
    unless @compare @new_value_candidate, new_value
      @new_value_candidate = new_value
      clearTimeout @timeout if @timeout?
      @timeout = setTimeout @_set_value2, @delay
  _set_value2 : =>
    unless @compare @value, @new_value_candidate
      @value = @new_value_candidate
      $(this).trigger 'change'
  compare : (v1, v2) -> v1 is v2

###
A ValueBuffer that tests if two values are equal by using value1.equal( value2 )
###
class EqualsValueBuffer extends ValueBuffer
  constructor: ( delay, value ) -> super delay, value
  compare : (v1, v2) ->
    if v1 is v2
      return yes
    else
      try return v1.equals v2
    no

class Loop
  constructor: ( @values, @delay, @next_handler ) ->
    @i = 0
    @_tick()
    @resume()
  pause : ->
    clearInterval @interval
    delete @interval
  resume : ->
    @interval = setInterval @_tick, @delay unless @interval?
  is_running : -> 
    @interval?
  _tick : =>
    @next_handler @values[@i++]
    @i = 0 if @i >= @values.length

###
de = new DeferredExecutor
de.add foo # not executed
de.add bar # not executed
de.initialize() # causes foo() and bar() to execute
de.add baz # baz() will execute right away
###
class DeferredExecutor
  constructor: ->
    @funcs = []
  add: (func) ->
    if @initialized
      func()
    else
      @funcs.push func
  initialize: ->
    @initialized = yes
    func() for func in @funcs
    delete @funcs

class Square
  constructor: (@top, @left, @side ) ->
    @width = @side
    @height = @side
    @right = @left + @width
    @bottom = @top + @height

class Tuple2
  constructor: (@v1, @v2) ->
  equals : (other) -> eq( @v1, other.v1 ) and eq( @v2, other.v2 )

say_hello = (name) -> "Hello #{name}!"

to = ( delay, func ) -> setTimeout func, delay

eq = ( a, b ) -> (a is b) or (a?.equals? and a.equals(b))

exports.Square = Square
exports.Tuple2 = Tuple2
exports.CumulativeSwitch = CumulativeSwitch
exports.ValueBuffer = ValueBuffer
exports.EqualsValueBuffer = EqualsValueBuffer
exports.AsyncCallBuffer = AsyncCallBuffer
exports.Loop = Loop
exports.DeferredExecutor = DeferredExecutor
exports.say_hello = say_hello
exports.to = to
exports.eq = eq
