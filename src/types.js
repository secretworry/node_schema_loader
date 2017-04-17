// @flow
"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */
export type PrimitiveType =
  | String
  | Number
  | Boolean

export type Document =
  | {[string]: Document}
  | Array<Document>
  | PrimitiveType
