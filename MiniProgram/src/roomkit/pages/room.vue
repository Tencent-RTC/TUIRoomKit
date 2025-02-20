<template>
  <conference-main-view display-mode="permanent" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import ConferenceMainView from '../TUIRoom/conference.vue';
import { conference, RoomEvent } from '../TUIRoom/index.ts';
import { getBasicInfo } from '../config/basic-info-config';

declare const uni: any;
const roomInfo = JSON.parse(uni.getStorageSync('tuiRoom-roomInfo'));
const userInfo = getBasicInfo();

onMounted(async () => {
  const { action, isSeatEnabled, roomParam, roomId } = roomInfo;
  const { sdkAppId, userId, userSig, userName, avatarUrl } = userInfo;
  const {
    isOpenCamera,
    isOpenMicrophone,
    defaultCameraId,
    defaultMicrophoneId,
    defaultSpeakerId,
  } = roomParam;
  await conference.login({ sdkAppId, userId, userSig });
  await conference.setSelfInfo({ userName, avatarUrl });
  if (action === 'createRoom') {
    await conference.start(roomId, {
      roomName: `${userName || userId} 的快速会议`,
      isSeatEnabled,
      isOpenCamera,
      isOpenMicrophone,
      defaultCameraId,
      defaultMicrophoneId,
      defaultSpeakerId,
    });
  } else {
    await conference.join(roomId, {
      isOpenCamera,
      isOpenMicrophone,
      defaultCameraId,
      defaultMicrophoneId,
      defaultSpeakerId,
    });
  }
});

const backToPage = (page: string) => {
  uni.removeStorageSync('tuiRoom-roomInfo');
  uni.redirectTo({ url: page });
};
const backToHome = () => backToPage('home');
conference.on(RoomEvent.ROOM_DISMISS, backToHome);
conference.on(RoomEvent.ROOM_LEAVE, backToHome);
conference.on(RoomEvent.KICKED_OUT, backToHome);
conference.on(RoomEvent.ROOM_ERROR, backToHome);
conference.on(RoomEvent.KICKED_OFFLINE, backToHome);
conference.on(RoomEvent.USER_SIG_EXPIRED, backToHome);
conference.on(RoomEvent.USER_LOGOUT, backToHome);

onUnmounted(() => {
  conference.off(RoomEvent.ROOM_DISMISS, backToHome);
  conference.off(RoomEvent.ROOM_LEAVE, backToHome);
  conference.off(RoomEvent.KICKED_OUT, backToHome);
  conference.off(RoomEvent.ROOM_ERROR, backToHome);
  conference.off(RoomEvent.KICKED_OFFLINE, backToHome);
  conference.off(RoomEvent.USER_SIG_EXPIRED, backToHome);
  conference.off(RoomEvent.USER_LOGOUT, backToHome);
});
</script>

<style lang="scss">
#app {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
