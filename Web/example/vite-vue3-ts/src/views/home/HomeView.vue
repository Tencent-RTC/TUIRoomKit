<template>
  <RoomKitProvider
    class="home-host"
    scene="conference"
  >
    <div class="home-view">
      <Preconference
        v-if="!showConference"
        class="home-preconference"
        @create="createMeeting"
        @join="joinMeeting"
        @logout="logout"
      />
      <div v-show="showConference" ref="roomContainer" class="home-conference" />
      <RoomInvitation @accept="params => joinMeeting(params.roomId, params.password)" />
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LoginStatus, useDeviceState, useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomKit, RoomKitProvider, t } from '@tencentcloud/roomkit-web-vue3';
import { Preconference } from '../../features/Preconference';
import { RoomInvitation } from '../../features/Invitation';
import { generateRoomId } from '../../utils/generateRoomId';

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
const showConference = ref(false);

const roomKit = RoomKit.getInstance(credentials);
const offExited = roomKit.on('exited', async () => {
  await router.replace({ query: { ...route.query, roomId: undefined } });
  showConference.value = false;
});

async function createMeeting() {
  const devices = { camera: isCameraTesting.value, microphone: isMicrophoneTesting.value };
  showConference.value = true;

  const roomId = await generateRoomId(candidate => getRoomInfo({ roomId: candidate }));
  if (!roomId) {
    showConference.value = false;
    return;
  }
  const name = loginUserInfo.value?.userName || credentials.userId;
  await roomKit.createAndJoin({
    roomId,
    roomName: t('Schedule.DefaultTopic', { name }),
    container: { appendTo: roomContainer.value! },
  });
  await router.replace({ query: { ...route.query, roomId } });
  await openPreviewDevices(devices);
}

async function joinMeeting(roomId: string, password?: string) {
  const devices = { camera: isCameraTesting.value, microphone: isMicrophoneTesting.value };
  showConference.value = true;

  await roomKit.join({ roomId, password, container: { appendTo: roomContainer.value! } });
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
  if (loginStatus.value !== LoginStatus.LOGINED) {
    await login(credentials);
  }
});

onBeforeUnmount(() => {
  offExited();
  RoomKit.destroyInstance();
});
</script>

<style lang="scss" scoped>
.home-host,
.home-host :deep(.rk-root-slot),
.home-view,
.home-preconference,
.home-conference {
  width: 100%;
  height: 100%;
}

.home-view {
  background-color: var(--bg-color-topbar);
}
</style>
