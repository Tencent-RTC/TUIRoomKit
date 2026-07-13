<template>
  <div class="home-view">
    <PreConferenceView
      @logout="handleLogout"
      @create-room="handleCreateRoom"
      @join-room="handleJoinRoom"
      @camera-preference-change="handleCameraPreferenceChange"
      @microphone-preference-change="handleMicrophonePreferenceChange"
    />
  </div>
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
  const targetRoomId = sessionStorage.getItem('manualRoomId') || roomId;
  sessionStorage.setItem(`room-${targetRoomId}-isCreate`, 'true');
  router.push({
    path: '/room',
    query: { roomId: targetRoomId, roomType },
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

<style lang="scss" scoped>
.home-view {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
