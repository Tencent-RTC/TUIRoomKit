import { createRouter, createWebHashHistory } from 'vue-router';
import Login from '@/views/login.vue';
import Home from '@/views/home.vue';
import Room from '@/views/room.vue';
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

router.beforeEach((to, from, next) => {
  if (to.path === '/login') {
    next();
    return;
  }
  const userInfo = localStorage.getItem('tuiRoom-userInfo');
  if (!userInfo) {
    if (routes.some(route => route.path === from.path) && from.path !== '/login') {
      next({ path: '/login', query: { from: to.path } });
    } else {
      next('/login');
    }
    return;
  }

  next();
});

export default router;
