<!--
  * 名称: IconButton
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * 使用方式：
  * 在 template 中使用 <audio-control />
-->
<template>
  <div class="audio-control-container">
    <icon-button
      ref="audioIconButtonRef"
      title="麦克风"
      :has-more="true"
      :show-more="showAudioSettingTab"
      :disabled="isLocalAudioIconDisable"
      @click-icon="toggleMuteAudio"
      @click-more="handleMore"
    >
      <audio-icon
        :audio-volume="localStream.audioVolume"
        :is-muted="isLocalAudioMuted"
        :is-disabled="isLocalAudioIconDisable"
      ></audio-icon>
    </icon-button>
    <audio-setting-tab
      v-show="showAudioSettingTab"
      ref="audioSettingRef"
      class="audio-tab"
    ></audio-setting-tab>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, Ref, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';

import TUIRoomCore from '../../tui-room-core';
import IconButton from '../common/IconButton.vue';
import AudioSettingTab from '../base/AudioSettingTab.vue';
import { useBasicStore } from '../../stores/basic';
import { useStreamStore } from '../../stores/stream';
import AudioIcon from '../base/AudioIcon.vue';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../constants/message';

const basicStore = useBasicStore();
const streamStore = useStreamStore();
const { localStream, isDefaultOpenMicrophone, hasStartedMicrophone, isLocalAudioMuted } = storeToRefs(streamStore);
const { isLocalAudioIconDisable } = storeToRefs(basicStore);

const showAudioSettingTab: Ref<boolean> = ref(false);
const audioIconButtonRef = ref<InstanceType<typeof IconButton>>();
const audioSettingRef = ref<InstanceType<typeof AudioSettingTab>>();

watch(isDefaultOpenMicrophone, (val) => {
  streamStore.setIsLocalAudioMuted(!val);
}, { immediate: true });

watch(localStream, (val) => {
  streamStore.setIsLocalAudioMuted(!val.isAudioStreamAvailable);
}, { immediate: true });

function toggleMuteAudio() {
  if (isLocalAudioIconDisable.value) {
    ElMessage({
      type: 'warning',
      message: WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_MUTE_ALL,
      duration: MESSAGE_DURATION.NORMAL,
    });
    return;
  }

  streamStore.setIsLocalAudioMuted(!isLocalAudioMuted.value);
  if (!isLocalAudioMuted.value && !hasStartedMicrophone.value) {
    TUIRoomCore.startMicrophone();
    streamStore.setHasStartedMicrophone(true);
    return;
  }
  TUIRoomCore.muteLocalMicrophone(isLocalAudioMuted.value);
  streamStore.updateLocalStream({
    isAudioStreamAvailable: !isLocalAudioMuted.value,
  });
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

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick, true);
});

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

$audioTabWidth: 320px;
// $videoTabHeight: 399px;
$audioTabHeight: 264px;

.audio-control-container {
  position: relative;
  .audio-tab {
    position: absolute;
    top: -($audioTabHeight + 10px);
    left: 15px;
    width: $audioTabWidth;
    height: $audioTabHeight;
    background: $toolBarBackgroundColor;
    padding: 20px;
  }
}
</style>
