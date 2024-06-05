<!--
  * Name: DeviceSelect
  * @param deviceType String required
  * @param size String 'large'|'medium'|'small'
  * Usage:
  * Use <device-select></device-select> in template
-->
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
      v-for="item in deviceList"
      :key="item.deviceId"
      :label="item.deviceName"
      :value="item.deviceId"
    />
  </tui-select>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import { useRoomStore } from '../../stores/room';
import { storeToRefs } from 'pinia';
import TuiSelect from './base/Select.vue';
import TuiOption from './base/Option.vue';

import { TRTCDeviceInfo, TUIMediaDeviceType } from '@tencentcloud/tuiroom-engine-js';
import useDeviceManager from '../../hooks/useDeviceManager';
const { deviceManager } = useDeviceManager();

interface Props {
  deviceType: string,
  onChange?: (id: string) => void,
  disabled?: boolean
}
// eslint-disable-next-line vue/no-setup-props-destructure
const { deviceType, onChange, disabled = false } = defineProps<Props>();

const roomStore = useRoomStore();
const {
  cameraList,
  microphoneList,
  speakerList,
  currentCameraId,
  currentMicrophoneId,
  currentSpeakerId,
} = storeToRefs(roomStore);

// @ts-ignore
const deviceList: Ref<TRTCDeviceInfo[]> = ref(getDeviceList());
const currentDeviceId = ref(getInitDeviceId());

function getInitDeviceId() {
  if (deviceType === 'camera') {
    return currentCameraId;
  }
  if (deviceType === 'microphone') {
    return currentMicrophoneId;
  }
  if (deviceType === 'speaker') {
    return currentSpeakerId;
  }
  return '';
}

function getDeviceList() {
  if (deviceType === 'camera') {
    return cameraList;
  }
  if (deviceType === 'microphone') {
    return microphoneList;
  }
  if (deviceType === 'speaker') {
    return speakerList;
  }
  return [];
}

async function handleChange(deviceId: string) {
  onChange && onChange(deviceId);
  switch (deviceType) {
    case 'camera':
      await deviceManager.instance?.setCurrentDevice({
        type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
        deviceId,
      });
      roomStore.setCurrentCameraId(deviceId);
      break;
    case 'microphone':
      await deviceManager.instance?.setCurrentDevice({
        type: TUIMediaDeviceType.kMediaDeviceTypeAudioInput,
        deviceId,
      });
      roomStore.setCurrentMicrophoneId(deviceId);
      break;
    case 'speaker':
      await deviceManager.instance?.setCurrentDevice({
        type: TUIMediaDeviceType.kMediaDeviceTypeAudioOutput,
        deviceId,
      });
      roomStore.setCurrentSpeakerId(deviceId);
      break;
    default:
      break;
  }
}
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
