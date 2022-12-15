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
  <div class="audio-control-container" @click="emits('click')">
    <icon-button
      ref="audioIconButtonRef"
      :title="t('Mic')"
      :has-more="true"
      :show-more="showAudioSettingTab"
      :disabled="isLocalAudioIconDisable"
      @click-icon="toggleMuteAudio"
      @click-more="handleMore"
    >
      <audio-icon
        :audio-volume="localStream.audioVolume"
        :is-muted="!localStream.hasAudioStream"
        :is-disabled="isLocalAudioIconDisable"
      ></audio-icon>
    </icon-button>
    <audio-setting-tab
      v-show="showAudioSettingTab"
      ref="audioSettingRef"
      class="audio-tab"
    ></audio-setting-tab>
  </div>
  <el-dialog
    v-model="showRequestOpenMicDialog"
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
      {{ t('The host invites you to turn on the microphone') }}
    </span>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="handleAccept">{{ t('Turn on the microphone') }}</el-button>
        <el-button @click="handleReject">{{ t('Keep it closed') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, Ref, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';

import IconButton from '../common/IconButton.vue';
import AudioSettingTab from '../base/AudioSettingTab.vue';
import { useRoomStore } from '../../stores/room';
import AudioIcon from '../base/AudioIcon.vue';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../constants/message';
import { useI18n } from 'vue-i18n';
import TUIRoomEngine, { TUIRoomEvents, TUIRequest, TUIRequestAction } from '@tencentcloud/tuiroom-engine-js';
import useRoomEngine from '../../hooks/useRoomEngine';
const roomEngine = useRoomEngine();

const roomStore = useRoomStore();
const {
  isAudience,
  localStream,
  isLocalAudioIconDisable,
  enableAudio,
} = storeToRefs(roomStore);

const emits = defineEmits(['click']);

const showAudioSettingTab: Ref<boolean> = ref(false);
const audioIconButtonRef = ref<InstanceType<typeof IconButton>>();
const audioSettingRef = ref<InstanceType<typeof AudioSettingTab>>();
const { t } = useI18n();

function toggleMuteAudio() {
  if (isLocalAudioIconDisable.value) {
    let warningMessage = '';
    if (!enableAudio.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_MUTE_ALL;
    } else if (isAudience.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_AUDIENCE;
    }
    ElMessage({
      type: 'warning',
      message: t(warningMessage),
      duration: MESSAGE_DURATION.NORMAL,
    });
    return;
  }

  if (localStream.value.hasAudioStream) {
    roomEngine.instance?.closeLocalMicrophone();
    roomEngine.instance?.stopPushLocalAudio();
    // 如果是全员禁言状态下，用户主动关闭麦克风之后不能再自己打开
    if (!roomStore.enableAudio) {
      roomStore.setCanControlSelfAudio(false);
    }
  } else {
    roomEngine.instance?.openLocalMicrophone();
    roomEngine.instance?.startPushLocalAudio();
  }
  showAudioSettingTab.value = false;
}

function handleMore() {
  if (!showAudioSettingTab.value) {
    showAudioSettingTab.value = true;
  } else {
    showAudioSettingTab.value = false;
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (
    showAudioSettingTab.value
    && !audioIconButtonRef.value?.$el.contains(event.target)
    && !audioSettingRef.value?.$el.contains(event.target)
  ) {
    showAudioSettingTab.value = false;
  }
}

// -------- 处理主持人打开/关闭麦克风信令 --------
const showRequestOpenMicDialog: Ref<boolean> = ref(false);
const requestOpenMicRequestId: Ref<number> = ref(0);
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
  requestOpenMicRequestId.value = 0;
  showRequestOpenMicDialog.value = false;
}

// 保持静音
async function handleReject() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenMicRequestId.value,
    agree: false });
  requestOpenMicRequestId.value = 0;
  showRequestOpenMicDialog.value = false;
}

// 请求被取消
async function onRequestCancelled(eventInfo: { requestId: number }) {
  const { requestId } = eventInfo;
  if (requestOpenMicRequestId.value === requestId) {
    showRequestOpenMicDialog.value = false;
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

$audioTabWidth: 320px;

.audio-control-container {
  position: relative;
  .audio-tab {
    position: absolute;
    bottom: 90px;
    left: 15px;
    width: $audioTabWidth;
    background: $toolBarBackgroundColor;
    padding: 20px;
  }
}
</style>
