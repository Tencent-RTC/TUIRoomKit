<!--
  * 名称: VideoTab
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * 使用方式：
  * 在 template 中使用 <video-tab></video-tab>
-->
<template>
  <div class="video-tab">
    <div :class="['item-setting-container', isSampleMode && 'hasDividingLine']">
      <div class="item-setting">
        <span class="title">摄像头</span>
        <device-select
          :class="isDetailMode ? 'detail-select' : ''"
          device-type="camera"
        ></device-select>
      </div>
      <div v-if="isDetailMode" class="item-setting">
        <span class="title">视频画面</span>
        <div ref="testCameraPreviewRef" class="video-preview"></div>
        <el-checkbox
          v-if="isDetailMode"
          v-model="isLocalStreamMirror"
          class="mirror-checkbox custom-element-class"
          label="翻转镜像"
        />
      </div>
    </div>
    <div v-if="isSampleMode" :class="['item-setting-container', isSampleMode && 'hasDividingLine']">
      <span class="title">分辨率</span>
      <video-profile></video-profile>
    </div>
    <div v-if="isSampleMode" :class="['item-setting-container', isSampleMode && 'hasDividingLine']">
      <!-- TODO: <div class="item">美颜与虚拟背景</div> -->
      <div class="item" @click="handleMoreCameraSetting">更多摄像头设置</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, Ref, watch, onMounted, onUnmounted } from 'vue';
import DeviceSelect from './DeviceSelect.vue';
import VideoProfile from './VideoProfile.vue';
import { useBasicStore } from '../../stores/basic';
import { useRoomStore } from '../../stores/room';
import TUIRoomCore from '../../tui-room-core';
import { storeToRefs } from 'pinia';
import { SettingMode } from '../../constants/render';

interface Props {
  mode?: SettingMode,
}
const props = defineProps<Props>();
const settingMode = props.mode || SettingMode.SIMPLE;
const isSampleMode = computed(() => settingMode === SettingMode.SIMPLE);
const isDetailMode = computed(() => settingMode === SettingMode.DETAIL);

const testCameraPreviewRef = ref();

const basicStore = useBasicStore();

const isLocalStreamMirror: Ref<boolean> = ref(basicStore.isLocalStreamMirror);
watch(isLocalStreamMirror, (val: boolean) => {
  TUIRoomCore.setVideoMirror(val);
  basicStore.setIsLocalStreamMirror(val);
});

const roomStore = useRoomStore();
const { currentCameraId } = storeToRefs(roomStore);

// 点击【更多摄像头设置】
function handleMoreCameraSetting() {
  basicStore.setShowSettingDialog(true);
  basicStore.setActiveSettingTab('video');
}

if (isDetailMode.value) {
  watch(currentCameraId, (val) => {
    TUIRoomCore.setCurrentCamera(val);
  });

  onMounted(() => {
    TUIRoomCore.startCameraDeviceTest(testCameraPreviewRef.value);
  });

  onUnmounted(() => {
    TUIRoomCore.stopCameraDeviceTest();
  });
}

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';
@import '../../assets/style/element-custom.scss';

.video-tab {
  border-radius: 4px;
  font-size: 14px;
  .item-setting-container {
    padding-bottom: 20px;
    &:not(:first-child) {
      padding-top: 20px;
    }
    &.hasDividingLine:not(:last-child) {
      border-bottom: 1px solid $roomBackgroundColor;
    }
    .item-setting {
      &:not(:last-child) {
        margin-bottom: 20px;
      }
    }
  }
  .title {
    display: inline-block;
    margin-bottom: 10px;
    width: 100%;
  }
  .detail-select {
    width: 309px;
    height: 32px;
  }
  .video-preview {
    width: 402px;
    height: 226px;
    background-color: $roomBackgroundColor;
  }
  .mirror-checkbox {
    margin-top: 10px;
  }
  .item {
    width: 100%;
    height: 20px;
    margin-bottom: 20px;
    cursor: pointer;
  }
}
</style>
