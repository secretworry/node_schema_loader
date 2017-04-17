"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

export class ObjectField {

  constructor(rootValue) {
    this.rootValue = rootValue;
    this.fields = {};
  }

  resolve() {
    const result = {};
    for (const key of Object.keys(this.fields)) {
      result[key] = this.fields[key].resolve();
    }
    return result;
  }

  visit(visitor) {
    visitor.visitObjectField(this);
    for (const key of Object.keys(this.fields)) {
      this.fields[key].visit(visitor);
    }
  }
}

export class ArrayField {

  constructor(values) {
    this.values = values;
  }

  resolve() {
    const result = [];
    for (let value of this.values) {
      result.push(value.resolve());
    }
    return result;
  }

  visit(visitor) {
    visitor.visitArrayField(this);
    for (const value of this.values) {
      value.visit(visitor);
    }
  }
}

export class LeafField {

  constructor(value) {
    this.value = value;
  }

  resolve() {
    return this.value;
  }

  visit(visitor) {
    visitor.visitLeafField(this);
  }
}

export class LoadingField {

  constructor(promise, callback) {
    this.promise = promise;
    this.callback = callback;
  }

  resolve() {
    throw "Resolving a Loading Field";
  }

  visit(visitor) {
    visitor.visitLoadingField(this);
  }
}