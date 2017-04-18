"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.resolve = resolve;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _plugin = require('./plugin');

var _schema = require('./schema');

var _document = require('./document');

var document = _interopRequireWildcard(_document);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CollectLoadingLeavesVisitor = function (_document$BaseVisitor) {
  _inherits(CollectLoadingLeavesVisitor, _document$BaseVisitor);

  function CollectLoadingLeavesVisitor() {
    _classCallCheck(this, CollectLoadingLeavesVisitor);

    var _this = _possibleConstructorReturn(this, (CollectLoadingLeavesVisitor.__proto__ || Object.getPrototypeOf(CollectLoadingLeavesVisitor)).call(this));

    _this.loadingLeaves = [];
    return _this;
  }

  _createClass(CollectLoadingLeavesVisitor, [{
    key: 'visitLoadingField',
    value: function visitLoadingField(loading) {
      this.loadingLeaves.push(loading);
    }
  }]);

  return CollectLoadingLeavesVisitor;
}(document.BaseVisitor);

var plugins = [];

plugins.push(_plugin.batchPlugin);

function _buildContext(rootValue, options) {
  return {
    rootValue: rootValue,
    options: options || {}
  };
}

function isPrimitive(val) {
  return val === null || typeof val === 'string' || typeof val === 'boolean' || typeof val === 'number';
}

function _getRoot(schema, context) {
  if (!context.root) {
    var _rootValue = context.rootValue || schema.resolver && schema.resolver() || {};
    context.root = _resolveSchema(schema, _rootValue, context);
  }
  return context.root;
}

function _resolveSchema(schema, rootValue, context) {
  if (rootValue instanceof Promise) {
    return new document.LoadingField(rootValue, function (value, context) {
      context.root = _expand(schema, value, context);
    });
  } else {
    return _expand(schema, rootValue, context);
  }
}

function _expand(node, value, context) {
  if (value instanceof Array) {
    var values = _.map(value, function (item) {
      if (item instanceof Promise) {
        throw new Error("Cannot expand an array contains the Promise as element, you should consider to return a Promise of array");
      }
      return _expand(node, item, context);
    });
    return new document.ArrayField(values);
  } else if (isPrimitive(value)) {
    var primitive = value;
    return new document.LeafField(primitive);
  } else if (_.isObject(value)) {
    var object = value;
    var objectField = new document.ObjectField(object);
    objectField.fields = _.reduce(node.children, function (fields, node) {
      fields[node.name] = _resolveNode(node, object, objectField, context);
      return fields;
    }, objectField.fields);
    return objectField;
  } else {
    throw new Error('Unexpected value ' + String(value));
  }
}

function _resolveValue(node, value, parent, context) {
  if (value instanceof _plugin.PluginInvocation) {
    return _resolveValue(node, value.invoke(node, context), parent, context);
  } else if (value instanceof Promise) {
    return new document.LoadingField(value, function (value, context) {
      parent.fields[node.name] = _expand(node, value, context);
      return true;
    });
  } else {
    return _expand(node, value, context);
  }
}

function _callResolver(node, parentValue, context) {
  if (node.resolver) {
    return node.resolver(parentValue, { node: node, options: context.options, args: node.args || {} });
  } else if (parentValue) {
    return parentValue[node.name];
  } else {
    return null;
  }
}

function _resolveNode(node, parentValue, parent, context) {
  return _resolveValue(node, _callResolver(node, parentValue, context), parent, context);
}

function _doResolve(schema, context) {
  var root = _getRoot(schema, context);
  return _postprocess(root, context).then(function () {
    var visitor = new CollectLoadingLeavesVisitor();
    root.visit(visitor);
    if (visitor.loadingLeaves.length === 0) {
      return root.resolve();
    } else {
      return _.reduce(visitor.loadingLeaves, function (promise, loadingLeaf) {
        return promise.then(function () {
          return loadingLeaf.load(context);
        });
      }, Promise.resolve(true)).then(function () {
        return _doResolve(schema, context);
      });
    }
  });
}

function _init(context) {
  return _.reduce(plugins, function (context, plugin) {
    return plugin.init(context);
  }, context);
}

function _postprocess(root, context) {
  return _.reduce(plugins, function (promise, plugin) {
    var result = plugin.postprocess(root, context);
    if (result instanceof Promise) {
      return promise.then(function () {
        return result;
      });
    } else {
      return promise;
    }
  }, Promise.resolve(true));
}

function resolve(definitionOrSchema, rootValue, options) {
  var schema = void 0;
  if (definitionOrSchema instanceof _schema.Schema) {
    schema = definitionOrSchema;
  } else {
    schema = _schema.Schema.fromDefinition(definitionOrSchema);
  }
  var context = _buildContext(rootValue, options);
  return _doResolve(schema, _init(context));
}