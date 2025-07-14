<template>
  <div class="whiteboard-control-container">
    <icon-button
      :is-active="isWhiteboardVisible"
      :title="title"
      :disabled="whiteboardDisabled"
      @click-icon="handleWhiteboardDialog"
    >
      <stop-screen-share-icon v-if="isWhiteboardVisible" />
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
import { useI18n } from '../../locales';
import eventBus from '../../hooks/useMitt';
import { EventType, roomEngine } from '../../services';
import { MESSAGE_DURATION } from '../../constants/message';
import { roomService } from '../../services/index';
import { MetricsKey } from '../../services/manager/dataReportManager';

const { t } = useI18n();
const roomStore = useRoomStore();

const {
  isAudience,
  remoteScreenStream,
  isLocalUserSharing,
  isWhiteboardVisible,
  isAnnotationVisible,
} = storeToRefs(roomStore);

const whiteboardDisabled = computed(
  () => isAudience.value || isLocalUserSharing.value
);
const title = computed(() =>
  isWhiteboardVisible.value ? t('Close whiteboard') : t('Open whiteboard')
);

function handleWhiteboardDialog() {
  if (isWhiteboardVisible.value) {
    stopShareWhiteboard();
  } else {
    startShareWhiteboard();
  }
}

async function startShareWhiteboard() {
  if (isWhiteboardVisible.value) {
    return;
  }

  if (isAudience.value) {
    TUIMessage({
      type: 'warning',
      message: t(
        'You currently do not have whiteboard permission, please raise your hand to apply for whiteboard permission first'
      ),
      duration: MESSAGE_DURATION.LONG,
    });
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

  if (remoteScreenStream.value) {
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
}

function stopShareWhiteboard() {
  roomEngine.instance?.stopScreenSharing();
  if (isWhiteboardVisible.value) {
    roomService.dataReportManager.reportCount(MetricsKey.stopSharingWhiteboard);
  }
  if (isAnnotationVisible.value) {
    roomService.dataReportManager.reportCount(MetricsKey.stopAnnotating);
  }
  isWhiteboardVisible.value = false;
  isAnnotationVisible.value = false;
  hideAllWhiteboardWindow();
}

function hideAllWhiteboardWindow() {
  ipcRenderer.send('annotation:hide');
  ipcRenderer.send('whiteboard:hide-window');
}

function showWhiteboardWindow() {
  isWhiteboardVisible.value = true;
  ipcRenderer.send('whiteboard:show-window');
  roomService.dataReportManager.reportCount(MetricsKey.startSharingWhiteboard);
}

ipcRenderer.on('whiteboard:window-closed', () => {
  stopShareWhiteboard();
});

ipcRenderer.on('whiteboard:stop-from-whiteboard-window', () => {
  stopShareWhiteboard();
});

ipcRenderer.on('whiteboard:save-from-whiteboard-window', () => {
  roomService.dataReportManager.reportCount(MetricsKey.saveWhiteboard);
});

onMounted(() => {
  eventBus.on('ScreenShare:stopScreenShare', stopShareWhiteboard);
  roomService.on(EventType.KICKED_OUT, stopShareWhiteboard);
  roomService.on(EventType.USER_SIG_EXPIRED, stopShareWhiteboard);
  roomService.on(EventType.KICKED_OFFLINE, stopShareWhiteboard);
  roomService.on(EventType.ROOM_LEAVE, stopShareWhiteboard);
  roomService.on(EventType.ROOM_DISMISS, stopShareWhiteboard);
  roomService.on(EventType.USER_LOGOUT, stopShareWhiteboard);
});
onUnmounted(() => {
  eventBus.off('ScreenShare:stopScreenShare', stopShareWhiteboard);
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
