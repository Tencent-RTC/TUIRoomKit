<template>
  <UIKitProvider theme="light" language="zh-CN">
    <div id="app">
      <router-view />
    </div>
  </UIKitProvider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { UIKitProvider } from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState, useRoomModal } from 'tuikit-atomicx-vue3/room';
import { useRouter } from 'vue-router';
import { useRoomInvitation } from './hooks/useRoomInvitation';

const { login } = useLoginState();
const { handleErrorWithModal } = useRoomModal();

const router = useRouter();


useRoomInvitation({
  onAcceptCall: (params) => {
    router.push({
      path: '/room',
      query: params,
    });
  },
});


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
