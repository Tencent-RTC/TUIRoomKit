<template>
  <PreConferenceView
    @logout="handleLogout"
    @create-room="handleCreateRoom"
    @join-room="handleJoinRoom"
    @camera-preference-change="handleCameraPreferenceChange"
    @microphone-preference-change="handleMicrophonePreferenceChange"
  />
</template>

<script setup lang="ts">
import { PreConferenceView } from '@tencentcloud/roomkit-web-vue3';
import { useRouter } from 'vue-router';
import { useMediaPreference } from '../hooks/useMediaPreference';
import type { TUIRoomType } from 'tuikit-atomicx-vue3/room';

const router = useRouter();

const { setMicrophonePreference, setCameraPreference } = useMediaPreference();

const handleCameraPreferenceChange = (isOpen: boolean) => {
  setCameraPreference(isOpen);
};

const handleMicrophonePreferenceChange = (isOpen: boolean) => {
  setMicrophonePreference(isOpen);
};

const handleLogout = () => {
  router.push('/login');
};

const handleCreateRoom = async (roomId: string, roomType: TUIRoomType) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'true');
  router.push({
    path: '/room',
    query: { roomId, roomType },
  });
};

const handleJoinRoom = async (roomId: string, roomType: TUIRoomType) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'false');
  router.push({
    path: '/room',
    query: { roomId, roomType },
  });
};
</script>

<style lang="scss" scoped></style>
