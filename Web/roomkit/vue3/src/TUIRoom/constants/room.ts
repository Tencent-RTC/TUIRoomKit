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
