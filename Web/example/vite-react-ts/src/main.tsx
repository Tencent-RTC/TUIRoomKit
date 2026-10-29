import ReactDOM from 'react-dom/client';

import { i18next } from '@tencentcloud/uikit-base-component-react';
import { callExperimentalAPI } from 'tuikit-atomicx-react/room';
import { i18n } from '@tencentcloud/roomkit-web-react';
import { enResource, zhResource } from './i18n';
import { setupVConsole } from './utils/setupVConsole';
import Router from './router/index';
import App from '@/App';

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
i18n.addTranslations('en-US', enResource);
i18n.addTranslations('zh-CN', zhResource);

ReactDOM.createRoot(document.getElementById('app')!).render(
  <Router>
    <App />
  </Router>,
);
