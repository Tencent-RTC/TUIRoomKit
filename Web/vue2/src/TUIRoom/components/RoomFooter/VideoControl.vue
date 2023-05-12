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
    <div class="video-control-container" @click="emits('click')">
      <icon-button
        ref="videoIconButtonRef"
        :is-active="!localStream.hasVideoStream"
        :title="t('Camera')"
        :icon-name="iconName"
        :has-more="true"
        :disabled="isLocalVideoIconDisable"
        @click-icon="toggleMuteVideo"
        @click-more="handleMore"
      />
      <video-setting-tab
        v-show="showVideoSettingTab"
        ref="videoSettingRef"
        class="video-tab"
      ></video-setting-tab>
    </div>
    <Dialog
      :model-value="showRequestOpenCameraDialog"
      class="custom-element-class"
      title="Tips"
      :modal="false"
      :show-close="false"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="500px"
    >
      <span>
        {{ t('The host invites you to turn on the camera') }}
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="handleAccept">{{ t('Turn on the camera') }}</el-button>
          <el-button @click="handleReject">{{ t('Keep it closed') }}</el-button>
        </span>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessageBox, ElMessage } from '../../elementComp';

import IconButton from '../common/IconButton.vue';
import VideoSettingTab from '../base/VideoSettingTab.vue';

import { useRoomStore } from '../../stores/room';
import { ICON_NAME } from '../../constants/icon';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../constants/message';
import { useI18n } from '../../locales';

import useGetRoomEngine from '../../hooks/useRoomEngine';
import TUIRoomEngine, { TUIVideoStreamType, TUIRoomEvents, TUIRequest, TUIRequestAction } from '@tencentcloud/tuiroom-engine-js';
import Dialog from '../../elementComp/Dialog.vue';
const roomEngine = useGetRoomEngine();

const roomStore = useRoomStore();

const emits = defineEmits(['click']);

const {
  isCameraDisableForAllUser,
  isAudience,
  localStream,
  isLocalVideoIconDisable,
} = storeToRefs(roomStore);
const { t } = useI18n();

const showVideoSettingTab: Ref<boolean> = ref(false);
const videoIconButtonRef = ref<InstanceType<typeof IconButton>>();
const videoSettingRef = ref<InstanceType<typeof VideoSettingTab>>();

const iconName = computed(() => {
  if (isLocalVideoIconDisable.value) {
    return ICON_NAME.CameraOffDisabled;
  }
  return localStream.value.hasVideoStream ? ICON_NAME.CameraOn : ICON_NAME.CameraOff;
});

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
    if (!hasCameraDevice) {
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
    await roomEngine.instance?.openLocalCamera();
  }
  showVideoSettingTab.value = false;
}

function handleMore() {
  if (!showVideoSettingTab.value) {
    showVideoSettingTab.value = true;
  } else {
    showVideoSettingTab.value = false;
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (
    showVideoSettingTab.value
    && !videoIconButtonRef.value?.$el.contains(event.target)
    && !videoSettingRef.value?.$el.contains(event.target)
  ) {
    showVideoSettingTab.value = false;
  }
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

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true);
});

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.on(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick, true);

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
</style>
