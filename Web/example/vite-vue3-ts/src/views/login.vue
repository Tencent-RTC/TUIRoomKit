<template>
  <div :class="['login-container', theme]">
    <Login
      class="login-widget"
      :SDKAppID="SDKAPPID"
      :model="LoginModel.userID"
      :generatorUserSig="genTestUserSig"
      :onLoginCallback="handleLogin"
    />
  </div>
</template>

<script setup lang="ts">
import { conference } from '@tencentcloud/roomkit-web-vue3';
import { useUIKit, TUIMessageBox } from '@tencentcloud/uikit-base-component-vue3';
import { Login, LoginModel } from '@tencentcloud/uikit-base-widget-vue3';
import { useRouter, useRoute } from 'vue-router';
import { SDKAPPID, genTestUserSig } from '../config/basic-info-config';

const { theme = 'light', t } = useUIKit();
const router = useRouter();
const route = useRoute();

const handleLogin = async (userInfo: { SDKAppID: number; userID: string; userSig: string }) => {
  if (!SDKAPPID) {
    TUIMessageBox.alert({
      title: t('Login.Error'),
      content: t('Login.PleaseConfigureSDKAPPID'),
    });
  }
  try {
    await conference.login({
      userId: userInfo.userID,
      userSig: userInfo.userSig,
      sdkAppId: userInfo.SDKAppID,
    });
    sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(userInfo));
    const redirect = route.query.redirect as string | undefined;
    if (redirect) {
      router.push(redirect);
    } else {
      const { from, ...query } = route.query;
      router.push({ path: (from as string) || '/home', query });
    }
  } catch (error: any) {
    console.error('Login failed:', error?.code);
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
