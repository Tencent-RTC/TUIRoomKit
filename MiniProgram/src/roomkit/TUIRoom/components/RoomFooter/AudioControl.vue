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
    <audio-media-control
      :has-more="hasMore"
      :is-muted="!localStream.hasAudioStream"
      :is-disabled="isLocalAudioIconDisable"
      :audio-volume="userVolumeObj[localStream.userId]"
      @click="handleAudioMediaClick"
    ></audio-media-control>
    <Dialog
      v-model="showRequestOpenMicDialog"
      :title="title"
      :modal="true"
      :show-close="false"
      :close-on-click-modal="false"
      width="500px"
      :append-to-room-container="true"
    >
      <span>
        {{ t('The host invites you to turn on the microphone') }}
      </span>
      <template v-if="isMobile" #cancel>
        <tui-button class="cancel" size="default" type="text" @click="handleReject">
          {{ t('Keep it closed') }}
        </tui-button>
      </template>
      <template v-if="isMobile" #agree>
        <tui-button class="agree" size="default" type="text" @click="handleAccept">{{ t('Turn on the microphone') }}</tui-button>
      </template>
      <template #footer>
        <tui-button
          class="agree-button"
          size="default"
          @click="handleAccept"
        >
          {{ t('Turn on the microphone') }}
        </tui-button>
        <tui-button class="cancel-button" size="default" type="primary" @click="handleReject">
          {{ t('Keep it closed') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, onUnmounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import TUIMessage from '../common/base/Message/index';
import Dialog from '../common/base/Dialog/index.vue';
import { useRoomStore } from '../../stores/room';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../constants/message';
import { useI18n } from '../../locales';
import { TUIRoomEngine, TUIRoomEvents, TUIRequest, TUIRequestAction } from '@tencentcloud/tuiroom-engine-wx';
import useRoomEngine from '../../hooks/useRoomEngine';
import { isMobile, isWeChat } from '../../utils/useMediaValue';
import TuiButton from '../common/base/Button.vue';
import AudioMediaControl from '../common/AudioMediaControl.vue';
import { useBasicStore } from '../../stores/basic';
import TUIMessageBox from '../common/base/MessageBox/index';


const roomEngine = useRoomEngine();

const roomStore = useRoomStore();
const basicStore = useBasicStore();

const {
  isAudience,
  localStream,
  isLocalAudioIconDisable,
  isMicrophoneDisableForAllUser,
  userVolumeObj,
} = storeToRefs(roomStore);

const emits = defineEmits(['click']);
const hasMore = computed(() => !isMobile);
const { t } = useI18n();
const title = computed(() => (isMobile ? '' : t('Tips')));

function handleAudioMediaClick() {
  emits('click');
  toggleMuteAudio();
}

async function toggleMuteAudio() {
  if (isLocalAudioIconDisable.value) {
    let warningMessage = '';
    if (isMicrophoneDisableForAllUser.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_MUTE_ALL;
    } else if (isAudience.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_AUDIENCE;
    }
    TUIMessage({
      type: 'warning',
      message: t(warningMessage),
      duration: MESSAGE_DURATION.NORMAL,
    });
    return;
  }
  if (localStream.value.hasAudioStream) {
    await roomEngine.instance?.muteLocalAudio();
    // 如果是全员禁言状态下，用户主动关闭麦克风之后不能再自己打开
    if (roomStore.isMicrophoneDisableForAllUser) {
      roomStore.setCanControlSelfAudio(false);
    }
  } else {
    const microphoneList = await roomEngine.instance?.getMicDevicesList();
    const hasMicrophoneDevice = microphoneList.length > 0;
    if (!hasMicrophoneDevice && !isWeChat) {
      TUIMessageBox({
        title: t('Note'),
        message: t('Microphone not detected on current device.'),
        appendToRoomContainer: true,
        confirmButtonText: t('Sure'),
      });
      return;
    }
    // 有麦克风列表且有权限
    await roomEngine.instance?.unmuteLocalAudio();
    if (!basicStore.isOpenMic) {
      roomEngine.instance?.openLocalMicrophone();
      basicStore.setIsOpenMic(true);
    }
  }
}

// -------- 处理主持人打开/关闭麦克风信令 --------
const showRequestOpenMicDialog: Ref<boolean> = ref(false);
const requestOpenMicRequestId: Ref<string> = ref('');
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { requestAction, requestId } = eventInfo.request;
  // 主持人邀请打开麦克风，同意之后将会自动打开麦克风
  if (requestAction === TUIRequestAction.kRequestToOpenRemoteMicrophone) {
    requestOpenMicRequestId.value = requestId;
    showRequestOpenMicDialog.value = true;
  }
}

// 接受主持人邀请，打开麦克风
async function handleAccept() {
  roomStore.setCanControlSelfAudio(true);
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenMicRequestId.value,
    agree: true,
  });
  requestOpenMicRequestId.value = '';
  showRequestOpenMicDialog.value = false;
}

// 保持静音
async function handleReject() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenMicRequestId.value,
    agree: false });
  requestOpenMicRequestId.value = '';
  showRequestOpenMicDialog.value = false;
}

// 请求被取消
async function onRequestCancelled(eventInfo: { requestId: string }) {
  const { requestId } = eventInfo;
  if (requestOpenMicRequestId.value === requestId) {
    showRequestOpenMicDialog.value = false;
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
  .agree, .cancel{
    padding: 14px;
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--active-color-1);
    font-size: 16px;
    font-weight: 500;
  }
  .cancel{
    color: var(--font-color-4);
  }
  .cancel-button {
    margin-left: 20px;
  }
</style>
