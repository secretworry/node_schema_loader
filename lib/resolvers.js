"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.field = field;
function field(name, options) {
  options = options || {};
  return function (parentValue, context) {
    if (!name) {
      name = context.node.name;
    }
    var value = parentValue[name];
    if (value === undefined || value === null) {
      return options.default;
    } else {
      return value;
    }
  };
}