<template>
  <UIKitProvider :theme="loginTheme" :language="initialLanguage">
    <div class="login-container dark">
      <button
        type="button"
        class="login-language"
        @click="toggleLanguage"
      >
        {{ language === 'en-US' ? 'English' : '中文' }}
      </button>
      <Login
        class="login-widget"
        :SDKAppID="SDKAPPID"
        :model="LoginModel.userID"
        :generatorUserSig="genTestUserSig"
        :onLoginCallback="handleLogin"
      />
    </div>
  </UIKitProvider>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { TUIMessageBox, UIKitProvider, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Login, LoginModel } from '@tencentcloud/uikit-base-widget-vue3';
import { useI18n } from '@tencentcloud/roomkit-web-vue3';
import { useRouter, useRoute } from 'vue-router';
import { SDKAPPID, genTestUserSig } from '../../config/basic-info-config';

const LANGUAGE_STORAGE_KEY = 'tuiRoom-language';
// Classroom ships dark only; brand color mirrors --rk-brand in roomkit edu.scss.
const EDU_BRAND_COLOR = '#00c853';
const loginTheme = { themeStyle: 'dark', primaryColor: EDU_BRAND_COLOR };
const initialLanguage = ref(localStorage.getItem(LANGUAGE_STORAGE_KEY) || '');
const { t, language, setLanguage: setUIKitLanguage } = useUIKit();
const { setLanguage } = useI18n();

function toggleLanguage() {
  const next = language.value === 'en-US' ? 'zh-CN' : 'en-US';
  setUIKitLanguage(next);
  setLanguage(next);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
}

const router = useRouter();
const route = useRoute();

const handleLogin = async (userInfo: { SDKAppID: number; userID: string; userSig: string }) => {
  if (!SDKAPPID) {
    TUIMessageBox.alert({
      title: t('Login.Error'),
      content: t('Login.PleaseConfigureSDKAPPID'),
    });
    return;
  }
  sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(userInfo));
  const redirect = route.query.redirect as string | undefined;
  if (redirect) {
    router.push(redirect);
    return;
  }
  const { from, ...query } = route.query;
  router.push({ path: (from as string) || '/home', query });
};
</script>

<style scoped>
.login-container {
  position: relative;
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
  /* primaryColor only regenerates semantic tokens; these tints feed the input focus ring and code button hover. */
  --uikit-color-theme-1: rgba(0, 200, 83, 0.16);
  --uikit-color-theme-2: rgba(0, 200, 83, 0.24);

  background-image: url('../../assets/background-black.png');
}

.login-language {
  position: absolute;
  top: 24px;
  right: 24px;
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-secondary, #4f586b);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--stroke-color-primary, #d5e0f2);
  border-radius: 6px;
}
</style>
