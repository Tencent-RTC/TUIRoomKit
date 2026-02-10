<template>
  <PreviewView
    @logout="handleLogout"
    @create-room="handleCreateRoom"
    @join-room="handleJoinRoom"
    @camera-preference-change="handleCameraPreferenceChange"
    @microphone-preference-change="handleMicrophonePreferenceChange"
  />
</template>

<script setup lang="ts">
import PreviewView from './PreviewView.vue';

interface Emits {
  (e: 'logout'): void;
  (e: 'create-room', roomId: string): void;
  (e: 'join-room', roomId: string): void;
  (e: 'camera-preference-change', isOpen: boolean): void;
  (e: 'microphone-preference-change', isOpen: boolean): void;
}

const emit = defineEmits<Emits>();

const handleCreateRoom = (roomId: string) => {
  emit('create-room', roomId);
};

const handleJoinRoom = (roomId: string) => {
  emit('join-room', roomId);
};

const handleCameraPreferenceChange = (isOpen: boolean) => {
  emit('camera-preference-change', isOpen);
};

const handleMicrophonePreferenceChange = (isOpen: boolean) => {
  emit('microphone-preference-change', isOpen);
};

const handleLogout = () => {
  emit('logout');
};
</script>
