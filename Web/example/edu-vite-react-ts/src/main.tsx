import ReactDOM from 'react-dom/client';

import { i18next } from '@tencentcloud/uikit-base-component-react';
import { callExperimentalAPI } from 'tuikit-atomicx-react/room';
import { i18n, setUIConfig } from '@tencentcloud/roomkit-web-react';
import { enResource, zhResource } from './i18n';
import { setupVConsole } from './utils/setupVConsole';
import Router from './router/index';
import App from './App';

// Forwarded immediately to static setAssetsPath. Must run before getInstance().
// Deploy the assets directory of the trtc-sdk-v5 npm package and set its URL here.
const TRTC_SDK_ASSETS_PATH = '';

callExperimentalAPI({
  api: 'setRtcAssetsPath',
  params: { assetsPath: TRTC_SDK_ASSETS_PATH },
});

setupVConsole();

export const addI18n = (lng: string, resource: any, deep = true, overwrite = false) => {
  i18next.addResourceBundle(lng, 'translation', resource.translation, deep, overwrite);
};

addI18n('en-US', { translation: enResource }, true, true);
addI18n('zh-CN', { translation: zhResource }, true, true);
// RoomKit's i18n is an i18next instance; app copy goes into its base 'translation' namespace.
i18n.addResourceBundle('en-US', 'translation', enResource, true, true);
i18n.addResourceBundle('zh-CN', 'translation', zhResource, true, true);

// Language persistence is the demo's job; RoomKit only reports changes.
const LANGUAGE_STORAGE_KEY = 'tuiRoom-language';
const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
if (storedLanguage === 'zh-CN' || storedLanguage === 'en-US') {
  setUIConfig({ language: storedLanguage });
}
i18n.on('languageChanged', (language: string) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
});

// The classroom only ships a dark theme.
setUIConfig({ theme: 'dark' });

ReactDOM.createRoot(document.getElementById('app')!).render(
  <Router>
    <App />
  </Router>,
);
