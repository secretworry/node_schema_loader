"use strict";
/**
 * @author dusiyu
 * @date 4/17/17.
 */

import * as plugin from './plugin';

export {extend, Schema} from './schema';
export {resolve} from './resolve';
export {field} from './resolvers';

export const batch = plugin.batchPlugin.batch;
