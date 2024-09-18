<template>
  <div class="whiteboard-control-container">
    <icon-button
      :is-active="basicStore.isWhiteboardVisiable"
      :title="title"
      :disabled="whiteboardDisabled"
      @click-icon="handleWhiteboardDialog"
    >
      <stop-screen-share-icon v-if="basicStore.isWhiteboardVisiable" />
      <screen-share-icon v-else />
    </icon-button>
  </div>
</template>

<script setup lang="ts">
import {
  TRTCScreenCaptureSourceInfo,
  TRTCScreenCaptureSourceType,
} from '@tencentcloud/tuiroom-engine-electron';
import { storeToRefs } from 'pinia';
import { ipcRenderer } from 'electron';
import { computed, onMounted, onUnmounted } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import ScreenShareIcon from '../common/icons/ScreenShareIcon.vue';
import StopScreenShareIcon from '../common/icons/StopScreenShareIcon.vue';
import TUIMessage from '../common/base/Message';
import { useRoomStore } from '../../stores/room';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import eventBus from '../../hooks/useMitt';
import { EventType, roomEngine } from '../../services';
import { MESSAGE_DURATION } from '../../constants/message';
import { roomService } from '../../services/index';

const { t } = useI18n();
const roomStore = useRoomStore();
const basicStore = useBasicStore();

const { isAudience, hasOtherScreenShare } = storeToRefs(roomStore);

const whiteboardDisabled = computed(
  () => isAudience.value || basicStore.isSharing
);
const title = computed(() =>
  basicStore.isWhiteboardVisiable ? t('Close whiteboard') : t('Open whiteboard')
);

function handleWhiteboardDialog() {
  if (basicStore.isWhiteboardVisiable) {
    stopShareWhiteboard();
  } else {
    startShareWhiteboard();
  }
}

async function startShareWhiteboard() {
  if (basicStore.isWhiteboardVisiable) {
    return;
  }

  if (whiteboardDisabled.value) {
    TUIMessage({
      type: 'warning',
      message: t(
        'Screen sharing is currently active, cannot start the whiteboard.'
      ),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }

  if (hasOtherScreenShare.value) {
    TUIMessage({
      type: 'warning',
      message: t(
        'Another user is currently sharing the screen, screen sharing is not possible.'
      ),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }

  showWhiteboardWindow();
  const screenAndWindowsList: TRTCScreenCaptureSourceInfo[] =
    await roomEngine.instance?.getScreenSharingTarget();

  const windowList = screenAndWindowsList.filter(
    (screen: TRTCScreenCaptureSourceInfo) =>
      screen.type ===
      TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeWindow
  );
  windowList.forEach((info: TRTCScreenCaptureSourceInfo) => {
    if (info.sourceName.includes('Whiteboard window')) {
      roomEngine.instance?.startScreenSharingElectron({
        targetId: info.sourceId,
      });
    }
  });
  basicStore.setWhiteboardVisiable(true);
}

function stopShareWhiteboard() {
  roomEngine.instance?.stopScreenSharing();
  basicStore.setWhiteboardVisiable(false);
  hideAllWhiteboardWindow();
}

function hideAllWhiteboardWindow() {
  ipcRenderer.send('annotation:hide');
  ipcRenderer.send('whiteboard:hide-window');
}

function showWhiteboardWindow() {
  ipcRenderer.send('whiteboard:show-window');
}

ipcRenderer.on('whiteboard:window-closed', () => {
  stopShareWhiteboard();
});

ipcRenderer.on('whiteboard:stop-from-whiteboard-window', () => {
  stopShareWhiteboard();
});

eventBus.on('ScreenShare:stopScreenShare', stopShareWhiteboard);

onMounted(() => {
  roomService.on(EventType.KICKED_OUT, stopShareWhiteboard);
  roomService.on(EventType.USER_SIG_EXPIRED, stopShareWhiteboard);
  roomService.on(EventType.KICKED_OFFLINE, stopShareWhiteboard);
  roomService.on(EventType.ROOM_LEAVE, stopShareWhiteboard);
  roomService.on(EventType.ROOM_DISMISS, stopShareWhiteboard);
  roomService.on(EventType.USER_LOGOUT, stopShareWhiteboard);
});
onUnmounted(() => {
  roomService.off(EventType.KICKED_OUT, stopShareWhiteboard);
  roomService.off(EventType.USER_SIG_EXPIRED, stopShareWhiteboard);
  roomService.off(EventType.KICKED_OFFLINE, stopShareWhiteboard);
  roomService.off(EventType.ROOM_LEAVE, stopShareWhiteboard);
  roomService.off(EventType.ROOM_DISMISS, stopShareWhiteboard);
  roomService.off(EventType.USER_LOGOUT, stopShareWhiteboard);
  roomService.resetStore();
});
</script>

<style lang="scss" scoped></style>
