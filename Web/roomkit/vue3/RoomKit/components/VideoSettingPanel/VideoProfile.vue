<template>
  <TUISelect
    v-model="localVideoQuality"
    :placeholder="t('VideoSettingPanel.Resolution')"
    class="select"
    :teleported="false"
    :popper-append-to-body="false"
  >
    <TUIOption
      v-for="(item, index) in videoQualityList"
      :key="index"
      :label="item.label"
      :value="item.value"
    />
  </TUISelect>
</template>

<script setup lang="ts">
import { watch, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { TUISelect, TUIOption, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
import { VideoQuality } from 'tuikit-atomicx-vue3';

const { t } = useUIKit();

const videoQualityList: ComputedRef<
  { label: string; value: VideoQuality }[]
> = computed(() => [
  { label: t('VideoSettingPanel.LowDefinition'), value: VideoQuality.Quality360P },
  {
    label: t('VideoSettingPanel.StandardDefinition'),
    value: VideoQuality.Quality540P,
  },
  { label: t('VideoSettingPanel.HighDefinition'), value: VideoQuality.Quality720P },
  {
    label: t('VideoSettingPanel.SuperDefinition'),
    value: VideoQuality.Quality1080P,
  },
]);

const { localVideoQuality, updateVideoQuality } = useDeviceState();

watch(localVideoQuality, (val: VideoQuality) => {
  updateVideoQuality({ quality: val });
}, { immediate: true });
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
