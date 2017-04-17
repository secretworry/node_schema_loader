// @flow
"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

import * as _ from 'lodash';

import type {Document, Resolver} from './types';

import type {PluginInvocation} from './plugin';

export type DefinitionObject = {
  __resolver__?: Resolver,
  __args__?: any,
  [string]: Definition
}

export type Definition =
  | Resolver
  | Schema
  | DefinitionObject

function _assignMetaFields(target: Node, definition: DefinitionObject) {
  const resolver = definition.__resolver__;
  delete definition.__resolver__;
  target.resolver = resolver;

  const args = definition.__args__;
  delete definition.__args__;
  target.args = args;
}

function _indexNodesReducer(index, node) {
  index[node.name] = node;
  return index;
}

export class Node {
  name: ?string;
  resolver: ?Resolver;
  args: any;
  children: Array<Node>;

  constructor(name: ?string) {
    this.name = name;
    this.resolver = null;
    this.args = null;
    this.children = [];
  }

  static fromDefinition(key: string, value: Definition): Node {
    const node = new Node(key);
    if (typeof value === 'function') {
      node.resolver = value;
    } else if (value instanceof Schema) {
      const schema = (value: Schema);
      node.resolver = schema.resolver;
      node.args = schema.args;
      node.children = schema.children;
    } else if (typeof value === 'object') {
      value = (value: DefinitionObject);
      _assignMetaFields(node, value);
      node.children = _.reduce(value, function(nodes, value, key) {
        nodes.push(Node.fromDefinition(key, value));
        return nodes;
      }, node.children);
    }
    return node;
  }

  static mergeNodes(baseNodes: Array<Node>, sourceNodes: Array<Node>): Array<Node> {
    const baseIndex = _.reduce(baseNodes, _indexNodesReducer, {});
    const sourceIndex = _.reduce(sourceNodes, _indexNodesReducer, {});
    return _.values(_.assignInWith(baseIndex, sourceIndex, function (obj, src) {
      if (_.isUndefined(obj)) {
        return src;
      } else {
        return Node.merge(obj, src);
      }
    }));
  }

  static merge(baseNode: Node, sourceNode: Node): Node {
    if (baseNode.name === sourceNode.name) {
      let node = new Node(sourceNode.name);
      node.resolver = sourceNode.resolver || baseNode.resolver;
      node.args = sourceNode.args || baseNode.args;
      node.children = Node.mergeNodes(baseNode.children, sourceNode.children);
      return node;
    } else {
      return baseNode;
    }
  }
}

export class Schema {
  resolver: ?Resolver;
  args: any;
  children: Array<Node>;
  constructor() {
    this.resolver = null;
    this.args = null;
    this.children = [];
  }

  static fromDefinition(definition: DefinitionObject): Schema {
    const schema = new Schema();
    _assignMetaFields(schema, definition);

    return _.reduce(definition, function(schema, value, key) {
      const node = Node.fromDefinition(key, value);
      schema.children.push(node);
      return schema;
    }, schema);
  }

  static merge(targetSchema: Schema, sourceSchema: Schema): Schema {
    let schema = new Schema();
    schema.children = Node.mergeNodes(targetSchema.children, sourceSchema.children);
    schema.resolver = sourceSchema.resolver || targetSchema.resolver;
    schema.args = sourceSchema.args || targetSchema.args;
    return schema;
  }
}

export function extend(schema: Schema, schemaOrDefinition: Schema | DefinitionObject) {
  let anotherSchema: Schema;
  if (schemaOrDefinition instanceof Schema) {
    anotherSchema = schemaOrDefinition;
  } else {
    anotherSchema = Schema.fromDefinition(schemaOrDefinition);
  }
  return Schema.merge(schema, anotherSchema);
}
