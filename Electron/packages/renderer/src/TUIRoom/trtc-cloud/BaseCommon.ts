/* eslint-disable */
import { EventEmitter } from 'events';
import {
  AudioMusicParam,
  Rect,
  TRTCAppScene,
  TRTCAudioEffectParam,
  TRTCAudioQuality,
  TRTCBeautyStyle,
  TRTCDeviceState,
  TRTCDeviceType,
  TRTCLocalStatistics,
  TRTCLogLevel,
  TRTCNetworkQosParam,
  TRTCParams,
  TRTCPublishCDNParam,
  TRTCRemoteStatistics,
  TRTCRenderParams,
  TRTCRoleType,
  TRTCSpeedTestResult,
  TRTCStatistics,
  TRTCSwitchRoomParam,
  TRTCTranscodingConfig,
  TRTCTranscodingConfigMode,
  TRTCVideoBufferType,
  TRTCVideoEncParam,
  TRTCVideoFillMode,
  TRTCVideoFrame,
  TRTCVideoMirrorType,
  TRTCVideoPixelFormat,
  TRTCVideoRotation,
  TRTCVideoStreamType,
  TRTCVolumeInfo,
  TRTCWaterMarkSrcType,
  TRTCQualityInfo,
  PluginInfo,
  TRTCDeviceInfo,
  TRTCVideoResolution,
} from './common/trtc_define';
import { rtcMode, anchorRole } from './common/constants';
import { IVideoParam } from './common/IVideoParam';
import TRTC from 'trtc-js-sdk';

const RETRY_STATE_NOT_START = 0;
const RETRY_STATE_STARTED = 1;
const RETRY_STATE_STOPPED = 2;

class BaseCommon extends EventEmitter {
  public client: any;
  public shareClient: any;
  public startJoinTimestamp = 0;
  public joinedTimestamp = 0;
  public localStream: any;
  public testCameraStream: any;
  public localStreamRenderParams: any;
  public shareStream: any;
  public audioQuality: TRTCAudioQuality;
  public priorRemoteVideoStreamType: TRTCVideoStreamType;
  public playViewMap = new Map();

  // WebRTC 当前设备列表
  public cameraList: TRTCDeviceInfo[] = [];
  public micList: TRTCDeviceInfo[] = [];
  public speakerList: TRTCDeviceInfo[] = [];
  public currentCameraId: string = '';
  public currentMicId: string = '';
  public currentSpeakerId: string = '';

  // WebRTC 状态变量
  public isJoining: boolean = false;
  public isJoined: boolean = false;
  public isExiting: boolean = false;
  public isPublishing: boolean = false;
  public isPublished: boolean = false;
  public isSubscribed: boolean = false;
  public sdkAppId: any;
  public userId: string = '';
  public userSig: string = '';
  public roomId: number = 0;
  public strRoomId: string = '';
  public mode: string = rtcMode;
  public role: string = anchorRole;
  public privateMapKey: string = '255';
  public streamId: string = '';
  public remoteStreamMap: any;
  public isSmallStreamSupported: boolean = false;
  public isSharing: boolean = false;
  public isShareClientJoined: boolean = false;
  public isShareStreamPublished: boolean = false;
  public isShareClientLeaving: boolean = false;
  public isStaringLocalPreview: boolean = false;
  public isStartedLocalPreview: boolean = false;
  public isStaringLocalAudio: boolean = false;
  public isStartedLocalAudio: boolean = false;

  // WebRTC video 参数
  public videoEncodeParam: IVideoParam;
  public defaultVideoWidth: number = 640;
  public defaultVideoHeight: number = 480;
  public defaultVideoFps: number = 15;
  public defaultVideoBitRate: number = 900;
  // 记录上一次本地 video 参数
  public prevLocalVideoStats: Object = {
    bytesSent: 0,
    packetsSent: 0,
    framesEncoded: 0,
    framesSent: 0,
    frameWidth: 0,
    frameHeight: 0,
  };

  // WebRTC 插件参数
  public beautyPlugin: any;
  public beautyDefaultBeauty: number = 0.5;
  public beautyDefaultBrightness: number = 0.5;
  public beautyDefaultRuddy: number = 0.5;

  public TRTC: any = TRTC;

  constructor() {
    super();

    this.audioQuality = TRTCAudioQuality.TRTCAudioQualityDefault;
    this.priorRemoteVideoStreamType = TRTCVideoStreamType.TRTCVideoStreamTypeBig;
    this.remoteStreamMap = new Map();
    this.isSmallStreamSupported = (TRTC && TRTC.isSmallStreamSupported()) || false;
    this.videoEncodeParam = {
      width: this.defaultVideoWidth,
      height: this.defaultVideoHeight,
      frameRate: this.defaultVideoFps,
      bitrate: this.defaultVideoBitRate,
    };
  }

  promiseRetry(option: { retryFunction: Function, settings: { retries?: number, timeout?: number }, onError: Function, onRetrying: Function, context: any }) {
    const { retryFunction, settings, onError, onRetrying, context } = option;
    return (...args: any[]) => {
      const retries = settings.retries || 5;
      let retryCount = 0;
      let timer = -1;
      let retryState = RETRY_STATE_NOT_START;
      const run = async (resolve: any, reject: any) => {
        try {
          const ctx = context || this;
          const result = await retryFunction.apply(ctx, args);
          // 执行成功，正常返回
          retryCount = 0;
          resolve(result);
        } catch (error) {
          // 用于停止重试
          const stopRetry = () => {
            clearTimeout(timer);
            retryCount = 0;
            retryState = RETRY_STATE_STOPPED;
            reject(error);
          };
          const retry = () => {
            if (retryState !== RETRY_STATE_STOPPED && retryCount < retries) {
              retryCount++;
              retryState = RETRY_STATE_STARTED;
              if (onRetrying) {
                onRetrying(retryCount, stopRetry);
              }
              timer = window.setTimeout(
                () => {
                  timer = -1;
                  run(resolve, reject);
                },
                typeof settings.timeout === 'undefined' ? 1000 : settings.timeout
              );
            } else {
              stopRetry();
            }
          };
          if (onError) {
            onError(error, retry, reject);
          } else {
            retry();
          }
        }
      };
  
      return new Promise(run);
    };
  }
}

export { BaseCommon };
