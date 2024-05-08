<template>
  <room
    ref="TUIRoomRef"
    data-theme="white"
    class="white-theme"
    @on-log-out="handleLogOut"
    @on-create-room="onCreateRoom"
    @on-enter-room="onEnterRoom"
    @on-destroy-room="onDestroyRoom"
    @on-exit-room="onExitRoom"
    @on-kicked-out-of-room="onKickedOutOfRoom"
    @on-kick-off-line="onKickedOffLine"
    @on-user-sig-expired="onUserSigExpired"
  ></room>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Room from '@TUIRoom/index.vue';
import { useRoute } from '@/router/wxRouter';
import router from '@/router';
import { checkNumber } from '@TUIRoom/utils/common';
import { useI18n } from '@TUIRoom/locales';
import TUIMessageBox from '@TUIRoom/components/common/base/MessageBox/index';
import useWxPageShow from '../TUIRoom/hooks/useWxPageShow';

useWxPageShow();
const { t } = useI18n();

const route = useRoute();

const roomInfo = uni.getStorageSync('tuiRoom-roomInfo');
const userInfo = uni.getStorageSync('tuiRoom-userInfo');

const roomId = checkNumber(route.query.roomId as string) ? route.query.roomId : '';

if (!roomId) {
  router.push({ path: 'home' });
} else if (!roomInfo) {
  router.push({ path: 'home', query: { roomId } });
}

const TUIRoomRef = ref();

onMounted(async () => {
  const { action, roomMode, roomParam, hasCreated } = JSON.parse(roomInfo as string);
  const { sdkAppId, userId, userSig, userName, avatarUrl } = JSON.parse(userInfo as string);
  try {
    await TUIRoomRef.value?.init({
      sdkAppId,
      userId,
      userSig,
      userName,
      avatarUrl,
    });
    if (action === 'createRoom' && !hasCreated) {
      try {
        await TUIRoomRef.value?.createRoom({ roomId, roomName: roomId, roomMode, roomParam });
        const newRoomInfo = { action, roomId, roomName: roomId, roomMode, roomParam, hasCreated: true };
        uni.setStorageSync('tuiRoom-roomInfo', JSON.stringify(newRoomInfo));
      } catch (error: any) {
        const message = t('Failed to enter the room.') + error.message;
        TUIMessageBox({
          title: t('Note'),
          message,
          confirmButtonText: t('Sure'),
          callback: async () => {
            router.replace({ path: 'home' });
          },
        });
      }
    } else {
      try {
        await TUIRoomRef.value?.enterRoom({ roomId, roomParam });
      } catch (error: any) {
        const message = t('Failed to enter the room.') + error.message;
        TUIMessageBox({
          title: t('Note'),
          message,
          confirmButtonText: t('Sure'),
          callback: async () => {
            router.replace({ path: 'home' });
          },
        });
      }
    }
  } catch (error: any) {
    const message = t('Failed to enter the room.') + error.message;
    TUIMessageBox({
      title: t('Note'),
      message,
      confirmButtonText: t('Sure'),
      callback: async () => {
        uni.removeStorageSync('tuiRoom-currentUserInfo');
        router.replace({ path: 'home' });
      },
    });
  }
});

/**
 * Processing users click [Logout Login] in the upper left corner of the page
 **/
function handleLogOut() {
  /**
   * The accessor handles the logout method
   **/
}

/**
 * Hosts create room callbacks
 **/
function onCreateRoom(info: { code: number; message: string }) {
  console.debug('onEnterRoom:', info);
}

/**
 * Ordinary members enter the room callback
 **/
function onEnterRoom(info: { code: number; message: string }) {
  console.debug('onCreateRoom:', info);
}

/**
 * Hosts destroy room callbacks
 **/
const onDestroyRoom = (info: { code: number; message: string }) => {
  console.debug('onDestroyRoom:', info);
  uni.removeStorageSync('tuiRoom-roomInfo');
  router.replace({ path: 'home' });
};

/**
 * Ordinary members exit the room callback
 **/
const onExitRoom = (info: { code: number; message: string }) => {
  console.debug('onExitRoom:', info);
  uni.removeStorageSync('tuiRoom-roomInfo');
  router.replace({ path: 'home' });
};

/**
 * Ordinary members were kicked out of the room by the host
 **/
const onKickedOutOfRoom = (info: { roomId: string; message: string }) => {
  console.debug('onKickedOutOfRoom:', info);
  uni.removeStorageSync('tuiRoom-roomInfo');
  router.replace({ path: 'home' });
};

/**
 * Users are kicked offline
 */
const onKickedOffLine = (info: { message: string }) => {
  console.debug('onKickedOffLine:', info);
  uni.removeStorageSync('tuiRoom-roomInfo');
  router.replace({ path: 'home' });
};

/**
 * Ordinary members were kicked out of the room by the host
 */
const onUserSigExpired = () => {
  console.debug('onUserSigExpired');
  uni.removeStorageSync('tuiRoom-roomInfo');
  uni.removeStorageSync('tuiRoom-currentUserInfo');
  router.replace({ path: 'home' });
};
</script>

<style lang="scss">
@import '@TUIRoom/assets/style/white-theme.scss';
#app {
  font-family: PingFangSC-Medium;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #b3b8c8;
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
