<template>
  <Room
    ref="TUIRoomRef"
    @on-log-out="handleLogOut"
    @on-create-room="onCreateRoom"
    @on-enter-room="onEnterRoom"
    @on-exit-room="onExitRoom"
    @on-destroy-room="onDestroyRoom"
    @on-kick-off="onKickOff"
  ></Room>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Room from '@/TUIRoom/index.vue';
import { useRoute } from 'vue-router';
import router from '@/router';
import { checkNumber } from '@/TUIRoom/utils/common';

const route = useRoute();

const roomInfo = sessionStorage.getItem('tuiRoom-roomInfo');
const userInfo = sessionStorage.getItem('tuiRoom-userInfo');

const roomId = checkNumber((route.query.roomId) as string) ? route.query.roomId : '';

if (!roomId) {
  router.push({ path: 'home' });
} else if (!roomInfo) {
  router.push({ path: 'home', query: { roomId } });
}

const TUIRoomRef = ref();

onMounted(async () => {
  const { action, roomMode, roomParam } = JSON.parse(roomInfo as string);
  const { sdkAppId, userId, userSig, shareUserId, shareUserSig, userName, userAvatar } = JSON.parse(userInfo as string);
  await TUIRoomRef.value?.init({
    sdkAppId,
    userId,
    userSig,
    userName,
    userAvatar,
    shareUserId,
    shareUserSig,
  });
  if (action === 'createRoom') {
    await TUIRoomRef.value?.createRoom(Number(roomId), roomMode, roomParam);
  } else if (action === 'enterRoom') {
    await TUIRoomRef.value?.enterRoom(Number(roomId), roomParam);
  }
});
/**
 * Processing users click [Logout Login] in the upper left corner of the page
 *
 * 处理用户点击页面左上角【退出登录】
**/
function handleLogOut() {
/**
 * The accessor handles the logout method
 *
 * 接入方处理 logout 方法
**/
}

/**
 * Hosts create room callbacks
 *
 * 主持人创建房间回调
**/
function onCreateRoom(info: { code: number; message: string }) {
  console.debug('onEnterRoom:', info);
}

/**
 * Ordinary members enter the room callback
 *
 * 普通成员进入房间回调
**/
function onEnterRoom(info: { code: number; message: string }) {
  console.debug('onCreateRoom:', info);
}

/**
 * Hosts destroy room callbacks
 *
 * 主持人销毁房间回调
**/
const onDestroyRoom = (info: { code: number; message: string }) => {
  console.debug('onDestroyRoom:', info);
  sessionStorage.removeItem('tuiRoom-roomInfo');
  router.replace({ path: '/home' });
};

/**
 * Ordinary members exit the room callback
 *
 * 普通成员退出房间回调
**/
const onExitRoom = (info: { code: number; message: string }) => {
  console.debug('onExitRoom:', info);
  sessionStorage.removeItem('tuiRoom-roomInfo');
  router.replace({ path: '/home' });
};

/**
 * Ordinary members were kicked out of the room by the host
 *
 * 普通成员被主持人踢出房间
**/
const onKickOff = (info: { code: number; message: string }) => {
  console.debug('onKickOff:', info);
  sessionStorage.removeItem('tuiRoom-roomInfo');
  router.replace({ path: '/home' });
};

</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #B3B8C8;
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
