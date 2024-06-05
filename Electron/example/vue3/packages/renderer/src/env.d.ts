/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare const Aegis: any;

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_RUNTIME_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
