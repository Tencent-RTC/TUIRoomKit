<template>
  <div class="home-view">
    <component
      :is="preclassView"
      v-if="!showClass"
      class="home-preclass"
      @join="enterFromLobby"
      @logout="logout"
    />
    <div v-show="showClass" ref="roomContainer" class="home-classroom" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { LoginStatus, useDeviceState, useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomKit, RoomScene } from '@tencentcloud/roomkit-web-vue3';
import { resolvePreclass } from '../../features/Preclass';
import { forgetResumeRoom, rememberResumeRoom } from '../../features/Preclass/useResumeRoom';

const preclassView = resolvePreclass();

const user = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo') || '{}');
const credentials = { sdkAppId: user.SDKAppID, userId: user.userID, userSig: user.userSig };

const router = useRouter();
const { login, logout: logoutUser, loginStatus } = useLoginState();
const { currentRoom } = useRoomState();
const {
  isCameraTesting,
  isMicrophoneTesting,
  openLocalCamera,
  openLocalMicrophone,
  unmuteLocalAudio,
} = useDeviceState();

const roomContainer = ref<HTMLElement>();
const showClass = ref(false);

const roomKit = RoomKit.getInstance(credentials);
// Every exit RoomKit reports is a deliberate end, so only a refresh keeps the record.
const offExited = roomKit.on('exited', () => {
  forgetResumeRoom();
  showClass.value = false;
});

async function ensureLogin() {
  if (loginStatus.value !== LoginStatus.LOGINED) {
    await login(credentials);
  }
}

async function joinClass(roomId: string) {
  const devices = { camera: isCameraTesting.value, microphone: isMicrophoneTesting.value };
  showClass.value = true;
  await roomKit.join({
    roomId,
    scene: RoomScene.Education,
    container: { appendTo: roomContainer.value! },
  });
  rememberResumeRoom(roomId);
  await openPreviewDevices(devices);
}

function enterFromLobby(roomId: string) {
  // RoomKit already alerts (password, missing class) and emits `exited`; this only keeps the rejection handled.
  joinClass(roomId).catch(error => console.error('[Home] Failed to enter the class:', error));
}

async function openPreviewDevices(devices: { camera: boolean; microphone: boolean }) {
  if (!currentRoom.value) {
    return;
  }
  if (devices.camera) {
    await openLocalCamera().catch(error => console.error('Failed to open camera:', error));
  }
  if (devices.microphone) {
    await openLocalMicrophone()
      .then(() => unmuteLocalAudio())
      .catch(error => console.error('Failed to open microphone:', error));
  }
}

async function logout() {
  sessionStorage.removeItem('tuiRoom-userInfo');
  forgetResumeRoom();
  await logoutUser().catch(() => {});
  router.replace('/login');
}

// A refresh inside a class lands in the lobby, which offers the resume banner instead of entering here.
onMounted(async () => {
  // The lobby preview and the course list both need a logged-in engine.
  await ensureLogin();
});

onBeforeUnmount(() => {
  offExited();
  RoomKit.destroyInstance();
});
</script>

<style lang="scss" scoped>
.home-view,
.home-preclass,
.home-classroom {
  width: 100%;
  height: 100%;
}
</style>
