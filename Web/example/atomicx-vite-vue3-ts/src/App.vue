<template>
  <UIKitProvider theme="light" language="zh-CN">
    <div id="app">
      <router-view />
    </div>
  </UIKitProvider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { TUIToast, UIKitProvider, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { RoomEvent, useLoginState, useRoomState, useRoomModal, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { useRouter } from 'vue-router';
import { hideRoomInvitation, showRoomInvitation } from './components';
import type { RoomCall, RoomInfo } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const { login } = useLoginState();
const { currentRoom, subscribeEvent, rejectCall, acceptCall } = useRoomState();
const { handleErrorWithModal } = useRoomModal();
const { isMicrophoneTesting, isCameraTesting } = useDeviceState();

const router = useRouter();

function getMediaParams() {
  const params: Record<string, string> = {};
  if (isCameraTesting.value) {
    Object.assign(params, { openCamera: 'true' });
  }
  if (isMicrophoneTesting.value) {
    Object.assign(params, { openMicrophone: 'true' });
  }
  return params;
}

const handleRoomCallReceived = ({ roomInfo, call }: { roomInfo: RoomInfo; call: RoomCall }) => {
  const { caller } = call;
  if (currentRoom.value?.roomId) {
    rejectCall({ roomId: roomInfo.roomId });
    return;
  }

  showRoomInvitation({
    inviterName: caller.userName,
    inviterAvatar: caller.avatarUrl,
    roomName: roomInfo.roomName,
    hostName: roomInfo.roomOwner.userName,
    participantCount: roomInfo.participantCount ?? 0,
    duration: 60,
    onCancel: () => {
      rejectCall({ roomId: roomInfo.roomId });
    },
    onAccept: () => {
      acceptCall({ roomId: roomInfo.roomId });
      router.push({
        path: '/room',
        query: {
          roomId: roomInfo.roomId,
          password: roomInfo.password || '',
          ...getMediaParams(),
        },
      });
    },
  });
};

const onRoomCallHandledByOtherDevice = () => {
  TUIToast.info({ message: t('RoomInvitation.HandleByOtherDevice') });
  hideRoomInvitation();
};

onMounted(async () => {
  const storedData = localStorage.getItem('tuiRoom-userInfo') || '{}';
  const userInfo = JSON.parse(storedData);
  try {
    await login({
      userId: userInfo.userID,
      userSig: userInfo.userSig,
      sdkAppId: userInfo.SDKAppID,
    });
  } catch (error: any) {
    console.error('Login failed:', error);
    handleErrorWithModal(error);
    localStorage.removeItem('tuiRoom-userInfo');
    router.replace({ path: '/login' });
  }
  subscribeEvent(RoomEvent.onCallReceived, handleRoomCallReceived);
  subscribeEvent(RoomEvent.onCallHandledByOtherDevice, onRoomCallHandledByOtherDevice);
});

</script>

<style lang="scss">
@use './styles/base.scss';
</style>
