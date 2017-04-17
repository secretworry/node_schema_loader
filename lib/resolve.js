"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

import * as _ from 'lodash';

import { PluginInvocation, batchPlugin } from './plugin';

import * as document from './document';

const plugins = [];

plugins.push(batchPlugin);

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
    const rootValue = context.rootValue || schema.resolver && schema.resolver() || {};
    context.root = _resolveSchema(schema, rootValue, context);
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
    const values = _.map(value, function (item) {
      if (item instanceof Promise) {
        throw "Cannot expand an array contains the Promise as element, you should consider to return a Promise of array";
      }
      return _expand(node, item, context);
    });
    return new document.ArrayField(values);
  } else if (isPrimitive(value)) {
    return new document.LeafField(value);
  } else if (_.isObject(value)) {
    const objectField = new document.ObjectField(value);
    objectField.fields = _.reduce(node.children, function (fields, node) {
      fields[node.name] = _resolveNode(node, value, objectField, context);
      return fields;
    }, objectField.fields);
    return objectField;
  } else {
    throw "Unexpected value " + value;
  }
}

function _resolveValue(node, value, parent, context) {
  if (value instanceof PluginInvocation) {
    return _resolveValue(node, value.invoke(node, context), parent, context);
  } else if (isPromise(value)) {
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
  const root = _getRoot(schema, context);
  return _postprocess(root, context).then(function () {
    const visitor = new CollectLoadingLeavesVisitor();
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

export function resolve(definitionOrSchema, rootValue, options) {
  let schema;
  if (definitionOrSchema instanceof Schema) {
    schema = definitionOrSchema;
  } else {
    schema = Schema.fromDefinition(definitionOrSchema);
  }
  const context = _buildContext(rootValue, options);
  return _doResolve(schema, _init(context));
}