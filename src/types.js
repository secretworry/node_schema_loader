// @flow
"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

import type {PluginInvocation} from './plugin';

export type PrimitiveType =
  | String
  | Number
  | Boolean
  | null

export type Document =
  | {[string]: Document}
  | Array<Document>
  | PrimitiveType

export type ResolverInfo = {
  node: Node,
  options: Object,
  args: Object
}

export type ResolverResult =
  | Document
  | Promise<Document>
  | PluginInvocation

export type Resolver = (parentValue: {[string]: Document}, info: ResolverInfo) => ResolverResult;

export type Loader<Id, Value> = (ids: Array<Id>) => Promise<{[Id]: Value}>
