import { createSSRApp } from 'vue';
import App from '@/App.vue';
// import { createPinia } from 'pinia';
import * as Pinia from 'pinia' 
export function createApp() {
	const app = createSSRApp(App);
	app.use(Pinia.createPinia());
	return {
		app,
		Pinia, // 此处必须将 Pinia 返回
	};
}