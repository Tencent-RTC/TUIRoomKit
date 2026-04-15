<template>
  <div :class="['login-container', theme]">
    <Login
      class="login-widget"
      v-bind="{
        SDKAppID: SDKAPPID,
        generatorUserSig: genTestUserSig,
        onLoginCallback: handleLogin
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState, useRoomModal } from 'tuikit-atomicx-vue3/room';
import { useRouter, useRoute } from 'vue-router';
import Login from '../components/LoginUserID/index.vue';
import { SDKAPPID, genTestUserSig } from '../config/basic-info-config';
import { deepClone } from '../utils/utils';

const { theme = 'light' } = useUIKit();
const { login } = useLoginState();
const { handleErrorWithModal } = useRoomModal();

const router = useRouter();
const route = useRoute();

const handleLogin = async (userInfo: {
  SDKAppID: number;
  userID: string;
  userSig: string;
}) => {
  try {
    await login({
      userId: userInfo.userID,
      userSig: userInfo.userSig,
      sdkAppId: userInfo.SDKAppID,
    });
    localStorage.setItem('tuiRoom-userInfo', JSON.stringify(userInfo));
    const currentQuery = deepClone(route.query);
    router.push({ path: route.query.from as string || '/home', query: currentQuery });
  } catch (error: any) {
    console.error('Login failed:', error.code);
    handleErrorWithModal(error);
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: var(--bg-color-dialog);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;

  @media screen and (orientation: portrait), (orientation: landscape) {
    :deep(.phone-prefix) {
      min-width: 30px;
    }
  }
}

.login-container.dark {
  background-image: url('../assets/background-black.png');
}

.login-container.light {
  background-image: url('../assets/background-white.png');
}
</style>
