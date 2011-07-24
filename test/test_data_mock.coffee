assert = require 'assert'

# get_cell
cell = get_cell 0
assert.equal cell.x, 0
assert.equal cell.y, 0
assert.equal cell.size, 4

cell = get_cell 1
assert.equal cell.x, 2
assert.equal cell.y, 0
assert.equal cell.size, 1

cell = get_cell 2
assert.equal cell.x, 3
assert.equal cell.y, 0
assert.equal cell.size, 1

cell = get_cell 3
assert.equal cell.x, 3
assert.equal cell.y, 1
assert.equal cell.size, 1

cell = get_cell 4
assert.equal cell.x, 4
assert.equal cell.y, 2
assert.equal cell.size, 1

cell = get_cell 9
assert.equal cell, null

# get_cells
assert.equal get_cells([0, 1]).length, 2

# get_id
assert.equal get_id(0, 0), 0
assert.equal get_id(3, 0), 2
assert.equal get_id(10, 0), null
