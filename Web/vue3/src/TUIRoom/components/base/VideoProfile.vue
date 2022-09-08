<!--
  * 名称: DeviceSelect
  * @param deviceType String required
  * @param size String 'large'|'medium'|'small'
  * 使用方式：
  * 在 template 中使用 <device-select></device-select>
-->
<template>
  <el-select
    v-model="videoProfile"
    placeholder="placeholder"
    class="select custom-element-class"
    :teleported="false"
  >
    <el-option
      v-for="(item, index) in videoProfileList"
      :key="index"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import TUIRoomCore, { TRTCVideoResolution } from '../../tui-room-core';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const videoProfile = ref('720P');

const videoProfileList = [
  { label: t('Smooth (360p, 15 fps)'), value: '360P' },
  { label: t('SD (540p, 15 fps)'), value: '540P' },
  { label: t('HD (720p, 30 fps)'), value: '720P' },
  { label: t('FHD (1080p, 30 fps)'), value: '1080P' }];

const videoProfileMap: Record<string, any> = {
  '360P': { videoResolution: TRTCVideoResolution.TRTCVideoResolution_640_360, fps: 15, bitrate: 800 },
  '540P': { videoResolution: TRTCVideoResolution.TRTCVideoResolution_960_540, fps: 15, bitrate: 900 },
  '720P': { videoResolution: TRTCVideoResolution.TRTCVideoResolution_1280_720, fps: 30, bitrate: 1500 },
  '1080P': { videoResolution: TRTCVideoResolution.TRTCVideoResolution_1920_1080, fps: 30, bitrate: 2000 },
};

watch(videoProfile, (val: string) => {
  const currentVideoProfileObj = videoProfileMap[val];
  TUIRoomCore.setVideoEncoderParam(currentVideoProfileObj);
}, { immediate: true });

</script>

<style lang="scss" scoped>
@import '../../assets/style/element-custom.scss';

.select {
  width: 280px;
  height: 32px;
  font-size: 14px;
}
</style>
