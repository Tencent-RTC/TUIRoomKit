import {
  TUIMediaDeviceType,
  TRTCVideoMirrorType,
  TRTCVideoRotation,
  TRTCVideoFillMode,
  TUIVideoQuality,
} from '@tencentcloud/tuiroom-engine-js';
import useRoomEngine from '../../../hooks/useRoomEngine';
import useDeviceManager from '../../../hooks/useDeviceManager';
import i18n from '../../../locales';
import TUIMessageBox from '../../../components/common/base/MessageBox';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { isWeChat, isMobile } from '../../../utils/environment';
import { MediaDeviceState } from '../../type';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../../constants/message';
import { roomService } from '../../../services';
import useVideoDeviceManagerState, {
  isCameraListInitiated,
} from './videoDeviceManagerState';
import { initMediaDeviceList } from './videoDeviceListHandler';
const { t } = i18n.global;
const roomEngine = useRoomEngine();
const deviceManager = useDeviceManager();
const {
  currentCameraDevice,
  isFrontCamera,
  cameraState,
  isCameraTesting,
  isCameraTestLoading,
  localVideoQuality,
  isLocalMirror,
} = useVideoDeviceManagerState();

class Camera {
  static instance: Camera;
  constructor() {
    if (!Camera.instance) {
      Camera.instance = this;
    }
    return Camera.instance;
  }
  public async startCameraDeviceTest(options: { view: string }) {
    if (!isCameraListInitiated) {
      await initMediaDeviceList();
    }
    isCameraTestLoading.value = true;
    try {
      await deviceManager.instance?.startCameraDeviceTest(options);
      isCameraTestLoading.value = false;
      isCameraTesting.value = true;
    } catch (error) {
      isCameraTestLoading.value = false;
    }
  }
  public async stopCameraDeviceTest() {
    isCameraTestLoading.value = false;
    await deviceManager.instance?.stopCameraDeviceTest();
    isCameraTesting.value = false;
  }
  public async switchCamera(options: { isFrontCamera: boolean }) {
    await deviceManager.instance?.switchCamera(options);
    isFrontCamera.value = options.isFrontCamera;
  }
  public async switchMirror(options: { mirror: boolean }) {
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    await trtcCloud?.setLocalRenderParams({
      mirrorType: options.mirror
        ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
        : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      rotation: TRTCVideoRotation.TRTCVideoRotation0,
      fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
    });
    if (isLocalMirror.value !== options.mirror) {
      isLocalMirror.value = options.mirror;
    }
  }
  public async updateVideoQuality(options: { quality: TUIVideoQuality }) {
    await roomEngine.instance?.updateVideoQuality(options);
    localVideoQuality.value = options.quality;
  }
  public async openLocalCamera() {
    if (cameraState.value === MediaDeviceState.NotSupportCapture && !isWeChat) {
      TUIMessageBox({
        title: t('Note'),
        message: t('The current browser does not support capturing video'),
        confirmButtonText: t('Sure'),
      });
      return;
    }
    if (cameraState.value === MediaDeviceState.NoDeviceDetected && !isWeChat) {
      TUIMessageBox({
        title: t('Note'),
        message: t('Camera not detected on current device'),
        confirmButtonText: t('Sure'),
      });
      return;
    }
    if (cameraState.value === MediaDeviceState.DeviceOffAndDisabled) {
      let warningMessage = '';
      if (roomService.roomStore.isAudience) {
        warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_CAMERA_FAIL_AUDIENCE;
      } else if (roomService.roomStore.isCameraDisableForAllUser) {
        warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_CAMERA_FAIL_MUTE_ALL;
      }
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t(warningMessage),
        duration: MESSAGE_DURATION.NORMAL,
      });
      return;
    }
    if (isMobile) {
      await roomEngine.instance?.openLocalCamera({
        isFrontCamera: isFrontCamera.value,
      });
    } else {
      await roomEngine.instance?.openLocalCamera();
    }
  }
  public async closeLocalCamera() {
    await roomEngine.instance?.closeLocalCamera();
  }
  public async setCurrentDevice(options: { deviceId: string }) {
    const { deviceId } = options;
    await deviceManager.instance?.setCurrentDevice({
      type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
      deviceId,
    });
    currentCameraDevice.value = deviceManager.instance?.getCurrentDevice({
      type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
    });
  }
}
const camera = new Camera();

export default function useVideoDeviceManager() {
  return {
    camera,
  };
}
