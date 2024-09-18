<!--
  * Name: DeviceSelect
  * @param deviceType String required
  * @param size String 'large'|'medium'|'small'
  * Usage:
  * Use <device-select></device-select> in template
  *
-->
<template>
  <tui-select
    v-model="localVideoQuality"
    placeholder="placeholder"
    class="select"
    :teleported="false"
    :popper-append-to-body="false"
  >
    <tui-option
      v-for="(item, index) in videoProfileList"
      :key="index"
      :label="item.label"
      :value="item.value"
    />
  </tui-select>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from '../../locales';
import TuiSelect from './base/Select';
import TuiOption from './base/Option';

import TUIRoomEngine, {
  TUIVideoQuality,
} from '@tencentcloud/tuiroom-engine-js';
import { useRoomStore } from '../../stores/room';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { storeToRefs } from 'pinia';

const roomEngine = useGetRoomEngine();
const roomStore = useRoomStore();
const { localVideoQuality } = storeToRefs(roomStore);

const { t } = useI18n();

const videoProfileList = computed(() => [
  { label: t('Low Definition'), value: TUIVideoQuality.kVideoQuality_360p },
  {
    label: t('Standard Definition'),
    value: TUIVideoQuality.kVideoQuality_540p,
  },
  { label: t('High Definition'), value: TUIVideoQuality.kVideoQuality_720p },
  { label: t('Super Definition'), value: TUIVideoQuality.kVideoQuality_1080p },
]);

watch(localVideoQuality, (val: TUIVideoQuality) => {
  roomEngine.instance?.updateVideoQuality({ quality: val });
});

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.updateVideoQuality({ quality: localVideoQuality.value });
});
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
