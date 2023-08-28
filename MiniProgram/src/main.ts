import { createApp } from 'vue';
import App from '@/App.vue';
import { createPinia } from 'pinia';

// locales 为 TUIRoom/locales，因为主包无法使用分包资源，此处拷贝了一份 locales 在 src 路径下
import VueI18n from '@/locales/index';

const app = createApp(App);
app.use(createPinia());
app.use(VueI18n);
app.mount('#app');
