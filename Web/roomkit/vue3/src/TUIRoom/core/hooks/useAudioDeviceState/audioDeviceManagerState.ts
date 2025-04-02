import { computed, ref, ComputedRef, Ref } from 'vue';
import { TUIDeviceInfo, TUIAudioRoute } from '@tencentcloud/tuiroom-engine-js';
import { MediaDeviceState } from '../../type';
import {
  isGetUserMediaSupported,
  isEnumerateDevicesSupported,
} from '../../../utils/mediaAbility';
import { roomService } from '../../../services';

export const testAudioVolume = ref(0);
const microphoneList: Ref<TUIDeviceInfo[]> = ref([]);
const currentMicrophoneDevice: Ref<TUIDeviceInfo | null> = ref(null);
const isMicrophoneTesting: Ref<boolean> = ref(false);

const speakerList: Ref<TUIDeviceInfo[]> = ref([]);
const currentSpeakerDevice: Ref<TUIDeviceInfo | null> = ref(null);
const currentAudioRoute: Ref<TUIAudioRoute> = ref<TUIAudioRoute>(
  TUIAudioRoute.kAudioRouteSpeakerphone
);
const isSpeakerTesting = ref(false);
export const isMicrophoneListInitiated = ref(false);
export const isSpeakerListInitiated = ref(false);

const currentMicrophoneId: ComputedRef<string> = computed(() => {
  return (
    (currentMicrophoneDevice.value && currentMicrophoneDevice.value.deviceId) ||
    ''
  );
});
const currentSpeakerId: ComputedRef<string> = computed(() => {
  return (
    (currentSpeakerDevice.value && currentSpeakerDevice.value.deviceId) || ''
  );
});
const microphoneState: ComputedRef<MediaDeviceState> = computed(() => {
  if (!isGetUserMediaSupported || !isEnumerateDevicesSupported) {
    return MediaDeviceState.NotSupportCapture;
  }
  if (isMicrophoneListInitiated.value && microphoneList.value.length === 0) {
    return MediaDeviceState.NoDeviceDetected;
  }
  if (
    roomService.roomStore.isMicrophoneDisableForAllUser &&
    !roomService.roomStore.localStream?.hasAudioStream &&
    roomService.roomStore.isGeneralUser
  ) {
    return MediaDeviceState.DeviceOffAndDisabled;
  }
  if (!roomService.roomStore.isMaster && roomService.roomStore.isAudience) {
    return MediaDeviceState.DeviceOffAndDisabled;
  }
  if (roomService.roomStore.localStream?.hasAudioStream) {
    return MediaDeviceState.DeviceOn;
  }
  if (!roomService.roomStore.localStream?.hasAudioStream) {
    return MediaDeviceState.DeviceOff;
  }
  return MediaDeviceState.DeviceOff;
});
const audioVolume: ComputedRef<number> = computed(() => {
  if (isMicrophoneTesting.value) {
    return testAudioVolume.value;
  }
  return roomService.roomStore.userVolumeObj[
    roomService.roomStore.localUser.userId
  ];
});

export default function useAudioDeviceManagerState() {
  return {
    microphoneState,
    microphoneList,
    currentMicrophoneDevice,
    currentMicrophoneId,
    audioVolume,
    isMicrophoneTesting,

    speakerList,
    currentSpeakerDevice,
    currentSpeakerId,
    currentAudioRoute,
    isSpeakerTesting,
  };
}
