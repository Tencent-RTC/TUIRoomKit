<template>
  <TUISelect
    v-model="currentDeviceId"
    :placeholder="t('AudioSettingPanel.SelectMicrophone')"
    class="select"
    :disabled="disabled"
    :teleported="false"
    :popper-append-to-body="false"
    @change="handleChange"
  >
    <TUIOption
      v-for="item in microphoneList"
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
const { microphoneList, currentMicrophone, setCurrentMicrophone, getMicrophoneList } = useDeviceState();

const { t } = useUIKit();

interface Props {
  onChange?: (id: string) => void;
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});
const currentDeviceId = ref(currentMicrophone.value?.deviceId);

watch(
  () => currentMicrophone.value?.deviceId,
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
    await setCurrentMicrophone({ deviceId });
  } catch (error) {
    if (
      currentMicrophone.value?.deviceId
      && microphoneList.value
        .map((item: TUIDeviceInfo) => item.deviceId)
        .includes(currentMicrophone.value?.deviceId)
    ) {
      currentDeviceId.value = currentMicrophone.value?.deviceId;
    }
  }
}

onBeforeMount(async () => {
  TUIRoomEngine.once('ready', async () => {
    await getMicrophoneList();
  });
});
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
