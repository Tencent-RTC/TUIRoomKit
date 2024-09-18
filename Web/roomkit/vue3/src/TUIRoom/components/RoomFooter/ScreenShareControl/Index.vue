<template>
  <div v-if="screenShareConfig.visible" class="screen-share-control-container">
    <icon-button
      ref="btnStopRef"
      :is-active="isSharing"
      :disabled="screenShareDisabled"
      :title="title"
      :is-not-support="!isScreenShareSupported"
      @click-icon="toggleScreenShare"
    >
      <stop-screen-share-icon v-if="isSharing" />
      <screen-share-icon v-else />
    </icon-button>
    <Dialog
      v-model="isShowFraudDialog"
      width="420px"
      :title="t('Safety Reminder')"
      :modal="true"
      :append-to-room-container="true"
    >
      <span>
        {{
          t(
            'Sharing screens may lead to the leakage of private information such as SMS verification codes and passwords, resulting in financial losses. Please be vigilant against various forms of fraud.'
          )
        }}
      </span>
      <template #footer>
        <span>
          <tui-button size="default" @click="startScreenShare">{{
            t('Continue sharing')
          }}</tui-button>
          <tui-button
            class="button"
            type="primary"
            size="default"
            @click="isShowFraudDialog = false"
            >{{ t('Cancel') }}
          </tui-button>
        </span>
      </template>
    </Dialog>
    <Dialog
      v-model="dialogVisible"
      width="420px"
      :title="t('End sharing')"
      :modal="true"
      :before-close="cancelStop"
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
            @click="cancelStop"
            >{{ t('Cancel') }}
          </tui-button>
        </span>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import TUIMessage from '../../common/base/Message/index';
import Dialog from '../../common/base/Dialog';
import IconButton from '../../common/base/IconButton.vue';
import ScreenShareIcon from '../../common/icons/ScreenShareIcon.vue';
import StopScreenShareIcon from '../../common/icons/StopScreenShareIcon.vue';
import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import logger from '../../../utils/common/logger';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useI18n } from '../../../locales';
import TuiButton from '../../common/base/Button.vue';
import eventBus from '../../../hooks/useMitt';
import { isScreenShareSupported } from '../../../utils/mediaAbility';
import { roomService } from '../../../services';

const roomEngine = useGetRoomEngine();

const logPrefix = '[ScreenShareControl]';

const screenShareConfig = roomService.getComponentConfig('ScreenShare');

const roomStore = useRoomStore();
const basicStore = useBasicStore();
const {
  isAnchor,
  isAudience,
  hasOtherScreenShare,
  isGeneralUser,
  isScreenShareDisableForAllUser,
} = storeToRefs(roomStore);
const { isShowScreenShareAntiFraud } = storeToRefs(basicStore);
const { t } = useI18n();

const btnStopRef = ref();
const isSharing: Ref<boolean> = ref(false);
const dialogVisible: Ref<boolean> = ref(false);
const isShowFraudDialog: Ref<boolean> = ref(false);

// Users in the audience cannot share screens
const screenShareDisabled = computed(() => isAudience.value);
const title = computed(() =>
  isSharing.value ? t('End sharing') : t('Share screen')
);

watch(isAnchor, (val: any, oldVal: any) => {
  if (!oldVal && val && isSharing.value) {
    stopScreenShare();
  }
});

async function toggleScreenShare() {
  if (isSharing.value) {
    dialogVisible.value = true;
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

  if (!isScreenShareSupported) {
    TUIMessage({
      type: 'warning',
      message: t('The current browser does not support screen sharing'),
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

  if (!isShowScreenShareAntiFraud.value) {
    await startScreenShare();
    return;
  }
  isShowFraudDialog.value = true;
}

function cancelStop() {
  dialogVisible.value = false;
}

async function startScreenShare() {
  isShowFraudDialog.value = false;
  try {
    await roomEngine.instance?.startScreenSharing();
    isSharing.value = true;
  } catch (error: any) {
    logger.error(
      `${logPrefix}startScreenShare error:`,
      error.name,
      error.message,
      error.code
    );
    let message = '';
    // When the screen sharing stream fails to initialize, remind the user and stop the subsequent room entry publishing process.
    switch (error.name) {
      case 'NotReadableError':
        // Remind users to ensure that the system allows the current browser to access screen content
        message =
          'The system prohibits the current browser from obtaining screen content';
        break;
      case 'NotAllowedError':
        if (error.message.includes('Permission denied by system')) {
          // Remind users to ensure that the system allows the current browser to access screen content
          message =
            'The system prohibits the current browser from obtaining screen content';
        } else {
          // User rejects/cancels screen sharing
          message = 'User rejects/cancels screen sharing';
        }
        break;
      default:
        // An unknown error was encountered while initializing the screen sharing stream. The user is reminded to try again.
        message = 'Screen sharing encountered an unknown error';
        break;
    }
    TUIMessage({
      type: 'warning',
      message,
      duration: MESSAGE_DURATION.LONG,
    });
  }
}

async function stopScreenShare() {
  if (isSharing.value) {
    try {
      await roomEngine.instance?.stopScreenSharing();
      dialogVisible.value = false;
      isSharing.value = false;
    } catch (error) {
      logger.error(`${logPrefix}stopScreenShare error:`, error);
    }
  }
}

/** Receive a stop screen sharing event (the user clicks the "End Sharing" button that comes with the browser or is kicked off the stage by the host in speaking mode)*/
function screenCaptureStopped() {
  isSharing.value = false;
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
