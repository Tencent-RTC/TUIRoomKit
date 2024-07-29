import * as Vue from 'vue';

export default Vue;

export function set(target: any, key: any, val: any) {
  if (Array.isArray(target)) {
    target.splice(key, 1, val);
    return val;
  }
  // eslint-disable-next-line no-param-reassign
  target[key] = val;
  return val;
}

export function del(target: any, key: any) {
  if (Array.isArray(target) && typeof key === 'number') {
    target.splice(key, 1);
    return;
  }
  // eslint-disable-next-line no-param-reassign
  delete target[key];
}
