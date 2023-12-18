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
      <stop-screen-share-icon v-if="isSharing"></stop-screen-share-icon>
      <screen-share-icon v-else></screen-share-icon>
    </icon-button>
    <Dialog :model-value="showStopShareRegion" width="420px" :title="t('End sharing')" :modal="true">
      <span>
        {{ t('Others will no longer see your screen after you stop sharing. Are you sure you want to stop?') }}</span>
      <template #footer>
        <span>
          <tui-button size="default" @click="stopScreenShare">{{ t('End sharing') }}</tui-button>
          <tui-button class="button" type="primary" size="default" @click="showStopShareRegion = false">{{ t('Cancel') }}</tui-button>
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
      :model-value="showPermissionVisible"
      :title="t('Grant permission to screen recording')"
      :modal="true"
      :append-to-body="true"
      width="480px"
    >
      <div>
        {{
          t(
            'Due to macOS 10.15 system requirements, please check the current application in "System Preferences - Security & Privacy - Screen Recording".',
          )
        }}
      </div>
      <template #footer>
        <tui-button size="default" @click="onPermissionScreenShare">
          {{ t('Open the system preferences settings') }}
        </tui-button>
        <tui-button class="button" type="primary" size="default" @click="showPermissionVisible = false">
          {{ t('Cancel') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../../locales';
import IconButton from '../../common/base/IconButton.vue';
import TUIRoomEngine, { TUIRoomEvents, TRTCScreenCaptureSourceType, TRTCScreenCaptureSourceInfo } from '@tencentcloud/tuiroom-engine-electron';
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
const { isAudience, hasOtherScreenShare } = storeToRefs(roomStore);
const roomEngine = useGetRoomEngine();

const logPrefix = '[ScreenShareControl]';

const btnStopRef = ref();
const isSharing: Ref<boolean> = ref(false);
const showPermissionVisible: Ref<boolean> = ref(false);
const showStopShareRegion: Ref<boolean> = ref(false);

const screenShareDisabled = computed(() => isAudience.value);
const title = computed(() => (isSharing.value ? t('End sharing') : t('Share screen')));

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
      message: t('You currently do not have sharing permission, please raise your hand to apply for sharing permission first'),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }

  if (hasOtherScreenShare.value) {
    TUIMessage({
      type: 'warning',
      message: t('Another user is currently sharing the screen, screen sharing is not possible.'),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }
  if (!(window as any).isHasScreen && process.platform === 'darwin') {
    showPermissionVisible.value = true;
  }
  if (!isSharing.value && !selectDialogVisible.value) {
    const screenCaptureList: any = await roomEngine.instance?.getScreenSharingTarget();
    screenList.value = screenCaptureList.filter((screen: TRTCScreenCaptureSourceInfo) =>
        screen.type === TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeScreen, // eslint-disable-line
    );
    windowList.value = screenCaptureList.filter((screen: TRTCScreenCaptureSourceInfo) => screen.type === TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeWindow);
    selectDialogVisible.value = true;
  }
}

async function onPermissionScreenShare() {
  const { shell } = require('electron');
  shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
  // todo: 这里不能注释，防止应用不出现在屏幕录制权限列表里
  // return;
  showPermissionVisible.value = false;
}

async function onConfirmScreenShare(screenInfo: TRTCScreenCaptureSourceInfo) {
  if (hasOtherScreenShare.value) {
    TUIMessage({
      type: 'warning',
      message: t('Another user is currently sharing the screen, screen sharing is not possible.'),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }
  await roomEngine.instance?.startScreenSharingElectron({ targetId: screenInfo.sourceId });
  isSharing.value = true;
  selectDialogVisible.value = false;
}

async function stopScreenShare() {
  if (isSharing.value) {
    try {
      await roomEngine.instance?.stopScreenSharingElectron();
      showStopShareRegion.value = false;
      isSharing.value = false;
    } catch (error) {
      logger.error(`${logPrefix}stopScreenShare error:`, error);
    }
  }
}

/** 收到停止屏幕共享事件(用户点击浏览器自带的 ""结束共享" 按钮或上台发言模式被主持人踢下台)*/
function screenCaptureStopped() {
  isSharing.value = false;
}

eventBus.on('ScreenShare:stopScreenShare', stopScreenShare);
TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onUserScreenCaptureStopped, screenCaptureStopped);
});

onUnmounted(() => {
  eventBus.off('ScreenShare:stopScreenShare', stopScreenShare);
  roomEngine.instance?.off(TUIRoomEvents.onUserScreenCaptureStopped, screenCaptureStopped);
});
</script>

<style lang="scss" scoped>
.screen-share-control-container {
  position: relative;
}
.stop-share-region {
  width: 131px;
  height: 48px;
  background: var(--stop-share-region-bg-color);
  border-radius: 4px;
  position: absolute;
  top: -58px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-font);
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
