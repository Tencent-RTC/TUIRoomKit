<template>
  <div
    id="roomPage"
    ref="roomPageRef"
    class="room-page"
  >
    <div
      class="room-container"
      :class="{ 'has-side-panel': activeTab }"
    >
      <header v-show="showToolbar" class="header">
        <div class="header-left">
          <ThemeButton />
          <LayoutButton :layout="participantViewLayout" @update:layout="handleLayoutUpdate" />
          <LocalNetworkInfo />
        </div>
        <div class="header-center">
          <CurrentRoomInfo />
        </div>
        <div class="header-right">
          <LanguageButton />
          <LoginUserInfo :show-logout="false" />
        </div>
      </header>

      <main class="room-main">
        <TUIWatermark
          :font="{fontSize: 16}"
          :content="[loginUserInfo?.userName || '', loginUserInfo?.userId || '']"
        >
          <RoomLayoutView
            :layout-template="participantViewLayout"
            @update:layout-template="handleLayoutUpdate"
          />
        </TUIWatermark>
      </main>

      <footer v-show="showToolbar" class="control-bar">
        <div class="control-left">
          <MicButton />
          <CameraButton />
        </div>

        <div class="control-center">
          <ScreenShareButton />
          <CallButton />
          <ChatButton :is-chat-open="activeTab === RoomTabKey.Chat" @click="toggleSidePanel(RoomTabKey.Chat)" />
          <ParticipantButton @click="toggleSidePanel(RoomTabKey.ParticipantList)" />
          <MoreButton>
            <VirtualBackgroundButton />
            <BasicBeautyButton />
            <SettingButton />
          </MoreButton>
        </div>

        <div class="control-right">
          <LeaveRoomButton />
        </div>
      </footer>
      <LoadingOverlay v-if="isJoiningRoom" />
      <PasswordDialog
        v-model="roomPasswordVisible"
        :room-id="(route.query.roomId as string)"
        @cancel="handlePasswordCancel"
        @error="handleJoinRoomError"
      />
    </div>
    <RoomSidePanel
      class="side-panel"
      :class="{ 'side-panel-visible': activeTab }"
      :title="sidePanelTitle"
      @close="closePanel"
    >
      <RoomParticipantList v-if="activeTab === RoomTabKey.ParticipantList" />
      <RoomChat v-show="activeTab === RoomTabKey.Chat" />
    </RoomSidePanel>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  useUIKit,
  TUIWatermark,
  TUIToast,
  TUIMessageBox,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  RoomParticipantList,
  useLoginState,
  useRoomState,
  useDeviceState,
  RoomEvent,
  VideoQuality,
  RoomParticipantEvent,
  useRoomParticipantState,
  useRoomModal,
  RoomLayoutTemplate,
} from 'tuikit-atomicx-vue3/room';
import { useRoute, useRouter } from 'vue-router';
import {
  ThemeButton,
  LanguageButton,
  LayoutButton,
  LocalNetworkInfo,
  CurrentRoomInfo,
  LoginUserInfo,
  RoomLayoutView,
  ScreenShareButton,
  SettingButton,
  CameraButton,
  MicButton,
  MoreButton,
  ParticipantButton,
  CallButton,
  RoomChat,
  VirtualBackgroundButton,
  BasicBeautyButton,
  LoadingOverlay,
  PasswordDialog,
  LeaveRoomButton,
  ChatButton,
  RoomSidePanel,
} from '../components';
import useCustomizedAutoPlayDialog from '../hooks/useCustomizedAutoPlayDialog';
import { useRoomSidePanel, RoomTabKey } from '../hooks/useRoomSidePanel';
import { useRoomTips } from '../hooks/useRoomTips';
import { useRoomToolbar } from '../hooks/useRoomToolbar';
import type { KickedOutOfRoomReason } from 'tuikit-atomicx-vue3/room';

const route = useRoute();
const router = useRouter();
const { t } = useUIKit();
const { handleErrorWithModal } = useRoomModal();
const roomPageRef = ref<HTMLElement | null>(null);
const { showToolbar } = useRoomToolbar(roomPageRef);
const { activeTab, sidePanelTitle, toggleSidePanel, closePanel } = useRoomSidePanel();

useCustomizedAutoPlayDialog();
useRoomTips();

const { loginUserInfo } = useLoginState();
const { currentRoom, joinRoom, createAndJoinRoom, subscribeEvent: subscribeRoomEvent, unsubscribeEvent: unsubscribeRoomEvent } = useRoomState();
const { getParticipantList, participantListCursor, subscribeEvent: subscribeRoomParticipantEvent, unsubscribeEvent: unsubscribeRoomParticipantEvent } = useRoomParticipantState();
const { localVideoQuality, openLocalCamera, updateVideoQuality, openLocalMicrophone, muteLocalAudio, unmuteLocalAudio } = useDeviceState();

const roomPasswordVisible = ref(false);
const isJoiningRoom = ref(false);

const handleJoinRoomError = (error: any) => {
  let errorMessage = '';
  let useAlert = false;
  handleErrorWithModal(error);

  switch (error.code) {
    case TUIErrorCode.ERR_NEED_PASSWORD:
      roomPasswordVisible.value = true;
      return;
    case TUIErrorCode.ERR_WRONG_PASSWORD:
      TUIToast.error({ message: t('Room.InvalidPassword') });
      return;
    case TUIErrorCode.ERR_ROOM_ID_NOT_EXIST:
      errorMessage = t('Room.RoomNotFound');
      useAlert = true;
      break;
    case TUIErrorCode.ERR_ROOM_USER_FULL:
      errorMessage = t('Room.RoomFull');
      useAlert = true;
      break;
    case TUIErrorCode.ERR_ROOM_ID_OCCUPIED:
      errorMessage = t('Room.RoomOccupied');
      useAlert = true;
      break;
    default:
      errorMessage = t('Room.JoinRoomError');
      console.error('Join room error:', error);
      router.replace('/home');
  }

  if (!errorMessage) {
    return;
  }

  if (useAlert) {
    TUIMessageBox.alert({
      type: 'error',
      modal: false,
      showClose: false,
      title: t('Room.Alert'),
      content: errorMessage,
      onConfirm: () => router.replace('/home'),
    });
  } else {
    TUIToast.error({ message: errorMessage });
  }
};

const handlePasswordCancel = () => {
  router.replace('/home');
};

watch(() => loginUserInfo.value?.userId, async (val) => {
  isJoiningRoom.value = true;
  if (val) {
    const { roomId, password } = route.query as { roomId: string; password?: string };
    if (!roomId) {
      isJoiningRoom.value = true;
      router.replace('/home');
      return;
    }

    if (!currentRoom.value?.roomId) {
      try {
        const isCreateKey = `room-${roomId}-isCreate`;
        const isCreate = sessionStorage.getItem(isCreateKey) === 'true';

        if (isCreate) {
          sessionStorage.removeItem(isCreateKey);
        }

        if (isCreate) {
          await createAndJoinRoom({ roomId: roomId as string, options: { roomName: `${loginUserInfo.value?.userName}${t('Room.TemporaryMeeting')}` } });
        } else {
          await joinRoom({ roomId: roomId as string, password });
        }
      } catch (error) {
        isJoiningRoom.value = false;
        handleJoinRoomError(error);
        return;
      }
    }
    isJoiningRoom.value = false;
    handleOpenCamera();
    handleOpenMicrophone();
    handleInitParticipantList();
  }
}, { immediate: true });

async function handleOpenCamera() {
  const { openCamera } = route.query;
  if (!localVideoQuality.value) {
    updateVideoQuality({ quality: VideoQuality.Quality720P });
  }
  if (openCamera === 'true') {
    try {
      await openLocalCamera();
    } catch (error) {
      handleErrorWithModal(error);
    }
  }
}

async function handleOpenMicrophone() {
  const { openMicrophone } = route.query;
  try {
    await muteLocalAudio();
    await openLocalMicrophone();
  } catch (error) {
    handleErrorWithModal(error);
  }
  if (openMicrophone === 'true') {
    await unmuteLocalAudio();
  }
}

async function handleInitParticipantList() {
  await getParticipantList({ cursor: participantListCursor.value });
}

const participantViewLayout = ref(RoomLayoutTemplate.GridLayout);
function handleLayoutUpdate(layout: RoomLayoutTemplate) {
  participantViewLayout.value = layout;
}

const onRoomEnded = () => {
  router.replace('/home');
};

const onKickedFromRoom = (_eventInfo: { reason: KickedOutOfRoomReason; message: string }) => {
  router.replace('/home');
};

onMounted(() => {
  subscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
  subscribeRoomParticipantEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom);
});

onUnmounted(() => {
  unsubscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
  unsubscribeRoomParticipantEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom);
});

</script>

<style lang="scss" scoped>

.room-page {
  width: 100vw;
  height: 100vh;
  min-width: 1150px;
  display: flex;
  flex-direction: row;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  overflow: hidden;
}

.room-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.has-side-panel {
    width: calc(100% - 400px);
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 56px;
  box-sizing: border-box;
  background-color: var(--bg-color-operate);
  border-bottom: 1px solid var(--stroke-color-primary);
  box-shadow: 0 1px 0 var(--uikit-color-black-8);

  &-left {
    display: flex;
    gap: 24px;
    flex: 1;
    justify-content: flex-start;
  }

  &-center {
    flex: 1;
    text-align: center;
    height: 100%;
  }

  &-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    justify-content: flex-end;
  }
}

.room-main {
  min-height: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  background-color: var(--bg-color-topbar);
}

.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-color-operate);
  border-top: 1px solid var(--stroke-color-primary);
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 72px;
  bottom: 0;
  left: 0;
  z-index: 1;
  padding: 0px 10px;

  .control-left {
    flex: 1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
  }

  .control-center {
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: center;
    color: var(--text-color-primary);
  }

  .control-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}

.side-panel {
  position: absolute;
  top: 0;
  right: 0;
  transform: translateX(100%);
  width: 400px;
  height: 100%;
  box-sizing: border-box;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &-visible {
    transform: translateX(0);
  }
}
</style>
