<!--
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
    class="select"
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
import { ref, Ref, watch, onMounted, onUnmounted } from 'vue';
import TUIRoomCore, { TRTCDeviceInfo } from '../../tui-room-core';
import { useStreamStore } from '../../stores/stream';
import { storeToRefs } from 'pinia';

interface Props {
  deviceType: string,
  onChange?: (id: string) => void,
  disabled?: Boolean
}
// eslint-disable-next-line vue/no-setup-props-destructure
const { deviceType, onChange, disabled = false } = defineProps<Props>();

const streamStore = useStreamStore();

const { currentCameraId, currentMicrophoneId, currentSpeakerId } = storeToRefs(streamStore);

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

const deviceList: Ref<TRTCDeviceInfo[]> = ref([]);
const currentDeviceId = ref(getInitDeviceId());

watch(
  currentDeviceId,
  async (deviceId) => {
    switch (deviceType) {
      case 'camera':
        await TUIRoomCore.setCurrentCamera(deviceId);
        streamStore.setCurrentCameraId(deviceId);
        break;
      case 'microphone':
        await TUIRoomCore.setCurrentMicrophone(deviceId);
        streamStore.setCurrentMicrophoneId(deviceId);
        break;
      case 'speaker':
        await TUIRoomCore.setCurrentSpeaker(deviceId);
        streamStore.setCurrentSpeakerId(deviceId);
        break;
      default:
        break;
    }
  },
);

function handleChange(deviceId: string) {
  onChange && onChange(deviceId);
}

async function getDeviceInfo() {
  switch (deviceType) {
    case 'camera':
      deviceList.value = await TUIRoomCore.getCameraList();
      break;
    case 'microphone':
      deviceList.value = await TUIRoomCore.getMicrophoneList();
      break;
    case 'speaker':
      deviceList.value = await TUIRoomCore.getSpeakerList();
      break;
    default:
      break;
  }
}

onMounted(() => {
  // TODO: devicechange 应该监听 TUIRoomCore 的事件
  navigator.mediaDevices.addEventListener('devicechange', getDeviceInfo);
  getDeviceInfo();
});

onUnmounted(() => {
  navigator.mediaDevices.removeEventListener('devicechange', getDeviceInfo);
});
</script>

<style lang="scss" scoped>
.select {
  width: 280px;
  height: 32px;
  font-size: 14px;
}
</style>
