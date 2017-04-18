"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

import type {Resolver} from './types'

export function field(name, options): Resolver  {
  options = options || {};
  return function(parentValue, context) {
    if(!name) {
      name = context.node.name;
    }
    let value = parentValue[name];
    if (value === undefined || value === null) {
      return options.default;
    } else {
      return value;
    }
  }
}

