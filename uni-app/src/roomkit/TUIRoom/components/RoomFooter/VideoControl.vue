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
        <tui-button class="cancel-button" size="default" @click="handleAccept">{{ t('Turn on the camera') }}</tui-button>
        <tui-button class="cancel-button" size="default" type="primary" @click="handleReject">
          {{ t('Keep it closed') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, Ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import Dialog from '../common/base/Dialog/index.vue';
import VideoMediaControl from '../common/VideoMediaControl.vue';
import { useRoomStore } from '../../stores/room';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../constants/message';
import { useI18n } from '../../locales';

import useGetRoomEngine from '../../hooks/useRoomEngine';
import useDeviceManager from '../../hooks/useDeviceManager';
import { TUIRoomEngine, TUIRoomEvents, TUIRequest, TUIRequestAction, TUIRole, TUIMediaDeviceType } from '@tencentcloud/tuiroom-engine-uniapp-app';
import { isMobile, isWeChat, isH5, isApp }  from '../../utils/environment';
import { useBasicStore } from '../../stores/basic';
import TuiButton from '../common/base/Button.vue';
import TUIMessage from '../common/base/Message/index';
import TUIMessageBox from '../common/base/MessageBox/index';
import { SMALL_VIDEO_ENC_PARAM } from '../../constants/room';
const roomEngine = useGetRoomEngine();
const { deviceManager } = useDeviceManager();

const roomStore = useRoomStore();
const basicStore = useBasicStore();
const dialogContent: Ref<string> = ref('');
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

  if (localStream.value.hasVideoStream) {
    await roomEngine.instance?.closeLocalCamera();
    // 如果是全员禁画状态下，用户主动关闭摄像头之后不能再自己打开
    if (roomStore.isCameraDisableForAllUser) {
      roomStore.setCanControlSelfVideo(false);
    }
  } else {
    const cameraList = await deviceManager.instance?.getDevicesList({
      type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
    });
    const hasCameraDevice = cameraList && cameraList.length > 0;
    // 无摄像头列表
    if (!hasCameraDevice && !isWeChat && !isApp) {
      TUIMessageBox({
        title: t('Note'),
        message: t('Camera not detected on current device'),
        appendToRoomContainer: true,
        confirmButtonText: t('Sure'),
      });
      return;
    }
    // 有摄像头列表
    roomEngine.instance?.setLocalVideoView({
      view: `${roomStore.localStream.userId}_${roomStore.localStream.streamType}`,
    });
    if (isMobile) {
      if (isH5) {
        const trtcCloud = roomEngine.instance?.getTRTCCloud();
        trtcCloud.enableSmallVideoStream(false, SMALL_VIDEO_ENC_PARAM);
      }
      await roomEngine.instance?.openLocalCamera({ isFrontCamera: basicStore.isFrontCamera });
    } else {
      await roomEngine.instance?.openLocalCamera();
    }
  }
  showVideoSettingTab.value = false;
}


/**
 * Handling host or administrator turn on/off camera signalling
 *
 * 处理主持人或管理员打开/关闭摄像头信令
**/
const showRequestOpenCameraDialog: Ref<boolean> = ref(false);
const requestOpenCameraRequestId: Ref<string> = ref('');
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { userId, requestAction, requestId } = eventInfo.request;
  if (requestAction === TUIRequestAction.kRequestToOpenRemoteCamera) {
    const userRole = roomStore.getUserRole(userId) === TUIRole.kRoomOwner ? t('RoomOwner') : t('Admin');
    dialogContent.value = t('Sb invites you to turn on the camera', { role: userRole });
    requestOpenCameraRequestId.value = requestId;
    showRequestOpenCameraDialog.value = true;
  }
}

// 接受主持人邀请，打开摄像头
async function handleAccept() {
  roomStore.setCanControlSelfVideo(true);
  roomEngine.instance?.setLocalVideoView({
    view: `${roomStore.localStream.userId}_${roomStore.localStream.streamType}`,
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
  TUIRoomEngine.once('ready', () => {
    roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
    roomEngine.instance?.on(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
  });
})


onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.off(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
});

</script>

<style lang="scss" scoped>

$videoTabWidth: 320px;

.video-control-container {
    position: relative;
    .video-tab {
      position: absolute;
      bottom: 90px;
      left: -60px;
      width: $videoTabWidth;
      background: #FFFFFF;
      padding: 20px;
    }
  }
  .agree, .cancel{
    padding: 14px;
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1C66E5;
    font-size: 16px;
    font-weight: 500;
  }
  .cancel{
    color: #4F586B;
  }
 .cancel-button {
  margin-left: 20px;
}
</style>
