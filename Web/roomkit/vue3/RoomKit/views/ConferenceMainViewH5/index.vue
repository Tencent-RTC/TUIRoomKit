<template>
  <div id="roomPage" class="room-page">
    <div class="room-container">
      <header v-show="showToolbar" class="header">
        <div class="header-left">
          <CustomWidgetRenderer zone="top-left" platform="h5">
            <SwitchCameraRegistrarH5 v-if="conference.getWidgetVisible(BuiltinWidget.SwitchCameraWidget)" />
          </CustomWidgetRenderer>
        </div>
        <div class="header-center">
          <CustomWidgetRenderer zone="top-center" platform="h5">
            <CurrentRoomInfoRegistrarH5 v-if="conference.getWidgetVisible(BuiltinWidget.CurrentRoomInfoWidget)" />
          </CustomWidgetRenderer>
        </div>
        <div class="header-right">
          <CustomWidgetRenderer zone="top-right" platform="h5">
            <LeaveRoomRegistrarH5
              v-if="conference.getWidgetVisible(BuiltinWidget.LeaveRoomWidget)"
              @leave="handleLeaveRoom"
              @end="handleEndRoom"
            />
          </CustomWidgetRenderer>
        </div>
      </header>

      <main
        v-tui-loading="{
          visible: isJoiningRoom,
          text: t('Room.EnteringRoom'),
          background: 'transparent',
        }"
        class="room-main"
        @click="toggleToolbar"
      >
        <TUIWatermark
          v-if="watermarkEnabled"
          :font="watermarkFont"
          :content="watermarkContent"
          :gap="watermarkGap"
        >
          <RoomLayoutViewH5 />
        </TUIWatermark>
        <RoomLayoutViewH5 v-else />
      </main>

      <footer v-show="showToolbar" class="room-footer">
        <ExpandFooterH5>
          <CustomWidgetRenderer zone="bottom-center" platform="h5">
            <MemberRegistrarH5 v-if="conference.getWidgetVisible(BuiltinWidget.MemberWidget)" />
            <MicRegistrarH5 v-if="conference.getWidgetVisible(BuiltinWidget.MicWidget)" />
            <CameraRegistrarH5 v-if="conference.getWidgetVisible(BuiltinWidget.CameraWidget)" />
            <InviteRegistrarH5 v-if="conference.getWidgetVisible(BuiltinWidget.InviteWidget) && notWebinar()" />
            <ChatRegistrarH5 v-if="conference.getWidgetVisible(BuiltinWidget.RoomChatWidget) && notWebinar()" />
            <AIToolsRegistrarH5 v-if="(conference.getWidgetVisible(BuiltinWidget.AIToolsWidget) || !!AIToolsButtonConfig?.visible) && notWebinar() && aiToolsEnabled" />
            <SettingsRegistrarH5 v-if="conference.getWidgetVisible(BuiltinWidget.SettingsWidget) && ownerOrNotWebinar()" />
          </CustomWidgetRenderer>
        </ExpandFooterH5>
      </footer>
      <PasswordDialogH5
        v-model="roomPasswordVisible"
        :room-id="joiningRoomId"
        @cancel="handlePasswordCancel"
        @error="handleJoinRoomError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted, computed } from 'vue';
import {
  useUIKit,
  TUIWatermark,
  vTuiLoading,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  useLoginState,
  useRoomState,
  useRoomParticipantState,
  useAITranscriberState,
  RoomEvent,
  RoomParticipantEvent,
  KickedOutOfRoomReason,
  RoomParticipantRole,
  RoomType,
} from 'tuikit-atomicx-vue3/room';
import { conference } from '../../adapter/conference';
import { RoomEvent as ConferenceRoomEvent, BuiltinWidget, ComponentName } from '../../adapter/type';
import {
  PasswordDialogH5,
  RoomLayoutViewH5,
  ExpandFooterH5,
  CustomWidgetRenderer,
  // Registrar components (H5)
  SwitchCameraRegistrarH5,
  CurrentRoomInfoRegistrarH5,
  LeaveRoomRegistrarH5,
  MemberRegistrarH5,
  MicRegistrarH5,
  CameraRegistrarH5,
  InviteRegistrarH5,
  ChatRegistrarH5,
  SettingsRegistrarH5,
  AIToolsRegistrarH5,
} from '../../components';
import useCustomizedAutoPlayDialog from '../../hooks/useCustomizedAutoPlayDialog';
import useRoomLifeCycle from '../../hooks/useRoomLifeCycle';

import { useRoomTips } from '../../hooks/useRoomTips';
import { useRoomToolbarH5 } from '../../hooks/useRoomToolbarH5';
import { eventCenter } from '../../utils/eventCenter';

const { t } = useUIKit();
const AIToolsButtonConfig = conference.getComponentConfig(ComponentName.AIToolsButton);
const aiToolsEnabled = computed(() => conference.getFeatureConfig('aiTools')?.enable !== false);
const { showToolbar, toggleToolbar } = useRoomToolbarH5();

useCustomizedAutoPlayDialog();
useRoomTips();

const { loginUserInfo } = useLoginState();
const { currentRoom } = useRoomState();

const watermarkConfig = computed(() => conference.getFeatureConfig('watermark'));
const watermarkEnabled = computed(() => watermarkConfig.value?.enable !== false);
const watermarkContent = computed(() =>
  watermarkConfig.value?.content ?? [
    loginUserInfo.value?.userName || '',
    loginUserInfo.value?.userId || '',
  ],
);
const watermarkFont = computed(() => watermarkConfig.value?.font ?? { fontSize: 16 });
const watermarkGap = computed<[number, number]>(() => watermarkConfig.value?.gap ?? [0, 100]);
const isWebinar = computed(() => currentRoom.value?.roomType === RoomType.Webinar);

const {
  getParticipantList,
  participantListCursor,
  localParticipant,
  subscribeEvent: subscribeRoomParticipantEvent,
  unsubscribeEvent: unsubscribeRoomParticipantEvent,
} = useRoomParticipantState();
const isOwner = computed(() => localParticipant.value?.role === RoomParticipantRole.Owner);
const notWebinar = () => !isWebinar.value;
const ownerOrNotWebinar = () => !isWebinar.value || isOwner.value;
const {
  subscribeEvent: subscribeRoomEvent,
  unsubscribeEvent: unsubscribeRoomEvent,
} = useRoomState();
const { startRealtimeTranscriber } = useAITranscriberState();

const {
  isJoiningRoom,
  joiningRoomId,
  roomPasswordVisible,
  handleJoinRoomError,
} = useRoomLifeCycle();

const handlePasswordCancel = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_ERROR);
};
const handleLeaveRoom = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_LEAVE);
};
const handleEndRoom = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_DISMISS);
};

watch(
  () => currentRoom.value?.roomId,
  async (roomId, oldRoomId) => {
    if (!oldRoomId && roomId) {
      await getParticipantList({ cursor: participantListCursor.value });
      if ((AIToolsButtonConfig?.visible || aiToolsEnabled.value) && isOwner.value && !isWebinar.value) {
        await startRealtimeTranscriber({
          sourceLanguage: 'zh',
          translationLanguages: ['en'],
        });
      }
    }
  },
  { immediate: true },
);

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
    onKickedFromRoom,
  );
});

onUnmounted(() => {
  unsubscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
  unsubscribeRoomParticipantEvent(
    RoomParticipantEvent.onKickedFromRoom,
    onKickedFromRoom,
  );
});
</script>

<style lang="scss" scoped>
.room-page {
  width: 100vw;
  height: 100%;
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
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  height: 56px;
  box-sizing: border-box;
  transition: opacity 0.3s;
  background-color: var(--bg-color-bottombar);
  border-bottom: 1px solid var(--stroke-color-secondary);

  &-left {
    flex: 1;
    display: flex;
    gap: 12px;
    justify-content: flex-start;
  }

  &-center {
    flex: 2;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: auto;
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

.room-footer {
  position: absolute;
  box-sizing: border-box;
  background-color: var(--bg-color-operate);
  width: 100%;
  height: 90px;
  bottom: 0;
  left: 0;
}
</style>
