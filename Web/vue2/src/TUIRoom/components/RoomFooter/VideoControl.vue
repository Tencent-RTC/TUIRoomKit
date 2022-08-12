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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Message } from 'element-ui';

import IconButton from '../common/IconButton.vue';
import VideoSettingTab from '../base/VideoSettingTab.vue';
import TUIRoomCore from '../../tui-room-core';

import { useBasicStore } from '../../stores/basic';
import { useRoomStore } from '../../stores/room';
import { ICON_NAME } from '../../constants/icon';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../constants/message';

const basicStore = useBasicStore();
const roomStore = useRoomStore();

const { isDefaultOpenCamera, localStream, isLocalVideoMuted } = storeToRefs(roomStore);
const { isLocalVideoIconDisable, isMuteAllVideo, isAudience } = storeToRefs(basicStore);

const showVideoSettingTab: Ref<boolean> = ref(false);
const videoIconButtonRef = ref<InstanceType<typeof IconButton>>();
const videoSettingRef = ref<InstanceType<typeof VideoSettingTab>>();

const iconName = computed(() => {
  if (isLocalVideoIconDisable.value) {
    return ICON_NAME.CameraOffDisabled;
  }
  return isLocalVideoMuted.value ? ICON_NAME.CameraOff : ICON_NAME.CameraOn;
});

watch(isDefaultOpenCamera, (val) => {
  isLocalVideoMuted.value = !val;
}, { immediate: true });

watch(localStream, (val) => {
  isLocalVideoMuted.value = !val.isVideoStreamAvailable;
}, { immediate: true });

function toggleMuteVideo() {
  if (isLocalVideoIconDisable.value) {
    let warningMessage = '';
    if (isMuteAllVideo.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_CAMERA_FAIL_MUTE_ALL;
    } else if (isAudience.value) {
      warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_CAMERA_FAIL_AUDIENCE;
    }
    Message({
      type: 'warning',
      message: warningMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    return;
  }

  roomStore.setIsLocalVideoMuted(!isLocalVideoMuted.value);
  // 关闭本地摄像头的时候应该熄灭摄像头灯，使用 stopCameraPreview 方法
  if (isLocalVideoMuted.value) {
    TUIRoomCore.stopCameraPreview();
  } else {
    const previewDom = document.getElementById(`${roomStore.localStream.userId}_main`);
    previewDom && TUIRoomCore.startCameraPreview(previewDom);
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
