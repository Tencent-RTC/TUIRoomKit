<template>
  <div class="home-view">
    <component
      :is="preclassView"
      v-if="!showClass"
      class="home-preclass"
      @create="startClass"
      @join="enterFromLobby"
      @logout="logout"
    />
    <div v-show="showClass" ref="roomContainer" class="home-classroom" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LoginStatus, useDeviceState, useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomKit, RoomScene, t } from '@tencentcloud/roomkit-web-vue3';
import { resolvePreclass } from '../../features/Preclass';
import { generateRoomId } from '../../utils/generateRoomId';

const preclassView = resolvePreclass();

const user = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo') || '{}');
const credentials = { sdkAppId: user.SDKAppID, userId: user.userID, userSig: user.userSig };

const route = useRoute();
const router = useRouter();
const { login, logout: logoutUser, loginStatus, loginUserInfo } = useLoginState();
const { currentRoom, getRoomInfo } = useRoomState();
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
const offExited = roomKit.on('exited', async () => {
  await router.replace({ query: { ...route.query, roomId: undefined } });
  showClass.value = false;
});

async function ensureLogin() {
  if (loginStatus.value !== LoginStatus.LOGINED) {
    await login(credentials);
  }
}

async function startClass() {
  const devices = { camera: isCameraTesting.value, microphone: isMicrophoneTesting.value };
  showClass.value = true;
  // Room ID generation queries the engine, so it needs a logged-in user first.
  await ensureLogin();
  const roomId = await generateRoomId(candidate => getRoomInfo({ roomId: candidate }));
  if (!roomId) {
    showClass.value = false;
    return;
  }
  const name = loginUserInfo.value?.userName || credentials.userId;
  await roomKit.createAndJoin({
    roomId,
    roomName: t('Classroom.DefaultName', { name }),
    scene: RoomScene.Education,
    container: { appendTo: roomContainer.value! },
  });
  // A refresh then rejoins the class instead of creating another one.
  await router.replace({ query: { ...route.query, roomId } });
  await openPreviewDevices(devices);
}

async function joinClass(roomId: string) {
  const devices = { camera: isCameraTesting.value, microphone: isMicrophoneTesting.value };
  showClass.value = true;
  await roomKit.join({
    roomId,
    scene: RoomScene.Education,
    container: { appendTo: roomContainer.value! },
  });
  await router.replace({ query: { ...route.query, roomId } });
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
  await logoutUser().catch(() => {});
  router.replace('/login');
}

// A class link or a refresh inside a class leaves `roomId` in the URL; the lobby
// offers the way in (resume banner or prefilled class id) instead of entering here.
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
