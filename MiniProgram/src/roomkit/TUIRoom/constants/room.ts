import { TRTCVideoResolution } from '@tencentcloud/tuiroom-engine-wx';

export enum SpeechMode {
  FREE_SPEECH = 'FreeSpeech', // 自由发言模式
  APPLY_SPEECH = 'ApplySpeech', // 申请发言模式
}

export enum IconButtonLayout {
  VERTICAl = 'vertical',
  HORIZONTAL = 'horizontal',
}

export enum MediaDeviceState {
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
  DISABLED = 'DISABLED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export const SMALL_VIDEO_ENC_PARAM = {
  videoResolution: TRTCVideoResolution.TRTCVideoResolution_640_360,
  videoFps: 15,
  videoBitrate: 800,
};
