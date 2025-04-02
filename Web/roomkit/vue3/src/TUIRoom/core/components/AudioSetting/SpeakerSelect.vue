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
      v-for="item in speakerList"
      :key="item.deviceId"
      :label="item.deviceName"
      :value="item.deviceId"
    />
  </tui-select>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, withDefaults } from 'vue';
import { TUIDeviceInfo } from '@tencentcloud/tuiroom-engine-js';
import TuiSelect from '../../../components/common/base/Select';
import TuiOption from '../../../components/common/base/Option';
import useAudioDeviceState from '../../hooks/useAudioDeviceState';

interface Props {
  onChange?: (id: string) => void;
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const { speakerList, currentSpeakerId, speaker } = useAudioDeviceState();
const currentDeviceId = ref(currentSpeakerId.value);

watch(
  currentSpeakerId,
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
    await speaker.setCurrentDevice({ deviceId });
  } catch (error) {
    if (
      speakerList.value
        .map((item: TUIDeviceInfo) => item.deviceId)
        .includes(currentSpeakerId.value)
    ) {
      currentDeviceId.value = currentSpeakerId.value;
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
