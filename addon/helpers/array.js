/**
 * array helper
 * Temporary fix until the following bug is resolved: https://github.com/emberjs/ember.js/issues/14264
 */
import { A as emberArray } from '@ember/array';

import Helper from '@ember/component/helper';
const {helper} = Helper

export function array (params) {
  // params is a frozen, non-ember array
  return emberArray(params.slice())
}

export default helper(array)
