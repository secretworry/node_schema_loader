// @flow
"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

import type {Context} from './resolve';

import type {ResolverResult} from './types';

import type {Node} from './schema';

export interface Plugin {
  init(context: Context): Context;
  invoke(args: any, context: Context): ResolverResult;
  postprocess(root: Document, context: Context): Promise<any> | any
}

export class PluginInvocation {
  plugin: Plugin;
  args: any;

  invoke(node: Node, context: Context) {
    return this.plugin.invoke(this.args, context);
  }
}

