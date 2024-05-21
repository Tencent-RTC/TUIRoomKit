import { createApp } from 'vue';
import App from '@/App.vue';
import { createPinia } from 'pinia';
import router from './router/index';
import { ipcRenderer } from 'electron';
import i18n from './locales';
if (window.isHasScreen === undefined) {
  window.isHasScreen = false;
}

ipcRenderer.on('main-process-message', (_event, ...args) => {
  if (args.length > 0) {
    window.isHasScreen = args[0].isHasScreen;
  }
});

const app = createApp(App);
app.use(router);
app.use(i18n);
app.use(createPinia());
app.mount('#app').$nextTick(window.removeLoading);
