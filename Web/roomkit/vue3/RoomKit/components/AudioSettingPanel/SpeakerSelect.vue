<template>
  <TUISelect
    v-model="currentDeviceId"
    :placeholder="t('AudioSettingPanel.SelectSpeaker')"
    class="select"
    :disabled="disabled"
    :teleported="false"
    :popper-append-to-body="false"
    @change="handleChange"
  >
    <TUIOption
      v-for="item in speakerList"
      :key="item.deviceId"
      :label="item.deviceName"
      :value="item.deviceId"
    />
  </TUISelect>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, withDefaults, onBeforeMount } from 'vue';
import { TUISelect, TUIOption, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
import type { TUIDeviceInfo } from '@tencentcloud/tuiroom-engine-js';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';

const { t } = useUIKit();

interface Props {
  onChange?: (id: string) => void;
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const { speakerList, currentSpeaker, setCurrentSpeaker, getSpeakerList } = useDeviceState();
const currentDeviceId = ref(currentSpeaker.value?.deviceId);

watch(
  () => currentSpeaker.value?.deviceId,
  (val) => {
    if (currentDeviceId.value !== val) {
      currentDeviceId.value = val;
    }
  },
  { immediate: true },
);

async function handleChange(deviceId: string) {
  props.onChange?.(deviceId);
  try {
    await setCurrentSpeaker({ deviceId });
  } catch (error) {
    if (
      currentSpeaker.value?.deviceId
      && speakerList.value
        .map((item: TUIDeviceInfo) => item.deviceId)
        .includes(currentSpeaker.value?.deviceId)
    ) {
      currentDeviceId.value = currentSpeaker.value?.deviceId;
    }
  }
}

onBeforeMount(async () => {
  TUIRoomEngine.once('ready', async () => {
    await getSpeakerList();
  });
});
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
