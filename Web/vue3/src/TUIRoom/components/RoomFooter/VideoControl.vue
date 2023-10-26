<!--
  * 名称: IconButton
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * Usage:
  * Use <audio-control /> in the template
  *
  * Name: IconButton
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * 使用方式：
  * 在 template 中使用 <audio-control />
-->
<template>
  <div>
    <video-media-control
      :has-more="hasMore"
      :is-muted="!localStream.hasVideoStream"
      :is-disabled="isLocalVideoIconDisable"
      @click="handleVideoMediaClick"
    ></video-media-control>
    <Dialog
      :model-value="showRequestOpenCameraDialog"
      :title="title"
      :modal="true"
      :show-close="false"
      :close-on-click-modal="false"
      width="500px"
      :append-to-room-container="true"
    >
      <span>
        {{ t('The host invites you to turn on the camera') }}
      </span>
      <template v-if="isMobile" #cancel>
        <Button class="cancel" size="default" type="primary" @click="handleReject">
          {{ t('Keep it closed') }}
        </Button>
      </template>
      <template v-if="isMobile" #agree>
        <Button class="agree" size="default" @click="handleAccept">{{ t('Turn on the camera') }}</Button>
      </template>
      <template #footer>
        <Button class="cancel-button" size="default" @click="handleAccept">{{ t('Turn on the camera') }}</Button>
        <Button class="cancel-button" size="default" type="primary" @click="handleReject">
          {{ t('Keep it closed') }}
        </Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessageBox, ElMessage } from '../../elementComp';
import Dialog from '../common/base/Dialog';
import VideoMediaControl from '../common/VideoMediaControl.vue';
import { useRoomStore } from '../../stores/room';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../constants/message';
import { useI18n } from '../../locales';

import useGetRoomEngine from '../../hooks/useRoomEngine';
import TUIRoomEngine, { TUIVideoStreamType, TUIRoomEvents, TUIRequest, TUIRequestAction } from '@tencentcloud/tuiroom-engine-js';
import { isMobile, isWeChat }  from '../../utils/useMediaValue';
import { useBasicStore } from '../../stores/basic';
import Button from '../common/base/Button.vue';
const roomEngine = useGetRoomEngine();

const roomStore = useRoomStore();
const basicStore = useBasicStore();
const isFrontCamera: Ref<boolean> = ref(basicStore.isFrontCamera);
const emits = defineEmits(['click']);

const {
  isCameraDisableForAllUser,
  isAudience,
  localStream,
  isLocalVideoIconDisable,
} = storeToRefs(roomStore);
const { t } = useI18n();
const hasMore = computed(() => !isMobile);
const showVideoSettingTab: Ref<boolean> = ref(false);
const title = computed(() => (isMobile ? '' : t('Tips')));

function handleVideoMediaClick() {
  emits('click');
  toggleMuteVideo();
}

async function toggleMuteVideo() {
  if (isLocalVideoIconDisable.value) {
    let warningMessage = '';
    if (isCameraDisableForAllUser.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_CAMERA_FAIL_MUTE_ALL;
    } else if (isAudience.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_CAMERA_FAIL_AUDIENCE;
    }
    ElMessage({
      type: 'warning',
      message: t(warningMessage),
      duration: MESSAGE_DURATION.NORMAL,
    });
    return;
  }

  if (localStream.value.hasVideoStream) {
    await roomEngine.instance?.closeLocalCamera();
    // 如果是全员禁画状态下，用户主动关闭摄像头之后不能再自己打开
    if (roomStore.isCameraDisableForAllUser) {
      roomStore.setCanControlSelfVideo(false);
    }
  } else {
    const cameraList = await roomEngine.instance?.getCameraDevicesList();
    const hasCameraDevice = cameraList.length > 0;
    // 无摄像头列表
    if (!hasCameraDevice && !isWeChat) {
      ElMessageBox.alert(t('Camera not detected on current device'), t('Note'), {
        customClass: 'custom-element-class',
        confirmButtonText: t('Confirm'),
      });
      return;
    }
    // 有摄像头列表
    roomEngine.instance?.setLocalVideoView({
      view: `${roomStore.localStream.userId}_${roomStore.localStream.streamType}`,
      streamType: TUIVideoStreamType.kCameraStream,
    });
    if (isMobile) {
      await roomEngine.instance?.openLocalCamera({ isFrontCamera: isFrontCamera.value });
    } else {
      await roomEngine.instance?.openLocalCamera();
    }
  }
  showVideoSettingTab.value = false;
}


// -------- 处理主持人打开/关闭摄像头信令 --------
const showRequestOpenCameraDialog: Ref<boolean> = ref(false);
const requestOpenCameraRequestId: Ref<string> = ref('');
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { requestAction, requestId } = eventInfo.request;
  // 主持人邀请打开麦克风，同意之后将会自动打开摄像头
  if (requestAction === TUIRequestAction.kRequestToOpenRemoteCamera) {
    requestOpenCameraRequestId.value = requestId;
    showRequestOpenCameraDialog.value = true;
  }
}

// 接受主持人邀请，打开摄像头
async function handleAccept() {
  roomStore.setCanControlSelfVideo(true);
  roomEngine.instance?.setLocalVideoView({
    view: `${roomStore.localStream.userId}_${roomStore.localStream.streamType}`,
    streamType: TUIVideoStreamType.kCameraStream,
  });
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenCameraRequestId.value,
    agree: true,
  });
  requestOpenCameraRequestId.value = '';
  showRequestOpenCameraDialog.value = false;
}

// 保持静音
async function handleReject() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenCameraRequestId.value,
    agree: false,
  });
  requestOpenCameraRequestId.value = '';
  showRequestOpenCameraDialog.value = false;
}

// 请求被取消
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
  roomEngine.instance?.off(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
});

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

$videoTabWidth: 320px;

.video-control-container {
    position: relative;
    .video-tab {
      position: absolute;
      bottom: 90px;
      left: -60px;
      width: $videoTabWidth;
      background: var(--room-videotab-bg-color);
      padding: 20px;
    }
  }
  .agree{
    padding: 14px;
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    color: var(--active-color-1);
    font-size: 16px;
    font-weight: 500;
    background-color: #fff;
      &:hover {
      background: none;
      border: none;
    }
  }
  .cancel{
    padding: 14px;
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    font-size: 16px;
    font-weight: 400;
    color: var(--font-color-4);
      &:hover {
      background: none;
      border: none;
    }
  }
 .cancel-button {
  margin-left: 20px;
}
</style>
