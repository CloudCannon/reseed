/**
import { isEmpty } from 'Helpers/object-helper.js';
import { mergeDeep } from 'Helpers/object-helper';
 * A function which determines whether or not a
 * variable is an object
 *
 * @param {Object} item The item to test
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects, similar to lodash.
 * i.e., merges objects multiple levels down.
 *
 * If there are any clashes, the {@link source}
 * takes precedence.
 *
 * @param target The first object (gets overwritten if conflicted
 * with {@link source}).
 * @param source The second object
 *
 * @returns The merged array
 */
function mergeDeep(target, source) {
  let output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

/**
 * A function which determines whether or not an object is
 * empty
 * 
 * @param {Object} obj The object to inspect
 */
const isEmpty = (obj) => Object.entries(obj).length === 0 && obj.constructor === Object;

module.exports = { isEmpty, mergeDeep, isObject };
