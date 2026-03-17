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

function getStoredBooleanPreference(key: string, defaultValue = true) {
  const value = sessionStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }
  return value === 'true';
}

const getMicrophonePreference = () => getStoredBooleanPreference(STORAGE_KEY_MICROPHONE_STATUS);
const getCameraPreference = () => getStoredBooleanPreference(STORAGE_KEY_CAMERA_STATUS);

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
