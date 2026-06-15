<template>
  <TUISelect
    v-model="currentDeviceId"
    :placeholder="t('VideoSettingPanel.SelectCamera')"
    class="select"
    :disabled="disabled"
    :teleported="false"
    :popper-append-to-body="false"
    @change="handleChange"
  >
    <TUIOption
      v-for="item in cameraList"
      :key="item.deviceId"
      :label="item.deviceName"
      :value="item.deviceId"
    />
  </TUISelect>
</template>

<script setup lang="ts">
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { ref, watch, defineProps, withDefaults, onBeforeMount } from 'vue';
import { TUISelect, TUIOption } from '@tencentcloud/uikit-base-component-vue3';
import TUIRoomEngine, { TUIDeviceInfo } from '@tencentcloud/tuiroom-engine-js';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
const { cameraList, currentCamera, setCurrentCamera, getCameraList } = useDeviceState();

const { t } = useUIKit();

interface Props {
  onChange?: (id: string) => void;
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});
const currentDeviceId = ref(currentCamera.value?.deviceId);

watch(
  () => currentCamera.value?.deviceId,
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
    await setCurrentCamera({
      deviceId,
    });
  } catch (error) {
    if (
      currentCamera.value?.deviceId &&
      cameraList.value
        .map((item: TUIDeviceInfo) => item.deviceId)
        .includes(currentCamera.value?.deviceId)
    ) {
      currentDeviceId.value = currentCamera.value?.deviceId;
    }
  }
}

onBeforeMount(async () => {
  TUIRoomEngine.once('ready', async () => {
    await getCameraList();
  });
})
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
