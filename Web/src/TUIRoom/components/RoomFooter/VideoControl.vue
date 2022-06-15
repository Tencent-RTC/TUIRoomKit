<!--
  * 名称: IconButton
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * 使用方式：
  * 在 template 中使用 <audio-control />
-->
<template>
  <div class="video-control-container">
    <icon-button
      ref="videoIconButtonRef"
      title="摄像头"
      :icon-name="iconName"
      :has-more="true"
      @click-icon="toggleMuteVideo"
      @click-more="handleMore"
    />
    <video-setting-tab
      v-show="showVideoSettingTab"
      ref="videoSettingRef"
      class="video-tab"
    ></video-setting-tab>
  </div>
</template>

<script setup lang="ts">
import IconButton from '../common/IconButton.vue';
import VideoSettingTab from '../base/VideoSettingTab.vue';
import { ref, computed, watch, onMounted, onUnmounted, Ref } from 'vue';
import TUIRoomCore from '../../tui-room-core';
import { useStreamStore } from '../../stores/stream';
import { storeToRefs } from 'pinia';

const streamStore = useStreamStore();

const { isDefaultOpenCamera, hasStartedCamera } = storeToRefs(streamStore);

const isMuted: Ref<boolean> = ref(false);
const showVideoSettingTab: Ref<boolean> = ref(false);
const videoIconButtonRef = ref<InstanceType<typeof IconButton>>();
const videoSettingRef = ref<InstanceType<typeof VideoSettingTab>>();

const iconName = computed((): string => (isMuted.value ? 'camera-off' : 'camera-on'));

watch(isDefaultOpenCamera, (val) => {
  isMuted.value = !val;
}, { immediate: true });

function toggleMuteVideo() {
  isMuted.value = !isMuted.value;
  if (!isMuted.value && !hasStartedCamera.value) {
    const previewDom = document.getElementById(`${streamStore.localStream.userId}_main`);
    previewDom && TUIRoomCore.startCameraPreview(previewDom);
    streamStore.setHasStartedCamera(true);
    return;
  }
  TUIRoomCore.muteLocalCamera(isMuted.value);
  streamStore.updateLocalStream({
    isVideoStreamAvailable: !isMuted.value,
  });
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

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick, true);
});

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

$videoTabWidth: 320px;
// $videoTabHeight: 306px;
$videoTabHeight: 276px;

.video-control-container {
  position: relative;
  .video-tab {
    position: absolute;
    top: -($videoTabHeight + 10px);
    left: -60px;
    width: $videoTabWidth;
    height: $videoTabHeight;
    background: $toolBarBackgroundColor;
    padding: 20px;
  }
}
</style>
