import { createApp } from 'vue';
import App from '@/App.vue';
import { createPinia } from 'pinia';
import router from './router/index';
import VueI18n from '@/TUIRoom/locales/index';

const app = createApp(App);
app.use(router);
app.use(createPinia());
app.use(VueI18n);
app.mount('#app');
