"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.batchPlugin = exports.PluginInvocation = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PluginInvocation = exports.PluginInvocation = function () {
  function PluginInvocation(plugin, args) {
    _classCallCheck(this, PluginInvocation);

    this.plugin = plugin;
    this.args = args;
  }

  _createClass(PluginInvocation, [{
    key: 'invoke',
    value: function invoke(node, context) {
      return this.plugin.invoke(this.args, context);
    }
  }]);

  return PluginInvocation;
}();

var batchPlugin = exports.batchPlugin = {
  init: function init(context) {
    context.batchPlugin = context.batchPlugin || {};
    return context;
  },


  batch: function batch(loader, ids, callback) {
    return new PluginInvocation(batchPlugin, { loader: loader, ids: ids, callback: callback });
  },

  invoke: function invoke(args, context) {
    return new Promise(function (resolve, reject) {
      var group = context.batchPlugin[args.loader];
      if (!group) {
        group = { loader: args.loader, ids: [], callbacks: [] };
        context.batchPlugin[args.loader] = group;
      }
      Array.prototype.push.apply(group.ids, args.ids);
      group.callbacks.push(function (values) {
        try {
          resolve(args.callback(values));
        } catch (e) {
          reject(e);
        }
      });
    });
  },

  postprocess: function postprocess(root, context) {
    var meta = context.batchPlugin;
    context.batchPlugin = {};
    var promises = _.map(meta, function (group) {
      var ids = _.uniq(group.ids);
      return group.loader(ids).then(function (values) {
        _.each(group.callbacks, function (callback) {
          callback(values);
        });
      });
    });
    return Promise.all(promises);
  }
};