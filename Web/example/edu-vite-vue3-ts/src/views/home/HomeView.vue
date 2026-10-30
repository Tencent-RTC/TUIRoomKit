<template>
  <div class="home-view">
    <Preclass
      v-if="!showClass"
      class="home-preclass"
      :role="role"
      @create="startClass"
      @join="joinClass"
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
import { Preclass } from '../../features/Preclass';
import type { ClassRole } from '../../features/Preclass';
import { generateRoomId } from '../../utils/generateRoomId';

defineProps<{
  role: ClassRole;
}>();

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

onMounted(async () => {
  // The lobby preview and the course list both need a logged-in engine.
  await ensureLogin();
  // A class link or a refresh inside a class carries the room id, so go straight in.
  const roomId = route.query.roomId as string | undefined;
  if (roomId) {
    // RoomKit already alerts and emits `exited`; this only keeps the rejection handled.
    joinClass(roomId).catch(error => console.error('[Home] Failed to enter the class:', error));
  }
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
