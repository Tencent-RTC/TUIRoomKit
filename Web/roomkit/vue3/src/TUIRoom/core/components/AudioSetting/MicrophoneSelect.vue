<template>
  <tui-select
    v-model="currentDeviceId"
    placeholder="placeholder"
    class="select"
    :disabled="disabled"
    :teleported="false"
    :popper-append-to-body="false"
    @change="handleChange"
  >
    <tui-option
      v-for="item in microphoneList"
      :key="item.deviceId"
      :label="item.deviceName"
      :value="item.deviceId"
    />
  </tui-select>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, withDefaults } from 'vue';
import TuiSelect from '../../../components/common/base/Select';
import TuiOption from '../../../components/common/base/Option';
import useAudioDeviceState from '../../hooks/useAudioDeviceState';
import { TUIDeviceInfo } from '@tencentcloud/tuiroom-engine-js';
const { microphoneList, currentMicrophoneId, microphone } =
  useAudioDeviceState();

interface Props {
  onChange?: (id: string) => void;
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});
const currentDeviceId = ref(currentMicrophoneId.value);

watch(
  currentMicrophoneId,
  val => {
    if (currentDeviceId.value !== val) {
      currentDeviceId.value = val;
    }
  },
  { immediate: true }
);

async function handleChange(deviceId: string) {
  props.onChange?.(deviceId);
  try {
    await microphone.setCurrentDevice({ deviceId });
  } catch (error) {
    if (
      microphoneList.value
        .map((item: TUIDeviceInfo) => item.deviceId)
        .includes(currentMicrophoneId.value)
    ) {
      currentDeviceId.value = currentMicrophoneId.value;
    }
  }
}
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
