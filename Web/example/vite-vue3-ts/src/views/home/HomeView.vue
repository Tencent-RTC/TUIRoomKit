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
const { getRoomInfo } = useRoomState();
const { isCameraTesting, isMicrophoneTesting } = useDeviceState();

const roomContainer = ref<HTMLElement>();
const showConference = ref(false);

const roomKit = RoomKit.getInstance(credentials);
const offExited = roomKit.on('exited', async () => {
  await router.replace({ query: { ...route.query, roomId: undefined } });
  showConference.value = false;
});

/** Carry the preconference preview into the room. */
function getMediaPreference() {
  return { preferCameraOn: isCameraTesting.value, preferMicrophoneOn: isMicrophoneTesting.value };
}

async function createMeeting() {
  const mediaPreference = getMediaPreference();
  showConference.value = true;

  const roomId = await generateRoomId(candidate => getRoomInfo({ roomId: candidate }));
  if (!roomId) {
    showConference.value = false;
    return;
  }
  // Cap the name so a long nickname can't push roomName past the create limit.
  const name = [...(loginUserInfo.value?.userName || credentials.userId)].slice(0, 10).join('');
  await roomKit.createAndJoin({
    roomId,
    roomName: t('Schedule.DefaultTopic', { name }),
    container: { appendTo: roomContainer.value! },
    mediaPreference,
  });
  await router.replace({ query: { ...route.query, roomId } });
}

async function joinMeeting(roomId: string, password?: string) {
  const mediaPreference = getMediaPreference();
  showConference.value = true;

  await roomKit.join({ roomId, password, container: { appendTo: roomContainer.value! }, mediaPreference });
  await router.replace({ query: { ...route.query, roomId } });
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
