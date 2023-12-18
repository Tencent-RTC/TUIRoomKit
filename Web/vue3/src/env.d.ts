/*eslint-disable*/

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_RUNTIME_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'rtc-detect' {
  import RTCDetect from 'rtc-detect';
  export default RTCDetect;
}