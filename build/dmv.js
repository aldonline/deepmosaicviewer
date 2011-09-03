var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}
var __require = require;

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require.resolve = (function () {
    var core = {
        'assert': true,
        'events': true,
        'fs': true,
        'path': true,
        'vm': true
    };
    
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    Object.keys(require.modules)
        .forEach(function (x) {
            if (x.slice(0, basedir.length + 1) === basedir + '/') {
                var f = x.slice(basedir.length);
                require.modules[to + f] = require.modules[basedir + f];
            }
            else if (x === basedir) {
                require.modules[to] = require.modules[basedir];
            }
        })
    ;
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = function (fn) {
    setTimeout(fn, 0);
};

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.modules["path"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "path";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["path"]._cached = module.exports;
    
    (function () {
        // resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(resolvedPath.split('/').filter(function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(path.split('/').filter(function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(paths.filter(function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};
;
    }).call(module.exports);
    
    __require.modules["path"]._cached = module.exports;
    return module.exports;
};

require.modules["/dmv.coffee"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/";
    var __filename = "/dmv.coffee";
    
    var require = function (file) {
        return __require(file, "/");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/");
    };
    
    require.modules = __require.modules;
    __require.modules["/dmv.coffee"]._cached = module.exports;
    
    (function () {
        (function() {
  var core, mock, mosaic_source;
  core = require('./core');
  mock = require('./data/mock');
  mosaic_source = require('./data/mosaic_source');
  exports.MosaicContainer = core.MosaicContainer;
  exports.mock_source = mock.source;
  exports.create_mosaic_source = mosaic_source.create;
}).call(this);
;
    }).call(module.exports);
    
    __require.modules["/dmv.coffee"]._cached = module.exports;
    return module.exports;
};

require.modules["/core.coffee"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/";
    var __filename = "/core.coffee";
    
    var require = function (file) {
        return __require(file, "/");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/");
    };
    
    require.modules = __require.modules;
    __require.modules["/core.coffee"]._cached = module.exports;
    
    (function () {
        (function() {
  var CellHover, DEBUG, FOUND, Mosaic, MosaicContainer, NOT_FOUND, PENDING, SEARCHING, cell_service_module, sd, sdutil, util;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  sd = Seadragon;
  util = require('./util/util');
  sdutil = require('./util/seadragon_util');
  cell_service_module = require('./cell_service');
  SEARCHING = '#ff0';
  FOUND = '#0f0';
  NOT_FOUND = '#f00';
  PENDING = {};
  DEBUG = false;
  MosaicContainer = (function() {
    MosaicContainer.current_cell = null;
    function MosaicContainer(container_id) {
      this.container_id = container_id;
      this.container = $('#' + this.container_id);
      this.viewer = new sd.Viewer(this.container_id);
      this.highlighter = new sdutil.Highlighter(this.viewer);
    }
    MosaicContainer.prototype.set = function(source) {
      var cm;
      if ((cm = this.current_mosaic) != null) {
        $(cm).unbind('change');
        cm.destroy();
      }
      cm = this.current_mosaic = new Mosaic(this, source);
      $(cm).bind('change', __bind(function() {
        this.current_cell = cm.current_cell;
        return $(this).trigger('change');
      }, this));
      return cm.setup();
    };
    MosaicContainer.prototype.go_to = function(id) {
      var _ref;
      return (_ref = this.current_mosaic) != null ? _ref.go_to(id) : void 0;
    };
    return MosaicContainer;
  })();
  Mosaic = (function() {
    function Mosaic(mosaic_container, source) {
      this.mosaic_container = mosaic_container;
      this.source = source;
    }
    Mosaic.prototype.setup = function() {
      var cs, highlighter, viewer;
      this.cs = cs = new cell_service_module.CellService(this.source);
      viewer = this.mosaic_container.viewer;
      highlighter = this.mosaic_container.highlighter;
      this.current_cell = null;
      this.open_handler = __bind(function() {
        var bucket_manager, current_hover;
        this.bm = bucket_manager = new sdutil.BufferedGridManager(viewer, 50, 100);
        current_hover = null;
        return $(bucket_manager).bind('change', __bind(function(event) {
          var bucket;
          bucket = bucket_manager.cell;
          if (this.current_cell != null) {
            if ((bucket != null) && this.current_cell.contains_bucket(bucket.x, bucket.y)) {
              return;
            } else {
              this.current_cell = null;
              highlighter.draw(null);
              $(this).trigger('change');
            }
          }
          if (current_hover != null) {
            current_hover.cancel();
            $(current_hover).unbind('change');
          }
          if (bucket != null) {
            current_hover = new CellHover(bucket, cs, bucket_manager.mapper, highlighter);
            $(current_hover).bind('change', __bind(function() {
              if (this.current_cell !== current_hover.cell) {
                this.current_cell = current_hover.cell;
                return $(this).trigger('change');
              }
            }, this));
            return current_hover.start();
          }
        }, this));
      }, this);
      viewer.addEventListener('open', this.open_handler);
      return viewer.openDzi(this.source.dzi_url, this.source.dzi_str);
    };
    Mosaic.prototype.go_to = function(id) {
      return this.cs.by_id(id, __bind(function(cell) {
        var handler, mapper, margin, mc, rect, _ref, _ref2;
        if (cell != null) {
          mapper = this.bm.mapper;
          rect = cell.get_rect(mapper);
          margin = rect.width;
          rect.x = rect.x - margin;
          rect.y = rect.y - margin;
          rect.width = rect.width + margin * 2;
          rect.height = rect.height + margin * 2;
          mc = this.mosaic_container;
          handler = function() {
            var _ref;
            if (mc != null) {
              mc.viewer.removeEventListener('animationfinish', handler);
            }
            return mc != null ? (_ref = mc.highlighter) != null ? _ref.draw(cell.get_rect(mapper), FOUND) : void 0 : void 0;
          };
          if (mc != null) {
            mc.viewer.addEventListener('animationfinish', handler);
          }
          return (_ref = this.mosaic_container) != null ? (_ref2 = _ref.viewer.viewport) != null ? _ref2.fitBounds(rect) : void 0 : void 0;
        } else {
          return false;
        }
      }, this));
    };
    Mosaic.prototype.destroy = function() {
      return this.mosaic_container.viewer.removeEventListener('open', this.open_handler);
    };
    return Mosaic;
  })();
  CellHover = (function() {
    function CellHover(bucket, cell_service, mapper, highlighter) {
      this.bucket = bucket;
      this.cell_service = cell_service;
      this.mapper = mapper;
      this.highlighter = highlighter;
      this.cell = null;
    }
    CellHover.prototype.start = function() {
      var answered, rect;
      if (this.bucket != null) {
        rect = this.mapper.cell2rect(this.bucket);
        answered = false;
        this.cell_service.get_cell(this.bucket.x, this.bucket.y, __bind(function(c) {
          if (this._canceled) {
            return;
          }
          answered = true;
          if (c != null) {
            this.highlighter.draw(c.get_rect(this.mapper), FOUND);
          } else {
            this.highlighter.draw(rect, NOT_FOUND);
          }
          this.cell = c;
          return $(this).trigger('change');
        }, this));
        if (!answered) {
          return this.highlighter.draw(rect, SEARCHING);
        }
      } else {
        return this.highlighter.draw(null);
      }
    };
    CellHover.prototype.cancel = function() {
      return this._canceled = true;
    };
    return CellHover;
  })();
  exports.MosaicContainer = MosaicContainer;
}).call(this);
;
    }).call(module.exports);
    
    __require.modules["/core.coffee"]._cached = module.exports;
    return module.exports;
};

require.modules["/util/util.coffee"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/util";
    var __filename = "/util/util.coffee";
    
    var require = function (file) {
        return __require(file, "/util");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/util");
    };
    
    require.modules = __require.modules;
    __require.modules["/util/util.coffee"]._cached = module.exports;
    
    (function () {
        (function() {
  /*
  General utilities and patterns
  */
  /*
  
  service = ( query, cb ) -> ...
  receive = ( result ) -> ...
  
  buff = new AsyncCallBuffer service, receive
  
  buff.do_exec 'query 1', ( res ) -> ..
  buff.do_exec 'query 2', ( res ) -> ..
  buff.do_exec 'query 3', ( res ) -> ..
  
  only query3 will fire
  
  */  var AsyncCallBuffer, CumulativeSwitch, DeferredExecutor, EqualsValueBuffer, Loop, Square, Tuple2, ValueBuffer, eq, say_hello, to;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  AsyncCallBuffer = (function() {
    function AsyncCallBuffer(exec_func, cb_func) {
      this.exec_func = exec_func;
      this.cb_func = cb_func;
    }
    AsyncCallBuffer.prototype.do_exec = function(arg) {
      this.current_arg = arg;
      return this.exec_func(arg, __bind(function(res) {
        if (this.current_arg === arg) {
          this.cb_func(res);
          return delete this.current_arg;
        }
      }, this));
    };
    return AsyncCallBuffer;
  })();
  /*
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
  
  */
  CumulativeSwitch = (function() {
    function CumulativeSwitch() {
      this.$ = $(this);
      this.counter = 0;
    }
    CumulativeSwitch.prototype.is_active = function() {
      return this.counter === 0;
    };
    CumulativeSwitch.prototype.activate = function() {
      var oldcounter;
      oldcounter = this.counter;
      this.counter--;
      if (this.counter < 0) {
        this.counter = 0;
      }
      if (oldcounter === 1) {
        this.$.trigger('activate');
        return this.$.trigger('change');
      }
    };
    CumulativeSwitch.prototype.deactivate = function() {
      var oldcounter;
      oldcounter = this.counter++;
      if (oldcounter === 0) {
        this.$.trigger('deactivate');
        return this.$.trigger('change');
      }
    };
    return CumulativeSwitch;
  })();
  /*
  Allows you to buffer changes to a value. It introduces a delay.
  Useful to prevent flickrs caused by rapidly changing a value and then reverting.
  */
  ValueBuffer = (function() {
    function ValueBuffer(delay, value) {
      var _ref;
      this.delay = delay;
      this.value = value;
      this._set_value2 = __bind(this._set_value2, this);
            if ((_ref = this.delay) != null) {
        _ref;
      } else {
        this.delay = 300;
      };
    }
    ValueBuffer.prototype.set_value = function(new_value) {
      if (!this.compare(this.new_value_candidate, new_value)) {
        this.new_value_candidate = new_value;
        if (this.timeout != null) {
          clearTimeout(this.timeout);
        }
        return this.timeout = setTimeout(this._set_value2, this.delay);
      }
    };
    ValueBuffer.prototype._set_value2 = function() {
      if (!this.compare(this.value, this.new_value_candidate)) {
        this.value = this.new_value_candidate;
        return $(this).trigger('change');
      }
    };
    ValueBuffer.prototype.compare = function(v1, v2) {
      return v1 === v2;
    };
    return ValueBuffer;
  })();
  /*
  A ValueBuffer that tests if two values are equal by using value1.equal( value2 )
  */
  EqualsValueBuffer = (function() {
    __extends(EqualsValueBuffer, ValueBuffer);
    function EqualsValueBuffer(delay, value) {
      EqualsValueBuffer.__super__.constructor.call(this, delay, value);
    }
    EqualsValueBuffer.prototype.compare = function(v1, v2) {
      if (v1 === v2) {
        return true;
      } else {
        try {
          return v1.equals(v2);
        } catch (_e) {}
      }
      return false;
    };
    return EqualsValueBuffer;
  })();
  Loop = (function() {
    function Loop(values, delay, next_handler) {
      this.values = values;
      this.delay = delay;
      this.next_handler = next_handler;
      this._tick = __bind(this._tick, this);
      this.i = 0;
      this._tick();
      this.resume();
    }
    Loop.prototype.pause = function() {
      clearInterval(this.interval);
      return delete this.interval;
    };
    Loop.prototype.resume = function() {
      if (this.interval == null) {
        return this.interval = setInterval(this._tick, this.delay);
      }
    };
    Loop.prototype.is_running = function() {
      return this.interval != null;
    };
    Loop.prototype._tick = function() {
      this.next_handler(this.values[this.i++]);
      if (this.i >= this.values.length) {
        return this.i = 0;
      }
    };
    return Loop;
  })();
  /*
  de = new DeferredExecutor
  de.add foo # not executed
  de.add bar # not executed
  de.initialize() # causes foo() and bar() to execute
  de.add baz # baz() will execute right away
  */
  DeferredExecutor = (function() {
    function DeferredExecutor() {
      this.funcs = [];
    }
    DeferredExecutor.prototype.add = function(func) {
      if (this.initialized) {
        return func();
      } else {
        return this.funcs.push(func);
      }
    };
    DeferredExecutor.prototype.initialize = function() {
      var func, _i, _len, _ref;
      this.initialized = true;
      _ref = this.funcs;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        func = _ref[_i];
        func();
      }
      return delete this.funcs;
    };
    return DeferredExecutor;
  })();
  Square = (function() {
    function Square(top, left, side) {
      this.top = top;
      this.left = left;
      this.side = side;
      this.width = this.side;
      this.height = this.side;
      this.right = this.left + this.width;
      this.bottom = this.top + this.height;
    }
    return Square;
  })();
  Tuple2 = (function() {
    function Tuple2(v1, v2) {
      this.v1 = v1;
      this.v2 = v2;
    }
    Tuple2.prototype.equals = function(other) {
      return eq(this.v1, other.v1) && eq(this.v2, other.v2);
    };
    return Tuple2;
  })();
  say_hello = function(name) {
    return "Hello " + name + "!";
  };
  to = function(delay, func) {
    return setTimeout(func, delay);
  };
  eq = function(a, b) {
    return (a === b) || (((a != null ? a.equals : void 0) != null) && a.equals(b));
  };
  exports.Square = Square;
  exports.Tuple2 = Tuple2;
  exports.CumulativeSwitch = CumulativeSwitch;
  exports.ValueBuffer = ValueBuffer;
  exports.EqualsValueBuffer = EqualsValueBuffer;
  exports.AsyncCallBuffer = AsyncCallBuffer;
  exports.Loop = Loop;
  exports.DeferredExecutor = DeferredExecutor;
  exports.say_hello = say_hello;
  exports.to = to;
  exports.eq = eq;
}).call(this);
;
    }).call(module.exports);
    
    __require.modules["/util/util.coffee"]._cached = module.exports;
    return module.exports;
};

require.modules["/util/seadragon_util.coffee"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/util";
    var __filename = "/util/seadragon_util.coffee";
    
    var require = function (file) {
        return __require(file, "/util");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/util");
    };
    
    require.modules = __require.modules;
    __require.modules["/util/seadragon_util.coffee"]._cached = module.exports;
    
    (function () {
        (function() {
  var BasicGridMapper, BufferedGridManager, GridManager, Highlighter, LimitedGridMapper, ensure_sdmousemove_event, point_is_visible, sd, util;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  util = require('./util');
  /*
  Utilities to enhance the Seadragon API
  http://expression.microsoft.com/en-us/gg413351.aspx
  */
  sd = Seadragon;
  ensure_sdmousemove_event = function(viewer) {
    if (!viewer.___sdmousemove) {
      return $(viewer.elmt).mousemove(function(event) {
        var pixels, point;
        viewer.___sdmousemove = true;
        pixels = sd.Utils.getMousePosition(event).minus(sd.Utils.getElementPosition(viewer.elmt));
        point = viewer.viewport.pointFromPixel(pixels);
        event = new $.Event('sdmousemove');
        event.point = point;
        return $(viewer).trigger(event);
      });
    }
  };
  BasicGridMapper = (function() {
    function BasicGridMapper(xcells) {
      this.xcells = xcells;
      this.cell_size = 1 / this.xcells;
    }
    BasicGridMapper.prototype.cell2point = function(cell) {
      return new sd.Point(cell.x * this.cell_size, cell.y * this.cell_size);
    };
    BasicGridMapper.prototype.cell2rect = function(cell) {
      return new sd.Rect(cell.x * this.cell_size, cell.y * this.cell_size, this.cell_size, this.cell_size);
    };
    BasicGridMapper.prototype.point2cell = function(point) {
      return new sd.Point(Math.floor(point.x / this.cell_size), Math.floor(point.y / this.cell_size));
    };
    return BasicGridMapper;
  })();
  LimitedGridMapper = (function() {
    __extends(LimitedGridMapper, BasicGridMapper);
    function LimitedGridMapper(xcells, ycells) {
      this.xcells = xcells;
      this.ycells = ycells;
      LimitedGridMapper.__super__.constructor.call(this, this.xcells);
    }
    LimitedGridMapper.prototype.cell2point = function(cell) {
      var p;
      p = LimitedGridMapper.__super__.cell2point.call(this, cell);
      p.inside = this.test_cell(cell);
      return p;
    };
    LimitedGridMapper.prototype.cell2rect = function(cell) {
      var r;
      r = LimitedGridMapper.__super__.cell2rect.call(this, cell);
      r.inside = this.test_cell(cell);
      return r;
    };
    LimitedGridMapper.prototype.point2cell = function(point) {
      var c;
      c = LimitedGridMapper.__super__.point2cell.call(this, point);
      c.inside = this.test_cell(c);
      return c;
    };
    LimitedGridMapper.prototype.test_cell = function(cell) {
      var _ref, _ref2;
      return ((0 <= (_ref = cell.x) && _ref < this.xcells)) && ((0 <= (_ref2 = cell.y) && _ref2 < this.ycells));
    };
    return LimitedGridMapper;
  })();
  point_is_visible = function(viewport, point) {
    var vb, xmax, xmin, ymax, ymin, _ref, _ref2;
    vb = viewport.getBounds(true);
    xmin = vb.x;
    xmax = vb.width + vb.x;
    ymin = vb.y;
    ymax = vb.height + vb.y;
    return ((xmin < (_ref = point.x) && _ref < xmax)) && ((ymin < (_ref2 = point.y) && _ref2 < ymax));
  };
  GridManager = (function() {
    function GridManager(viewer, cell_size) {
      var s, xcells, ycells;
      this.viewer = viewer;
      this.cell_size = cell_size;
      s = this.viewer.source;
      xcells = Math.floor(s.width / this.cell_size);
      ycells = Math.floor(s.height / this.cell_size);
      this.mapper = new LimitedGridMapper(xcells, ycells);
      ensure_sdmousemove_event(this.viewer);
      this.cell = null;
      $(this.viewer).bind('sdmousemove', __bind(function(event) {
        var event2, new_cell, _ref;
        new_cell = this.mapper.point2cell(event.point);
        if (new_cell.inside === false) {
          new_cell = null;
        }
        if (!(this.cell === new_cell || ((_ref = this.cell) != null ? _ref.equals(new_cell) : void 0))) {
          this.cell = new_cell;
          event2 = new $.Event('change');
          event2.cell = new_cell;
          return $(this).trigger(event2);
        }
      }, this));
    }
    return GridManager;
  })();
  BufferedGridManager = (function() {
    function BufferedGridManager(viewer, cell_size, delay) {
      this.viewer = viewer;
      this.cell_size = cell_size;
      this.gm = new GridManager(this.viewer, this.cell_size);
      this.vb = new util.EqualsValueBuffer(delay);
      this.mapper = this.gm.mapper;
      $(this.gm).bind('change', __bind(function(evt) {
        return this.vb.set_value(evt.cell);
      }, this));
      $(this.vb).bind('change', __bind(function() {
        var event2;
        event2 = new $.Event('change');
        this.cell = event2.cell = this.vb.value;
        return $(this).trigger(event2);
      }, this));
    }
    return BufferedGridManager;
  })();
  Highlighter = (function() {
    function Highlighter(viewer) {
      this.viewer = viewer;
      this.hl_elm = $('<div>');
    }
    Highlighter.prototype.draw = function(rect, color) {
      var drawer, elm;
            if (color != null) {
        color;
      } else {
        color = '#ff0';
      };
      this.hl_elm.css({
        background: color
      });
      elm = this.hl_elm[0];
      drawer = this.viewer.drawer;
      if (rect != null) {
        if (this.last_rect != null) {
          if (!this.last_rect.equals(rect)) {
            drawer.updateOverlay(elm, rect);
          }
        } else {
          drawer.addOverlay(elm, rect);
        }
        this.hl_elm.css({
          opacity: 0
        });
        this.hl_elm.animate({
          opacity: .4
        }, 300);
      } else {
        if (this.last_rect != null) {
          drawer.removeOverlay(elm);
        }
      }
      return this.last_rect = rect;
    };
    return Highlighter;
  })();
  exports.point_is_visible = point_is_visible;
  exports.GridManager = GridManager;
  exports.BufferedGridManager = BufferedGridManager;
  exports.Highlighter = Highlighter;
}).call(this);
;
    }).call(module.exports);
    
    __require.modules["/util/seadragon_util.coffee"]._cached = module.exports;
    return module.exports;
};

require.modules["/cell_service.coffee"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/";
    var __filename = "/cell_service.coffee";
    
    var require = function (file) {
        return __require(file, "/");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/");
    };
    
    require.modules = __require.modules;
    __require.modules["/cell_service.coffee"]._cached = module.exports;
    
    (function () {
        (function() {
  var Cell, CellQuery, CellService, sd;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  sd = Seadragon;
  /*
  The service layer operates atop the source
  */
  Cell = (function() {
    function Cell(x, y, buckets, id) {
      this.x = x;
      this.y = y;
      this.buckets = buckets;
      this.id = id;
      this.side = Math.sqrt(this.buckets);
    }
    Cell.prototype.contains_bucket = function(x, y) {
      return ((this.x <= x && x < this.x + this.side)) && ((this.y <= y && y < this.y + this.side));
    };
    Cell.prototype.get_rect = function(mapper) {
      var br, tl;
      tl = mapper.cell2point(new sd.Point(this.x, this.y));
      br = mapper.cell2point(new sd.Point(this.x + this.side, this.y + this.side));
      return new sd.Rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    };
    Cell.prototype.equals = function(other) {
      try {
        return other.x === this.x && other.y === this.y;
      } catch (_e) {}
      return false;
    };
    return Cell;
  })();
  CellQuery = (function() {
    function CellQuery(cell_service, x, y, cb) {
      cell_service.get_cell(x, y, __bind(function(res) {
        if (!this.canceled) {
          return cb(res);
        }
      }, this));
    }
    CellQuery.prototype.cancel = function() {
      return this.canceled = true;
    };
    return CellQuery;
  })();
  CellService = (function() {
    function CellService(source) {
      this.source = source;
      this.cells = [];
      this.cache = {};
    }
    CellService.prototype.by_id = function(id, cb) {
      return this.source.by_id(id, function(res) {
        return cb(new Cell(res.x, res.y, res.size, res.id));
      });
    };
    CellService.prototype.get_cell = function(x, y, cb) {
      var key;
      key = x + '_' + y;
      if (this.cache[key] !== void 0) {
        return cb(this.cache[key]);
      } else {
        return this._get_cell(x, y, __bind(function(cell) {
          return cb(this.cache[key] = cell);
        }, this));
      }
    };
    CellService.prototype._get_cell = function(x, y, cb) {
      var cell, _i, _len, _ref;
      _ref = this.cells;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cell = _ref[_i];
        if (cell.contains_bucket(x, y)) {
          return cb(cell);
        }
      }
      return this.source.by_coords(x, y, __bind(function(res) {
        var c;
        if (res === null) {
          return cb(null);
        } else {
          this.cells.push(c = new Cell(res.x, res.y, res.size, res.id));
          return cb(c);
        }
      }, this));
    };
    return CellService;
  })();
  exports.CellService = CellService;
  exports.CellQuery = CellQuery;
}).call(this);
;
    }).call(module.exports);
    
    __require.modules["/cell_service.coffee"]._cached = module.exports;
    return module.exports;
};

require.modules["/data/mock.coffee"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/data";
    var __filename = "/data/mock.coffee";
    
    var require = function (file) {
        return __require(file, "/data");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/data");
    };
    
    require.modules = __require.modules;
    __require.modules["/data/mock.coffee"]._cached = module.exports;
    
    (function () {
        (function() {
  var DELAY, MockSource, Source, data, delay, get_cell, get_cells, get_id, get_ids, item, line, matrix;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Source = require('./source').Source;
  DELAY = 300;
  data = "00 00 01 02 xx\n00 00 xx 03 xx\nxx xx xx xx 04";
  matrix = (function() {
    var _i, _len, _ref, _results;
    _ref = data.split('\n');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      _results.push((function() {
        var _j, _len2, _ref2, _results2;
        _ref2 = line.split(' ');
        _results2 = [];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          item = _ref2[_j];
          _results2.push(Number(item));
        }
        return _results2;
      })());
    }
    return _results;
  })();
  get_cell = function(id) {
    var row, size, x, y, _ref, _ref2;
    for (y = 0, _ref = matrix.length; 0 <= _ref ? y < _ref : y > _ref; 0 <= _ref ? y++ : y--) {
      row = matrix[y];
      for (x = 0, _ref2 = row.length; 0 <= _ref2 ? x < _ref2 : x > _ref2; 0 <= _ref2 ? x++ : x--) {
        item = row[x];
        if (item === id) {
          size = 1;
          while (row[x + size] === id) {
            size++;
          }
          return {
            x: x,
            y: y,
            size: size * size,
            id: id
          };
        }
      }
    }
    return null;
  };
  get_cells = function(ids) {
    var id, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      _results.push(get_cell(id));
    }
    return _results;
  };
  get_id = function(x, y) {
    try {
      return matrix[y][x];
    } catch (_e) {}
    return null;
  };
  get_ids = function(x, y, w, h, cb) {
    var ids, _i, _j, _ref, _ref2;
    ids = [];
    for (_i = x, _ref = x + w; x <= _ref ? _i < _ref : _i > _ref; x <= _ref ? _i++ : _i--) {
      for (_j = y, _ref2 = y + h; y <= _ref2 ? _j < _ref2 : _j > _ref2; y <= _ref2 ? _j++ : _j--) {
        ids.push(matrix[y][x]);
      }
    }
    return ids;
  };
  delay = function(cb) {
    return setTimeout(cb, DELAY);
  };
  MockSource = (function() {
    __extends(MockSource, Source);
    function MockSource() {
      MockSource.__super__.constructor.apply(this, arguments);
    }
    MockSource.prototype.dzi_url = 'http://conobox.com/TSO/flags/latest/cl.xml';
    MockSource.prototype.dzi_str = '<Image xmlns="http://schemas.microsoft.com/deepzoom/2008" TileSize="254" Overlap="1" Format="jpg"><Size Width="7500" Height="5000"/></Image>';
    MockSource.prototype.by_id = function(id, cb) {
      return delay(function() {
        return cb(get_cell(id));
      });
    };
    MockSource.prototype.by_ids = function(ids, cb) {
      return delay(function() {
        return cb(get_cells(ids));
      });
    };
    MockSource.prototype.by_coords = function(x, y, cb) {
      return delay(function() {
        var id;
        id = get_id(x, y);
        if (id === null) {
          return cb(null);
        } else {
          return cb(get_cell(id));
        }
      });
    };
    MockSource.prototype.by_rect = function(x, y, w, h, cb) {
      return delay(function() {
        var ids;
        ids = get_ids(x, y, w, h);
        return cb(get_cells(ids));
      });
    };
    return MockSource;
  })();
  exports.source = new MockSource;
}).call(this);
;
    }).call(module.exports);
    
    __require.modules["/data/mock.coffee"]._cached = module.exports;
    return module.exports;
};

require.modules["/data/source.coffee"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/data";
    var __filename = "/data/source.coffee";
    
    var require = function (file) {
        return __require(file, "/data");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/data");
    };
    
    require.modules = __require.modules;
    __require.modules["/data/source.coffee"]._cached = module.exports;
    
    (function () {
        (function() {
  /*
  Abstract base class for data sources.
  For a working example, see ./mock
  */  var Source;
  Source = (function() {
    function Source() {}
    Source.prototype.dzi_url = null;
    Source.prototype.dzi_str = null;
    Source.prototype.by_id = function(id, cb) {};
    Source.prototype.by_ids = function(ids, cb) {};
    Source.prototype.by_coords = function(x, y, cb) {};
    Source.prototype.by_rect = function(x, y, w, h, cb) {};
    return Source;
  })();
  exports.Source = Source;
}).call(this);
;
    }).call(module.exports);
    
    __require.modules["/data/source.coffee"]._cached = module.exports;
    return module.exports;
};

require.modules["/data/mosaic_source.coffee"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/data";
    var __filename = "/data/mosaic_source.coffee";
    
    var require = function (file) {
        return __require(file, "/data");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/data");
    };
    
    require.modules = __require.modules;
    __require.modules["/data/mosaic_source.coffee"]._cached = module.exports;
    
    (function () {
        (function() {
  var DEBUG, MosaicSource, Source, cbs, create, dbg, massage, rpc, serial;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Source = require('./source').Source;
  DEBUG = false;
  massage = function(objs) {
    var obj, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = objs.length; _i < _len; _i++) {
      obj = objs[_i];
      obj.size = obj.cells;
      obj.id = obj.image;
      delete obj.cells;
      delete obj.image;
      _results.push(delete obj.side);
    }
    return _results;
  };
  MosaicSource = (function() {
    __extends(MosaicSource, Source);
    function MosaicSource(dzi_url, dzi_str, endpoint, mosaic_id, version) {
      this.dzi_url = dzi_url;
      this.dzi_str = dzi_str;
      this.endpoint = endpoint;
      this.mosaic_id = mosaic_id;
      this.version = version;
      if (this.mosaic_id == null) {
        throw new Error('mosaic_id cannot be null or undefined');
      }
      if (this.dzi_url == null) {
        throw new Error('dzi_url cannot be null or undefined');
      }
      if (this.version == null) {
        throw new Error('(mosaic) version cannot be null or undefined');
      }
      this.dzi_str = '<Image xmlns="http://schemas.microsoft.com/deepzoom/2008" TileSize="254" Overlap="1" Format="jpg"><Size Width="7500" Height="5000"/></Image>';
    }
    MosaicSource.prototype.by_id = function(id, cb) {
      return this._('find_by_image', [this.mosaic_id, this.version, id], function(err, res) {
        var r;
        res = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = res.length; _i < _len; _i++) {
            r = res[_i];
            if (res.id === this.mosaic_id && res.version === this.version) {
              _results.push(r);
            }
          }
          return _results;
        }).call(this);
        massage(res);
        if (res.length === 0) {
          return cb(null);
        } else {
          return cb(res[0]);
        }
      });
    };
    MosaicSource.prototype.by_ids = function(ids, cb) {
      throw new Error('tried to call unimplemented method on mosaic source ( by_ids )');
    };
    MosaicSource.prototype.by_coords = function(x, y, cb) {
      return this._('find_by_coord', [this.mosaic_id, this.version, x, y], function(err, res) {
        if (res.length === 0) {
          return cb(null);
        } else {
          massage(res);
          return cb(res[0]);
        }
      });
    };
    MosaicSource.prototype.by_rect = function(x, y, w, h, cb) {
      return this._('find_by_rect', [this.mosaic_id, this.version, x, y, w, h], function(err, res) {
        massage(res);
        return cb(res);
      });
    };
    MosaicSource.prototype._ = function(method, params, cb) {
      return rpc(this.endpoint, method, params, cb);
    };
    return MosaicSource;
  })();
  /* 
  curl --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "load_test_data", "params": [] }' -H 'content-type: text/plain;' http://localhost:3000/api
  curl --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "get_mosaic_info", "params": ["cl"] }' -H 'content-type: text/plain;' http://localhost:3000/api
  */
  dbg = function(msg) {
    if (DEBUG) {
      try {
        return console.log(msg);
      } catch (_e) {}
    }
  };
  serial = 0;
  cbs = {};
  rpc = function(endpoint, method, params, cb) {
    var data, handle_res, id;
    dbg([endpoint, method, params]);
    id = serial++;
    cbs[id] = cb;
    data = JSON.stringify({
      method: method,
      params: params,
      id: id,
      jsonrpc: '1.0'
    });
    handle_res = function(res) {
      dbg(['result:', res]);
      if (res.error != null) {
        throw new Error('JSONRPC Error: ' + res.error);
      }
      cbs[id](res.error, res.result);
      return delete cbs[id];
    };
    return jQuery.post(endpoint, data, handle_res, 'json');
  };
  create = function(endpoint, id, version, cb) {
    if (endpoint == null) {
      throw new Error('endpoint cannot be null or undefined');
    }
    if (id == null) {
      throw new Error('id cannot be null or undefined');
    }
    return rpc(endpoint, 'get_mosaic_info', [id], function(err, res) {
      var source, v, _i, _len, _ref, _v;
      if (version != null) {
        v = null;
        _ref = res.versions;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          _v = _ref[_i];
          if (v.version === version) {
            v = _v;
            break;
          }
        }
      } else {
        if (res.versions.length !== 0) {
          v = res.versions.pop();
        }
      }
      if (v === null) {
        return cb('requested mosaic version not found', null);
      } else {
        source = new MosaicSource(v.url, null, endpoint, id, v.version);
        return cb(null, source);
      }
    });
  };
  exports.create = create;
}).call(this);
;
    }).call(module.exports);
    
    __require.modules["/data/mosaic_source.coffee"]._cached = module.exports;
    return module.exports;
};
