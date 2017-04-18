// @flow
"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

import * as _ from 'lodash';

import {PluginInvocation, batchPlugin} from './plugin';

import type {DefinitionObject, Node, NodeLike} from './schema';

import {Schema} from './schema';

import type {Document, ResolverResult, PrimitiveType} from './types';

import * as document from './document';

import type {Field, LoadingField, ObjectField} from './document';

type ResolvedResolverResult =
  | Document
  | PluginInvocation

type RootValueType =
  | Document
  | Promise<Document>


export type Context = {
  rootValue: RootValueType,
  options: Object,
  root?: Field,
  [string]: any
}

class CollectLoadingLeavesVisitor extends document.BaseVisitor {
  loadingLeaves: Array<LoadingField>;
  
  constructor() {
    super();
    this.loadingLeaves = [];
  }
  visitLoadingField(loading: LoadingField) {
    this.loadingLeaves.push(loading);
  }
}

const plugins = [];

plugins.push(batchPlugin);

function _buildContext(rootValue: RootValueType, options?: {[string]: any}) {
  return {
    rootValue: rootValue,
    options: options || {},
  };
}

function isPrimitive(val) {
  return val === null || typeof val === 'string' || typeof val === 'boolean' || typeof val === 'number'
}

function _getRoot(schema, context): Field {
  if (!context.root) {
    const rootValue = context.rootValue || (schema.resolver && schema.resolver()) || {};
    context.root = _resolveSchema(schema, rootValue, context);
  }
  return context.root;
}

function _resolveSchema(schema: Schema, rootValue: RootValueType, context: Context): Field {
  if (rootValue instanceof Promise) {
    return new document.LoadingField(rootValue, function (value, context) {
      context.root = _expand(schema, value, context);
    });
  } else {
    return _expand(schema, rootValue, context);
  }
}

function _expand(node: NodeLike, value: Document, context) {
  if (value instanceof Array) {
    const values = _.map(value, function (item) {
      if (item instanceof Promise) {
        throw new Error("Cannot expand an array contains the Promise as element, you should consider to return a Promise of array");
      }
      return _expand(node, item, context);
    });
    return new document.ArrayField(values);
  } else if (isPrimitive(value)) {
    const primitive: PrimitiveType = (value: any);
    return new document.LeafField(primitive);
  } else if (_.isObject(value)) {
    const object: {[string]: Document} = (value: any);
    const objectField = new document.ObjectField(object);
    objectField.fields = _.reduce(node.children, function(fields, node) {
      fields[node.name] = _resolveNode(node, object, objectField, context);
      return fields;
    }, objectField.fields);
    return objectField;
  } else {
    throw new Error(`Unexpected value ${String(value)}`);
  }
}

function _resolveValue(node: Node, value: ResolverResult, parent: ObjectField, context: Context) {
  if (value instanceof PluginInvocation) {
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

function _callResolver(node: Node, parentValue: {[string]: Document}, context: Context) {
  if (node.resolver) {
    return node.resolver(parentValue, {node: node, options: context.options, args: node.args || {}})
  } else if (parentValue) {
    return parentValue[node.name];
  } else {
    return null;
  }
}

function _resolveNode(node: Node, parentValue: {[string]: Document}, parent: ObjectField, context: Context) {
  return _resolveValue(node, _callResolver(node, parentValue, context), parent, context);
}

function _doResolve(schema: Schema, context: Context) {
  const root = _getRoot(schema, context);
  return _postprocess(root, context).then(function() {
    const visitor = new CollectLoadingLeavesVisitor();
    root.visit(visitor);
    if (visitor.loadingLeaves.length === 0) {
      return root.resolve();
    } else {
      return _.reduce(visitor.loadingLeaves, function (promise, loadingLeaf) {
        return promise.then(function() {
          return loadingLeaf.load(context);
        });
      }, Promise.resolve(true)).then(function (){
        return _doResolve(schema, context);
      });
    }
  });
}

function _init(context: Context): Context {
  return _.reduce(plugins, function(context, plugin) {
    return plugin.init(context);
  }, context);
}

function _postprocess(root: Document, context: Context): Promise<*> {
  return _.reduce(plugins, function(promise, plugin) {
    const result = plugin.postprocess(root, context);
    if (result instanceof Promise) {
      return promise.then(function() {
        return result;
      });
    } else {
      return promise;
    }
  }, Promise.resolve(true));
}

export function resolve(definitionOrSchema: DefinitionObject | Schema, rootValue: RootValueType, options?: {[string]: any}) {
  let schema;
  if (definitionOrSchema instanceof Schema) {
    schema = definitionOrSchema;
  } else {
    schema = Schema.fromDefinition(definitionOrSchema);
  }
  const context = _buildContext(rootValue, options);
  return _doResolve(schema, _init(context));
}

