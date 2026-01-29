<template>
  <UIKitProvider :theme="initialTheme" :language="initialLanguage">
    <div id="app">
      <router-view />
    </div>
  </UIKitProvider>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoomInvitation, useRoomInvitationH5 } from '@tencentcloud/roomkit-web-vue3';
import { UIKitProvider } from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState, useRoomModal } from 'tuikit-atomicx-vue3/room';
import { useRouter } from 'vue-router';
import { isPC } from './utils/utils';

const initialTheme = ref(localStorage.getItem('tuiRoom-theme') || 'light');
const initialLanguage = ref(localStorage.getItem('tuiRoom-language') || '');

const router = useRouter();
const { login } = useLoginState();
const { handleErrorWithModal } = useRoomModal();

useRoomInvitation({
  onAcceptCall: (params) => {
    router.push({
      path: '/room',
      query: params,
    });
  },
});

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

onMounted(async () => {
  const storedData = localStorage.getItem('tuiRoom-userInfo') || '{}';
  const userInfo = JSON.parse(storedData);
  try {
    await login({
      userId: userInfo.userID,
      userSig: userInfo.userSig,
      sdkAppId: userInfo.SDKAppID,
    });
  } catch (error: any) {
    console.error('Login failed:', error);
    handleErrorWithModal(error);
    localStorage.removeItem('tuiRoom-userInfo');
    router.replace({ path: '/login' });
  }
});

</script>

<style lang="scss">
@use './styles/base.scss';
</style>
