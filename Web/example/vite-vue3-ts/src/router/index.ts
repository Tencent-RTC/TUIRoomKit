import { createRouter, createWebHashHistory } from 'vue-router';
import Login from '@/views/login/LoginView.vue';

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
  const isLoggedIn = Boolean(sessionStorage.getItem('tuiRoom-userInfo'));
  if (to.path === '/login') {
    if (isLoggedIn) {
      next({ path: '/home', replace: true });
      return;
    }
    next();
    return;
  }
  if (!isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath }, replace: true });
    return;
  }
  next();
});

export default router;
