declare module 'rtc-detect' {
  import RTCDetect from 'rtc-detect';
  export default RTCDetect;
}

interface ImportMetaEnv {
  readonly VITE_YOUR_URL: string;
  readonly VITE_REALM: string;
  readonly VITE_CLIENT_ID: string;
  readonly VITE_RUNTIME_SCENE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const wx: any;
