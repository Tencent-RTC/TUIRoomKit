/*eslint-disable*/

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'tsignaling/tsignaling-js' {
  import TSignaling from 'tsignaling/tsignaling-js';
  export default TSignaling;
}

declare module 'tim-js-sdk' {
  import TIM from 'tim-js-sdk';
  export default TIM;
}

declare const TencentCaptcha: any;

declare const Aegis: any;

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_RUNTIME_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
