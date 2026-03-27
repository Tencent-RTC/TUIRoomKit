<template>
  <PreviewView
    :ui-options="props.uiOptions"
    @logout="handleLogout"
    @create-room="handleCreateRoom"
    @join-room="handleJoinRoom"
    @camera-preference-change="handleCameraPreferenceChange"
    @microphone-preference-change="handleMicrophonePreferenceChange"
  />
</template>

<script setup lang="ts">
import { RoomType } from 'tuikit-atomicx-vue3/room';
import PreviewView from './PreviewView.vue';

interface Props {
  uiOptions?: {
    showHeader?: boolean;
    showLogo?: boolean;
  };
}

interface Emits {
  (e: 'logout'): void;
  (e: 'create-room', roomId: string, roomType: RoomType): void;
  (e: 'join-room', roomId: string, roomType: RoomType): void;
  (e: 'camera-preference-change', isOpen: boolean): void;
  (e: 'microphone-preference-change', isOpen: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  uiOptions: () => ({}),
});

const emit = defineEmits<Emits>();

const handleCreateRoom = (roomId: string, roomType: RoomType) => {
  emit('create-room', roomId, roomType);
};

const handleJoinRoom = (roomId: string, roomType: RoomType) => {
  emit('join-room', roomId, roomType);
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
