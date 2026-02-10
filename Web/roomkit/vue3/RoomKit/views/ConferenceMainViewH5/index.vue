<template>
  <div id="roomPage" class="room-page">
    <div class="room-container">
      <header v-show="showToolbar" class="header">
        <div class="header-left">
          <SwitchCameraButtonH5 />
        </div>
        <div class="header-center">
          <RoomITitleH5 />
        </div>
        <div class="header-right">
          <LeaveRoomButtonH5 @leave="handleLeaveRoom" @end="handleEndRoom" />
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
          :font="{ fontSize: 16 }"
          :content="[
            loginUserInfo?.userName || '',
            loginUserInfo?.userId || '',
          ]"
          :gap="[0, 100]"
        >
          <RoomLayoutViewH5 />
        </TUIWatermark>
      </main>

      <footer v-show="showToolbar" class="room-footer">
        <ExpandFooterH5>
          <ParticipantButtonH5 />
          <MicButtonH5 />
          <CameraButtonH5 />
          <CallButtonH5 />
          <ChatButtonH5 />
          <SettingButtonH5 />
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
import { watch, onMounted, onUnmounted } from 'vue';
import {
  useUIKit,
  TUIWatermark,
  vTuiLoading,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  useLoginState,
  useRoomState,
  useRoomParticipantState,
  RoomEvent,
  RoomParticipantEvent,
  KickedOutOfRoomReason,
} from 'tuikit-atomicx-vue3/room';
import {
  RoomITitleH5,
  CallButtonH5,
  PasswordDialogH5,
  LeaveRoomButtonH5,
  ChatButtonH5,
  ParticipantButtonH5,
  SwitchCameraButtonH5,
  RoomLayoutViewH5,
  MicButtonH5,
  CameraButtonH5,
  SettingButtonH5,
  ExpandFooterH5,
} from '../../components';
import useCustomizedAutoPlayDialog from '../../hooks/useCustomizedAutoPlayDialog';
import { useRoomTips } from '../../hooks/useRoomTips';
import { useRoomToolbarH5 } from '../../hooks/useRoomToolbarH5';
import useRoomLifeCycle from '../../hooks/useRoomLifeCycle';
import { eventCenter } from '../../utils/eventCenter';
import { RoomEvent as ConferenceRoomEvent } from '../../adapter/type';

const { t } = useUIKit();
const { showToolbar, toggleToolbar } = useRoomToolbarH5();

useCustomizedAutoPlayDialog();
useRoomTips();

const { loginUserInfo } = useLoginState();
const { currentRoom } = useRoomState();
const {
  getParticipantList,
  participantListCursor,
  subscribeEvent: subscribeRoomParticipantEvent,
  unsubscribeEvent: unsubscribeRoomParticipantEvent,
} = useRoomParticipantState();
const {
  subscribeEvent: subscribeRoomEvent,
  unsubscribeEvent: unsubscribeRoomEvent,
} = useRoomState();

const {
  isJoiningRoom,
  joiningRoomId,
  roomPasswordVisible,
  handleJoinRoomError,
} = useRoomLifeCycle();

watch(
  () => currentRoom.value?.roomId,
  async (roomId, oldRoomId) => {
    if (!oldRoomId && roomId) {
      await getParticipantList({ cursor: participantListCursor.value });
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
