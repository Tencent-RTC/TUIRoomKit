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
    class="select custom-element-class"
    :popper-append-to-body="false"
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
import TUIRoomCore, { TRTCDeviceInfo, ETUIRoomEvents, TRTCDeviceType, TRTCDeviceState } from '../../tui-room-core';
import { useRoomStore } from '../../stores/room';
import { storeToRefs } from 'pinia';

interface Props {
  deviceType: string,
  onChange?: (id: string) => void,
  disabled?: Boolean
}
// eslint-disable-next-line vue/no-setup-props-destructure
const { deviceType, onChange, disabled = false } = defineProps<Props>();

const roomStore = useRoomStore();

const { currentCameraId, currentMicrophoneId, currentSpeakerId } = storeToRefs(roomStore);

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
        roomStore.setCurrentCameraId(deviceId);
        break;
      case 'microphone':
        await TUIRoomCore.setCurrentMicrophone(deviceId);
        roomStore.setCurrentMicrophoneId(deviceId);
        break;
      case 'speaker':
        await TUIRoomCore.setCurrentSpeaker(deviceId);
        roomStore.setCurrentSpeakerId(deviceId);
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

/**
 * Device changes: device switching, device plugging and unplugging events
 *
 * 设备变化：设备切换、设备插拔事件
**/
async function onDeviceChange(deviceData: {deviceId: string, type: number, state: number}) {
  const stateList = ['add', 'remove', 'active'];
  const { deviceId, type, state } = deviceData;
  if (type === TRTCDeviceType.TRTCDeviceTypeMic && deviceType === 'microphone') {
    console.log(`onDeviceChange: deviceId: ${deviceId}, type: microphone, state: ${stateList[state]}`);
    deviceList.value = await TUIRoomCore.getMicrophoneList();
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentMicrophoneId(deviceId);
    }
    return;
  }
  if (type === TRTCDeviceType.TRTCDeviceTypeSpeaker && deviceType === 'speaker') {
    console.log(`onDeviceChange: deviceId: ${deviceId}, type: speaker, state: ${stateList[state]}`);
    deviceList.value = await TUIRoomCore.getSpeakerList();
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentSpeakerId(deviceId);
    }
    return;
  }
  if (type === TRTCDeviceType.TRTCDeviceTypeCamera && deviceType === 'camera') {
    console.log(`onDeviceChange: deviceId: ${deviceId}, type: camera, state: ${stateList[state]}`);
    deviceList.value = await TUIRoomCore.getCameraList();
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentCameraId(deviceId);
    }
  }
}

onMounted(() => {
  TUIRoomCore.on(ETUIRoomEvents.onDeviceChange, onDeviceChange);
  getDeviceInfo();
});

onUnmounted(() => {
  TUIRoomCore.off(ETUIRoomEvents.onDeviceChange, onDeviceChange);
});
</script>

<style lang="scss" scoped>
@import '../../assets/style/element-custom.scss';
@import '../../assets/style/element-ui-custom.scss';
.select {
  width: 280px;
  height: 32px;
  font-size: 14px;
}
</style>
