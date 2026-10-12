import { createApp } from 'vue';

import { i18next } from '@tencentcloud/uikit-base-component-vue3';
import { i18n } from '@tencentcloud/roomkit-web-vue3-next';
import { enResource, zhResource } from './i18n';
import router from './router/index';
import App from '@/App.vue';

export const addI18n = (lng: string, resource: any, deep = true, overwrite = false) => {
  i18next.addResourceBundle(lng, 'translation', resource.translation, deep, overwrite);
};

addI18n('en-US', { translation: enResource }, true, true);
addI18n('zh-CN', { translation: zhResource }, true, true);
i18n.addResourceBundle('en-US', enResource);
i18n.addResourceBundle('zh-CN', zhResource);

const app = createApp(App);

app.use(router);
app.mount('#app');
