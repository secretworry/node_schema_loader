"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

const RESOLVER_KEY = "__resolver__";
const ARGS_KEY = "__args__";

class Node {

  constructor(name) {
    this.name = name;
    this.resolver = null;
    this.args = null;
    this.children = [];
  }

  static fromDefinition(key, value) {
    const node = new Node(key);
  }
}

class Schema {}