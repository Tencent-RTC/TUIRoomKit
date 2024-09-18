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
import { ref, Ref, watch, defineProps } from 'vue';
import { useRoomStore } from '../../stores/room';
import { storeToRefs } from 'pinia';
import TuiSelect from './base/Select';
import TuiOption from './base/Option';

import {
  TRTCDeviceInfo,
  TUIDeviceInfo,
  TUIMediaDeviceType,
} from '@tencentcloud/tuiroom-engine-js';
import useDeviceManager from '../../hooks/useDeviceManager';
const { deviceManager } = useDeviceManager();

interface Props {
  deviceType: string;
  onChange?: (id: string) => void;
  disabled?: boolean;
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

const deviceList: Ref<TRTCDeviceInfo[]> = ref(getDeviceList());
const currentDeviceId = ref(getInitDeviceId());

function getInitDeviceId() {
  if (deviceType === 'camera') {
    return currentCameraId.value;
  }
  if (deviceType === 'microphone') {
    return currentMicrophoneId.value;
  }
  if (deviceType === 'speaker') {
    return currentSpeakerId.value;
  }
  return '';
}

if (deviceType === 'camera') {
  watch(
    currentCameraId,
    val => {
      if (currentDeviceId.value !== val) {
        currentDeviceId.value = val;
      }
    },
    { immediate: true }
  );
}

if (deviceType === 'microphone') {
  watch(
    currentMicrophoneId,
    val => {
      if (currentDeviceId.value !== val) {
        currentDeviceId.value = val;
      }
    },
    { immediate: true }
  );
}

if (deviceType === 'speaker') {
  watch(
    currentSpeakerId,
    val => {
      if (currentDeviceId.value !== val) {
        currentDeviceId.value = val;
      }
    },
    { immediate: true }
  );
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
      try {
        await deviceManager.instance?.setCurrentDevice({
          type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
          deviceId,
        });
        roomStore.setCurrentCameraId(deviceId);
      } catch (error) {
        if (
          cameraList.value
            .map((item: TUIDeviceInfo) => item.deviceId)
            .includes(currentCameraId.value)
        ) {
          currentDeviceId.value = currentCameraId.value;
        }
      }
      break;
    case 'microphone':
      try {
        await deviceManager.instance?.setCurrentDevice({
          type: TUIMediaDeviceType.kMediaDeviceTypeAudioInput,
          deviceId,
        });
        roomStore.setCurrentMicrophoneId(deviceId);
      } catch (error) {
        if (
          microphoneList.value
            .map((item: TUIDeviceInfo) => item.deviceId)
            .includes(currentMicrophoneId.value)
        ) {
          currentDeviceId.value = currentMicrophoneId.value;
        }
      }
      break;
    case 'speaker':
      try {
        await deviceManager.instance?.setCurrentDevice({
          type: TUIMediaDeviceType.kMediaDeviceTypeAudioOutput,
          deviceId,
        });
        roomStore.setCurrentSpeakerId(deviceId);
      } catch (error) {
        if (
          speakerList.value
            .map((item: TUIDeviceInfo) => item.deviceId)
            .includes(currentSpeakerId.value)
        ) {
          currentDeviceId.value = currentSpeakerId.value;
        }
      }
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
