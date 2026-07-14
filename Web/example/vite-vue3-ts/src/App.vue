<template>
  <UIKitProvider :theme="initialTheme" :language="initialLanguage">
    <div id="app">
      <router-view />
    </div>
  </UIKitProvider>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { conference, useRoomInvitation, useRoomInvitationH5, RoomEvent } from '@tencentcloud/roomkit-web-vue3';
import { TUIMessageBox, UIKitProvider, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoute, useRouter } from 'vue-router';
import { isPC } from './utils/utils';

const { t } = useUIKit();
const initialTheme = ref(localStorage.getItem('tuiRoom-theme') || 'light');
const initialLanguage = ref(localStorage.getItem('tuiRoom-language') || '');

const router = useRouter();
const route = useRoute();

if (!isPC) {
  useRoomInvitationH5({
    onAcceptCall: (params) => {
      router.push({
        path: '/room',
        query: params,
      });
    },
  });
} else {
  useRoomInvitation({
    onAcceptCall: (params) => {
      router.push({
        path: '/room',
        query: params,
      });
    },
  });
}

const onLoginExpired = () => {
  TUIMessageBox.alert({
    title: t('Login.Expired'),
    content: t('Login.ExpiredDescription'),
  });
  router.replace({ path: '/login' });
};
const onKickedOffline = () => {
  TUIMessageBox.alert({
    title: t('Login.KickedOffline'),
    content: t('Login.KickedOfflineDescription'),
  });
  router.replace({ path: '/login' });
};
const bindEvent = () => {
  conference.on(RoomEvent.USER_SIG_EXPIRED, onLoginExpired);
  conference.on(RoomEvent.KICKED_OFFLINE, onKickedOffline);
};
const unbindEvent = () => {
  conference.off(RoomEvent.USER_SIG_EXPIRED, onLoginExpired);
  conference.off(RoomEvent.KICKED_OFFLINE, onKickedOffline);
};

onMounted(async () => {
  bindEvent();
  await router.isReady();
  if (route.path === '/login') {
    return;
  }
  const storedData = sessionStorage.getItem('tuiRoom-userInfo') || '{}';
  const userInfo = JSON.parse(storedData);
  try {
    await conference.login({
      userId: userInfo.userID,
      userSig: userInfo.userSig,
      sdkAppId: userInfo.SDKAppID,
    });
  } catch (error: any) {
    console.error('Login failed:', error);
    sessionStorage.removeItem('tuiRoom-userInfo');
    router.replace({ path: '/login', query: { redirect: route.fullPath } });
  }
});

onUnmounted(() => {
  unbindEvent();
});

</script>

<style lang="scss">
@use './styles/base.scss';
</style>
