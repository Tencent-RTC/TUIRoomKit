<template>
  <LoginPage>
    <UserIDLoginForm :sdk-app-id="SDKAPPID" :generate-user-sig="genTestUserSig" :on-login="handleLogin" />
  </LoginPage>
</template>

<script setup lang="ts">
import { TUIMessageBox, useI18n } from '@tencentcloud/roomkit-web-vue3';
import { useRouter, useRoute } from 'vue-router';
import { SDKAPPID, genTestUserSig } from '../../config/basic-info-config';
import { LoginPage, UserIDLoginForm } from '../../features/Login';
import type { LoginUserInfo } from '../../features/Login';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const handleLogin = (userInfo: LoginUserInfo) => {
  if (!SDKAPPID) {
    TUIMessageBox.alert({
      title: t('Login.Error'),
      message: t('Login.PleaseConfigureSDKAPPID'),
    });
    return undefined;
  }
  sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(userInfo));
  const redirect = route.query.redirect as string | undefined;
  if (redirect) {
    return router.push(redirect);
  }
  const { from, ...query } = route.query;
  return router.push({ path: (from as string) || '/home', query });
};
</script>
