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
      @click-icon="toggleMuteAudio"
      @click-more="handleMore"
    >
      <audio-icon :audio-volume="localStream.audioVolume" :is-muted="isMuted"></audio-icon>
    </icon-button>
    <audio-setting-tab
      v-show="showAudioSettingTab"
      ref="audioSettingRef"
      class="audio-tab"
    ></audio-setting-tab>
  </div>
</template>

<script setup lang="ts">
import IconButton from '../common/IconButton.vue';
import AudioSettingTab from '../base/AudioSettingTab.vue';
import { ref, onMounted, Ref, onUnmounted, watch } from 'vue';
import TUIRoomCore from '../../tui-room-core';
import { useStreamStore } from '../../stores/stream';
import AudioIcon from '../base/AudioIcon.vue';
import { storeToRefs } from 'pinia';

const streamStore = useStreamStore();
const { localStream, isDefaultOpenMicrophone, hasStartedMicrophone } = storeToRefs(streamStore);

const isMuted: Ref<boolean> = ref(false);
const showAudioSettingTab: Ref<boolean> = ref(false);
const audioIconButtonRef = ref<InstanceType<typeof IconButton>>();
const audioSettingRef = ref<InstanceType<typeof AudioSettingTab>>();

watch(isDefaultOpenMicrophone, (val) => {
  isMuted.value = !val;
}, { immediate: true });

function toggleMuteAudio() {
  isMuted.value = !isMuted.value;
  if (!isMuted.value && !hasStartedMicrophone.value) {
    TUIRoomCore.startMicrophone();
    streamStore.setHasStartedMicrophone(true);
    return;
  }
  TUIRoomCore.muteLocalMicrophone(isMuted.value);
  streamStore.updateLocalStream({
    isAudioStreamAvailable: !isMuted.value,
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
