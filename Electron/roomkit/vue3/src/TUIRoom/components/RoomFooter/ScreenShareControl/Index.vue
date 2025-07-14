<template>
  <div class="screen-share-control-container">
    <icon-button
      ref="btnStopRef"
      :is-active="isSharing"
      :class="{ outlined: isSharing }"
      :title="title"
      :disabled="screenShareDisabled"
      @click-icon="toggleScreenShare"
    >
      <stop-screen-share-icon v-if="isSharing" />
      <screen-share-icon v-else />
    </icon-button>
    <Dialog
      v-model="showStopShareRegion"
      width="420px"
      :title="t('End sharing')"
      :modal="true"
      :close-on-click-modal="true"
      :append-to-room-container="true"
    >
      <span>
        {{
          t(
            'Others will no longer see your screen after you stop sharing. Are you sure you want to stop?'
          )
        }}
      </span>
      <template #footer>
        <span>
          <tui-button size="default" @click="stopScreenShare">{{
            t('End sharing')
          }}</tui-button>
          <tui-button
            class="button"
            type="primary"
            size="default"
            @click="showStopShareRegion = false"
            >{{ t('Cancel') }}
          </tui-button>
        </span>
      </template>
    </Dialog>

    <screen-window-select-dialog
      :visible="selectDialogVisible"
      :screen-list="screenList"
      :window-list="windowList"
      @on-confirm="onConfirmScreenShare"
      @on-close="selectDialogVisible = false"
    />
    <Dialog
      v-model="showPermissionVisible"
      :title="t('Grant permission to screen recording')"
      :modal="true"
      :append-to-body="true"
      width="480px"
      :close-on-click-modal="true"
      :append-to-room-container="true"
    >
      <div>
        {{
          t(
            'Due to macOS 10.15 system requirements, please check the current application in "System Preferences - Security & Privacy - Screen Recording".'
          )
        }}
      </div>
      <template #footer>
        <tui-button size="default" @click="onPermissionScreenShare">
          {{ t('Open the system preferences settings') }}
        </tui-button>
        <tui-button
          class="button"
          type="primary"
          size="default"
          @click="showPermissionVisible = false"
        >
          {{ t('Cancel') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, onUnmounted } from 'vue';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../../locales';
import IconButton from '../../common/base/IconButton.vue';
import TUIRoomEngine, {
  TUIRoomEvents,
  TRTCScreenCaptureSourceType,
  TRTCScreenCaptureSourceInfo,
} from '@tencentcloud/tuiroom-engine-electron';
import ScreenWindowSelectDialog from './ScreenWindowSelectDialog.vue';
import ScreenShareIcon from '../../common/icons/ScreenShareIcon.vue';
import StopScreenShareIcon from '../../common/icons/StopScreenShareIcon.vue';
import { useRoomStore } from '../../../stores/room';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import TUIMessage from '../../common/base/Message';
import { MESSAGE_DURATION } from '../../../constants/message';
import eventBus from '../../../hooks/useMitt';
import Dialog from '../../common/base/Dialog/index.vue';
import TuiButton from '../../common/base/Button.vue';
import logger from '../../../utils/common/logger';

const { t } = useI18n();

const roomStore = useRoomStore();

const {
  isAudience,
  remoteScreenStream,
  isGeneralUser,
  isScreenShareDisableForAllUser,
  isWhiteboardVisible,
  isSharingScreen,
  isLocalUserSharing,
} = storeToRefs(roomStore);
const roomEngine = useGetRoomEngine();

const logPrefix = '[ScreenShareControl]';

const btnStopRef = ref();
const isSharing: Ref<boolean> = ref(false);
const showPermissionVisible: Ref<boolean> = ref(false);
const showStopShareRegion: Ref<boolean> = ref(false);

const screenShareDisabled = computed(
  () => isAudience.value || isWhiteboardVisible.value
);
const title = computed(() =>
  isSharing.value ? t('End sharing') : t('Share screen')
);

const selectDialogVisible: Ref<boolean> = ref(false);
const screenList: Ref<Array<TRTCScreenCaptureSourceInfo>> = ref([]);
const windowList: Ref<Array<TRTCScreenCaptureSourceInfo>> = ref([]);

async function toggleScreenShare() {
  if (isSharing.value) {
    showStopShareRegion.value = true;
    return;
  }

  if (isAudience.value) {
    TUIMessage({
      type: 'warning',
      message: t(
        'You currently do not have sharing permission, please raise your hand to apply for sharing permission first'
      ),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }

  if (remoteScreenStream.value) {
    TUIMessage({
      type: 'warning',
      message: t('Another user is sharing the screen.'),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }

  if (isWhiteboardVisible.value) {
    TUIMessage({
      type: 'warning',
      message: t('You are sharing the whiteboard, please stop sharing first'),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }

  if (isGeneralUser.value && isScreenShareDisableForAllUser.value) {
    TUIMessage({
      type: 'warning',
      message: t(
        'Failed to initiate screen sharing, currently only host/admin can share screen.'
      ),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }

  if (!(window as any).isHasScreen && process.platform === 'darwin') {
    showPermissionVisible.value = true;
    return;
  }
  if (!isSharing.value && !selectDialogVisible.value) {
    const screenCaptureList: any =
      await roomEngine.instance?.getScreenSharingTarget();
    screenList.value = screenCaptureList.filter(
      (screen: TRTCScreenCaptureSourceInfo) =>
        screen.type === TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeScreen, // eslint-disable-line
    );
    windowList.value = screenCaptureList.filter(
      (screen: TRTCScreenCaptureSourceInfo) =>
        screen.type ===
        TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeWindow
    );
    selectDialogVisible.value = true;
  }
}

async function onPermissionScreenShare() {
  // eslint-disable-next-line
  const { shell } = require('electron');
  shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
  );
  showPermissionVisible.value = false;
}

async function onConfirmScreenShare(screenInfo: TRTCScreenCaptureSourceInfo) {
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
  await roomEngine.instance?.startScreenSharingElectron({
    targetId: screenInfo.sourceId,
  });
  isSharing.value = true;
  isLocalUserSharing.value = true;
  selectDialogVisible.value = false;
  if (screenInfo.type === 1) {
    const { x } = screenInfo;
    const { y } = screenInfo;
    isSharingScreen.value = true;
    notifyScreenShareStarted({
      x,
      y,
    });
  } else {
    isSharingScreen.value = false;
  }
}

async function stopScreenShare() {
  if (isSharing.value) {
    try {
      await roomEngine.instance?.stopScreenSharingElectron();
      showStopShareRegion.value = false;
      isSharing.value = false;
      isLocalUserSharing.value = false;
    } catch (error) {
      logger.error(`${logPrefix}stopScreenShare error:`, error);
    }
  }
}

/** Received a stop screen sharing event
 * (user clicked the ‘’End Sharing‘’ button that comes with the browser or was kicked off the stage by the moderator in speak on stage mode)*/
function screenCaptureStopped() {
  isSharing.value = false;
  isLocalUserSharing.value = false;
  notifyScreenShareStopped();
}

function notifyScreenShareStarted(param: any) {
  ipcRenderer.send('annotation:screen-share-started', param);
}

function notifyScreenShareStopped() {
  if (isSharingScreen.value) {
    ipcRenderer.send('annotation:screen-share-stopped');
    isSharingScreen.value = false;
  }
}

eventBus.on('ScreenShare:stopScreenShare', stopScreenShare);
TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(
    TUIRoomEvents.onUserScreenCaptureStopped,
    screenCaptureStopped
  );
});

onUnmounted(() => {
  eventBus.off('ScreenShare:stopScreenShare', stopScreenShare);
  roomEngine.instance?.off(
    TUIRoomEvents.onUserScreenCaptureStopped,
    screenCaptureStopped
  );
});
</script>

<style lang="scss" scoped>
.screen-share-control-container {
  position: relative;
}

.stop-share-region {
  position: absolute;
  top: -58px;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 131px;
  height: 48px;
  font-size: 14px;
  color: var(--color-font);
  cursor: pointer;
  background: var(--stop-share-region-bg-color);
  border-radius: 4px;
  transform: translateX(-50%);
}

.stop-share-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.button {
  margin-left: 12px;
}
</style>
