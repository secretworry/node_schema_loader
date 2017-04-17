// @flow
"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */
import type {Document, PrimitiveType} from './types';

export interface Field {
  visit(visitor: Visitor): void;
  resolve(): Document;
}

export type Visitor = {
  visitObjectField: (field: ObjectField) => void;
  visitArrayField: (field: ArrayField) => void;
  visitLeafField: (field: LeafField) => void;
  visitLoadingField: (field: LoadingField) => void;
}

export class ObjectField implements Field {
  rootValue: Object;
  fields: {[string]: Field};

  constructor(rootValue: Object) {
    this.rootValue = rootValue;
    this.fields = {}
  }

  resolve(): {[string]: Document} {
    const result = {};
    for (const key of Object.keys(this.fields)) {
      result[key] = this.fields[key].resolve();
    }
    return result;
  }

  visit(visitor: Visitor): void {
    visitor.visitObjectField(this);
    for (const key of Object.keys(this.fields)) {
      this.fields[key].visit(visitor)
    }
  }
}

export class ArrayField implements Field {
  values: Array<Field>;

  constructor(values: Array<Field>) {
    this.values = values;
  }

  resolve(): Array<Document> {
    const result = [];
    for (let value of this.values) {
      result.push(value.resolve())
    }
    return result;
  }

  visit(visitor: Visitor): void {
    visitor.visitArrayField(this);
    for (const value of this.values) {
      value.visit(visitor)
    }
  }
}

export class LeafField implements Field {
  value: PrimitiveType;

  constructor(value: PrimitiveType) {
    this.value = value;
  }

  resolve() {
    return this.value;
  }

  visit(visitor: Visitor) {
    visitor.visitLeafField(this);
  }
}

export class LoadingField implements Field {
  promise: Promise<Document>;
  callback: (Document, any) => Promise<any>;

  constructor(promise: Promise<Document>, callback: (Document, any) => Promise<any>) {
    this.promise = promise;
    this.callback = callback;
  }

  resolve() {
    throw "Resolving a Loading Field";
  }

  visit(visitor: Visitor) {
    visitor.visitLoadingField(this);
  }
}

