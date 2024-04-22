import { createApp } from 'vue';
import App from '@/App.vue';
import { createPinia } from 'pinia';
import router from './router/index';
import i18n from './locales';

const app = createApp(App);
app.use(router);
app.use(i18n);
app.use(createPinia());
app.mount('#app');
