<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { TUIMessageBox, t, useI18n } from '@tencentcloud/roomkit-web-vue3-next';
import { LoginEvent, useLoginState } from 'tuikit-atomicx-vue3/room';
import { useRoute, useRouter } from 'vue-router';
import { clearStoredUser } from './session/userSession';

const EXIT_OVERLAY_TARGET = 'body';

const savedLanguage = localStorage.getItem('tuiRoom-language') || '';
const { setLanguage } = useI18n();
const { subscribeEvent, unsubscribeEvent } = useLoginState();
const router = useRouter();
const route = useRoute();

if (savedLanguage) {
  setLanguage(savedLanguage);
}

function goToLogin() {
  clearStoredUser();
  if (route.path !== '/login') {
    router.replace({ path: '/login' });
  }
}

function onLoginExpired() {
  TUIMessageBox.alert({
    title: t('Login.Expired'),
    message: t('Login.ExpiredDescription'),
    appendTo: EXIT_OVERLAY_TARGET,
  });
  goToLogin();
}

function onKickedOffline() {
  TUIMessageBox.alert({
    title: t('Login.KickedOffline'),
    message: t('Login.KickedOfflineDescription'),
    appendTo: EXIT_OVERLAY_TARGET,
  });
  goToLogin();
}

function bindEvent() {
  subscribeEvent(LoginEvent.onLoginExpired, onLoginExpired);
  subscribeEvent(LoginEvent.onKickedOffline, onKickedOffline);
}

function unbindEvent() {
  unsubscribeEvent(LoginEvent.onLoginExpired, onLoginExpired);
  unsubscribeEvent(LoginEvent.onKickedOffline, onKickedOffline);
}

onMounted(() => {
  bindEvent();
});

onUnmounted(() => {
  unbindEvent();
});
</script>

<style lang="scss">
@use './styles/base.scss';
</style>
