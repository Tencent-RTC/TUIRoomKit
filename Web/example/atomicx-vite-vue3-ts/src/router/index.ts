import { createRouter, createWebHashHistory } from 'vue-router';
import { TUIMessageBox, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
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

  // Room leave confirmation
  if (from.path === '/room' && to.path !== '/room') {
    const { currentRoom, leaveRoom } = useRoomState();
    const { t } = useUIKit();

    if (!currentRoom.value?.roomId) {
      next();
      return;
    }

    TUIMessageBox.confirm({
      type: 'warning',
      title: t('Room.LeaveRoomTitle'),
      content: t('Room.ConfirmLeavePage'),
      callback: async (action?: string) => {
        if (action === 'confirm') {
          await leaveRoom();
          next();
        } else {
          next(false);
        }
      },
    });
    return;
  }

  next();
});

export default router;

