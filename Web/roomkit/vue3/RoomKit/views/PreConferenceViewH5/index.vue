<template>
  <PreviewView
    v-if="!createRoomViewVisible && !joinRoomViewVisible"
    @logout="handleLogout"
    @create-room="createRoomViewVisible = true"
    @join-room="joinRoomViewVisible = true"
    @camera-preference-change="handleCameraPreferenceChange"
    @microphone-preference-change="handleMicrophonePreferenceChange"
  />
  <CreateRoomView
    v-if="createRoomViewVisible"
    :camera-preference="cameraPreference"
    :microphone-preference="microphonePreference"
    @create-room="handleCreateRoom"
    @back="() => (createRoomViewVisible = false)"
    @camera-preference-change="handleCameraPreferenceChange"
    @microphone-preference-change="handleMicrophonePreferenceChange"
  />
  <JoinRoomView
    v-if="joinRoomViewVisible"
    :camera-preference="cameraPreference"
    :microphone-preference="microphonePreference"
    @join-room="handleJoinRoom"
    @back="() => (joinRoomViewVisible = false)"
    @camera-preference-change="handleCameraPreferenceChange"
    @microphone-preference-change="handleMicrophonePreferenceChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CreateRoomView from './CreateRoomView.vue';
import JoinRoomView from './JoinRoomView.vue';
import PreviewView from './PreviewView.vue';

interface Emits {
  (e: 'logout'): void;
  (e: 'create-room', roomId: string): void;
  (e: 'join-room', roomId: string): void;
  (e: 'camera-preference-change', isOpen: boolean): void;
  (e: 'microphone-preference-change', isOpen: boolean): void;
}

const emit = defineEmits<Emits>();

const cameraPreference = ref(true);
const microphonePreference = ref(true);
const createRoomViewVisible = ref(false);
const joinRoomViewVisible = ref(false);

function handleLogout() {
  emit('logout');
}

const handleCreateRoom = (roomId: string) => {
  emit('create-room', roomId);
};

const handleJoinRoom = (roomId: string) => {
  emit('join-room', roomId);
};

const handleCameraPreferenceChange = (isOpen: boolean) => {
  cameraPreference.value = isOpen;
  emit('camera-preference-change', isOpen);
};

const handleMicrophonePreferenceChange = (isOpen: boolean) => {
  microphonePreference.value = isOpen;
  emit('microphone-preference-change', isOpen);
};
</script>
