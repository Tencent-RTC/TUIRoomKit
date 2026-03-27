<template>
  <ConferenceMainView />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { conference, ConferenceMainView, RoomEvent as ConferenceRoomEvent } from '@tencentcloud/roomkit-web-vue3';
import {
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  useLoginState,
  useRoomState,
  useDeviceState,
  VideoQuality,
  useRoomParticipantState,
  useRoomModal,
  RoomType,
} from 'tuikit-atomicx-vue3/room';
import { useRoute, useRouter } from 'vue-router';
import { useMediaPreference } from '../hooks/useMediaPreference';

conference.setFeatureConfig({
  aiTools: { enable: true },
});

const route = useRoute();
const router = useRouter();
const { t } = useUIKit();
const { handleErrorWithModal } = useRoomModal();

const { loginUserInfo } = useLoginState();
const { currentRoom } = useRoomState();
const { localVideoQuality, openLocalCamera, updateVideoQuality, openLocalMicrophone } = useDeviceState();
const { muteMicrophone, unmuteMicrophone } = useRoomParticipantState();

const { getMicrophonePreference, getCameraPreference } = useMediaPreference();

const { roomId, password, roomType: roomTypeString } = route.query as { roomId: string; password?: string; roomType: string };
const roomType = Number(roomTypeString) as RoomType;

if (!roomId) {
  router.replace('/home');
}

watch(() => loginUserInfo.value?.userId, async (userId) => {
  if (!userId || !roomId || currentRoom.value?.roomId) {
    return;
  }
  await handleEnterRoom();
}, { immediate: true });

watch(() => currentRoom.value?.roomId, async (currentRoomId, prevRoomId) => {
  if (!prevRoomId && currentRoomId) {
    if (currentRoom.value?.roomType === RoomType.Webinar && currentRoom.value?.roomOwner.userId !== loginUserInfo.value?.userId) {
      return;
    }
    handleOpenCamera();
    handleOpenMicrophone();
  }
}, { immediate: true });

async function handleEnterRoom() {
  const isCreateKey = `room-${roomId}-isCreate`;
  const isCreate = sessionStorage.getItem(isCreateKey) === 'true';
  sessionStorage.removeItem(isCreateKey);
  try {
    if (isCreate) {
      await handleStartConference();
    } else {
      await handleJoinConference();
    }
  } catch (error) {
    handleErrorWithModal(error);
    router.replace('/home');
  }
}

async function handleStartConference() {
  const roomName = roomType === RoomType.Webinar
    ? `${loginUserInfo.value?.userName || loginUserInfo.value?.userId}${t('Room.Webinar')}`
    : `${loginUserInfo.value?.userName || loginUserInfo.value?.userId}${t('Room.TemporaryMeeting')}`;
  await conference.createAndJoinRoom({
    roomId,
    roomType,
    options: { roomName },
  });
}

async function handleJoinConference() {
  await conference.joinRoom({
    roomId,
    roomType,
    password,
  });
}

async function handleOpenCamera() {
  if (!localVideoQuality.value) {
    updateVideoQuality({ quality: VideoQuality.Quality720P });
  }
  if (getCameraPreference()) {
    try {
      await openLocalCamera();
    } catch (error) {
      handleErrorWithModal(error);
    }
  }
}

async function handleOpenMicrophone() {
  try {
    await muteMicrophone();
    await openLocalMicrophone();
  } catch (error) {
    handleErrorWithModal(error);
  }
  if (getMicrophonePreference()) {
    await unmuteMicrophone();
  }
}

const handleBackHome = () => {
  router.replace('/home');
};

onMounted(() => {
  conference.on(ConferenceRoomEvent.ROOM_DISMISS, handleBackHome);
  conference.on(ConferenceRoomEvent.ROOM_LEAVE, handleBackHome);
  conference.on(ConferenceRoomEvent.ROOM_ERROR, handleBackHome);
  conference.on(ConferenceRoomEvent.KICKED_OUT, handleBackHome);
});

onUnmounted(() => {
  conference.off(ConferenceRoomEvent.ROOM_DISMISS, handleBackHome);
  conference.off(ConferenceRoomEvent.ROOM_LEAVE, handleBackHome);
  conference.off(ConferenceRoomEvent.ROOM_ERROR, handleBackHome);
  conference.off(ConferenceRoomEvent.KICKED_OUT, handleBackHome);
});

</script>

<style lang="scss" scoped>
</style>
