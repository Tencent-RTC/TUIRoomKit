
import * as Vue from 'vue';

export const isVue27 = /^2\.7\.*/.test(Vue.version); // 是否是 Vue2.7 版本

export const isVue3 = /^3\.*/.test(Vue.version);  // 是否是 Vue3 版本

// @ts-ignore
export const isInnerScene = false;
