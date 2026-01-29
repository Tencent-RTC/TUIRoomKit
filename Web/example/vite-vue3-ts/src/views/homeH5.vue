<template>
  <PreConferenceViewH5
    @logout="handleLogout"
    @create-room="handleCreateRoom"
    @join-room="handleJoinRoom"
    @camera-preference-change="handleCameraPreferenceChange"
    @microphone-preference-change="handleMicrophonePreferenceChange"
  />
</template>

<script setup lang="ts">
import { PreConferenceViewH5 } from '@tencentcloud/roomkit-web-vue3';
import { useRouter } from 'vue-router';
import { useMediaPreference } from '../hooks/useMediaPreference';

const { setCameraPreference, setMicrophonePreference } = useMediaPreference();

const router = useRouter();

const handleCameraPreferenceChange = (isOpen: boolean) => {
  setCameraPreference(isOpen);
};

const handleMicrophonePreferenceChange = (isOpen: boolean) => {
  setMicrophonePreference(isOpen);
};

const handleLogout = () => {
  router.push('/login');
};

const handleCreateRoom = async (roomId: string) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'true');
  router.push({
    path: '/room',
    query: { roomId },
  });
};

const handleJoinRoom = async (roomId: string) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'false');
  router.push({
    path: '/room',
    query: { roomId },
  });
};
</script>

<style lang="scss" scoped></style>
