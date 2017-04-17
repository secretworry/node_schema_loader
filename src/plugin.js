// @flow
"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

import * as _ from 'lodash';

import type {Context} from './resolve';

import type {ResolverResult, Loader, Document} from './types';

import type {Node} from './schema';

export type Plugin = {
  init: (context: Context) => Context;
  invoke: (args: any, context: Context) => ResolverResult;
  postprocess: (root: Document, context: Context) => Promise<any> | any
}

export class PluginInvocation {
  plugin: Plugin;
  args: any;

  invoke(node: Node, context: Context): ResolverResult {
    return this.plugin.invoke(this.args, context);
  }
}


declare type BatchPluginArgs<Id, Value> = {
  loader: Loader<Id, Value>,
  ids: Array<Id>,
  callback: (values: {[Id]: Value}) => Document
};

export const batchPlugin = {
  init(context: Context): Context {
    context.batchPlugin = context.batchPlugin || {};
    return context;
  },

  batch: function<Id, Value>(loader: Loader<Id, Value>, ids: Array<Id>, callback: (values: {[Id]: Value}) => Document) {
    return new PluginInvocation(batchPlugin, {loader: loader, ids: ids, callback: callback});
  },

  invoke: function(args: BatchPluginArgs<*, *>, context: Context) {
    return new Promise(function(resolve, reject) {
      let group = context.batchPlugin[args.loader];
      if (!group) {
        group = {loader: args.loader, ids: [], callbacks: []};
        context.batchPlugin[args.loader] = group;
      }
      Array.prototype.push.apply(group.ids, args.ids);
      group.callbacks.push(function(values) {
        try {
          resolve(args.callback(values));
        } catch (e) {
          reject(e);
        }
      });
    });
  },

  postprocess: function(root: Document, context: Context): Promise<*> {
    const meta = context.batchPlugin;
    context.batchPlugin = {};
    const promises = _.map(meta, function (group) {
      const ids = _.uniq(group.ids);
      return group.loader(ids).then(function(values) {
        _.each(group.callbacks, function (callback) {
          callback(values);
        });
      });
    });
    return Promise.all(promises);
  }
};

