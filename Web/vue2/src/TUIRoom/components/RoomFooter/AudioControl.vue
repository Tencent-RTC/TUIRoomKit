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
      :title="t('Tips')"
      :modal="true"
      :show-close="false"
      :close-on-click-modal="false"
      width="500px"
      :append-to-room-container="true"
      :confirm-button="t('Turn on the microphone')"
      :cancel-button="t('Keep it closed')"
      @confirm="handleAccept"
      @cancel="handleReject"
    >
      <span>{{ dialogContent }}</span>
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
import { ref, Ref, onUnmounted, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import TUIMessage from '../common/base/Message/index';
import Dialog from '../common/base/Dialog';
import { useRoomStore } from '../../stores/room';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../constants/message';
import { useI18n } from '../../locales';
import TUIRoomEngine, { TUIRoomEvents, TUIRequest, TUIRequestAction, TUIRole } from '@tencentcloud/tuiroom-engine-js';
import useRoomEngine from '../../hooks/useRoomEngine';
import { isMobile, isWeChat } from '../../utils/environment';
import TuiButton from '../common/base/Button.vue';
import AudioMediaControl from '../common/AudioMediaControl.vue';
import { useBasicStore } from '../../stores/basic';
import TUIMessageBox from '../common/base/MessageBox/index';
import useMemberControlHooks from '../ManageMember/MemberControl/useMemberControlHooks';


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
const { getRequestIdList, getRequestFirstUserId } = useMemberControlHooks();

const emits = defineEmits(['click']);
const hasMore = computed(() => !isMobile);
const { t } = useI18n();
const dialogContent: Ref<string> = ref('');

function handleAudioMediaClick() {
  emits('click');
  toggleMuteAudio();
}

async function toggleMuteAudio() {
  if (isLocalAudioIconDisable.value) {
    let warningMessage = '';
    if (isAudience.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_AUDIENCE;
    } else if (isMicrophoneDisableForAllUser.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_MUTE_ALL;
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

// -------- 处理主持人/管理员打开/关闭麦克风信令 --------
const showRequestOpenMicDialog: Ref<boolean> = ref(false);
const requestOpenMicRequestId: Ref<string> = ref('');
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { userId, requestAction, requestId } = eventInfo.request;
  if (requestAction === TUIRequestAction.kRequestToOpenRemoteMicrophone) {
    // 主持人/管理员邀请打开麦克风，同意之后将会自动打开麦克风
    roomStore.setRequestId(TUIRequestAction.kRequestToOpenRemoteMicrophone, { userId, requestId });
    const requestFirstUserId = getRequestFirstUserId(TUIRequestAction.kRequestToOpenRemoteMicrophone);
    const userRole = roomStore.getUserRole(requestFirstUserId as string) === TUIRole.kRoomOwner ? t('RoomOwner') : t('Admin');
    dialogContent.value = t('Sb invites you to turn on the microphone', { role: userRole });
    requestOpenMicRequestId.value = requestId;
    showRequestOpenMicDialog.value = true;
  }
}
// 接受主持人邀请，打开麦克风
async function handleAccept() {
  roomStore.setCanControlSelfAudio(true);
  const requestList = getRequestIdList(TUIRequestAction.kRequestToOpenRemoteMicrophone);
  for (const inviteRequestId of requestList) {
    await roomEngine.instance?.responseRemoteRequest({
      requestId: inviteRequestId,
      agree: true,
    });
  }
  requestOpenMicRequestId.value = '';
  showRequestOpenMicDialog.value = false;
  roomStore.clearRequestId(TUIRequestAction.kRequestToOpenRemoteMicrophone);
}

// 保持静音
async function handleReject() {
  const requestList = getRequestIdList(TUIRequestAction.kRequestToOpenRemoteMicrophone);
  for (const inviteRequestId of requestList) {
    await roomEngine.instance?.responseRemoteRequest({
      requestId: inviteRequestId,
      agree: false,
    });
  }
  roomStore.clearRequestId(TUIRequestAction.kRequestToOpenRemoteMicrophone);
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
watch(isAudience, (newValue) => {
  if (newValue) {
    // 离开麦位sdk内部会closeMic，因此需要在此处同步业务逻辑
    basicStore.setIsOpenMic(false);
  }
});
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
.cancel-button {
  margin-left: 20px;
}
</style>
