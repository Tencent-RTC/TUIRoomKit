<template>
  <tui-select
    v-model="localVideoQuality"
    placeholder="placeholder"
    class="select"
    :teleported="false"
    :popper-append-to-body="false"
  >
    <tui-option
      v-for="(item, index) in videoQualityList"
      :key="index"
      :label="item.label"
      :value="item.value"
    />
  </tui-select>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import TuiSelect from '../../../components/common/base/Select';
import TuiOption from '../../../components/common/base/Option';

import { TUIVideoQuality } from '@tencentcloud/tuiroom-engine-js';
import useVideoDeviceState from '../../hooks/useVideoDeviceState';

const { localVideoQuality, videoQualityList, camera } = useVideoDeviceState();

watch(localVideoQuality, (val: TUIVideoQuality) => {
  camera.updateVideoQuality({ quality: val });
});
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
