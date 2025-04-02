import {
  TUIMediaDeviceType,
  TUIMediaDeviceState,
} from '@tencentcloud/tuiroom-engine-js';
import logger from '../../../utils/common/logger';
import useVideoDeviceManagerState, {
  isCameraListInitiated,
} from './videoDeviceManagerState';
import useDeviceManager from '../../../hooks/useDeviceManager';

const deviceManager = useDeviceManager();
const { cameraList, currentCameraDevice } = useVideoDeviceManagerState();

export async function initMediaDeviceList() {
  if (!deviceManager.instance) {
    return;
  }
  cameraList.value = await deviceManager.instance?.getDevicesList({
    type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
  });
  isCameraListInitiated.value = true;
  currentCameraDevice.value = deviceManager.instance?.getCurrentDevice({
    type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
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
    type !== TUIMediaDeviceType.kMediaDeviceTypeVideoCamera
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
  cameraList.value =
    (await deviceManager.instance?.getDevicesList({ type })) || [];
  currentCameraDevice.value = deviceManager.instance?.getCurrentDevice({
    type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
  });
}
