
import * as Vue from 'vue';

export const isVue27 = /^2\.7\.*/.test(Vue.version);

export const isVue3 = /^3\.*/.test(Vue.version);

// @ts-ignore
export const isInnerScene = import.meta && import.meta.env && import.meta.env.VITE_RUNTIME_SCENE === 'inner';
