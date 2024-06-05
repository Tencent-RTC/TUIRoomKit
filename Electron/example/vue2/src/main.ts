import Vue from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia, PiniaVuePlugin } from 'pinia';
import i18n from './locales';
import { ipcRenderer } from 'electron';
if (window.isHasScreen === undefined) {
  window.isHasScreen = false;
}

ipcRenderer.on('main-process-message', (_event, ...args) => {
  if (args.length > 0) {
    window.isHasScreen = args[0].isHasScreen;
  }
});

Vue.use(PiniaVuePlugin);
const pinia = createPinia();

Vue.config.productionTip = false;
Vue.use(i18n);

new Vue({
  pinia,
  // @ts-ignore
  router,
  render: h => h(App),
}).$mount('#app').$nextTick(window.removeLoading);
