#!/usr/bin/env node

// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"clwS":[function(require,module,exports) {
(function(scope){
'use strict';

function F(arity, fun, wrapper) {
  wrapper.a = arity;
  wrapper.f = fun;
  return wrapper;
}

function F2(fun) {
  return F(2, fun, function(a) { return function(b) { return fun(a,b); }; })
}
function F3(fun) {
  return F(3, fun, function(a) {
    return function(b) { return function(c) { return fun(a, b, c); }; };
  });
}
function F4(fun) {
  return F(4, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return fun(a, b, c, d); }; }; };
  });
}
function F5(fun) {
  return F(5, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return fun(a, b, c, d, e); }; }; }; };
  });
}
function F6(fun) {
  return F(6, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return fun(a, b, c, d, e, f); }; }; }; }; };
  });
}
function F7(fun) {
  return F(7, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return fun(a, b, c, d, e, f, g); }; }; }; }; }; };
  });
}
function F8(fun) {
  return F(8, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) {
    return fun(a, b, c, d, e, f, g, h); }; }; }; }; }; }; };
  });
}
function F9(fun) {
  return F(9, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) { return function(i) {
    return fun(a, b, c, d, e, f, g, h, i); }; }; }; }; }; }; }; };
  });
}

function A2(fun, a, b) {
  return fun.a === 2 ? fun.f(a, b) : fun(a)(b);
}
function A3(fun, a, b, c) {
  return fun.a === 3 ? fun.f(a, b, c) : fun(a)(b)(c);
}
function A4(fun, a, b, c, d) {
  return fun.a === 4 ? fun.f(a, b, c, d) : fun(a)(b)(c)(d);
}
function A5(fun, a, b, c, d, e) {
  return fun.a === 5 ? fun.f(a, b, c, d, e) : fun(a)(b)(c)(d)(e);
}
function A6(fun, a, b, c, d, e, f) {
  return fun.a === 6 ? fun.f(a, b, c, d, e, f) : fun(a)(b)(c)(d)(e)(f);
}
function A7(fun, a, b, c, d, e, f, g) {
  return fun.a === 7 ? fun.f(a, b, c, d, e, f, g) : fun(a)(b)(c)(d)(e)(f)(g);
}
function A8(fun, a, b, c, d, e, f, g, h) {
  return fun.a === 8 ? fun.f(a, b, c, d, e, f, g, h) : fun(a)(b)(c)(d)(e)(f)(g)(h);
}
function A9(fun, a, b, c, d, e, f, g, h, i) {
  return fun.a === 9 ? fun.f(a, b, c, d, e, f, g, h, i) : fun(a)(b)(c)(d)(e)(f)(g)(h)(i);
}

console.warn('Compiled in DEV mode. Follow the advice at https://elm-lang.org/0.19.1/optimize for better performance and smaller assets.');


var _JsArray_empty = [];

function _JsArray_singleton(value)
{
    return [value];
}

function _JsArray_length(array)
{
    return array.length;
}

var _JsArray_initialize = F3(function(size, offset, func)
{
    var result = new Array(size);

    for (var i = 0; i < size; i++)
    {
        result[i] = func(offset + i);
    }

    return result;
});

var _JsArray_initializeFromList = F2(function (max, ls)
{
    var result = new Array(max);

    for (var i = 0; i < max && ls.b; i++)
    {
        result[i] = ls.a;
        ls = ls.b;
    }

    result.length = i;
    return _Utils_Tuple2(result, ls);
});

var _JsArray_unsafeGet = F2(function(index, array)
{
    return array[index];
});

var _JsArray_unsafeSet = F3(function(index, value, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[index] = value;
    return result;
});

var _JsArray_push = F2(function(value, array)
{
    var length = array.length;
    var result = new Array(length + 1);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[length] = value;
    return result;
});

var _JsArray_foldl = F3(function(func, acc, array)
{
    var length = array.length;

    for (var i = 0; i < length; i++)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_foldr = F3(function(func, acc, array)
{
    for (var i = array.length - 1; i >= 0; i--)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_map = F2(function(func, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = func(array[i]);
    }

    return result;
});

var _JsArray_indexedMap = F3(function(func, offset, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = A2(func, offset + i, array[i]);
    }

    return result;
});

var _JsArray_slice = F3(function(from, to, array)
{
    return array.slice(from, to);
});

var _JsArray_appendN = F3(function(n, dest, source)
{
    var destLen = dest.length;
    var itemsToCopy = n - destLen;

    if (itemsToCopy > source.length)
    {
        itemsToCopy = source.length;
    }

    var size = destLen + itemsToCopy;
    var result = new Array(size);

    for (var i = 0; i < destLen; i++)
    {
        result[i] = dest[i];
    }

    for (var i = 0; i < itemsToCopy; i++)
    {
        result[i + destLen] = source[i];
    }

    return result;
});



// LOG

var _Debug_log_UNUSED = F2(function(tag, value)
{
	return value;
});

var _Debug_log = F2(function(tag, value)
{
	console.log(tag + ': ' + _Debug_toString(value));
	return value;
});


// TODOS

function _Debug_todo(moduleName, region)
{
	return function(message) {
		_Debug_crash(8, moduleName, region, message);
	};
}

function _Debug_todoCase(moduleName, region, value)
{
	return function(message) {
		_Debug_crash(9, moduleName, region, value, message);
	};
}


// TO STRING

function _Debug_toString_UNUSED(value)
{
	return '<internals>';
}

function _Debug_toString(value)
{
	return _Debug_toAnsiString(false, value);
}

function _Debug_toAnsiString(ansi, value)
{
	if (typeof value === 'function')
	{
		return _Debug_internalColor(ansi, '<function>');
	}

	if (typeof value === 'boolean')
	{
		return _Debug_ctorColor(ansi, value ? 'True' : 'False');
	}

	if (typeof value === 'number')
	{
		return _Debug_numberColor(ansi, value + '');
	}

	if (value instanceof String)
	{
		return _Debug_charColor(ansi, "'" + _Debug_addSlashes(value, true) + "'");
	}

	if (typeof value === 'string')
	{
		return _Debug_stringColor(ansi, '"' + _Debug_addSlashes(value, false) + '"');
	}

	if (typeof value === 'object' && '$' in value)
	{
		var tag = value.$;

		if (typeof tag === 'number')
		{
			return _Debug_internalColor(ansi, '<internals>');
		}

		if (tag[0] === '#')
		{
			var output = [];
			for (var k in value)
			{
				if (k === '$') continue;
				output.push(_Debug_toAnsiString(ansi, value[k]));
			}
			return '(' + output.join(',') + ')';
		}

		if (tag === 'Set_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Set')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Set$toList(value));
		}

		if (tag === 'RBNode_elm_builtin' || tag === 'RBEmpty_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Dict')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Dict$toList(value));
		}

		if (tag === 'Array_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Array')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Array$toList(value));
		}

		if (tag === '::' || tag === '[]')
		{
			var output = '[';

			value.b && (output += _Debug_toAnsiString(ansi, value.a), value = value.b)

			for (; value.b; value = value.b) // WHILE_CONS
			{
				output += ',' + _Debug_toAnsiString(ansi, value.a);
			}
			return output + ']';
		}

		var output = '';
		for (var i in value)
		{
			if (i === '$') continue;
			var str = _Debug_toAnsiString(ansi, value[i]);
			var c0 = str[0];
			var parenless = c0 === '{' || c0 === '(' || c0 === '[' || c0 === '<' || c0 === '"' || str.indexOf(' ') < 0;
			output += ' ' + (parenless ? str : '(' + str + ')');
		}
		return _Debug_ctorColor(ansi, tag) + output;
	}

	if (typeof DataView === 'function' && value instanceof DataView)
	{
		return _Debug_stringColor(ansi, '<' + value.byteLength + ' bytes>');
	}

	if (typeof File !== 'undefined' && value instanceof File)
	{
		return _Debug_internalColor(ansi, '<' + value.name + '>');
	}

	if (typeof value === 'object')
	{
		var output = [];
		for (var key in value)
		{
			var field = key[0] === '_' ? key.slice(1) : key;
			output.push(_Debug_fadeColor(ansi, field) + ' = ' + _Debug_toAnsiString(ansi, value[key]));
		}
		if (output.length === 0)
		{
			return '{}';
		}
		return '{ ' + output.join(', ') + ' }';
	}

	return _Debug_internalColor(ansi, '<internals>');
}

function _Debug_addSlashes(str, isChar)
{
	var s = str
		.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
		.replace(/\r/g, '\\r')
		.replace(/\v/g, '\\v')
		.replace(/\0/g, '\\0');

	if (isChar)
	{
		return s.replace(/\'/g, '\\\'');
	}
	else
	{
		return s.replace(/\"/g, '\\"');
	}
}

function _Debug_ctorColor(ansi, string)
{
	return ansi ? '\x1b[96m' + string + '\x1b[0m' : string;
}

function _Debug_numberColor(ansi, string)
{
	return ansi ? '\x1b[95m' + string + '\x1b[0m' : string;
}

function _Debug_stringColor(ansi, string)
{
	return ansi ? '\x1b[93m' + string + '\x1b[0m' : string;
}

function _Debug_charColor(ansi, string)
{
	return ansi ? '\x1b[92m' + string + '\x1b[0m' : string;
}

function _Debug_fadeColor(ansi, string)
{
	return ansi ? '\x1b[37m' + string + '\x1b[0m' : string;
}

function _Debug_internalColor(ansi, string)
{
	return ansi ? '\x1b[36m' + string + '\x1b[0m' : string;
}

function _Debug_toHexDigit(n)
{
	return String.fromCharCode(n < 10 ? 48 + n : 55 + n);
}


// CRASH


function _Debug_crash_UNUSED(identifier)
{
	throw new Error('https://github.com/elm/core/blob/1.0.0/hints/' + identifier + '.md');
}


function _Debug_crash(identifier, fact1, fact2, fact3, fact4)
{
	switch(identifier)
	{
		case 0:
			throw new Error('What node should I take over? In JavaScript I need something like:\n\n    Elm.Main.init({\n        node: document.getElementById("elm-node")\n    })\n\nYou need to do this with any Browser.sandbox or Browser.element program.');

		case 1:
			throw new Error('Browser.application programs cannot handle URLs like this:\n\n    ' + document.location.href + '\n\nWhat is the root? The root of your file system? Try looking at this program with `elm reactor` or some other server.');

		case 2:
			var jsonErrorString = fact1;
			throw new Error('Problem with the flags given to your Elm program on initialization.\n\n' + jsonErrorString);

		case 3:
			var portName = fact1;
			throw new Error('There can only be one port named `' + portName + '`, but your program has multiple.');

		case 4:
			var portName = fact1;
			var problem = fact2;
			throw new Error('Trying to send an unexpected type of value through port `' + portName + '`:\n' + problem);

		case 5:
			throw new Error('Trying to use `(==)` on functions.\nThere is no way to know if functions are "the same" in the Elm sense.\nRead more about this at https://package.elm-lang.org/packages/elm/core/latest/Basics#== which describes why it is this way and what the better version will look like.');

		case 6:
			var moduleName = fact1;
			throw new Error('Your page is loading multiple Elm scripts with a module named ' + moduleName + '. Maybe a duplicate script is getting loaded accidentally? If not, rename one of them so I know which is which!');

		case 8:
			var moduleName = fact1;
			var region = fact2;
			var message = fact3;
			throw new Error('TODO in module `' + moduleName + '` ' + _Debug_regionToString(region) + '\n\n' + message);

		case 9:
			var moduleName = fact1;
			var region = fact2;
			var value = fact3;
			var message = fact4;
			throw new Error(
				'TODO in module `' + moduleName + '` from the `case` expression '
				+ _Debug_regionToString(region) + '\n\nIt received the following value:\n\n    '
				+ _Debug_toString(value).replace('\n', '\n    ')
				+ '\n\nBut the branch that handles it says:\n\n    ' + message.replace('\n', '\n    ')
			);

		case 10:
			throw new Error('Bug in https://github.com/elm/virtual-dom/issues');

		case 11:
			throw new Error('Cannot perform mod 0. Division by zero error.');
	}
}

function _Debug_regionToString(region)
{
	if (region.start.line === region.end.line)
	{
		return 'on line ' + region.start.line;
	}
	return 'on lines ' + region.start.line + ' through ' + region.end.line;
}



// EQUALITY

function _Utils_eq(x, y)
{
	for (
		var pair, stack = [], isEqual = _Utils_eqHelp(x, y, 0, stack);
		isEqual && (pair = stack.pop());
		isEqual = _Utils_eqHelp(pair.a, pair.b, 0, stack)
		)
	{}

	return isEqual;
}

function _Utils_eqHelp(x, y, depth, stack)
{
	if (x === y)
	{
		return true;
	}

	if (typeof x !== 'object' || x === null || y === null)
	{
		typeof x === 'function' && _Debug_crash(5);
		return false;
	}

	if (depth > 100)
	{
		stack.push(_Utils_Tuple2(x,y));
		return true;
	}

	/**/
	if (x.$ === 'Set_elm_builtin')
	{
		x = $elm$core$Set$toList(x);
		y = $elm$core$Set$toList(y);
	}
	if (x.$ === 'RBNode_elm_builtin' || x.$ === 'RBEmpty_elm_builtin')
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	/**_UNUSED/
	if (x.$ < 0)
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	for (var key in x)
	{
		if (!_Utils_eqHelp(x[key], y[key], depth + 1, stack))
		{
			return false;
		}
	}
	return true;
}

var _Utils_equal = F2(_Utils_eq);
var _Utils_notEqual = F2(function(a, b) { return !_Utils_eq(a,b); });



// COMPARISONS

// Code in Generate/JavaScript.hs, Basics.js, and List.js depends on
// the particular integer values assigned to LT, EQ, and GT.

function _Utils_cmp(x, y, ord)
{
	if (typeof x !== 'object')
	{
		return x === y ? /*EQ*/ 0 : x < y ? /*LT*/ -1 : /*GT*/ 1;
	}

	/**/
	if (x instanceof String)
	{
		var a = x.valueOf();
		var b = y.valueOf();
		return a === b ? 0 : a < b ? -1 : 1;
	}
	//*/

	/**_UNUSED/
	if (typeof x.$ === 'undefined')
	//*/
	/**/
	if (x.$[0] === '#')
	//*/
	{
		return (ord = _Utils_cmp(x.a, y.a))
			? ord
			: (ord = _Utils_cmp(x.b, y.b))
				? ord
				: _Utils_cmp(x.c, y.c);
	}

	// traverse conses until end of a list or a mismatch
	for (; x.b && y.b && !(ord = _Utils_cmp(x.a, y.a)); x = x.b, y = y.b) {} // WHILE_CONSES
	return ord || (x.b ? /*GT*/ 1 : y.b ? /*LT*/ -1 : /*EQ*/ 0);
}

var _Utils_lt = F2(function(a, b) { return _Utils_cmp(a, b) < 0; });
var _Utils_le = F2(function(a, b) { return _Utils_cmp(a, b) < 1; });
var _Utils_gt = F2(function(a, b) { return _Utils_cmp(a, b) > 0; });
var _Utils_ge = F2(function(a, b) { return _Utils_cmp(a, b) >= 0; });

var _Utils_compare = F2(function(x, y)
{
	var n = _Utils_cmp(x, y);
	return n < 0 ? $elm$core$Basics$LT : n ? $elm$core$Basics$GT : $elm$core$Basics$EQ;
});


// COMMON VALUES

var _Utils_Tuple0_UNUSED = 0;
var _Utils_Tuple0 = { $: '#0' };

function _Utils_Tuple2_UNUSED(a, b) { return { a: a, b: b }; }
function _Utils_Tuple2(a, b) { return { $: '#2', a: a, b: b }; }

function _Utils_Tuple3_UNUSED(a, b, c) { return { a: a, b: b, c: c }; }
function _Utils_Tuple3(a, b, c) { return { $: '#3', a: a, b: b, c: c }; }

function _Utils_chr_UNUSED(c) { return c; }
function _Utils_chr(c) { return new String(c); }


// RECORDS

function _Utils_update(oldRecord, updatedFields)
{
	var newRecord = {};

	for (var key in oldRecord)
	{
		newRecord[key] = oldRecord[key];
	}

	for (var key in updatedFields)
	{
		newRecord[key] = updatedFields[key];
	}

	return newRecord;
}


// APPEND

var _Utils_append = F2(_Utils_ap);

function _Utils_ap(xs, ys)
{
	// append Strings
	if (typeof xs === 'string')
	{
		return xs + ys;
	}

	// append Lists
	if (!xs.b)
	{
		return ys;
	}
	var root = _List_Cons(xs.a, ys);
	xs = xs.b
	for (var curr = root; xs.b; xs = xs.b) // WHILE_CONS
	{
		curr = curr.b = _List_Cons(xs.a, ys);
	}
	return root;
}



var _List_Nil_UNUSED = { $: 0 };
var _List_Nil = { $: '[]' };

function _List_Cons_UNUSED(hd, tl) { return { $: 1, a: hd, b: tl }; }
function _List_Cons(hd, tl) { return { $: '::', a: hd, b: tl }; }


var _List_cons = F2(_List_Cons);

function _List_fromArray(arr)
{
	var out = _List_Nil;
	for (var i = arr.length; i--; )
	{
		out = _List_Cons(arr[i], out);
	}
	return out;
}

function _List_toArray(xs)
{
	for (var out = []; xs.b; xs = xs.b) // WHILE_CONS
	{
		out.push(xs.a);
	}
	return out;
}

var _List_map2 = F3(function(f, xs, ys)
{
	for (var arr = []; xs.b && ys.b; xs = xs.b, ys = ys.b) // WHILE_CONSES
	{
		arr.push(A2(f, xs.a, ys.a));
	}
	return _List_fromArray(arr);
});

var _List_map3 = F4(function(f, xs, ys, zs)
{
	for (var arr = []; xs.b && ys.b && zs.b; xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A3(f, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map4 = F5(function(f, ws, xs, ys, zs)
{
	for (var arr = []; ws.b && xs.b && ys.b && zs.b; ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A4(f, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map5 = F6(function(f, vs, ws, xs, ys, zs)
{
	for (var arr = []; vs.b && ws.b && xs.b && ys.b && zs.b; vs = vs.b, ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A5(f, vs.a, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_sortBy = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		return _Utils_cmp(f(a), f(b));
	}));
});

var _List_sortWith = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		var ord = A2(f, a, b);
		return ord === $elm$core$Basics$EQ ? 0 : ord === $elm$core$Basics$LT ? -1 : 1;
	}));
});



// MATH

var _Basics_add = F2(function(a, b) { return a + b; });
var _Basics_sub = F2(function(a, b) { return a - b; });
var _Basics_mul = F2(function(a, b) { return a * b; });
var _Basics_fdiv = F2(function(a, b) { return a / b; });
var _Basics_idiv = F2(function(a, b) { return (a / b) | 0; });
var _Basics_pow = F2(Math.pow);

var _Basics_remainderBy = F2(function(b, a) { return a % b; });

// https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/divmodnote-letter.pdf
var _Basics_modBy = F2(function(modulus, x)
{
	var answer = x % modulus;
	return modulus === 0
		? _Debug_crash(11)
		:
	((answer > 0 && modulus < 0) || (answer < 0 && modulus > 0))
		? answer + modulus
		: answer;
});


// TRIGONOMETRY

var _Basics_pi = Math.PI;
var _Basics_e = Math.E;
var _Basics_cos = Math.cos;
var _Basics_sin = Math.sin;
var _Basics_tan = Math.tan;
var _Basics_acos = Math.acos;
var _Basics_asin = Math.asin;
var _Basics_atan = Math.atan;
var _Basics_atan2 = F2(Math.atan2);


// MORE MATH

function _Basics_toFloat(x) { return x; }
function _Basics_truncate(n) { return n | 0; }
function _Basics_isInfinite(n) { return n === Infinity || n === -Infinity; }

var _Basics_ceiling = Math.ceil;
var _Basics_floor = Math.floor;
var _Basics_round = Math.round;
var _Basics_sqrt = Math.sqrt;
var _Basics_log = Math.log;
var _Basics_isNaN = isNaN;


// BOOLEANS

function _Basics_not(bool) { return !bool; }
var _Basics_and = F2(function(a, b) { return a && b; });
var _Basics_or  = F2(function(a, b) { return a || b; });
var _Basics_xor = F2(function(a, b) { return a !== b; });



var _String_cons = F2(function(chr, str)
{
	return chr + str;
});

function _String_uncons(string)
{
	var word = string.charCodeAt(0);
	return !isNaN(word)
		? $elm$core$Maybe$Just(
			0xD800 <= word && word <= 0xDBFF
				? _Utils_Tuple2(_Utils_chr(string[0] + string[1]), string.slice(2))
				: _Utils_Tuple2(_Utils_chr(string[0]), string.slice(1))
		)
		: $elm$core$Maybe$Nothing;
}

var _String_append = F2(function(a, b)
{
	return a + b;
});

function _String_length(str)
{
	return str.length;
}

var _String_map = F2(function(func, string)
{
	var len = string.length;
	var array = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = string.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			array[i] = func(_Utils_chr(string[i] + string[i+1]));
			i += 2;
			continue;
		}
		array[i] = func(_Utils_chr(string[i]));
		i++;
	}
	return array.join('');
});

var _String_filter = F2(function(isGood, str)
{
	var arr = [];
	var len = str.length;
	var i = 0;
	while (i < len)
	{
		var char = str[i];
		var word = str.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += str[i];
			i++;
		}

		if (isGood(_Utils_chr(char)))
		{
			arr.push(char);
		}
	}
	return arr.join('');
});

function _String_reverse(str)
{
	var len = str.length;
	var arr = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = str.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			arr[len - i] = str[i + 1];
			i++;
			arr[len - i] = str[i - 1];
			i++;
		}
		else
		{
			arr[len - i] = str[i];
			i++;
		}
	}
	return arr.join('');
}

var _String_foldl = F3(function(func, state, string)
{
	var len = string.length;
	var i = 0;
	while (i < len)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += string[i];
			i++;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_foldr = F3(function(func, state, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_split = F2(function(sep, str)
{
	return str.split(sep);
});

var _String_join = F2(function(sep, strs)
{
	return strs.join(sep);
});

var _String_slice = F3(function(start, end, str) {
	return str.slice(start, end);
});

function _String_trim(str)
{
	return str.trim();
}

function _String_trimLeft(str)
{
	return str.replace(/^\s+/, '');
}

function _String_trimRight(str)
{
	return str.replace(/\s+$/, '');
}

function _String_words(str)
{
	return _List_fromArray(str.trim().split(/\s+/g));
}

function _String_lines(str)
{
	return _List_fromArray(str.split(/\r\n|\r|\n/g));
}

function _String_toUpper(str)
{
	return str.toUpperCase();
}

function _String_toLower(str)
{
	return str.toLowerCase();
}

var _String_any = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (isGood(_Utils_chr(char)))
		{
			return true;
		}
	}
	return false;
});

var _String_all = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (!isGood(_Utils_chr(char)))
		{
			return false;
		}
	}
	return true;
});

var _String_contains = F2(function(sub, str)
{
	return str.indexOf(sub) > -1;
});

var _String_startsWith = F2(function(sub, str)
{
	return str.indexOf(sub) === 0;
});

var _String_endsWith = F2(function(sub, str)
{
	return str.length >= sub.length &&
		str.lastIndexOf(sub) === str.length - sub.length;
});

var _String_indexes = F2(function(sub, str)
{
	var subLen = sub.length;

	if (subLen < 1)
	{
		return _List_Nil;
	}

	var i = 0;
	var is = [];

	while ((i = str.indexOf(sub, i)) > -1)
	{
		is.push(i);
		i = i + subLen;
	}

	return _List_fromArray(is);
});


// TO STRING

function _String_fromNumber(number)
{
	return number + '';
}


// INT CONVERSIONS

function _String_toInt(str)
{
	var total = 0;
	var code0 = str.charCodeAt(0);
	var start = code0 == 0x2B /* + */ || code0 == 0x2D /* - */ ? 1 : 0;

	for (var i = start; i < str.length; ++i)
	{
		var code = str.charCodeAt(i);
		if (code < 0x30 || 0x39 < code)
		{
			return $elm$core$Maybe$Nothing;
		}
		total = 10 * total + code - 0x30;
	}

	return i == start
		? $elm$core$Maybe$Nothing
		: $elm$core$Maybe$Just(code0 == 0x2D ? -total : total);
}


// FLOAT CONVERSIONS

function _String_toFloat(s)
{
	// check if it is a hex, octal, or binary number
	if (s.length === 0 || /[\sxbo]/.test(s))
	{
		return $elm$core$Maybe$Nothing;
	}
	var n = +s;
	// faster isNaN check
	return n === n ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
}

function _String_fromList(chars)
{
	return _List_toArray(chars).join('');
}




function _Char_toCode(char)
{
	var code = char.charCodeAt(0);
	if (0xD800 <= code && code <= 0xDBFF)
	{
		return (code - 0xD800) * 0x400 + char.charCodeAt(1) - 0xDC00 + 0x10000
	}
	return code;
}

function _Char_fromCode(code)
{
	return _Utils_chr(
		(code < 0 || 0x10FFFF < code)
			? '\uFFFD'
			:
		(code <= 0xFFFF)
			? String.fromCharCode(code)
			:
		(code -= 0x10000,
			String.fromCharCode(Math.floor(code / 0x400) + 0xD800, code % 0x400 + 0xDC00)
		)
	);
}

function _Char_toUpper(char)
{
	return _Utils_chr(char.toUpperCase());
}

function _Char_toLower(char)
{
	return _Utils_chr(char.toLowerCase());
}

function _Char_toLocaleUpper(char)
{
	return _Utils_chr(char.toLocaleUpperCase());
}

function _Char_toLocaleLower(char)
{
	return _Utils_chr(char.toLocaleLowerCase());
}



/**/
function _Json_errorToString(error)
{
	return $elm$json$Json$Decode$errorToString(error);
}
//*/


// CORE DECODERS

function _Json_succeed(msg)
{
	return {
		$: 0,
		a: msg
	};
}

function _Json_fail(msg)
{
	return {
		$: 1,
		a: msg
	};
}

function _Json_decodePrim(decoder)
{
	return { $: 2, b: decoder };
}

var _Json_decodeInt = _Json_decodePrim(function(value) {
	return (typeof value !== 'number')
		? _Json_expecting('an INT', value)
		:
	(-2147483647 < value && value < 2147483647 && (value | 0) === value)
		? $elm$core$Result$Ok(value)
		:
	(isFinite(value) && !(value % 1))
		? $elm$core$Result$Ok(value)
		: _Json_expecting('an INT', value);
});

var _Json_decodeBool = _Json_decodePrim(function(value) {
	return (typeof value === 'boolean')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a BOOL', value);
});

var _Json_decodeFloat = _Json_decodePrim(function(value) {
	return (typeof value === 'number')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a FLOAT', value);
});

var _Json_decodeValue = _Json_decodePrim(function(value) {
	return $elm$core$Result$Ok(_Json_wrap(value));
});

var _Json_decodeString = _Json_decodePrim(function(value) {
	return (typeof value === 'string')
		? $elm$core$Result$Ok(value)
		: (value instanceof String)
			? $elm$core$Result$Ok(value + '')
			: _Json_expecting('a STRING', value);
});

function _Json_decodeList(decoder) { return { $: 3, b: decoder }; }
function _Json_decodeArray(decoder) { return { $: 4, b: decoder }; }

function _Json_decodeNull(value) { return { $: 5, c: value }; }

var _Json_decodeField = F2(function(field, decoder)
{
	return {
		$: 6,
		d: field,
		b: decoder
	};
});

var _Json_decodeIndex = F2(function(index, decoder)
{
	return {
		$: 7,
		e: index,
		b: decoder
	};
});

function _Json_decodeKeyValuePairs(decoder)
{
	return {
		$: 8,
		b: decoder
	};
}

function _Json_mapMany(f, decoders)
{
	return {
		$: 9,
		f: f,
		g: decoders
	};
}

var _Json_andThen = F2(function(callback, decoder)
{
	return {
		$: 10,
		b: decoder,
		h: callback
	};
});

function _Json_oneOf(decoders)
{
	return {
		$: 11,
		g: decoders
	};
}


// DECODING OBJECTS

var _Json_map1 = F2(function(f, d1)
{
	return _Json_mapMany(f, [d1]);
});

var _Json_map2 = F3(function(f, d1, d2)
{
	return _Json_mapMany(f, [d1, d2]);
});

var _Json_map3 = F4(function(f, d1, d2, d3)
{
	return _Json_mapMany(f, [d1, d2, d3]);
});

var _Json_map4 = F5(function(f, d1, d2, d3, d4)
{
	return _Json_mapMany(f, [d1, d2, d3, d4]);
});

var _Json_map5 = F6(function(f, d1, d2, d3, d4, d5)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5]);
});

var _Json_map6 = F7(function(f, d1, d2, d3, d4, d5, d6)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6]);
});

var _Json_map7 = F8(function(f, d1, d2, d3, d4, d5, d6, d7)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7]);
});

var _Json_map8 = F9(function(f, d1, d2, d3, d4, d5, d6, d7, d8)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7, d8]);
});


// DECODE

var _Json_runOnString = F2(function(decoder, string)
{
	try
	{
		var value = JSON.parse(string);
		return _Json_runHelp(decoder, value);
	}
	catch (e)
	{
		return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'This is not valid JSON! ' + e.message, _Json_wrap(string)));
	}
});

var _Json_run = F2(function(decoder, value)
{
	return _Json_runHelp(decoder, _Json_unwrap(value));
});

function _Json_runHelp(decoder, value)
{
	switch (decoder.$)
	{
		case 2:
			return decoder.b(value);

		case 5:
			return (value === null)
				? $elm$core$Result$Ok(decoder.c)
				: _Json_expecting('null', value);

		case 3:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('a LIST', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _List_fromArray);

		case 4:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _Json_toElmArray);

		case 6:
			var field = decoder.d;
			if (typeof value !== 'object' || value === null || !(field in value))
			{
				return _Json_expecting('an OBJECT with a field named `' + field + '`', value);
			}
			var result = _Json_runHelp(decoder.b, value[field]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, field, result.a));

		case 7:
			var index = decoder.e;
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			if (index >= value.length)
			{
				return _Json_expecting('a LONGER array. Need index ' + index + ' but only see ' + value.length + ' entries', value);
			}
			var result = _Json_runHelp(decoder.b, value[index]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, index, result.a));

		case 8:
			if (typeof value !== 'object' || value === null || _Json_isArray(value))
			{
				return _Json_expecting('an OBJECT', value);
			}

			var keyValuePairs = _List_Nil;
			// TODO test perf of Object.keys and switch when support is good enough
			for (var key in value)
			{
				if (value.hasOwnProperty(key))
				{
					var result = _Json_runHelp(decoder.b, value[key]);
					if (!$elm$core$Result$isOk(result))
					{
						return $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, key, result.a));
					}
					keyValuePairs = _List_Cons(_Utils_Tuple2(key, result.a), keyValuePairs);
				}
			}
			return $elm$core$Result$Ok($elm$core$List$reverse(keyValuePairs));

		case 9:
			var answer = decoder.f;
			var decoders = decoder.g;
			for (var i = 0; i < decoders.length; i++)
			{
				var result = _Json_runHelp(decoders[i], value);
				if (!$elm$core$Result$isOk(result))
				{
					return result;
				}
				answer = answer(result.a);
			}
			return $elm$core$Result$Ok(answer);

		case 10:
			var result = _Json_runHelp(decoder.b, value);
			return (!$elm$core$Result$isOk(result))
				? result
				: _Json_runHelp(decoder.h(result.a), value);

		case 11:
			var errors = _List_Nil;
			for (var temp = decoder.g; temp.b; temp = temp.b) // WHILE_CONS
			{
				var result = _Json_runHelp(temp.a, value);
				if ($elm$core$Result$isOk(result))
				{
					return result;
				}
				errors = _List_Cons(result.a, errors);
			}
			return $elm$core$Result$Err($elm$json$Json$Decode$OneOf($elm$core$List$reverse(errors)));

		case 1:
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, decoder.a, _Json_wrap(value)));

		case 0:
			return $elm$core$Result$Ok(decoder.a);
	}
}

function _Json_runArrayDecoder(decoder, value, toElmValue)
{
	var len = value.length;
	var array = new Array(len);
	for (var i = 0; i < len; i++)
	{
		var result = _Json_runHelp(decoder, value[i]);
		if (!$elm$core$Result$isOk(result))
		{
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, i, result.a));
		}
		array[i] = result.a;
	}
	return $elm$core$Result$Ok(toElmValue(array));
}

function _Json_isArray(value)
{
	return Array.isArray(value) || (typeof FileList !== 'undefined' && value instanceof FileList);
}

function _Json_toElmArray(array)
{
	return A2($elm$core$Array$initialize, array.length, function(i) { return array[i]; });
}

function _Json_expecting(type, value)
{
	return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'Expecting ' + type, _Json_wrap(value)));
}


// EQUALITY

function _Json_equality(x, y)
{
	if (x === y)
	{
		return true;
	}

	if (x.$ !== y.$)
	{
		return false;
	}

	switch (x.$)
	{
		case 0:
		case 1:
			return x.a === y.a;

		case 2:
			return x.b === y.b;

		case 5:
			return x.c === y.c;

		case 3:
		case 4:
		case 8:
			return _Json_equality(x.b, y.b);

		case 6:
			return x.d === y.d && _Json_equality(x.b, y.b);

		case 7:
			return x.e === y.e && _Json_equality(x.b, y.b);

		case 9:
			return x.f === y.f && _Json_listEquality(x.g, y.g);

		case 10:
			return x.h === y.h && _Json_equality(x.b, y.b);

		case 11:
			return _Json_listEquality(x.g, y.g);
	}
}

function _Json_listEquality(aDecoders, bDecoders)
{
	var len = aDecoders.length;
	if (len !== bDecoders.length)
	{
		return false;
	}
	for (var i = 0; i < len; i++)
	{
		if (!_Json_equality(aDecoders[i], bDecoders[i]))
		{
			return false;
		}
	}
	return true;
}


// ENCODE

var _Json_encode = F2(function(indentLevel, value)
{
	return JSON.stringify(_Json_unwrap(value), null, indentLevel) + '';
});

function _Json_wrap(value) { return { $: 0, a: value }; }
function _Json_unwrap(value) { return value.a; }

function _Json_wrap_UNUSED(value) { return value; }
function _Json_unwrap_UNUSED(value) { return value; }

function _Json_emptyArray() { return []; }
function _Json_emptyObject() { return {}; }

var _Json_addField = F3(function(key, value, object)
{
	object[key] = _Json_unwrap(value);
	return object;
});

function _Json_addEntry(func)
{
	return F2(function(entry, array)
	{
		array.push(_Json_unwrap(func(entry)));
		return array;
	});
}

var _Json_encodeNull = _Json_wrap(null);



// TASKS

function _Scheduler_succeed(value)
{
	return {
		$: 0,
		a: value
	};
}

function _Scheduler_fail(error)
{
	return {
		$: 1,
		a: error
	};
}

function _Scheduler_binding(callback)
{
	return {
		$: 2,
		b: callback,
		c: null
	};
}

var _Scheduler_andThen = F2(function(callback, task)
{
	return {
		$: 3,
		b: callback,
		d: task
	};
});

var _Scheduler_onError = F2(function(callback, task)
{
	return {
		$: 4,
		b: callback,
		d: task
	};
});

function _Scheduler_receive(callback)
{
	return {
		$: 5,
		b: callback
	};
}


// PROCESSES

var _Scheduler_guid = 0;

function _Scheduler_rawSpawn(task)
{
	var proc = {
		$: 0,
		e: _Scheduler_guid++,
		f: task,
		g: null,
		h: []
	};

	_Scheduler_enqueue(proc);

	return proc;
}

function _Scheduler_spawn(task)
{
	return _Scheduler_binding(function(callback) {
		callback(_Scheduler_succeed(_Scheduler_rawSpawn(task)));
	});
}

function _Scheduler_rawSend(proc, msg)
{
	proc.h.push(msg);
	_Scheduler_enqueue(proc);
}

var _Scheduler_send = F2(function(proc, msg)
{
	return _Scheduler_binding(function(callback) {
		_Scheduler_rawSend(proc, msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});

function _Scheduler_kill(proc)
{
	return _Scheduler_binding(function(callback) {
		var task = proc.f;
		if (task.$ === 2 && task.c)
		{
			task.c();
		}

		proc.f = null;

		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
}


/* STEP PROCESSES

type alias Process =
  { $ : tag
  , id : unique_id
  , root : Task
  , stack : null | { $: SUCCEED | FAIL, a: callback, b: stack }
  , mailbox : [msg]
  }

*/


var _Scheduler_working = false;
var _Scheduler_queue = [];


function _Scheduler_enqueue(proc)
{
	_Scheduler_queue.push(proc);
	if (_Scheduler_working)
	{
		return;
	}
	_Scheduler_working = true;
	while (proc = _Scheduler_queue.shift())
	{
		_Scheduler_step(proc);
	}
	_Scheduler_working = false;
}


function _Scheduler_step(proc)
{
	while (proc.f)
	{
		var rootTag = proc.f.$;
		if (rootTag === 0 || rootTag === 1)
		{
			while (proc.g && proc.g.$ !== rootTag)
			{
				proc.g = proc.g.i;
			}
			if (!proc.g)
			{
				return;
			}
			proc.f = proc.g.b(proc.f.a);
			proc.g = proc.g.i;
		}
		else if (rootTag === 2)
		{
			proc.f.c = proc.f.b(function(newRoot) {
				proc.f = newRoot;
				_Scheduler_enqueue(proc);
			});
			return;
		}
		else if (rootTag === 5)
		{
			if (proc.h.length === 0)
			{
				return;
			}
			proc.f = proc.f.b(proc.h.shift());
		}
		else // if (rootTag === 3 || rootTag === 4)
		{
			proc.g = {
				$: rootTag === 3 ? 0 : 1,
				b: proc.f.b,
				i: proc.g
			};
			proc.f = proc.f.d;
		}
	}
}



function _Process_sleep(time)
{
	return _Scheduler_binding(function(callback) {
		var id = setTimeout(function() {
			callback(_Scheduler_succeed(_Utils_Tuple0));
		}, time);

		return function() { clearTimeout(id); };
	});
}




// PROGRAMS


var _Platform_worker = F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.init,
		impl.update,
		impl.subscriptions,
		function() { return function() {} }
	);
});



// INITIALIZE A PROGRAM


function _Platform_initialize(flagDecoder, args, init, update, subscriptions, stepperBuilder)
{
	var result = A2(_Json_run, flagDecoder, _Json_wrap(args ? args['flags'] : undefined));
	$elm$core$Result$isOk(result) || _Debug_crash(2 /**/, _Json_errorToString(result.a) /**/);
	var managers = {};
	var initPair = init(result.a);
	var model = initPair.a;
	var stepper = stepperBuilder(sendToApp, model);
	var ports = _Platform_setupEffects(managers, sendToApp);

	function sendToApp(msg, viewMetadata)
	{
		var pair = A2(update, msg, model);
		stepper(model = pair.a, viewMetadata);
		_Platform_enqueueEffects(managers, pair.b, subscriptions(model));
	}

	_Platform_enqueueEffects(managers, initPair.b, subscriptions(model));

	return ports ? { ports: ports } : {};
}



// TRACK PRELOADS
//
// This is used by code in elm/browser and elm/http
// to register any HTTP requests that are triggered by init.
//


var _Platform_preload;


function _Platform_registerPreload(url)
{
	_Platform_preload.add(url);
}



// EFFECT MANAGERS


var _Platform_effectManagers = {};


function _Platform_setupEffects(managers, sendToApp)
{
	var ports;

	// setup all necessary effect managers
	for (var key in _Platform_effectManagers)
	{
		var manager = _Platform_effectManagers[key];

		if (manager.a)
		{
			ports = ports || {};
			ports[key] = manager.a(key, sendToApp);
		}

		managers[key] = _Platform_instantiateManager(manager, sendToApp);
	}

	return ports;
}


function _Platform_createManager(init, onEffects, onSelfMsg, cmdMap, subMap)
{
	return {
		b: init,
		c: onEffects,
		d: onSelfMsg,
		e: cmdMap,
		f: subMap
	};
}


function _Platform_instantiateManager(info, sendToApp)
{
	var router = {
		g: sendToApp,
		h: undefined
	};

	var onEffects = info.c;
	var onSelfMsg = info.d;
	var cmdMap = info.e;
	var subMap = info.f;

	function loop(state)
	{
		return A2(_Scheduler_andThen, loop, _Scheduler_receive(function(msg)
		{
			var value = msg.a;

			if (msg.$ === 0)
			{
				return A3(onSelfMsg, router, value, state);
			}

			return cmdMap && subMap
				? A4(onEffects, router, value.i, value.j, state)
				: A3(onEffects, router, cmdMap ? value.i : value.j, state);
		}));
	}

	return router.h = _Scheduler_rawSpawn(A2(_Scheduler_andThen, loop, info.b));
}



// ROUTING


var _Platform_sendToApp = F2(function(router, msg)
{
	return _Scheduler_binding(function(callback)
	{
		router.g(msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});


var _Platform_sendToSelf = F2(function(router, msg)
{
	return A2(_Scheduler_send, router.h, {
		$: 0,
		a: msg
	});
});



// BAGS


function _Platform_leaf(home)
{
	return function(value)
	{
		return {
			$: 1,
			k: home,
			l: value
		};
	};
}


function _Platform_batch(list)
{
	return {
		$: 2,
		m: list
	};
}


var _Platform_map = F2(function(tagger, bag)
{
	return {
		$: 3,
		n: tagger,
		o: bag
	}
});



// PIPE BAGS INTO EFFECT MANAGERS
//
// Effects must be queued!
//
// Say your init contains a synchronous command, like Time.now or Time.here
//
//   - This will produce a batch of effects (FX_1)
//   - The synchronous task triggers the subsequent `update` call
//   - This will produce a batch of effects (FX_2)
//
// If we just start dispatching FX_2, subscriptions from FX_2 can be processed
// before subscriptions from FX_1. No good! Earlier versions of this code had
// this problem, leading to these reports:
//
//   https://github.com/elm/core/issues/980
//   https://github.com/elm/core/pull/981
//   https://github.com/elm/compiler/issues/1776
//
// The queue is necessary to avoid ordering issues for synchronous commands.


// Why use true/false here? Why not just check the length of the queue?
// The goal is to detect "are we currently dispatching effects?" If we
// are, we need to bail and let the ongoing while loop handle things.
//
// Now say the queue has 1 element. When we dequeue the final element,
// the queue will be empty, but we are still actively dispatching effects.
// So you could get queue jumping in a really tricky category of cases.
//
var _Platform_effectsQueue = [];
var _Platform_effectsActive = false;


function _Platform_enqueueEffects(managers, cmdBag, subBag)
{
	_Platform_effectsQueue.push({ p: managers, q: cmdBag, r: subBag });

	if (_Platform_effectsActive) return;

	_Platform_effectsActive = true;
	for (var fx; fx = _Platform_effectsQueue.shift(); )
	{
		_Platform_dispatchEffects(fx.p, fx.q, fx.r);
	}
	_Platform_effectsActive = false;
}


function _Platform_dispatchEffects(managers, cmdBag, subBag)
{
	var effectsDict = {};
	_Platform_gatherEffects(true, cmdBag, effectsDict, null);
	_Platform_gatherEffects(false, subBag, effectsDict, null);

	for (var home in managers)
	{
		_Scheduler_rawSend(managers[home], {
			$: 'fx',
			a: effectsDict[home] || { i: _List_Nil, j: _List_Nil }
		});
	}
}


function _Platform_gatherEffects(isCmd, bag, effectsDict, taggers)
{
	switch (bag.$)
	{
		case 1:
			var home = bag.k;
			var effect = _Platform_toEffect(isCmd, home, taggers, bag.l);
			effectsDict[home] = _Platform_insert(isCmd, effect, effectsDict[home]);
			return;

		case 2:
			for (var list = bag.m; list.b; list = list.b) // WHILE_CONS
			{
				_Platform_gatherEffects(isCmd, list.a, effectsDict, taggers);
			}
			return;

		case 3:
			_Platform_gatherEffects(isCmd, bag.o, effectsDict, {
				s: bag.n,
				t: taggers
			});
			return;
	}
}


function _Platform_toEffect(isCmd, home, taggers, value)
{
	function applyTaggers(x)
	{
		for (var temp = taggers; temp; temp = temp.t)
		{
			x = temp.s(x);
		}
		return x;
	}

	var map = isCmd
		? _Platform_effectManagers[home].e
		: _Platform_effectManagers[home].f;

	return A2(map, applyTaggers, value)
}


function _Platform_insert(isCmd, newEffect, effects)
{
	effects = effects || { i: _List_Nil, j: _List_Nil };

	isCmd
		? (effects.i = _List_Cons(newEffect, effects.i))
		: (effects.j = _List_Cons(newEffect, effects.j));

	return effects;
}



// PORTS


function _Platform_checkPortName(name)
{
	if (_Platform_effectManagers[name])
	{
		_Debug_crash(3, name)
	}
}



// OUTGOING PORTS


function _Platform_outgoingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		e: _Platform_outgoingPortMap,
		u: converter,
		a: _Platform_setupOutgoingPort
	};
	return _Platform_leaf(name);
}


var _Platform_outgoingPortMap = F2(function(tagger, value) { return value; });


function _Platform_setupOutgoingPort(name)
{
	var subs = [];
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Process_sleep(0);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, cmdList, state)
	{
		for ( ; cmdList.b; cmdList = cmdList.b) // WHILE_CONS
		{
			// grab a separate reference to subs in case unsubscribe is called
			var currentSubs = subs;
			var value = _Json_unwrap(converter(cmdList.a));
			for (var i = 0; i < currentSubs.length; i++)
			{
				currentSubs[i](value);
			}
		}
		return init;
	});

	// PUBLIC API

	function subscribe(callback)
	{
		subs.push(callback);
	}

	function unsubscribe(callback)
	{
		// copy subs into a new array in case unsubscribe is called within a
		// subscribed callback
		subs = subs.slice();
		var index = subs.indexOf(callback);
		if (index >= 0)
		{
			subs.splice(index, 1);
		}
	}

	return {
		subscribe: subscribe,
		unsubscribe: unsubscribe
	};
}



// INCOMING PORTS


function _Platform_incomingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		f: _Platform_incomingPortMap,
		u: converter,
		a: _Platform_setupIncomingPort
	};
	return _Platform_leaf(name);
}


var _Platform_incomingPortMap = F2(function(tagger, finalTagger)
{
	return function(value)
	{
		return tagger(finalTagger(value));
	};
});


function _Platform_setupIncomingPort(name, sendToApp)
{
	var subs = _List_Nil;
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Scheduler_succeed(null);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, subList, state)
	{
		subs = subList;
		return init;
	});

	// PUBLIC API

	function send(incomingValue)
	{
		var result = A2(_Json_run, converter, _Json_wrap(incomingValue));

		$elm$core$Result$isOk(result) || _Debug_crash(4, name, result.a);

		var value = result.a;
		for (var temp = subs; temp.b; temp = temp.b) // WHILE_CONS
		{
			sendToApp(temp.a(value));
		}
	}

	return { send: send };
}



// EXPORT ELM MODULES
//
// Have DEBUG and PROD versions so that we can (1) give nicer errors in
// debug mode and (2) not pay for the bits needed for that in prod mode.
//


function _Platform_export_UNUSED(exports)
{
	scope['Elm']
		? _Platform_mergeExportsProd(scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsProd(obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6)
				: _Platform_mergeExportsProd(obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}


function _Platform_export(exports)
{
	scope['Elm']
		? _Platform_mergeExportsDebug('Elm', scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsDebug(moduleName, obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6, moduleName)
				: _Platform_mergeExportsDebug(moduleName + '.' + name, obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}



var _Bitwise_and = F2(function(a, b)
{
	return a & b;
});

var _Bitwise_or = F2(function(a, b)
{
	return a | b;
});

var _Bitwise_xor = F2(function(a, b)
{
	return a ^ b;
});

function _Bitwise_complement(a)
{
	return ~a;
};

var _Bitwise_shiftLeftBy = F2(function(offset, a)
{
	return a << offset;
});

var _Bitwise_shiftRightBy = F2(function(offset, a)
{
	return a >> offset;
});

var _Bitwise_shiftRightZfBy = F2(function(offset, a)
{
	return a >>> offset;
});


// CREATE

var _Regex_never = /.^/;

var _Regex_fromStringWith = F2(function(options, string)
{
	var flags = 'g';
	if (options.multiline) { flags += 'm'; }
	if (options.caseInsensitive) { flags += 'i'; }

	try
	{
		return $elm$core$Maybe$Just(new RegExp(string, flags));
	}
	catch(error)
	{
		return $elm$core$Maybe$Nothing;
	}
});


// USE

var _Regex_contains = F2(function(re, string)
{
	return string.match(re) !== null;
});


var _Regex_findAtMost = F3(function(n, re, str)
{
	var out = [];
	var number = 0;
	var string = str;
	var lastIndex = re.lastIndex;
	var prevLastIndex = -1;
	var result;
	while (number++ < n && (result = re.exec(string)))
	{
		if (prevLastIndex == re.lastIndex) break;
		var i = result.length - 1;
		var subs = new Array(i);
		while (i > 0)
		{
			var submatch = result[i];
			subs[--i] = submatch
				? $elm$core$Maybe$Just(submatch)
				: $elm$core$Maybe$Nothing;
		}
		out.push(A4($elm$regex$Regex$Match, result[0], result.index, number, _List_fromArray(subs)));
		prevLastIndex = re.lastIndex;
	}
	re.lastIndex = lastIndex;
	return _List_fromArray(out);
});


var _Regex_replaceAtMost = F4(function(n, re, replacer, string)
{
	var count = 0;
	function jsReplacer(match)
	{
		if (count++ >= n)
		{
			return match;
		}
		var i = arguments.length - 3;
		var submatches = new Array(i);
		while (i > 0)
		{
			var submatch = arguments[i];
			submatches[--i] = submatch
				? $elm$core$Maybe$Just(submatch)
				: $elm$core$Maybe$Nothing;
		}
		return replacer(A4($elm$regex$Regex$Match, match, arguments[arguments.length - 2], count, _List_fromArray(submatches)));
	}
	return string.replace(re, jsReplacer);
});

var _Regex_splitAtMost = F3(function(n, re, str)
{
	var string = str;
	var out = [];
	var start = re.lastIndex;
	var restoreLastIndex = re.lastIndex;
	while (n--)
	{
		var result = re.exec(string);
		if (!result) break;
		out.push(string.slice(start, result.index));
		start = re.lastIndex;
	}
	out.push(string.slice(start));
	re.lastIndex = restoreLastIndex;
	return _List_fromArray(out);
});

var _Regex_infinity = Infinity;



// SEND REQUEST

var _Http_toTask = F3(function(router, toTask, request)
{
	return _Scheduler_binding(function(callback)
	{
		function done(response) {
			callback(toTask(request.expect.a(response)));
		}

		var xhr = new XMLHttpRequest();
		xhr.addEventListener('error', function() { done($elm$http$Http$NetworkError_); });
		xhr.addEventListener('timeout', function() { done($elm$http$Http$Timeout_); });
		xhr.addEventListener('load', function() { done(_Http_toResponse(request.expect.b, xhr)); });
		$elm$core$Maybe$isJust(request.tracker) && _Http_track(router, xhr, request.tracker.a);

		try {
			xhr.open(request.method, request.url, true);
		} catch (e) {
			return done($elm$http$Http$BadUrl_(request.url));
		}

		_Http_configureRequest(xhr, request);

		request.body.a && xhr.setRequestHeader('Content-Type', request.body.a);
		xhr.send(request.body.b);

		return function() { xhr.c = true; xhr.abort(); };
	});
});


// CONFIGURE

function _Http_configureRequest(xhr, request)
{
	for (var headers = request.headers; headers.b; headers = headers.b) // WHILE_CONS
	{
		xhr.setRequestHeader(headers.a.a, headers.a.b);
	}
	xhr.timeout = request.timeout.a || 0;
	xhr.responseType = request.expect.d;
	xhr.withCredentials = request.allowCookiesFromOtherDomains;
}


// RESPONSES

function _Http_toResponse(toBody, xhr)
{
	return A2(
		200 <= xhr.status && xhr.status < 300 ? $elm$http$Http$GoodStatus_ : $elm$http$Http$BadStatus_,
		_Http_toMetadata(xhr),
		toBody(xhr.response)
	);
}


// METADATA

function _Http_toMetadata(xhr)
{
	return {
		url: xhr.responseURL,
		statusCode: xhr.status,
		statusText: xhr.statusText,
		headers: _Http_parseHeaders(xhr.getAllResponseHeaders())
	};
}


// HEADERS

function _Http_parseHeaders(rawHeaders)
{
	if (!rawHeaders)
	{
		return $elm$core$Dict$empty;
	}

	var headers = $elm$core$Dict$empty;
	var headerPairs = rawHeaders.split('\r\n');
	for (var i = headerPairs.length; i--; )
	{
		var headerPair = headerPairs[i];
		var index = headerPair.indexOf(': ');
		if (index > 0)
		{
			var key = headerPair.substring(0, index);
			var value = headerPair.substring(index + 2);

			headers = A3($elm$core$Dict$update, key, function(oldValue) {
				return $elm$core$Maybe$Just($elm$core$Maybe$isJust(oldValue)
					? value + ', ' + oldValue.a
					: value
				);
			}, headers);
		}
	}
	return headers;
}


// EXPECT

var _Http_expect = F3(function(type, toBody, toValue)
{
	return {
		$: 0,
		d: type,
		b: toBody,
		a: toValue
	};
});

var _Http_mapExpect = F2(function(func, expect)
{
	return {
		$: 0,
		d: expect.d,
		b: expect.b,
		a: function(x) { return func(expect.a(x)); }
	};
});

function _Http_toDataView(arrayBuffer)
{
	return new DataView(arrayBuffer);
}


// BODY and PARTS

var _Http_emptyBody = { $: 0 };
var _Http_pair = F2(function(a, b) { return { $: 0, a: a, b: b }; });

function _Http_toFormData(parts)
{
	for (var formData = new FormData(); parts.b; parts = parts.b) // WHILE_CONS
	{
		var part = parts.a;
		formData.append(part.a, part.b);
	}
	return formData;
}

var _Http_bytesToBlob = F2(function(mime, bytes)
{
	return new Blob([bytes], { type: mime });
});


// PROGRESS

function _Http_track(router, xhr, tracker)
{
	// TODO check out lengthComputable on loadstart event

	xhr.upload.addEventListener('progress', function(event) {
		if (xhr.c) { return; }
		_Scheduler_rawSpawn(A2($elm$core$Platform$sendToSelf, router, _Utils_Tuple2(tracker, $elm$http$Http$Sending({
			sent: event.loaded,
			size: event.total
		}))));
	});
	xhr.addEventListener('progress', function(event) {
		if (xhr.c) { return; }
		_Scheduler_rawSpawn(A2($elm$core$Platform$sendToSelf, router, _Utils_Tuple2(tracker, $elm$http$Http$Receiving({
			received: event.loaded,
			size: event.lengthComputable ? $elm$core$Maybe$Just(event.total) : $elm$core$Maybe$Nothing
		}))));
	});
}var $author$project$Worker$Handle = function (a) {
	return {$: 'Handle', a: a};
};
var $elm$core$List$cons = _List_cons;
var $elm$core$Elm$JsArray$foldr = _JsArray_foldr;
var $elm$core$Array$foldr = F3(
	function (func, baseCase, _v0) {
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = F2(
			function (node, acc) {
				if (node.$ === 'SubTree') {
					var subTree = node.a;
					return A3($elm$core$Elm$JsArray$foldr, helper, acc, subTree);
				} else {
					var values = node.a;
					return A3($elm$core$Elm$JsArray$foldr, func, acc, values);
				}
			});
		return A3(
			$elm$core$Elm$JsArray$foldr,
			helper,
			A3($elm$core$Elm$JsArray$foldr, func, baseCase, tail),
			tree);
	});
var $elm$core$Array$toList = function (array) {
	return A3($elm$core$Array$foldr, $elm$core$List$cons, _List_Nil, array);
};
var $elm$core$Dict$foldr = F3(
	function (func, acc, t) {
		foldr:
		while (true) {
			if (t.$ === 'RBEmpty_elm_builtin') {
				return acc;
			} else {
				var key = t.b;
				var value = t.c;
				var left = t.d;
				var right = t.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldr, func, acc, right)),
					$temp$t = left;
				func = $temp$func;
				acc = $temp$acc;
				t = $temp$t;
				continue foldr;
			}
		}
	});
var $elm$core$Dict$toList = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, list) {
				return A2(
					$elm$core$List$cons,
					_Utils_Tuple2(key, value),
					list);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Dict$keys = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, keyList) {
				return A2($elm$core$List$cons, key, keyList);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Set$toList = function (_v0) {
	var dict = _v0.a;
	return $elm$core$Dict$keys(dict);
};
var $elm$core$Basics$EQ = {$: 'EQ'};
var $elm$core$Basics$GT = {$: 'GT'};
var $elm$core$Basics$LT = {$: 'LT'};
var $elm$core$Result$Err = function (a) {
	return {$: 'Err', a: a};
};
var $elm$json$Json$Decode$Failure = F2(
	function (a, b) {
		return {$: 'Failure', a: a, b: b};
	});
var $elm$json$Json$Decode$Field = F2(
	function (a, b) {
		return {$: 'Field', a: a, b: b};
	});
var $elm$json$Json$Decode$Index = F2(
	function (a, b) {
		return {$: 'Index', a: a, b: b};
	});
var $elm$core$Result$Ok = function (a) {
	return {$: 'Ok', a: a};
};
var $elm$json$Json$Decode$OneOf = function (a) {
	return {$: 'OneOf', a: a};
};
var $elm$core$Basics$False = {$: 'False'};
var $elm$core$Basics$add = _Basics_add;
var $elm$core$Maybe$Just = function (a) {
	return {$: 'Just', a: a};
};
var $elm$core$Maybe$Nothing = {$: 'Nothing'};
var $elm$core$String$all = _String_all;
var $elm$core$Basics$and = _Basics_and;
var $elm$core$Basics$append = _Utils_append;
var $elm$json$Json$Encode$encode = _Json_encode;
var $elm$core$String$fromInt = _String_fromNumber;
var $elm$core$String$join = F2(
	function (sep, chunks) {
		return A2(
			_String_join,
			sep,
			_List_toArray(chunks));
	});
var $elm$core$String$split = F2(
	function (sep, string) {
		return _List_fromArray(
			A2(_String_split, sep, string));
	});
var $elm$json$Json$Decode$indent = function (str) {
	return A2(
		$elm$core$String$join,
		'\n    ',
		A2($elm$core$String$split, '\n', str));
};
var $elm$core$List$foldl = F3(
	function (func, acc, list) {
		foldl:
		while (true) {
			if (!list.b) {
				return acc;
			} else {
				var x = list.a;
				var xs = list.b;
				var $temp$func = func,
					$temp$acc = A2(func, x, acc),
					$temp$list = xs;
				func = $temp$func;
				acc = $temp$acc;
				list = $temp$list;
				continue foldl;
			}
		}
	});
var $elm$core$List$length = function (xs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, i) {
				return i + 1;
			}),
		0,
		xs);
};
var $elm$core$List$map2 = _List_map2;
var $elm$core$Basics$le = _Utils_le;
var $elm$core$Basics$sub = _Basics_sub;
var $elm$core$List$rangeHelp = F3(
	function (lo, hi, list) {
		rangeHelp:
		while (true) {
			if (_Utils_cmp(lo, hi) < 1) {
				var $temp$lo = lo,
					$temp$hi = hi - 1,
					$temp$list = A2($elm$core$List$cons, hi, list);
				lo = $temp$lo;
				hi = $temp$hi;
				list = $temp$list;
				continue rangeHelp;
			} else {
				return list;
			}
		}
	});
var $elm$core$List$range = F2(
	function (lo, hi) {
		return A3($elm$core$List$rangeHelp, lo, hi, _List_Nil);
	});
var $elm$core$List$indexedMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$map2,
			f,
			A2(
				$elm$core$List$range,
				0,
				$elm$core$List$length(xs) - 1),
			xs);
	});
var $elm$core$Char$toCode = _Char_toCode;
var $elm$core$Char$isLower = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (97 <= code) && (code <= 122);
};
var $elm$core$Char$isUpper = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 90) && (65 <= code);
};
var $elm$core$Basics$or = _Basics_or;
var $elm$core$Char$isAlpha = function (_char) {
	return $elm$core$Char$isLower(_char) || $elm$core$Char$isUpper(_char);
};
var $elm$core$Char$isDigit = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 57) && (48 <= code);
};
var $elm$core$Char$isAlphaNum = function (_char) {
	return $elm$core$Char$isLower(_char) || ($elm$core$Char$isUpper(_char) || $elm$core$Char$isDigit(_char));
};
var $elm$core$List$reverse = function (list) {
	return A3($elm$core$List$foldl, $elm$core$List$cons, _List_Nil, list);
};
var $elm$core$String$uncons = _String_uncons;
var $elm$json$Json$Decode$errorOneOf = F2(
	function (i, error) {
		return '\n\n(' + ($elm$core$String$fromInt(i + 1) + (') ' + $elm$json$Json$Decode$indent(
			$elm$json$Json$Decode$errorToString(error))));
	});
var $elm$json$Json$Decode$errorToString = function (error) {
	return A2($elm$json$Json$Decode$errorToStringHelp, error, _List_Nil);
};
var $elm$json$Json$Decode$errorToStringHelp = F2(
	function (error, context) {
		errorToStringHelp:
		while (true) {
			switch (error.$) {
				case 'Field':
					var f = error.a;
					var err = error.b;
					var isSimple = function () {
						var _v1 = $elm$core$String$uncons(f);
						if (_v1.$ === 'Nothing') {
							return false;
						} else {
							var _v2 = _v1.a;
							var _char = _v2.a;
							var rest = _v2.b;
							return $elm$core$Char$isAlpha(_char) && A2($elm$core$String$all, $elm$core$Char$isAlphaNum, rest);
						}
					}();
					var fieldName = isSimple ? ('.' + f) : ('[\'' + (f + '\']'));
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, fieldName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 'Index':
					var i = error.a;
					var err = error.b;
					var indexName = '[' + ($elm$core$String$fromInt(i) + ']');
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, indexName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 'OneOf':
					var errors = error.a;
					if (!errors.b) {
						return 'Ran into a Json.Decode.oneOf with no possibilities' + function () {
							if (!context.b) {
								return '!';
							} else {
								return ' at json' + A2(
									$elm$core$String$join,
									'',
									$elm$core$List$reverse(context));
							}
						}();
					} else {
						if (!errors.b.b) {
							var err = errors.a;
							var $temp$error = err,
								$temp$context = context;
							error = $temp$error;
							context = $temp$context;
							continue errorToStringHelp;
						} else {
							var starter = function () {
								if (!context.b) {
									return 'Json.Decode.oneOf';
								} else {
									return 'The Json.Decode.oneOf at json' + A2(
										$elm$core$String$join,
										'',
										$elm$core$List$reverse(context));
								}
							}();
							var introduction = starter + (' failed in the following ' + ($elm$core$String$fromInt(
								$elm$core$List$length(errors)) + ' ways:'));
							return A2(
								$elm$core$String$join,
								'\n\n',
								A2(
									$elm$core$List$cons,
									introduction,
									A2($elm$core$List$indexedMap, $elm$json$Json$Decode$errorOneOf, errors)));
						}
					}
				default:
					var msg = error.a;
					var json = error.b;
					var introduction = function () {
						if (!context.b) {
							return 'Problem with the given value:\n\n';
						} else {
							return 'Problem with the value at json' + (A2(
								$elm$core$String$join,
								'',
								$elm$core$List$reverse(context)) + ':\n\n    ');
						}
					}();
					return introduction + ($elm$json$Json$Decode$indent(
						A2($elm$json$Json$Encode$encode, 4, json)) + ('\n\n' + msg));
			}
		}
	});
var $elm$core$Array$branchFactor = 32;
var $elm$core$Array$Array_elm_builtin = F4(
	function (a, b, c, d) {
		return {$: 'Array_elm_builtin', a: a, b: b, c: c, d: d};
	});
var $elm$core$Elm$JsArray$empty = _JsArray_empty;
var $elm$core$Basics$ceiling = _Basics_ceiling;
var $elm$core$Basics$fdiv = _Basics_fdiv;
var $elm$core$Basics$logBase = F2(
	function (base, number) {
		return _Basics_log(number) / _Basics_log(base);
	});
var $elm$core$Basics$toFloat = _Basics_toFloat;
var $elm$core$Array$shiftStep = $elm$core$Basics$ceiling(
	A2($elm$core$Basics$logBase, 2, $elm$core$Array$branchFactor));
var $elm$core$Array$empty = A4($elm$core$Array$Array_elm_builtin, 0, $elm$core$Array$shiftStep, $elm$core$Elm$JsArray$empty, $elm$core$Elm$JsArray$empty);
var $elm$core$Elm$JsArray$initialize = _JsArray_initialize;
var $elm$core$Array$Leaf = function (a) {
	return {$: 'Leaf', a: a};
};
var $elm$core$Basics$apL = F2(
	function (f, x) {
		return f(x);
	});
var $elm$core$Basics$apR = F2(
	function (x, f) {
		return f(x);
	});
var $elm$core$Basics$eq = _Utils_equal;
var $elm$core$Basics$floor = _Basics_floor;
var $elm$core$Elm$JsArray$length = _JsArray_length;
var $elm$core$Basics$gt = _Utils_gt;
var $elm$core$Basics$max = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) > 0) ? x : y;
	});
var $elm$core$Basics$mul = _Basics_mul;
var $elm$core$Array$SubTree = function (a) {
	return {$: 'SubTree', a: a};
};
var $elm$core$Elm$JsArray$initializeFromList = _JsArray_initializeFromList;
var $elm$core$Array$compressNodes = F2(
	function (nodes, acc) {
		compressNodes:
		while (true) {
			var _v0 = A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodes);
			var node = _v0.a;
			var remainingNodes = _v0.b;
			var newAcc = A2(
				$elm$core$List$cons,
				$elm$core$Array$SubTree(node),
				acc);
			if (!remainingNodes.b) {
				return $elm$core$List$reverse(newAcc);
			} else {
				var $temp$nodes = remainingNodes,
					$temp$acc = newAcc;
				nodes = $temp$nodes;
				acc = $temp$acc;
				continue compressNodes;
			}
		}
	});
var $elm$core$Tuple$first = function (_v0) {
	var x = _v0.a;
	return x;
};
var $elm$core$Array$treeFromBuilder = F2(
	function (nodeList, nodeListSize) {
		treeFromBuilder:
		while (true) {
			var newNodeSize = $elm$core$Basics$ceiling(nodeListSize / $elm$core$Array$branchFactor);
			if (newNodeSize === 1) {
				return A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodeList).a;
			} else {
				var $temp$nodeList = A2($elm$core$Array$compressNodes, nodeList, _List_Nil),
					$temp$nodeListSize = newNodeSize;
				nodeList = $temp$nodeList;
				nodeListSize = $temp$nodeListSize;
				continue treeFromBuilder;
			}
		}
	});
var $elm$core$Array$builderToArray = F2(
	function (reverseNodeList, builder) {
		if (!builder.nodeListSize) {
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.tail),
				$elm$core$Array$shiftStep,
				$elm$core$Elm$JsArray$empty,
				builder.tail);
		} else {
			var treeLen = builder.nodeListSize * $elm$core$Array$branchFactor;
			var depth = $elm$core$Basics$floor(
				A2($elm$core$Basics$logBase, $elm$core$Array$branchFactor, treeLen - 1));
			var correctNodeList = reverseNodeList ? $elm$core$List$reverse(builder.nodeList) : builder.nodeList;
			var tree = A2($elm$core$Array$treeFromBuilder, correctNodeList, builder.nodeListSize);
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.tail) + treeLen,
				A2($elm$core$Basics$max, 5, depth * $elm$core$Array$shiftStep),
				tree,
				builder.tail);
		}
	});
var $elm$core$Basics$idiv = _Basics_idiv;
var $elm$core$Basics$lt = _Utils_lt;
var $elm$core$Array$initializeHelp = F5(
	function (fn, fromIndex, len, nodeList, tail) {
		initializeHelp:
		while (true) {
			if (fromIndex < 0) {
				return A2(
					$elm$core$Array$builderToArray,
					false,
					{nodeList: nodeList, nodeListSize: (len / $elm$core$Array$branchFactor) | 0, tail: tail});
			} else {
				var leaf = $elm$core$Array$Leaf(
					A3($elm$core$Elm$JsArray$initialize, $elm$core$Array$branchFactor, fromIndex, fn));
				var $temp$fn = fn,
					$temp$fromIndex = fromIndex - $elm$core$Array$branchFactor,
					$temp$len = len,
					$temp$nodeList = A2($elm$core$List$cons, leaf, nodeList),
					$temp$tail = tail;
				fn = $temp$fn;
				fromIndex = $temp$fromIndex;
				len = $temp$len;
				nodeList = $temp$nodeList;
				tail = $temp$tail;
				continue initializeHelp;
			}
		}
	});
var $elm$core$Basics$remainderBy = _Basics_remainderBy;
var $elm$core$Array$initialize = F2(
	function (len, fn) {
		if (len <= 0) {
			return $elm$core$Array$empty;
		} else {
			var tailLen = len % $elm$core$Array$branchFactor;
			var tail = A3($elm$core$Elm$JsArray$initialize, tailLen, len - tailLen, fn);
			var initialFromIndex = (len - tailLen) - $elm$core$Array$branchFactor;
			return A5($elm$core$Array$initializeHelp, fn, initialFromIndex, len, _List_Nil, tail);
		}
	});
var $elm$core$Basics$True = {$: 'True'};
var $elm$core$Result$isOk = function (result) {
	if (result.$ === 'Ok') {
		return true;
	} else {
		return false;
	}
};
var $elm$json$Json$Decode$andThen = _Json_andThen;
var $elm$json$Json$Decode$field = _Json_decodeField;
var $author$project$Model$Idle = {$: 'Idle'};
var $author$project$Worker$Model = F4(
	function (state, cmd, code, lia) {
		return {cmd: cmd, code: code, lia: lia, state: state};
	});
var $author$project$Translations$En = {$: 'En'};
var $author$project$Lia$Settings$Model$Presentation = {$: 'Presentation'};
var $elm$core$Dict$RBEmpty_elm_builtin = {$: 'RBEmpty_elm_builtin'};
var $elm$core$Dict$empty = $elm$core$Dict$RBEmpty_elm_builtin;
var $elm$core$Basics$negate = function (n) {
	return -n;
};
var $author$project$Lia$Definition$Types$default = function (base) {
	return {attributes: _List_Nil, author: '', base: base, comment: _List_Nil, date: '', debug: false, email: '', imports: _List_Nil, language: 'en', lightMode: $elm$core$Maybe$Nothing, logo: '', macro: $elm$core$Dict$empty, mode: $elm$core$Maybe$Nothing, narrator: 'US English Male', onload: '', resources: _List_Nil, section: -1, translation: $elm$core$Dict$empty, uid: -1, version: '0.0.1'};
};
var $elm$core$Basics$identity = function (x) {
	return x;
};
var $author$project$Lia$Index$Model$init = '';
var $author$project$Lia$Settings$Model$Buttons = F4(
	function (settings, informations, translations, share) {
		return {informations: informations, settings: settings, share: share, translations: translations};
	});
var $author$project$Lia$Settings$Model$init_buttons = A4($author$project$Lia$Settings$Model$Buttons, false, false, false, false);
var $author$project$Lia$Settings$Model$init = function (mode) {
	return {buttons: $author$project$Lia$Settings$Model$init_buttons, editor: 'dreamweaver', font_size: 100, initialized: false, lang: 'default', light: true, mode: mode, sound: true, speaking: false, table_of_contents: true, theme: 'default'};
};
var $elm$json$Json$Decode$bool = _Json_decodeBool;
var $elm$json$Json$Decode$decodeValue = _Json_run;
var $elm$json$Json$Decode$int = _Json_decodeInt;
var $elm$json$Json$Decode$map8 = _Json_map8;
var $author$project$Lia$Settings$Json$settings = F9(
	function (model, toc, mode, theme, light, editor, font_size, sound, lang) {
		return _Utils_update(
			model,
			{editor: editor, font_size: font_size, lang: lang, light: light, mode: mode, sound: sound, table_of_contents: toc, theme: theme});
	});
var $elm$json$Json$Decode$string = _Json_decodeString;
var $author$project$Lia$Settings$Model$Slides = {$: 'Slides'};
var $author$project$Lia$Settings$Model$Textbook = {$: 'Textbook'};
var $elm$json$Json$Decode$fail = _Json_fail;
var $elm$json$Json$Decode$succeed = _Json_succeed;
var $author$project$Lia$Settings$Json$toMode = function (str) {
	switch (str) {
		case 'Textbook':
			return $elm$json$Json$Decode$succeed($author$project$Lia$Settings$Model$Textbook);
		case 'Presentation':
			return $elm$json$Json$Decode$succeed($author$project$Lia$Settings$Model$Presentation);
		case 'Slides':
			return $elm$json$Json$Decode$succeed($author$project$Lia$Settings$Model$Slides);
		default:
			return $elm$json$Json$Decode$fail('unknown presentation mode');
	}
};
var $author$project$Lia$Settings$Json$toModel = F2(
	function (model, json) {
		return A2(
			$elm$json$Json$Decode$decodeValue,
			A9(
				$elm$json$Json$Decode$map8,
				$author$project$Lia$Settings$Json$settings(model),
				A2($elm$json$Json$Decode$field, 'table_of_contents', $elm$json$Json$Decode$bool),
				A2(
					$elm$json$Json$Decode$andThen,
					$author$project$Lia$Settings$Json$toMode,
					A2($elm$json$Json$Decode$field, 'mode', $elm$json$Json$Decode$string)),
				A2($elm$json$Json$Decode$field, 'theme', $elm$json$Json$Decode$string),
				A2($elm$json$Json$Decode$field, 'light', $elm$json$Json$Decode$bool),
				A2($elm$json$Json$Decode$field, 'editor', $elm$json$Json$Decode$string),
				A2($elm$json$Json$Decode$field, 'font_size', $elm$json$Json$Decode$int),
				A2($elm$json$Json$Decode$field, 'sound', $elm$json$Json$Decode$bool),
				A2($elm$json$Json$Decode$field, 'lang', $elm$json$Json$Decode$string)),
			json);
	});
var $elm$core$Result$withDefault = F2(
	function (def, result) {
		if (result.$ === 'Ok') {
			var a = result.a;
			return a;
		} else {
			return def;
		}
	});
var $author$project$Lia$Model$init = F5(
	function (settings, url, readme, origin, slide_number) {
		var _default = $author$project$Lia$Settings$Model$init($author$project$Lia$Settings$Model$Presentation);
		return {
			definition: $author$project$Lia$Definition$Types$default(url),
			error: $elm$core$Maybe$Nothing,
			index_model: $author$project$Lia$Index$Model$init,
			origin: origin,
			readme: readme,
			resource: _List_Nil,
			search_index: $elm$core$Basics$identity,
			section_active: function () {
				if (slide_number.$ === 'Nothing') {
					return 0;
				} else {
					var idx = slide_number.a;
					return ((idx - 1) > 0) ? (idx - 1) : 0;
				}
			}(),
			sections: $elm$core$Array$empty,
			settings: A2(
				$elm$core$Result$withDefault,
				_default,
				A2($author$project$Lia$Settings$Json$toModel, _default, settings)),
			title: 'Lia',
			to_do: _List_Nil,
			translation: $author$project$Translations$En,
			url: url
		};
	});
var $author$project$Lia$Script$init = $author$project$Lia$Model$init;
var $elm$core$Platform$Cmd$batch = _Platform_batch;
var $elm$core$Platform$Cmd$none = $elm$core$Platform$Cmd$batch(_List_Nil);
var $elm$json$Json$Encode$null = _Json_encodeNull;
var $author$project$Worker$init = function (flags) {
	return _Utils_Tuple2(
		A4(
			$author$project$Worker$Model,
			$author$project$Model$Idle,
			'',
			$elm$core$Maybe$Nothing,
			A5($author$project$Lia$Script$init, $elm$json$Json$Encode$null, '', '', '', $elm$core$Maybe$Nothing)),
		$elm$core$Platform$Cmd$none);
};
var $elm$json$Json$Decode$list = _Json_decodeList;
var $author$project$Worker$input = _Platform_incomingPort(
	'input',
	$elm$json$Json$Decode$list($elm$json$Json$Decode$string));
var $author$project$Model$Error = function (a) {
	return {$: 'Error', a: a};
};
var $author$project$Model$Parsing = F2(
	function (a, b) {
		return {$: 'Parsing', a: a, b: b};
	});
var $elm$core$List$foldrHelper = F4(
	function (fn, acc, ctr, ls) {
		if (!ls.b) {
			return acc;
		} else {
			var a = ls.a;
			var r1 = ls.b;
			if (!r1.b) {
				return A2(fn, a, acc);
			} else {
				var b = r1.a;
				var r2 = r1.b;
				if (!r2.b) {
					return A2(
						fn,
						a,
						A2(fn, b, acc));
				} else {
					var c = r2.a;
					var r3 = r2.b;
					if (!r3.b) {
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(fn, c, acc)));
					} else {
						var d = r3.a;
						var r4 = r3.b;
						var res = (ctr > 500) ? A3(
							$elm$core$List$foldl,
							fn,
							acc,
							$elm$core$List$reverse(r4)) : A4($elm$core$List$foldrHelper, fn, acc, ctr + 1, r4);
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(
									fn,
									c,
									A2(fn, d, res))));
					}
				}
			}
		}
	});
var $elm$core$List$foldr = F3(
	function (fn, acc, ls) {
		return A4($elm$core$List$foldrHelper, fn, acc, 0, ls);
	});
var $elm$core$List$append = F2(
	function (xs, ys) {
		if (!ys.b) {
			return xs;
		} else {
			return A3($elm$core$List$foldr, $elm$core$List$cons, ys, xs);
		}
	});
var $elm$core$String$trim = _String_trim;
var $elm$core$Dict$foldl = F3(
	function (func, acc, dict) {
		foldl:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return acc;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldl, func, acc, left)),
					$temp$dict = right;
				func = $temp$func;
				acc = $temp$acc;
				dict = $temp$dict;
				continue foldl;
			}
		}
	});
var $elm$core$Dict$Black = {$: 'Black'};
var $elm$core$Dict$RBNode_elm_builtin = F5(
	function (a, b, c, d, e) {
		return {$: 'RBNode_elm_builtin', a: a, b: b, c: c, d: d, e: e};
	});
var $elm$core$Dict$Red = {$: 'Red'};
var $elm$core$Dict$balance = F5(
	function (color, key, value, left, right) {
		if ((right.$ === 'RBNode_elm_builtin') && (right.a.$ === 'Red')) {
			var _v1 = right.a;
			var rK = right.b;
			var rV = right.c;
			var rLeft = right.d;
			var rRight = right.e;
			if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) {
				var _v3 = left.a;
				var lK = left.b;
				var lV = left.c;
				var lLeft = left.d;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Red,
					key,
					value,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					rK,
					rV,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, left, rLeft),
					rRight);
			}
		} else {
			if ((((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) && (left.d.$ === 'RBNode_elm_builtin')) && (left.d.a.$ === 'Red')) {
				var _v5 = left.a;
				var lK = left.b;
				var lV = left.c;
				var _v6 = left.d;
				var _v7 = _v6.a;
				var llK = _v6.b;
				var llV = _v6.c;
				var llLeft = _v6.d;
				var llRight = _v6.e;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Red,
					lK,
					lV,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, llK, llV, llLeft, llRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, key, value, lRight, right));
			} else {
				return A5($elm$core$Dict$RBNode_elm_builtin, color, key, value, left, right);
			}
		}
	});
var $elm$core$Basics$compare = _Utils_compare;
var $elm$core$Dict$insertHelp = F3(
	function (key, value, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, $elm$core$Dict$RBEmpty_elm_builtin, $elm$core$Dict$RBEmpty_elm_builtin);
		} else {
			var nColor = dict.a;
			var nKey = dict.b;
			var nValue = dict.c;
			var nLeft = dict.d;
			var nRight = dict.e;
			var _v1 = A2($elm$core$Basics$compare, key, nKey);
			switch (_v1.$) {
				case 'LT':
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						A3($elm$core$Dict$insertHelp, key, value, nLeft),
						nRight);
				case 'EQ':
					return A5($elm$core$Dict$RBNode_elm_builtin, nColor, nKey, value, nLeft, nRight);
				default:
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						nLeft,
						A3($elm$core$Dict$insertHelp, key, value, nRight));
			}
		}
	});
var $elm$core$Dict$insert = F3(
	function (key, value, dict) {
		var _v0 = A3($elm$core$Dict$insertHelp, key, value, dict);
		if ((_v0.$ === 'RBNode_elm_builtin') && (_v0.a.$ === 'Red')) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $elm$core$Dict$union = F2(
	function (t1, t2) {
		return A3($elm$core$Dict$foldl, $elm$core$Dict$insert, t2, t1);
	});
var $author$project$Lia$Definition$Types$add_macros = F2(
	function (orig, temp) {
		return _Utils_update(
			orig,
			{
				attributes: A2($elm$core$List$append, orig.attributes, temp.attributes),
				macro: A2($elm$core$Dict$union, orig.macro, temp.macro),
				onload: $elm$core$String$trim(orig.onload + ('\n' + temp.onload)),
				resources: A2($elm$core$List$append, orig.resources, temp.resources)
			});
	});
var $author$project$Port$Event$Event = F3(
	function (topic, section, message) {
		return {message: message, section: section, topic: topic};
	});
var $elm$core$List$filter = F2(
	function (isGood, list) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, xs) {
					return isGood(x) ? A2($elm$core$List$cons, x, xs) : xs;
				}),
			_List_Nil,
			list);
	});
var $elm$json$Json$Encode$list = F2(
	function (func, entries) {
		return _Json_wrap(
			A3(
				$elm$core$List$foldl,
				_Json_addEntry(func),
				_Json_emptyArray(_Utils_Tuple0),
				entries));
	});
var $elm$core$List$map = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, acc) {
					return A2(
						$elm$core$List$cons,
						f(x),
						acc);
				}),
			_List_Nil,
			xs);
	});
var $elm$core$List$any = F2(
	function (isOkay, list) {
		any:
		while (true) {
			if (!list.b) {
				return false;
			} else {
				var x = list.a;
				var xs = list.b;
				if (isOkay(x)) {
					return true;
				} else {
					var $temp$isOkay = isOkay,
						$temp$list = xs;
					isOkay = $temp$isOkay;
					list = $temp$list;
					continue any;
				}
			}
		}
	});
var $elm$core$List$member = F2(
	function (x, xs) {
		return A2(
			$elm$core$List$any,
			function (a) {
				return _Utils_eq(a, x);
			},
			xs);
	});
var $elm$core$Basics$not = _Basics_not;
var $elm$json$Json$Encode$string = _Json_wrap;
var $author$project$Lia$Model$load_src = F2(
	function (old, _new) {
		var member = function (x) {
			return !A2($elm$core$List$member, x, old);
		};
		var to_load = A2($elm$core$List$filter, member, _new);
		return _Utils_Tuple2(
			A2($elm$core$List$append, old, to_load),
			A2(
				$elm$core$List$map,
				function (res) {
					return A3(
						$author$project$Port$Event$Event,
						'resource',
						0,
						A2(
							$elm$json$Json$Encode$list,
							$elm$json$Json$Encode$string,
							function () {
								if (res.$ === 'Script') {
									var url = res.a;
									return _List_fromArray(
										['script', url]);
								} else {
									var url = res.a;
									return _List_fromArray(
										['link', url]);
								}
							}()));
				},
				to_load));
	});
var $author$project$Lia$Script$add_todos = F2(
	function (definition, model) {
		var _v0 = A2($author$project$Lia$Model$load_src, model.resource, definition.resources);
		var res = _v0.a;
		var events = _v0.b;
		return _Utils_update(
			model,
			{
				definition: A2($author$project$Lia$Definition$Types$add_macros, model.definition, definition),
				resource: res,
				to_do: A2(
					$elm$core$List$append,
					model.to_do,
					$elm$core$List$reverse(events))
			});
	});
var $andre_dietrich$parser_combinators$Combine$ParseLocation = F3(
	function (source, line, column) {
		return {column: column, line: line, source: source};
	});
var $elm$core$String$length = _String_length;
var $andre_dietrich$parser_combinators$Combine$currentLocation = function (stream) {
	var find = F3(
		function (position, currentLine_, lines) {
			find:
			while (true) {
				if (!lines.b) {
					return A3($andre_dietrich$parser_combinators$Combine$ParseLocation, '', currentLine_, position);
				} else {
					var line = lines.a;
					var rest = lines.b;
					var length = $elm$core$String$length(line);
					var lengthPlusNL = length + 1;
					if (_Utils_eq(position, length)) {
						return A3($andre_dietrich$parser_combinators$Combine$ParseLocation, line, currentLine_, position);
					} else {
						if (_Utils_cmp(position, length) > 0) {
							var $temp$position = position - lengthPlusNL,
								$temp$currentLine_ = currentLine_ + 1,
								$temp$lines = rest;
							position = $temp$position;
							currentLine_ = $temp$currentLine_;
							lines = $temp$lines;
							continue find;
						} else {
							return A3($andre_dietrich$parser_combinators$Combine$ParseLocation, line, currentLine_, position);
						}
					}
				}
			}
		});
	return A3(
		find,
		stream.position,
		0,
		A2($elm$core$String$split, '\n', stream.data));
};
var $elm$core$String$cons = _String_cons;
var $elm$core$String$fromChar = function (_char) {
	return A2($elm$core$String$cons, _char, '');
};
var $elm$core$Bitwise$and = _Bitwise_and;
var $elm$core$Bitwise$shiftRightBy = _Bitwise_shiftRightBy;
var $elm$core$String$repeatHelp = F3(
	function (n, chunk, result) {
		return (n <= 0) ? result : A3(
			$elm$core$String$repeatHelp,
			n >> 1,
			_Utils_ap(chunk, chunk),
			(!(n & 1)) ? result : _Utils_ap(result, chunk));
	});
var $elm$core$String$repeat = F2(
	function (n, chunk) {
		return A3($elm$core$String$repeatHelp, n, chunk, '');
	});
var $elm$core$String$padLeft = F3(
	function (n, _char, string) {
		return _Utils_ap(
			A2(
				$elm$core$String$repeat,
				n - $elm$core$String$length(string),
				$elm$core$String$fromChar(_char)),
			string);
	});
var $author$project$Lia$Parser$Parser$formatError = F2(
	function (ms, stream) {
		var separator = '|> ';
		var separatorOffset = $elm$core$String$length(separator);
		var location = $andre_dietrich$parser_combinators$Combine$currentLocation(stream);
		var padding = (location.column + separatorOffset) + 2;
		var expectationSeparator = '\n  * ';
		return 'Parse error around line:\\n\\n' + ($elm$core$String$fromInt(location.line) + (separator + (location.source + ('\\n' + (A3(
			$elm$core$String$padLeft,
			padding,
			_Utils_chr(' '),
			'^') + ('\\nI expected one of the following:\\n' + (expectationSeparator + A2($elm$core$String$join, expectationSeparator, ms))))))));
	});
var $elm$core$Basics$always = F2(
	function (a, _v0) {
		return a;
	});
var $andre_dietrich$parser_combinators$Combine$Parser = function (a) {
	return {$: 'Parser', a: a};
};
var $andre_dietrich$parser_combinators$Combine$app = function (_v0) {
	var inner = _v0.a;
	return inner;
};
var $andre_dietrich$parser_combinators$Combine$andThen = F2(
	function (f, p) {
		return $andre_dietrich$parser_combinators$Combine$Parser(
			F2(
				function (state, stream) {
					var _v0 = A3($andre_dietrich$parser_combinators$Combine$app, p, state, stream);
					if (_v0.c.$ === 'Ok') {
						var rstate = _v0.a;
						var rstream = _v0.b;
						var res = _v0.c.a;
						return A3(
							$andre_dietrich$parser_combinators$Combine$app,
							f(res),
							rstate,
							rstream);
					} else {
						var estate = _v0.a;
						var estream = _v0.b;
						var ms = _v0.c.a;
						return _Utils_Tuple3(
							estate,
							estream,
							$elm$core$Result$Err(ms));
					}
				}));
	});
var $pilatch$flip$Flip$flip = F3(
	function (_function, argB, argA) {
		return A2(_function, argA, argB);
	});
var $andre_dietrich$parser_combinators$Combine$bimap = F3(
	function (fok, ferr, p) {
		return $andre_dietrich$parser_combinators$Combine$Parser(
			F2(
				function (state, stream) {
					var _v0 = A3($andre_dietrich$parser_combinators$Combine$app, p, state, stream);
					if (_v0.c.$ === 'Ok') {
						var rstate = _v0.a;
						var rstream = _v0.b;
						var res = _v0.c.a;
						return _Utils_Tuple3(
							rstate,
							rstream,
							$elm$core$Result$Ok(
								fok(res)));
					} else {
						var estate = _v0.a;
						var estream = _v0.b;
						var ms = _v0.c.a;
						return _Utils_Tuple3(
							estate,
							estream,
							$elm$core$Result$Err(
								ferr(ms)));
					}
				}));
	});
var $andre_dietrich$parser_combinators$Combine$map = F2(
	function (f, p) {
		return A3($andre_dietrich$parser_combinators$Combine$bimap, f, $elm$core$Basics$identity, p);
	});
var $andre_dietrich$parser_combinators$Combine$andMap = F2(
	function (rp, lp) {
		return A2(
			$andre_dietrich$parser_combinators$Combine$andThen,
			A2($pilatch$flip$Flip$flip, $andre_dietrich$parser_combinators$Combine$map, rp),
			lp);
	});
var $andre_dietrich$parser_combinators$Combine$ignore = F2(
	function (p1, p2) {
		return A2(
			$andre_dietrich$parser_combinators$Combine$andMap,
			p1,
			A2($andre_dietrich$parser_combinators$Combine$map, $elm$core$Basics$always, p2));
	});
var $author$project$Lia$Markdown$Effect$Model$Model = F4(
	function (visible, effects, comments, javascript) {
		return {comments: comments, effects: effects, javascript: javascript, visible: visible};
	});
var $author$project$Lia$Markdown$Effect$Model$init = A4($author$project$Lia$Markdown$Effect$Model$Model, 0, 0, $elm$core$Dict$empty, $elm$core$Dict$empty);
var $author$project$Lia$Markdown$Footnote$Model$init = $elm$core$Dict$empty;
var $author$project$Lia$Parser$Context$init = F2(
	function (search_index, global) {
		return {
			code_vector: $elm$core$Array$empty,
			defines: global,
			defines_updated: false,
			effect_model: $author$project$Lia$Markdown$Effect$Model$init,
			effect_number: _List_fromArray(
				[0]),
			footnotes: $author$project$Lia$Markdown$Footnote$Model$init,
			identation: _List_Nil,
			identation_skip: false,
			quiz_vector: $elm$core$Array$empty,
			search_index: search_index,
			survey_vector: $elm$core$Array$empty,
			table_vector: $elm$core$Array$empty
		};
	});
var $andre_dietrich$parser_combinators$Combine$or = F2(
	function (lp, rp) {
		return $andre_dietrich$parser_combinators$Combine$Parser(
			F2(
				function (state, stream) {
					var _v0 = A3($andre_dietrich$parser_combinators$Combine$app, lp, state, stream);
					if (_v0.c.$ === 'Ok') {
						var res = _v0;
						return res;
					} else {
						var lms = _v0.c.a;
						var _v1 = A3($andre_dietrich$parser_combinators$Combine$app, rp, state, stream);
						if (_v1.c.$ === 'Ok') {
							var res = _v1;
							return res;
						} else {
							var rms = _v1.c.a;
							return _Utils_Tuple3(
								state,
								stream,
								$elm$core$Result$Err(
									_Utils_ap(lms, rms)));
						}
					}
				}));
	});
var $andre_dietrich$parser_combinators$Combine$keep = F2(
	function (p1, p2) {
		return A2(
			$andre_dietrich$parser_combinators$Combine$andMap,
			p1,
			A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$pilatch$flip$Flip$flip($elm$core$Basics$always),
				p2));
	});
var $andre_dietrich$parser_combinators$Combine$manyTill = F2(
	function (p, end_) {
		var accumulate = F3(
			function (acc, state, stream) {
				accumulate:
				while (true) {
					var _v0 = A3($andre_dietrich$parser_combinators$Combine$app, end_, state, stream);
					if (_v0.c.$ === 'Ok') {
						var rstate = _v0.a;
						var rstream = _v0.b;
						return _Utils_Tuple3(
							rstate,
							rstream,
							$elm$core$Result$Ok(
								$elm$core$List$reverse(acc)));
					} else {
						var estate = _v0.a;
						var estream = _v0.b;
						var ms = _v0.c.a;
						var _v1 = A3($andre_dietrich$parser_combinators$Combine$app, p, state, stream);
						if (_v1.c.$ === 'Ok') {
							var rstate = _v1.a;
							var rstream = _v1.b;
							var res = _v1.c.a;
							var $temp$acc = A2($elm$core$List$cons, res, acc),
								$temp$state = rstate,
								$temp$stream = rstream;
							acc = $temp$acc;
							state = $temp$state;
							stream = $temp$stream;
							continue accumulate;
						} else {
							return _Utils_Tuple3(
								estate,
								estream,
								$elm$core$Result$Err(ms));
						}
					}
				}
			});
		return $andre_dietrich$parser_combinators$Combine$Parser(
			accumulate(_List_Nil));
	});
var $elm$core$String$slice = _String_slice;
var $elm$core$String$dropLeft = F2(
	function (n, string) {
		return (n < 1) ? string : A3(
			$elm$core$String$slice,
			n,
			$elm$core$String$length(string),
			string);
	});
var $elm$core$String$startsWith = _String_startsWith;
var $andre_dietrich$parser_combinators$Combine$string = function (s) {
	return $andre_dietrich$parser_combinators$Combine$Parser(
		F2(
			function (state, stream) {
				if (A2($elm$core$String$startsWith, s, stream.input)) {
					var len = $elm$core$String$length(s);
					var pos = stream.position + len;
					var rem = A2($elm$core$String$dropLeft, len, stream.input);
					return _Utils_Tuple3(
						state,
						_Utils_update(
							stream,
							{input: rem, position: pos}),
						$elm$core$Result$Ok(s));
				} else {
					return _Utils_Tuple3(
						state,
						stream,
						$elm$core$Result$Err(
							_List_fromArray(
								['expected \"' + (s + '\"')])));
				}
			}));
};
var $author$project$Lia$Markdown$Inline$Parser$comment = function (p) {
	return A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		A2(
			$andre_dietrich$parser_combinators$Combine$manyTill,
			p,
			$andre_dietrich$parser_combinators$Combine$string('-->')),
		$andre_dietrich$parser_combinators$Combine$string('<!--'));
};
var $andre_dietrich$parser_combinators$Combine$emptyErr = $andre_dietrich$parser_combinators$Combine$Parser(
	F2(
		function (state, stream) {
			return _Utils_Tuple3(
				state,
				stream,
				$elm$core$Result$Err(_List_Nil));
		}));
var $andre_dietrich$parser_combinators$Combine$choice = function (xs) {
	return A3($elm$core$List$foldr, $andre_dietrich$parser_combinators$Combine$or, $andre_dietrich$parser_combinators$Combine$emptyErr, xs);
};
var $elm$core$Basics$composeR = F3(
	function (f, g, x) {
		return g(
			f(x));
	});
var $elm$regex$Regex$Match = F4(
	function (match, index, number, submatches) {
		return {index: index, match: match, number: number, submatches: submatches};
	});
var $elm$regex$Regex$fromStringWith = _Regex_fromStringWith;
var $elm$regex$Regex$fromString = function (string) {
	return A2(
		$elm$regex$Regex$fromStringWith,
		{caseInsensitive: false, multiline: false},
		string);
};
var $elm$regex$Regex$findAtMost = _Regex_findAtMost;
var $elm$regex$Regex$never = _Regex_never;
var $elm$core$Maybe$withDefault = F2(
	function (_default, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return value;
		} else {
			return _default;
		}
	});
var $andre_dietrich$parser_combinators$Combine$regexer = F5(
	function (input, output, pat, state, stream) {
		var pattern = A2($elm$core$String$startsWith, '^', pat) ? pat : ('^' + pat);
		var _v0 = A3(
			$elm$regex$Regex$findAtMost,
			1,
			A2(
				$elm$core$Maybe$withDefault,
				$elm$regex$Regex$never,
				input(pattern)),
			stream.input);
		if (_v0.b && (!_v0.b.b)) {
			var match = _v0.a;
			var len = $elm$core$String$length(match.match);
			var pos = stream.position + len;
			var rem = A2($elm$core$String$dropLeft, len, stream.input);
			return _Utils_Tuple3(
				state,
				_Utils_update(
					stream,
					{input: rem, position: pos}),
				$elm$core$Result$Ok(
					output(match)));
		} else {
			return _Utils_Tuple3(
				state,
				stream,
				$elm$core$Result$Err(
					_List_fromArray(
						['expected input matching Regexp /' + (pattern + '/')])));
		}
	});
var $andre_dietrich$parser_combinators$Combine$regex = A2(
	$elm$core$Basics$composeR,
	A2(
		$andre_dietrich$parser_combinators$Combine$regexer,
		$elm$regex$Regex$fromString,
		function ($) {
			return $.match;
		}),
	$andre_dietrich$parser_combinators$Combine$Parser);
var $andre_dietrich$parser_combinators$Combine$maybe = function (p) {
	return $andre_dietrich$parser_combinators$Combine$Parser(
		F2(
			function (state, stream) {
				var _v0 = A3($andre_dietrich$parser_combinators$Combine$app, p, state, stream);
				if (_v0.c.$ === 'Ok') {
					var rstate = _v0.a;
					var rstream = _v0.b;
					var res = _v0.c.a;
					return _Utils_Tuple3(
						rstate,
						rstream,
						$elm$core$Result$Ok(
							$elm$core$Maybe$Just(res)));
				} else {
					return _Utils_Tuple3(
						state,
						stream,
						$elm$core$Result$Ok($elm$core$Maybe$Nothing));
				}
			}));
};
var $author$project$Lia$Definition$Parser$start = $andre_dietrich$parser_combinators$Combine$maybe(
	$andre_dietrich$parser_combinators$Combine$string('@'));
var $author$project$Lia$Definition$Parser$key = A2(
	$andre_dietrich$parser_combinators$Combine$keep,
	$andre_dietrich$parser_combinators$Combine$regex('\\w+[\\w\\-.\\d]*'),
	$author$project$Lia$Definition$Parser$start);
var $elm$core$Tuple$pair = F2(
	function (a, b) {
		return _Utils_Tuple2(a, b);
	});
var $elm$core$String$concat = function (strings) {
	return A2($elm$core$String$join, '', strings);
};
var $elm$core$List$intersperse = F2(
	function (sep, xs) {
		if (!xs.b) {
			return _List_Nil;
		} else {
			var hd = xs.a;
			var tl = xs.b;
			var step = F2(
				function (x, rest) {
					return A2(
						$elm$core$List$cons,
						sep,
						A2($elm$core$List$cons, x, rest));
				});
			var spersed = A3($elm$core$List$foldr, step, _List_Nil, tl);
			return A2($elm$core$List$cons, hd, spersed);
		}
	});
var $elm$core$String$words = _String_words;
var $author$project$Lia$Definition$Parser$reduce = A2(
	$elm$core$Basics$composeR,
	$elm$core$String$words,
	A2(
		$elm$core$Basics$composeR,
		$elm$core$List$intersperse(' '),
		$elm$core$String$concat));
var $author$project$Lia$Definition$Parser$lines = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$author$project$Lia$Definition$Parser$reduce,
	$andre_dietrich$parser_combinators$Combine$regex('([ \\t].*|[ \\t]*\\n)+'));
var $andre_dietrich$parser_combinators$Combine$mapError = $andre_dietrich$parser_combinators$Combine$bimap($elm$core$Basics$identity);
var $andre_dietrich$parser_combinators$Combine$onerror = F2(
	function (m, p) {
		return A2(
			$andre_dietrich$parser_combinators$Combine$mapError,
			$elm$core$Basics$always(
				_List_fromArray(
					[m])),
			p);
	});
var $andre_dietrich$parser_combinators$Combine$primitive = $andre_dietrich$parser_combinators$Combine$Parser;
var $andre_dietrich$parser_combinators$Combine$Char$satisfy = function (pred) {
	return $andre_dietrich$parser_combinators$Combine$primitive(
		F2(
			function (state, stream) {
				var message = 'could not satisfy predicate';
				var _v0 = $elm$core$String$uncons(stream.input);
				if (_v0.$ === 'Just') {
					var _v1 = _v0.a;
					var h = _v1.a;
					var rest = _v1.b;
					return pred(h) ? _Utils_Tuple3(
						state,
						_Utils_update(
							stream,
							{input: rest, position: stream.position + 1}),
						$elm$core$Result$Ok(h)) : _Utils_Tuple3(
						state,
						stream,
						$elm$core$Result$Err(
							_List_fromArray(
								[message])));
				} else {
					return _Utils_Tuple3(
						state,
						stream,
						$elm$core$Result$Err(
							_List_fromArray(
								[message])));
				}
			}));
};
var $andre_dietrich$parser_combinators$Combine$Char$anyChar = A2(
	$andre_dietrich$parser_combinators$Combine$onerror,
	'expected any character',
	$andre_dietrich$parser_combinators$Combine$Char$satisfy(
		$elm$core$Basics$always(true)));
var $elm$core$String$fromList = _String_fromList;
var $author$project$Lia$Parser$Helper$stringTill = function (p) {
	return A2(
		$andre_dietrich$parser_combinators$Combine$map,
		$elm$core$String$fromList,
		A2($andre_dietrich$parser_combinators$Combine$manyTill, $andre_dietrich$parser_combinators$Combine$Char$anyChar, p));
};
var $author$project$Lia$Definition$Parser$multiline = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	function (x) {
		return A2($elm$core$String$startsWith, '\n', x) ? (' ' + x) : x;
	},
	$author$project$Lia$Parser$Helper$stringTill(
		$andre_dietrich$parser_combinators$Combine$string('\n@end')));
var $author$project$Lia$Definition$Parser$value = A2(
	$andre_dietrich$parser_combinators$Combine$or,
	A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		$author$project$Lia$Definition$Parser$lines,
		$andre_dietrich$parser_combinators$Combine$regex('[\\t ]*:')),
	A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		$author$project$Lia$Definition$Parser$multiline,
		$andre_dietrich$parser_combinators$Combine$regex('[\t ]*\\n')));
var $author$project$Lia$Definition$Parser$key_value = A2(
	$andre_dietrich$parser_combinators$Combine$andMap,
	$author$project$Lia$Definition$Parser$value,
	A2($andre_dietrich$parser_combinators$Combine$map, $elm$core$Tuple$pair, $author$project$Lia$Definition$Parser$key));
var $andre_dietrich$parser_combinators$Combine$onsuccess = function (res) {
	return $andre_dietrich$parser_combinators$Combine$map(
		$elm$core$Basics$always(res));
};
var $andre_dietrich$parser_combinators$Combine$skip = function (p) {
	return A2($andre_dietrich$parser_combinators$Combine$onsuccess, _Utils_Tuple0, p);
};
var $author$project$Lia$Definition$Types$Link = function (a) {
	return {$: 'Link', a: a};
};
var $author$project$Lia$Definition$Types$Script = function (a) {
	return {$: 'Script', a: a};
};
var $author$project$Lia$Markdown$Macro$Parser$add = F2(
	function (_v0, def) {
		var name = _v0.a;
		var code = _v0.b;
		return _Utils_update(
			def,
			{
				macro: A3($elm$core$Dict$insert, name, code, def.macro)
			});
	});
var $author$project$Lia$Definition$Types$toURL = F2(
	function (basis, url) {
		return A2($elm$core$String$startsWith, 'http', url) ? url : _Utils_ap(basis, url);
	});
var $author$project$Lia$Definition$Types$append = F4(
	function (to, base, urls, list) {
		return A2(
			$elm$core$List$append,
			list,
			A2(
				$elm$core$List$map,
				A2(
					$elm$core$Basics$composeR,
					$author$project$Lia$Definition$Types$toURL(base),
					to),
				$elm$core$String$words(urls)));
	});
var $author$project$Lia$Definition$Types$addToResources = F3(
	function (to, urls, def) {
		return _Utils_update(
			def,
			{
				resources: A4($author$project$Lia$Definition$Types$append, to, def.base, urls, def.resources)
			});
	});
var $elm$core$List$head = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(x);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Lia$Parser$PatReplace$regex = A2(
	$elm$core$Basics$composeR,
	$elm$regex$Regex$fromString,
	$elm$core$Maybe$withDefault($elm$regex$Regex$never));
var $author$project$Lia$Parser$PatReplace$check = F2(
	function (pattern, url) {
		var _v0 = A3(
			$elm$regex$Regex$findAtMost,
			1,
			$author$project$Lia$Parser$PatReplace$regex(pattern),
			url);
		if (_v0.b && (!_v0.b.b)) {
			var match = _v0.a;
			return A2(
				$elm$core$Maybe$withDefault,
				$elm$core$Maybe$Nothing,
				$elm$core$List$head(match.submatches));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $author$project$Lia$Parser$PatReplace$replace = F2(
	function (patterns, url) {
		replace:
		while (true) {
			if (!patterns.b) {
				return _Utils_Tuple2(false, url);
			} else {
				var t = patterns.a;
				var ts = patterns.b;
				var _v1 = A2($author$project$Lia$Parser$PatReplace$check, t.pattern, url);
				if (_v1.$ === 'Just') {
					var str = _v1.a;
					return _Utils_Tuple2(
						true,
						t.by(str));
				} else {
					var $temp$patterns = ts,
						$temp$url = url;
					patterns = $temp$patterns;
					url = $temp$url;
					continue replace;
				}
			}
		}
	});
var $elm$core$String$replace = F3(
	function (before, after, string) {
		return A2(
			$elm$core$String$join,
			after,
			A2($elm$core$String$split, before, string));
	});
var $elm$core$Tuple$second = function (_v0) {
	var y = _v0.b;
	return y;
};
var $author$project$Lia$Parser$PatReplace$link = A2(
	$elm$core$Basics$composeR,
	$author$project$Lia$Parser$PatReplace$replace(
		_List_fromArray(
			[
				{
				by: function (w) {
					return 'https://raw.githubusercontent.com/' + function () {
						var _v0 = A2($elm$core$String$split, '/', w);
						_v0$2:
						while (true) {
							if (_v0.b && _v0.b.b) {
								if (!_v0.b.b.b) {
									var _v1 = _v0.b;
									return w + '/master/README.md';
								} else {
									if (_v0.b.b.a === 'tree') {
										var _v2 = _v0.b;
										var _v3 = _v2.b;
										return A3($elm$core$String$replace, '/tree/', '/', w) + '/README.md';
									} else {
										break _v0$2;
									}
								}
							} else {
								break _v0$2;
							}
						}
						return A3($elm$core$String$replace, '/blob/', '/', w);
					}();
				},
				pattern: '(?:http(?:s)?://)?(?:www\\.)?github\\.com/(.*)'
			},
				{
				by: function (w) {
					return 'https://dl.dropbox.com/s/' + w;
				},
				pattern: '(?:http(?:s)?://)?www\\.dropbox\\.com/s/(.*)'
			}
			])),
	$elm$core$Tuple$second);
var $author$project$Lia$Definition$Types$add_imports = F2(
	function (url, def) {
		return _Utils_update(
			def,
			{
				imports: A4($author$project$Lia$Definition$Types$append, $author$project$Lia$Parser$PatReplace$link, def.base, url, def.imports)
			});
	});
var $author$project$Lia$Definition$Types$add_translation = F2(
	function (str, def) {
		var _v0 = $elm$core$String$words(str);
		if ((_v0.b && _v0.b.b) && (!_v0.b.b.b)) {
			var lang = _v0.a;
			var _v1 = _v0.b;
			var url = _v1.a;
			return _Utils_update(
				def,
				{
					translation: A3(
						$elm$core$Dict$insert,
						lang,
						A2($author$project$Lia$Definition$Types$toURL, def.base, url),
						def.translation)
				});
		} else {
			return def;
		}
	});
var $author$project$Lia$Markdown$Inline$Types$Chars = F2(
	function (a, b) {
		return {$: 'Chars', a: a, b: b};
	});
var $author$project$Lia$Markdown$Inline$Parser$combine = function (list) {
	combine:
	while (true) {
		if (!list.b) {
			return _List_Nil;
		} else {
			if (!list.b.b) {
				var xs = list.a;
				return _List_fromArray(
					[xs]);
			} else {
				var x1 = list.a;
				var _v1 = list.b;
				var x2 = _v1.a;
				var xs = _v1.b;
				var _v2 = _Utils_Tuple2(x1, x2);
				if ((((_v2.a.$ === 'Chars') && (_v2.a.b.$ === 'Nothing')) && (_v2.b.$ === 'Chars')) && (_v2.b.b.$ === 'Nothing')) {
					var _v3 = _v2.a;
					var str1 = _v3.a;
					var _v4 = _v3.b;
					var _v5 = _v2.b;
					var str2 = _v5.a;
					var _v6 = _v5.b;
					var $temp$list = A2(
						$elm$core$List$cons,
						A2(
							$author$project$Lia$Markdown$Inline$Types$Chars,
							_Utils_ap(str1, str2),
							$elm$core$Maybe$Nothing),
						xs);
					list = $temp$list;
					continue combine;
				} else {
					return A2(
						$elm$core$List$cons,
						x1,
						$author$project$Lia$Markdown$Inline$Parser$combine(
							A2($elm$core$List$cons, x2, xs)));
				}
			}
		}
	}
};
var $author$project$Lia$Markdown$Inline$Types$Audio = F3(
	function (a, b, c) {
		return {$: 'Audio', a: a, b: b, c: c};
	});
var $author$project$Lia$Markdown$Inline$Types$Bold = F2(
	function (a, b) {
		return {$: 'Bold', a: a, b: b};
	});
var $author$project$Lia$Markdown$Inline$Types$Embed = F3(
	function (a, b, c) {
		return {$: 'Embed', a: a, b: b, c: c};
	});
var $author$project$Lia$Markdown$Inline$Types$IHTML = F2(
	function (a, b) {
		return {$: 'IHTML', a: a, b: b};
	});
var $author$project$Lia$Markdown$Inline$Types$Image = F3(
	function (a, b, c) {
		return {$: 'Image', a: a, b: b, c: c};
	});
var $author$project$Lia$Markdown$Inline$Types$Italic = F2(
	function (a, b) {
		return {$: 'Italic', a: a, b: b};
	});
var $author$project$Lia$Markdown$Inline$Types$Link = F3(
	function (a, b, c) {
		return {$: 'Link', a: a, b: b, c: c};
	});
var $author$project$Lia$Markdown$Inline$Types$Mail = F3(
	function (a, b, c) {
		return {$: 'Mail', a: a, b: b, c: c};
	});
var $author$project$Lia$Markdown$Inline$Types$Movie = F3(
	function (a, b, c) {
		return {$: 'Movie', a: a, b: b, c: c};
	});
var $author$project$Lia$Markdown$Inline$Types$Ref = F2(
	function (a, b) {
		return {$: 'Ref', a: a, b: b};
	});
var $author$project$Lia$Markdown$Inline$Types$Strike = F2(
	function (a, b) {
		return {$: 'Strike', a: a, b: b};
	});
var $author$project$Lia$Markdown$Inline$Types$Superscript = F2(
	function (a, b) {
		return {$: 'Superscript', a: a, b: b};
	});
var $author$project$Lia$Markdown$Inline$Types$Underline = F2(
	function (a, b) {
		return {$: 'Underline', a: a, b: b};
	});
var $elm$core$Dict$get = F2(
	function (targetKey, dict) {
		get:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return $elm$core$Maybe$Nothing;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var _v1 = A2($elm$core$Basics$compare, targetKey, key);
				switch (_v1.$) {
					case 'LT':
						var $temp$targetKey = targetKey,
							$temp$dict = left;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
					case 'EQ':
						return $elm$core$Maybe$Just(value);
					default:
						var $temp$targetKey = targetKey,
							$temp$dict = right;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
				}
			}
		}
	});
var $author$project$Lia$Markdown$Inline$Parser$attr_ = function (dict) {
	return A3(
		$elm$core$Dict$insert,
		'style',
		function () {
			var _v0 = A2($elm$core$Dict$get, 'style', dict);
			if (_v0.$ === 'Just') {
				var value = _v0.a;
				return 'display: inline-block;' + value;
			} else {
				return 'display: inline-block;';
			}
		}(),
		dict);
};
var $elm$core$String$toLower = _String_toLower;
var $andre_dietrich$parser_combinators$Combine$whitespace = A2(
	$andre_dietrich$parser_combinators$Combine$onerror,
	'optional whitespace',
	$andre_dietrich$parser_combinators$Combine$regex('\\s*'));
var $author$project$Lia$Markdown$Inline$Parser$attribute = A2(
	$andre_dietrich$parser_combinators$Combine$andMap,
	$author$project$Lia$Parser$Helper$stringTill(
		$andre_dietrich$parser_combinators$Combine$regex('\"[ \t\n]*')),
	A2(
		$andre_dietrich$parser_combinators$Combine$map,
		F2(
			function (k, v) {
				return _Utils_Tuple2(
					$elm$core$String$toLower(k),
					v);
			}),
		A2(
			$andre_dietrich$parser_combinators$Combine$ignore,
			$andre_dietrich$parser_combinators$Combine$regex('[ \t\n]*=[ \t\n]*\"'),
			A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				$andre_dietrich$parser_combinators$Combine$regex('\\w+'),
				$andre_dietrich$parser_combinators$Combine$whitespace))));
var $author$project$Lia$Markdown$Effect$Model$Element = F3(
	function (narrator, comment, paragraphs) {
		return {comment: comment, narrator: narrator, paragraphs: paragraphs};
	});
var $elm$core$Array$fromListHelp = F3(
	function (list, nodeList, nodeListSize) {
		fromListHelp:
		while (true) {
			var _v0 = A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, list);
			var jsArray = _v0.a;
			var remainingItems = _v0.b;
			if (_Utils_cmp(
				$elm$core$Elm$JsArray$length(jsArray),
				$elm$core$Array$branchFactor) < 0) {
				return A2(
					$elm$core$Array$builderToArray,
					true,
					{nodeList: nodeList, nodeListSize: nodeListSize, tail: jsArray});
			} else {
				var $temp$list = remainingItems,
					$temp$nodeList = A2(
					$elm$core$List$cons,
					$elm$core$Array$Leaf(jsArray),
					nodeList),
					$temp$nodeListSize = nodeListSize + 1;
				list = $temp$list;
				nodeList = $temp$nodeList;
				nodeListSize = $temp$nodeListSize;
				continue fromListHelp;
			}
		}
	});
var $elm$core$Array$fromList = function (list) {
	if (!list.b) {
		return $elm$core$Array$empty;
	} else {
		return A3($elm$core$Array$fromListHelp, list, _List_Nil, 0);
	}
};
var $elm$core$Array$length = function (_v0) {
	var len = _v0.a;
	return len;
};
var $andre_dietrich$parser_combinators$Combine$succeed = function (res) {
	return $andre_dietrich$parser_combinators$Combine$Parser(
		F2(
			function (state, stream) {
				return _Utils_Tuple3(
					state,
					stream,
					$elm$core$Result$Ok(res));
			}));
};
var $andre_dietrich$parser_combinators$Combine$withState = function (f) {
	return $andre_dietrich$parser_combinators$Combine$Parser(
		F2(
			function (state, stream) {
				return A3(
					$andre_dietrich$parser_combinators$Combine$app,
					f(state),
					state,
					stream);
			}));
};
var $author$project$Lia$Markdown$Effect$Parser$get_counter = function (idx) {
	return $andre_dietrich$parser_combinators$Combine$withState(
		function (s) {
			return $andre_dietrich$parser_combinators$Combine$succeed(
				function () {
					var _v0 = A2($elm$core$Dict$get, idx, s.effect_model.comments);
					if (_v0.$ === 'Just') {
						var e = _v0.a;
						return $elm$core$Array$length(e.paragraphs) - 1;
					} else {
						return 0;
					}
				}());
		});
};
var $elm$core$Maybe$map = F2(
	function (f, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return $elm$core$Maybe$Just(
				f(value));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $andre_dietrich$parser_combinators$Combine$modifyState = function (f) {
	return $andre_dietrich$parser_combinators$Combine$Parser(
		F2(
			function (state, stream) {
				return A3(
					$andre_dietrich$parser_combinators$Combine$app,
					$andre_dietrich$parser_combinators$Combine$succeed(_Utils_Tuple0),
					f(state),
					stream);
			}));
};
var $elm$core$Elm$JsArray$push = _JsArray_push;
var $elm$core$Bitwise$shiftRightZfBy = _Bitwise_shiftRightZfBy;
var $elm$core$Array$bitMask = 4294967295 >>> (32 - $elm$core$Array$shiftStep);
var $elm$core$Basics$ge = _Utils_ge;
var $elm$core$Elm$JsArray$singleton = _JsArray_singleton;
var $elm$core$Elm$JsArray$unsafeGet = _JsArray_unsafeGet;
var $elm$core$Elm$JsArray$unsafeSet = _JsArray_unsafeSet;
var $elm$core$Array$insertTailInTree = F4(
	function (shift, index, tail, tree) {
		var pos = $elm$core$Array$bitMask & (index >>> shift);
		if (_Utils_cmp(
			pos,
			$elm$core$Elm$JsArray$length(tree)) > -1) {
			if (shift === 5) {
				return A2(
					$elm$core$Elm$JsArray$push,
					$elm$core$Array$Leaf(tail),
					tree);
			} else {
				var newSub = $elm$core$Array$SubTree(
					A4($elm$core$Array$insertTailInTree, shift - $elm$core$Array$shiftStep, index, tail, $elm$core$Elm$JsArray$empty));
				return A2($elm$core$Elm$JsArray$push, newSub, tree);
			}
		} else {
			var value = A2($elm$core$Elm$JsArray$unsafeGet, pos, tree);
			if (value.$ === 'SubTree') {
				var subTree = value.a;
				var newSub = $elm$core$Array$SubTree(
					A4($elm$core$Array$insertTailInTree, shift - $elm$core$Array$shiftStep, index, tail, subTree));
				return A3($elm$core$Elm$JsArray$unsafeSet, pos, newSub, tree);
			} else {
				var newSub = $elm$core$Array$SubTree(
					A4(
						$elm$core$Array$insertTailInTree,
						shift - $elm$core$Array$shiftStep,
						index,
						tail,
						$elm$core$Elm$JsArray$singleton(value)));
				return A3($elm$core$Elm$JsArray$unsafeSet, pos, newSub, tree);
			}
		}
	});
var $elm$core$Bitwise$shiftLeftBy = _Bitwise_shiftLeftBy;
var $elm$core$Array$unsafeReplaceTail = F2(
	function (newTail, _v0) {
		var len = _v0.a;
		var startShift = _v0.b;
		var tree = _v0.c;
		var tail = _v0.d;
		var originalTailLen = $elm$core$Elm$JsArray$length(tail);
		var newTailLen = $elm$core$Elm$JsArray$length(newTail);
		var newArrayLen = len + (newTailLen - originalTailLen);
		if (_Utils_eq(newTailLen, $elm$core$Array$branchFactor)) {
			var overflow = _Utils_cmp(newArrayLen >>> $elm$core$Array$shiftStep, 1 << startShift) > 0;
			if (overflow) {
				var newShift = startShift + $elm$core$Array$shiftStep;
				var newTree = A4(
					$elm$core$Array$insertTailInTree,
					newShift,
					len,
					newTail,
					$elm$core$Elm$JsArray$singleton(
						$elm$core$Array$SubTree(tree)));
				return A4($elm$core$Array$Array_elm_builtin, newArrayLen, newShift, newTree, $elm$core$Elm$JsArray$empty);
			} else {
				return A4(
					$elm$core$Array$Array_elm_builtin,
					newArrayLen,
					startShift,
					A4($elm$core$Array$insertTailInTree, startShift, len, newTail, tree),
					$elm$core$Elm$JsArray$empty);
			}
		} else {
			return A4($elm$core$Array$Array_elm_builtin, newArrayLen, startShift, tree, newTail);
		}
	});
var $elm$core$Array$push = F2(
	function (a, array) {
		var tail = array.d;
		return A2(
			$elm$core$Array$unsafeReplaceTail,
			A2($elm$core$Elm$JsArray$push, a, tail),
			array);
	});
var $author$project$Lia$Markdown$HTML$Types$getContent = function (_v0) {
	var content = _v0.c;
	return content;
};
var $author$project$Lia$Markdown$Inline$Stringify$inline2string = function (inline) {
	inline2string:
	while (true) {
		switch (inline.$) {
			case 'Chars':
				var str = inline.a;
				return str;
			case 'Bold':
				var x = inline.a;
				var $temp$inline = x;
				inline = $temp$inline;
				continue inline2string;
			case 'Italic':
				var x = inline.a;
				var $temp$inline = x;
				inline = $temp$inline;
				continue inline2string;
			case 'Strike':
				var x = inline.a;
				var $temp$inline = x;
				inline = $temp$inline;
				continue inline2string;
			case 'Underline':
				var x = inline.a;
				var $temp$inline = x;
				inline = $temp$inline;
				continue inline2string;
			case 'Superscript':
				var x = inline.a;
				var $temp$inline = x;
				inline = $temp$inline;
				continue inline2string;
			case 'Verbatim':
				var str = inline.a;
				return str;
			case 'Formula':
				var str = inline.b;
				return str;
			case 'Ref':
				var ref = inline.a;
				return $author$project$Lia$Markdown$Inline$Stringify$ref2string(ref);
			case 'EInline':
				var inlines = inline.c;
				return $author$project$Lia$Markdown$Inline$Stringify$stringify(inlines);
			case 'Container':
				var inlines = inline.a;
				return $author$project$Lia$Markdown$Inline$Stringify$stringify(inlines);
			case 'IHTML':
				var node = inline.a;
				return $author$project$Lia$Markdown$Inline$Stringify$stringify(
					$author$project$Lia$Markdown$HTML$Types$getContent(node));
			default:
				return '';
		}
	}
};
var $author$project$Lia$Markdown$Inline$Stringify$ref2string = function (ref) {
	switch (ref.$) {
		case 'Movie':
			var alt = ref.a;
			return $author$project$Lia$Markdown$Inline$Stringify$stringify(alt);
		case 'Image':
			var alt = ref.a;
			return $author$project$Lia$Markdown$Inline$Stringify$stringify(alt);
		case 'Audio':
			var alt = ref.a;
			return $author$project$Lia$Markdown$Inline$Stringify$stringify(alt);
		case 'Link':
			var alt = ref.a;
			return $author$project$Lia$Markdown$Inline$Stringify$stringify(alt);
		case 'Mail':
			var alt = ref.a;
			return $author$project$Lia$Markdown$Inline$Stringify$stringify(alt);
		default:
			var alt = ref.a;
			return $author$project$Lia$Markdown$Inline$Stringify$stringify(alt);
	}
};
var $author$project$Lia$Markdown$Inline$Stringify$stringify = function (inlines) {
	return $elm$core$String$concat(
		A2($elm$core$List$map, $author$project$Lia$Markdown$Inline$Stringify$inline2string, inlines));
};
var $author$project$Lia$Markdown$Effect$Parser$add_comment = F2(
	function (visible, _v0) {
		var idx = _v0.a;
		var temp_narrator = _v0.b;
		var par = _v0.c;
		var rslt = function (id2) {
			return $andre_dietrich$parser_combinators$Combine$succeed(
				_Utils_Tuple2(idx, id2));
		};
		var mod = function (s) {
			var narrator = A2(
				$elm$core$Maybe$withDefault,
				s.defines.narrator,
				A2($elm$core$Maybe$map, $elm$core$String$trim, temp_narrator));
			return _Utils_update(
				s,
				{
					effect_model: function () {
						var e = s.effect_model;
						return _Utils_update(
							e,
							{
								comments: function () {
									var _v1 = A2($elm$core$Dict$get, idx, e.comments);
									if (_v1.$ === 'Just') {
										var cmt = _v1.a;
										return A3(
											$elm$core$Dict$insert,
											idx,
											visible ? _Utils_update(
												cmt,
												{
													comment: cmt.comment + ('\n' + $author$project$Lia$Markdown$Inline$Stringify$stringify(par)),
													paragraphs: A2(
														$elm$core$Array$push,
														_Utils_Tuple2($elm$core$Maybe$Nothing, par),
														cmt.paragraphs)
												}) : _Utils_update(
												cmt,
												{
													comment: cmt.comment + ('\n' + $author$project$Lia$Markdown$Inline$Stringify$stringify(par))
												}),
											e.comments);
									} else {
										return A3(
											$elm$core$Dict$insert,
											idx,
											A3(
												$author$project$Lia$Markdown$Effect$Model$Element,
												narrator,
												$author$project$Lia$Markdown$Inline$Stringify$stringify(par),
												$elm$core$Array$fromList(
													visible ? _List_fromArray(
														[
															_Utils_Tuple2($elm$core$Maybe$Nothing, par)
														]) : _List_Nil)),
											e.comments);
									}
								}()
							});
					}()
				});
		};
		return A2(
			$andre_dietrich$parser_combinators$Combine$andThen,
			rslt,
			A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				$author$project$Lia$Markdown$Effect$Parser$get_counter(idx),
				$andre_dietrich$parser_combinators$Combine$modifyState(mod)));
	});
var $elm$core$String$toInt = _String_toInt;
var $andre_dietrich$parser_combinators$Combine$fail = function (m) {
	return $andre_dietrich$parser_combinators$Combine$Parser(
		F2(
			function (state, stream) {
				return _Utils_Tuple3(
					state,
					stream,
					$elm$core$Result$Err(
						_List_fromArray(
							[m])));
			}));
};
var $andre_dietrich$parser_combinators$Combine$Num$unwrap = function (value) {
	if (value.$ === 'Just') {
		var v = value.a;
		return $andre_dietrich$parser_combinators$Combine$succeed(v);
	} else {
		return $andre_dietrich$parser_combinators$Combine$fail('impossible state in Combine.Num.unwrap');
	}
};
var $andre_dietrich$parser_combinators$Combine$Num$int = A2(
	$andre_dietrich$parser_combinators$Combine$onerror,
	'expected an int',
	A2(
		$andre_dietrich$parser_combinators$Combine$andThen,
		$andre_dietrich$parser_combinators$Combine$Num$unwrap,
		A2(
			$andre_dietrich$parser_combinators$Combine$map,
			$elm$core$String$toInt,
			$andre_dietrich$parser_combinators$Combine$regex('-?(?:0|[1-9]\\d*)'))));
var $author$project$Lia$Markdown$Effect$Parser$effect_number = function () {
	var state = function (n) {
		return A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			$andre_dietrich$parser_combinators$Combine$succeed(n),
			$andre_dietrich$parser_combinators$Combine$modifyState(
				function (s) {
					return _Utils_update(
						s,
						{
							effect_model: function () {
								if (_Utils_cmp(n, s.effect_model.effects) > 0) {
									var e = s.effect_model;
									return _Utils_update(
										e,
										{effects: n});
								} else {
									return s.effect_model;
								}
							}(),
							effect_number: A2($elm$core$List$cons, n, s.effect_number)
						});
				}));
	};
	return A2($andre_dietrich$parser_combinators$Combine$andThen, state, $andre_dietrich$parser_combinators$Combine$Num$int);
}();
var $author$project$Lia$Parser$Helper$c_frame = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$elm$core$String$length,
	$andre_dietrich$parser_combinators$Combine$regex('`{3,}'));
var $author$project$Lia$Parser$Context$par_ = function (s) {
	return _Utils_eq(s.identation, _List_Nil) ? $andre_dietrich$parser_combinators$Combine$succeed(_Utils_Tuple0) : (s.identation_skip ? $andre_dietrich$parser_combinators$Combine$skip(
		$andre_dietrich$parser_combinators$Combine$succeed(_Utils_Tuple0)) : $andre_dietrich$parser_combinators$Combine$skip(
		$andre_dietrich$parser_combinators$Combine$regex(
			$elm$core$String$concat(s.identation))));
};
var $author$project$Lia$Parser$Context$skip_ = F2(
	function (bool, state) {
		return _Utils_update(
			state,
			{identation_skip: bool});
	});
var $author$project$Lia$Parser$Context$indentation = A2(
	$andre_dietrich$parser_combinators$Combine$ignore,
	$andre_dietrich$parser_combinators$Combine$modifyState(
		$author$project$Lia$Parser$Context$skip_(false)),
	$andre_dietrich$parser_combinators$Combine$withState($author$project$Lia$Parser$Context$par_));
var $elm$core$List$singleton = function (value) {
	return _List_fromArray(
		[value]);
};
var $author$project$Lia$Markdown$Macro$Parser$code_block = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	A2($elm$core$Basics$composeR, $elm$core$String$concat, $elm$core$List$singleton),
	A2(
		$andre_dietrich$parser_combinators$Combine$manyTill,
		A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			$andre_dietrich$parser_combinators$Combine$regex('(.(?!```))*\\n?'),
			$andre_dietrich$parser_combinators$Combine$maybe($author$project$Lia$Parser$Context$indentation)),
		A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			$author$project$Lia$Parser$Helper$c_frame,
			$andre_dietrich$parser_combinators$Combine$maybe($author$project$Lia$Parser$Context$indentation))));
var $author$project$Lia$Markdown$Macro$Parser$debugEnvironment = F2(
	function (env, code) {
		return env ? ('<pre id=\'ls\'><code style=\'background: #CCCCCC; white-space: pre;\'>' + (code + '</code></pre>')) : code;
	});
var $elm$regex$Regex$replace = _Regex_replaceAtMost(_Regex_infinity);
var $author$project$Lia$Markdown$Macro$Parser$debugReplace = F3(
	function (pat, fn, string) {
		var _v0 = $elm$regex$Regex$fromString(pat);
		if (_v0.$ === 'Just') {
			var regex = _v0.a;
			return A3($elm$regex$Regex$replace, regex, fn, string);
		} else {
			return string;
		}
	});
var $elm$core$Basics$neq = _Utils_notEqual;
var $author$project$Lia$Markdown$Macro$Parser$debug = function (env) {
	return A2(
		$elm$core$Basics$composeR,
		A2(
			$author$project$Lia$Markdown$Macro$Parser$debugReplace,
			'[*+`{}#^|$\\[\\]]',
			A2(
				$elm$core$Basics$composeR,
				function ($) {
					return $.match;
				},
				$elm$core$Basics$append('\\'))),
		A2(
			$elm$core$Basics$composeR,
			A2($elm$core$String$replace, '<', '\\<'),
			A2(
				$elm$core$Basics$composeR,
				A2($elm$core$String$replace, '>', '\\>'),
				A2(
					$elm$core$Basics$composeR,
					A2($elm$core$String$replace, '\\\\`', '`'),
					A2(
						$elm$core$Basics$composeR,
						A2($elm$core$String$replace, '\n', '<br id=\'ls\'>'),
						A2(
							$elm$core$Basics$composeR,
							A2(
								$author$project$Lia$Markdown$Macro$Parser$debugReplace,
								'@[a-zA-Z]+[\\w\\d._\\-]*',
								function (x) {
									return (x.match !== '@input') ? ('@-' + x.match) : x.match;
								}),
							A2(
								$elm$core$Basics$composeR,
								A2($elm$core$String$replace, '\\<br id=\'ls\'\\>', '<br id=\'ls\'>'),
								$author$project$Lia$Markdown$Macro$Parser$debugEnvironment(env))))))));
};
var $author$project$Lia$Markdown$Macro$Parser$get = F2(
	function (name, def) {
		var _v0 = A2($elm$core$String$startsWith, '@@', name) ? _Utils_Tuple3(
			true,
			true,
			A2($elm$core$String$dropLeft, 2, name)) : (A2($elm$core$String$startsWith, '@-@', name) ? _Utils_Tuple3(
			true,
			false,
			A2($elm$core$String$dropLeft, 3, name)) : _Utils_Tuple3(
			false,
			false,
			A2($elm$core$String$dropLeft, 1, name)));
		var isDebug = _v0.a;
		var deepDebug = _v0.b;
		var id = _v0.c;
		return A2(
			$elm$core$Maybe$map,
			function (x) {
				return _Utils_Tuple3(isDebug, deepDebug, x);
			},
			function () {
				switch (id) {
					case 'author':
						return $elm$core$Maybe$Just(def.author);
					case 'date':
						return $elm$core$Maybe$Just(def.date);
					case 'email':
						return $elm$core$Maybe$Just(def.email);
					case 'version':
						return $elm$core$Maybe$Just(def.version);
					case 'section':
						return $elm$core$Maybe$Just(
							$elm$core$String$fromInt(def.section));
					case 'uid':
						return $elm$core$Maybe$Just(
							$elm$core$String$fromInt(def.section) + ('_' + $elm$core$String$fromInt(def.uid)));
					default:
						return A2($elm$core$Dict$get, id, def.macro);
				}
			}());
	});
var $elm$core$String$lines = _String_lines;
var $andre_dietrich$parser_combinators$Combine$many = function (p) {
	var accumulate = F3(
		function (acc, state, stream) {
			accumulate:
			while (true) {
				var _v0 = A3($andre_dietrich$parser_combinators$Combine$app, p, state, stream);
				if (_v0.c.$ === 'Ok') {
					var rstate = _v0.a;
					var rstream = _v0.b;
					var res = _v0.c.a;
					if (_Utils_eq(stream, rstream)) {
						return _Utils_Tuple3(
							rstate,
							rstream,
							$elm$core$List$reverse(acc));
					} else {
						var $temp$acc = A2($elm$core$List$cons, res, acc),
							$temp$state = rstate,
							$temp$stream = rstream;
						acc = $temp$acc;
						state = $temp$state;
						stream = $temp$stream;
						continue accumulate;
					}
				} else {
					return _Utils_Tuple3(
						state,
						stream,
						$elm$core$List$reverse(acc));
				}
			}
		});
	return $andre_dietrich$parser_combinators$Combine$Parser(
		F2(
			function (state, stream) {
				var _v1 = A3(accumulate, _List_Nil, state, stream);
				var rstate = _v1.a;
				var rstream = _v1.b;
				var res = _v1.c;
				return _Utils_Tuple3(
					rstate,
					rstream,
					$elm$core$Result$Ok(res));
			}));
};
var $andre_dietrich$parser_combinators$Combine$many1 = function (p) {
	return A2(
		$andre_dietrich$parser_combinators$Combine$andMap,
		$andre_dietrich$parser_combinators$Combine$many(p),
		A2($andre_dietrich$parser_combinators$Combine$map, $elm$core$List$cons, p));
};
var $andre_dietrich$parser_combinators$Combine$modifyInput = function (f) {
	return $andre_dietrich$parser_combinators$Combine$Parser(
		F2(
			function (state, stream) {
				return A3(
					$andre_dietrich$parser_combinators$Combine$app,
					$andre_dietrich$parser_combinators$Combine$succeed(_Utils_Tuple0),
					state,
					_Utils_update(
						stream,
						{
							input: f(stream.input)
						}));
			}));
};
var $andre_dietrich$parser_combinators$Combine$optional = F2(
	function (res, p) {
		return A2(
			$andre_dietrich$parser_combinators$Combine$or,
			p,
			$andre_dietrich$parser_combinators$Combine$succeed(res));
	});
var $author$project$Lia$Utils$toJSstring = A2(
	$elm$core$Basics$composeR,
	$elm$core$String$split('\\'),
	$elm$core$String$join('\\\\'));
var $author$project$Lia$Markdown$Macro$Parser$parameter = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$author$project$Lia$Utils$toJSstring,
	$andre_dietrich$parser_combinators$Combine$choice(
		_List_fromArray(
			[
				A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				$author$project$Lia$Parser$Helper$c_frame,
				A2(
					$andre_dietrich$parser_combinators$Combine$keep,
					$andre_dietrich$parser_combinators$Combine$regex('(([^`]+|(`[^`]+)|(``[^`]+))|\\n)+'),
					$author$project$Lia$Parser$Helper$c_frame)),
				A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				$andre_dietrich$parser_combinators$Combine$string('`'),
				A2(
					$andre_dietrich$parser_combinators$Combine$keep,
					$andre_dietrich$parser_combinators$Combine$regex('[^`\n]+'),
					$andre_dietrich$parser_combinators$Combine$string('`'))),
				$andre_dietrich$parser_combinators$Combine$regex('[^),]+')
			])));
var $andre_dietrich$parser_combinators$Combine$between = F3(
	function (lp, rp, p) {
		return A2(
			$andre_dietrich$parser_combinators$Combine$ignore,
			rp,
			A2($andre_dietrich$parser_combinators$Combine$keep, p, lp));
	});
var $andre_dietrich$parser_combinators$Combine$parens = A2(
	$andre_dietrich$parser_combinators$Combine$between,
	$andre_dietrich$parser_combinators$Combine$string('('),
	$andre_dietrich$parser_combinators$Combine$string(')'));
var $andre_dietrich$parser_combinators$Combine$sepBy1 = F2(
	function (sep, p) {
		return A2(
			$andre_dietrich$parser_combinators$Combine$andMap,
			$andre_dietrich$parser_combinators$Combine$many(
				A2($andre_dietrich$parser_combinators$Combine$keep, p, sep)),
			A2($andre_dietrich$parser_combinators$Combine$map, $elm$core$List$cons, p));
	});
var $andre_dietrich$parser_combinators$Combine$sepBy = F2(
	function (sep, p) {
		return A2(
			$andre_dietrich$parser_combinators$Combine$or,
			A2($andre_dietrich$parser_combinators$Combine$sepBy1, sep, p),
			$andre_dietrich$parser_combinators$Combine$succeed(_List_Nil));
	});
var $author$project$Lia$Markdown$Macro$Parser$parameter_list = A2(
	$andre_dietrich$parser_combinators$Combine$optional,
	_List_Nil,
	$andre_dietrich$parser_combinators$Combine$parens(
		A2(
			$andre_dietrich$parser_combinators$Combine$sepBy,
			$andre_dietrich$parser_combinators$Combine$string(','),
			$author$project$Lia$Markdown$Macro$Parser$parameter)));
var $author$project$Lia$Parser$Helper$spaces = $andre_dietrich$parser_combinators$Combine$regex('[\t ]*');
var $author$project$Lia$Markdown$Macro$Parser$pattern = A2(
	$andre_dietrich$parser_combinators$Combine$keep,
	$andre_dietrich$parser_combinators$Combine$regex('@-?@?\\w[\\w\\d._]+'),
	$author$project$Lia$Parser$Helper$spaces);
var $andre_dietrich$parser_combinators$Combine$putState = function (state) {
	return $andre_dietrich$parser_combinators$Combine$Parser(
		F2(
			function (_v0, stream) {
				return A3(
					$andre_dietrich$parser_combinators$Combine$app,
					$andre_dietrich$parser_combinators$Combine$succeed(_Utils_Tuple0),
					state,
					stream);
			}));
};
var $andre_dietrich$parser_combinators$Combine$InputStream = F3(
	function (data, input, position) {
		return {data: data, input: input, position: position};
	});
var $andre_dietrich$parser_combinators$Combine$initStream = function (s) {
	return A3($andre_dietrich$parser_combinators$Combine$InputStream, s, s, 0);
};
var $andre_dietrich$parser_combinators$Combine$runParser = F3(
	function (p, st, s) {
		var _v0 = A3(
			$andre_dietrich$parser_combinators$Combine$app,
			p,
			st,
			$andre_dietrich$parser_combinators$Combine$initStream(s));
		if (_v0.c.$ === 'Ok') {
			var state = _v0.a;
			var stream = _v0.b;
			var res = _v0.c.a;
			return $elm$core$Result$Ok(
				_Utils_Tuple3(state, stream, res));
		} else {
			var state = _v0.a;
			var stream = _v0.b;
			var ms = _v0.c.a;
			return $elm$core$Result$Err(
				_Utils_Tuple3(state, stream, ms));
		}
	});
var $author$project$Lia$Markdown$Macro$Parser$simple_macro = A2(
	$andre_dietrich$parser_combinators$Combine$andMap,
	$author$project$Lia$Markdown$Macro$Parser$parameter_list,
	A2($andre_dietrich$parser_combinators$Combine$map, $elm$core$Tuple$pair, $author$project$Lia$Markdown$Macro$Parser$pattern));
var $author$project$Lia$Markdown$Macro$Parser$uid_update = function (state) {
	var def = state.defines;
	return _Utils_update(
		state,
		{
			defines: _Utils_update(
				def,
				{uid: def.uid + 1})
		});
};
var $author$project$Lia$Markdown$Macro$Parser$uid_macro = A2(
	$andre_dietrich$parser_combinators$Combine$onsuccess,
	_Utils_Tuple2('@uid', _List_Nil),
	A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		$andre_dietrich$parser_combinators$Combine$modifyState($author$project$Lia$Markdown$Macro$Parser$uid_update),
		$andre_dietrich$parser_combinators$Combine$string('@uid')));
var $author$project$Lia$Markdown$Macro$Parser$eval_parameter = F2(
	function (param, _v6) {
		var state = _v6.a;
		var i = _v6.b;
		var code = _v6.c;
		var _v7 = A2($author$project$Lia$Markdown$Macro$Parser$macro_parse, state, param);
		var new_state = _v7.a;
		var new_param = _v7.b;
		return _Utils_Tuple3(
			new_state,
			i + 1,
			A3(
				$elm$core$String$replace,
				'@' + $elm$core$String$fromInt(i),
				new_param,
				code));
	});
var $author$project$Lia$Markdown$Macro$Parser$inject_macro = function (_v2) {
	var name = _v2.a;
	var params = _v2.b;
	var inject = function (state) {
		var _v3 = A2($author$project$Lia$Markdown$Macro$Parser$get, name, state.defines);
		if (_v3.$ === 'Just') {
			var _v4 = _v3.a;
			var isDebug = _v4.a;
			var deepDebug = _v4.b;
			var code = _v4.c;
			var code_ = _Utils_eq(state.identation, _List_Nil) ? code : A2(
				$elm$core$String$join,
				'\n' + $elm$core$String$concat(state.identation),
				$elm$core$String$lines(code));
			var _v5 = A3(
				$elm$core$List$foldl,
				$author$project$Lia$Markdown$Macro$Parser$eval_parameter,
				_Utils_Tuple3(state, 0, code_),
				params);
			var new_state = _v5.a;
			var new_code = _v5.c;
			return A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				$andre_dietrich$parser_combinators$Combine$succeed(_Utils_Tuple0),
				A2(
					$andre_dietrich$parser_combinators$Combine$keep,
					$andre_dietrich$parser_combinators$Combine$putState(new_state),
					$andre_dietrich$parser_combinators$Combine$modifyInput(
						$elm$core$Basics$append(
							(isDebug ? $author$project$Lia$Markdown$Macro$Parser$debug(deepDebug) : $elm$core$Basics$identity)(new_code)))));
		} else {
			return $andre_dietrich$parser_combinators$Combine$fail('macro definition not found');
		}
	};
	return $andre_dietrich$parser_combinators$Combine$withState(inject);
};
var $author$project$Lia$Markdown$Macro$Parser$macro_parse = F2(
	function (defines, str) {
		var _v0 = A3(
			$andre_dietrich$parser_combinators$Combine$runParser,
			A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$elm$core$String$concat,
				$andre_dietrich$parser_combinators$Combine$many1(
					A2(
						$andre_dietrich$parser_combinators$Combine$or,
						$andre_dietrich$parser_combinators$Combine$regex('@input[^@]+'),
						A2(
							$andre_dietrich$parser_combinators$Combine$keep,
							$andre_dietrich$parser_combinators$Combine$regex('[^@]+'),
							$author$project$Lia$Markdown$Macro$Parser$cyclic$macro())))),
			defines,
			str);
		if (_v0.$ === 'Ok') {
			var _v1 = _v0.a;
			var state = _v1.a;
			var s = _v1.c;
			return _Utils_Tuple2(state, s);
		} else {
			return _Utils_Tuple2(defines, str);
		}
	});
function $author$project$Lia$Markdown$Macro$Parser$cyclic$macro() {
	return $andre_dietrich$parser_combinators$Combine$skip(
		$andre_dietrich$parser_combinators$Combine$maybe(
			$andre_dietrich$parser_combinators$Combine$many1(
				$andre_dietrich$parser_combinators$Combine$choice(
					_List_fromArray(
						[
							A2($andre_dietrich$parser_combinators$Combine$andThen, $author$project$Lia$Markdown$Macro$Parser$inject_macro, $author$project$Lia$Markdown$Macro$Parser$uid_macro),
							A2($andre_dietrich$parser_combinators$Combine$andThen, $author$project$Lia$Markdown$Macro$Parser$inject_macro, $author$project$Lia$Markdown$Macro$Parser$simple_macro),
							$author$project$Lia$Markdown$Macro$Parser$cyclic$macro_listing()
						])))));
}
function $author$project$Lia$Markdown$Macro$Parser$cyclic$macro_listing() {
	return A2(
		$andre_dietrich$parser_combinators$Combine$andThen,
		function (name) {
			return A2(
				$andre_dietrich$parser_combinators$Combine$andThen,
				function (params) {
					return A2(
						$andre_dietrich$parser_combinators$Combine$andThen,
						function (p) {
							return $author$project$Lia$Markdown$Macro$Parser$inject_macro(
								_Utils_Tuple2(name, p));
						},
						A2(
							$andre_dietrich$parser_combinators$Combine$map,
							$elm$core$List$append(params),
							$author$project$Lia$Markdown$Macro$Parser$code_block));
				},
				A2(
					$andre_dietrich$parser_combinators$Combine$ignore,
					$andre_dietrich$parser_combinators$Combine$regex('[\t ]*\\n'),
					$author$project$Lia$Markdown$Macro$Parser$parameter_list));
		},
		A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			$author$project$Lia$Markdown$Macro$Parser$pattern,
			A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				$andre_dietrich$parser_combinators$Combine$regex('[\t ]*[a-zA-Z0-9_]*[\t ]*'),
				$author$project$Lia$Parser$Helper$c_frame)));
}
try {
	var $author$project$Lia$Markdown$Macro$Parser$macro = $author$project$Lia$Markdown$Macro$Parser$cyclic$macro();
	$author$project$Lia$Markdown$Macro$Parser$cyclic$macro = function () {
		return $author$project$Lia$Markdown$Macro$Parser$macro;
	};
	var $author$project$Lia$Markdown$Macro$Parser$macro_listing = $author$project$Lia$Markdown$Macro$Parser$cyclic$macro_listing();
	$author$project$Lia$Markdown$Macro$Parser$cyclic$macro_listing = function () {
		return $author$project$Lia$Markdown$Macro$Parser$macro_listing;
	};
} catch ($) {
	throw 'Some top-level definitions from `Lia.Markdown.Macro.Parser` are causing infinite recursion:\n\n  ┌─────┐\n  │    eval_parameter\n  │     ↓\n  │    macro\n  │     ↓\n  │    inject_macro\n  │     ↓\n  │    macro_listing\n  │     ↓\n  │    macro_parse\n  └─────┘\n\nThese errors are very tricky, so read https://elm-lang.org/0.19.1/bad-recursion to learn how to fix it!';}
var $elm$core$List$drop = F2(
	function (n, list) {
		drop:
		while (true) {
			if (n <= 0) {
				return list;
			} else {
				if (!list.b) {
					return list;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs;
					n = $temp$n;
					list = $temp$list;
					continue drop;
				}
			}
		}
	});
var $author$project$Lia$Markdown$Effect$Parser$reset_effect_number = $andre_dietrich$parser_combinators$Combine$modifyState(
	function (s) {
		return _Utils_update(
			s,
			{
				effect_number: A2($elm$core$List$drop, 1, s.effect_number)
			});
	});
var $author$project$Lia$Parser$Helper$spaces1 = $andre_dietrich$parser_combinators$Combine$regex('[\t ]+');
var $author$project$Lia$Markdown$Effect$Parser$hidden_comment = $andre_dietrich$parser_combinators$Combine$skip(
	A2(
		$andre_dietrich$parser_combinators$Combine$andThen,
		$author$project$Lia$Markdown$Effect$Parser$add_comment(false),
		A2(
			$andre_dietrich$parser_combinators$Combine$ignore,
			$author$project$Lia$Markdown$Effect$Parser$reset_effect_number,
			A2(
				$andre_dietrich$parser_combinators$Combine$andMap,
				A2(
					$andre_dietrich$parser_combinators$Combine$manyTill,
					$andre_dietrich$parser_combinators$Combine$Char$anyChar,
					$andre_dietrich$parser_combinators$Combine$string('-->')),
				A2(
					$andre_dietrich$parser_combinators$Combine$ignore,
					$andre_dietrich$parser_combinators$Combine$regex('}}--[\t ]*'),
					A2(
						$andre_dietrich$parser_combinators$Combine$andMap,
						$andre_dietrich$parser_combinators$Combine$maybe(
							A2(
								$andre_dietrich$parser_combinators$Combine$keep,
								$andre_dietrich$parser_combinators$Combine$regex('[A-Za-z0-9 ]+'),
								A2($andre_dietrich$parser_combinators$Combine$keep, $author$project$Lia$Markdown$Macro$Parser$macro, $author$project$Lia$Parser$Helper$spaces1))),
						A2(
							$andre_dietrich$parser_combinators$Combine$map,
							F3(
								function (i, voice, text) {
									return _Utils_Tuple3(
										i,
										voice,
										_List_fromArray(
											[
												A2(
												$author$project$Lia$Markdown$Inline$Types$Chars,
												$elm$core$String$trim(
													$elm$core$String$fromList(text)),
												$elm$core$Maybe$Nothing)
											]));
								}),
							A2(
								$andre_dietrich$parser_combinators$Combine$keep,
								$author$project$Lia$Markdown$Effect$Parser$effect_number,
								$andre_dietrich$parser_combinators$Combine$regex('<!--[\t ]*--{{')))))))));
var $author$project$Lia$Markdown$Inline$Parser$comments = $andre_dietrich$parser_combinators$Combine$skip(
	$andre_dietrich$parser_combinators$Combine$many(
		A2(
			$andre_dietrich$parser_combinators$Combine$or,
			$andre_dietrich$parser_combinators$Combine$skip(
				$author$project$Lia$Markdown$Inline$Parser$comment($andre_dietrich$parser_combinators$Combine$Char$anyChar)),
			$author$project$Lia$Markdown$Effect$Parser$hidden_comment)));
var $elm$core$Dict$fromList = function (assocs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, dict) {
				var key = _v0.a;
				var value = _v0.b;
				return A3($elm$core$Dict$insert, key, value, dict);
			}),
		$elm$core$Dict$empty,
		assocs);
};
var $author$project$Lia$Markdown$Inline$Parser$annotations = A2(
	$andre_dietrich$parser_combinators$Combine$ignore,
	$author$project$Lia$Markdown$Inline$Parser$comments,
	$andre_dietrich$parser_combinators$Combine$maybe(
		A2(
			$andre_dietrich$parser_combinators$Combine$map,
			A2($elm$core$Basics$composeR, $elm$core$Dict$fromList, $author$project$Lia$Markdown$Inline$Parser$attr_),
			A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				$author$project$Lia$Markdown$Inline$Parser$comment($author$project$Lia$Markdown$Inline$Parser$attribute),
				$author$project$Lia$Parser$Helper$spaces))));
var $author$project$Lia$Markdown$Inline$Types$Symbol = F2(
	function (a, b) {
		return {$: 'Symbol', a: a, b: b};
	});
var $author$project$Lia$Markdown$Inline$Parser$Symbol$arrows = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$author$project$Lia$Markdown$Inline$Types$Symbol,
	$andre_dietrich$parser_combinators$Combine$choice(
		_List_fromArray(
			[
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'⟷',
				$andre_dietrich$parser_combinators$Combine$string('<-->')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'⟵',
				$andre_dietrich$parser_combinators$Combine$string('<--')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'⟶',
				$andre_dietrich$parser_combinators$Combine$string('-->')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'↞',
				$andre_dietrich$parser_combinators$Combine$string('<<-')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'↠',
				$andre_dietrich$parser_combinators$Combine$string('->>')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'↔',
				$andre_dietrich$parser_combinators$Combine$string('<->')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'↣',
				$andre_dietrich$parser_combinators$Combine$string('>->')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'↢',
				$andre_dietrich$parser_combinators$Combine$string('<-<')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'→',
				$andre_dietrich$parser_combinators$Combine$string('->')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'←',
				$andre_dietrich$parser_combinators$Combine$string('<-')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'↜',
				$andre_dietrich$parser_combinators$Combine$string('<~')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'↝',
				$andre_dietrich$parser_combinators$Combine$string('~>')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'⟺',
				$andre_dietrich$parser_combinators$Combine$string('<==>')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'⟹',
				$andre_dietrich$parser_combinators$Combine$string('==>')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'⟸',
				$andre_dietrich$parser_combinators$Combine$string('<==')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'⇔',
				$andre_dietrich$parser_combinators$Combine$string('<=>')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'⇒',
				$andre_dietrich$parser_combinators$Combine$string('=>')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'⇐',
				$andre_dietrich$parser_combinators$Combine$string('<='))
			])));
var $author$project$Lia$Markdown$Inline$Multimedia$audio = $author$project$Lia$Parser$PatReplace$replace(
	_List_fromArray(
		[
			{
			by: function (w) {
				return 'https://w.soundcloud.com/player/?url=https://soundcloud.com/' + w;
			},
			pattern: 'https?:\\/\\/(?:w\\.|www\\.|)(?:soundcloud\\.com\\/)(?:(?:player\\/\\?url=https\\%3A\\/\\/api.soundcloud.com\\/tracks\\/)|)(((\\w|-)[^A-z]{7})|([A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*(?!\\/sets(?:\\/|$))(?:\\/[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*){1,2}))'
		}
		]));
var $author$project$Lia$Markdown$Inline$Types$Verbatim = F2(
	function (a, b) {
		return {$: 'Verbatim', a: a, b: b};
	});
var $author$project$Lia$Markdown$Inline$Parser$code = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$author$project$Lia$Markdown$Inline$Types$Verbatim,
	A2(
		$andre_dietrich$parser_combinators$Combine$ignore,
		$andre_dietrich$parser_combinators$Combine$string('`'),
		A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			$andre_dietrich$parser_combinators$Combine$regex('[^`\\n]+'),
			$andre_dietrich$parser_combinators$Combine$string('`'))));
var $author$project$Lia$Markdown$Inline$Parser$email = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$elm$core$Basics$append('mailto:'),
	A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		$andre_dietrich$parser_combinators$Combine$regex('[a-zA-Z0-9_.\\-]+@[a-zA-Z0-9_.\\-]+'),
		$andre_dietrich$parser_combinators$Combine$maybe(
			$andre_dietrich$parser_combinators$Combine$string('mailto:'))));
var $author$project$Lia$Markdown$Inline$Types$Formula = F3(
	function (a, b, c) {
		return {$: 'Formula', a: a, b: b, c: c};
	});
var $author$project$Lia$Markdown$Inline$Parser$Formula$formula_block = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$author$project$Lia$Markdown$Inline$Types$Formula('true'),
	A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		$author$project$Lia$Parser$Helper$stringTill(
			$andre_dietrich$parser_combinators$Combine$string('$$')),
		$andre_dietrich$parser_combinators$Combine$string('$$')));
var $author$project$Lia$Markdown$Inline$Parser$Formula$formula_inline = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$author$project$Lia$Markdown$Inline$Types$Formula('false'),
	A2(
		$andre_dietrich$parser_combinators$Combine$ignore,
		$andre_dietrich$parser_combinators$Combine$string('$'),
		A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			$andre_dietrich$parser_combinators$Combine$regex('[^\\n$]+'),
			$andre_dietrich$parser_combinators$Combine$string('$'))));
var $author$project$Lia$Markdown$Inline$Parser$Formula$formula = A2($andre_dietrich$parser_combinators$Combine$or, $author$project$Lia$Markdown$Inline$Parser$Formula$formula_block, $author$project$Lia$Markdown$Inline$Parser$Formula$formula_inline);
var $author$project$Lia$Markdown$Effect$Model$add_javascript = F3(
	function (idx, script, model) {
		return _Utils_update(
			model,
			{
				javascript: A3(
					$elm$core$Dict$insert,
					idx,
					function () {
						var _v0 = A2($elm$core$Dict$get, idx, model.javascript);
						if (_v0.$ === 'Just') {
							var a = _v0.a;
							return A2(
								$elm$core$List$append,
								a,
								_List_fromArray(
									[script]));
						} else {
							return _List_fromArray(
								[script]);
						}
					}(),
					model.javascript)
			});
	});
var $author$project$Lia$Markdown$Inline$Parser$javascript = A2(
	$andre_dietrich$parser_combinators$Combine$keep,
	$author$project$Lia$Parser$Helper$stringTill(
		$andre_dietrich$parser_combinators$Combine$string('</script>')),
	$andre_dietrich$parser_combinators$Combine$string('<script>'));
var $author$project$Lia$Markdown$Inline$Parser$html = function () {
	var state = function (script) {
		return $andre_dietrich$parser_combinators$Combine$modifyState(
			function (s) {
				return _Utils_update(
					s,
					{
						effect_model: A3(
							$author$project$Lia$Markdown$Effect$Model$add_javascript,
							A2(
								$elm$core$Maybe$withDefault,
								0,
								$elm$core$List$head(s.effect_number)),
							script,
							s.effect_model)
					});
			});
	};
	return A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		$andre_dietrich$parser_combinators$Combine$succeed(
			A2($author$project$Lia$Markdown$Inline$Types$Chars, '', $elm$core$Maybe$Nothing)),
		A2($andre_dietrich$parser_combinators$Combine$andThen, state, $author$project$Lia$Markdown$Inline$Parser$javascript));
}();
var $author$project$Lia$Markdown$Inline$Types$EInline = F4(
	function (a, b, c, d) {
		return {$: 'EInline', a: a, b: b, c: c, d: d};
	});
var $author$project$Lia$Markdown$Effect$Parser$inline = function (inlines) {
	return A2(
		$andre_dietrich$parser_combinators$Combine$ignore,
		$author$project$Lia$Markdown$Effect$Parser$reset_effect_number,
		A2(
			$andre_dietrich$parser_combinators$Combine$andMap,
			A2(
				$andre_dietrich$parser_combinators$Combine$manyTill,
				inlines,
				$andre_dietrich$parser_combinators$Combine$string('}')),
			A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				$andre_dietrich$parser_combinators$Combine$string('}{'),
				A2(
					$andre_dietrich$parser_combinators$Combine$andMap,
					A2(
						$andre_dietrich$parser_combinators$Combine$optional,
						99999,
						A2(
							$andre_dietrich$parser_combinators$Combine$keep,
							$andre_dietrich$parser_combinators$Combine$Num$int,
							$andre_dietrich$parser_combinators$Combine$regex('[\t ]*-[\t ]*'))),
					A2(
						$andre_dietrich$parser_combinators$Combine$map,
						$author$project$Lia$Markdown$Inline$Types$EInline,
						A2(
							$andre_dietrich$parser_combinators$Combine$keep,
							$author$project$Lia$Markdown$Effect$Parser$effect_number,
							$andre_dietrich$parser_combinators$Combine$string('{')))))));
};
var $author$project$Lia$Markdown$Inline$Types$FootnoteMark = F2(
	function (a, b) {
		return {$: 'FootnoteMark', a: a, b: b};
	});
var $author$project$Lia$Markdown$Types$Paragraph = F2(
	function (a, b) {
		return {$: 'Paragraph', a: a, b: b};
	});
var $author$project$Lia$Markdown$Footnote$Model$insert = F3(
	function (key, val, model) {
		return A3($elm$core$Dict$insert, key, val, model);
	});
var $author$project$Lia$Markdown$Footnote$Parser$add_footnote = function (_v0) {
	var key = _v0.a;
	var val = _v0.b;
	return $andre_dietrich$parser_combinators$Combine$modifyState(
		function (s) {
			return _Utils_update(
				s,
				{
					footnotes: A3($author$project$Lia$Markdown$Footnote$Model$insert, key, val, s.footnotes)
				});
		});
};
var $author$project$Lia$Markdown$Footnote$Parser$store = function (_v0) {
	var key = _v0.a;
	var val = _v0.b;
	if (val.$ === 'Just') {
		var v = val.a;
		return A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			$andre_dietrich$parser_combinators$Combine$succeed(
				$author$project$Lia$Markdown$Inline$Types$FootnoteMark(key)),
			$author$project$Lia$Markdown$Footnote$Parser$add_footnote(
				_Utils_Tuple2(
					key,
					_List_fromArray(
						[
							A2(
							$author$project$Lia$Markdown$Types$Paragraph,
							$elm$core$Maybe$Nothing,
							_List_fromArray(
								[
									A2($author$project$Lia$Markdown$Inline$Types$Chars, v, $elm$core$Maybe$Nothing)
								]))
						]))));
	} else {
		return $andre_dietrich$parser_combinators$Combine$succeed(
			$author$project$Lia$Markdown$Inline$Types$FootnoteMark(key));
	}
};
var $author$project$Lia$Markdown$Footnote$Parser$inline = A2(
	$andre_dietrich$parser_combinators$Combine$andThen,
	$author$project$Lia$Markdown$Footnote$Parser$store,
	A2(
		$andre_dietrich$parser_combinators$Combine$andMap,
		$andre_dietrich$parser_combinators$Combine$maybe(
			A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				$author$project$Lia$Parser$Helper$stringTill(
					$andre_dietrich$parser_combinators$Combine$string(')')),
				$andre_dietrich$parser_combinators$Combine$string('('))),
		A2(
			$andre_dietrich$parser_combinators$Combine$map,
			$elm$core$Tuple$pair,
			A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				$author$project$Lia$Parser$Helper$stringTill(
					$andre_dietrich$parser_combinators$Combine$string(']')),
				$andre_dietrich$parser_combinators$Combine$string('[^')))));
var $author$project$Lia$Markdown$Inline$Parser$url = $andre_dietrich$parser_combinators$Combine$regex('[a-zA-Z]+://(/)?[a-zA-Z0-9\\.\\-\\_]+\\.([a-z\\.]{2,6})[^ \\]\\)\t\n]*');
var $author$project$Lia$Markdown$Inline$Parser$inline_url = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	function (u) {
		return $author$project$Lia$Markdown$Inline$Types$Ref(
			A3(
				$author$project$Lia$Markdown$Inline$Types$Link,
				_List_fromArray(
					[
						A2($author$project$Lia$Markdown$Inline$Types$Chars, u, $elm$core$Maybe$Nothing)
					]),
				u,
				''));
	},
	$author$project$Lia$Markdown$Inline$Parser$url);
var $andre_dietrich$parser_combinators$Combine$lazy = function (t) {
	return A2(
		$andre_dietrich$parser_combinators$Combine$andThen,
		t,
		$andre_dietrich$parser_combinators$Combine$succeed(_Utils_Tuple0));
};
var $author$project$Lia$Markdown$Inline$Multimedia$movie = $author$project$Lia$Parser$PatReplace$replace(
	_List_fromArray(
		[
			{
			by: function (w) {
				return 'https://www.youtube.com/embed/' + w;
			},
			pattern: '(?:http(?:s)?://)?(?:www\\.)?(?:youtu\\.be/|youtube\\.com/(?:(?:watch)?\\?(?:.*&)?v(?:i)?=|(?:v|vi|user)/))([^\\?&\"\'<> #]+)'
		},
			{
			by: function (w) {
				return 'https://player.vimeo.com/video/' + w;
			},
			pattern: '(?:http(?:s)?://)?(?:www\\.)?(?:player.)?(?:vimeo\\.com).*?(\\d+)'
		},
			{
			by: function (w) {
				return 'https://www.teachertube.com/embed/video/' + w;
			},
			pattern: '(?:http(?:s)?://)?(?:www\\.)?(?:teachertube\\.com).*?(\\d+)'
		}
		]));
var $author$project$Lia$Markdown$HTML$Types$Node = F3(
	function (a, b, c) {
		return {$: 'Node', a: a, b: b, c: c};
	});
var $author$project$Lia$Markdown$HTML$Parser$closingTag = function (name) {
	var chompName = A2(
		$andre_dietrich$parser_combinators$Combine$andThen,
		function (closingName) {
			return _Utils_eq(
				$elm$core$String$toLower(closingName),
				name) ? $andre_dietrich$parser_combinators$Combine$succeed(_Utils_Tuple0) : $andre_dietrich$parser_combinators$Combine$fail('closing tag does not match opening tag: ' + name);
		},
		$andre_dietrich$parser_combinators$Combine$regex('\\w+(-\\w+)?'));
	return A2(
		$andre_dietrich$parser_combinators$Combine$ignore,
		$andre_dietrich$parser_combinators$Combine$regex('[ \\t\\n]*>'),
		A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			chompName,
			$andre_dietrich$parser_combinators$Combine$regex('[ \\t\\n]*</[ \\t]*')));
};
var $author$project$Lia$Markdown$HTML$Parser$voidElements = _List_fromArray(
	['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
var $author$project$Lia$Markdown$HTML$Parser$isVoidElement = function (name) {
	return A2($elm$core$List$member, name, $author$project$Lia$Markdown$HTML$Parser$voidElements);
};
var $author$project$Lia$Markdown$HTML$NamedCharacterReferences$dict = $elm$core$Dict$fromList(
	_List_fromArray(
		[
			_Utils_Tuple2('Aacute', 'Á'),
			_Utils_Tuple2('aacute', 'á'),
			_Utils_Tuple2('Abreve', 'Ă'),
			_Utils_Tuple2('abreve', 'ă'),
			_Utils_Tuple2('ac', '∾'),
			_Utils_Tuple2('acd', '∿'),
			_Utils_Tuple2('acE', '∾̳'),
			_Utils_Tuple2('Acirc', 'Â'),
			_Utils_Tuple2('acirc', 'â'),
			_Utils_Tuple2('acute', '´'),
			_Utils_Tuple2('Acy', 'А'),
			_Utils_Tuple2('acy', 'а'),
			_Utils_Tuple2('AElig', 'Æ'),
			_Utils_Tuple2('aelig', 'æ'),
			_Utils_Tuple2('af', '\u2061'),
			_Utils_Tuple2('Afr', '\uD835\uDD04'),
			_Utils_Tuple2('afr', '\uD835\uDD1E'),
			_Utils_Tuple2('Agrave', 'À'),
			_Utils_Tuple2('agrave', 'à'),
			_Utils_Tuple2('alefsym', 'ℵ'),
			_Utils_Tuple2('aleph', 'ℵ'),
			_Utils_Tuple2('Alpha', 'Α'),
			_Utils_Tuple2('alpha', 'α'),
			_Utils_Tuple2('Amacr', 'Ā'),
			_Utils_Tuple2('amacr', 'ā'),
			_Utils_Tuple2('amalg', '⨿'),
			_Utils_Tuple2('amp', '&'),
			_Utils_Tuple2('AMP', '&'),
			_Utils_Tuple2('andand', '⩕'),
			_Utils_Tuple2('And', '⩓'),
			_Utils_Tuple2('and', '∧'),
			_Utils_Tuple2('andd', '⩜'),
			_Utils_Tuple2('andslope', '⩘'),
			_Utils_Tuple2('andv', '⩚'),
			_Utils_Tuple2('ang', '∠'),
			_Utils_Tuple2('ange', '⦤'),
			_Utils_Tuple2('angle', '∠'),
			_Utils_Tuple2('angmsdaa', '⦨'),
			_Utils_Tuple2('angmsdab', '⦩'),
			_Utils_Tuple2('angmsdac', '⦪'),
			_Utils_Tuple2('angmsdad', '⦫'),
			_Utils_Tuple2('angmsdae', '⦬'),
			_Utils_Tuple2('angmsdaf', '⦭'),
			_Utils_Tuple2('angmsdag', '⦮'),
			_Utils_Tuple2('angmsdah', '⦯'),
			_Utils_Tuple2('angmsd', '∡'),
			_Utils_Tuple2('angrt', '∟'),
			_Utils_Tuple2('angrtvb', '⊾'),
			_Utils_Tuple2('angrtvbd', '⦝'),
			_Utils_Tuple2('angsph', '∢'),
			_Utils_Tuple2('angst', 'Å'),
			_Utils_Tuple2('angzarr', '⍼'),
			_Utils_Tuple2('Aogon', 'Ą'),
			_Utils_Tuple2('aogon', 'ą'),
			_Utils_Tuple2('Aopf', '\uD835\uDD38'),
			_Utils_Tuple2('aopf', '\uD835\uDD52'),
			_Utils_Tuple2('apacir', '⩯'),
			_Utils_Tuple2('ap', '≈'),
			_Utils_Tuple2('apE', '⩰'),
			_Utils_Tuple2('ape', '≊'),
			_Utils_Tuple2('apid', '≋'),
			_Utils_Tuple2('apos', '\''),
			_Utils_Tuple2('ApplyFunction', '\u2061'),
			_Utils_Tuple2('approx', '≈'),
			_Utils_Tuple2('approxeq', '≊'),
			_Utils_Tuple2('Aring', 'Å'),
			_Utils_Tuple2('aring', 'å'),
			_Utils_Tuple2('Ascr', '\uD835\uDC9C'),
			_Utils_Tuple2('ascr', '\uD835\uDCB6'),
			_Utils_Tuple2('Assign', '≔'),
			_Utils_Tuple2('ast', '*'),
			_Utils_Tuple2('asymp', '≈'),
			_Utils_Tuple2('asympeq', '≍'),
			_Utils_Tuple2('Atilde', 'Ã'),
			_Utils_Tuple2('atilde', 'ã'),
			_Utils_Tuple2('Auml', 'Ä'),
			_Utils_Tuple2('auml', 'ä'),
			_Utils_Tuple2('awconint', '∳'),
			_Utils_Tuple2('awint', '⨑'),
			_Utils_Tuple2('backcong', '≌'),
			_Utils_Tuple2('backepsilon', '϶'),
			_Utils_Tuple2('backprime', '‵'),
			_Utils_Tuple2('backsim', '∽'),
			_Utils_Tuple2('backsimeq', '⋍'),
			_Utils_Tuple2('Backslash', '∖'),
			_Utils_Tuple2('Barv', '⫧'),
			_Utils_Tuple2('barvee', '⊽'),
			_Utils_Tuple2('barwed', '⌅'),
			_Utils_Tuple2('Barwed', '⌆'),
			_Utils_Tuple2('barwedge', '⌅'),
			_Utils_Tuple2('bbrk', '⎵'),
			_Utils_Tuple2('bbrktbrk', '⎶'),
			_Utils_Tuple2('bcong', '≌'),
			_Utils_Tuple2('Bcy', 'Б'),
			_Utils_Tuple2('bcy', 'б'),
			_Utils_Tuple2('bdquo', '„'),
			_Utils_Tuple2('becaus', '∵'),
			_Utils_Tuple2('because', '∵'),
			_Utils_Tuple2('Because', '∵'),
			_Utils_Tuple2('bemptyv', '⦰'),
			_Utils_Tuple2('bepsi', '϶'),
			_Utils_Tuple2('bernou', 'ℬ'),
			_Utils_Tuple2('Bernoullis', 'ℬ'),
			_Utils_Tuple2('Beta', 'Β'),
			_Utils_Tuple2('beta', 'β'),
			_Utils_Tuple2('beth', 'ℶ'),
			_Utils_Tuple2('between', '≬'),
			_Utils_Tuple2('Bfr', '\uD835\uDD05'),
			_Utils_Tuple2('bfr', '\uD835\uDD1F'),
			_Utils_Tuple2('bigcap', '⋂'),
			_Utils_Tuple2('bigcirc', '◯'),
			_Utils_Tuple2('bigcup', '⋃'),
			_Utils_Tuple2('bigodot', '⨀'),
			_Utils_Tuple2('bigoplus', '⨁'),
			_Utils_Tuple2('bigotimes', '⨂'),
			_Utils_Tuple2('bigsqcup', '⨆'),
			_Utils_Tuple2('bigstar', '★'),
			_Utils_Tuple2('bigtriangledown', '▽'),
			_Utils_Tuple2('bigtriangleup', '△'),
			_Utils_Tuple2('biguplus', '⨄'),
			_Utils_Tuple2('bigvee', '⋁'),
			_Utils_Tuple2('bigwedge', '⋀'),
			_Utils_Tuple2('bkarow', '⤍'),
			_Utils_Tuple2('blacklozenge', '⧫'),
			_Utils_Tuple2('blacksquare', '▪'),
			_Utils_Tuple2('blacktriangle', '▴'),
			_Utils_Tuple2('blacktriangledown', '▾'),
			_Utils_Tuple2('blacktriangleleft', '◂'),
			_Utils_Tuple2('blacktriangleright', '▸'),
			_Utils_Tuple2('blank', '␣'),
			_Utils_Tuple2('blk12', '▒'),
			_Utils_Tuple2('blk14', '░'),
			_Utils_Tuple2('blk34', '▓'),
			_Utils_Tuple2('block', '█'),
			_Utils_Tuple2('bne', '=⃥'),
			_Utils_Tuple2('bnequiv', '≡⃥'),
			_Utils_Tuple2('bNot', '⫭'),
			_Utils_Tuple2('bnot', '⌐'),
			_Utils_Tuple2('Bopf', '\uD835\uDD39'),
			_Utils_Tuple2('bopf', '\uD835\uDD53'),
			_Utils_Tuple2('bot', '⊥'),
			_Utils_Tuple2('bottom', '⊥'),
			_Utils_Tuple2('bowtie', '⋈'),
			_Utils_Tuple2('boxbox', '⧉'),
			_Utils_Tuple2('boxdl', '┐'),
			_Utils_Tuple2('boxdL', '╕'),
			_Utils_Tuple2('boxDl', '╖'),
			_Utils_Tuple2('boxDL', '╗'),
			_Utils_Tuple2('boxdr', '┌'),
			_Utils_Tuple2('boxdR', '╒'),
			_Utils_Tuple2('boxDr', '╓'),
			_Utils_Tuple2('boxDR', '╔'),
			_Utils_Tuple2('boxh', '─'),
			_Utils_Tuple2('boxH', '═'),
			_Utils_Tuple2('boxhd', '┬'),
			_Utils_Tuple2('boxHd', '╤'),
			_Utils_Tuple2('boxhD', '╥'),
			_Utils_Tuple2('boxHD', '╦'),
			_Utils_Tuple2('boxhu', '┴'),
			_Utils_Tuple2('boxHu', '╧'),
			_Utils_Tuple2('boxhU', '╨'),
			_Utils_Tuple2('boxHU', '╩'),
			_Utils_Tuple2('boxminus', '⊟'),
			_Utils_Tuple2('boxplus', '⊞'),
			_Utils_Tuple2('boxtimes', '⊠'),
			_Utils_Tuple2('boxul', '┘'),
			_Utils_Tuple2('boxuL', '╛'),
			_Utils_Tuple2('boxUl', '╜'),
			_Utils_Tuple2('boxUL', '╝'),
			_Utils_Tuple2('boxur', '└'),
			_Utils_Tuple2('boxuR', '╘'),
			_Utils_Tuple2('boxUr', '╙'),
			_Utils_Tuple2('boxUR', '╚'),
			_Utils_Tuple2('boxv', '│'),
			_Utils_Tuple2('boxV', '║'),
			_Utils_Tuple2('boxvh', '┼'),
			_Utils_Tuple2('boxvH', '╪'),
			_Utils_Tuple2('boxVh', '╫'),
			_Utils_Tuple2('boxVH', '╬'),
			_Utils_Tuple2('boxvl', '┤'),
			_Utils_Tuple2('boxvL', '╡'),
			_Utils_Tuple2('boxVl', '╢'),
			_Utils_Tuple2('boxVL', '╣'),
			_Utils_Tuple2('boxvr', '├'),
			_Utils_Tuple2('boxvR', '╞'),
			_Utils_Tuple2('boxVr', '╟'),
			_Utils_Tuple2('boxVR', '╠'),
			_Utils_Tuple2('bprime', '‵'),
			_Utils_Tuple2('breve', '˘'),
			_Utils_Tuple2('Breve', '˘'),
			_Utils_Tuple2('brvbar', '¦'),
			_Utils_Tuple2('bscr', '\uD835\uDCB7'),
			_Utils_Tuple2('Bscr', 'ℬ'),
			_Utils_Tuple2('bsemi', '⁏'),
			_Utils_Tuple2('bsim', '∽'),
			_Utils_Tuple2('bsime', '⋍'),
			_Utils_Tuple2('bsolb', '⧅'),
			_Utils_Tuple2('bsol', '\\'),
			_Utils_Tuple2('bsolhsub', '⟈'),
			_Utils_Tuple2('bull', '•'),
			_Utils_Tuple2('bullet', '•'),
			_Utils_Tuple2('bump', '≎'),
			_Utils_Tuple2('bumpE', '⪮'),
			_Utils_Tuple2('bumpe', '≏'),
			_Utils_Tuple2('Bumpeq', '≎'),
			_Utils_Tuple2('bumpeq', '≏'),
			_Utils_Tuple2('Cacute', 'Ć'),
			_Utils_Tuple2('cacute', 'ć'),
			_Utils_Tuple2('capand', '⩄'),
			_Utils_Tuple2('capbrcup', '⩉'),
			_Utils_Tuple2('capcap', '⩋'),
			_Utils_Tuple2('cap', '∩'),
			_Utils_Tuple2('Cap', '⋒'),
			_Utils_Tuple2('capcup', '⩇'),
			_Utils_Tuple2('capdot', '⩀'),
			_Utils_Tuple2('CapitalDifferentialD', 'ⅅ'),
			_Utils_Tuple2('caps', '∩︀'),
			_Utils_Tuple2('caret', '⁁'),
			_Utils_Tuple2('caron', 'ˇ'),
			_Utils_Tuple2('Cayleys', 'ℭ'),
			_Utils_Tuple2('ccaps', '⩍'),
			_Utils_Tuple2('Ccaron', 'Č'),
			_Utils_Tuple2('ccaron', 'č'),
			_Utils_Tuple2('Ccedil', 'Ç'),
			_Utils_Tuple2('ccedil', 'ç'),
			_Utils_Tuple2('Ccirc', 'Ĉ'),
			_Utils_Tuple2('ccirc', 'ĉ'),
			_Utils_Tuple2('Cconint', '∰'),
			_Utils_Tuple2('ccups', '⩌'),
			_Utils_Tuple2('ccupssm', '⩐'),
			_Utils_Tuple2('Cdot', 'Ċ'),
			_Utils_Tuple2('cdot', 'ċ'),
			_Utils_Tuple2('cedil', '¸'),
			_Utils_Tuple2('Cedilla', '¸'),
			_Utils_Tuple2('cemptyv', '⦲'),
			_Utils_Tuple2('cent', '¢'),
			_Utils_Tuple2('centerdot', '·'),
			_Utils_Tuple2('CenterDot', '·'),
			_Utils_Tuple2('cfr', '\uD835\uDD20'),
			_Utils_Tuple2('Cfr', 'ℭ'),
			_Utils_Tuple2('CHcy', 'Ч'),
			_Utils_Tuple2('chcy', 'ч'),
			_Utils_Tuple2('check', '✓'),
			_Utils_Tuple2('checkmark', '✓'),
			_Utils_Tuple2('Chi', 'Χ'),
			_Utils_Tuple2('chi', 'χ'),
			_Utils_Tuple2('circ', 'ˆ'),
			_Utils_Tuple2('circeq', '≗'),
			_Utils_Tuple2('circlearrowleft', '↺'),
			_Utils_Tuple2('circlearrowright', '↻'),
			_Utils_Tuple2('circledast', '⊛'),
			_Utils_Tuple2('circledcirc', '⊚'),
			_Utils_Tuple2('circleddash', '⊝'),
			_Utils_Tuple2('CircleDot', '⊙'),
			_Utils_Tuple2('circledR', '®'),
			_Utils_Tuple2('circledS', 'Ⓢ'),
			_Utils_Tuple2('CircleMinus', '⊖'),
			_Utils_Tuple2('CirclePlus', '⊕'),
			_Utils_Tuple2('CircleTimes', '⊗'),
			_Utils_Tuple2('cir', '○'),
			_Utils_Tuple2('cirE', '⧃'),
			_Utils_Tuple2('cire', '≗'),
			_Utils_Tuple2('cirfnint', '⨐'),
			_Utils_Tuple2('cirmid', '⫯'),
			_Utils_Tuple2('cirscir', '⧂'),
			_Utils_Tuple2('ClockwiseContourIntegral', '∲'),
			_Utils_Tuple2('CloseCurlyDoubleQuote', '”'),
			_Utils_Tuple2('CloseCurlyQuote', '’'),
			_Utils_Tuple2('clubs', '♣'),
			_Utils_Tuple2('clubsuit', '♣'),
			_Utils_Tuple2('colon', ':'),
			_Utils_Tuple2('Colon', '∷'),
			_Utils_Tuple2('Colone', '⩴'),
			_Utils_Tuple2('colone', '≔'),
			_Utils_Tuple2('coloneq', '≔'),
			_Utils_Tuple2('comma', ','),
			_Utils_Tuple2('commat', '@'),
			_Utils_Tuple2('comp', '∁'),
			_Utils_Tuple2('compfn', '∘'),
			_Utils_Tuple2('complement', '∁'),
			_Utils_Tuple2('complexes', 'ℂ'),
			_Utils_Tuple2('cong', '≅'),
			_Utils_Tuple2('congdot', '⩭'),
			_Utils_Tuple2('Congruent', '≡'),
			_Utils_Tuple2('conint', '∮'),
			_Utils_Tuple2('Conint', '∯'),
			_Utils_Tuple2('ContourIntegral', '∮'),
			_Utils_Tuple2('copf', '\uD835\uDD54'),
			_Utils_Tuple2('Copf', 'ℂ'),
			_Utils_Tuple2('coprod', '∐'),
			_Utils_Tuple2('Coproduct', '∐'),
			_Utils_Tuple2('copy', '©'),
			_Utils_Tuple2('COPY', '©'),
			_Utils_Tuple2('copysr', '℗'),
			_Utils_Tuple2('CounterClockwiseContourIntegral', '∳'),
			_Utils_Tuple2('crarr', '↵'),
			_Utils_Tuple2('cross', '✗'),
			_Utils_Tuple2('Cross', '⨯'),
			_Utils_Tuple2('Cscr', '\uD835\uDC9E'),
			_Utils_Tuple2('cscr', '\uD835\uDCB8'),
			_Utils_Tuple2('csub', '⫏'),
			_Utils_Tuple2('csube', '⫑'),
			_Utils_Tuple2('csup', '⫐'),
			_Utils_Tuple2('csupe', '⫒'),
			_Utils_Tuple2('ctdot', '⋯'),
			_Utils_Tuple2('cudarrl', '⤸'),
			_Utils_Tuple2('cudarrr', '⤵'),
			_Utils_Tuple2('cuepr', '⋞'),
			_Utils_Tuple2('cuesc', '⋟'),
			_Utils_Tuple2('cularr', '↶'),
			_Utils_Tuple2('cularrp', '⤽'),
			_Utils_Tuple2('cupbrcap', '⩈'),
			_Utils_Tuple2('cupcap', '⩆'),
			_Utils_Tuple2('CupCap', '≍'),
			_Utils_Tuple2('cup', '∪'),
			_Utils_Tuple2('Cup', '⋓'),
			_Utils_Tuple2('cupcup', '⩊'),
			_Utils_Tuple2('cupdot', '⊍'),
			_Utils_Tuple2('cupor', '⩅'),
			_Utils_Tuple2('cups', '∪︀'),
			_Utils_Tuple2('curarr', '↷'),
			_Utils_Tuple2('curarrm', '⤼'),
			_Utils_Tuple2('curlyeqprec', '⋞'),
			_Utils_Tuple2('curlyeqsucc', '⋟'),
			_Utils_Tuple2('curlyvee', '⋎'),
			_Utils_Tuple2('curlywedge', '⋏'),
			_Utils_Tuple2('curren', '¤'),
			_Utils_Tuple2('curvearrowleft', '↶'),
			_Utils_Tuple2('curvearrowright', '↷'),
			_Utils_Tuple2('cuvee', '⋎'),
			_Utils_Tuple2('cuwed', '⋏'),
			_Utils_Tuple2('cwconint', '∲'),
			_Utils_Tuple2('cwint', '∱'),
			_Utils_Tuple2('cylcty', '⌭'),
			_Utils_Tuple2('dagger', '†'),
			_Utils_Tuple2('Dagger', '‡'),
			_Utils_Tuple2('daleth', 'ℸ'),
			_Utils_Tuple2('darr', '↓'),
			_Utils_Tuple2('Darr', '↡'),
			_Utils_Tuple2('dArr', '⇓'),
			_Utils_Tuple2('dash', '‐'),
			_Utils_Tuple2('Dashv', '⫤'),
			_Utils_Tuple2('dashv', '⊣'),
			_Utils_Tuple2('dbkarow', '⤏'),
			_Utils_Tuple2('dblac', '˝'),
			_Utils_Tuple2('Dcaron', 'Ď'),
			_Utils_Tuple2('dcaron', 'ď'),
			_Utils_Tuple2('Dcy', 'Д'),
			_Utils_Tuple2('dcy', 'д'),
			_Utils_Tuple2('ddagger', '‡'),
			_Utils_Tuple2('ddarr', '⇊'),
			_Utils_Tuple2('DD', 'ⅅ'),
			_Utils_Tuple2('dd', 'ⅆ'),
			_Utils_Tuple2('DDotrahd', '⤑'),
			_Utils_Tuple2('ddotseq', '⩷'),
			_Utils_Tuple2('deg', '°'),
			_Utils_Tuple2('Del', '∇'),
			_Utils_Tuple2('Delta', 'Δ'),
			_Utils_Tuple2('delta', 'δ'),
			_Utils_Tuple2('demptyv', '⦱'),
			_Utils_Tuple2('dfisht', '⥿'),
			_Utils_Tuple2('Dfr', '\uD835\uDD07'),
			_Utils_Tuple2('dfr', '\uD835\uDD21'),
			_Utils_Tuple2('dHar', '⥥'),
			_Utils_Tuple2('dharl', '⇃'),
			_Utils_Tuple2('dharr', '⇂'),
			_Utils_Tuple2('DiacriticalAcute', '´'),
			_Utils_Tuple2('DiacriticalDot', '˙'),
			_Utils_Tuple2('DiacriticalDoubleAcute', '˝'),
			_Utils_Tuple2('DiacriticalGrave', '`'),
			_Utils_Tuple2('DiacriticalTilde', '˜'),
			_Utils_Tuple2('diam', '⋄'),
			_Utils_Tuple2('diamond', '⋄'),
			_Utils_Tuple2('Diamond', '⋄'),
			_Utils_Tuple2('diamondsuit', '♦'),
			_Utils_Tuple2('diams', '♦'),
			_Utils_Tuple2('die', '¨'),
			_Utils_Tuple2('DifferentialD', 'ⅆ'),
			_Utils_Tuple2('digamma', 'ϝ'),
			_Utils_Tuple2('disin', '⋲'),
			_Utils_Tuple2('div', '÷'),
			_Utils_Tuple2('divide', '÷'),
			_Utils_Tuple2('divideontimes', '⋇'),
			_Utils_Tuple2('divonx', '⋇'),
			_Utils_Tuple2('DJcy', 'Ђ'),
			_Utils_Tuple2('djcy', 'ђ'),
			_Utils_Tuple2('dlcorn', '⌞'),
			_Utils_Tuple2('dlcrop', '⌍'),
			_Utils_Tuple2('dollar', '$'),
			_Utils_Tuple2('Dopf', '\uD835\uDD3B'),
			_Utils_Tuple2('dopf', '\uD835\uDD55'),
			_Utils_Tuple2('Dot', '¨'),
			_Utils_Tuple2('dot', '˙'),
			_Utils_Tuple2('DotDot', '⃜'),
			_Utils_Tuple2('doteq', '≐'),
			_Utils_Tuple2('doteqdot', '≑'),
			_Utils_Tuple2('DotEqual', '≐'),
			_Utils_Tuple2('dotminus', '∸'),
			_Utils_Tuple2('dotplus', '∔'),
			_Utils_Tuple2('dotsquare', '⊡'),
			_Utils_Tuple2('doublebarwedge', '⌆'),
			_Utils_Tuple2('DoubleContourIntegral', '∯'),
			_Utils_Tuple2('DoubleDot', '¨'),
			_Utils_Tuple2('DoubleDownArrow', '⇓'),
			_Utils_Tuple2('DoubleLeftArrow', '⇐'),
			_Utils_Tuple2('DoubleLeftRightArrow', '⇔'),
			_Utils_Tuple2('DoubleLeftTee', '⫤'),
			_Utils_Tuple2('DoubleLongLeftArrow', '⟸'),
			_Utils_Tuple2('DoubleLongLeftRightArrow', '⟺'),
			_Utils_Tuple2('DoubleLongRightArrow', '⟹'),
			_Utils_Tuple2('DoubleRightArrow', '⇒'),
			_Utils_Tuple2('DoubleRightTee', '⊨'),
			_Utils_Tuple2('DoubleUpArrow', '⇑'),
			_Utils_Tuple2('DoubleUpDownArrow', '⇕'),
			_Utils_Tuple2('DoubleVerticalBar', '∥'),
			_Utils_Tuple2('DownArrowBar', '⤓'),
			_Utils_Tuple2('downarrow', '↓'),
			_Utils_Tuple2('DownArrow', '↓'),
			_Utils_Tuple2('Downarrow', '⇓'),
			_Utils_Tuple2('DownArrowUpArrow', '⇵'),
			_Utils_Tuple2('DownBreve', '̑'),
			_Utils_Tuple2('downdownarrows', '⇊'),
			_Utils_Tuple2('downharpoonleft', '⇃'),
			_Utils_Tuple2('downharpoonright', '⇂'),
			_Utils_Tuple2('DownLeftRightVector', '⥐'),
			_Utils_Tuple2('DownLeftTeeVector', '⥞'),
			_Utils_Tuple2('DownLeftVectorBar', '⥖'),
			_Utils_Tuple2('DownLeftVector', '↽'),
			_Utils_Tuple2('DownRightTeeVector', '⥟'),
			_Utils_Tuple2('DownRightVectorBar', '⥗'),
			_Utils_Tuple2('DownRightVector', '⇁'),
			_Utils_Tuple2('DownTeeArrow', '↧'),
			_Utils_Tuple2('DownTee', '⊤'),
			_Utils_Tuple2('drbkarow', '⤐'),
			_Utils_Tuple2('drcorn', '⌟'),
			_Utils_Tuple2('drcrop', '⌌'),
			_Utils_Tuple2('Dscr', '\uD835\uDC9F'),
			_Utils_Tuple2('dscr', '\uD835\uDCB9'),
			_Utils_Tuple2('DScy', 'Ѕ'),
			_Utils_Tuple2('dscy', 'ѕ'),
			_Utils_Tuple2('dsol', '⧶'),
			_Utils_Tuple2('Dstrok', 'Đ'),
			_Utils_Tuple2('dstrok', 'đ'),
			_Utils_Tuple2('dtdot', '⋱'),
			_Utils_Tuple2('dtri', '▿'),
			_Utils_Tuple2('dtrif', '▾'),
			_Utils_Tuple2('duarr', '⇵'),
			_Utils_Tuple2('duhar', '⥯'),
			_Utils_Tuple2('dwangle', '⦦'),
			_Utils_Tuple2('DZcy', 'Џ'),
			_Utils_Tuple2('dzcy', 'џ'),
			_Utils_Tuple2('dzigrarr', '⟿'),
			_Utils_Tuple2('Eacute', 'É'),
			_Utils_Tuple2('eacute', 'é'),
			_Utils_Tuple2('easter', '⩮'),
			_Utils_Tuple2('Ecaron', 'Ě'),
			_Utils_Tuple2('ecaron', 'ě'),
			_Utils_Tuple2('Ecirc', 'Ê'),
			_Utils_Tuple2('ecirc', 'ê'),
			_Utils_Tuple2('ecir', '≖'),
			_Utils_Tuple2('ecolon', '≕'),
			_Utils_Tuple2('Ecy', 'Э'),
			_Utils_Tuple2('ecy', 'э'),
			_Utils_Tuple2('eDDot', '⩷'),
			_Utils_Tuple2('Edot', 'Ė'),
			_Utils_Tuple2('edot', 'ė'),
			_Utils_Tuple2('eDot', '≑'),
			_Utils_Tuple2('ee', 'ⅇ'),
			_Utils_Tuple2('efDot', '≒'),
			_Utils_Tuple2('Efr', '\uD835\uDD08'),
			_Utils_Tuple2('efr', '\uD835\uDD22'),
			_Utils_Tuple2('eg', '⪚'),
			_Utils_Tuple2('Egrave', 'È'),
			_Utils_Tuple2('egrave', 'è'),
			_Utils_Tuple2('egs', '⪖'),
			_Utils_Tuple2('egsdot', '⪘'),
			_Utils_Tuple2('el', '⪙'),
			_Utils_Tuple2('Element', '∈'),
			_Utils_Tuple2('elinters', '⏧'),
			_Utils_Tuple2('ell', 'ℓ'),
			_Utils_Tuple2('els', '⪕'),
			_Utils_Tuple2('elsdot', '⪗'),
			_Utils_Tuple2('Emacr', 'Ē'),
			_Utils_Tuple2('emacr', 'ē'),
			_Utils_Tuple2('empty', '∅'),
			_Utils_Tuple2('emptyset', '∅'),
			_Utils_Tuple2('EmptySmallSquare', '◻'),
			_Utils_Tuple2('emptyv', '∅'),
			_Utils_Tuple2('EmptyVerySmallSquare', '▫'),
			_Utils_Tuple2('emsp13', '\u2004'),
			_Utils_Tuple2('emsp14', '\u2005'),
			_Utils_Tuple2('emsp', '\u2003'),
			_Utils_Tuple2('ENG', 'Ŋ'),
			_Utils_Tuple2('eng', 'ŋ'),
			_Utils_Tuple2('ensp', '\u2002'),
			_Utils_Tuple2('Eogon', 'Ę'),
			_Utils_Tuple2('eogon', 'ę'),
			_Utils_Tuple2('Eopf', '\uD835\uDD3C'),
			_Utils_Tuple2('eopf', '\uD835\uDD56'),
			_Utils_Tuple2('epar', '⋕'),
			_Utils_Tuple2('eparsl', '⧣'),
			_Utils_Tuple2('eplus', '⩱'),
			_Utils_Tuple2('epsi', 'ε'),
			_Utils_Tuple2('Epsilon', 'Ε'),
			_Utils_Tuple2('epsilon', 'ε'),
			_Utils_Tuple2('epsiv', 'ϵ'),
			_Utils_Tuple2('eqcirc', '≖'),
			_Utils_Tuple2('eqcolon', '≕'),
			_Utils_Tuple2('eqsim', '≂'),
			_Utils_Tuple2('eqslantgtr', '⪖'),
			_Utils_Tuple2('eqslantless', '⪕'),
			_Utils_Tuple2('Equal', '⩵'),
			_Utils_Tuple2('equals', '='),
			_Utils_Tuple2('EqualTilde', '≂'),
			_Utils_Tuple2('equest', '≟'),
			_Utils_Tuple2('Equilibrium', '⇌'),
			_Utils_Tuple2('equiv', '≡'),
			_Utils_Tuple2('equivDD', '⩸'),
			_Utils_Tuple2('eqvparsl', '⧥'),
			_Utils_Tuple2('erarr', '⥱'),
			_Utils_Tuple2('erDot', '≓'),
			_Utils_Tuple2('escr', 'ℯ'),
			_Utils_Tuple2('Escr', 'ℰ'),
			_Utils_Tuple2('esdot', '≐'),
			_Utils_Tuple2('Esim', '⩳'),
			_Utils_Tuple2('esim', '≂'),
			_Utils_Tuple2('Eta', 'Η'),
			_Utils_Tuple2('eta', 'η'),
			_Utils_Tuple2('ETH', 'Ð'),
			_Utils_Tuple2('eth', 'ð'),
			_Utils_Tuple2('Euml', 'Ë'),
			_Utils_Tuple2('euml', 'ë'),
			_Utils_Tuple2('euro', '€'),
			_Utils_Tuple2('excl', '!'),
			_Utils_Tuple2('exist', '∃'),
			_Utils_Tuple2('Exists', '∃'),
			_Utils_Tuple2('expectation', 'ℰ'),
			_Utils_Tuple2('exponentiale', 'ⅇ'),
			_Utils_Tuple2('ExponentialE', 'ⅇ'),
			_Utils_Tuple2('fallingdotseq', '≒'),
			_Utils_Tuple2('Fcy', 'Ф'),
			_Utils_Tuple2('fcy', 'ф'),
			_Utils_Tuple2('female', '♀'),
			_Utils_Tuple2('ffilig', 'ﬃ'),
			_Utils_Tuple2('fflig', 'ﬀ'),
			_Utils_Tuple2('ffllig', 'ﬄ'),
			_Utils_Tuple2('Ffr', '\uD835\uDD09'),
			_Utils_Tuple2('ffr', '\uD835\uDD23'),
			_Utils_Tuple2('filig', 'ﬁ'),
			_Utils_Tuple2('FilledSmallSquare', '◼'),
			_Utils_Tuple2('FilledVerySmallSquare', '▪'),
			_Utils_Tuple2('fjlig', 'fj'),
			_Utils_Tuple2('flat', '♭'),
			_Utils_Tuple2('fllig', 'ﬂ'),
			_Utils_Tuple2('fltns', '▱'),
			_Utils_Tuple2('fnof', 'ƒ'),
			_Utils_Tuple2('Fopf', '\uD835\uDD3D'),
			_Utils_Tuple2('fopf', '\uD835\uDD57'),
			_Utils_Tuple2('forall', '∀'),
			_Utils_Tuple2('ForAll', '∀'),
			_Utils_Tuple2('fork', '⋔'),
			_Utils_Tuple2('forkv', '⫙'),
			_Utils_Tuple2('Fouriertrf', 'ℱ'),
			_Utils_Tuple2('fpartint', '⨍'),
			_Utils_Tuple2('frac12', '½'),
			_Utils_Tuple2('frac13', '⅓'),
			_Utils_Tuple2('frac14', '¼'),
			_Utils_Tuple2('frac15', '⅕'),
			_Utils_Tuple2('frac16', '⅙'),
			_Utils_Tuple2('frac18', '⅛'),
			_Utils_Tuple2('frac23', '⅔'),
			_Utils_Tuple2('frac25', '⅖'),
			_Utils_Tuple2('frac34', '¾'),
			_Utils_Tuple2('frac35', '⅗'),
			_Utils_Tuple2('frac38', '⅜'),
			_Utils_Tuple2('frac45', '⅘'),
			_Utils_Tuple2('frac56', '⅚'),
			_Utils_Tuple2('frac58', '⅝'),
			_Utils_Tuple2('frac78', '⅞'),
			_Utils_Tuple2('frasl', '⁄'),
			_Utils_Tuple2('frown', '⌢'),
			_Utils_Tuple2('fscr', '\uD835\uDCBB'),
			_Utils_Tuple2('Fscr', 'ℱ'),
			_Utils_Tuple2('gacute', 'ǵ'),
			_Utils_Tuple2('Gamma', 'Γ'),
			_Utils_Tuple2('gamma', 'γ'),
			_Utils_Tuple2('Gammad', 'Ϝ'),
			_Utils_Tuple2('gammad', 'ϝ'),
			_Utils_Tuple2('gap', '⪆'),
			_Utils_Tuple2('Gbreve', 'Ğ'),
			_Utils_Tuple2('gbreve', 'ğ'),
			_Utils_Tuple2('Gcedil', 'Ģ'),
			_Utils_Tuple2('Gcirc', 'Ĝ'),
			_Utils_Tuple2('gcirc', 'ĝ'),
			_Utils_Tuple2('Gcy', 'Г'),
			_Utils_Tuple2('gcy', 'г'),
			_Utils_Tuple2('Gdot', 'Ġ'),
			_Utils_Tuple2('gdot', 'ġ'),
			_Utils_Tuple2('ge', '≥'),
			_Utils_Tuple2('gE', '≧'),
			_Utils_Tuple2('gEl', '⪌'),
			_Utils_Tuple2('gel', '⋛'),
			_Utils_Tuple2('geq', '≥'),
			_Utils_Tuple2('geqq', '≧'),
			_Utils_Tuple2('geqslant', '⩾'),
			_Utils_Tuple2('gescc', '⪩'),
			_Utils_Tuple2('ges', '⩾'),
			_Utils_Tuple2('gesdot', '⪀'),
			_Utils_Tuple2('gesdoto', '⪂'),
			_Utils_Tuple2('gesdotol', '⪄'),
			_Utils_Tuple2('gesl', '⋛︀'),
			_Utils_Tuple2('gesles', '⪔'),
			_Utils_Tuple2('Gfr', '\uD835\uDD0A'),
			_Utils_Tuple2('gfr', '\uD835\uDD24'),
			_Utils_Tuple2('gg', '≫'),
			_Utils_Tuple2('Gg', '⋙'),
			_Utils_Tuple2('ggg', '⋙'),
			_Utils_Tuple2('gimel', 'ℷ'),
			_Utils_Tuple2('GJcy', 'Ѓ'),
			_Utils_Tuple2('gjcy', 'ѓ'),
			_Utils_Tuple2('gla', '⪥'),
			_Utils_Tuple2('gl', '≷'),
			_Utils_Tuple2('glE', '⪒'),
			_Utils_Tuple2('glj', '⪤'),
			_Utils_Tuple2('gnap', '⪊'),
			_Utils_Tuple2('gnapprox', '⪊'),
			_Utils_Tuple2('gne', '⪈'),
			_Utils_Tuple2('gnE', '≩'),
			_Utils_Tuple2('gneq', '⪈'),
			_Utils_Tuple2('gneqq', '≩'),
			_Utils_Tuple2('gnsim', '⋧'),
			_Utils_Tuple2('Gopf', '\uD835\uDD3E'),
			_Utils_Tuple2('gopf', '\uD835\uDD58'),
			_Utils_Tuple2('grave', '`'),
			_Utils_Tuple2('GreaterEqual', '≥'),
			_Utils_Tuple2('GreaterEqualLess', '⋛'),
			_Utils_Tuple2('GreaterFullEqual', '≧'),
			_Utils_Tuple2('GreaterGreater', '⪢'),
			_Utils_Tuple2('GreaterLess', '≷'),
			_Utils_Tuple2('GreaterSlantEqual', '⩾'),
			_Utils_Tuple2('GreaterTilde', '≳'),
			_Utils_Tuple2('Gscr', '\uD835\uDCA2'),
			_Utils_Tuple2('gscr', 'ℊ'),
			_Utils_Tuple2('gsim', '≳'),
			_Utils_Tuple2('gsime', '⪎'),
			_Utils_Tuple2('gsiml', '⪐'),
			_Utils_Tuple2('gtcc', '⪧'),
			_Utils_Tuple2('gtcir', '⩺'),
			_Utils_Tuple2('gt', '>'),
			_Utils_Tuple2('GT', '>'),
			_Utils_Tuple2('Gt', '≫'),
			_Utils_Tuple2('gtdot', '⋗'),
			_Utils_Tuple2('gtlPar', '⦕'),
			_Utils_Tuple2('gtquest', '⩼'),
			_Utils_Tuple2('gtrapprox', '⪆'),
			_Utils_Tuple2('gtrarr', '⥸'),
			_Utils_Tuple2('gtrdot', '⋗'),
			_Utils_Tuple2('gtreqless', '⋛'),
			_Utils_Tuple2('gtreqqless', '⪌'),
			_Utils_Tuple2('gtrless', '≷'),
			_Utils_Tuple2('gtrsim', '≳'),
			_Utils_Tuple2('gvertneqq', '≩︀'),
			_Utils_Tuple2('gvnE', '≩︀'),
			_Utils_Tuple2('Hacek', 'ˇ'),
			_Utils_Tuple2('hairsp', '\u200A'),
			_Utils_Tuple2('half', '½'),
			_Utils_Tuple2('hamilt', 'ℋ'),
			_Utils_Tuple2('HARDcy', 'Ъ'),
			_Utils_Tuple2('hardcy', 'ъ'),
			_Utils_Tuple2('harrcir', '⥈'),
			_Utils_Tuple2('harr', '↔'),
			_Utils_Tuple2('hArr', '⇔'),
			_Utils_Tuple2('harrw', '↭'),
			_Utils_Tuple2('Hat', '^'),
			_Utils_Tuple2('hbar', 'ℏ'),
			_Utils_Tuple2('Hcirc', 'Ĥ'),
			_Utils_Tuple2('hcirc', 'ĥ'),
			_Utils_Tuple2('hearts', '♥'),
			_Utils_Tuple2('heartsuit', '♥'),
			_Utils_Tuple2('hellip', '…'),
			_Utils_Tuple2('hercon', '⊹'),
			_Utils_Tuple2('hfr', '\uD835\uDD25'),
			_Utils_Tuple2('Hfr', 'ℌ'),
			_Utils_Tuple2('HilbertSpace', 'ℋ'),
			_Utils_Tuple2('hksearow', '⤥'),
			_Utils_Tuple2('hkswarow', '⤦'),
			_Utils_Tuple2('hoarr', '⇿'),
			_Utils_Tuple2('homtht', '∻'),
			_Utils_Tuple2('hookleftarrow', '↩'),
			_Utils_Tuple2('hookrightarrow', '↪'),
			_Utils_Tuple2('hopf', '\uD835\uDD59'),
			_Utils_Tuple2('Hopf', 'ℍ'),
			_Utils_Tuple2('horbar', '―'),
			_Utils_Tuple2('HorizontalLine', '─'),
			_Utils_Tuple2('hscr', '\uD835\uDCBD'),
			_Utils_Tuple2('Hscr', 'ℋ'),
			_Utils_Tuple2('hslash', 'ℏ'),
			_Utils_Tuple2('Hstrok', 'Ħ'),
			_Utils_Tuple2('hstrok', 'ħ'),
			_Utils_Tuple2('HumpDownHump', '≎'),
			_Utils_Tuple2('HumpEqual', '≏'),
			_Utils_Tuple2('hybull', '⁃'),
			_Utils_Tuple2('hyphen', '‐'),
			_Utils_Tuple2('Iacute', 'Í'),
			_Utils_Tuple2('iacute', 'í'),
			_Utils_Tuple2('ic', '\u2063'),
			_Utils_Tuple2('Icirc', 'Î'),
			_Utils_Tuple2('icirc', 'î'),
			_Utils_Tuple2('Icy', 'И'),
			_Utils_Tuple2('icy', 'и'),
			_Utils_Tuple2('Idot', 'İ'),
			_Utils_Tuple2('IEcy', 'Е'),
			_Utils_Tuple2('iecy', 'е'),
			_Utils_Tuple2('iexcl', '¡'),
			_Utils_Tuple2('iff', '⇔'),
			_Utils_Tuple2('ifr', '\uD835\uDD26'),
			_Utils_Tuple2('Ifr', 'ℑ'),
			_Utils_Tuple2('Igrave', 'Ì'),
			_Utils_Tuple2('igrave', 'ì'),
			_Utils_Tuple2('ii', 'ⅈ'),
			_Utils_Tuple2('iiiint', '⨌'),
			_Utils_Tuple2('iiint', '∭'),
			_Utils_Tuple2('iinfin', '⧜'),
			_Utils_Tuple2('iiota', '℩'),
			_Utils_Tuple2('IJlig', 'Ĳ'),
			_Utils_Tuple2('ijlig', 'ĳ'),
			_Utils_Tuple2('Imacr', 'Ī'),
			_Utils_Tuple2('imacr', 'ī'),
			_Utils_Tuple2('image', 'ℑ'),
			_Utils_Tuple2('ImaginaryI', 'ⅈ'),
			_Utils_Tuple2('imagline', 'ℐ'),
			_Utils_Tuple2('imagpart', 'ℑ'),
			_Utils_Tuple2('imath', 'ı'),
			_Utils_Tuple2('Im', 'ℑ'),
			_Utils_Tuple2('imof', '⊷'),
			_Utils_Tuple2('imped', 'Ƶ'),
			_Utils_Tuple2('Implies', '⇒'),
			_Utils_Tuple2('incare', '℅'),
			_Utils_Tuple2('in', '∈'),
			_Utils_Tuple2('infin', '∞'),
			_Utils_Tuple2('infintie', '⧝'),
			_Utils_Tuple2('inodot', 'ı'),
			_Utils_Tuple2('intcal', '⊺'),
			_Utils_Tuple2('int', '∫'),
			_Utils_Tuple2('Int', '∬'),
			_Utils_Tuple2('integers', 'ℤ'),
			_Utils_Tuple2('Integral', '∫'),
			_Utils_Tuple2('intercal', '⊺'),
			_Utils_Tuple2('Intersection', '⋂'),
			_Utils_Tuple2('intlarhk', '⨗'),
			_Utils_Tuple2('intprod', '⨼'),
			_Utils_Tuple2('InvisibleComma', '\u2063'),
			_Utils_Tuple2('InvisibleTimes', '\u2062'),
			_Utils_Tuple2('IOcy', 'Ё'),
			_Utils_Tuple2('iocy', 'ё'),
			_Utils_Tuple2('Iogon', 'Į'),
			_Utils_Tuple2('iogon', 'į'),
			_Utils_Tuple2('Iopf', '\uD835\uDD40'),
			_Utils_Tuple2('iopf', '\uD835\uDD5A'),
			_Utils_Tuple2('Iota', 'Ι'),
			_Utils_Tuple2('iota', 'ι'),
			_Utils_Tuple2('iprod', '⨼'),
			_Utils_Tuple2('iquest', '¿'),
			_Utils_Tuple2('iscr', '\uD835\uDCBE'),
			_Utils_Tuple2('Iscr', 'ℐ'),
			_Utils_Tuple2('isin', '∈'),
			_Utils_Tuple2('isindot', '⋵'),
			_Utils_Tuple2('isinE', '⋹'),
			_Utils_Tuple2('isins', '⋴'),
			_Utils_Tuple2('isinsv', '⋳'),
			_Utils_Tuple2('isinv', '∈'),
			_Utils_Tuple2('it', '\u2062'),
			_Utils_Tuple2('Itilde', 'Ĩ'),
			_Utils_Tuple2('itilde', 'ĩ'),
			_Utils_Tuple2('Iukcy', 'І'),
			_Utils_Tuple2('iukcy', 'і'),
			_Utils_Tuple2('Iuml', 'Ï'),
			_Utils_Tuple2('iuml', 'ï'),
			_Utils_Tuple2('Jcirc', 'Ĵ'),
			_Utils_Tuple2('jcirc', 'ĵ'),
			_Utils_Tuple2('Jcy', 'Й'),
			_Utils_Tuple2('jcy', 'й'),
			_Utils_Tuple2('Jfr', '\uD835\uDD0D'),
			_Utils_Tuple2('jfr', '\uD835\uDD27'),
			_Utils_Tuple2('jmath', 'ȷ'),
			_Utils_Tuple2('Jopf', '\uD835\uDD41'),
			_Utils_Tuple2('jopf', '\uD835\uDD5B'),
			_Utils_Tuple2('Jscr', '\uD835\uDCA5'),
			_Utils_Tuple2('jscr', '\uD835\uDCBF'),
			_Utils_Tuple2('Jsercy', 'Ј'),
			_Utils_Tuple2('jsercy', 'ј'),
			_Utils_Tuple2('Jukcy', 'Є'),
			_Utils_Tuple2('jukcy', 'є'),
			_Utils_Tuple2('Kappa', 'Κ'),
			_Utils_Tuple2('kappa', 'κ'),
			_Utils_Tuple2('kappav', 'ϰ'),
			_Utils_Tuple2('Kcedil', 'Ķ'),
			_Utils_Tuple2('kcedil', 'ķ'),
			_Utils_Tuple2('Kcy', 'К'),
			_Utils_Tuple2('kcy', 'к'),
			_Utils_Tuple2('Kfr', '\uD835\uDD0E'),
			_Utils_Tuple2('kfr', '\uD835\uDD28'),
			_Utils_Tuple2('kgreen', 'ĸ'),
			_Utils_Tuple2('KHcy', 'Х'),
			_Utils_Tuple2('khcy', 'х'),
			_Utils_Tuple2('KJcy', 'Ќ'),
			_Utils_Tuple2('kjcy', 'ќ'),
			_Utils_Tuple2('Kopf', '\uD835\uDD42'),
			_Utils_Tuple2('kopf', '\uD835\uDD5C'),
			_Utils_Tuple2('Kscr', '\uD835\uDCA6'),
			_Utils_Tuple2('kscr', '\uD835\uDCC0'),
			_Utils_Tuple2('lAarr', '⇚'),
			_Utils_Tuple2('Lacute', 'Ĺ'),
			_Utils_Tuple2('lacute', 'ĺ'),
			_Utils_Tuple2('laemptyv', '⦴'),
			_Utils_Tuple2('lagran', 'ℒ'),
			_Utils_Tuple2('Lambda', 'Λ'),
			_Utils_Tuple2('lambda', 'λ'),
			_Utils_Tuple2('lang', '⟨'),
			_Utils_Tuple2('Lang', '⟪'),
			_Utils_Tuple2('langd', '⦑'),
			_Utils_Tuple2('langle', '⟨'),
			_Utils_Tuple2('lap', '⪅'),
			_Utils_Tuple2('Laplacetrf', 'ℒ'),
			_Utils_Tuple2('laquo', '«'),
			_Utils_Tuple2('larrb', '⇤'),
			_Utils_Tuple2('larrbfs', '⤟'),
			_Utils_Tuple2('larr', '←'),
			_Utils_Tuple2('Larr', '↞'),
			_Utils_Tuple2('lArr', '⇐'),
			_Utils_Tuple2('larrfs', '⤝'),
			_Utils_Tuple2('larrhk', '↩'),
			_Utils_Tuple2('larrlp', '↫'),
			_Utils_Tuple2('larrpl', '⤹'),
			_Utils_Tuple2('larrsim', '⥳'),
			_Utils_Tuple2('larrtl', '↢'),
			_Utils_Tuple2('latail', '⤙'),
			_Utils_Tuple2('lAtail', '⤛'),
			_Utils_Tuple2('lat', '⪫'),
			_Utils_Tuple2('late', '⪭'),
			_Utils_Tuple2('lates', '⪭︀'),
			_Utils_Tuple2('lbarr', '⤌'),
			_Utils_Tuple2('lBarr', '⤎'),
			_Utils_Tuple2('lbbrk', '❲'),
			_Utils_Tuple2('lbrace', '{'),
			_Utils_Tuple2('lbrack', '['),
			_Utils_Tuple2('lbrke', '⦋'),
			_Utils_Tuple2('lbrksld', '⦏'),
			_Utils_Tuple2('lbrkslu', '⦍'),
			_Utils_Tuple2('Lcaron', 'Ľ'),
			_Utils_Tuple2('lcaron', 'ľ'),
			_Utils_Tuple2('Lcedil', 'Ļ'),
			_Utils_Tuple2('lcedil', 'ļ'),
			_Utils_Tuple2('lceil', '⌈'),
			_Utils_Tuple2('lcub', '{'),
			_Utils_Tuple2('Lcy', 'Л'),
			_Utils_Tuple2('lcy', 'л'),
			_Utils_Tuple2('ldca', '⤶'),
			_Utils_Tuple2('ldquo', '“'),
			_Utils_Tuple2('ldquor', '„'),
			_Utils_Tuple2('ldrdhar', '⥧'),
			_Utils_Tuple2('ldrushar', '⥋'),
			_Utils_Tuple2('ldsh', '↲'),
			_Utils_Tuple2('le', '≤'),
			_Utils_Tuple2('lE', '≦'),
			_Utils_Tuple2('LeftAngleBracket', '⟨'),
			_Utils_Tuple2('LeftArrowBar', '⇤'),
			_Utils_Tuple2('leftarrow', '←'),
			_Utils_Tuple2('LeftArrow', '←'),
			_Utils_Tuple2('Leftarrow', '⇐'),
			_Utils_Tuple2('LeftArrowRightArrow', '⇆'),
			_Utils_Tuple2('leftarrowtail', '↢'),
			_Utils_Tuple2('LeftCeiling', '⌈'),
			_Utils_Tuple2('LeftDoubleBracket', '⟦'),
			_Utils_Tuple2('LeftDownTeeVector', '⥡'),
			_Utils_Tuple2('LeftDownVectorBar', '⥙'),
			_Utils_Tuple2('LeftDownVector', '⇃'),
			_Utils_Tuple2('LeftFloor', '⌊'),
			_Utils_Tuple2('leftharpoondown', '↽'),
			_Utils_Tuple2('leftharpoonup', '↼'),
			_Utils_Tuple2('leftleftarrows', '⇇'),
			_Utils_Tuple2('leftrightarrow', '↔'),
			_Utils_Tuple2('LeftRightArrow', '↔'),
			_Utils_Tuple2('Leftrightarrow', '⇔'),
			_Utils_Tuple2('leftrightarrows', '⇆'),
			_Utils_Tuple2('leftrightharpoons', '⇋'),
			_Utils_Tuple2('leftrightsquigarrow', '↭'),
			_Utils_Tuple2('LeftRightVector', '⥎'),
			_Utils_Tuple2('LeftTeeArrow', '↤'),
			_Utils_Tuple2('LeftTee', '⊣'),
			_Utils_Tuple2('LeftTeeVector', '⥚'),
			_Utils_Tuple2('leftthreetimes', '⋋'),
			_Utils_Tuple2('LeftTriangleBar', '⧏'),
			_Utils_Tuple2('LeftTriangle', '⊲'),
			_Utils_Tuple2('LeftTriangleEqual', '⊴'),
			_Utils_Tuple2('LeftUpDownVector', '⥑'),
			_Utils_Tuple2('LeftUpTeeVector', '⥠'),
			_Utils_Tuple2('LeftUpVectorBar', '⥘'),
			_Utils_Tuple2('LeftUpVector', '↿'),
			_Utils_Tuple2('LeftVectorBar', '⥒'),
			_Utils_Tuple2('LeftVector', '↼'),
			_Utils_Tuple2('lEg', '⪋'),
			_Utils_Tuple2('leg', '⋚'),
			_Utils_Tuple2('leq', '≤'),
			_Utils_Tuple2('leqq', '≦'),
			_Utils_Tuple2('leqslant', '⩽'),
			_Utils_Tuple2('lescc', '⪨'),
			_Utils_Tuple2('les', '⩽'),
			_Utils_Tuple2('lesdot', '⩿'),
			_Utils_Tuple2('lesdoto', '⪁'),
			_Utils_Tuple2('lesdotor', '⪃'),
			_Utils_Tuple2('lesg', '⋚︀'),
			_Utils_Tuple2('lesges', '⪓'),
			_Utils_Tuple2('lessapprox', '⪅'),
			_Utils_Tuple2('lessdot', '⋖'),
			_Utils_Tuple2('lesseqgtr', '⋚'),
			_Utils_Tuple2('lesseqqgtr', '⪋'),
			_Utils_Tuple2('LessEqualGreater', '⋚'),
			_Utils_Tuple2('LessFullEqual', '≦'),
			_Utils_Tuple2('LessGreater', '≶'),
			_Utils_Tuple2('lessgtr', '≶'),
			_Utils_Tuple2('LessLess', '⪡'),
			_Utils_Tuple2('lesssim', '≲'),
			_Utils_Tuple2('LessSlantEqual', '⩽'),
			_Utils_Tuple2('LessTilde', '≲'),
			_Utils_Tuple2('lfisht', '⥼'),
			_Utils_Tuple2('lfloor', '⌊'),
			_Utils_Tuple2('Lfr', '\uD835\uDD0F'),
			_Utils_Tuple2('lfr', '\uD835\uDD29'),
			_Utils_Tuple2('lg', '≶'),
			_Utils_Tuple2('lgE', '⪑'),
			_Utils_Tuple2('lHar', '⥢'),
			_Utils_Tuple2('lhard', '↽'),
			_Utils_Tuple2('lharu', '↼'),
			_Utils_Tuple2('lharul', '⥪'),
			_Utils_Tuple2('lhblk', '▄'),
			_Utils_Tuple2('LJcy', 'Љ'),
			_Utils_Tuple2('ljcy', 'љ'),
			_Utils_Tuple2('llarr', '⇇'),
			_Utils_Tuple2('ll', '≪'),
			_Utils_Tuple2('Ll', '⋘'),
			_Utils_Tuple2('llcorner', '⌞'),
			_Utils_Tuple2('Lleftarrow', '⇚'),
			_Utils_Tuple2('llhard', '⥫'),
			_Utils_Tuple2('lltri', '◺'),
			_Utils_Tuple2('Lmidot', 'Ŀ'),
			_Utils_Tuple2('lmidot', 'ŀ'),
			_Utils_Tuple2('lmoustache', '⎰'),
			_Utils_Tuple2('lmoust', '⎰'),
			_Utils_Tuple2('lnap', '⪉'),
			_Utils_Tuple2('lnapprox', '⪉'),
			_Utils_Tuple2('lne', '⪇'),
			_Utils_Tuple2('lnE', '≨'),
			_Utils_Tuple2('lneq', '⪇'),
			_Utils_Tuple2('lneqq', '≨'),
			_Utils_Tuple2('lnsim', '⋦'),
			_Utils_Tuple2('loang', '⟬'),
			_Utils_Tuple2('loarr', '⇽'),
			_Utils_Tuple2('lobrk', '⟦'),
			_Utils_Tuple2('longleftarrow', '⟵'),
			_Utils_Tuple2('LongLeftArrow', '⟵'),
			_Utils_Tuple2('Longleftarrow', '⟸'),
			_Utils_Tuple2('longleftrightarrow', '⟷'),
			_Utils_Tuple2('LongLeftRightArrow', '⟷'),
			_Utils_Tuple2('Longleftrightarrow', '⟺'),
			_Utils_Tuple2('longmapsto', '⟼'),
			_Utils_Tuple2('longrightarrow', '⟶'),
			_Utils_Tuple2('LongRightArrow', '⟶'),
			_Utils_Tuple2('Longrightarrow', '⟹'),
			_Utils_Tuple2('looparrowleft', '↫'),
			_Utils_Tuple2('looparrowright', '↬'),
			_Utils_Tuple2('lopar', '⦅'),
			_Utils_Tuple2('Lopf', '\uD835\uDD43'),
			_Utils_Tuple2('lopf', '\uD835\uDD5D'),
			_Utils_Tuple2('loplus', '⨭'),
			_Utils_Tuple2('lotimes', '⨴'),
			_Utils_Tuple2('lowast', '∗'),
			_Utils_Tuple2('lowbar', '_'),
			_Utils_Tuple2('LowerLeftArrow', '↙'),
			_Utils_Tuple2('LowerRightArrow', '↘'),
			_Utils_Tuple2('loz', '◊'),
			_Utils_Tuple2('lozenge', '◊'),
			_Utils_Tuple2('lozf', '⧫'),
			_Utils_Tuple2('lpar', '('),
			_Utils_Tuple2('lparlt', '⦓'),
			_Utils_Tuple2('lrarr', '⇆'),
			_Utils_Tuple2('lrcorner', '⌟'),
			_Utils_Tuple2('lrhar', '⇋'),
			_Utils_Tuple2('lrhard', '⥭'),
			_Utils_Tuple2('lrm', '\u200E'),
			_Utils_Tuple2('lrtri', '⊿'),
			_Utils_Tuple2('lsaquo', '‹'),
			_Utils_Tuple2('lscr', '\uD835\uDCC1'),
			_Utils_Tuple2('Lscr', 'ℒ'),
			_Utils_Tuple2('lsh', '↰'),
			_Utils_Tuple2('Lsh', '↰'),
			_Utils_Tuple2('lsim', '≲'),
			_Utils_Tuple2('lsime', '⪍'),
			_Utils_Tuple2('lsimg', '⪏'),
			_Utils_Tuple2('lsqb', '['),
			_Utils_Tuple2('lsquo', '‘'),
			_Utils_Tuple2('lsquor', '‚'),
			_Utils_Tuple2('Lstrok', 'Ł'),
			_Utils_Tuple2('lstrok', 'ł'),
			_Utils_Tuple2('ltcc', '⪦'),
			_Utils_Tuple2('ltcir', '⩹'),
			_Utils_Tuple2('lt', '<'),
			_Utils_Tuple2('LT', '<'),
			_Utils_Tuple2('Lt', '≪'),
			_Utils_Tuple2('ltdot', '⋖'),
			_Utils_Tuple2('lthree', '⋋'),
			_Utils_Tuple2('ltimes', '⋉'),
			_Utils_Tuple2('ltlarr', '⥶'),
			_Utils_Tuple2('ltquest', '⩻'),
			_Utils_Tuple2('ltri', '◃'),
			_Utils_Tuple2('ltrie', '⊴'),
			_Utils_Tuple2('ltrif', '◂'),
			_Utils_Tuple2('ltrPar', '⦖'),
			_Utils_Tuple2('lurdshar', '⥊'),
			_Utils_Tuple2('luruhar', '⥦'),
			_Utils_Tuple2('lvertneqq', '≨︀'),
			_Utils_Tuple2('lvnE', '≨︀'),
			_Utils_Tuple2('macr', '¯'),
			_Utils_Tuple2('male', '♂'),
			_Utils_Tuple2('malt', '✠'),
			_Utils_Tuple2('maltese', '✠'),
			_Utils_Tuple2('Map', '⤅'),
			_Utils_Tuple2('map', '↦'),
			_Utils_Tuple2('mapsto', '↦'),
			_Utils_Tuple2('mapstodown', '↧'),
			_Utils_Tuple2('mapstoleft', '↤'),
			_Utils_Tuple2('mapstoup', '↥'),
			_Utils_Tuple2('marker', '▮'),
			_Utils_Tuple2('mcomma', '⨩'),
			_Utils_Tuple2('Mcy', 'М'),
			_Utils_Tuple2('mcy', 'м'),
			_Utils_Tuple2('mdash', '—'),
			_Utils_Tuple2('mDDot', '∺'),
			_Utils_Tuple2('measuredangle', '∡'),
			_Utils_Tuple2('MediumSpace', '\u205F'),
			_Utils_Tuple2('Mellintrf', 'ℳ'),
			_Utils_Tuple2('Mfr', '\uD835\uDD10'),
			_Utils_Tuple2('mfr', '\uD835\uDD2A'),
			_Utils_Tuple2('mho', '℧'),
			_Utils_Tuple2('micro', 'µ'),
			_Utils_Tuple2('midast', '*'),
			_Utils_Tuple2('midcir', '⫰'),
			_Utils_Tuple2('mid', '∣'),
			_Utils_Tuple2('middot', '·'),
			_Utils_Tuple2('minusb', '⊟'),
			_Utils_Tuple2('minus', '−'),
			_Utils_Tuple2('minusd', '∸'),
			_Utils_Tuple2('minusdu', '⨪'),
			_Utils_Tuple2('MinusPlus', '∓'),
			_Utils_Tuple2('mlcp', '⫛'),
			_Utils_Tuple2('mldr', '…'),
			_Utils_Tuple2('mnplus', '∓'),
			_Utils_Tuple2('models', '⊧'),
			_Utils_Tuple2('Mopf', '\uD835\uDD44'),
			_Utils_Tuple2('mopf', '\uD835\uDD5E'),
			_Utils_Tuple2('mp', '∓'),
			_Utils_Tuple2('mscr', '\uD835\uDCC2'),
			_Utils_Tuple2('Mscr', 'ℳ'),
			_Utils_Tuple2('mstpos', '∾'),
			_Utils_Tuple2('Mu', 'Μ'),
			_Utils_Tuple2('mu', 'μ'),
			_Utils_Tuple2('multimap', '⊸'),
			_Utils_Tuple2('mumap', '⊸'),
			_Utils_Tuple2('nabla', '∇'),
			_Utils_Tuple2('Nacute', 'Ń'),
			_Utils_Tuple2('nacute', 'ń'),
			_Utils_Tuple2('nang', '∠⃒'),
			_Utils_Tuple2('nap', '≉'),
			_Utils_Tuple2('napE', '⩰̸'),
			_Utils_Tuple2('napid', '≋̸'),
			_Utils_Tuple2('napos', 'ŉ'),
			_Utils_Tuple2('napprox', '≉'),
			_Utils_Tuple2('natural', '♮'),
			_Utils_Tuple2('naturals', 'ℕ'),
			_Utils_Tuple2('natur', '♮'),
			_Utils_Tuple2('nbsp', '\u00A0'),
			_Utils_Tuple2('nbump', '≎̸'),
			_Utils_Tuple2('nbumpe', '≏̸'),
			_Utils_Tuple2('ncap', '⩃'),
			_Utils_Tuple2('Ncaron', 'Ň'),
			_Utils_Tuple2('ncaron', 'ň'),
			_Utils_Tuple2('Ncedil', 'Ņ'),
			_Utils_Tuple2('ncedil', 'ņ'),
			_Utils_Tuple2('ncong', '≇'),
			_Utils_Tuple2('ncongdot', '⩭̸'),
			_Utils_Tuple2('ncup', '⩂'),
			_Utils_Tuple2('Ncy', 'Н'),
			_Utils_Tuple2('ncy', 'н'),
			_Utils_Tuple2('ndash', '–'),
			_Utils_Tuple2('nearhk', '⤤'),
			_Utils_Tuple2('nearr', '↗'),
			_Utils_Tuple2('neArr', '⇗'),
			_Utils_Tuple2('nearrow', '↗'),
			_Utils_Tuple2('ne', '≠'),
			_Utils_Tuple2('nedot', '≐̸'),
			_Utils_Tuple2('NegativeMediumSpace', '\u200B'),
			_Utils_Tuple2('NegativeThickSpace', '\u200B'),
			_Utils_Tuple2('NegativeThinSpace', '\u200B'),
			_Utils_Tuple2('NegativeVeryThinSpace', '\u200B'),
			_Utils_Tuple2('nequiv', '≢'),
			_Utils_Tuple2('nesear', '⤨'),
			_Utils_Tuple2('nesim', '≂̸'),
			_Utils_Tuple2('NestedGreaterGreater', '≫'),
			_Utils_Tuple2('NestedLessLess', '≪'),
			_Utils_Tuple2('NewLine', '\n'),
			_Utils_Tuple2('nexist', '∄'),
			_Utils_Tuple2('nexists', '∄'),
			_Utils_Tuple2('Nfr', '\uD835\uDD11'),
			_Utils_Tuple2('nfr', '\uD835\uDD2B'),
			_Utils_Tuple2('ngE', '≧̸'),
			_Utils_Tuple2('nge', '≱'),
			_Utils_Tuple2('ngeq', '≱'),
			_Utils_Tuple2('ngeqq', '≧̸'),
			_Utils_Tuple2('ngeqslant', '⩾̸'),
			_Utils_Tuple2('nges', '⩾̸'),
			_Utils_Tuple2('nGg', '⋙̸'),
			_Utils_Tuple2('ngsim', '≵'),
			_Utils_Tuple2('nGt', '≫⃒'),
			_Utils_Tuple2('ngt', '≯'),
			_Utils_Tuple2('ngtr', '≯'),
			_Utils_Tuple2('nGtv', '≫̸'),
			_Utils_Tuple2('nharr', '↮'),
			_Utils_Tuple2('nhArr', '⇎'),
			_Utils_Tuple2('nhpar', '⫲'),
			_Utils_Tuple2('ni', '∋'),
			_Utils_Tuple2('nis', '⋼'),
			_Utils_Tuple2('nisd', '⋺'),
			_Utils_Tuple2('niv', '∋'),
			_Utils_Tuple2('NJcy', 'Њ'),
			_Utils_Tuple2('njcy', 'њ'),
			_Utils_Tuple2('nlarr', '↚'),
			_Utils_Tuple2('nlArr', '⇍'),
			_Utils_Tuple2('nldr', '‥'),
			_Utils_Tuple2('nlE', '≦̸'),
			_Utils_Tuple2('nle', '≰'),
			_Utils_Tuple2('nleftarrow', '↚'),
			_Utils_Tuple2('nLeftarrow', '⇍'),
			_Utils_Tuple2('nleftrightarrow', '↮'),
			_Utils_Tuple2('nLeftrightarrow', '⇎'),
			_Utils_Tuple2('nleq', '≰'),
			_Utils_Tuple2('nleqq', '≦̸'),
			_Utils_Tuple2('nleqslant', '⩽̸'),
			_Utils_Tuple2('nles', '⩽̸'),
			_Utils_Tuple2('nless', '≮'),
			_Utils_Tuple2('nLl', '⋘̸'),
			_Utils_Tuple2('nlsim', '≴'),
			_Utils_Tuple2('nLt', '≪⃒'),
			_Utils_Tuple2('nlt', '≮'),
			_Utils_Tuple2('nltri', '⋪'),
			_Utils_Tuple2('nltrie', '⋬'),
			_Utils_Tuple2('nLtv', '≪̸'),
			_Utils_Tuple2('nmid', '∤'),
			_Utils_Tuple2('NoBreak', '\u2060'),
			_Utils_Tuple2('NonBreakingSpace', '\u00A0'),
			_Utils_Tuple2('nopf', '\uD835\uDD5F'),
			_Utils_Tuple2('Nopf', 'ℕ'),
			_Utils_Tuple2('Not', '⫬'),
			_Utils_Tuple2('not', '¬'),
			_Utils_Tuple2('NotCongruent', '≢'),
			_Utils_Tuple2('NotCupCap', '≭'),
			_Utils_Tuple2('NotDoubleVerticalBar', '∦'),
			_Utils_Tuple2('NotElement', '∉'),
			_Utils_Tuple2('NotEqual', '≠'),
			_Utils_Tuple2('NotEqualTilde', '≂̸'),
			_Utils_Tuple2('NotExists', '∄'),
			_Utils_Tuple2('NotGreater', '≯'),
			_Utils_Tuple2('NotGreaterEqual', '≱'),
			_Utils_Tuple2('NotGreaterFullEqual', '≧̸'),
			_Utils_Tuple2('NotGreaterGreater', '≫̸'),
			_Utils_Tuple2('NotGreaterLess', '≹'),
			_Utils_Tuple2('NotGreaterSlantEqual', '⩾̸'),
			_Utils_Tuple2('NotGreaterTilde', '≵'),
			_Utils_Tuple2('NotHumpDownHump', '≎̸'),
			_Utils_Tuple2('NotHumpEqual', '≏̸'),
			_Utils_Tuple2('notin', '∉'),
			_Utils_Tuple2('notindot', '⋵̸'),
			_Utils_Tuple2('notinE', '⋹̸'),
			_Utils_Tuple2('notinva', '∉'),
			_Utils_Tuple2('notinvb', '⋷'),
			_Utils_Tuple2('notinvc', '⋶'),
			_Utils_Tuple2('NotLeftTriangleBar', '⧏̸'),
			_Utils_Tuple2('NotLeftTriangle', '⋪'),
			_Utils_Tuple2('NotLeftTriangleEqual', '⋬'),
			_Utils_Tuple2('NotLess', '≮'),
			_Utils_Tuple2('NotLessEqual', '≰'),
			_Utils_Tuple2('NotLessGreater', '≸'),
			_Utils_Tuple2('NotLessLess', '≪̸'),
			_Utils_Tuple2('NotLessSlantEqual', '⩽̸'),
			_Utils_Tuple2('NotLessTilde', '≴'),
			_Utils_Tuple2('NotNestedGreaterGreater', '⪢̸'),
			_Utils_Tuple2('NotNestedLessLess', '⪡̸'),
			_Utils_Tuple2('notni', '∌'),
			_Utils_Tuple2('notniva', '∌'),
			_Utils_Tuple2('notnivb', '⋾'),
			_Utils_Tuple2('notnivc', '⋽'),
			_Utils_Tuple2('NotPrecedes', '⊀'),
			_Utils_Tuple2('NotPrecedesEqual', '⪯̸'),
			_Utils_Tuple2('NotPrecedesSlantEqual', '⋠'),
			_Utils_Tuple2('NotReverseElement', '∌'),
			_Utils_Tuple2('NotRightTriangleBar', '⧐̸'),
			_Utils_Tuple2('NotRightTriangle', '⋫'),
			_Utils_Tuple2('NotRightTriangleEqual', '⋭'),
			_Utils_Tuple2('NotSquareSubset', '⊏̸'),
			_Utils_Tuple2('NotSquareSubsetEqual', '⋢'),
			_Utils_Tuple2('NotSquareSuperset', '⊐̸'),
			_Utils_Tuple2('NotSquareSupersetEqual', '⋣'),
			_Utils_Tuple2('NotSubset', '⊂⃒'),
			_Utils_Tuple2('NotSubsetEqual', '⊈'),
			_Utils_Tuple2('NotSucceeds', '⊁'),
			_Utils_Tuple2('NotSucceedsEqual', '⪰̸'),
			_Utils_Tuple2('NotSucceedsSlantEqual', '⋡'),
			_Utils_Tuple2('NotSucceedsTilde', '≿̸'),
			_Utils_Tuple2('NotSuperset', '⊃⃒'),
			_Utils_Tuple2('NotSupersetEqual', '⊉'),
			_Utils_Tuple2('NotTilde', '≁'),
			_Utils_Tuple2('NotTildeEqual', '≄'),
			_Utils_Tuple2('NotTildeFullEqual', '≇'),
			_Utils_Tuple2('NotTildeTilde', '≉'),
			_Utils_Tuple2('NotVerticalBar', '∤'),
			_Utils_Tuple2('nparallel', '∦'),
			_Utils_Tuple2('npar', '∦'),
			_Utils_Tuple2('nparsl', '⫽⃥'),
			_Utils_Tuple2('npart', '∂̸'),
			_Utils_Tuple2('npolint', '⨔'),
			_Utils_Tuple2('npr', '⊀'),
			_Utils_Tuple2('nprcue', '⋠'),
			_Utils_Tuple2('nprec', '⊀'),
			_Utils_Tuple2('npreceq', '⪯̸'),
			_Utils_Tuple2('npre', '⪯̸'),
			_Utils_Tuple2('nrarrc', '⤳̸'),
			_Utils_Tuple2('nrarr', '↛'),
			_Utils_Tuple2('nrArr', '⇏'),
			_Utils_Tuple2('nrarrw', '↝̸'),
			_Utils_Tuple2('nrightarrow', '↛'),
			_Utils_Tuple2('nRightarrow', '⇏'),
			_Utils_Tuple2('nrtri', '⋫'),
			_Utils_Tuple2('nrtrie', '⋭'),
			_Utils_Tuple2('nsc', '⊁'),
			_Utils_Tuple2('nsccue', '⋡'),
			_Utils_Tuple2('nsce', '⪰̸'),
			_Utils_Tuple2('Nscr', '\uD835\uDCA9'),
			_Utils_Tuple2('nscr', '\uD835\uDCC3'),
			_Utils_Tuple2('nshortmid', '∤'),
			_Utils_Tuple2('nshortparallel', '∦'),
			_Utils_Tuple2('nsim', '≁'),
			_Utils_Tuple2('nsime', '≄'),
			_Utils_Tuple2('nsimeq', '≄'),
			_Utils_Tuple2('nsmid', '∤'),
			_Utils_Tuple2('nspar', '∦'),
			_Utils_Tuple2('nsqsube', '⋢'),
			_Utils_Tuple2('nsqsupe', '⋣'),
			_Utils_Tuple2('nsub', '⊄'),
			_Utils_Tuple2('nsubE', '⫅̸'),
			_Utils_Tuple2('nsube', '⊈'),
			_Utils_Tuple2('nsubset', '⊂⃒'),
			_Utils_Tuple2('nsubseteq', '⊈'),
			_Utils_Tuple2('nsubseteqq', '⫅̸'),
			_Utils_Tuple2('nsucc', '⊁'),
			_Utils_Tuple2('nsucceq', '⪰̸'),
			_Utils_Tuple2('nsup', '⊅'),
			_Utils_Tuple2('nsupE', '⫆̸'),
			_Utils_Tuple2('nsupe', '⊉'),
			_Utils_Tuple2('nsupset', '⊃⃒'),
			_Utils_Tuple2('nsupseteq', '⊉'),
			_Utils_Tuple2('nsupseteqq', '⫆̸'),
			_Utils_Tuple2('ntgl', '≹'),
			_Utils_Tuple2('Ntilde', 'Ñ'),
			_Utils_Tuple2('ntilde', 'ñ'),
			_Utils_Tuple2('ntlg', '≸'),
			_Utils_Tuple2('ntriangleleft', '⋪'),
			_Utils_Tuple2('ntrianglelefteq', '⋬'),
			_Utils_Tuple2('ntriangleright', '⋫'),
			_Utils_Tuple2('ntrianglerighteq', '⋭'),
			_Utils_Tuple2('Nu', 'Ν'),
			_Utils_Tuple2('nu', 'ν'),
			_Utils_Tuple2('num', '#'),
			_Utils_Tuple2('numero', '№'),
			_Utils_Tuple2('numsp', '\u2007'),
			_Utils_Tuple2('nvap', '≍⃒'),
			_Utils_Tuple2('nvdash', '⊬'),
			_Utils_Tuple2('nvDash', '⊭'),
			_Utils_Tuple2('nVdash', '⊮'),
			_Utils_Tuple2('nVDash', '⊯'),
			_Utils_Tuple2('nvge', '≥⃒'),
			_Utils_Tuple2('nvgt', '>⃒'),
			_Utils_Tuple2('nvHarr', '⤄'),
			_Utils_Tuple2('nvinfin', '⧞'),
			_Utils_Tuple2('nvlArr', '⤂'),
			_Utils_Tuple2('nvle', '≤⃒'),
			_Utils_Tuple2('nvlt', '<⃒'),
			_Utils_Tuple2('nvltrie', '⊴⃒'),
			_Utils_Tuple2('nvrArr', '⤃'),
			_Utils_Tuple2('nvrtrie', '⊵⃒'),
			_Utils_Tuple2('nvsim', '∼⃒'),
			_Utils_Tuple2('nwarhk', '⤣'),
			_Utils_Tuple2('nwarr', '↖'),
			_Utils_Tuple2('nwArr', '⇖'),
			_Utils_Tuple2('nwarrow', '↖'),
			_Utils_Tuple2('nwnear', '⤧'),
			_Utils_Tuple2('Oacute', 'Ó'),
			_Utils_Tuple2('oacute', 'ó'),
			_Utils_Tuple2('oast', '⊛'),
			_Utils_Tuple2('Ocirc', 'Ô'),
			_Utils_Tuple2('ocirc', 'ô'),
			_Utils_Tuple2('ocir', '⊚'),
			_Utils_Tuple2('Ocy', 'О'),
			_Utils_Tuple2('ocy', 'о'),
			_Utils_Tuple2('odash', '⊝'),
			_Utils_Tuple2('Odblac', 'Ő'),
			_Utils_Tuple2('odblac', 'ő'),
			_Utils_Tuple2('odiv', '⨸'),
			_Utils_Tuple2('odot', '⊙'),
			_Utils_Tuple2('odsold', '⦼'),
			_Utils_Tuple2('OElig', 'Œ'),
			_Utils_Tuple2('oelig', 'œ'),
			_Utils_Tuple2('ofcir', '⦿'),
			_Utils_Tuple2('Ofr', '\uD835\uDD12'),
			_Utils_Tuple2('ofr', '\uD835\uDD2C'),
			_Utils_Tuple2('ogon', '˛'),
			_Utils_Tuple2('Ograve', 'Ò'),
			_Utils_Tuple2('ograve', 'ò'),
			_Utils_Tuple2('ogt', '⧁'),
			_Utils_Tuple2('ohbar', '⦵'),
			_Utils_Tuple2('ohm', 'Ω'),
			_Utils_Tuple2('oint', '∮'),
			_Utils_Tuple2('olarr', '↺'),
			_Utils_Tuple2('olcir', '⦾'),
			_Utils_Tuple2('olcross', '⦻'),
			_Utils_Tuple2('oline', '‾'),
			_Utils_Tuple2('olt', '⧀'),
			_Utils_Tuple2('Omacr', 'Ō'),
			_Utils_Tuple2('omacr', 'ō'),
			_Utils_Tuple2('Omega', 'Ω'),
			_Utils_Tuple2('omega', 'ω'),
			_Utils_Tuple2('Omicron', 'Ο'),
			_Utils_Tuple2('omicron', 'ο'),
			_Utils_Tuple2('omid', '⦶'),
			_Utils_Tuple2('ominus', '⊖'),
			_Utils_Tuple2('Oopf', '\uD835\uDD46'),
			_Utils_Tuple2('oopf', '\uD835\uDD60'),
			_Utils_Tuple2('opar', '⦷'),
			_Utils_Tuple2('OpenCurlyDoubleQuote', '“'),
			_Utils_Tuple2('OpenCurlyQuote', '‘'),
			_Utils_Tuple2('operp', '⦹'),
			_Utils_Tuple2('oplus', '⊕'),
			_Utils_Tuple2('orarr', '↻'),
			_Utils_Tuple2('Or', '⩔'),
			_Utils_Tuple2('or', '∨'),
			_Utils_Tuple2('ord', '⩝'),
			_Utils_Tuple2('order', 'ℴ'),
			_Utils_Tuple2('orderof', 'ℴ'),
			_Utils_Tuple2('ordf', 'ª'),
			_Utils_Tuple2('ordm', 'º'),
			_Utils_Tuple2('origof', '⊶'),
			_Utils_Tuple2('oror', '⩖'),
			_Utils_Tuple2('orslope', '⩗'),
			_Utils_Tuple2('orv', '⩛'),
			_Utils_Tuple2('oS', 'Ⓢ'),
			_Utils_Tuple2('Oscr', '\uD835\uDCAA'),
			_Utils_Tuple2('oscr', 'ℴ'),
			_Utils_Tuple2('Oslash', 'Ø'),
			_Utils_Tuple2('oslash', 'ø'),
			_Utils_Tuple2('osol', '⊘'),
			_Utils_Tuple2('Otilde', 'Õ'),
			_Utils_Tuple2('otilde', 'õ'),
			_Utils_Tuple2('otimesas', '⨶'),
			_Utils_Tuple2('Otimes', '⨷'),
			_Utils_Tuple2('otimes', '⊗'),
			_Utils_Tuple2('Ouml', 'Ö'),
			_Utils_Tuple2('ouml', 'ö'),
			_Utils_Tuple2('ovbar', '⌽'),
			_Utils_Tuple2('OverBar', '‾'),
			_Utils_Tuple2('OverBrace', '⏞'),
			_Utils_Tuple2('OverBracket', '⎴'),
			_Utils_Tuple2('OverParenthesis', '⏜'),
			_Utils_Tuple2('para', '¶'),
			_Utils_Tuple2('parallel', '∥'),
			_Utils_Tuple2('par', '∥'),
			_Utils_Tuple2('parsim', '⫳'),
			_Utils_Tuple2('parsl', '⫽'),
			_Utils_Tuple2('part', '∂'),
			_Utils_Tuple2('PartialD', '∂'),
			_Utils_Tuple2('Pcy', 'П'),
			_Utils_Tuple2('pcy', 'п'),
			_Utils_Tuple2('percnt', '%'),
			_Utils_Tuple2('period', '.'),
			_Utils_Tuple2('permil', '‰'),
			_Utils_Tuple2('perp', '⊥'),
			_Utils_Tuple2('pertenk', '‱'),
			_Utils_Tuple2('Pfr', '\uD835\uDD13'),
			_Utils_Tuple2('pfr', '\uD835\uDD2D'),
			_Utils_Tuple2('Phi', 'Φ'),
			_Utils_Tuple2('phi', 'φ'),
			_Utils_Tuple2('phiv', 'ϕ'),
			_Utils_Tuple2('phmmat', 'ℳ'),
			_Utils_Tuple2('phone', '☎'),
			_Utils_Tuple2('Pi', 'Π'),
			_Utils_Tuple2('pi', 'π'),
			_Utils_Tuple2('pitchfork', '⋔'),
			_Utils_Tuple2('piv', 'ϖ'),
			_Utils_Tuple2('planck', 'ℏ'),
			_Utils_Tuple2('planckh', 'ℎ'),
			_Utils_Tuple2('plankv', 'ℏ'),
			_Utils_Tuple2('plusacir', '⨣'),
			_Utils_Tuple2('plusb', '⊞'),
			_Utils_Tuple2('pluscir', '⨢'),
			_Utils_Tuple2('plus', '+'),
			_Utils_Tuple2('plusdo', '∔'),
			_Utils_Tuple2('plusdu', '⨥'),
			_Utils_Tuple2('pluse', '⩲'),
			_Utils_Tuple2('PlusMinus', '±'),
			_Utils_Tuple2('plusmn', '±'),
			_Utils_Tuple2('plussim', '⨦'),
			_Utils_Tuple2('plustwo', '⨧'),
			_Utils_Tuple2('pm', '±'),
			_Utils_Tuple2('Poincareplane', 'ℌ'),
			_Utils_Tuple2('pointint', '⨕'),
			_Utils_Tuple2('popf', '\uD835\uDD61'),
			_Utils_Tuple2('Popf', 'ℙ'),
			_Utils_Tuple2('pound', '£'),
			_Utils_Tuple2('prap', '⪷'),
			_Utils_Tuple2('Pr', '⪻'),
			_Utils_Tuple2('pr', '≺'),
			_Utils_Tuple2('prcue', '≼'),
			_Utils_Tuple2('precapprox', '⪷'),
			_Utils_Tuple2('prec', '≺'),
			_Utils_Tuple2('preccurlyeq', '≼'),
			_Utils_Tuple2('Precedes', '≺'),
			_Utils_Tuple2('PrecedesEqual', '⪯'),
			_Utils_Tuple2('PrecedesSlantEqual', '≼'),
			_Utils_Tuple2('PrecedesTilde', '≾'),
			_Utils_Tuple2('preceq', '⪯'),
			_Utils_Tuple2('precnapprox', '⪹'),
			_Utils_Tuple2('precneqq', '⪵'),
			_Utils_Tuple2('precnsim', '⋨'),
			_Utils_Tuple2('pre', '⪯'),
			_Utils_Tuple2('prE', '⪳'),
			_Utils_Tuple2('precsim', '≾'),
			_Utils_Tuple2('prime', '′'),
			_Utils_Tuple2('Prime', '″'),
			_Utils_Tuple2('primes', 'ℙ'),
			_Utils_Tuple2('prnap', '⪹'),
			_Utils_Tuple2('prnE', '⪵'),
			_Utils_Tuple2('prnsim', '⋨'),
			_Utils_Tuple2('prod', '∏'),
			_Utils_Tuple2('Product', '∏'),
			_Utils_Tuple2('profalar', '⌮'),
			_Utils_Tuple2('profline', '⌒'),
			_Utils_Tuple2('profsurf', '⌓'),
			_Utils_Tuple2('prop', '∝'),
			_Utils_Tuple2('Proportional', '∝'),
			_Utils_Tuple2('Proportion', '∷'),
			_Utils_Tuple2('propto', '∝'),
			_Utils_Tuple2('prsim', '≾'),
			_Utils_Tuple2('prurel', '⊰'),
			_Utils_Tuple2('Pscr', '\uD835\uDCAB'),
			_Utils_Tuple2('pscr', '\uD835\uDCC5'),
			_Utils_Tuple2('Psi', 'Ψ'),
			_Utils_Tuple2('psi', 'ψ'),
			_Utils_Tuple2('puncsp', '\u2008'),
			_Utils_Tuple2('Qfr', '\uD835\uDD14'),
			_Utils_Tuple2('qfr', '\uD835\uDD2E'),
			_Utils_Tuple2('qint', '⨌'),
			_Utils_Tuple2('qopf', '\uD835\uDD62'),
			_Utils_Tuple2('Qopf', 'ℚ'),
			_Utils_Tuple2('qprime', '⁗'),
			_Utils_Tuple2('Qscr', '\uD835\uDCAC'),
			_Utils_Tuple2('qscr', '\uD835\uDCC6'),
			_Utils_Tuple2('quaternions', 'ℍ'),
			_Utils_Tuple2('quatint', '⨖'),
			_Utils_Tuple2('quest', '?'),
			_Utils_Tuple2('questeq', '≟'),
			_Utils_Tuple2('quot', '\"'),
			_Utils_Tuple2('QUOT', '\"'),
			_Utils_Tuple2('rAarr', '⇛'),
			_Utils_Tuple2('race', '∽̱'),
			_Utils_Tuple2('Racute', 'Ŕ'),
			_Utils_Tuple2('racute', 'ŕ'),
			_Utils_Tuple2('radic', '√'),
			_Utils_Tuple2('raemptyv', '⦳'),
			_Utils_Tuple2('rang', '⟩'),
			_Utils_Tuple2('Rang', '⟫'),
			_Utils_Tuple2('rangd', '⦒'),
			_Utils_Tuple2('range', '⦥'),
			_Utils_Tuple2('rangle', '⟩'),
			_Utils_Tuple2('raquo', '»'),
			_Utils_Tuple2('rarrap', '⥵'),
			_Utils_Tuple2('rarrb', '⇥'),
			_Utils_Tuple2('rarrbfs', '⤠'),
			_Utils_Tuple2('rarrc', '⤳'),
			_Utils_Tuple2('rarr', '→'),
			_Utils_Tuple2('Rarr', '↠'),
			_Utils_Tuple2('rArr', '⇒'),
			_Utils_Tuple2('rarrfs', '⤞'),
			_Utils_Tuple2('rarrhk', '↪'),
			_Utils_Tuple2('rarrlp', '↬'),
			_Utils_Tuple2('rarrpl', '⥅'),
			_Utils_Tuple2('rarrsim', '⥴'),
			_Utils_Tuple2('Rarrtl', '⤖'),
			_Utils_Tuple2('rarrtl', '↣'),
			_Utils_Tuple2('rarrw', '↝'),
			_Utils_Tuple2('ratail', '⤚'),
			_Utils_Tuple2('rAtail', '⤜'),
			_Utils_Tuple2('ratio', '∶'),
			_Utils_Tuple2('rationals', 'ℚ'),
			_Utils_Tuple2('rbarr', '⤍'),
			_Utils_Tuple2('rBarr', '⤏'),
			_Utils_Tuple2('RBarr', '⤐'),
			_Utils_Tuple2('rbbrk', '❳'),
			_Utils_Tuple2('rbrace', '}'),
			_Utils_Tuple2('rbrack', ']'),
			_Utils_Tuple2('rbrke', '⦌'),
			_Utils_Tuple2('rbrksld', '⦎'),
			_Utils_Tuple2('rbrkslu', '⦐'),
			_Utils_Tuple2('Rcaron', 'Ř'),
			_Utils_Tuple2('rcaron', 'ř'),
			_Utils_Tuple2('Rcedil', 'Ŗ'),
			_Utils_Tuple2('rcedil', 'ŗ'),
			_Utils_Tuple2('rceil', '⌉'),
			_Utils_Tuple2('rcub', '}'),
			_Utils_Tuple2('Rcy', 'Р'),
			_Utils_Tuple2('rcy', 'р'),
			_Utils_Tuple2('rdca', '⤷'),
			_Utils_Tuple2('rdldhar', '⥩'),
			_Utils_Tuple2('rdquo', '”'),
			_Utils_Tuple2('rdquor', '”'),
			_Utils_Tuple2('rdsh', '↳'),
			_Utils_Tuple2('real', 'ℜ'),
			_Utils_Tuple2('realine', 'ℛ'),
			_Utils_Tuple2('realpart', 'ℜ'),
			_Utils_Tuple2('reals', 'ℝ'),
			_Utils_Tuple2('Re', 'ℜ'),
			_Utils_Tuple2('rect', '▭'),
			_Utils_Tuple2('reg', '®'),
			_Utils_Tuple2('REG', '®'),
			_Utils_Tuple2('ReverseElement', '∋'),
			_Utils_Tuple2('ReverseEquilibrium', '⇋'),
			_Utils_Tuple2('ReverseUpEquilibrium', '⥯'),
			_Utils_Tuple2('rfisht', '⥽'),
			_Utils_Tuple2('rfloor', '⌋'),
			_Utils_Tuple2('rfr', '\uD835\uDD2F'),
			_Utils_Tuple2('Rfr', 'ℜ'),
			_Utils_Tuple2('rHar', '⥤'),
			_Utils_Tuple2('rhard', '⇁'),
			_Utils_Tuple2('rharu', '⇀'),
			_Utils_Tuple2('rharul', '⥬'),
			_Utils_Tuple2('Rho', 'Ρ'),
			_Utils_Tuple2('rho', 'ρ'),
			_Utils_Tuple2('rhov', 'ϱ'),
			_Utils_Tuple2('RightAngleBracket', '⟩'),
			_Utils_Tuple2('RightArrowBar', '⇥'),
			_Utils_Tuple2('rightarrow', '→'),
			_Utils_Tuple2('RightArrow', '→'),
			_Utils_Tuple2('Rightarrow', '⇒'),
			_Utils_Tuple2('RightArrowLeftArrow', '⇄'),
			_Utils_Tuple2('rightarrowtail', '↣'),
			_Utils_Tuple2('RightCeiling', '⌉'),
			_Utils_Tuple2('RightDoubleBracket', '⟧'),
			_Utils_Tuple2('RightDownTeeVector', '⥝'),
			_Utils_Tuple2('RightDownVectorBar', '⥕'),
			_Utils_Tuple2('RightDownVector', '⇂'),
			_Utils_Tuple2('RightFloor', '⌋'),
			_Utils_Tuple2('rightharpoondown', '⇁'),
			_Utils_Tuple2('rightharpoonup', '⇀'),
			_Utils_Tuple2('rightleftarrows', '⇄'),
			_Utils_Tuple2('rightleftharpoons', '⇌'),
			_Utils_Tuple2('rightrightarrows', '⇉'),
			_Utils_Tuple2('rightsquigarrow', '↝'),
			_Utils_Tuple2('RightTeeArrow', '↦'),
			_Utils_Tuple2('RightTee', '⊢'),
			_Utils_Tuple2('RightTeeVector', '⥛'),
			_Utils_Tuple2('rightthreetimes', '⋌'),
			_Utils_Tuple2('RightTriangleBar', '⧐'),
			_Utils_Tuple2('RightTriangle', '⊳'),
			_Utils_Tuple2('RightTriangleEqual', '⊵'),
			_Utils_Tuple2('RightUpDownVector', '⥏'),
			_Utils_Tuple2('RightUpTeeVector', '⥜'),
			_Utils_Tuple2('RightUpVectorBar', '⥔'),
			_Utils_Tuple2('RightUpVector', '↾'),
			_Utils_Tuple2('RightVectorBar', '⥓'),
			_Utils_Tuple2('RightVector', '⇀'),
			_Utils_Tuple2('ring', '˚'),
			_Utils_Tuple2('risingdotseq', '≓'),
			_Utils_Tuple2('rlarr', '⇄'),
			_Utils_Tuple2('rlhar', '⇌'),
			_Utils_Tuple2('rlm', '\u200F'),
			_Utils_Tuple2('rmoustache', '⎱'),
			_Utils_Tuple2('rmoust', '⎱'),
			_Utils_Tuple2('rnmid', '⫮'),
			_Utils_Tuple2('roang', '⟭'),
			_Utils_Tuple2('roarr', '⇾'),
			_Utils_Tuple2('robrk', '⟧'),
			_Utils_Tuple2('ropar', '⦆'),
			_Utils_Tuple2('ropf', '\uD835\uDD63'),
			_Utils_Tuple2('Ropf', 'ℝ'),
			_Utils_Tuple2('roplus', '⨮'),
			_Utils_Tuple2('rotimes', '⨵'),
			_Utils_Tuple2('RoundImplies', '⥰'),
			_Utils_Tuple2('rpar', ')'),
			_Utils_Tuple2('rpargt', '⦔'),
			_Utils_Tuple2('rppolint', '⨒'),
			_Utils_Tuple2('rrarr', '⇉'),
			_Utils_Tuple2('Rrightarrow', '⇛'),
			_Utils_Tuple2('rsaquo', '›'),
			_Utils_Tuple2('rscr', '\uD835\uDCC7'),
			_Utils_Tuple2('Rscr', 'ℛ'),
			_Utils_Tuple2('rsh', '↱'),
			_Utils_Tuple2('Rsh', '↱'),
			_Utils_Tuple2('rsqb', ']'),
			_Utils_Tuple2('rsquo', '’'),
			_Utils_Tuple2('rsquor', '’'),
			_Utils_Tuple2('rthree', '⋌'),
			_Utils_Tuple2('rtimes', '⋊'),
			_Utils_Tuple2('rtri', '▹'),
			_Utils_Tuple2('rtrie', '⊵'),
			_Utils_Tuple2('rtrif', '▸'),
			_Utils_Tuple2('rtriltri', '⧎'),
			_Utils_Tuple2('RuleDelayed', '⧴'),
			_Utils_Tuple2('ruluhar', '⥨'),
			_Utils_Tuple2('rx', '℞'),
			_Utils_Tuple2('Sacute', 'Ś'),
			_Utils_Tuple2('sacute', 'ś'),
			_Utils_Tuple2('sbquo', '‚'),
			_Utils_Tuple2('scap', '⪸'),
			_Utils_Tuple2('Scaron', 'Š'),
			_Utils_Tuple2('scaron', 'š'),
			_Utils_Tuple2('Sc', '⪼'),
			_Utils_Tuple2('sc', '≻'),
			_Utils_Tuple2('sccue', '≽'),
			_Utils_Tuple2('sce', '⪰'),
			_Utils_Tuple2('scE', '⪴'),
			_Utils_Tuple2('Scedil', 'Ş'),
			_Utils_Tuple2('scedil', 'ş'),
			_Utils_Tuple2('Scirc', 'Ŝ'),
			_Utils_Tuple2('scirc', 'ŝ'),
			_Utils_Tuple2('scnap', '⪺'),
			_Utils_Tuple2('scnE', '⪶'),
			_Utils_Tuple2('scnsim', '⋩'),
			_Utils_Tuple2('scpolint', '⨓'),
			_Utils_Tuple2('scsim', '≿'),
			_Utils_Tuple2('Scy', 'С'),
			_Utils_Tuple2('scy', 'с'),
			_Utils_Tuple2('sdotb', '⊡'),
			_Utils_Tuple2('sdot', '⋅'),
			_Utils_Tuple2('sdote', '⩦'),
			_Utils_Tuple2('searhk', '⤥'),
			_Utils_Tuple2('searr', '↘'),
			_Utils_Tuple2('seArr', '⇘'),
			_Utils_Tuple2('searrow', '↘'),
			_Utils_Tuple2('sect', '§'),
			_Utils_Tuple2('semi', ';'),
			_Utils_Tuple2('seswar', '⤩'),
			_Utils_Tuple2('setminus', '∖'),
			_Utils_Tuple2('setmn', '∖'),
			_Utils_Tuple2('sext', '✶'),
			_Utils_Tuple2('Sfr', '\uD835\uDD16'),
			_Utils_Tuple2('sfr', '\uD835\uDD30'),
			_Utils_Tuple2('sfrown', '⌢'),
			_Utils_Tuple2('sharp', '♯'),
			_Utils_Tuple2('SHCHcy', 'Щ'),
			_Utils_Tuple2('shchcy', 'щ'),
			_Utils_Tuple2('SHcy', 'Ш'),
			_Utils_Tuple2('shcy', 'ш'),
			_Utils_Tuple2('ShortDownArrow', '↓'),
			_Utils_Tuple2('ShortLeftArrow', '←'),
			_Utils_Tuple2('shortmid', '∣'),
			_Utils_Tuple2('shortparallel', '∥'),
			_Utils_Tuple2('ShortRightArrow', '→'),
			_Utils_Tuple2('ShortUpArrow', '↑'),
			_Utils_Tuple2('shy', '\u00AD'),
			_Utils_Tuple2('Sigma', 'Σ'),
			_Utils_Tuple2('sigma', 'σ'),
			_Utils_Tuple2('sigmaf', 'ς'),
			_Utils_Tuple2('sigmav', 'ς'),
			_Utils_Tuple2('sim', '∼'),
			_Utils_Tuple2('simdot', '⩪'),
			_Utils_Tuple2('sime', '≃'),
			_Utils_Tuple2('simeq', '≃'),
			_Utils_Tuple2('simg', '⪞'),
			_Utils_Tuple2('simgE', '⪠'),
			_Utils_Tuple2('siml', '⪝'),
			_Utils_Tuple2('simlE', '⪟'),
			_Utils_Tuple2('simne', '≆'),
			_Utils_Tuple2('simplus', '⨤'),
			_Utils_Tuple2('simrarr', '⥲'),
			_Utils_Tuple2('slarr', '←'),
			_Utils_Tuple2('SmallCircle', '∘'),
			_Utils_Tuple2('smallsetminus', '∖'),
			_Utils_Tuple2('smashp', '⨳'),
			_Utils_Tuple2('smeparsl', '⧤'),
			_Utils_Tuple2('smid', '∣'),
			_Utils_Tuple2('smile', '⌣'),
			_Utils_Tuple2('smt', '⪪'),
			_Utils_Tuple2('smte', '⪬'),
			_Utils_Tuple2('smtes', '⪬︀'),
			_Utils_Tuple2('SOFTcy', 'Ь'),
			_Utils_Tuple2('softcy', 'ь'),
			_Utils_Tuple2('solbar', '⌿'),
			_Utils_Tuple2('solb', '⧄'),
			_Utils_Tuple2('sol', '/'),
			_Utils_Tuple2('Sopf', '\uD835\uDD4A'),
			_Utils_Tuple2('sopf', '\uD835\uDD64'),
			_Utils_Tuple2('spades', '♠'),
			_Utils_Tuple2('spadesuit', '♠'),
			_Utils_Tuple2('spar', '∥'),
			_Utils_Tuple2('sqcap', '⊓'),
			_Utils_Tuple2('sqcaps', '⊓︀'),
			_Utils_Tuple2('sqcup', '⊔'),
			_Utils_Tuple2('sqcups', '⊔︀'),
			_Utils_Tuple2('Sqrt', '√'),
			_Utils_Tuple2('sqsub', '⊏'),
			_Utils_Tuple2('sqsube', '⊑'),
			_Utils_Tuple2('sqsubset', '⊏'),
			_Utils_Tuple2('sqsubseteq', '⊑'),
			_Utils_Tuple2('sqsup', '⊐'),
			_Utils_Tuple2('sqsupe', '⊒'),
			_Utils_Tuple2('sqsupset', '⊐'),
			_Utils_Tuple2('sqsupseteq', '⊒'),
			_Utils_Tuple2('square', '□'),
			_Utils_Tuple2('Square', '□'),
			_Utils_Tuple2('SquareIntersection', '⊓'),
			_Utils_Tuple2('SquareSubset', '⊏'),
			_Utils_Tuple2('SquareSubsetEqual', '⊑'),
			_Utils_Tuple2('SquareSuperset', '⊐'),
			_Utils_Tuple2('SquareSupersetEqual', '⊒'),
			_Utils_Tuple2('SquareUnion', '⊔'),
			_Utils_Tuple2('squarf', '▪'),
			_Utils_Tuple2('squ', '□'),
			_Utils_Tuple2('squf', '▪'),
			_Utils_Tuple2('srarr', '→'),
			_Utils_Tuple2('Sscr', '\uD835\uDCAE'),
			_Utils_Tuple2('sscr', '\uD835\uDCC8'),
			_Utils_Tuple2('ssetmn', '∖'),
			_Utils_Tuple2('ssmile', '⌣'),
			_Utils_Tuple2('sstarf', '⋆'),
			_Utils_Tuple2('Star', '⋆'),
			_Utils_Tuple2('star', '☆'),
			_Utils_Tuple2('starf', '★'),
			_Utils_Tuple2('straightepsilon', 'ϵ'),
			_Utils_Tuple2('straightphi', 'ϕ'),
			_Utils_Tuple2('strns', '¯'),
			_Utils_Tuple2('sub', '⊂'),
			_Utils_Tuple2('Sub', '⋐'),
			_Utils_Tuple2('subdot', '⪽'),
			_Utils_Tuple2('subE', '⫅'),
			_Utils_Tuple2('sube', '⊆'),
			_Utils_Tuple2('subedot', '⫃'),
			_Utils_Tuple2('submult', '⫁'),
			_Utils_Tuple2('subnE', '⫋'),
			_Utils_Tuple2('subne', '⊊'),
			_Utils_Tuple2('subplus', '⪿'),
			_Utils_Tuple2('subrarr', '⥹'),
			_Utils_Tuple2('subset', '⊂'),
			_Utils_Tuple2('Subset', '⋐'),
			_Utils_Tuple2('subseteq', '⊆'),
			_Utils_Tuple2('subseteqq', '⫅'),
			_Utils_Tuple2('SubsetEqual', '⊆'),
			_Utils_Tuple2('subsetneq', '⊊'),
			_Utils_Tuple2('subsetneqq', '⫋'),
			_Utils_Tuple2('subsim', '⫇'),
			_Utils_Tuple2('subsub', '⫕'),
			_Utils_Tuple2('subsup', '⫓'),
			_Utils_Tuple2('succapprox', '⪸'),
			_Utils_Tuple2('succ', '≻'),
			_Utils_Tuple2('succcurlyeq', '≽'),
			_Utils_Tuple2('Succeeds', '≻'),
			_Utils_Tuple2('SucceedsEqual', '⪰'),
			_Utils_Tuple2('SucceedsSlantEqual', '≽'),
			_Utils_Tuple2('SucceedsTilde', '≿'),
			_Utils_Tuple2('succeq', '⪰'),
			_Utils_Tuple2('succnapprox', '⪺'),
			_Utils_Tuple2('succneqq', '⪶'),
			_Utils_Tuple2('succnsim', '⋩'),
			_Utils_Tuple2('succsim', '≿'),
			_Utils_Tuple2('SuchThat', '∋'),
			_Utils_Tuple2('sum', '∑'),
			_Utils_Tuple2('Sum', '∑'),
			_Utils_Tuple2('sung', '♪'),
			_Utils_Tuple2('sup1', '¹'),
			_Utils_Tuple2('sup2', '²'),
			_Utils_Tuple2('sup3', '³'),
			_Utils_Tuple2('sup', '⊃'),
			_Utils_Tuple2('Sup', '⋑'),
			_Utils_Tuple2('supdot', '⪾'),
			_Utils_Tuple2('supdsub', '⫘'),
			_Utils_Tuple2('supE', '⫆'),
			_Utils_Tuple2('supe', '⊇'),
			_Utils_Tuple2('supedot', '⫄'),
			_Utils_Tuple2('Superset', '⊃'),
			_Utils_Tuple2('SupersetEqual', '⊇'),
			_Utils_Tuple2('suphsol', '⟉'),
			_Utils_Tuple2('suphsub', '⫗'),
			_Utils_Tuple2('suplarr', '⥻'),
			_Utils_Tuple2('supmult', '⫂'),
			_Utils_Tuple2('supnE', '⫌'),
			_Utils_Tuple2('supne', '⊋'),
			_Utils_Tuple2('supplus', '⫀'),
			_Utils_Tuple2('supset', '⊃'),
			_Utils_Tuple2('Supset', '⋑'),
			_Utils_Tuple2('supseteq', '⊇'),
			_Utils_Tuple2('supseteqq', '⫆'),
			_Utils_Tuple2('supsetneq', '⊋'),
			_Utils_Tuple2('supsetneqq', '⫌'),
			_Utils_Tuple2('supsim', '⫈'),
			_Utils_Tuple2('supsub', '⫔'),
			_Utils_Tuple2('supsup', '⫖'),
			_Utils_Tuple2('swarhk', '⤦'),
			_Utils_Tuple2('swarr', '↙'),
			_Utils_Tuple2('swArr', '⇙'),
			_Utils_Tuple2('swarrow', '↙'),
			_Utils_Tuple2('swnwar', '⤪'),
			_Utils_Tuple2('szlig', 'ß'),
			_Utils_Tuple2('Tab', '\t'),
			_Utils_Tuple2('target', '⌖'),
			_Utils_Tuple2('Tau', 'Τ'),
			_Utils_Tuple2('tau', 'τ'),
			_Utils_Tuple2('tbrk', '⎴'),
			_Utils_Tuple2('Tcaron', 'Ť'),
			_Utils_Tuple2('tcaron', 'ť'),
			_Utils_Tuple2('Tcedil', 'Ţ'),
			_Utils_Tuple2('tcedil', 'ţ'),
			_Utils_Tuple2('Tcy', 'Т'),
			_Utils_Tuple2('tcy', 'т'),
			_Utils_Tuple2('tdot', '⃛'),
			_Utils_Tuple2('telrec', '⌕'),
			_Utils_Tuple2('Tfr', '\uD835\uDD17'),
			_Utils_Tuple2('tfr', '\uD835\uDD31'),
			_Utils_Tuple2('there4', '∴'),
			_Utils_Tuple2('therefore', '∴'),
			_Utils_Tuple2('Therefore', '∴'),
			_Utils_Tuple2('Theta', 'Θ'),
			_Utils_Tuple2('theta', 'θ'),
			_Utils_Tuple2('thetasym', 'ϑ'),
			_Utils_Tuple2('thetav', 'ϑ'),
			_Utils_Tuple2('thickapprox', '≈'),
			_Utils_Tuple2('thicksim', '∼'),
			_Utils_Tuple2('ThickSpace', '\u205F\u200A'),
			_Utils_Tuple2('ThinSpace', '\u2009'),
			_Utils_Tuple2('thinsp', '\u2009'),
			_Utils_Tuple2('thkap', '≈'),
			_Utils_Tuple2('thksim', '∼'),
			_Utils_Tuple2('THORN', 'Þ'),
			_Utils_Tuple2('thorn', 'þ'),
			_Utils_Tuple2('tilde', '˜'),
			_Utils_Tuple2('Tilde', '∼'),
			_Utils_Tuple2('TildeEqual', '≃'),
			_Utils_Tuple2('TildeFullEqual', '≅'),
			_Utils_Tuple2('TildeTilde', '≈'),
			_Utils_Tuple2('timesbar', '⨱'),
			_Utils_Tuple2('timesb', '⊠'),
			_Utils_Tuple2('times', '×'),
			_Utils_Tuple2('timesd', '⨰'),
			_Utils_Tuple2('tint', '∭'),
			_Utils_Tuple2('toea', '⤨'),
			_Utils_Tuple2('topbot', '⌶'),
			_Utils_Tuple2('topcir', '⫱'),
			_Utils_Tuple2('top', '⊤'),
			_Utils_Tuple2('Topf', '\uD835\uDD4B'),
			_Utils_Tuple2('topf', '\uD835\uDD65'),
			_Utils_Tuple2('topfork', '⫚'),
			_Utils_Tuple2('tosa', '⤩'),
			_Utils_Tuple2('tprime', '‴'),
			_Utils_Tuple2('trade', '™'),
			_Utils_Tuple2('TRADE', '™'),
			_Utils_Tuple2('triangle', '▵'),
			_Utils_Tuple2('triangledown', '▿'),
			_Utils_Tuple2('triangleleft', '◃'),
			_Utils_Tuple2('trianglelefteq', '⊴'),
			_Utils_Tuple2('triangleq', '≜'),
			_Utils_Tuple2('triangleright', '▹'),
			_Utils_Tuple2('trianglerighteq', '⊵'),
			_Utils_Tuple2('tridot', '◬'),
			_Utils_Tuple2('trie', '≜'),
			_Utils_Tuple2('triminus', '⨺'),
			_Utils_Tuple2('TripleDot', '⃛'),
			_Utils_Tuple2('triplus', '⨹'),
			_Utils_Tuple2('trisb', '⧍'),
			_Utils_Tuple2('tritime', '⨻'),
			_Utils_Tuple2('trpezium', '⏢'),
			_Utils_Tuple2('Tscr', '\uD835\uDCAF'),
			_Utils_Tuple2('tscr', '\uD835\uDCC9'),
			_Utils_Tuple2('TScy', 'Ц'),
			_Utils_Tuple2('tscy', 'ц'),
			_Utils_Tuple2('TSHcy', 'Ћ'),
			_Utils_Tuple2('tshcy', 'ћ'),
			_Utils_Tuple2('Tstrok', 'Ŧ'),
			_Utils_Tuple2('tstrok', 'ŧ'),
			_Utils_Tuple2('twixt', '≬'),
			_Utils_Tuple2('twoheadleftarrow', '↞'),
			_Utils_Tuple2('twoheadrightarrow', '↠'),
			_Utils_Tuple2('Uacute', 'Ú'),
			_Utils_Tuple2('uacute', 'ú'),
			_Utils_Tuple2('uarr', '↑'),
			_Utils_Tuple2('Uarr', '↟'),
			_Utils_Tuple2('uArr', '⇑'),
			_Utils_Tuple2('Uarrocir', '⥉'),
			_Utils_Tuple2('Ubrcy', 'Ў'),
			_Utils_Tuple2('ubrcy', 'ў'),
			_Utils_Tuple2('Ubreve', 'Ŭ'),
			_Utils_Tuple2('ubreve', 'ŭ'),
			_Utils_Tuple2('Ucirc', 'Û'),
			_Utils_Tuple2('ucirc', 'û'),
			_Utils_Tuple2('Ucy', 'У'),
			_Utils_Tuple2('ucy', 'у'),
			_Utils_Tuple2('udarr', '⇅'),
			_Utils_Tuple2('Udblac', 'Ű'),
			_Utils_Tuple2('udblac', 'ű'),
			_Utils_Tuple2('udhar', '⥮'),
			_Utils_Tuple2('ufisht', '⥾'),
			_Utils_Tuple2('Ufr', '\uD835\uDD18'),
			_Utils_Tuple2('ufr', '\uD835\uDD32'),
			_Utils_Tuple2('Ugrave', 'Ù'),
			_Utils_Tuple2('ugrave', 'ù'),
			_Utils_Tuple2('uHar', '⥣'),
			_Utils_Tuple2('uharl', '↿'),
			_Utils_Tuple2('uharr', '↾'),
			_Utils_Tuple2('uhblk', '▀'),
			_Utils_Tuple2('ulcorn', '⌜'),
			_Utils_Tuple2('ulcorner', '⌜'),
			_Utils_Tuple2('ulcrop', '⌏'),
			_Utils_Tuple2('ultri', '◸'),
			_Utils_Tuple2('Umacr', 'Ū'),
			_Utils_Tuple2('umacr', 'ū'),
			_Utils_Tuple2('uml', '¨'),
			_Utils_Tuple2('UnderBar', '_'),
			_Utils_Tuple2('UnderBrace', '⏟'),
			_Utils_Tuple2('UnderBracket', '⎵'),
			_Utils_Tuple2('UnderParenthesis', '⏝'),
			_Utils_Tuple2('Union', '⋃'),
			_Utils_Tuple2('UnionPlus', '⊎'),
			_Utils_Tuple2('Uogon', 'Ų'),
			_Utils_Tuple2('uogon', 'ų'),
			_Utils_Tuple2('Uopf', '\uD835\uDD4C'),
			_Utils_Tuple2('uopf', '\uD835\uDD66'),
			_Utils_Tuple2('UpArrowBar', '⤒'),
			_Utils_Tuple2('uparrow', '↑'),
			_Utils_Tuple2('UpArrow', '↑'),
			_Utils_Tuple2('Uparrow', '⇑'),
			_Utils_Tuple2('UpArrowDownArrow', '⇅'),
			_Utils_Tuple2('updownarrow', '↕'),
			_Utils_Tuple2('UpDownArrow', '↕'),
			_Utils_Tuple2('Updownarrow', '⇕'),
			_Utils_Tuple2('UpEquilibrium', '⥮'),
			_Utils_Tuple2('upharpoonleft', '↿'),
			_Utils_Tuple2('upharpoonright', '↾'),
			_Utils_Tuple2('uplus', '⊎'),
			_Utils_Tuple2('UpperLeftArrow', '↖'),
			_Utils_Tuple2('UpperRightArrow', '↗'),
			_Utils_Tuple2('upsi', 'υ'),
			_Utils_Tuple2('Upsi', 'ϒ'),
			_Utils_Tuple2('upsih', 'ϒ'),
			_Utils_Tuple2('Upsilon', 'Υ'),
			_Utils_Tuple2('upsilon', 'υ'),
			_Utils_Tuple2('UpTeeArrow', '↥'),
			_Utils_Tuple2('UpTee', '⊥'),
			_Utils_Tuple2('upuparrows', '⇈'),
			_Utils_Tuple2('urcorn', '⌝'),
			_Utils_Tuple2('urcorner', '⌝'),
			_Utils_Tuple2('urcrop', '⌎'),
			_Utils_Tuple2('Uring', 'Ů'),
			_Utils_Tuple2('uring', 'ů'),
			_Utils_Tuple2('urtri', '◹'),
			_Utils_Tuple2('Uscr', '\uD835\uDCB0'),
			_Utils_Tuple2('uscr', '\uD835\uDCCA'),
			_Utils_Tuple2('utdot', '⋰'),
			_Utils_Tuple2('Utilde', 'Ũ'),
			_Utils_Tuple2('utilde', 'ũ'),
			_Utils_Tuple2('utri', '▵'),
			_Utils_Tuple2('utrif', '▴'),
			_Utils_Tuple2('uuarr', '⇈'),
			_Utils_Tuple2('Uuml', 'Ü'),
			_Utils_Tuple2('uuml', 'ü'),
			_Utils_Tuple2('uwangle', '⦧'),
			_Utils_Tuple2('vangrt', '⦜'),
			_Utils_Tuple2('varepsilon', 'ϵ'),
			_Utils_Tuple2('varkappa', 'ϰ'),
			_Utils_Tuple2('varnothing', '∅'),
			_Utils_Tuple2('varphi', 'ϕ'),
			_Utils_Tuple2('varpi', 'ϖ'),
			_Utils_Tuple2('varpropto', '∝'),
			_Utils_Tuple2('varr', '↕'),
			_Utils_Tuple2('vArr', '⇕'),
			_Utils_Tuple2('varrho', 'ϱ'),
			_Utils_Tuple2('varsigma', 'ς'),
			_Utils_Tuple2('varsubsetneq', '⊊︀'),
			_Utils_Tuple2('varsubsetneqq', '⫋︀'),
			_Utils_Tuple2('varsupsetneq', '⊋︀'),
			_Utils_Tuple2('varsupsetneqq', '⫌︀'),
			_Utils_Tuple2('vartheta', 'ϑ'),
			_Utils_Tuple2('vartriangleleft', '⊲'),
			_Utils_Tuple2('vartriangleright', '⊳'),
			_Utils_Tuple2('vBar', '⫨'),
			_Utils_Tuple2('Vbar', '⫫'),
			_Utils_Tuple2('vBarv', '⫩'),
			_Utils_Tuple2('Vcy', 'В'),
			_Utils_Tuple2('vcy', 'в'),
			_Utils_Tuple2('vdash', '⊢'),
			_Utils_Tuple2('vDash', '⊨'),
			_Utils_Tuple2('Vdash', '⊩'),
			_Utils_Tuple2('VDash', '⊫'),
			_Utils_Tuple2('Vdashl', '⫦'),
			_Utils_Tuple2('veebar', '⊻'),
			_Utils_Tuple2('vee', '∨'),
			_Utils_Tuple2('Vee', '⋁'),
			_Utils_Tuple2('veeeq', '≚'),
			_Utils_Tuple2('vellip', '⋮'),
			_Utils_Tuple2('verbar', '|'),
			_Utils_Tuple2('Verbar', '‖'),
			_Utils_Tuple2('vert', '|'),
			_Utils_Tuple2('Vert', '‖'),
			_Utils_Tuple2('VerticalBar', '∣'),
			_Utils_Tuple2('VerticalLine', '|'),
			_Utils_Tuple2('VerticalSeparator', '❘'),
			_Utils_Tuple2('VerticalTilde', '≀'),
			_Utils_Tuple2('VeryThinSpace', '\u200A'),
			_Utils_Tuple2('Vfr', '\uD835\uDD19'),
			_Utils_Tuple2('vfr', '\uD835\uDD33'),
			_Utils_Tuple2('vltri', '⊲'),
			_Utils_Tuple2('vnsub', '⊂⃒'),
			_Utils_Tuple2('vnsup', '⊃⃒'),
			_Utils_Tuple2('Vopf', '\uD835\uDD4D'),
			_Utils_Tuple2('vopf', '\uD835\uDD67'),
			_Utils_Tuple2('vprop', '∝'),
			_Utils_Tuple2('vrtri', '⊳'),
			_Utils_Tuple2('Vscr', '\uD835\uDCB1'),
			_Utils_Tuple2('vscr', '\uD835\uDCCB'),
			_Utils_Tuple2('vsubnE', '⫋︀'),
			_Utils_Tuple2('vsubne', '⊊︀'),
			_Utils_Tuple2('vsupnE', '⫌︀'),
			_Utils_Tuple2('vsupne', '⊋︀'),
			_Utils_Tuple2('Vvdash', '⊪'),
			_Utils_Tuple2('vzigzag', '⦚'),
			_Utils_Tuple2('Wcirc', 'Ŵ'),
			_Utils_Tuple2('wcirc', 'ŵ'),
			_Utils_Tuple2('wedbar', '⩟'),
			_Utils_Tuple2('wedge', '∧'),
			_Utils_Tuple2('Wedge', '⋀'),
			_Utils_Tuple2('wedgeq', '≙'),
			_Utils_Tuple2('weierp', '℘'),
			_Utils_Tuple2('Wfr', '\uD835\uDD1A'),
			_Utils_Tuple2('wfr', '\uD835\uDD34'),
			_Utils_Tuple2('Wopf', '\uD835\uDD4E'),
			_Utils_Tuple2('wopf', '\uD835\uDD68'),
			_Utils_Tuple2('wp', '℘'),
			_Utils_Tuple2('wr', '≀'),
			_Utils_Tuple2('wreath', '≀'),
			_Utils_Tuple2('Wscr', '\uD835\uDCB2'),
			_Utils_Tuple2('wscr', '\uD835\uDCCC'),
			_Utils_Tuple2('xcap', '⋂'),
			_Utils_Tuple2('xcirc', '◯'),
			_Utils_Tuple2('xcup', '⋃'),
			_Utils_Tuple2('xdtri', '▽'),
			_Utils_Tuple2('Xfr', '\uD835\uDD1B'),
			_Utils_Tuple2('xfr', '\uD835\uDD35'),
			_Utils_Tuple2('xharr', '⟷'),
			_Utils_Tuple2('xhArr', '⟺'),
			_Utils_Tuple2('Xi', 'Ξ'),
			_Utils_Tuple2('xi', 'ξ'),
			_Utils_Tuple2('xlarr', '⟵'),
			_Utils_Tuple2('xlArr', '⟸'),
			_Utils_Tuple2('xmap', '⟼'),
			_Utils_Tuple2('xnis', '⋻'),
			_Utils_Tuple2('xodot', '⨀'),
			_Utils_Tuple2('Xopf', '\uD835\uDD4F'),
			_Utils_Tuple2('xopf', '\uD835\uDD69'),
			_Utils_Tuple2('xoplus', '⨁'),
			_Utils_Tuple2('xotime', '⨂'),
			_Utils_Tuple2('xrarr', '⟶'),
			_Utils_Tuple2('xrArr', '⟹'),
			_Utils_Tuple2('Xscr', '\uD835\uDCB3'),
			_Utils_Tuple2('xscr', '\uD835\uDCCD'),
			_Utils_Tuple2('xsqcup', '⨆'),
			_Utils_Tuple2('xuplus', '⨄'),
			_Utils_Tuple2('xutri', '△'),
			_Utils_Tuple2('xvee', '⋁'),
			_Utils_Tuple2('xwedge', '⋀'),
			_Utils_Tuple2('Yacute', 'Ý'),
			_Utils_Tuple2('yacute', 'ý'),
			_Utils_Tuple2('YAcy', 'Я'),
			_Utils_Tuple2('yacy', 'я'),
			_Utils_Tuple2('Ycirc', 'Ŷ'),
			_Utils_Tuple2('ycirc', 'ŷ'),
			_Utils_Tuple2('Ycy', 'Ы'),
			_Utils_Tuple2('ycy', 'ы'),
			_Utils_Tuple2('yen', '¥'),
			_Utils_Tuple2('Yfr', '\uD835\uDD1C'),
			_Utils_Tuple2('yfr', '\uD835\uDD36'),
			_Utils_Tuple2('YIcy', 'Ї'),
			_Utils_Tuple2('yicy', 'ї'),
			_Utils_Tuple2('Yopf', '\uD835\uDD50'),
			_Utils_Tuple2('yopf', '\uD835\uDD6A'),
			_Utils_Tuple2('Yscr', '\uD835\uDCB4'),
			_Utils_Tuple2('yscr', '\uD835\uDCCE'),
			_Utils_Tuple2('YUcy', 'Ю'),
			_Utils_Tuple2('yucy', 'ю'),
			_Utils_Tuple2('yuml', 'ÿ'),
			_Utils_Tuple2('Yuml', 'Ÿ'),
			_Utils_Tuple2('Zacute', 'Ź'),
			_Utils_Tuple2('zacute', 'ź'),
			_Utils_Tuple2('Zcaron', 'Ž'),
			_Utils_Tuple2('zcaron', 'ž'),
			_Utils_Tuple2('Zcy', 'З'),
			_Utils_Tuple2('zcy', 'з'),
			_Utils_Tuple2('Zdot', 'Ż'),
			_Utils_Tuple2('zdot', 'ż'),
			_Utils_Tuple2('zeetrf', 'ℨ'),
			_Utils_Tuple2('ZeroWidthSpace', '\u200B'),
			_Utils_Tuple2('Zeta', 'Ζ'),
			_Utils_Tuple2('zeta', 'ζ'),
			_Utils_Tuple2('zfr', '\uD835\uDD37'),
			_Utils_Tuple2('Zfr', 'ℨ'),
			_Utils_Tuple2('ZHcy', 'Ж'),
			_Utils_Tuple2('zhcy', 'ж'),
			_Utils_Tuple2('zigrarr', '⇝'),
			_Utils_Tuple2('zopf', '\uD835\uDD6B'),
			_Utils_Tuple2('Zopf', 'ℤ'),
			_Utils_Tuple2('Zscr', '\uD835\uDCB5'),
			_Utils_Tuple2('zscr', '\uD835\uDCCF'),
			_Utils_Tuple2('zwj', '\u200D'),
			_Utils_Tuple2('zwnj', '\u200C')
		]));
var $author$project$Lia$Markdown$HTML$Parser$namedCharacterReference = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	function (reference) {
		return A2(
			$elm$core$Maybe$withDefault,
			'&' + (reference + ';'),
			A2($elm$core$Dict$get, reference, $author$project$Lia$Markdown$HTML$NamedCharacterReferences$dict));
	},
	$andre_dietrich$parser_combinators$Combine$regex('[a-zA-Z]+'));
var $elm$core$Char$fromCode = _Char_fromCode;
var $elm$core$Basics$pow = _Basics_pow;
var $rtfeldman$elm_hex$Hex$fromStringHelp = F3(
	function (position, chars, accumulated) {
		fromStringHelp:
		while (true) {
			if (!chars.b) {
				return $elm$core$Result$Ok(accumulated);
			} else {
				var _char = chars.a;
				var rest = chars.b;
				switch (_char.valueOf()) {
					case '0':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated;
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '1':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + A2($elm$core$Basics$pow, 16, position);
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '2':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (2 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '3':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (3 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '4':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (4 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '5':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (5 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '6':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (6 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '7':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (7 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '8':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (8 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case '9':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (9 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'a':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (10 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'b':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (11 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'c':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (12 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'd':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (13 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'e':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (14 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					case 'f':
						var $temp$position = position - 1,
							$temp$chars = rest,
							$temp$accumulated = accumulated + (15 * A2($elm$core$Basics$pow, 16, position));
						position = $temp$position;
						chars = $temp$chars;
						accumulated = $temp$accumulated;
						continue fromStringHelp;
					default:
						var nonHex = _char;
						return $elm$core$Result$Err(
							$elm$core$String$fromChar(nonHex) + ' is not a valid hexadecimal character.');
				}
			}
		}
	});
var $elm$core$String$isEmpty = function (string) {
	return string === '';
};
var $elm$core$Result$map = F2(
	function (func, ra) {
		if (ra.$ === 'Ok') {
			var a = ra.a;
			return $elm$core$Result$Ok(
				func(a));
		} else {
			var e = ra.a;
			return $elm$core$Result$Err(e);
		}
	});
var $elm$core$Result$mapError = F2(
	function (f, result) {
		if (result.$ === 'Ok') {
			var v = result.a;
			return $elm$core$Result$Ok(v);
		} else {
			var e = result.a;
			return $elm$core$Result$Err(
				f(e));
		}
	});
var $elm$core$List$tail = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(xs);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$String$foldr = _String_foldr;
var $elm$core$String$toList = function (string) {
	return A3($elm$core$String$foldr, $elm$core$List$cons, _List_Nil, string);
};
var $rtfeldman$elm_hex$Hex$fromString = function (str) {
	if ($elm$core$String$isEmpty(str)) {
		return $elm$core$Result$Err('Empty strings are not valid hexadecimal strings.');
	} else {
		var result = function () {
			if (A2($elm$core$String$startsWith, '-', str)) {
				var list = A2(
					$elm$core$Maybe$withDefault,
					_List_Nil,
					$elm$core$List$tail(
						$elm$core$String$toList(str)));
				return A2(
					$elm$core$Result$map,
					$elm$core$Basics$negate,
					A3(
						$rtfeldman$elm_hex$Hex$fromStringHelp,
						$elm$core$List$length(list) - 1,
						list,
						0));
			} else {
				return A3(
					$rtfeldman$elm_hex$Hex$fromStringHelp,
					$elm$core$String$length(str) - 1,
					$elm$core$String$toList(str),
					0);
			}
		}();
		var formatError = function (err) {
			return A2(
				$elm$core$String$join,
				' ',
				_List_fromArray(
					['\"' + (str + '\"'), 'is not a valid hexadecimal string because', err]));
		};
		return A2($elm$core$Result$mapError, formatError, result);
	}
};
var $author$project$Lia$Markdown$HTML$Parser$hexadecimal = A2(
	$andre_dietrich$parser_combinators$Combine$andThen,
	function (hex) {
		var _v0 = $rtfeldman$elm_hex$Hex$fromString(
			$elm$core$String$toLower(hex));
		if (_v0.$ === 'Ok') {
			var value = _v0.a;
			return $andre_dietrich$parser_combinators$Combine$succeed(value);
		} else {
			var err = _v0.a;
			return $andre_dietrich$parser_combinators$Combine$fail(err);
		}
	},
	$andre_dietrich$parser_combinators$Combine$regex('[0-9a-fA-F]+'));
var $author$project$Lia$Markdown$HTML$Parser$numericCharacterReference = function () {
	var codepoint = $andre_dietrich$parser_combinators$Combine$choice(
		_List_fromArray(
			[
				A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				$author$project$Lia$Markdown$HTML$Parser$hexadecimal,
				$andre_dietrich$parser_combinators$Combine$regex('(x|X)')),
				A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				$andre_dietrich$parser_combinators$Combine$Num$int,
				$andre_dietrich$parser_combinators$Combine$regex('0*'))
			]));
	return A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		A2(
			$andre_dietrich$parser_combinators$Combine$map,
			A2($elm$core$Basics$composeR, $elm$core$Char$fromCode, $elm$core$String$fromChar),
			codepoint),
		$andre_dietrich$parser_combinators$Combine$string('#'));
}();
var $author$project$Lia$Markdown$HTML$Parser$characterReference = A2(
	$andre_dietrich$parser_combinators$Combine$keep,
	$andre_dietrich$parser_combinators$Combine$choice(
		_List_fromArray(
			[
				A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				$andre_dietrich$parser_combinators$Combine$string(';'),
				$author$project$Lia$Markdown$HTML$Parser$namedCharacterReference),
				A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				$andre_dietrich$parser_combinators$Combine$string(';'),
				$author$project$Lia$Markdown$HTML$Parser$numericCharacterReference),
				$andre_dietrich$parser_combinators$Combine$succeed('&')
			])),
	$andre_dietrich$parser_combinators$Combine$string('&'));
var $author$project$Lia$Markdown$HTML$Parser$tagAttributeQuotedValue = function (quote) {
	return A2(
		$andre_dietrich$parser_combinators$Combine$ignore,
		$andre_dietrich$parser_combinators$Combine$string(quote),
		A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$elm$core$String$join(''),
				$andre_dietrich$parser_combinators$Combine$many(
					$andre_dietrich$parser_combinators$Combine$choice(
						_List_fromArray(
							[
								$andre_dietrich$parser_combinators$Combine$regex('[^&' + (quote + ']*')),
								$author$project$Lia$Markdown$HTML$Parser$characterReference
							])))),
			$andre_dietrich$parser_combinators$Combine$string(quote)));
};
var $author$project$Lia$Markdown$HTML$Parser$tagAttributeUnquotedValue = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$elm$core$String$join(''),
	$andre_dietrich$parser_combinators$Combine$many1(
		$andre_dietrich$parser_combinators$Combine$choice(
			_List_fromArray(
				[
					$andre_dietrich$parser_combinators$Combine$regex('[^\\s\"\'=<>`&]+'),
					$author$project$Lia$Markdown$HTML$Parser$characterReference
				]))));
var $author$project$Lia$Markdown$HTML$Parser$tagAttributeValue = A2(
	$andre_dietrich$parser_combinators$Combine$or,
	A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		$andre_dietrich$parser_combinators$Combine$choice(
			_List_fromArray(
				[
					$author$project$Lia$Markdown$HTML$Parser$tagAttributeUnquotedValue,
					$author$project$Lia$Markdown$HTML$Parser$tagAttributeQuotedValue('\"'),
					$author$project$Lia$Markdown$HTML$Parser$tagAttributeQuotedValue('\'')
				])),
		A2(
			$andre_dietrich$parser_combinators$Combine$ignore,
			$andre_dietrich$parser_combinators$Combine$whitespace,
			$andre_dietrich$parser_combinators$Combine$string('='))),
	$andre_dietrich$parser_combinators$Combine$succeed(''));
var $author$project$Lia$Markdown$HTML$Parser$tagAttribute = A2(
	$andre_dietrich$parser_combinators$Combine$ignore,
	$andre_dietrich$parser_combinators$Combine$whitespace,
	A2(
		$andre_dietrich$parser_combinators$Combine$andMap,
		$author$project$Lia$Markdown$HTML$Parser$tagAttributeValue,
		A2(
			$andre_dietrich$parser_combinators$Combine$ignore,
			$andre_dietrich$parser_combinators$Combine$whitespace,
			A2(
				$andre_dietrich$parser_combinators$Combine$map,
				A2($elm$core$Basics$composeR, $elm$core$String$toLower, $elm$core$Tuple$pair),
				$andre_dietrich$parser_combinators$Combine$regex('\\w+')))));
var $author$project$Lia$Markdown$HTML$Parser$tagAttributes = $andre_dietrich$parser_combinators$Combine$many($author$project$Lia$Markdown$HTML$Parser$tagAttribute);
var $author$project$Lia$Markdown$HTML$Parser$unscript = function (name) {
	return (name === 'script') ? $andre_dietrich$parser_combinators$Combine$fail('') : $andre_dietrich$parser_combinators$Combine$succeed(name);
};
var $author$project$Lia$Markdown$HTML$Parser$tagName = A2(
	$andre_dietrich$parser_combinators$Combine$andThen,
	$author$project$Lia$Markdown$HTML$Parser$unscript,
	A2(
		$andre_dietrich$parser_combinators$Combine$map,
		$elm$core$String$toLower,
		$andre_dietrich$parser_combinators$Combine$regex('\\w+(\\-\\w+)?')));
var $author$project$Lia$Markdown$HTML$Parser$parse = function (parser) {
	return A2(
		$andre_dietrich$parser_combinators$Combine$andThen,
		function (_v0) {
			var name = _v0.a;
			var attributes = _v0.b;
			return $author$project$Lia$Markdown$HTML$Parser$isVoidElement(name) ? A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				$andre_dietrich$parser_combinators$Combine$string('>'),
				A2(
					$andre_dietrich$parser_combinators$Combine$ignore,
					$andre_dietrich$parser_combinators$Combine$whitespace,
					A2(
						$andre_dietrich$parser_combinators$Combine$ignore,
						$andre_dietrich$parser_combinators$Combine$maybe(
							$andre_dietrich$parser_combinators$Combine$string('/')),
						A2(
							$andre_dietrich$parser_combinators$Combine$ignore,
							$andre_dietrich$parser_combinators$Combine$whitespace,
							$andre_dietrich$parser_combinators$Combine$succeed(
								A3($author$project$Lia$Markdown$HTML$Types$Node, name, attributes, _List_Nil)))))) : A2(
				$andre_dietrich$parser_combinators$Combine$andMap,
				A2(
					$andre_dietrich$parser_combinators$Combine$manyTill,
					A2(
						$andre_dietrich$parser_combinators$Combine$ignore,
						$andre_dietrich$parser_combinators$Combine$regex('[\\n]*'),
						parser),
					$author$project$Lia$Markdown$HTML$Parser$closingTag(name)),
				A2(
					$andre_dietrich$parser_combinators$Combine$ignore,
					$andre_dietrich$parser_combinators$Combine$regex('[ \\t]*>[ \\t]*\\n*'),
					$andre_dietrich$parser_combinators$Combine$succeed(
						A2($author$project$Lia$Markdown$HTML$Types$Node, name, attributes))));
		},
		A2(
			$andre_dietrich$parser_combinators$Combine$andMap,
			$author$project$Lia$Markdown$HTML$Parser$tagAttributes,
			A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				$andre_dietrich$parser_combinators$Combine$whitespace,
				A2(
					$andre_dietrich$parser_combinators$Combine$map,
					$elm$core$Tuple$pair,
					A2(
						$andre_dietrich$parser_combinators$Combine$keep,
						$author$project$Lia$Markdown$HTML$Parser$tagName,
						$andre_dietrich$parser_combinators$Combine$regex('[ \\t]*<[ \\t]*'))))));
};
var $author$project$Lia$Markdown$Inline$Parser$nicer_ref = F4(
	function (ref_type, info_string, url_string, title_string) {
		return A3(
			ref_type,
			info_string,
			url_string,
			$elm$core$String$isEmpty(title_string) ? url_string : title_string);
	});
var $author$project$Lia$Markdown$Inline$Parser$ref_title = A2(
	$andre_dietrich$parser_combinators$Combine$optional,
	'',
	A2(
		$andre_dietrich$parser_combinators$Combine$ignore,
		$author$project$Lia$Parser$Helper$spaces,
		A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			$author$project$Lia$Parser$Helper$stringTill(
				$andre_dietrich$parser_combinators$Combine$string('\"')),
			A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				$andre_dietrich$parser_combinators$Combine$string('\"'),
				$author$project$Lia$Parser$Helper$spaces))));
var $author$project$Lia$Markdown$Inline$Parser$ref_pattern = F3(
	function (ref_type, info_type, url_type) {
		return A2(
			$andre_dietrich$parser_combinators$Combine$ignore,
			$andre_dietrich$parser_combinators$Combine$string(')'),
			A2(
				$andre_dietrich$parser_combinators$Combine$andMap,
				$author$project$Lia$Markdown$Inline$Parser$ref_title,
				A2(
					$andre_dietrich$parser_combinators$Combine$andMap,
					url_type,
					A2(
						$andre_dietrich$parser_combinators$Combine$ignore,
						$andre_dietrich$parser_combinators$Combine$string('('),
						A2(
							$andre_dietrich$parser_combinators$Combine$map,
							$author$project$Lia$Markdown$Inline$Parser$nicer_ref(ref_type),
							info_type)))));
	});
var $author$project$Lia$Parser$Context$searchIndex = $andre_dietrich$parser_combinators$Combine$withState(
	function (state) {
		return $andre_dietrich$parser_combinators$Combine$succeed(state.search_index);
	});
var $author$project$Lia$Markdown$Inline$Parser$ref_url_1 = $andre_dietrich$parser_combinators$Combine$choice(
	_List_fromArray(
		[
			$author$project$Lia$Markdown$Inline$Parser$url,
			A2(
			$andre_dietrich$parser_combinators$Combine$andMap,
			$andre_dietrich$parser_combinators$Combine$regex('#[\\w-]+'),
			$author$project$Lia$Parser$Context$searchIndex),
			A2(
			$andre_dietrich$parser_combinators$Combine$andMap,
			$andre_dietrich$parser_combinators$Combine$regex('#\\S+'),
			$author$project$Lia$Parser$Context$searchIndex),
			$andre_dietrich$parser_combinators$Combine$regex('[^\\)\n \"]*')
		]));
var $author$project$Lia$Markdown$Inline$Parser$ref_url_2 = A2(
	$andre_dietrich$parser_combinators$Combine$or,
	$author$project$Lia$Markdown$Inline$Parser$url,
	A2(
		$andre_dietrich$parser_combinators$Combine$andMap,
		$andre_dietrich$parser_combinators$Combine$regex('[^\\)\n \"]*'),
		A2(
			$andre_dietrich$parser_combinators$Combine$map,
			$elm$core$Basics$append,
			$andre_dietrich$parser_combinators$Combine$withState(
				function (s) {
					return $andre_dietrich$parser_combinators$Combine$succeed(s.defines.base);
				}))));
var $author$project$Lia$Markdown$Inline$Parser$Symbol$smileys = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$author$project$Lia$Markdown$Inline$Types$Symbol,
	$andre_dietrich$parser_combinators$Combine$choice(
		_List_fromArray(
			[
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'🙂',
				$andre_dietrich$parser_combinators$Combine$string(':-)')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😉',
				$andre_dietrich$parser_combinators$Combine$string(';-)')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😀',
				$andre_dietrich$parser_combinators$Combine$string(':-D')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😮',
				$andre_dietrich$parser_combinators$Combine$string(':-O')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'🙁',
				$andre_dietrich$parser_combinators$Combine$string(':-(')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😐',
				$andre_dietrich$parser_combinators$Combine$string(':-|')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😕',
				$andre_dietrich$parser_combinators$Combine$string(':-/')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😕',
				$andre_dietrich$parser_combinators$Combine$string(':-\\')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😛',
				$andre_dietrich$parser_combinators$Combine$string(':-P')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😛',
				$andre_dietrich$parser_combinators$Combine$string(':-p')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😜',
				$andre_dietrich$parser_combinators$Combine$string(';-P')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😜',
				$andre_dietrich$parser_combinators$Combine$string(';-p')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😗',
				$andre_dietrich$parser_combinators$Combine$string(':-*')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😘',
				$andre_dietrich$parser_combinators$Combine$string(';-*')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😂',
				$andre_dietrich$parser_combinators$Combine$string(':\')')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😢',
				$andre_dietrich$parser_combinators$Combine$string(':\'(')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😭',
				$andre_dietrich$parser_combinators$Combine$string(':\'[')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😠',
				$andre_dietrich$parser_combinators$Combine$string(':-[')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😷',
				$andre_dietrich$parser_combinators$Combine$string(':-#')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😷',
				$andre_dietrich$parser_combinators$Combine$string(':-X')),
				A2(
				$andre_dietrich$parser_combinators$Combine$onsuccess,
				'😖',
				$andre_dietrich$parser_combinators$Combine$string(':-§'))
			])));
var $author$project$Lia$Markdown$Inline$Types$Container = F2(
	function (a, b) {
		return {$: 'Container', a: a, b: b};
	});
var $author$project$Lia$Markdown$Inline$Parser$toContainer = function (inline_list) {
	var _v0 = $author$project$Lia$Markdown$Inline$Parser$combine(inline_list);
	if (_v0.b && (!_v0.b.b)) {
		var one = _v0.a;
		return one;
	} else {
		var moreThanOne = _v0;
		return A2($author$project$Lia$Markdown$Inline$Types$Container, moreThanOne, $elm$core$Maybe$Nothing);
	}
};
var $author$project$Lia$Markdown$Inline$Parser$between_ = function (str) {
	return A2(
		$andre_dietrich$parser_combinators$Combine$map,
		$author$project$Lia$Markdown$Inline$Parser$toContainer,
		A2(
			$andre_dietrich$parser_combinators$Combine$keep,
			A2(
				$andre_dietrich$parser_combinators$Combine$manyTill,
				$author$project$Lia$Markdown$Inline$Parser$cyclic$inlines(),
				$andre_dietrich$parser_combinators$Combine$string(str)),
			$andre_dietrich$parser_combinators$Combine$string(str)));
};
function $author$project$Lia$Markdown$Inline$Parser$cyclic$reference() {
	var movie = A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_video(),
		$andre_dietrich$parser_combinators$Combine$string('!?'));
	var mail_ = A3(
		$author$project$Lia$Markdown$Inline$Parser$ref_pattern,
		$author$project$Lia$Markdown$Inline$Types$Mail,
		$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_info(),
		$author$project$Lia$Markdown$Inline$Parser$email);
	var link = A3(
		$author$project$Lia$Markdown$Inline$Parser$ref_pattern,
		$author$project$Lia$Markdown$Inline$Types$Link,
		$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_info(),
		$author$project$Lia$Markdown$Inline$Parser$ref_url_1);
	var image = A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		A3(
			$author$project$Lia$Markdown$Inline$Parser$ref_pattern,
			$author$project$Lia$Markdown$Inline$Types$Image,
			$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_info(),
			$author$project$Lia$Markdown$Inline$Parser$ref_url_2),
		$andre_dietrich$parser_combinators$Combine$string('!'));
	var embed = A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		A3(
			$author$project$Lia$Markdown$Inline$Parser$ref_pattern,
			$author$project$Lia$Markdown$Inline$Types$Embed,
			$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_info(),
			$author$project$Lia$Markdown$Inline$Parser$ref_url_1),
		$andre_dietrich$parser_combinators$Combine$string('??'));
	var audio = A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_audio(),
		$andre_dietrich$parser_combinators$Combine$string('?'));
	return A2(
		$andre_dietrich$parser_combinators$Combine$map,
		$author$project$Lia$Markdown$Inline$Types$Ref,
		$andre_dietrich$parser_combinators$Combine$choice(
			_List_fromArray(
				[embed, movie, audio, image, mail_, link])));
}
function $author$project$Lia$Markdown$Inline$Parser$cyclic$ref_video() {
	return A2(
		$andre_dietrich$parser_combinators$Combine$ignore,
		$andre_dietrich$parser_combinators$Combine$string(')'),
		A2(
			$andre_dietrich$parser_combinators$Combine$andMap,
			$author$project$Lia$Markdown$Inline$Parser$ref_title,
			A2(
				$andre_dietrich$parser_combinators$Combine$andMap,
				A2($andre_dietrich$parser_combinators$Combine$map, $author$project$Lia$Markdown$Inline$Multimedia$movie, $author$project$Lia$Markdown$Inline$Parser$ref_url_2),
				A2(
					$andre_dietrich$parser_combinators$Combine$ignore,
					$andre_dietrich$parser_combinators$Combine$string('('),
					A2(
						$andre_dietrich$parser_combinators$Combine$map,
						$author$project$Lia$Markdown$Inline$Types$Movie,
						$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_info())))));
}
function $author$project$Lia$Markdown$Inline$Parser$cyclic$ref_audio() {
	return A2(
		$andre_dietrich$parser_combinators$Combine$ignore,
		$andre_dietrich$parser_combinators$Combine$string(')'),
		A2(
			$andre_dietrich$parser_combinators$Combine$andMap,
			$author$project$Lia$Markdown$Inline$Parser$ref_title,
			A2(
				$andre_dietrich$parser_combinators$Combine$andMap,
				A2($andre_dietrich$parser_combinators$Combine$map, $author$project$Lia$Markdown$Inline$Multimedia$audio, $author$project$Lia$Markdown$Inline$Parser$ref_url_2),
				A2(
					$andre_dietrich$parser_combinators$Combine$ignore,
					$andre_dietrich$parser_combinators$Combine$string('('),
					A2(
						$andre_dietrich$parser_combinators$Combine$map,
						$author$project$Lia$Markdown$Inline$Types$Audio,
						$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_info())))));
}
function $author$project$Lia$Markdown$Inline$Parser$cyclic$ref_info() {
	return A2(
		$andre_dietrich$parser_combinators$Combine$keep,
		A2(
			$andre_dietrich$parser_combinators$Combine$manyTill,
			$author$project$Lia$Markdown$Inline$Parser$cyclic$inlines(),
			$andre_dietrich$parser_combinators$Combine$string(']')),
		$andre_dietrich$parser_combinators$Combine$string('['));
}
function $author$project$Lia$Markdown$Inline$Parser$cyclic$inlines() {
	return $andre_dietrich$parser_combinators$Combine$lazy(
		function (_v1) {
			return A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				A2(
					$andre_dietrich$parser_combinators$Combine$or,
					$author$project$Lia$Markdown$Inline$Parser$html,
					A2(
						$andre_dietrich$parser_combinators$Combine$andMap,
						A2($andre_dietrich$parser_combinators$Combine$keep, $author$project$Lia$Markdown$Inline$Parser$annotations, $author$project$Lia$Markdown$Macro$Parser$macro),
						$andre_dietrich$parser_combinators$Combine$choice(
							_List_fromArray(
								[
									$author$project$Lia$Markdown$Inline$Parser$code,
									$author$project$Lia$Markdown$Footnote$Parser$inline,
									$author$project$Lia$Markdown$Inline$Parser$cyclic$reference(),
									$author$project$Lia$Markdown$Inline$Parser$Formula$formula,
									$author$project$Lia$Markdown$Effect$Parser$inline(
									$author$project$Lia$Markdown$Inline$Parser$cyclic$inlines()),
									$author$project$Lia$Markdown$Inline$Parser$cyclic$strings()
								])))),
				$author$project$Lia$Markdown$Macro$Parser$macro);
		});
}
function $author$project$Lia$Markdown$Inline$Parser$cyclic$strings() {
	return $andre_dietrich$parser_combinators$Combine$lazy(
		function (_v0) {
			var underline = A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$author$project$Lia$Markdown$Inline$Types$Underline,
				$author$project$Lia$Markdown$Inline$Parser$between_('~~'));
			var superscript = A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$author$project$Lia$Markdown$Inline$Types$Superscript,
				$author$project$Lia$Markdown$Inline$Parser$between_('^'));
			var strike = A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$author$project$Lia$Markdown$Inline$Types$Strike,
				$author$project$Lia$Markdown$Inline$Parser$between_('~'));
			var spaces = A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$author$project$Lia$Markdown$Inline$Types$Chars,
				$andre_dietrich$parser_combinators$Combine$regex('[ \\t]+'));
			var italic = A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$author$project$Lia$Markdown$Inline$Types$Italic,
				A2(
					$andre_dietrich$parser_combinators$Combine$or,
					$author$project$Lia$Markdown$Inline$Parser$between_('*'),
					$author$project$Lia$Markdown$Inline$Parser$between_('_')));
			var escape = A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$author$project$Lia$Markdown$Inline$Types$Chars,
				A2(
					$andre_dietrich$parser_combinators$Combine$keep,
					$andre_dietrich$parser_combinators$Combine$regex('[\\^*_+-~`\\\\${}\\[\\]|#]'),
					$andre_dietrich$parser_combinators$Combine$string('\\')));
			var characters = A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$author$project$Lia$Markdown$Inline$Types$Chars,
				$andre_dietrich$parser_combinators$Combine$regex('[~:_;\\-=${}\\[\\]\\(\\)]'));
			var bold = A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$author$project$Lia$Markdown$Inline$Types$Bold,
				A2(
					$andre_dietrich$parser_combinators$Combine$or,
					$author$project$Lia$Markdown$Inline$Parser$between_('**'),
					$author$project$Lia$Markdown$Inline$Parser$between_('__')));
			var base2 = A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$author$project$Lia$Markdown$Inline$Types$Chars,
				$andre_dietrich$parser_combinators$Combine$regex('[^\n|*|+<>]+'));
			var base = A2(
				$andre_dietrich$parser_combinators$Combine$map,
				$author$project$Lia$Markdown$Inline$Types$Chars,
				$andre_dietrich$parser_combinators$Combine$regex('[^*_~:;`!\\^\\[\\]\\(\\)|{}\\\\\\n\\-<>=$ ]+'));
			return $andre_dietrich$parser_combinators$Combine$choice(
				_List_fromArray(
					[
						$author$project$Lia$Markdown$Inline$Parser$inline_url,
						base,
						$author$project$Lia$Markdown$Inline$Parser$Symbol$arrows,
						$author$project$Lia$Markdown$Inline$Parser$Symbol$smileys,
						escape,
						bold,
						italic,
						underline,
						strike,
						superscript,
						spaces,
						A2(
						$andre_dietrich$parser_combinators$Combine$map,
						$author$project$Lia$Markdown$Inline$Types$IHTML,
						$author$project$Lia$Markdown$HTML$Parser$parse(
							$author$project$Lia$Markdown$Inline$Parser$cyclic$inlines())),
						characters,
						base2
					]));
		});
}
try {
	var $author$project$Lia$Markdown$Inline$Parser$reference = $author$project$Lia$Markdown$Inline$Parser$cyclic$reference();
	$author$project$Lia$Markdown$Inline$Parser$cyclic$reference = function () {
		return $author$project$Lia$Markdown$Inline$Parser$reference;
	};
	var $author$project$Lia$Markdown$Inline$Parser$ref_video = $author$project$Lia$Markdown$Inline$Parser$cyclic$ref_video();
	$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_video = function () {
		return $author$project$Lia$Markdown$Inline$Parser$ref_video;
	};
	var $author$project$Lia$Markdown$Inline$Parser$ref_audio = $author$project$Lia$Markdown$Inline$Parser$cyclic$ref_audio();
	$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_audio = function () {
		return $author$project$Lia$Markdown$Inline$Parser$ref_audio;
	};
	var $author$project$Lia$Markdown$Inline$Parser$ref_info = $author$project$Lia$Markdown$Inline$Parser$cyclic$ref_info();
	$author$project$Lia$Markdown$Inline$Parser$cyclic$ref_info = function () {
		return $author$project$Lia$Markdown$Inline$Parser$ref_info;
	};
	var $author$project$Lia$Markdown$Inline$Parser$inlines = $author$project$Lia$Markdown$Inline$Parser$cyclic$inlines();
	$author$project$Lia$Markdown$Inline$Parser$cyclic$inlines = function () {
		return $author$project$Lia$Markdown$Inline$Parser$inlines;
	};
	var $author$project$Lia$Markdown$Inline$Parser$strings = $author$project$Lia$Markdown$Inline$Parser$cyclic$strings();
	$author$project$Lia$Markdown$Inline$Parser$cyclic$strings = function () {
		return $author$project$Lia$Markdown$Inline$Parser$strings;
	};
} catch ($) {
	throw 'Some top-level definitions from `Lia.Markdown.Inline.Parser` are causing infinite recursion:\n\n  ┌─────┐\n  │    between_\n  │     ↓\n  │    reference\n  │     ↓\n  │    ref_video\n  │     ↓\n  │    ref_audio\n  │     ↓\n  │    ref_info\n  │     ↓\n  │    inlines\n  │     ↓\n  │    strings\n  └─────┘\n\nThese errors are very tricky, so read https://elm-lang.org/0.19.1/bad-recursion to learn how to fix it!';}
var $author$project$Lia$Markdown$Inline$Parser$line = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$author$project$Lia$Markdown$Inline$Parser$combine,
	$andre_dietrich$parser_combinators$Combine$many1($author$project$Lia$Markdown$Inline$Parser$inlines));
var $author$project$Lia$Definition$Parser$inline_parser = F2(
	function (defines, str) {
		var _v0 = A3(
			$andre_dietrich$parser_combinators$Combine$runParser,
			$author$project$Lia$Markdown$Inline$Parser$line,
			A2($author$project$Lia$Parser$Context$init, $elm$core$Basics$identity, defines),
			A3($elm$core$String$replace, '\n', ' ', str));
		if (_v0.$ === 'Ok') {
			var _v1 = _v0.a;
			var rslt = _v1.c;
			return rslt;
		} else {
			return _List_Nil;
		}
	});
var $author$project$Lia$Definition$Parser$set = function (fct) {
	return $andre_dietrich$parser_combinators$Combine$modifyState(
		function (s) {
			return _Utils_update(
				s,
				{
					defines: fct(s.defines)
				});
		});
};
var $author$project$Lia$Definition$Parser$store = function (_v0) {
	var key_ = _v0.a;
	var value_ = _v0.b;
	switch (key_) {
		case 'attribute':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{
							attributes: A2(
								$elm$core$List$append,
								c.attributes,
								_List_fromArray(
									[
										A2($author$project$Lia$Definition$Parser$inline_parser, c, value_)
									]))
						});
				});
		case 'author':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{author: value_});
				});
		case 'base':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{base: value_});
				});
		case 'comment':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					var singleLineComment = $author$project$Lia$Definition$Parser$reduce(value_);
					return A2(
						$author$project$Lia$Markdown$Macro$Parser$add,
						_Utils_Tuple2('comment', singleLineComment),
						_Utils_update(
							c,
							{
								comment: A2($author$project$Lia$Definition$Parser$inline_parser, c, singleLineComment)
							}));
				});
		case 'dark':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{
							lightMode: function () {
								var _v2 = $elm$core$String$toLower(value_);
								switch (_v2) {
									case 'true':
										return $elm$core$Maybe$Just(false);
									case 'false':
										return $elm$core$Maybe$Just(true);
									default:
										return $elm$core$Maybe$Nothing;
								}
							}()
						});
				});
		case 'date':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{date: value_});
				});
		case 'email':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{email: value_});
				});
		case 'import':
			return $author$project$Lia$Definition$Parser$set(
				$author$project$Lia$Definition$Types$add_imports(value_));
		case 'language':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{language: value_});
				});
		case 'link':
			return $author$project$Lia$Definition$Parser$set(
				A2($author$project$Lia$Definition$Types$addToResources, $author$project$Lia$Definition$Types$Link, value_));
		case 'logo':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{
							logo: A2($author$project$Lia$Definition$Types$toURL, c.base, value_)
						});
				});
		case 'narrator':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{narrator: value_});
				});
		case 'script':
			return $author$project$Lia$Definition$Parser$set(
				A2($author$project$Lia$Definition$Types$addToResources, $author$project$Lia$Definition$Types$Script, value_));
		case 'translation':
			return $author$project$Lia$Definition$Parser$set(
				$author$project$Lia$Definition$Types$add_translation(value_));
		case 'version':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{version: value_});
				});
		case 'mode':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{
							mode: function () {
								var _v3 = $elm$core$String$toLower(value_);
								switch (_v3) {
									case 'textbook':
										return $elm$core$Maybe$Just($author$project$Lia$Settings$Model$Textbook);
									case 'presentation':
										return $elm$core$Maybe$Just($author$project$Lia$Settings$Model$Presentation);
									case 'slides':
										return $elm$core$Maybe$Just($author$project$Lia$Settings$Model$Slides);
									default:
										return $elm$core$Maybe$Nothing;
								}
							}()
						});
				});
		case 'debug':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{
							debug: (value_ === 'true') ? true : false
						});
				});
		case 'onload':
			return $author$project$Lia$Definition$Parser$set(
				function (c) {
					return _Utils_update(
						c,
						{onload: value_});
				});
		default:
			return $author$project$Lia$Definition$Parser$set(
				$author$project$Lia$Markdown$Macro$Parser$add(
					_Utils_Tuple2(key_, value_)));
	}
};
var $author$project$Lia$Definition$Parser$defs = $andre_dietrich$parser_combinators$Combine$choice(
	_List_fromArray(
		[
			$andre_dietrich$parser_combinators$Combine$skip(
			A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				$author$project$Lia$Definition$Parser$multiline,
				$andre_dietrich$parser_combinators$Combine$regex('@@@.*\n'))),
			$andre_dietrich$parser_combinators$Combine$skip(
			A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				$author$project$Lia$Definition$Parser$lines,
				$andre_dietrich$parser_combinators$Combine$regex('@@.*\n'))),
			A2($andre_dietrich$parser_combinators$Combine$andThen, $author$project$Lia$Definition$Parser$store, $author$project$Lia$Definition$Parser$key_value)
		]));
var $author$project$Lia$Definition$Parser$definition = $andre_dietrich$parser_combinators$Combine$lazy(
	function (_v0) {
		return $andre_dietrich$parser_combinators$Combine$skip(
			$author$project$Lia$Markdown$Inline$Parser$comment(
				A2(
					$andre_dietrich$parser_combinators$Combine$ignore,
					$andre_dietrich$parser_combinators$Combine$whitespace,
					$andre_dietrich$parser_combinators$Combine$many1(
						A2($andre_dietrich$parser_combinators$Combine$keep, $author$project$Lia$Definition$Parser$defs, $andre_dietrich$parser_combinators$Combine$whitespace)))));
	});
var $author$project$Lia$Definition$Parser$parse = $andre_dietrich$parser_combinators$Combine$skip(
	A2(
		$andre_dietrich$parser_combinators$Combine$ignore,
		$andre_dietrich$parser_combinators$Combine$whitespace,
		$andre_dietrich$parser_combinators$Combine$maybe(
			A2(
				$andre_dietrich$parser_combinators$Combine$keep,
				$andre_dietrich$parser_combinators$Combine$modifyState(
					function (s) {
						return _Utils_update(
							s,
							{defines_updated: true});
					}),
				$author$project$Lia$Definition$Parser$definition))));
var $author$project$Lia$Parser$Parser$parse_defintion = F2(
	function (base, code) {
		var _v0 = A3(
			$andre_dietrich$parser_combinators$Combine$runParser,
			A2(
				$andre_dietrich$parser_combinators$Combine$ignore,
				A2(
					$andre_dietrich$parser_combinators$Combine$or,
					$andre_dietrich$parser_combinators$Combine$string('#'),
					$author$project$Lia$Parser$Helper$stringTill(
						$andre_dietrich$parser_combinators$Combine$regex('\n#'))),
				$author$project$Lia$Definition$Parser$parse),
			A2(
				$author$project$Lia$Parser$Context$init,
				$elm$core$Basics$identity,
				$author$project$Lia$Definition$Types$default(base)),
			code);
		if (_v0.$ === 'Ok') {
			var _v1 = _v0.a;
			var state = _v1.a;
			var data = _v1.b;
			return $elm$core$Result$Ok(
				_Utils_Tuple2(state.defines, '#' + data.input));
		} else {
			var _v2 = _v0.a;
			var stream = _v2.b;
			var ms = _v2.c;
			return $elm$core$Result$Err(
				A2($author$project$Lia$Parser$Parser$formatError, ms, stream));
		}
	});
var $author$project$Lia$Script$add_imports = F2(
	function (model, code) {
		var _v0 = A2($author$project$Lia$Parser$Parser$parse_defintion, model.url, code);
		if (_v0.$ === 'Ok') {
			var _v1 = _v0.a;
			var definition = _v1.a;
			return A2($author$project$Lia$Script$add_todos, definition, model);
		} else {
			return model;
		}
	});
var $elm$json$Json$Encode$bool = _Json_wrap;
var $author$project$Worker$output = _Platform_outgoingPort(
	'output',
	function ($) {
		var a = $.a;
		var b = $.b;
		return A2(
			$elm$json$Json$Encode$list,
			$elm$core$Basics$identity,
			_List_fromArray(
				[
					$elm$json$Json$Encode$bool(a),
					$elm$json$Json$Encode$string(b)
				]));
	});
var $author$project$Worker$error = function (title) {
	return A2(
		$elm$core$Basics$composeR,
		$elm$core$Basics$append('Error (' + (title + ') -> ')),
		A2(
			$elm$core$Basics$composeR,
			$elm$core$Tuple$pair(false),
			$author$project$Worker$output));
};
var $author$project$Translations$Bg = {$: 'Bg'};
var $author$project$Translations$De = {$: 'De'};
var $author$project$Translations$Fa = {$: 'Fa'};
var $author$project$Translations$Hy = {$: 'Hy'};
var $author$project$Translations$Nl = {$: 'Nl'};
var $author$project$Translations$Ua = {$: 'Ua'};
var $author$project$Translations$getLnFromCode = function (code) {
	switch (code) {
		case 'bg':
			return $author$project$Translations$Bg;
		case 'de':
			return $author$project$Translations$De;
		case 'en':
			return $author$project$Translations$En;
		case 'fa':
			return $author$project$Translations$Fa;
		case 'hy':
			return $author$project$Translations$Hy;
		case 'nl':
			return $author$project$Translations$Nl;
		case 'ua':
			return $author$project$Translations$Ua;
		default:
			return $author$project$Translations$En;
	}
};
var $author$project$Lia$Script$init_script = F2(
	function (model, script) {
		var _v0 = A2($author$project$Lia$Parser$Parser$parse_defintion, model.origin, script);
		if (_v0.$ === 'Ok') {
			var _v1 = _v0.a;
			var definition = _v1.a;
			var code = _v1.b;
			var settings = model.settings;
			return _Utils_Tuple3(
				A2(
					$author$project$Lia$Script$add_todos,
					definition,
					_Utils_update(
						model,
						{
							definition: _Utils_update(
								definition,
								{attributes: _List_Nil}),
							settings: _Utils_update(
								settings,
								{
									light: A2($elm$core$Maybe$withDefault, settings.light, definition.lightMode),
									mode: A2($elm$core$Maybe$withDefault, settings.mode, definition.mode)
								}),
							translation: $author$project$Translations$getLnFromCode(definition.language)
						})),
				$elm$core$Maybe$Just(code),
				definition.imports);
		} else {
			var msg = _v0.a;
			return _Utils_Tuple3(
				_Utils_update(
					model,
					{
						error: $elm$core$Maybe$Just(msg)
					}),
				$elm$core$Maybe$Nothing,
				_List_Nil);
		}
	});
var $author$project$Worker$LiaParse = {$: 'LiaParse'};
var $author$project$Worker$Load_Template_Result = function (a) {
	return {$: 'Load_Template_Result', a: a};
};
var $elm$http$Http$BadStatus_ = F2(
	function (a, b) {
		return {$: 'BadStatus_', a: a, b: b};
	});
var $elm$http$Http$BadUrl_ = function (a) {
	return {$: 'BadUrl_', a: a};
};
var $elm$http$Http$GoodStatus_ = F2(
	function (a, b) {
		return {$: 'GoodStatus_', a: a, b: b};
	});
var $elm$http$Http$NetworkError_ = {$: 'NetworkError_'};
var $elm$http$Http$Receiving = function (a) {
	return {$: 'Receiving', a: a};
};
var $elm$http$Http$Sending = function (a) {
	return {$: 'Sending', a: a};
};
var $elm$http$Http$Timeout_ = {$: 'Timeout_'};
var $elm$core$Maybe$isJust = function (maybe) {
	if (maybe.$ === 'Just') {
		return true;
	} else {
		return false;
	}
};
var $elm$core$Platform$sendToSelf = _Platform_sendToSelf;
var $elm$core$Dict$getMin = function (dict) {
	getMin:
	while (true) {
		if ((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) {
			var left = dict.d;
			var $temp$dict = left;
			dict = $temp$dict;
			continue getMin;
		} else {
			return dict;
		}
	}
};
var $elm$core$Dict$moveRedLeft = function (dict) {
	if (((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) && (dict.e.$ === 'RBNode_elm_builtin')) {
		if ((dict.e.d.$ === 'RBNode_elm_builtin') && (dict.e.d.a.$ === 'Red')) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var lLeft = _v1.d;
			var lRight = _v1.e;
			var _v2 = dict.e;
			var rClr = _v2.a;
			var rK = _v2.b;
			var rV = _v2.c;
			var rLeft = _v2.d;
			var _v3 = rLeft.a;
			var rlK = rLeft.b;
			var rlV = rLeft.c;
			var rlL = rLeft.d;
			var rlR = rLeft.e;
			var rRight = _v2.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				$elm$core$Dict$Red,
				rlK,
				rlV,
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					rlL),
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, rK, rV, rlR, rRight));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v4 = dict.d;
			var lClr = _v4.a;
			var lK = _v4.b;
			var lV = _v4.c;
			var lLeft = _v4.d;
			var lRight = _v4.e;
			var _v5 = dict.e;
			var rClr = _v5.a;
			var rK = _v5.b;
			var rV = _v5.c;
			var rLeft = _v5.d;
			var rRight = _v5.e;
			if (clr.$ === 'Black') {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$moveRedRight = function (dict) {
	if (((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) && (dict.e.$ === 'RBNode_elm_builtin')) {
		if ((dict.d.d.$ === 'RBNode_elm_builtin') && (dict.d.d.a.$ === 'Red')) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var _v2 = _v1.d;
			var _v3 = _v2.a;
			var llK = _v2.b;
			var llV = _v2.c;
			var llLeft = _v2.d;
			var llRight = _v2.e;
			var lRight = _v1.e;
			var _v4 = dict.e;
			var rClr = _v4.a;
			var rK = _v4.b;
			var rV = _v4.c;
			var rLeft = _v4.d;
			var rRight = _v4.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				$elm$core$Dict$Red,
				lK,
				lV,
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, llK, llV, llLeft, llRight),
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					lRight,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight)));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v5 = dict.d;
			var lClr = _v5.a;
			var lK = _v5.b;
			var lV = _v5.c;
			var lLeft = _v5.d;
			var lRight = _v5.e;
			var _v6 = dict.e;
			var rClr = _v6.a;
			var rK = _v6.b;
			var rV = _v6.c;
			var rLeft = _v6.d;
			var rRight = _v6.e;
			if (clr.$ === 'Black') {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$removeHelpPrepEQGT = F7(
	function (targetKey, dict, color, key, value, left, right) {
		if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) {
			var _v1 = left.a;
			var lK = left.b;
			var lV = left.c;
			var lLeft = left.d;
			var lRight = left.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				lK,
				lV,
				lLeft,
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, lRight, right));
		} else {
			_v2$2:
			while (true) {
				if ((right.$ === 'RBNode_elm_builtin') && (right.a.$ === 'Black')) {
					if (right.d.$ === 'RBNode_elm_builtin') {
						if (right.d.a.$ === 'Black') {
							var _v3 = right.a;
							var _v4 = right.d;
							var _v5 = _v4.a;
							return $elm$core$Dict$moveRedRight(dict);
						} else {
							break _v2$2;
						}
					} else {
						var _v6 = right.a;
						var _v7 = right.d;
						return $elm$core$Dict$moveRedRight(dict);
					}
				} else {
					break _v2$2;
				}
			}
			return dict;
		}
	});
var $elm$core$Dict$removeMin = function (dict) {
	if ((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) {
		var color = dict.a;
		var key = dict.b;
		var value = dict.c;
		var left = dict.d;
		var lColor = left.a;
		var lLeft = left.d;
		var right = dict.e;
		if (lColor.$ === 'Black') {
			if ((lLeft.$ === 'RBNode_elm_builtin') && (lLeft.a.$ === 'Red')) {
				var _v3 = lLeft.a;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					key,
					value,
					$elm$core$Dict$removeMin(left),
					right);
			} else {
				var _v4 = $elm$core$Dict$moveRedLeft(dict);
				if (_v4.$ === 'RBNode_elm_builtin') {
					var nColor = _v4.a;
					var nKey = _v4.b;
					var nValue = _v4.c;
					var nLeft = _v4.d;
					var nRight = _v4.e;
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						$elm$core$Dict$removeMin(nLeft),
						nRight);
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			}
		} else {
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				key,
				value,
				$elm$core$Dict$removeMin(left),
				right);
		}
	} else {
		return $elm$core$Dict$RBEmpty_elm_builtin;
	}
};
var $elm$core$Dict$removeHelp = F2(
	function (targetKey, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		} else {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_cmp(targetKey, key) < 0) {
				if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Black')) {
					var _v4 = left.a;
					var lLeft = left.d;
					if ((lLeft.$ === 'RBNode_elm_builtin') && (lLeft.a.$ === 'Red')) {
						var _v6 = lLeft.a;
						return A5(
							$elm$core$Dict$RBNode_elm_builtin,
							color,
							key,
							value,
							A2($elm$core$Dict$removeHelp, targetKey, left),
							right);
					} else {
						var _v7 = $elm$core$Dict$moveRedLeft(dict);
						if (_v7.$ === 'RBNode_elm_builtin') {
							var nColor = _v7.a;
							var nKey = _v7.b;
							var nValue = _v7.c;
							var nLeft = _v7.d;
							var nRight = _v7.e;
							return A5(
								$elm$core$Dict$balance,
								nColor,
								nKey,
								nValue,
								A2($elm$core$Dict$removeHelp, targetKey, nLeft),
								nRight);
						} else {
							return $elm$core$Dict$RBEmpty_elm_builtin;
						}
					}
				} else {
					return A5(
						$elm$core$Dict$RBNode_elm_builtin,
						color,
						key,
						value,
						A2($elm$core$Dict$removeHelp, targetKey, left),
						right);
				}
			} else {
				return A2(
					$elm$core$Dict$removeHelpEQGT,
					targetKey,
					A7($elm$core$Dict$removeHelpPrepEQGT, targetKey, dict, color, key, value, left, right));
			}
		}
	});
var $elm$core$Dict$removeHelpEQGT = F2(
	function (targetKey, dict) {
		if (dict.$ === 'RBNode_elm_builtin') {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_eq(targetKey, key)) {
				var _v1 = $elm$core$Dict$getMin(right);
				if (_v1.$ === 'RBNode_elm_builtin') {
					var minKey = _v1.b;
					var minValue = _v1.c;
					return A5(
						$elm$core$Dict$balance,
						color,
						minKey,
						minValue,
						left,
						$elm$core$Dict$removeMin(right));
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			} else {
				return A5(
					$elm$core$Dict$balance,
					color,
					key,
					value,
					left,
					A2($elm$core$Dict$removeHelp, targetKey, right));
			}
		} else {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		}
	});
var $elm$core$Dict$remove = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$removeHelp, key, dict);
		if ((_v0.$ === 'RBNode_elm_builtin') && (_v0.a.$ === 'Red')) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $elm$core$Dict$update = F3(
	function (targetKey, alter, dictionary) {
		var _v0 = alter(
			A2($elm$core$Dict$get, targetKey, dictionary));
		if (_v0.$ === 'Just') {
			var value = _v0.a;
			return A3($elm$core$Dict$insert, targetKey, value, dictionary);
		} else {
			return A2($elm$core$Dict$remove, targetKey, dictionary);
		}
	});
var $elm$http$Http$expectStringResponse = F2(
	function (toMsg, toResult) {
		return A3(
			_Http_expect,
			'',
			$elm$core$Basics$identity,
			A2($elm$core$Basics$composeR, toResult, toMsg));
	});
var $elm$http$Http$BadBody = function (a) {
	return {$: 'BadBody', a: a};
};
var $elm$http$Http$BadStatus = function (a) {
	return {$: 'BadStatus', a: a};
};
var $elm$http$Http$BadUrl = function (a) {
	return {$: 'BadUrl', a: a};
};
var $elm$http$Http$NetworkError = {$: 'NetworkError'};
var $elm$http$Http$Timeout = {$: 'Timeout'};
var $elm$http$Http$resolve = F2(
	function (toResult, response) {
		switch (response.$) {
			case 'BadUrl_':
				var url = response.a;
				return $elm$core$Result$Err(
					$elm$http$Http$BadUrl(url));
			case 'Timeout_':
				return $elm$core$Result$Err($elm$http$Http$Timeout);
			case 'NetworkError_':
				return $elm$core$Result$Err($elm$http$Http$NetworkError);
			case 'BadStatus_':
				var metadata = response.a;
				return $elm$core$Result$Err(
					$elm$http$Http$BadStatus(metadata.statusCode));
			default:
				var body = response.b;
				return A2(
					$elm$core$Result$mapError,
					$elm$http$Http$BadBody,
					toResult(body));
		}
	});
var $elm$http$Http$expectString = function (toMsg) {
	return A2(
		$elm$http$Http$expectStringResponse,
		toMsg,
		$elm$http$Http$resolve($elm$core$Result$Ok));
};
var $elm$http$Http$emptyBody = _Http_emptyBody;
var $elm$http$Http$Request = function (a) {
	return {$: 'Request', a: a};
};
var $elm$http$Http$State = F2(
	function (reqs, subs) {
		return {reqs: reqs, subs: subs};
	});
var $elm$core$Task$succeed = _Scheduler_succeed;
var $elm$http$Http$init = $elm$core$Task$succeed(
	A2($elm$http$Http$State, $elm$core$Dict$empty, _List_Nil));
var $elm$core$Task$andThen = _Scheduler_andThen;
var $elm$core$Process$kill = _Scheduler_kill;
var $elm$core$Platform$sendToApp = _Platform_sendToApp;
var $elm$core$Process$spawn = _Scheduler_spawn;
var $elm$http$Http$updateReqs = F3(
	function (router, cmds, reqs) {
		updateReqs:
		while (true) {
			if (!cmds.b) {
				return $elm$core$Task$succeed(reqs);
			} else {
				var cmd = cmds.a;
				var otherCmds = cmds.b;
				if (cmd.$ === 'Cancel') {
					var tracker = cmd.a;
					var _v2 = A2($elm$core$Dict$get, tracker, reqs);
					if (_v2.$ === 'Nothing') {
						var $temp$router = router,
							$temp$cmds = otherCmds,
							$temp$reqs = reqs;
						router = $temp$router;
						cmds = $temp$cmds;
						reqs = $temp$reqs;
						continue updateReqs;
					} else {
						var pid = _v2.a;
						return A2(
							$elm$core$Task$andThen,
							function (_v3) {
								return A3(
									$elm$http$Http$updateReqs,
									router,
									otherCmds,
									A2($elm$core$Dict$remove, tracker, reqs));
							},
							$elm$core$Process$kill(pid));
					}
				} else {
					var req = cmd.a;
					return A2(
						$elm$core$Task$andThen,
						function (pid) {
							var _v4 = req.tracker;
							if (_v4.$ === 'Nothing') {
								return A3($elm$http$Http$updateReqs, router, otherCmds, reqs);
							} else {
								var tracker = _v4.a;
								return A3(
									$elm$http$Http$updateReqs,
									router,
									otherCmds,
									A3($elm$core$Dict$insert, tracker, pid, reqs));
							}
						},
						$elm$core$Process$spawn(
							A3(
								_Http_toTask,
								router,
								$elm$core$Platform$sendToApp(router),
								req)));
				}
			}
		}
	});
var $elm$http$Http$onEffects = F4(
	function (router, cmds, subs, state) {
		return A2(
			$elm$core$Task$andThen,
			function (reqs) {
				return $elm$core$Task$succeed(
					A2($elm$http$Http$State, reqs, subs));
			},
			A3($elm$http$Http$updateReqs, router, cmds, state.reqs));
	});
var $elm$core$List$maybeCons = F3(
	function (f, mx, xs) {
		var _v0 = f(mx);
		if (_v0.$ === 'Just') {
			var x = _v0.a;
			return A2($elm$core$List$cons, x, xs);
		} else {
			return xs;
		}
	});
var $elm$core$List$filterMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			$elm$core$List$maybeCons(f),
			_List_Nil,
			xs);
	});
var $elm$http$Http$maybeSend = F4(
	function (router, desiredTracker, progress, _v0) {
		var actualTracker = _v0.a;
		var toMsg = _v0.b;
		return _Utils_eq(desiredTracker, actualTracker) ? $elm$core$Maybe$Just(
			A2(
				$elm$core$Platform$sendToApp,
				router,
				toMsg(progress))) : $elm$core$Maybe$Nothing;
	});
var $elm$core$Task$map2 = F3(
	function (func, taskA, taskB) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return A2(
					$elm$core$Task$andThen,
					function (b) {
						return $elm$core$Task$succeed(
							A2(func, a, b));
					},
					taskB);
			},
			taskA);
	});
var $elm$core$Task$sequence = function (tasks) {
	return A3(
		$elm$core$List$foldr,
		$elm$core$Task$map2($elm$core$List$cons),
		$elm$core$Task$succeed(_List_Nil),
		tasks);
};
var $elm$http$Http$onSelfMsg = F3(
	function (router, _v0, state) {
		var tracker = _v0.a;
		var progress = _v0.b;
		return A2(
			$elm$core$Task$andThen,
			function (_v1) {
				return $elm$core$Task$succeed(state);
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$filterMap,
					A3($elm$http$Http$maybeSend, router, tracker, progress),
					state.subs)));
	});
var $elm$http$Http$Cancel = function (a) {
	return {$: 'Cancel', a: a};
};
var $elm$http$Http$cmdMap = F2(
	function (func, cmd) {
		if (cmd.$ === 'Cancel') {
			var tracker = cmd.a;
			return $elm$http$Http$Cancel(tracker);
		} else {
			var r = cmd.a;
			return $elm$http$Http$Request(
				{
					allowCookiesFromOtherDomains: r.allowCookiesFromOtherDomains,
					body: r.body,
					expect: A2(_Http_mapExpect, func, r.expect),
					headers: r.headers,
					method: r.method,
					timeout: r.timeout,
					tracker: r.tracker,
					url: r.url
				});
		}
	});
var $elm$http$Http$MySub = F2(
	function (a, b) {
		return {$: 'MySub', a: a, b: b};
	});
var $elm$http$Http$subMap = F2(
	function (func, _v0) {
		var tracker = _v0.a;
		var toMsg = _v0.b;
		return A2(
			$elm$http$Http$MySub,
			tracker,
			A2($elm$core$Basics$composeR, toMsg, func));
	});
_Platform_effectManagers['Http'] = _Platform_createManager($elm$http$Http$init, $elm$http$Http$onEffects, $elm$http$Http$onSelfMsg, $elm$http$Http$cmdMap, $elm$http$Http$subMap);
var $elm$http$Http$command = _Platform_leaf('Http');
var $elm$http$Http$subscription = _Platform_leaf('Http');
var $elm$http$Http$request = function (r) {
	return $elm$http$Http$command(
		$elm$http$Http$Request(
			{allowCookiesFromOtherDomains: false, body: r.body, expect: r.expect, headers: r.headers, method: r.method, timeout: r.timeout, tracker: r.tracker, url: r.url}));
};
var $elm$http$Http$get = function (r) {
	return $elm$http$Http$request(
		{body: $elm$http$Http$emptyBody, expect: r.expect, headers: _List_Nil, method: 'GET', timeout: $elm$core$Maybe$Nothing, tracker: $elm$core$Maybe$Nothing, url: r.url});
};
var $author$project$Worker$download = F2(
	function (msg, url) {
		return $elm$http$Http$get(
			{
				expect: $elm$http$Http$expectString(msg),
				url: url
			});
	});
var $elm$core$Task$Perform = function (a) {
	return {$: 'Perform', a: a};
};
var $elm$core$Task$init = $elm$core$Task$succeed(_Utils_Tuple0);
var $elm$core$Task$map = F2(
	function (func, taskA) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return $elm$core$Task$succeed(
					func(a));
			},
			taskA);
	});
var $elm$core$Task$spawnCmd = F2(
	function (router, _v0) {
		var task = _v0.a;
		return _Scheduler_spawn(
			A2(
				$elm$core$Task$andThen,
				$elm$core$Platform$sendToApp(router),
				task));
	});
var $elm$core$Task$onEffects = F3(
	function (router, commands, state) {
		return A2(
			$elm$core$Task$map,
			function (_v0) {
				return _Utils_Tuple0;
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$map,
					$elm$core$Task$spawnCmd(router),
					commands)));
	});
var $elm$core$Task$onSelfMsg = F3(
	function (_v0, _v1, _v2) {
		return $elm$core$Task$succeed(_Utils_Tuple0);
	});
var $elm$core$Task$cmdMap = F2(
	function (tagger, _v0) {
		var task = _v0.a;
		return $elm$core$Task$Perform(
			A2($elm$core$Task$map, tagger, task));
	});
_Platform_effectManagers['Task'] = _Platform_createManager($elm$core$Task$init, $elm$core$Task$onEffects, $elm$core$Task$onSelfMsg, $elm$core$Task$cmdMap);
var $elm$core$Task$command = _Platform_leaf('Task');
var $elm$core$Task$perform = F2(
	function (toMessage, task) {
		return $elm$core$Task$command(
			$elm$core$Task$Perform(
				A2($elm$core$Task$map, toMessage, task)));
	});
var $elm$core$Process$sleep = _Process_sleep;
var $author$project$Worker$message = function (msg) {
	return A2(
		$elm$core$Task$perform,
		$elm$core$Basics$identity,
		A2(
			$elm$core$Task$andThen,
			$elm$core$Basics$always(
				$elm$core$Task$succeed(msg)),
			$elm$core$Process$sleep(0)));
};
var $author$project$Worker$load = F4(
	function (model, lia, code, templates) {
		var _v0 = _Utils_Tuple2(code, templates);
		if (_v0.a.$ === 'Just') {
			if (!_v0.b.b) {
				var code_ = _v0.a.a;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							code: $elm$core$Maybe$Just(code_),
							lia: lia,
							state: A2($author$project$Model$Parsing, true, 0)
						}),
					$author$project$Worker$message($author$project$Worker$LiaParse));
			} else {
				var code_ = _v0.a.a;
				var templates_ = _v0.b;
				return _Utils_Tuple2(
					_Utils_update(
						model,
						{
							code: $elm$core$Maybe$Just(code_),
							lia: lia,
							state: A2(
								$author$project$Model$Parsing,
								true,
								$elm$core$List$length(templates_))
						}),
					$elm$core$Platform$Cmd$batch(
						A2(
							$elm$core$List$cons,
							$author$project$Worker$message($author$project$Worker$LiaParse),
							A2(
								$elm$core$List$map,
								$author$project$Worker$download($author$project$Worker$Load_Template_Result),
								templates))));
			}
		} else {
			var _v1 = _v0.a;
			return _Utils_Tuple2(
				_Utils_update(
					model,
					{
						state: $author$project$Model$Error(
							A2($elm$core$Maybe$withDefault, '', lia.error))
					}),
				$elm$core$Platform$Cmd$none);
		}
	});
var $author$project$Worker$load_readme = F2(
	function (readme, model) {
		var _v0 = A2(
			$author$project$Lia$Script$init_script,
			model.lia,
			A3($elm$core$String$replace, '\u000D', '', readme));
		var lia = _v0.a;
		var code = _v0.b;
		var templates = _v0.c;
		return A4($author$project$Worker$load, model, lia, code, templates);
	});
var $author$project$Worker$parse_error = function (msg) {
	switch (msg.$) {
		case 'BadUrl':
			var url = msg.a;
			return 'Bad Url ' + url;
		case 'Timeout':
			return 'Network timeout';
		case 'BadStatus':
			var _int = msg.a;
			return 'Bad status ' + $elm$core$String$fromInt(_int);
		case 'NetworkError':
			return 'Network error';
		default:
			var body = msg.a;
			return 'Bad body ' + body;
	}
};
var $elm$core$Basics$modBy = _Basics_modBy;
var $author$project$Lia$Script$pages = A2(
	$elm$core$Basics$composeR,
	function ($) {
		return $.sections;
	},
	$elm$core$Array$length);
var $author$project$Lia$Section$init = F2(
	function (idx, base) {
		return {body: _List_Nil, code: base.code, code_vector: $elm$core$Array$empty, definition: $elm$core$Maybe$Nothing, effect_model: $author$project$Lia$Markdown$Effect$Model$init, error: $elm$core$Maybe$Nothing, footnote2show: $elm$core$Maybe$Nothing, footnotes: $author$project$Lia$Markdown$Footnote$Model$init, idx: idx, indentation: base.identation, parsed: false, quiz_vector: $elm$core$Array$empty, survey_vector: $elm$core$Array$empty, table_vector: $elm$core$Array$empty, title: base.title, visible: true, visited: true};
	});
var $author$project$Lia$Section$Base = F3(
	function (identation, title, code) {
		return {code: code, identation: identation, title: title};
	});
var $author$project$Lia$Parser$Preprocessor$check = function (c) {
	return (!(!c)) ? $andre_dietrich$parser_combinators$Combine$succeed(_Utils_Tuple0) : $andre_dietrich$parser_combinators$Combine$fail('');
};
var $andre_dietrich$parser_combinators$Combine$currentColumn = A2(
	$elm$core$Basics$composeR,
	$andre_dietrich$parser_combinators$Combine$currentLocation,
	function ($) {
		return $.column;
	});
var $andre_dietrich$parser_combinators$Combine$withColumn = function (f) {
	return $andre_dietrich$parser_combinators$Combine$Parser(
		F2(
			function (state, stream) {
				return A3(
					$andre_dietrich$parser_combinators$Combine$app,
					f(
						$andre_dietrich$parser_combinators$Combine$currentColumn(stream)),
					state,
					stream);
			}));
};
var $author$project$Lia$Parser$Preprocessor$body = A2(
	$andre_dietrich$parser_combinators$Combine$map,
	$elm$core$String$concat,
	$andre_dietrich$parser_combinators$Combine$many(
		$andre_dietrich$parser_combinators$Combine$choice(
			_List_fromArray(
				[
					$andre_dietrich$parser_combinators$Combine$regex('(?:[^#`<]+|[\\x0D\n]+|<!--[\\S\\s]*?-->)'),
					$andre_dietrich$parser_combinators$Combine$regex('(`{3,})[\\S\\s]*?\\1'),
					$andre_dietrich$parser_combinators$Combine$regex('`.+?`'),
					$andre_dietrich$parser_combinators$Combine$regex('(?:<([\\w+\\-]+)[\\S\\s]*?</\\2>|`|<)'),
					A2(
					$andre_dietrich$parser_combinators$Combine$keep,
					$andre_dietrich$parser_combinators$Combine$string('#'),
					$andre_dietrich$parser_combinators$Combine$withColumn($author$project$Lia$Parser$Preprocessor$check))
				]))));
var $author$project$Lia$Parser$Helper$newline = $andre_dietrich$parser_combinators$Combine$string('\n');
var $author$project$Lia$Parser$Preprocessor$title_str = A2($andre_dietrich$parser_combinators$Combine$ignore, $author$project$Lia$Parser$Helper$newline, $author$project$Lia$Markdown$Inline$Parser$line);
var $author$project$Lia$Parser$Preprocessor$title_tag = A2(
	$andre_dietrich$parser_combinators$Combine$ignore,
	$andre_dietrich$parser_combinators$Combine$whitespace,
	A2(
		$andre_dietrich$parser_combinators$Combine$map,
		$elm$core$String$length,
		$andre_dietrich$parser_combinators$Combine$regex('#+')));
var $author$project$Lia$Parser$Preprocessor$section = A2(
	$andre_dietrich$parser_combinators$Combine$andMap,
	$author$project$Lia$Parser$Preprocessor$body,
	A2(
		$andre_dietrich$parser_combinators$Combine$andMap,
		$author$project$Lia$Parser$Preprocessor$title_str,
		A2($andre_dietrich$parser_combinators$Combine$map, $author$project$Lia$Section$Base, $author$project$Lia$Parser$Preprocessor$title_tag)));
var $author$project$Lia$Parser$Parser$parse_titles = F2(
	function (defines, code) {
		var _v0 = A3(
			$andre_dietrich$parser_combinators$Combine$runParser,
			$author$project$Lia$Parser$Preprocessor$section,
			A2($author$project$Lia$Parser$Context$init, $elm$core$Basics$identity, defines),
			code);
		if (_v0.$ === 'Ok') {
			var _v1 = _v0.a;
			var data = _v1.b;
			var rslt = _v1.c;
			return $elm$core$Result$Ok(
				_Utils_Tuple2(rslt, data.input));
		} else {
			var _v2 = _v0.a;
			var stream = _v2.b;
			var ms = _v2.c;
			return $elm$core$Result$Err(
				A2($author$project$Lia$Parser$Parser$formatError, ms, stream));
		}
	});
var $author$project$Lia$Script$parse_section = F2(
	function (model, code) {
		var _v0 = A2($author$project$Lia$Parser$Parser$parse_titles, model.definition, code);
		if (_v0.$ === 'Ok') {
			var _v1 = _v0.a;
			var sec = _v1.a;
			var rest = _v1.b;
			return _Utils_Tuple2(
				_Utils_update(
					model,
					{
						sections: A2(
							$elm$core$Array$push,
							A2(
								$author$project$Lia$Section$init,
								$author$project$Lia$Script$pages(model),
								sec),
							model.sections)
					}),
				$elm$core$String$isEmpty(rest) ? $elm$core$Maybe$Nothing : $elm$core$Maybe$Just(rest));
		} else {
			var msg = _v0.a;
			return _Utils_Tuple2(
				_Utils_update(
					model,
					{
						error: $elm$core$Maybe$Just(msg)
					}),
				$elm$core$Maybe$Nothing);
		}
	});
var $elm$core$Elm$JsArray$foldl = _JsArray_foldl;
var $elm$core$Array$foldl = F3(
	function (func, baseCase, _v0) {
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = F2(
			function (node, acc) {
				if (node.$ === 'SubTree') {
					var subTree = node.a;
					return A3($elm$core$Elm$JsArray$foldl, helper, acc, subTree);
				} else {
					var values = node.a;
					return A3($elm$core$Elm$JsArray$foldl, func, acc, values);
				}
			});
		return A3(
			$elm$core$Elm$JsArray$foldl,
			func,
			A3($elm$core$Elm$JsArray$foldl, helper, baseCase, tree),
			tail);
	});
var $elm$json$Json$Encode$array = F2(
	function (func, entries) {
		return _Json_wrap(
			A3(
				$elm$core$Array$foldl,
				_Json_addEntry(func),
				_Json_emptyArray(_Utils_Tuple0),
				entries));
	});
var $elm$json$Json$Encode$dict = F3(
	function (toKey, toValue, dictionary) {
		return _Json_wrap(
			A3(
				$elm$core$Dict$foldl,
				F3(
					function (key, value, obj) {
						return A3(
							_Json_addField,
							toKey(key),
							toValue(value),
							obj);
					}),
				_Json_emptyObject(_Utils_Tuple0),
				dictionary));
	});
var $author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation = function (annotation) {
	if (annotation.$ === 'Just') {
		var a = annotation.a;
		return A3($elm$json$Json$Encode$dict, $elm$core$Basics$identity, $elm$json$Json$Encode$string, a);
	} else {
		return $elm$json$Json$Encode$null;
	}
};
var $elm$json$Json$Encode$object = function (pairs) {
	return _Json_wrap(
		A3(
			$elm$core$List$foldl,
			F2(
				function (_v0, obj) {
					var k = _v0.a;
					var v = _v0.b;
					return A3(_Json_addField, k, v, obj);
				}),
			_Json_emptyObject(_Utils_Tuple0),
			pairs));
};
var $author$project$Lia$Markdown$HTML$Types$encode = F2(
	function (contentEncoder, _v0) {
		var node = _v0.a;
		var attr = _v0.b;
		var children = _v0.c;
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'node',
					$elm$json$Json$Encode$string(node)),
					_Utils_Tuple2(
					'attr',
					A3(
						$elm$json$Json$Encode$dict,
						$elm$core$Basics$identity,
						$elm$json$Json$Encode$string,
						$elm$core$Dict$fromList(attr))),
					_Utils_Tuple2(
					'children',
					A2($elm$json$Json$Encode$list, contentEncoder, children))
				]));
	});
var $elm$json$Json$Encode$int = _Json_wrap;
var $author$project$Lia$Markdown$Inline$Json$Encode$encInline = function (element) {
	return $elm$json$Json$Encode$object(
		function () {
			switch (element.$) {
				case 'Chars':
					var str = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Chars',
							$elm$json$Json$Encode$string(str)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'Symbol':
					var str = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Symbol',
							$elm$json$Json$Encode$string(str)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'Bold':
					var x = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Bold',
							$author$project$Lia$Markdown$Inline$Json$Encode$encInline(x)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'Italic':
					var x = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Italic',
							$author$project$Lia$Markdown$Inline$Json$Encode$encInline(x)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'Strike':
					var x = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Strike',
							$author$project$Lia$Markdown$Inline$Json$Encode$encInline(x)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'Underline':
					var x = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Underline',
							$author$project$Lia$Markdown$Inline$Json$Encode$encInline(x)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'Superscript':
					var x = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Superscript',
							$author$project$Lia$Markdown$Inline$Json$Encode$encInline(x)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'Verbatim':
					var str = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Verbatim',
							$elm$json$Json$Encode$string(str)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'Formula':
					var head = element.a;
					var body = element.b;
					var a = element.c;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Formula',
							$elm$json$Json$Encode$string(head)),
							_Utils_Tuple2(
							'body',
							$elm$json$Json$Encode$string(body)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'Ref':
					var ref = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Ref',
							$author$project$Lia$Markdown$Inline$Json$Encode$encReference(ref)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'FootnoteMark':
					var str = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'FootnoteMark',
							$elm$json$Json$Encode$string(str)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'EInline':
					var i = element.a;
					var j = element.b;
					var list = element.c;
					var a = element.d;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'EInline',
							$author$project$Lia$Markdown$Inline$Json$Encode$encode(list)),
							_Utils_Tuple2(
							'i',
							$elm$json$Json$Encode$int(i)),
							_Utils_Tuple2(
							'j',
							$elm$json$Json$Encode$int(j)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				case 'Container':
					var list = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'Container',
							$author$project$Lia$Markdown$Inline$Json$Encode$encode(list)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
				default:
					var node = element.a;
					var a = element.b;
					return _List_fromArray(
						[
							_Utils_Tuple2(
							'IHTML',
							A2($author$project$Lia$Markdown$HTML$Types$encode, $author$project$Lia$Markdown$Inline$Json$Encode$encInline, node)),
							_Utils_Tuple2(
							'a',
							$author$project$Lia$Markdown$Inline$Json$Encode$encAnnotation(a))
						]);
			}
		}());
};
var $author$project$Lia$Markdown$Inline$Json$Encode$encMultimedia = F4(
	function (_class, list, _v1, title) {
		var stream = _v1.a;
		var url = _v1.b;
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					_class,
					$author$project$Lia$Markdown$Inline$Json$Encode$encode(list)),
					_Utils_Tuple2(
					'stream',
					$elm$json$Json$Encode$bool(stream)),
					_Utils_Tuple2(
					'url',
					$elm$json$Json$Encode$string(url)),
					_Utils_Tuple2(
					'title',
					$elm$json$Json$Encode$string(title))
				]));
	});
var $author$project$Lia$Markdown$Inline$Json$Encode$encRef = F4(
	function (_class, list, url, title) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					_class,
					$author$project$Lia$Markdown$Inline$Json$Encode$encode(list)),
					_Utils_Tuple2(
					'url',
					$elm$json$Json$Encode$string(url)),
					_Utils_Tuple2(
					'title',
					$elm$json$Json$Encode$string(title))
				]));
	});
var $author$project$Lia$Markdown$Inline$Json$Encode$encReference = function (ref) {
	switch (ref.$) {
		case 'Link':
			var list = ref.a;
			var url = ref.b;
			var title = ref.c;
			return A4($author$project$Lia$Markdown$Inline$Json$Encode$encRef, 'Link', list, url, title);
		case 'Mail':
			var list = ref.a;
			var url = ref.b;
			var title = ref.c;
			return A4($author$project$Lia$Markdown$Inline$Json$Encode$encRef, 'Mail', list, url, title);
		case 'Embed':
			var list = ref.a;
			var url = ref.b;
			var title = ref.c;
			return A4($author$project$Lia$Markdown$Inline$Json$Encode$encRef, 'Embed', list, url, title);
		case 'Image':
			var list = ref.a;
			var url = ref.b;
			var title = ref.c;
			return A4($author$project$Lia$Markdown$Inline$Json$Encode$encRef, 'Image', list, url, title);
		case 'Audio':
			var list = ref.a;
			var url = ref.b;
			var title = ref.c;
			return A4($author$project$Lia$Markdown$Inline$Json$Encode$encMultimedia, 'Audio', list, url, title);
		default:
			var list = ref.a;
			var url = ref.b;
			var title = ref.c;
			return A4($author$project$Lia$Markdown$Inline$Json$Encode$encMultimedia, 'Movie', list, url, title);
	}
};
var $author$project$Lia$Markdown$Inline$Json$Encode$encode = function (list) {
	return A2($elm$json$Json$Encode$list, $author$project$Lia$Markdown$Inline$Json$Encode$encInline, list);
};
var $author$project$Lia$Json$Encode$encSection = function (sec) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'title',
				$author$project$Lia$Markdown$Inline$Json$Encode$encode(sec.title)),
				_Utils_Tuple2(
				'code',
				$elm$json$Json$Encode$string(sec.code)),
				_Utils_Tuple2(
				'indentation',
				$elm$json$Json$Encode$int(sec.indentation))
			]));
};
var $author$project$Lia$Definition$Json$Encode$encResource = function (r) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				function () {
				if (r.$ === 'Link') {
					var url = r.a;
					return _Utils_Tuple2(
						'Link',
						$elm$json$Json$Encode$string(url));
				} else {
					var url = r.a;
					return _Utils_Tuple2(
						'Script',
						$elm$json$Json$Encode$string(url));
				}
			}()
			]));
};
var $author$project$Lia$Definition$Json$Encode$encode = function (def) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'author',
				$elm$json$Json$Encode$string(def.author)),
				_Utils_Tuple2(
				'date',
				$elm$json$Json$Encode$string(def.date)),
				_Utils_Tuple2(
				'email',
				$elm$json$Json$Encode$string(def.email)),
				_Utils_Tuple2(
				'language',
				$elm$json$Json$Encode$string(def.language)),
				_Utils_Tuple2(
				'logo',
				$elm$json$Json$Encode$string(def.logo)),
				_Utils_Tuple2(
				'version',
				$elm$json$Json$Encode$string(def.version)),
				_Utils_Tuple2(
				'base',
				$elm$json$Json$Encode$string(def.base)),
				_Utils_Tuple2(
				'narrator',
				$elm$json$Json$Encode$string(def.narrator)),
				_Utils_Tuple2(
				'onload',
				$elm$json$Json$Encode$string(def.onload)),
				_Utils_Tuple2(
				'comment',
				$author$project$Lia$Markdown$Inline$Json$Encode$encode(def.comment)),
				_Utils_Tuple2(
				'attributes',
				A2($elm$json$Json$Encode$list, $author$project$Lia$Markdown$Inline$Json$Encode$encode, def.attributes)),
				_Utils_Tuple2(
				'resources',
				A2($elm$json$Json$Encode$list, $author$project$Lia$Definition$Json$Encode$encResource, def.resources)),
				_Utils_Tuple2(
				'translation',
				A3($elm$json$Json$Encode$dict, $elm$core$Basics$identity, $elm$json$Json$Encode$string, def.translation)),
				_Utils_Tuple2(
				'macro',
				A3($elm$json$Json$Encode$dict, $elm$core$Basics$identity, $elm$json$Json$Encode$string, def.macro))
			]));
};
var $elm$core$Array$getHelp = F3(
	function (shift, index, tree) {
		getHelp:
		while (true) {
			var pos = $elm$core$Array$bitMask & (index >>> shift);
			var _v0 = A2($elm$core$Elm$JsArray$unsafeGet, pos, tree);
			if (_v0.$ === 'SubTree') {
				var subTree = _v0.a;
				var $temp$shift = shift - $elm$core$Array$shiftStep,
					$temp$index = index,
					$temp$tree = subTree;
				shift = $temp$shift;
				index = $temp$index;
				tree = $temp$tree;
				continue getHelp;
			} else {
				var values = _v0.a;
				return A2($elm$core$Elm$JsArray$unsafeGet, $elm$core$Array$bitMask & index, values);
			}
		}
	});
var $elm$core$Array$tailIndex = function (len) {
	return (len >>> 5) << 5;
};
var $elm$core$Array$get = F2(
	function (index, _v0) {
		var len = _v0.a;
		var startShift = _v0.b;
		var tree = _v0.c;
		var tail = _v0.d;
		return ((index < 0) || (_Utils_cmp(index, len) > -1)) ? $elm$core$Maybe$Nothing : ((_Utils_cmp(
			index,
			$elm$core$Array$tailIndex(len)) > -1) ? $elm$core$Maybe$Just(
			A2($elm$core$Elm$JsArray$unsafeGet, $elm$core$Array$bitMask & index, tail)) : $elm$core$Maybe$Just(
			A3($elm$core$Array$getHelp, startShift, index, tree)));
	});
var $author$project$Lia$Json$Encode$getCodeFromLn = function (ln) {
	switch (ln.$) {
		case 'Bg':
			return 'bg';
		case 'De':
			return 'de';
		case 'Fa':
			return 'fa';
		case 'Hy':
			return 'hy';
		case 'Ua':
			return 'ua';
		default:
			return 'en';
	}
};
var $author$project$Lia$Json$Encode$get_title = function (sections) {
	return $elm$core$String$trim(
		A2(
			$elm$core$Maybe$withDefault,
			'Lia',
			A2(
				$elm$core$Maybe$map,
				$author$project$Lia$Markdown$Inline$Stringify$stringify,
				A2(
					$elm$core$Maybe$map,
					function ($) {
						return $.title;
					},
					A2($elm$core$Array$get, 0, sections)))));
};
var $author$project$Lia$Json$Encode$encode = function (model) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'title',
				$author$project$Lia$Markdown$Inline$Json$Encode$encode(
					A2(
						$elm$core$Maybe$withDefault,
						_List_fromArray(
							[
								A2($author$project$Lia$Markdown$Inline$Types$Chars, model.title, $elm$core$Maybe$Nothing)
							]),
						A2(
							$elm$core$Maybe$map,
							function ($) {
								return $.title;
							},
							A2($elm$core$Array$get, 0, model.sections))))),
				_Utils_Tuple2(
				'str_title',
				$elm$json$Json$Encode$string(
					$author$project$Lia$Json$Encode$get_title(model.sections))),
				_Utils_Tuple2(
				'definition',
				$author$project$Lia$Definition$Json$Encode$encode(model.definition)),
				_Utils_Tuple2(
				'comment',
				$elm$json$Json$Encode$string(
					$author$project$Lia$Markdown$Inline$Stringify$stringify(model.definition.comment))),
				_Utils_Tuple2(
				'readme',
				$elm$json$Json$Encode$string(model.readme)),
				_Utils_Tuple2(
				'url',
				$elm$json$Json$Encode$string(model.url)),
				_Utils_Tuple2(
				'origin',
				$elm$json$Json$Encode$string(model.origin)),
				_Utils_Tuple2(
				'sections',
				A2($elm$json$Json$Encode$array, $author$project$Lia$Json$Encode$encSection, model.sections)),
				_Utils_Tuple2(
				'section_active',
				$elm$json$Json$Encode$int(model.section_active)),
				_Utils_Tuple2(
				'version',
				$elm$json$Json$Encode$int(
					A2(
						$elm$core$Maybe$withDefault,
						0,
						$elm$core$String$toInt(
							A2(
								$elm$core$Maybe$withDefault,
								'0',
								$elm$core$List$head(
									A2($elm$core$String$split, '.', model.definition.version))))))),
				_Utils_Tuple2(
				'error',
				function () {
					var _v0 = model.error;
					if (_v0.$ === 'Just') {
						var str = _v0.a;
						return $elm$json$Json$Encode$string(str);
					} else {
						return $elm$json$Json$Encode$null;
					}
				}()),
				_Utils_Tuple2(
				'translation',
				$elm$json$Json$Encode$string(
					$author$project$Lia$Json$Encode$getCodeFromLn(model.translation)))
			]));
};
var $author$project$Worker$respond = function (model) {
	return _Utils_Tuple2(
		_Utils_update(
			model,
			{state: $author$project$Model$Idle}),
		function () {
			var _v0 = model.cmd;
			if (_v0 === 'string2Json') {
				return $author$project$Worker$output(
					A2(
						$elm$core$Tuple$pair,
						true,
						A2(
							$elm$json$Json$Encode$encode,
							2,
							$author$project$Lia$Json$Encode$encode(model.lia))));
			} else {
				return A2($author$project$Worker$error, 'unknown cmd', model.cmd);
			}
		}());
};
var $author$project$Worker$parsing = function (model) {
	parsing:
	while (true) {
		var _v0 = model.state;
		_v0$2:
		while (true) {
			if (_v0.$ === 'Parsing') {
				if (!_v0.a) {
					if (!_v0.b) {
						return $author$project$Worker$respond(model);
					} else {
						break _v0$2;
					}
				} else {
					var templates_to_load = _v0.b;
					var _v1 = model.code;
					if (_v1.$ === 'Nothing') {
						var $temp$model = _Utils_update(
							model,
							{
								state: A2($author$project$Model$Parsing, false, templates_to_load)
							});
						model = $temp$model;
						continue parsing;
					} else {
						var code = _v1.a;
						var _v2 = A2($author$project$Lia$Script$parse_section, model.lia, code);
						var lia = _v2.a;
						var remaining_code = _v2.b;
						var new_model = _Utils_update(
							model,
							{code: remaining_code, lia: lia});
						if (!A2(
							$elm$core$Basics$modBy,
							4,
							$author$project$Lia$Script$pages(lia))) {
							return _Utils_Tuple2(
								new_model,
								$author$project$Worker$message($author$project$Worker$LiaParse));
						} else {
							var $temp$model = new_model;
							model = $temp$model;
							continue parsing;
						}
					}
				}
			} else {
				break _v0$2;
			}
		}
		return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
	}
};
var $author$project$Worker$update = F2(
	function (msg, model) {
		switch (msg.$) {
			case 'Handle':
				if (((msg.a.b && (msg.a.a === 'string2Json')) && msg.a.b.b) && (!msg.a.b.b.b)) {
					var _v1 = msg.a;
					var _v2 = _v1.b;
					var readme = _v2.a;
					return A2(
						$author$project$Worker$load_readme,
						readme,
						_Utils_update(
							model,
							{cmd: 'string2Json'}));
				} else {
					var cmd = msg.a;
					return _Utils_Tuple2(
						model,
						A2(
							$author$project$Worker$error,
							'Handle',
							$elm$core$String$concat(
								A2($elm$core$List$intersperse, ',', cmd))));
				}
			case 'LiaParse':
				return $author$project$Worker$parsing(model);
			case 'Load_ReadMe_Result':
				if (msg.b.$ === 'Ok') {
					var readme = msg.b.a;
					return A2($author$project$Worker$load_readme, readme, model);
				} else {
					var url = msg.a;
					var info = msg.b.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								state: $author$project$Model$Error(
									$author$project$Worker$parse_error(info))
							}),
						A2(
							$author$project$Worker$error,
							'Load_ReadMe_Result',
							$author$project$Worker$parse_error(info)));
				}
			default:
				if (msg.a.$ === 'Ok') {
					var template = msg.a.a;
					return $author$project$Worker$parsing(
						_Utils_update(
							model,
							{
								lia: A2(
									$author$project$Lia$Script$add_imports,
									model.lia,
									A3($elm$core$String$replace, '\u000D', '', template)),
								state: function () {
									var _v3 = model.state;
									if (_v3.$ === 'Parsing') {
										var b = _v3.a;
										var templates = _v3.b;
										return A2($author$project$Model$Parsing, b, templates - 1);
									} else {
										return model.state;
									}
								}()
							}));
				} else {
					var info = msg.a.a;
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								state: $author$project$Model$Error(
									$author$project$Worker$parse_error(info))
							}),
						A2(
							$author$project$Worker$error,
							'Load_ReadMe_Result',
							$author$project$Worker$parse_error(info)));
				}
		}
	});
var $elm$core$Platform$worker = _Platform_worker;
var $author$project$Worker$main = $elm$core$Platform$worker(
	{
		init: $author$project$Worker$init,
		subscriptions: function (_v0) {
			return $author$project$Worker$input($author$project$Worker$Handle);
		},
		update: $author$project$Worker$update
	});
_Platform_export({'Worker':{'init':$author$project$Worker$main(
	A2(
		$elm$json$Json$Decode$andThen,
		function (cmd) {
			return $elm$json$Json$Decode$succeed(
				{cmd: cmd});
		},
		A2($elm$json$Json$Decode$field, 'cmd', $elm$json$Json$Decode$string)))(0)}});}(this));
},{}],"Focm":[function(require,module,exports) {
#!/usr/bin/env node
"use strict";

var _Worker = require("../LiaScript/src/elm/Worker.elm");

var scopackager = require('simple-scorm-packager');

var path = require('path');

var fs = require('fs-extra');

var argv = require('minimist')(process.argv.slice(2));

console.warn(argv);

function help() {
  console.log("LiaScript-Exporter");
  console.log("");
  console.log("-h", "--help", "           show this help");
  console.log("-i", "--input", "          file to be used as input");
  console.log("-p", "--path", "           path to be packed, if not set, the path of the input file is used");
  console.log("-o", "--output", "         output file name (default is output), the ending is define by the format");
  console.log("-f", "--format", "         scorm1.2, json, web (default is json)"); //console.log("-b", "--base", "           define a base-path, default is './' ")

  console.log("-k", "--key", "            responsive voice key ");
}

if (argv.h || argv.help) {
  help();
} else if (argv.i || argv.input) {
  var app = _Worker.Elm.Worker.init({
    flags: {
      cmd: ""
    }
  });

  app.ports.output.subscribe(function (event) {
    let [ok, string] = event;
    let format = argv.f || argv.format || "json";
    let output = argv.o || argv.output || "output";

    if (!ok) {
      console.warn(string);
      return;
    }

    switch (format) {
      case "json":
        {
          fs.writeFile(output + ".json", string, function (err) {
            if (err) console.error(err);
          });
          break;
        }

      case "scorm1.2":
        {
          let json = JSON.parse(string);
          let readme = argv.i || argv.input;
          const config = {
            version: '1.2',
            organization: 'LiaScript',
            title: json.str_title,
            language: json.definition.language,
            //masteryScore: 80,
            startingPage: 'index.html',
            startingParameters: path.basename(readme),
            source: path.join(__dirname, '../build'),
            package: {
              version: json.definition.version,
              zip: true,
              name: output,
              author: json.definition.author,
              outputFolder: path.join(__dirname, 'scorm_packages'),
              description: json.comment,
              //keywords: ['scorm', 'test', 'course'],
              //typicalDuration: 'PT0H5M0S',
              //rights: `©${new Date().getFullYear()} My Amazing Company. All right reserved.`,
              vcard: {
                author: json.definition.author,
                //org: 'My Amazing Company',
                //tel: '(000) 000-0000',
                //address: 'my address',
                mail: json.definition.email //url: 'https://mydomain.com'

              }
            }
          };
          fs.copy(path.join(__dirname, './assets/scorm1.2'), path.join(__dirname, '../build')).then(() => {
            let key = argv.k || argv.key;

            if (key) {
              try {
                let index = fs.readFileSync(path.join(__dirname, '../build/index.html'), 'utf8');
                index = index.replace("https://code.responsivevoice.org/responsivevoice.js", "https://code.responsivevoice.org/responsivevoice.js?key=" + key);
                fs.writeFile(path.join(__dirname, '../build/index.html'), index, function (err) {
                  if (err) {
                    console.error(err);
                    return;
                  }

                  fs.copy(path.dirname(readme), path.join(__dirname, '../build')).then(() => {
                    scopackager(config, function (msg) {
                      console.log(msg);
                      process.exit(0);
                    });
                  });
                });
              } catch (err) {
                console.error(err);
              }
            }
          }).catch(err => console.error(err));
          break;
        }

      default:
        {
          console.warn("unknown output format", format);
        }
    }
  });

  try {
    const data = fs.readFileSync(argv.i || argv.input, 'utf8');
    app.ports.input.send(["string2Json", data]);
  } catch (err) {
    console.error(err);
  }
} else {
  console.warn("No input defined");
  help();
}
},{"../LiaScript/src/elm/Worker.elm":"clwS"}]},{},["Focm"], null)
