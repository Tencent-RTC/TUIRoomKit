<template>
  <div id="roomPage" ref="roomPageRef" class="room-page">
    <div class="room-container" :class="{ 'has-side-panel': activeTab }">
      <header v-show="showToolbar" class="header">
        <div class="header-left">
          <ThemeButton />
          <LayoutButton
            :layout="participantViewLayout"
            @update:layout="handleLayoutUpdate"
          />
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

      <main
        v-tui-loading="{
          visible: isJoiningRoom,
          text: t('Room.EnteringRoom'),
          background: 'transparent',
        }"
        class="room-main"
      >
        <TUIWatermark
          :font="{ fontSize: 16 }"
          :content="[
            loginUserInfo?.userName || '',
            loginUserInfo?.userId || '',
          ]"
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
          <ChatButton
            :is-chat-open="activeTab === RoomTabKey.Chat"
            @click="toggleSidePanel(RoomTabKey.Chat)"
          />
          <ParticipantButton
            @click="toggleSidePanel(RoomTabKey.ParticipantList)"
          />
          <MoreButton>
            <VirtualBackgroundButton />
            <BasicBeautyButton />
            <AIToolsButton v-if="AIToolsButtonConfig?.visible" />
            <SettingButton />
          </MoreButton>
        </div>

        <div class="control-right">
          <LeaveRoomButton @leave="handleLeaveRoom" @end="handleEndRoom" />
        </div>
      </footer>
      <PasswordDialog
        v-model="roomPasswordVisible"
        :room-id="joiningRoomId"
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
      <RoomChat v-if="activeTab === RoomTabKey.Chat" />
      <RealtimeMessageList
        v-if="activeTab === RoomTabKey.AIToolsRealtimeMessageList"
      />
    </RoomSidePanel>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import {
  useUIKit,
  TUIWatermark,
  vTuiLoading,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  RoomParticipantList,
  useLoginState,
  useRoomState,
  useRoomParticipantState,
  RoomLayoutTemplate,
  RealtimeMessageList,
  RoomEvent,
  RoomParticipantEvent,
  KickedOutOfRoomReason,
  useAITranscriberState,
} from 'tuikit-atomicx-vue3/room';
import { ComponentName, RoomEvent as ConferenceRoomEvent } from '../../adapter/type';
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
  PasswordDialog,
  LeaveRoomButton,
  ChatButton,
  RoomSidePanel,
  AIToolsButton,
} from '../../components';
import useCustomizedAutoPlayDialog from '../../hooks/useCustomizedAutoPlayDialog';
import { useRoomSidePanel, RoomTabKey } from '../../hooks/useRoomSidePanel';
import { useRoomTips } from '../../hooks/useRoomTips';
import { useRoomToolbar } from '../../hooks/useRoomToolbar';
import useRoomLifeCycle from '../../hooks/useRoomLifeCycle';
import { eventCenter } from '../../utils/eventCenter';
import { conference } from '../../adapter/conference';

const AIToolsButtonConfig = conference.getComponentConfig(ComponentName.AIToolsButton);

const { t } = useUIKit();
const roomPageRef = ref<HTMLElement | null>(null);
const { showToolbar } = useRoomToolbar(roomPageRef);
const { activeTab, sidePanelTitle, toggleSidePanel, closePanel } =
  useRoomSidePanel();

useCustomizedAutoPlayDialog();
useRoomTips();

const { loginUserInfo } = useLoginState();
const {
  currentRoom,
  subscribeEvent: subscribeRoomEvent,
  unsubscribeEvent: unsubscribeRoomEvent,
} = useRoomState();
const {
  getParticipantList,
  participantListCursor,
  subscribeEvent: subscribeRoomParticipantEvent,
  unsubscribeEvent: unsubscribeRoomParticipantEvent,
} = useRoomParticipantState();
const { startRealtimeTranscriber } = useAITranscriberState();

const {
  isJoiningRoom,
  joiningRoomId,
  roomPasswordVisible,
  handleJoinRoomError,
} = useRoomLifeCycle();

const isOwner = computed(() => currentRoom.value?.roomOwner.userId === loginUserInfo.value?.userId);
const participantViewLayout = ref(RoomLayoutTemplate.GridLayout);
function handleLayoutUpdate(layout: RoomLayoutTemplate) {
  participantViewLayout.value = layout;
}

watch(
  () => currentRoom.value?.roomId,
  async (roomId, oldRoomId) => {
    if (!oldRoomId && roomId) {
      await getParticipantList({ cursor: participantListCursor.value });
      if(isOwner.value && AIToolsButtonConfig?.visible) {
        await startRealtimeTranscriber({
          sourceLanguage: 'zh',
          translationLanguages: ['en'],
        });
      }
    }
  },
  { immediate: true }
);

const handlePasswordCancel = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_ERROR);
};
const handleLeaveRoom = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_LEAVE);
};
const handleEndRoom = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_DISMISS);
};
const onRoomEnded = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_DISMISS, {});
};

const onKickedFromRoom = (eventInfo: {
  reason: KickedOutOfRoomReason;
  message: string;
}) => {
  eventCenter.emit(ConferenceRoomEvent.KICKED_OUT, {});
};

onMounted(() => {
  subscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
  subscribeRoomParticipantEvent(
    RoomParticipantEvent.onKickedFromRoom,
    onKickedFromRoom
  );
});

onUnmounted(() => {
  unsubscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
  unsubscribeRoomParticipantEvent(
    RoomParticipantEvent.onKickedFromRoom,
    onKickedFromRoom
  );
});
</script>

<style lang="scss" scoped>
.room-page {
  width: 100vw;
  height: 100vh;
  min-width: 1150px;
  display: flex;
  flex-direction: row;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
