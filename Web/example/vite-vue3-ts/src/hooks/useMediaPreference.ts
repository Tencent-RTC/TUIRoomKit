import { watch } from 'vue';
import { useDeviceState, DeviceStatus } from 'tuikit-atomicx-vue3/room';

export const STORAGE_KEY_CAMERA_STATUS = 'tuiRoom-cameraStatus';
export const STORAGE_KEY_MICROPHONE_STATUS = 'tuiRoom-microphoneStatus';

const { cameraStatus, microphoneStatus } = useDeviceState();

watch(cameraStatus, (newVal) => {
  sessionStorage.setItem(STORAGE_KEY_CAMERA_STATUS, newVal === DeviceStatus.On ? 'true' : 'false');
});
watch(microphoneStatus, (newVal) => {
  sessionStorage.setItem(STORAGE_KEY_MICROPHONE_STATUS, newVal === DeviceStatus.On ? 'true' : 'false');
});

const getMicrophonePreference = () => sessionStorage.getItem(STORAGE_KEY_MICROPHONE_STATUS) === 'true';
const getCameraPreference = () => sessionStorage.getItem(STORAGE_KEY_CAMERA_STATUS) === 'true';

const setMicrophonePreference = (isOpen: boolean) => {
  sessionStorage.setItem(STORAGE_KEY_MICROPHONE_STATUS, isOpen ? 'true' : 'false');
};
const setCameraPreference = (isOpen: boolean) => {
  sessionStorage.setItem(STORAGE_KEY_CAMERA_STATUS, isOpen ? 'true' : 'false');
};

export function useMediaPreference() {
  return {
    getMicrophonePreference,
    getCameraPreference,
    setMicrophonePreference,
    setCameraPreference,
  };
}
