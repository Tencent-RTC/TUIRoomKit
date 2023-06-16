import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    component: () => import('@/views/home.vue'),
  },
  {
    path: '/room',
    component: () => import('@/views/room.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
router.beforeEach((to, from, next) => {
  if (to.name === from.name && to.params === from.params) {
    // 如果当前路由和上一个路由相同，则禁用返回
    next(false);
  } else {
    next();
  }
});
export default router;
