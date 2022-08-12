/* eslint-disable no-unused-vars */
// --------------------------------常量--------------------------------
export const EnterRoomFailure: number = -1;
export const ON_ERROR: string = 'onError';
// kibana 日志上报
// eslint-disable-next-line import/no-mutable-exports
export let loggerProxy = '';
export const loggerDomain = 'https://yun.tim.qq.com';
export const setLoggerProxy = (domain: any) => (loggerProxy = domain);
// 应用场景
export const liveMode = 'live'; // 互动直播
export const rtcMode = 'rtc'; // 实时音视频通话模式
export const anchorRole = 'anchor';
export const audienceRole = 'audience';
// audio profile
const AudioStandard = 'standard'; // 标准 audio: 48000	单声道	40
const AudioHighQuality = 'high'; // 高质量 audio: 48000	单声道	128
// 大小流
export const smallStream = 'small';
export const bigStream = 'big';
export const auxiliaryStream = 'auxiliary';

// 网络类型与仪表盘传参的对应关系
export const NETWORK_TYPE = {
  unknown: 0,
  wifi: 1,
  '3g': 2,
  '2g': 3,
  '4g': 4,
  wired: 5,
};
interface IRoleMap {
  [key: number]: string;
}
// webRTC 仅在 'live' 模式下有意义, 仅支持以下两种角色. TRTCRoleAnchor = 20, TRTCRoleAudience = 21,
export const roleMap: IRoleMap = {
  20: anchorRole,
  21: audienceRole,
};
// TRTCAppSceneVideoCall = 0, 视频通话场景
// TRTCAppSceneLIVE = 1, 视频互动直播
// TRTCAppSceneAudioCall = 2, 语音通话场景
// TRTCAppSceneVoiceChatRoom = 3, 语音互动直播
// webRTC 仅在 'live' 模式下有意义, 仅支持以下两种角色
export const joinSceneMap = {
  0: rtcMode,
  1: liveMode,
  2: rtcMode,
  3: liveMode,
};

// webRTC 音频码率和 TRTCCloud 的映射关系 TRTCAudioQualitySpeech = 1, TRTCAudioQualityDefault = 2, TRTCAudioQualityMusic = 3
export const audioQualityMap = {
  1: AudioStandard,
  2: AudioStandard,
  3: AudioHighQuality,
};

export const streamTypeMap = {
  0: bigStream,
  1: smallStream,
  2: auxiliaryStream,
};

//  * WebRTC 视频分辨率和 TRTCCloud 的映射关系
//  *  export enum TRTCVideoResolution {
//       TRTCVideoResolution_120_120 = 1,
//       TRTCVideoResolution_160_160 = 3,
//       TRTCVideoResolution_270_270 = 5,
//       TRTCVideoResolution_480_480 = 7,
//       TRTCVideoResolution_160_120 = 50,
//       TRTCVideoResolution_240_180 = 52,
//       TRTCVideoResolution_280_210 = 54,
//       TRTCVideoResolution_320_240 = 56,
//       TRTCVideoResolution_400_300 = 58,
//       TRTCVideoResolution_480_360 = 60,
//       TRTCVideoResolution_640_480 = 62,
//       TRTCVideoResolution_960_720 = 64,
//       TRTCVideoResolution_160_90 = 100,
//       TRTCVideoResolution_256_144 = 102,
//       TRTCVideoResolution_320_180 = 104,
//       TRTCVideoResolution_480_270 = 106,
//       TRTCVideoResolution_640_360 = 108,
//       TRTCVideoResolution_960_540 = 110,
//       TRTCVideoResolution_1280_720 = 112,
//       TRTCVideoResolution_1920_1080 = 114
//     }
//   * | 视频Profile | 分辨率（宽 x 高）| 帧率（fps）| 码率（kbps）|
//   * | :---       | :---           | :---      | :---      |
//   * | 120p       | 160 x 120      | 15        | 200        |
//   * | 180p       | 320 x 180      | 15        | 350        |
//   * | 240p       | 320 x 240      | 15        | 400       |
//   * | 360p       | 640 x 360      | 15        | 800       |
//   * | 480p       | 640 x 480      | 15        | 900       |
//   * | 720p       | 1280 x 720     | 15        | 1500      |
//   * | 1080p      | 1920 x 1080    | 15        | 2000      |
//   * | 1440p      | 2560 x 1440    | 30        | 4860      |
//   * | 4K         | 3840 x 2160    | 30        | 9000      |
export const videoResolutionMap = {};
export const videoProfileMap = {};

export enum ExitRoomCode {
  ActiveExitRoom = 0,
  KickedExitRoom = 1,
}
