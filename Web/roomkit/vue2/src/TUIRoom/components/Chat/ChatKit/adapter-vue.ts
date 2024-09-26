import * as Vue from 'vue';
let vueVersion: number;
let framework = 'vue2';
let createVNode = (
  arg1: any,
  arg2: any,
): { component: any; props: any; data: any } => {
  return {} as { component: any; props: any; data: any };
};
let render = (arg1: any, arg2: any) => {
  return;
};

vueVersion = 2.7

console.warn(`[adapter-vue]: vue version is ${vueVersion}`);
export { vueVersion, framework, render, createVNode };
export * from 'vue';
