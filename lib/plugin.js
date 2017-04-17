"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

export class PluginInvocation {}

PluginInvocation.prototype.invoke = function (node, context) {
  return this.plugin.invoke(this.args, context);
};