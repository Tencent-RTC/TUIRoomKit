import TUIRoomEngine, {
  TUIRoomDeviceManager,
  TUIRoomDeviceMangerEvents,
  TUIMediaDeviceType,
  TUIMediaDeviceState,
} from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from './useRoomEngine';
import { useRoomStore } from '../stores/room';
import logger from '../utils/common/logger';
import { onUnmounted } from 'vue';
import i18n from '../locales';
import TUIMessageBox from '../components/common/base/MessageBox/index';
import { isElectron, isWeChat } from '../utils/environment';

const roomEngine = useGetRoomEngine();
// @ts-ignore
const deviceManager: { instance: TUIRoomDeviceManager | null | undefined } = {
  instance: null,
};

TUIRoomEngine.once('ready', () => {
  deviceManager.instance = roomEngine.instance?.getMediaDeviceManager();
});

export default function (options?: { listenForDeviceChange: boolean }) {
  const roomStore = useRoomStore();
  const { t } = i18n.global;

  async function initMediaDeviceList() {
    if (!deviceManager.instance) {
      return;
    }
    const cameraList = await deviceManager.instance?.getDevicesList({
      type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
    });
    const microphoneList = await deviceManager.instance?.getDevicesList({
      type: TUIMediaDeviceType.kMediaDeviceTypeAudioInput,
    });
    const speakerList = await deviceManager.instance?.getDevicesList({
      type: TUIMediaDeviceType.kMediaDeviceTypeAudioOutput,
    });

    if (!isWeChat) {
      const hasCameraDevice = cameraList && cameraList.length > 0;
      const hasMicrophoneDevice = microphoneList && microphoneList.length > 0;
      let alertMessage = '';
      if (hasCameraDevice && !hasMicrophoneDevice) {
        alertMessage = 'Microphone not detected on current device';
      } else if (!hasCameraDevice && hasMicrophoneDevice) {
        alertMessage = 'Camera not detected on current device';
      } else if (!hasCameraDevice && !hasMicrophoneDevice) {
        alertMessage = 'Camera And Microphone not detected on current device';
      }
      if (alertMessage) {
        TUIMessageBox({
          title: t('Note'),
          message: t(alertMessage),
          confirmButtonText: t('Sure'),
        });
      }
    }

    cameraList && roomStore.setCameraList(cameraList);
    microphoneList && roomStore.setMicrophoneList(microphoneList);
    speakerList && roomStore.setSpeakerList(speakerList);

    const cameraInfo = deviceManager.instance?.getCurrentDevice({
      type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
    });
    const micInfo = deviceManager.instance?.getCurrentDevice({
      type: TUIMediaDeviceType.kMediaDeviceTypeAudioInput,
    });
    const speakerInfo = deviceManager.instance?.getCurrentDevice({
      type: TUIMediaDeviceType.kMediaDeviceTypeAudioOutput,
    });
    if (cameraInfo && cameraInfo.deviceId) {
      roomStore.setCurrentCameraId(cameraInfo.deviceId);
    }
    if (micInfo && micInfo.deviceId) {
      roomStore.setCurrentMicrophoneId(micInfo.deviceId);
    }
    if (speakerInfo && speakerInfo.deviceId) {
      roomStore.setCurrentSpeakerId(speakerInfo.deviceId);
    }
  }

  /**
   * Device changes: device switching, device plugging and unplugging events
   **/
  async function onDeviceChanged(eventInfo: {
    deviceId: string;
    type: TUIMediaDeviceType;
    state: TUIMediaDeviceState;
  }) {
    if (!deviceManager.instance) {
      return;
    }
    const stateList = ['add', 'remove', 'active'];
    const deviceTypeList = ['mic', 'speaker', 'camera'];
    const { deviceId, type, state } = eventInfo;
    logger.log(
      `onDeviceChanged: deviceId: ${deviceId}, type: ${deviceTypeList[type]}, state: ${stateList[state]}`
    );

    const deviceList = await deviceManager.instance?.getDevicesList({ type });
    deviceList && roomStore.setDeviceList(type, deviceList);
    if (state === TUIMediaDeviceState.kMediaDeviceStateActive) {
      roomStore.setCurrentDeviceId(type, deviceId);
    }
    if (
      isElectron &&
      state === TUIMediaDeviceState.kMediaDeviceStateRemove &&
      type === TUIMediaDeviceType.kMediaDeviceTypeVideoCamera
    ) {
      const currentCameraInfo = deviceManager.instance?.getCurrentDevice({
        type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
      });
      if (currentCameraInfo && currentCameraInfo.deviceId) {
        roomStore.setCurrentCameraId(currentCameraInfo.deviceId);
      }
    }
  }

  TUIRoomEngine.once('ready', () => {
    if (options && options.listenForDeviceChange) {
      initMediaDeviceList();
      deviceManager.instance?.on(
        TUIRoomDeviceMangerEvents.onDeviceChanged,
        onDeviceChanged
      );
    }
  });

  onUnmounted(() => {
    if (options && options.listenForDeviceChange) {
      deviceManager.instance?.off(
        TUIRoomDeviceMangerEvents.onDeviceChanged,
        onDeviceChanged
      );
    }
  });

  return {
    deviceManager,
    initMediaDeviceList,
  };
}
