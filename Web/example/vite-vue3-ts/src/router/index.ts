import { TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { createRouter, createWebHashHistory } from 'vue-router';
import { isPC } from '../utils/utils';
import Login from '@/views/login.vue';

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
    component: isPC ? () => import('@/views/home.vue') : () => import('@/views/homeH5.vue'),
  },
  {
    path: '/room',
    component: isPC ? () => import('@/views/room.vue') : () => import('@/views/roomH5.vue'),
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
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }

  // Room leave confirmation
  if ((from.path === '/room') && (to.path !== '/room')) {
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
