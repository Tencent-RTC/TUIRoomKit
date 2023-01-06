import Vue from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia, PiniaVuePlugin } from 'pinia';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import i18n from './TUIRoom/locales/';

Vue.use(PiniaVuePlugin);
const pinia = createPinia();

Vue.use(ElementUI);
Vue.use(i18n);

Vue.config.productionTip = false;

new Vue({
  pinia,
  // @ts-ignore
  router,
  render: h => h(App),
}).$mount('#app');
