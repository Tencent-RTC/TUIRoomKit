import {
  TUIMediaDeviceType,
  TUIMediaDeviceState,
} from '@tencentcloud/tuiroom-engine-js';
import useDeviceManager from '../../../hooks/useDeviceManager';
import logger from '../../../utils/common/logger';
import useAudioDeviceState, {
  isMicrophoneListInitiated,
  isSpeakerListInitiated,
} from './audioDeviceManagerState';

const {
  microphoneList,
  currentMicrophoneDevice,
  speakerList,
  currentSpeakerDevice,
} = useAudioDeviceState();

const deviceManager = useDeviceManager();

export async function initMediaDeviceList() {
  if (!deviceManager.instance) {
    return;
  }
  microphoneList.value =
    (await deviceManager.instance?.getDevicesList({
      type: TUIMediaDeviceType.kMediaDeviceTypeAudioInput,
    })) || [];
  isMicrophoneListInitiated.value = true;
  speakerList.value =
    (await deviceManager.instance?.getDevicesList({
      type: TUIMediaDeviceType.kMediaDeviceTypeAudioOutput,
    })) || [];
  isSpeakerListInitiated.value = true;
  currentMicrophoneDevice.value = deviceManager.instance?.getCurrentDevice({
    type: TUIMediaDeviceType.kMediaDeviceTypeAudioInput,
  });
  currentSpeakerDevice.value = deviceManager.instance?.getCurrentDevice({
    type: TUIMediaDeviceType.kMediaDeviceTypeAudioOutput,
  });
}

/**
 * Device changes: device switching, device plugging and unplugging events
 **/
export async function onDeviceChanged(eventInfo: {
  deviceId: string;
  type: TUIMediaDeviceType;
  state: TUIMediaDeviceState;
}) {
  const { deviceId, type, state } = eventInfo;
  if (
    !deviceManager.instance ||
    type === TUIMediaDeviceType.kMediaDeviceTypeVideoCamera
  ) {
    return;
  }
  const deviceTypeTextObj = {
    [TUIMediaDeviceType.kMediaDeviceTypeAudioInput]: 'mic',
    [TUIMediaDeviceType.kMediaDeviceTypeAudioOutput]: 'speaker',
    [TUIMediaDeviceType.kMediaDeviceTypeVideoCamera]: 'camera',
    [TUIMediaDeviceType.kMediaDeviceTypeUnknown]: 'unknown',
  };
  const stateTextObj = {
    [TUIMediaDeviceState.kMediaDeviceStateAdd]: 'add',
    [TUIMediaDeviceState.kMediaDeviceStateRemove]: 'remove',
    [TUIMediaDeviceState.kMediaDeviceStateActive]: 'active',
  };

  logger.log(
    `onDeviceChanged: deviceId: ${deviceId}, type: ${deviceTypeTextObj[type]}, state: ${stateTextObj[state]}`
  );
  if (type === TUIMediaDeviceType.kMediaDeviceTypeAudioInput) {
    microphoneList.value =
      (await deviceManager.instance?.getDevicesList({
        type,
      })) || [];
    if (state === TUIMediaDeviceState.kMediaDeviceStateActive) {
      currentMicrophoneDevice.value =
        deviceManager.instance?.getCurrentDevice({
          type: TUIMediaDeviceType.kMediaDeviceTypeAudioInput,
        }) || null;
    }
  }
  if (type === TUIMediaDeviceType.kMediaDeviceTypeAudioOutput) {
    speakerList.value =
      (await deviceManager.instance?.getDevicesList({
        type,
      })) || [];
    if (state === TUIMediaDeviceState.kMediaDeviceStateActive) {
      currentSpeakerDevice.value =
        deviceManager.instance?.getCurrentDevice({
          type: TUIMediaDeviceType.kMediaDeviceTypeAudioOutput,
        }) || null;
    }
  }
}
