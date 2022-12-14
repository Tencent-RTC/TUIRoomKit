<!--
  * Name: VideoTab
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * Usage:
  * Use <video-tab></video-tab> in the template
  *
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
        <span class="title">{{ t('Camera') }}</span>
        <device-select
          :class="isDetailMode ? 'detail-select' : ''"
          device-type="camera"
        ></device-select>
      </div>
      <div v-if="isDetailMode" class="item-setting">
        <span class="title">{{ t('Preview') }}</span>
        <div id="test-camera-preview" class="video-preview"></div>
        <el-checkbox
          v-if="isDetailMode"
          v-model="isLocalStreamMirror"
          class="mirror-checkbox custom-element-class"
          :label="t('Mirror')"
        />
      </div>
    </div>
    <div v-if="isSampleMode" :class="['item-setting-container', isSampleMode && 'hasDividingLine']">
      <span class="title">{{ t('Resolution') }}</span>
      <video-profile></video-profile>
    </div>
    <div v-if="isSampleMode" :class="['item-setting-container', isSampleMode && 'hasDividingLine']">
      <!-- TODO: <div class="item">美颜与虚拟背景</div> -->
      <div class="item" @click="handleMoreCameraSetting">{{ t('More Camera Settings') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, Ref, watch, onMounted, onUnmounted } from 'vue';
import DeviceSelect from './DeviceSelect.vue';
import VideoProfile from './VideoProfile.vue';
import { useBasicStore } from '../../stores/basic';
import { SettingMode } from '../../constants/render';
import { isElectronEnv } from '../../utils/utils';
import { useI18n } from 'vue-i18n';

import useGetRoomEngine from '../../hooks/useRoomEngine';
import { TRTCVideoMirrorType, TRTCVideoRotation, TRTCVideoFillMode } from '@tencentcloud/tuiroom-engine-js';
const roomEngine = useGetRoomEngine();
const isElectron = isElectronEnv();

interface Props {
  mode?: SettingMode,
}
const props = defineProps<Props>();
const settingMode = props.mode || SettingMode.SIMPLE;
const isSampleMode = computed(() => settingMode === SettingMode.SIMPLE);
const isDetailMode = computed(() => settingMode === SettingMode.DETAIL);

const basicStore = useBasicStore();

const isLocalStreamMirror: Ref<boolean> = ref(basicStore.isLocalStreamMirror);
watch(isLocalStreamMirror, async (val: boolean) => {
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  await trtcCloud.setLocalRenderParams({
    mirrorType: val ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
    rotation: TRTCVideoRotation.TRTCVideoRotation0,
    fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
  });
  basicStore.setIsLocalStreamMirror(val);
});

const { t } = useI18n();

/**
 * Click [More Camera Settings].
 *
 * 点击【更多摄像头设置】
**/
function handleMoreCameraSetting() {
  basicStore.setShowSettingDialog(true);
  basicStore.setActiveSettingTab('video');
}

if (isDetailMode.value) {
  onMounted(async () => {
    roomEngine.instance?.startCameraDeviceTest({ view: 'test-camera-preview' });
    if (isElectron) {
      // Electron 需要首次设置 mirrorType
      const trtcCloud = roomEngine.instance?.getTRTCCloud();
      await trtcCloud?.setLocalRenderParams({
        mirrorType: isLocalStreamMirror ?
          TRTCVideoMirrorType.TRTCVideoMirrorType_Enable : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
        rotation: TRTCVideoRotation.TRTCVideoRotation0,
        fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
      });
    }
  });

  onUnmounted(() => {
    roomEngine.instance?.stopCameraDeviceTest();
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
