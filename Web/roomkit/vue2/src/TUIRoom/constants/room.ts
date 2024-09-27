import { TRTCVideoResolution } from '@tencentcloud/tuiroom-engine-js';

export enum SpeechMode {
  FREE_SPEECH = 'FreeSpeech',
  APPLY_SPEECH = 'ApplySpeech',
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

export enum USERS_STATUS {
  Entered = 1,
  ON_STAGE = 1,
  NOT_ON_STAGE = 2,
  NOT_ENTER = 3,
}

export const PASSWORD_MAX_LENGTH_LIMIT = 6;

export enum TRTCBeautyStyle {
  TRTCBeautyStyleSmooth = 0,
  TRTCBeautyStyleNature = 1,
}
