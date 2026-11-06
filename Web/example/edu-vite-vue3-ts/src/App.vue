<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { TUIMessageBox, t } from '@tencentcloud/roomkit-web-vue3';
import { LoginEvent, useLoginState } from 'tuikit-atomicx-vue3/room';
import { useRoute, useRouter } from 'vue-router';

const EXIT_OVERLAY_TARGET = 'body';

const { subscribeEvent, unsubscribeEvent } = useLoginState();
const router = useRouter();
const route = useRoute();

function goToLogin() {
  sessionStorage.removeItem('tuiRoom-userInfo');
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
