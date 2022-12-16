import { createRouter, createWebHashHistory } from 'vue-router';

import Home from '@/views/home.vue';
import Room from '@/views/room.vue';

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    component: Home,
  },
  {
    path: '/room',
    component: Room,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
