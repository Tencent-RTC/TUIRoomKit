import { createRouter, createWebHashHistory } from 'vue-router';
import Login from '@/views/login/LoginView.vue';
import { hasStoredSession } from '@/session/userSession';

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/home',
    component: () => import('@/views/home/HomeView.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.path === '/login') {
    next();
    return;
  }
  if (!hasStoredSession()) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }
  next();
});

export default router;
