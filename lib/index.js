"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.batch = exports.field = exports.resolve = exports.Schema = exports.extend = undefined;

var _schema = require('./schema');

Object.defineProperty(exports, 'extend', {
  enumerable: true,
  get: function get() {
    return _schema.extend;
  }
});
Object.defineProperty(exports, 'Schema', {
  enumerable: true,
  get: function get() {
    return _schema.Schema;
  }
});

var _resolve = require('./resolve');

Object.defineProperty(exports, 'resolve', {
  enumerable: true,
  get: function get() {
    return _resolve.resolve;
  }
});

var _resolvers = require('./resolvers');

Object.defineProperty(exports, 'field', {
  enumerable: true,
  get: function get() {
    return _resolvers.field;
  }
});

var _plugin = require('./plugin');

var plugin = _interopRequireWildcard(_plugin);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var batch = exports.batch = plugin.batchPlugin.batch;