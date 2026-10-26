import ReactDOM from 'react-dom/client';

import { i18next } from '@tencentcloud/uikit-base-component-react';
import { i18n } from '@tencentcloud/roomkit-web-react';
import { enResource, zhResource } from './i18n';
import Router from './router/index';
import App from '@/App';

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
