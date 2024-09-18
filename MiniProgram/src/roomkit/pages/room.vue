<template>
  <conference-main-view display-mode="permanent" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import ConferenceMainView from '../TUIRoom/conference.vue';
import {
  conference,
  RoomEvent,
  LanguageOption,
  ThemeOption,
} from '../TUIRoom/index.ts';
import { useRoute } from '@/router/wxRouter';
import router from '@/router';
import i18n, { useI18n } from '../locales/index';
import { getLanguage, getTheme } from '../utils/utils';

declare const uni: any;
const { t } = useI18n();
const route = useRoute();
const roomInfo = uni.getStorageSync('tuiRoom-roomInfo');
const userInfo = uni.getStorageSync('tuiRoom-userInfo');
const roomId = String(route.query?.roomId as string) ? route.query?.roomId : '';
conference.setLanguage(getLanguage() as LanguageOption);
conference.setTheme(getTheme() as ThemeOption);
let isMaster = false;
let isExpectedJump = false;

if (!roomId) {
  router.push({ path: 'home' });
} else if (!roomInfo) {
  router.push({ path: 'home', query: { roomId } });
}

onMounted(async () => {
  const { action, isSeatEnabled, roomParam, hasCreated } = JSON.parse(
    roomInfo as string
  );
  const { sdkAppId, userId, userSig, userName, avatarUrl } = JSON.parse(
    userInfo as string
  );
  if (action === 'createRoom') {
    isMaster = true;
  }
  try {
    await conference.login({ sdkAppId, userId, userSig });
    await conference.setSelfInfo({ userName, avatarUrl });
    if (action === 'createRoom' && !hasCreated) {
      await conference.start(roomId, {
        roomName: `${userName || userId}${t('Quick Conference')}`,
        isSeatEnabled,
        ...roomParam,
      });
      const newRoomInfo = {
        action,
        roomId,
        roomName: roomId,
        isSeatEnabled,
        roomParam,
        hasCreated: true,
      };
      uni.setStorageSync('tuiRoom-roomInfo', JSON.stringify(newRoomInfo));
    } else {
      await conference.join(roomId, roomParam);
    }
  } catch (error: any) {
    uni.removeStorageSync('tuiRoom-currentUserInfo');
  }
});

const backToPage = (page: string, shouldClearUserInfo: boolean) => {
  uni.removeStorageSync('tuiRoom-roomInfo');
  shouldClearUserInfo && sessionStorage.removeItem('tuiRoom-currentUserInfo');
  goToPage(page);
};
const backToHome = () => backToPage('home', false);
const backToHomeAndClearUserInfo = () => backToPage('home', true);
const changeLanguage = (language: LanguageOption) => {
  i18n.global.locale.value = language;
  uni.setStorageSync('tuiRoom-language', language);
};
const changeTheme = (theme: ThemeOption) => {
  uni.setStorageSync('tuiRoom-currentTheme', theme);
};
conference.on(RoomEvent.ROOM_DISMISS, backToHome);
conference.on(RoomEvent.ROOM_LEAVE, backToHome);
conference.on(RoomEvent.KICKED_OUT, backToHome);
conference.on(RoomEvent.ROOM_ERROR, backToHome);
conference.on(RoomEvent.KICKED_OFFLINE, backToHome);
conference.on(RoomEvent.USER_SIG_EXPIRED, backToHomeAndClearUserInfo);
conference.on(RoomEvent.USER_LOGOUT, backToHomeAndClearUserInfo);
conference.on(RoomEvent.LANGUAGE_CHANGED, changeLanguage);
conference.on(RoomEvent.THEME_CHANGED, changeTheme);

onUnmounted(() => {
  conference.off(RoomEvent.ROOM_DISMISS, backToHome);
  conference.off(RoomEvent.ROOM_LEAVE, backToHome);
  conference.off(RoomEvent.KICKED_OUT, backToHome);
  conference.off(RoomEvent.ROOM_ERROR, backToHome);
  conference.off(RoomEvent.KICKED_OFFLINE, backToHome);
  conference.off(RoomEvent.USER_SIG_EXPIRED, backToHomeAndClearUserInfo);
  conference.off(RoomEvent.USER_LOGOUT, backToHomeAndClearUserInfo);
  conference.off(RoomEvent.LANGUAGE_CHANGED, changeLanguage);
  conference.off(RoomEvent.THEME_CHANGED, changeTheme);
});

const goToPage = (routePath: string) => {
  isExpectedJump = true;
  router.replace({ path: routePath });
};
</script>

<style lang="scss">
#app {
  position: relative;
  width: 100%;
  height: 100%;
  font-family: PingFangSC-Medium;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
