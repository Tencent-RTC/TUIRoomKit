import { createApp } from 'vue';

import { i18next } from '@tencentcloud/uikit-base-component-vue3';
import { callExperimentalAPI } from 'tuikit-atomicx-vue3/room';
import { i18n, setUIConfig } from '@tencentcloud/roomkit-web-vue3';
import { enResource, zhResource } from './i18n';
import { setupVConsole } from './utils/setupVConsole';
import router from './router/index';
import App from '@/App.vue';

// Forwarded immediately to static setAssetsPath. Must run before getInstance().
const WHITEBOARD_ASSETS_PATH = 'https://unpkg.com/trtc-sdk-v5@5.20.2-beta.6/assets';

callExperimentalAPI({
  api: 'setRtcAssetsPath',
  params: { assetsPath: WHITEBOARD_ASSETS_PATH },
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

const app = createApp(App);

app.use(router);
app.mount('#app');
