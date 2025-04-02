import { ref, computed, Ref, ComputedRef } from 'vue';
import {
  TUIDeviceInfo,
  TUIVideoQuality,
} from '@tencentcloud/tuiroom-engine-js';
import i18n from '../../../locales';
import { isMobile } from '../../../utils/environment';
import {
  isGetUserMediaSupported,
  isEnumerateDevicesSupported,
} from '../../../utils/mediaAbility';
import { MediaDeviceState } from '../../type';
import { roomService } from '../../../services';

const { t } = i18n.global;
const cameraList: Ref<TUIDeviceInfo[]> = ref([]);
const currentCameraDevice: Ref<TUIDeviceInfo | undefined> = ref();
const currentCameraId: ComputedRef<string> = computed(() => {
  return (
    (currentCameraDevice.value && currentCameraDevice.value.deviceId) || ''
  );
});
const isFrontCamera: Ref<boolean> = ref(true);
const isLocalMirror: Ref<boolean> = ref(true);

const isCameraTestLoading = ref(false);
const isCameraTesting = ref(false);
const localVideoQuality: Ref<TUIVideoQuality> = ref(
  isMobile
    ? TUIVideoQuality.kVideoQuality_360p
    : TUIVideoQuality.kVideoQuality_720p
);
const videoQualityList: ComputedRef<
  { label: string; value: TUIVideoQuality }[]
> = computed(() => [
  { label: t('Low Definition'), value: TUIVideoQuality.kVideoQuality_360p },
  {
    label: t('Standard Definition'),
    value: TUIVideoQuality.kVideoQuality_540p,
  },
  { label: t('High Definition'), value: TUIVideoQuality.kVideoQuality_720p },
  {
    label: t('Super Definition'),
    value: TUIVideoQuality.kVideoQuality_1080p,
  },
]);
export const isCameraListInitiated = ref(false);

const cameraState: ComputedRef<MediaDeviceState> = computed(() => {
  if (!isGetUserMediaSupported || !isEnumerateDevicesSupported) {
    return MediaDeviceState.NotSupportCapture;
  }
  if (isCameraListInitiated.value && cameraList.value.length === 0) {
    return MediaDeviceState.NoDeviceDetected;
  }
  if (
    roomService.roomStore.isCameraDisableForAllUser &&
    !roomService.roomStore.localStream?.hasVideoStream &&
    roomService.roomStore.isGeneralUser
  ) {
    return MediaDeviceState.DeviceOffAndDisabled;
  }
  if (roomService.roomStore.isAudience) {
    return MediaDeviceState.DeviceOffAndDisabled;
  }
  if (roomService.roomStore.localStream?.hasVideoStream) {
    return MediaDeviceState.DeviceOn;
  }
  if (!roomService.roomStore.localStream?.hasVideoStream) {
    return MediaDeviceState.DeviceOff;
  }
  return MediaDeviceState.DeviceOff;
});

export default function useVideoDeviceManagerState() {
  return {
    cameraList,
    currentCameraDevice,
    currentCameraId,
    isFrontCamera,
    cameraState,
    isLocalMirror,
    localVideoQuality,
    videoQualityList,
    isCameraTesting,
    isCameraTestLoading,
  };
}
