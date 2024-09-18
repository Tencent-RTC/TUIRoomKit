<!--
  * Name: IconButton
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * Usage:
  * Use <audio-control /> in the template
-->
<template>
  <div>
    <video-media-control
      :has-more="hasMore"
      :is-muted="!localUser.hasVideoStream"
      :is-disabled="isLocalVideoIconDisable"
      @click="handleVideoMediaClick"
    />
    <Dialog
      v-model="showRequestOpenCameraDialog"
      :title="t('Tips')"
      :modal="true"
      :show-close="false"
      :close-on-click-modal="false"
      width="500px"
      :append-to-room-container="true"
      :confirm-button="t('Turn on the camera')"
      :cancel-button="t('Keep it closed')"
      @confirm="handleAccept"
      @cancel="handleReject"
    >
      <span>
        {{ dialogContent }}
      </span>
      <template #footer>
        <tui-button class="cancel-button" size="default" @click="handleAccept">
          {{ t('Turn on the camera') }}
        </tui-button>
        <tui-button
          class="cancel-button"
          size="default"
          type="primary"
          @click="handleReject"
        >
          {{ t('Keep it closed') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, Ref, defineEmits } from 'vue';
import { storeToRefs } from 'pinia';
import Dialog from '../common/base/Dialog';
import VideoMediaControl from '../common/VideoMediaControl.vue';
import { useRoomStore } from '../../stores/room';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../constants/message';
import { useI18n } from '../../locales';

import useGetRoomEngine from '../../hooks/useRoomEngine';
import useDeviceManager from '../../hooks/useDeviceManager';
import TUIRoomEngine, {
  TUIRoomEvents,
  TUIRequest,
  TUIRequestAction,
  TUIRole,
  TUIMediaDeviceType,
} from '@tencentcloud/tuiroom-engine-js';
import { isMobile, isWeChat } from '../../utils/environment';
import { useBasicStore } from '../../stores/basic';
import TuiButton from '../common/base/Button.vue';
import TUIMessage from '../common/base/Message/index';
import TUIMessageBox from '../common/base/MessageBox/index';
const roomEngine = useGetRoomEngine();
const { deviceManager } = useDeviceManager();

const roomStore = useRoomStore();
const basicStore = useBasicStore();
const dialogContent: Ref<string> = ref('');
const emits = defineEmits(['click']);

const {
  isCameraDisableForAllUser,
  isAudience,
  localUser,
  isLocalVideoIconDisable,
} = storeToRefs(roomStore);
const { t } = useI18n();
const hasMore = computed(() => !isMobile);
const showVideoSettingTab: Ref<boolean> = ref(false);

function handleVideoMediaClick() {
  emits('click');
  toggleMuteVideo();
}

async function toggleMuteVideo() {
  if (isLocalVideoIconDisable.value) {
    let warningMessage = '';
    if (isAudience.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_CAMERA_FAIL_AUDIENCE;
    } else if (isCameraDisableForAllUser.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_CAMERA_FAIL_MUTE_ALL;
    }
    TUIMessage({
      type: 'warning',
      message: t(warningMessage),
      duration: MESSAGE_DURATION.NORMAL,
    });
    return;
  }

  if (localUser.value.hasVideoStream) {
    await roomEngine.instance?.closeLocalCamera();
    // If the picture is banned for all members, the user cannot turn it on again after voluntarily turning off the camera.
    if (roomStore.isCameraDisableForAllUser) {
      roomStore.setCanControlSelfVideo(false);
    }
  } else {
    const cameraList = await deviceManager.instance?.getDevicesList({
      type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
    });
    const hasCameraDevice = cameraList && cameraList.length > 0;
    // No camera list
    if (!hasCameraDevice && !isWeChat) {
      TUIMessageBox({
        title: t('Note'),
        message: t('Camera not detected on current device'),
        confirmButtonText: t('Sure'),
      });
      return;
    }
    if (isMobile) {
      await roomEngine.instance?.openLocalCamera({
        isFrontCamera: basicStore.isFrontCamera,
      });
    } else {
      await roomEngine.instance?.openLocalCamera();
    }
  }
  showVideoSettingTab.value = false;
}

/**
 * Handling host or administrator turn on/off camera signalling
 **/
const showRequestOpenCameraDialog: Ref<boolean> = ref(false);
const requestOpenCameraRequestId: Ref<string> = ref('');
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { userId, requestAction, requestId } = eventInfo.request;
  if (requestAction === TUIRequestAction.kRequestToOpenRemoteCamera) {
    const userRole =
      roomStore.getUserRole(userId) === TUIRole.kRoomOwner
        ? t('RoomOwner')
        : t('Admin');
    dialogContent.value = t('Sb invites you to turn on the camera', {
      role: userRole,
    });
    requestOpenCameraRequestId.value = requestId;
    showRequestOpenCameraDialog.value = true;
  }
}

// Accept the host invitation and turn on the camera
async function handleAccept() {
  roomStore.setCanControlSelfVideo(true);
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenCameraRequestId.value,
    agree: true,
  });
  requestOpenCameraRequestId.value = '';
  showRequestOpenCameraDialog.value = false;
}

// keep mute
async function handleReject() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenCameraRequestId.value,
    agree: false,
  });
  requestOpenCameraRequestId.value = '';
  showRequestOpenCameraDialog.value = false;
}

// Request canceled
async function onRequestCancelled(eventInfo: { requestId: string }) {
  const { requestId } = eventInfo;
  if (requestOpenCameraRequestId.value === requestId) {
    showRequestOpenCameraDialog.value = false;
  }
}

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.on(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.off(
    TUIRoomEvents.onRequestCancelled,
    onRequestCancelled
  );
});
</script>

<style lang="scss" scoped>
.cancel-button {
  margin-left: 20px;
}
</style>
