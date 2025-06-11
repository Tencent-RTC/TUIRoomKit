import {
  TUIRoomDeviceMangerEvents,
  TUIMediaDeviceType,
  TUIAudioRoute,
} from '@tencentcloud/tuiroom-engine-js';
import { MediaDeviceState } from '../../type';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import useDeviceManager from '../../../hooks/useDeviceManager';
import { isWeChat, isElectron } from '../../../utils/environment';
import TUIMessageBox from '../../../components/common/base/MessageBox';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import i18n from '../../../locales';
import { WARNING_MESSAGE, MESSAGE_DURATION } from '../../../constants/message';
import { roomService } from '../../../services';
import useAudioDeviceState, {
  testAudioVolume,
} from './audioDeviceManagerState';

const {
  microphoneState,
  currentMicrophoneDevice,
  currentMicrophoneId,
  currentSpeakerDevice,
  currentSpeakerId,
  isMicrophoneTesting,
  isSpeakerTesting,
  currentAudioRoute,
} = useAudioDeviceState();

const roomEngine = useGetRoomEngine();
const deviceManager = useDeviceManager();
const { t } = i18n.global;

class Microphone {
  static instance: Microphone;
  constructor() {
    if (!Microphone.instance) {
      Microphone.instance = this;
    }
    return Microphone.instance;
  }

  private onTestMicVolume(options: { volume: number }) {
    testAudioVolume.value = options.volume;
  }
  public async startMicDeviceTest(options: { interval: number }) {
    await roomEngine.instance?.startMicDeviceTest(options);
    isMicrophoneTesting.value = true;
    deviceManager.instance?.on(
      TUIRoomDeviceMangerEvents.onTestMicVolume,
      this.onTestMicVolume
    );
  }
  public async stopMicDeviceTest() {
    await roomEngine.instance?.stopMicDeviceTest();
    isMicrophoneTesting.value = false;
    deviceManager.instance?.off(
      TUIRoomDeviceMangerEvents.onTestMicVolume,
      this.onTestMicVolume
    );
  }
  public async checkMicrophonePermission() {
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: currentMicrophoneId.value },
    });
    audioStream.getAudioTracks()[0].stop();
  }
  public async openLocalMicrophone() {
    if (
      microphoneState.value === MediaDeviceState.NotSupportCapture &&
      !isWeChat
    ) {
      TUIMessageBox({
        title: t('Note'),
        message: t('The current browser does not support capturing audio'),
        confirmButtonText: t('Sure'),
      });
      return;
    }
    if (
      microphoneState.value === MediaDeviceState.NoDeviceDetected &&
      !isWeChat
    ) {
      TUIMessageBox({
        title: t('Note'),
        message: t('Microphone not detected on current device'),
        confirmButtonText: t('Sure'),
      });
      return;
    }
    try {
      await this.checkMicrophonePermission();
    } catch (error) {
      TUIMessageBox({
        title: t('Note'),
        message: t(
          'The current device is not authorized, please allow access to the device permissions',
          { deviceType: t('microphone') }
        ),
        confirmButtonText: t('Sure'),
      });
      return;
    }
    if (microphoneState.value === MediaDeviceState.DeviceOffAndDisabled) {
      let warningMessage = '';
      if (roomService.roomStore.isAudience) {
        warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_AUDIENCE;
      } else if (roomService.roomStore.isMicrophoneDisableForAllUser) {
        warningMessage = WARNING_MESSAGE.UNMUTE_LOCAL_MIC_FAIL_MUTE_ALL;
      }
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t(warningMessage),
        duration: MESSAGE_DURATION.NORMAL,
      });
      return;
    }
    try {
      await roomEngine.instance?.openLocalMicrophone();
    } catch (error: any) {
      // At this point the microphone has begun to pick up
      if (
        error.code === 0 &&
        error.message === 'you have already mute the audio'
      ) {
        return;
      }
      throw error;
    }
  }
  public async closeLocalMicrophone() {
    await roomEngine.instance?.closeLocalMicrophone();
  }
  public async muteLocalAudio() {
    await roomEngine.instance?.muteLocalAudio();
  }
  public async unmuteLocalAudio() {
    await roomEngine.instance?.unmuteLocalAudio();
  }
  public async setCurrentDevice(options: { deviceId: string }) {
    const { deviceId } = options;
    await deviceManager.instance?.setCurrentDevice({
      type: TUIMediaDeviceType.kMediaDeviceTypeAudioInput,
      deviceId,
    });
    currentMicrophoneDevice.value =
      deviceManager.instance?.getCurrentDevice({
        type: TUIMediaDeviceType.kMediaDeviceTypeAudioInput,
      }) || null;
  }
}

class Speaker {
  private speakerTestPlayer: HTMLAudioElement | null = null;
  public async startSpeakerDeviceTest(options: { filePath: string }) {
    if (isElectron) {
      deviceManager.instance?.startSpeakerDeviceTest(options);
      return;
    }
    this.speakerTestPlayer = document?.createElement('audio');
    if (
      this.speakerTestPlayer &&
      typeof this.speakerTestPlayer.loop !== 'undefined'
    ) {
      this.speakerTestPlayer.loop = true;
    }
    await this.speakerTestPlayer?.setSinkId(currentSpeakerId.value);
    this.speakerTestPlayer.src = options.filePath;
    this.speakerTestPlayer.play();
    isSpeakerTesting.value = true;
  }
  public async stopSpeakerDeviceTest() {
    if (isElectron) {
      deviceManager.instance?.stopSpeakerDeviceTest();
      return;
    }
    if (this.speakerTestPlayer) {
      this.speakerTestPlayer.pause();
      this.speakerTestPlayer.currentTime = 0;
    }
    isSpeakerTesting.value = false;
  }
  public async setCurrentDevice(options: { deviceId: string }) {
    const { deviceId } = options;
    await deviceManager.instance?.setCurrentDevice({
      type: TUIMediaDeviceType.kMediaDeviceTypeAudioOutput,
      deviceId,
    });
    currentSpeakerDevice.value =
      deviceManager.instance?.getCurrentDevice({
        type: TUIMediaDeviceType.kMediaDeviceTypeAudioOutput,
      }) || null;
  }
  public async setAudioRoute(options: { route: TUIAudioRoute }) {
    await deviceManager.instance?.setAudioRoute(options);
    currentAudioRoute.value = options.route;
  }
}

export default function useAudioDeviceManager() {
  return {
    microphone: new Microphone(),
    speaker: new Speaker(),
  };
}
