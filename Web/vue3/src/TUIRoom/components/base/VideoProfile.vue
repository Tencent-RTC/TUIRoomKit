<!--
  * Name: DeviceSelect
  * @param deviceType String required
  * @param size String 'large'|'medium'|'small'
  * Usage:
  * Use <device-select></device-select> in template
  *
  * 名称: DeviceSelect
  * @param deviceType String required
  * @param size String 'large'|'medium'|'small'
  * 使用方式：
  * 在 template 中使用 <device-select></device-select>
-->
<template>
  <el-select
    v-model="localVideoQuality"
    placeholder="placeholder"
    class="select custom-element-class"
    :teleported="false"
    :popper-append-to-body="false"
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
import { computed, watch } from 'vue';
import { useI18n } from '../../locales';

import TUIRoomEngine, { TUIVideoQuality } from '@tencentcloud/tuiroom-engine-js';
import { useRoomStore } from '../../stores/room';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { storeToRefs } from 'pinia';

const roomEngine = useGetRoomEngine();
const roomStore = useRoomStore();
const { localVideoQuality } = storeToRefs(roomStore);

const { t } = useI18n();

const videoProfileList = computed(() => [
  { label: t('Low Definition'), value: TUIVideoQuality.kVideoQuality_360p },
  { label: t('Standard Definition'), value: TUIVideoQuality.kVideoQuality_540p },
  { label: t('High Definition'), value: TUIVideoQuality.kVideoQuality_720p },
  { label: t('Super Definition'), value: TUIVideoQuality.kVideoQuality_1080p }]);

watch(localVideoQuality, (val: TUIVideoQuality) => {
  roomEngine.instance?.updateVideoQuality({ quality: val });
});

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.updateVideoQuality({ quality: localVideoQuality.value });
});
</script>

<style lang="scss" scoped>
@import '../../assets/style/element-custom.scss';

.select {
  width: 280px;
  height: 32px;
  font-size: 14px;
}
</style>
