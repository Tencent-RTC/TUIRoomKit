import Vue from 'vue';

export default Vue;

export function set(target: any, key: any, val: any) {
  return Vue.set(target, key, val);
}

export function del(target: any, key: any) {
  return Vue.delete(target, key);
}
