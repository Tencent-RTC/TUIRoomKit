import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { bootstrapSession } from './utils/auth';
import './styles/index.css';

async function bootstrapApp() {
  await bootstrapSession();
  createApp(App).use(router).mount('#app');
}

void bootstrapApp();
