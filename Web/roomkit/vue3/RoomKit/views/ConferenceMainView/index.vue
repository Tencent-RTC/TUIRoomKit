<template>
  <div
    id="roomPage"
    ref="roomPageRef"
    v-tui-loading="{
      visible: isJoiningRoom,
      text: t('Room.EnteringRoom'),
      background: 'var(--bg-color-topbar)',
    }"
    class="room-page"
  >
    <div class="room-container" :class="{ 'has-side-panel': activeTab }">
      <header v-show="showToolbar" class="header">
        <div class="header-left">
          <ThemeButton />
          <LayoutButton
            v-if="!isWebinar"
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
        <div v-if="isWebinar" class="control-left">
          <MicButton v-if="isGuest || isOwner" />
          <CameraButton v-if="isOwner" />
          <RaiseHandsButton v-if="isAudience" />
        </div>
        <div v-else class="control-left">
          <MicButton />
          <CameraButton />
        </div>

        <div class="control-center">
          <ScreenShareButton v-if="!isWebinar || isOwner" />
          <CallButton v-if="!isWebinar" />
          <BarrageButton
            v-if="isWebinar"
            :is-chat-open="activeTab === RoomTabKey.Barrage"
            @click="toggleSidePanel(RoomTabKey.Barrage)"
          />
          <RaiseHandsList v-if="isWebinar && isOwner" />
          <ChatButton
            v-if="!isWebinar"
            :is-chat-open="activeTab === RoomTabKey.Chat"
            @click="toggleSidePanel(RoomTabKey.Chat)"
          />
          <ParticipantButton
            @click="toggleSidePanel(RoomTabKey.ParticipantList)"
          />
          <MoreButton v-if="!isWebinar || isOwner">
            <VirtualBackgroundButton v-if="!isWebinar" />
            <BasicBeautyButton v-if="!isWebinar || isOwner" />
            <AIToolsButton v-if="!isWebinar && AIToolsButtonConfig?.visible" />
            <SettingButton v-if="!isWebinar || isOwner" />
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
      <RoomChat
        v-show="activeTab === RoomTabKey.Chat"
        v-if="!isWebinar"
        :is-chat-open="activeTab === RoomTabKey.Chat"
      />
      <RoomBarrage v-show="isWebinar && activeTab === RoomTabKey.Barrage" :is-chat-open="activeTab === RoomTabKey.Barrage" />
      <RealtimeMessageList
        v-if="activeTab === RoomTabKey.AIToolsRealtimeMessageList"
      />
    </RoomSidePanel>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import type { Ref } from 'vue';
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
  RoomType,
  RoomParticipantRole,
  useAITranscriberState,
} from 'tuikit-atomicx-vue3/room';
import { conference } from '../../adapter/conference';
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
  BarrageButton,
  RaiseHandsButton,
  RaiseHandsList,
  AIToolsButton,
} from '../../components';
import RoomBarrage from '../../components/RoomBarrage/RoomBarrage.vue';
import useCustomizedAutoPlayDialog from '../../hooks/useCustomizedAutoPlayDialog';
import useRoomLifeCycle from '../../hooks/useRoomLifeCycle';
import { useRoomSidePanel, RoomTabKey } from '../../hooks/useRoomSidePanel';
import { useRoomTips } from '../../hooks/useRoomTips';
import { useRoomToolbar } from '../../hooks/useRoomToolbar';
import { eventCenter } from '../../utils/eventCenter';

const AIToolsButtonConfig = conference.getComponentConfig(ComponentName.AIToolsButton);

const { t } = useUIKit();
const roomPageRef = ref<HTMLElement | null>(null);
const { showToolbar } = useRoomToolbar(roomPageRef);
const { activeTab, sidePanelTitle, toggleSidePanel, closePanel } = useRoomSidePanel();

useCustomizedAutoPlayDialog();
useRoomTips();

const { loginUserInfo } = useLoginState();
const {
  currentRoom,
  subscribeEvent: subscribeRoomEvent,
  unsubscribeEvent: unsubscribeRoomEvent,
} = useRoomState();
const {
  localParticipant,
  participantList,
  audienceListCursor,
  participantListCursor,
  getParticipantList,
  getAudienceList,
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

const isWebinar = computed(() => currentRoom.value?.roomType === RoomType.Webinar);
const isOwner = computed(() => localParticipant.value?.role === RoomParticipantRole.Owner);
const isGuest = computed(() => participantList.value.some(participant => participant.userId === localParticipant.value?.userId));
const isAudience = computed(() => !participantList.value.some(participant => participant.userId === localParticipant.value?.userId));
const participantViewLayout: Ref<RoomLayoutTemplate | undefined> = ref(undefined);
function handleLayoutUpdate(layout: RoomLayoutTemplate) {
  participantViewLayout.value = layout;
}

watch(() => currentRoom.value?.roomType, (newRoomType) => {
  if (newRoomType === RoomType.Webinar) {
    participantViewLayout.value = undefined;
  } else {
    participantViewLayout.value = RoomLayoutTemplate.GridLayout;
  }
}, { immediate: true });

watch(
  () => currentRoom.value?.roomId,
  async (roomId, oldRoomId) => {
    if (!oldRoomId && roomId) {
      await getParticipantList({ cursor: participantListCursor.value });
      await getAudienceList({ cursor: audienceListCursor.value });
      if (isOwner.value && AIToolsButtonConfig?.visible) {
        await startRealtimeTranscriber({
          sourceLanguage: 'zh',
          translationLanguages: ['en'],
        });
      }
    }
  },
  { immediate: true },
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
  eventCenter.emit(ConferenceRoomEvent.KICKED_OUT, eventInfo);
};

onMounted(() => {
  subscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
  subscribeRoomParticipantEvent(
    RoomParticipantEvent.onKickedFromRoom,
    onKickedFromRoom,
  );
});

onUnmounted(() => {
  unsubscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
  unsubscribeRoomParticipantEvent(
    RoomParticipantEvent.onKickedFromRoom,
    onKickedFromRoom,
  );
  closePanel();
});
</script>

<style lang="scss" scoped>
.room-page {
  position: relative;
  display: flex;
  flex-direction: row;
  width: 100vw;
  min-width: 1150px;
  height: 100vh;
  overflow: hidden;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.room-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.has-side-panel {
    width: calc(100% - 400px);
  }
}

.header {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 56px;
  padding: 16px 20px;
  background-color: var(--bg-color-operate);
  border-bottom: 1px solid var(--stroke-color-primary);
  box-shadow: 0 1px 0 var(--uikit-color-black-8);

  &-left {
    display: flex;
    flex: 1;
    gap: 24px;
    justify-content: flex-start;
  }

  &-center {
    flex: 1;
    height: 100%;
    text-align: center;
  }

  &-right {
    display: flex;
    flex: 1;
    gap: 16px;
    align-items: center;
    justify-content: flex-end;
  }
}

.room-main {
  position: absolute;
  right: 0;
  left: 0;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  background-color: var(--bg-color-topbar);
}

.control-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 72px;
  padding: 0 10px;
  background: var(--bg-color-operate);
  border-top: 1px solid var(--stroke-color-primary);

  .control-left {
    display: flex;
    flex: 1;
    gap: 16px;
    align-items: center;
    justify-content: flex-start;
  }

  .control-center {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: center;
    color: var(--text-color-primary);
  }

  .control-right {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: flex-end;
  }
}

.side-panel {
  position: absolute;
  top: 0;
  right: 0;
  box-sizing: border-box;
  width: 400px;
  height: 100%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(100%);

  &-visible {
    transform: translateX(0);
  }
}
</style>
