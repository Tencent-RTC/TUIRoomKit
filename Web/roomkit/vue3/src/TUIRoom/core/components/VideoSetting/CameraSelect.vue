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
      v-for="item in cameraList"
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
import { TUIDeviceInfo } from '@tencentcloud/tuiroom-engine-js';
import useVideoDeviceState from '../../hooks/useVideoDeviceState';
const { cameraList, currentCameraId, camera } = useVideoDeviceState();

interface Props {
  onChange?: (id: string) => void;
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});
const currentDeviceId = ref(currentCameraId.value);

watch(
  currentCameraId,
  val => {
    if (currentDeviceId.value !== val) {
      currentDeviceId.value = val;
    }
  },
  { immediate: true }
);

async function handleChange(deviceId: string) {
  props.onChange && props.onChange(deviceId);
  try {
    await camera.setCurrentDevice({
      deviceId,
    });
  } catch (error) {
    if (
      cameraList.value
        .map((item: TUIDeviceInfo) => item.deviceId)
        .includes(currentCameraId.value)
    ) {
      currentDeviceId.value = currentCameraId.value;
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
