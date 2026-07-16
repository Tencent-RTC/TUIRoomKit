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
    <div class="room-container" :class="{ 'has-side-panel': activeWidgetId }">
      <header :class="['header', { 'toolbar-hidden': !showToolbar } ]">
        <div class="header-left">
          <CustomWidgetRenderer zone="top-left" platform="pc">
            <ThemeRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.ThemeWidget)" />
            <LayoutRegistrar
              v-if="conference.getWidgetVisible(BuiltinWidget.LayoutWidget) && notWebinar"
              :layout="participantViewLayout"
              @update:layout="handleLayoutUpdate"
            />
            <LocalNetworkInfoRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.LocalNetworkInfoWidget)" />
          </CustomWidgetRenderer>
        </div>
        <div class="header-center">
          <CustomWidgetRenderer zone="top-center" platform="pc">
            <CurrentRoomInfoRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.CurrentRoomInfoWidget)" />
          </CustomWidgetRenderer>
        </div>
        <div class="header-right">
          <CustomWidgetRenderer zone="top-right" platform="pc">
            <LanguageRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.LanguageWidget)" />
            <LoginUserInfoRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.LoginUserInfoWidget)" />
          </CustomWidgetRenderer>
        </div>
      </header>

      <main class="room-main">
        <div
          v-if="conference.getWidgetVisible(BuiltinWidget.RecordingWidget)"
          class="recording-status-anchor"
          :class="{ 'toolbar-visible': showToolbar }"
        >
          <CloudRecordingStatus />
        </div>
        <TUIWatermark
          v-if="watermarkEnabled"
          :font="watermarkFont"
          :content="watermarkContent"
        >
          <RoomLayoutView
            :layout-template="participantViewLayout"
            @update:layout-template="handleLayoutUpdate"
          >
            <template v-if="$slots['participantViewUI']" #participantViewUI="slotProps">
              <slot name="participantViewUI" v-bind="slotProps" />
            </template>
          </RoomLayoutView>
        </TUIWatermark>
        <RoomLayoutView
          v-else
          :layout-template="participantViewLayout"
          @update:layout-template="handleLayoutUpdate"
        >
          <template v-if="$slots['participantViewUI']" #participantViewUI="slotProps">
            <slot name="participantViewUI" v-bind="slotProps" />
          </template>
        </RoomLayoutView>
      </main>

      <footer :class="['control-bar', { 'toolbar-hidden': !showToolbar } ]">
        <div class="control-left">
          <CustomWidgetRenderer zone="bottom-left" platform="pc">
            <MicRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.MicWidget) && (!isWebinar || isParticipant || isOwner)" />
            <CameraRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.CameraWidget) && ownerOrNotWebinar" />
            <RaiseHandsRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.RaiseHandsWidget) && isWebinar && (isAudience && isGeneralUser)" />
          </CustomWidgetRenderer>
        </div>

        <div class="control-center">
          <CustomWidgetRenderer zone="bottom-center" platform="pc">
            <ScreenShareRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.ScreenShareWidget) && ownerOrNotWebinar" />
            <CloudRecordingRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.RecordingWidget) && !isWebinar && (isOwner || isAdmin)" />
            <RaiseHandsListRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.RaiseHandsListWidget) && isWebinar && (isOwner || isAdmin)" />
            <InviteRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.InviteWidget) && notWebinar" />
            <ChatRegistrar
              v-if="conference.getWidgetVisible(BuiltinWidget.RoomChatWidget) && notWebinar"
            />
            <MemberRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.MemberWidget)" />
            <VirtualBackgroundRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.VirtualBackgroundWidget) && notWebinar" />
            <BasicBeautyRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.BasicBeautyWidget) && ownerOrNotWebinar" />
            <AIToolsRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.AIToolsWidget) && notWebinar" />
            <SettingsRegistrar v-if="conference.getWidgetVisible(BuiltinWidget.SettingsWidget) && ownerOrNotWebinar" />
            <BarrageRegistrar
              v-if="conference.getWidgetVisible(BuiltinWidget.BarrageWidget) && isWebinar"
            />
          </CustomWidgetRenderer>
        </div>

        <div class="control-right">
          <CustomWidgetRenderer zone="bottom-right" platform="pc">
            <LeaveRoomRegistrar
              v-if="conference.getWidgetVisible(BuiltinWidget.LeaveRoomWidget)"
              @leave="handleLeaveRoom"
              @end="handleEndRoom"
            />
          </CustomWidgetRenderer>
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
      :class="{ 'side-panel-visible': activeWidgetId }"
      :title="sidePanelTitle"
      @close="closePanel"
    >
      <!-- Render all registered panels: keepAlive ones use v-show, others use v-if -->
      <template v-for="widget in panelWidgets" :key="widget.id">
        <component
          :is="widget.panel!.component"
          v-if="widget.panel?.keepAlive || activeWidgetId === widget.id"
          v-show="!widget.panel?.keepAlive || activeWidgetId === widget.id"
          v-bind="getPanelProps(widget)"
        />
      </template>
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
  useLoginState,
  useRoomState,
  useRoomParticipantState,
  RoomLayoutTemplate,
  RoomEvent,
  RoomParticipantEvent,
  KickedOutOfRoomReason,
  RoomType,
  RoomParticipantRole,
} from 'tuikit-atomicx-vue3/room';
import { conference } from '../../adapter/conference';
import { RoomEvent as ConferenceRoomEvent, BuiltinWidget } from '../../adapter/type';
import {
  RoomLayoutView,
  PasswordDialog,
  RoomSidePanel,
  CustomWidgetRenderer,
  // Registrar components (PC)
  CloudRecordingRegistrar,
  CloudRecordingStatus,
  ThemeRegistrar,
  LayoutRegistrar,
  LocalNetworkInfoRegistrar,
  CurrentRoomInfoRegistrar,
  LanguageRegistrar,
  LoginUserInfoRegistrar,
  MicRegistrar,
  CameraRegistrar,
  ScreenShareRegistrar,
  InviteRegistrar,
  ChatRegistrar,
  MemberRegistrar,
  VirtualBackgroundRegistrar,
  BasicBeautyRegistrar,
  AIToolsRegistrar,
  SettingsRegistrar,
  LeaveRoomRegistrar,
  BarrageRegistrar,
  RaiseHandsRegistrar,
  RaiseHandsListRegistrar,
} from '../../components';
import useCustomizedAutoPlayDialog from '../../hooks/useCustomizedAutoPlayDialog';
import useRoomLifeCycle from '../../hooks/useRoomLifeCycle';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import { useRoomTips } from '../../hooks/useRoomTips';
import { useRoomToolbar } from '../../hooks/useRoomToolbar';
import { eventCenter } from '../../utils/eventCenter';
import type { WidgetConfig } from '../../adapter/type';

const { t } = useUIKit();
const roomPageRef = ref<HTMLElement | null>(null);
const { showToolbar } = useRoomToolbar(roomPageRef);
const { activeWidgetId, sidePanelTitle, panelWidgets, closePanel } = useRoomSidePanel();

/** Resolve panel props (supports both static object and dynamic function) */
const getPanelProps = (widget: WidgetConfig) => {
  const rawProps = widget.panel?.props;
  return typeof rawProps === 'function' ? rawProps() : (rawProps ?? {});
};

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
const {
  isJoiningRoom,
  joiningRoomId,
  roomPasswordVisible,
  handleJoinRoomError,
} = useRoomLifeCycle();

const isWebinar = computed(() => currentRoom.value?.roomType === RoomType.Webinar);
const isOwner = computed(() => localParticipant.value?.role === RoomParticipantRole.Owner);
const isAdmin = computed(() => localParticipant.value?.role === RoomParticipantRole.Admin);
const isGeneralUser = computed(() => localParticipant.value?.role === RoomParticipantRole.GeneralUser);
const isParticipant = computed(() => participantList.value.some(participant => participant.userId === localParticipant.value?.userId));
const isAudience = computed(() => !participantList.value.some(participant => participant.userId === localParticipant.value?.userId));
const participantViewLayout: Ref<RoomLayoutTemplate | undefined> = ref(undefined);
function handleLayoutUpdate(layout: RoomLayoutTemplate) {
  participantViewLayout.value = layout;
}

// Cache roomInfo before leave/dismiss since SDK may clear currentRoom after the operation
let cachedRoomInfo: any = null;
watch(() => currentRoom.value, (newRoom) => {
  if (newRoom?.roomId) {
    cachedRoomInfo = { ...newRoom };
  }
}, { immediate: true, deep: true });

const handlePasswordCancel = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_ERROR);
};
const handleLeaveRoom = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_LEAVE, { roomInfo: cachedRoomInfo || currentRoom.value });
};
const handleEndRoom = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_DISMISS, { roomInfo: cachedRoomInfo || currentRoom.value });
};

const notWebinar = computed(() => !isWebinar.value);
const ownerOrNotWebinar = computed(() => !isWebinar.value || isOwner.value);
const participantOrNotWebinar = computed(() => !isWebinar.value || isParticipant.value);

const watermarkConfig = computed(() => conference.getFeatureConfig('watermark'));
const watermarkEnabled = computed(() => watermarkConfig.value?.enable !== false);
const watermarkContent = computed(() =>
  watermarkConfig.value?.content ?? [
    loginUserInfo.value?.userName || '',
    loginUserInfo.value?.userId || '',
  ],
);
const watermarkFont = computed(() => watermarkConfig.value?.font ?? { fontSize: 16 });

watch(() => currentRoom.value?.roomType, (newRoomType, oldRoomType) => {
  if (oldRoomType !== undefined && oldRoomType === newRoomType) {
    return;
  }
  if (newRoomType === RoomType.Webinar) {
    participantViewLayout.value = undefined;
  } else {
    const configuredLayout = conference.getFeatureConfig('layoutTemplate');
    participantViewLayout.value = configuredLayout ?? RoomLayoutTemplate.GridLayout;
  }
}, { immediate: true });

watch(() => conference.getFeatureConfig('layoutTemplate'), (newVal) => {
  if (currentRoom.value?.roomType !== RoomType.Webinar) {
    participantViewLayout.value = newVal ?? RoomLayoutTemplate.GridLayout;
  }
});

watch(
  () => currentRoom.value?.roomId,
  async (roomId, oldRoomId) => {
    if (!oldRoomId && roomId) {
      await getParticipantList({ cursor: participantListCursor.value });
      await getAudienceList({ cursor: audienceListCursor.value });
    }
  },
  { immediate: true },
);

const onRoomEnded = () => {
  eventCenter.emit(ConferenceRoomEvent.ROOM_DISMISS, { roomInfo: cachedRoomInfo || currentRoom.value });
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
  width: 100%;
  height: 100%;
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
  transition: opacity 0.2s ease, visibility 0.2s ease;

  &-left {
    display: flex;
    flex: 1;
    gap: 12px;
    justify-content: flex-start;
    align-items: center;
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

.toolbar-hidden {
  visibility: hidden;
  pointer-events: none;
  opacity: 0;
}

.recording-status-anchor {
  position: absolute;
  top: 16px;
  left: 16px;
  transform: translateY(0);
  transition: transform 0.2s ease; // matches header transition

  &.toolbar-visible {
    transform: translateY(56px); // header height
  }
  z-index: 2;
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
  user-select: none;

  input,
  textarea,
  [contenteditable='true'] {
    user-select: text;
  }
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
  transition: opacity 0.2s ease, visibility 0.2s ease;

  .control-left {
    display: flex;
    flex: 1;
    gap: 16px;
    align-items: center;
    justify-content: flex-start;
  }

  .control-center {
    position: relative;
    display: flex;
    flex: 2;
    gap: 16px;
    align-items: center;
    justify-content: center;
    min-width: 0;
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
