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
    v-model="currentDeviceId"
    placeholder="placeholder"
    class="select custom-element-class"
    :disabled="disabled"
    :teleported="false"
    @change="handleChange"
  >
    <el-option
      v-for="item in deviceList"
      :key="item.deviceId"
      :label="item.deviceName"
      :value="item.deviceId"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import { useRoomStore } from '../../stores/room';
import { storeToRefs } from 'pinia';

import useGetRoomEngine from '../../hooks/useRoomEngine';
import { TRTCDeviceInfo } from '@tencentcloud/tuiroom-engine-js';
const roomEngine = useGetRoomEngine();

interface Props {
  deviceType: string,
  onChange?: (id: string) => void,
  disabled?: Boolean
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
      await roomEngine.instance?.setCurrentCameraDevice({ deviceId });
      roomStore.setCurrentCameraId(deviceId);
      break;
    case 'microphone':
      await roomEngine.instance?.setCurrentMicDevice({ deviceId });
      roomStore.setCurrentMicrophoneId(deviceId);
      break;
    case 'speaker':
      await roomEngine.instance?.setCurrentSpeakerDevice({ deviceId });
      roomStore.setCurrentSpeakerId(deviceId);
      break;
    default:
      break;
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/style/element-custom.scss';
.select {
  width: 280px;
  height: 32px;
  font-size: 14px;
}
</style>
