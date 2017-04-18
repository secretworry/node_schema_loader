"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Schema = exports.Node = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.extend = extend;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _assignMetaFields(target, definition) {
  var resolver = definition.__resolver__;
  delete definition.__resolver__;
  target.resolver = resolver;

  var args = definition.__args__;
  delete definition.__args__;
  target.args = args;
}

function _indexNodesReducer(index, node) {
  index[node.name] = node;
  return index;
}

var assignInWith2 = function assignInWith2(object, s1, customizer) {
  return _.assignInWith(object, s1, customizer);
};

var Node = exports.Node = function () {
  function Node(name) {
    _classCallCheck(this, Node);

    this.name = name;
    this.resolver = null;
    this.args = null;
    this.children = [];
  }

  _createClass(Node, null, [{
    key: 'fromDefinition',
    value: function fromDefinition(key, value) {
      var node = new Node(key);
      if (typeof value === 'function') {
        node.resolver = value;
      } else if (value instanceof Schema) {
        var schema = value;
        node.resolver = schema.resolver;
        node.args = schema.args;
        node.children = schema.children;
      } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
        value = value;
        _assignMetaFields(node, value);
        node.children = _.reduce(value, function (nodes, value, key) {
          nodes.push(Node.fromDefinition(key, value));
          return nodes;
        }, node.children);
      }
      return node;
    }
  }, {
    key: 'mergeNodes',
    value: function mergeNodes(baseNodes, sourceNodes) {
      var baseIndex = _.reduce(baseNodes, _indexNodesReducer, {});
      var sourceIndex = _.reduce(sourceNodes, _indexNodesReducer, {});
      return _.values(assignInWith2(baseIndex, sourceIndex, function (obj, src) {
        if (_.isUndefined(obj)) {
          return src;
        } else {
          return Node.merge(obj, src);
        }
      }));
    }
  }, {
    key: 'merge',
    value: function merge(baseNode, sourceNode) {
      if (baseNode.name === sourceNode.name) {
        var node = new Node(sourceNode.name);
        node.resolver = sourceNode.resolver || baseNode.resolver;
        node.args = sourceNode.args || baseNode.args;
        node.children = Node.mergeNodes(baseNode.children, sourceNode.children);
        return node;
      } else {
        return baseNode;
      }
    }
  }]);

  return Node;
}();

var Schema = exports.Schema = function () {
  function Schema() {
    _classCallCheck(this, Schema);

    this.resolver = null;
    this.args = null;
    this.children = [];
  }

  _createClass(Schema, null, [{
    key: 'fromDefinition',
    value: function fromDefinition(definition) {
      var schema = new Schema();
      _assignMetaFields(schema, definition);

      return _.reduce(definition, function (schema, value, key) {
        var node = Node.fromDefinition(key, value);
        schema.children.push(node);
        return schema;
      }, schema);
    }
  }, {
    key: 'merge',
    value: function merge(targetSchema, sourceSchema) {
      var schema = new Schema();
      schema.children = Node.mergeNodes(targetSchema.children, sourceSchema.children);
      schema.resolver = sourceSchema.resolver || targetSchema.resolver;
      schema.args = sourceSchema.args || targetSchema.args;
      return schema;
    }
  }]);

  return Schema;
}();

function extend(schema, schemaOrDefinition) {
  var anotherSchema = void 0;
  if (schemaOrDefinition instanceof Schema) {
    anotherSchema = schemaOrDefinition;
  } else {
    anotherSchema = Schema.fromDefinition(schemaOrDefinition);
  }
  return Schema.merge(schema, anotherSchema);
}