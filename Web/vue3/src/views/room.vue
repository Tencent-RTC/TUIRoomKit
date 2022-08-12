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

const route = useRoute();

const roomInfo = sessionStorage.getItem('tuiRoom-roomInfo');
const userInfo = sessionStorage.getItem('tuiRoom-userInfo');

const roomId = route.query?.roomId;
if (!roomId || !roomInfo) {
  router.push({ path: 'home' });
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

// 处理用户点击页面左上角【退出登录】
function handleLogOut() {
  // 接入方处理 logout 方法
}

// 主持人创建房间回调
function onCreateRoom(info: { code: number; message: string }) {
  console.debug('onEnterRoom:', info);
}

// 普通成员进入房间回调
function onEnterRoom(info: { code: number; message: string }) {
  console.debug('onCreateRoom:', info);
}

// 主持人销毁房间回调
const onDestroyRoom = (info: { code: number; message: string }) => {
  console.debug('onDestroyRoom:', info);
  router.replace({ path: '/home' });
};

// 普通成员退出房间回调
const onExitRoom = (info: { code: number; message: string }) => {
  console.debug('onExitRoom:', info);
  router.replace({ path: '/home' });
};

// 普通成员被主持人踢出房间
const onKickOff = (info: { code: number; message: string }) => {
  console.debug('onKickOff:', info);
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
