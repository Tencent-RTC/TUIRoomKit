import TRTCCloud, {
  TRTCParams,
  TRTCAppScene,
  TRTCVideoStreamType,
  TRTCScreenCaptureSourceType,
  TRTCVideoEncParam,
  Rect,
  TRTCAudioQuality,
  TRTCScreenCaptureSourceInfo,
  TRTCDeviceInfo,
  TRTCVideoQosPreference,
  TRTCVideoMirrorType,
  TRTCVideoRotation,
  TRTCVideoFillMode
} from '../../trtc-cloud';
import logger from '../common/logger';
import { ETUIRoomEvents, ETUIStreamType } from '../types';
import TUIRoomError from '../base/TUIRoomError';
import TUIRoomResponse from '../base/TUIRoomResponse';
import { TUIRoomErrorCode, TUIRoomErrorMessage } from '../constant';
import Event from '../common/emitter/event';

type TRTCEnterRoomParams = {
  sdkAppId: number;
  roomId: number;
  userId: string;
  userSig: string;
};

type ResolveRejectRecord = {
  resolve: (data: any) => void;
  reject: (data: any) => void;
};

const METHOD_NAME = {
  ENTER_ROOM: 'enterRoom',
  EXIT_ROOM: 'exitRoom',
};

class BaseTRTCService {
  static logPrefix = '[BaseTRTCService]';

  protected sdkAppId = 0;

  protected roomId = 0;

  protected userId = '';

  protected userSig = '';

  protected isInRoom = false;

  protected rtcCloud: TRTCCloud | null;

  protected methodResolveRejectMap = new Map<
    string,
    Array<ResolveRejectRecord>
  >();

  protected emitter = new Event();

  constructor() {
    this.rtcCloud = TRTCCloud.getTRTCShareInstance();

    this.onEnterRoom = this.onEnterRoom.bind(this);
    this.onExitRoom = this.onExitRoom.bind(this);
    this.bindEvent();
  }

  /**
   * 统一的事件处理函数
   *
   * TRTC 的主动同步接口封装成 Promise 返回，在 TRTC 相应事件发生后，
   * 调用对应的 resolve 和 reject 方法。这个内部方法，用来根据方法名，
   * 集中调用存储在 methodResolveRejectMap 中的 resolve 或 reject 方法。
   * @param methodName
   * @param result
   */
  private invokeEventCallbacks(
    methodName: string,
    result: {
      isSuccess: boolean;
      data?: any;
    }
  ) {
    if (this.methodResolveRejectMap.has(methodName)) {
      const list = this.methodResolveRejectMap.get(methodName);
      if (list && list.length) {
        list.forEach(({ resolve, reject }) => {
          if (result.isSuccess) {
            resolve(TUIRoomResponse.success(result.data || null));
          } else {
            reject(TUIRoomError.error(result.data.code, result.data.message));
          }
        });
        this.methodResolveRejectMap.delete(methodName);
      }
    }
  }

  // TRTC onEnterRoom 事件处理方法
  private onEnterRoom(result: number) {
    logger.log(`${BaseTRTCService.logPrefix}.onEnterRoom result: ${result}`);
    let responseData = null;
    if (result > 0) {
      responseData = {
        isSuccess: true,
        data: result,
      };
      this.isInRoom = true;
    } else {
      responseData = {
        isSuccess: false,
        data: {
          code: TUIRoomErrorCode.ENTER_ROOM_ERROR,
          message: TUIRoomErrorMessage.ENTER_ROOM_ERROR,
        },
      };
      this.isInRoom = false;
    }
    this.invokeEventCallbacks(METHOD_NAME.ENTER_ROOM, responseData);
  }

  // TRTC onExitRoom 事件处理方法
  private onExitRoom(reason: number) {
    logger.log(`${BaseTRTCService.logPrefix}onExitRoom reason: ${reason}`);
    this.invokeEventCallbacks(METHOD_NAME.EXIT_ROOM, {
      isSuccess: true,
    });
    this.isInRoom = false;
  }

  private bindEvent() {
    this.rtcCloud?.on('onEnterRoom', this.onEnterRoom);
    this.rtcCloud?.on('onExitRoom', this.onExitRoom);
  }

  private unbindEvent() {
    this.rtcCloud?.off('onEnterRoom', this.onEnterRoom);
    this.rtcCloud?.off('onExitRoom', this.onExitRoom);
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   进房、退房接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */

  public async enterRoom(
    params: TRTCEnterRoomParams
  ): Promise<TUIRoomResponse<any>> {
    return new Promise((resolve, reject) => {
      const list =
        this.methodResolveRejectMap.get(METHOD_NAME.ENTER_ROOM) || [];
      list.push({
        resolve,
        reject,
      });
      this.methodResolveRejectMap.set(METHOD_NAME.ENTER_ROOM, list);

      this.innerEnterRoom(params);
    });
  }

  private innerEnterRoom(params: TRTCEnterRoomParams) {
    if (!this.rtcCloud) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TRTC_NOT_EXIST_ERROR,
        TUIRoomErrorMessage.TRTC_NOT_EXIST_ERROR
      );
    }

    const { sdkAppId, roomId, userId, userSig } = params;
    this.sdkAppId = sdkAppId;
    this.roomId = roomId;
    this.userId = userId;
    this.userSig = userSig;

    const param = new TRTCParams();
    param.sdkAppId = sdkAppId;
    param.roomId = roomId;
    param.userId = userId;
    param.userSig = userSig;
    param.userDefineRecordId = ''; // 云端录制
    // this.rtcCloud.setDefaultStreamRecvMode(true, false); // 默认接收音频，不接收视频
    this.rtcCloud.enterRoom(param, TRTCAppScene.TRTCAppSceneVideoCall);

    // todo: electron 特有，web 端不支持
    // this.rtcCloud.setRenderMode(2); // 1-webgl 2-yuvcanvs
  }

  public async exitRoom(): Promise<TUIRoomResponse<any>> {
    if (!this.isInRoom) {
      return TUIRoomResponse.success();
    }
    return new Promise((resolve, reject) => {
      const list = this.methodResolveRejectMap.get(METHOD_NAME.EXIT_ROOM) || [];
      list.push({
        resolve,
        reject,
      });
      this.methodResolveRejectMap.set(METHOD_NAME.EXIT_ROOM, list);

      this.innerExitRoom();
    });
  }

  private async innerExitRoom() {
    if (!this.rtcCloud) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TRTC_NOT_EXIST_ERROR,
        TUIRoomErrorMessage.TRTC_NOT_EXIST_ERROR
      );
    }

    await this.rtcCloud.stopLocalPreview();
    await this.rtcCloud.stopLocalAudio();
    // this.rtcCloud.stopScreenCapture(); // To-do: 临时注释掉，浏览器和electron端有差异，目前有报错
    this.rtcCloud.exitRoom();
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   音视频相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  setVideoEncoderParam(paramObj: TRTCVideoEncParam) {
    this.rtcCloud?.setVideoEncoderParam(paramObj);
  }

  async startLocalVideo(view: HTMLElement) {
    await this.rtcCloud?.startLocalPreview(view);
  }

  stopLocalVideo() {
    this.rtcCloud?.stopLocalPreview();
  }

  startLocalAudio(quality?: TRTCAudioQuality) {
    this.rtcCloud?.startLocalAudio(quality);
  }

  stopLocalAudio() {
    this.rtcCloud?.stopLocalAudio();
  }

  startSystemAudioLoopback() {
    this.rtcCloud?.startSystemAudioLoopback();
  }

  stopSystemAudioLoopback() {
    this.rtcCloud?.stopSystemAudioLoopback();
  }

  setVideoMirror(mirror: boolean) {
    this.rtcCloud?.setLocalRenderParams({
      mirrorType: mirror ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      rotation:TRTCVideoRotation.TRTCVideoRotation0,
      fillMode:TRTCVideoFillMode.TRTCVideoFillMode_Fit
    });
  }

  setRemoteVideoFillMode(userId: string, streamType: string, fillMode: TRTCVideoFillMode) {
    this.rtcCloud?.setRemoteRenderParams(userId, streamType, {
      mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      rotation: TRTCVideoRotation.TRTCVideoRotation0,
      fillMode: fillMode,
    });
  }

  muteLocalVideo(mute: boolean) {
    this.rtcCloud?.muteLocalVideo(mute);
  }

  muteLocalAudio(mute: boolean) {
    this.rtcCloud?.muteLocalAudio(mute);
  }

  startCameraDeviceTest(view: HTMLElement) {
    this.rtcCloud?.startCameraDeviceTest(view);
  }

  stopCameraDeviceTest() {
    this.rtcCloud?.stopCameraDeviceTest();
  }

  startRemoteView(
    userId: string,
    view: HTMLDivElement,
    streamType: ETUIStreamType
  ) {
    if (streamType === ETUIStreamType.CAMERA) {
      this.rtcCloud?.startRemoteView(
        userId,
        view,
        TRTCVideoStreamType.TRTCVideoStreamTypeBig
      );
    } else if (streamType === ETUIStreamType.SCREEN) {
      this.rtcCloud?.startRemoteView(
        userId,
        view,
        TRTCVideoStreamType.TRTCVideoStreamTypeSub
      );
    }
  }

  stopRemoteView(userId: string, streamType: ETUIStreamType) {
    if (streamType === ETUIStreamType.CAMERA) {
      this.rtcCloud?.stopRemoteView(
        userId,
        TRTCVideoStreamType.TRTCVideoStreamTypeBig
      );
    } else if (streamType === ETUIStreamType.SCREEN) {
      this.rtcCloud?.stopRemoteView(
        userId,
        TRTCVideoStreamType.TRTCVideoStreamTypeSub
      );
    }
  }

  muteRemoteVideo(userId: string, mute: boolean) {
    this.rtcCloud?.muteRemoteVideoStream(userId, mute);
  }

  muteRemoteAudio(userId: string, mute: boolean) {
    this.rtcCloud?.muteRemoteAudio(userId, mute);
  }

  enableAudioVolumeEvaluation(interval: number) {
    this.rtcCloud?.enableAudioVolumeEvaluation(interval);
  }

  setVideoQosPreference(preference: TRTCVideoQosPreference) {
    this.rtcCloud?.setNetworkQosParam(preference);
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   屏幕分享相关接口:接口差异大，在子类中实现
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   设备管理相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  getMicrophoneList(): Array<TRTCDeviceInfo> {
    return this.rtcCloud?.getMicDevicesList();
  }

  getCurrentMicrophone(): TRTCDeviceInfo | null {
    return this.rtcCloud?.getCurrentMicDevice();
  }

  async setCurrentMicrophone(deviceId: string) {	
    await this.rtcCloud?.setCurrentMicDevice(deviceId);	
  }

  async getCameraList(): Promise<Array<TRTCDeviceInfo>> {
    return await this.rtcCloud?.getCameraDevicesList();
  }

  getCurrentCamera(): TRTCDeviceInfo | null {
    return this.rtcCloud?.getCurrentCameraDevice();
  }

  async setCurrentCamera(deviceId: string) {	
    await this.rtcCloud?.setCurrentCameraDevice(deviceId);	
  }

  getSpeakerList(): Array<TRTCDeviceInfo> {
    return this.rtcCloud?.getSpeakerDevicesList();
  }

  getCurrentSpeaker(): TRTCDeviceInfo | null {
    return this.rtcCloud?.getCurrentSpeakerDevice();
  }

  async setCurrentSpeaker(deviceId: string) {	
    await this.rtcCloud?.setCurrentSpeakerDevice(deviceId);	
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    事件回调注册接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  on(eventName: string, handler: (...args: any) => void) {
    this.rtcCloud?.on(eventName, handler);
  }

  off(eventName: string, handler: (...args: any) => void) {
    this.rtcCloud?.off(eventName, handler);
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    其他接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */

  getSDKVersion() {
    return this.rtcCloud?.getSDKVersion();
  }

  destroy() {
    this.unbindEvent();
    TRTCCloud.destroyTRTCShareInstance();
    this.rtcCloud = null;
    this.sdkAppId = 0;
    this.userSig = '';
    this.userId = '';
    this.roomId = 0;
    this.isInRoom = false;
  }
}

export default BaseTRTCService;
