import { createRouter, createWebHashHistory } from 'vue-router';

import Home from '@/views/home.vue';
import Room from '@/views/room.vue';
import Whiteboard from '@/views/whiteboard.vue';

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
  {
    path: '/whiteboard',
    component: Whiteboard,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
