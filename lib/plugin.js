"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

import * as _ from 'lodash';

export class PluginInvocation {

  invoke(node, context) {
    return this.plugin.invoke(this.args, context);
  }
}

export const batchPlugin = {
  init(context) {
    context.batchPlugin = context.batchPlugin || {};
    return context;
  },

  batch: function (loader, ids, callback) {
    return new PluginInvocation(batchPlugin, { loader: loader, ids: ids, callback: callback });
  },

  invoke: function (args, context) {
    return new Promise(function (resolve, reject) {
      let group = context.batchPlugin[args.loader];
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

  postprocess: function (root, context) {
    const meta = context.batchPlugin;
    context.batchPlugin = {};
    const promises = _.map(meta, function (group) {
      const ids = _.uniq(group.ids);
      return group.loader(ids).then(function (values) {
        _.each(group.callbacks, function (callback) {
          callback(values);
        });
      });
    });
    return Promise.all(promises);
  }
};