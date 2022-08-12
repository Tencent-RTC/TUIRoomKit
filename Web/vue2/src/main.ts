import Vue from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia, PiniaVuePlugin } from 'pinia';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.use(PiniaVuePlugin);
const pinia = createPinia();

Vue.use(ElementUI);

Vue.config.productionTip = false;

new Vue({
  pinia,
  router,
  render: h => h(App),
}).$mount('#app');
