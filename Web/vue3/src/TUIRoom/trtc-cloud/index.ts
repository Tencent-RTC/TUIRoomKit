/* eslint-disable no-underscore-dangle */
import { EventEmitter } from 'events';
// import IDLogger from './utils/log/id-logger';
// import log from './utils/log/logger';
import { TRTCAppScene, TRTCParams, TRTCNetQualityInfo, TRTCNetQuality, TRTCStatistics, TRTCVideoStreamType, TRTCLocalStatistics, TRTCRoleType, TRTCDeviceType, TRTCDeviceState, TRTCDeviceInfo, TRTCVideoResolution } from './common/trtc_define';
import { EnterRoomFailure, roleMap, joinSceneMap, NAME, ExitRoomCode } from './common/constants';
import { MixinsClass, isString, isUndefined, performanceNow, isContained, debounce } from './utils/utils';
import { BaseCommon } from './BaseCommon';
import { MixCDN } from './MixCDN';
import { Video } from './Video';
import { Audio } from './Audio';
import { Camera } from './Camera';
import { Mic } from './Mic';
import { Share } from './Share';
import { Beauty } from './Beauty'; // eslint-disable-line no-unused-vars
import { IClientConfig } from './common/IClientConfig';
import { IError } from './common/IError';
import { IVideoParam } from './common/IVideoParam';
// import { setLogEventConfig, uploadEvent } from './utils/event-log';
import { jsExecuteError, ParametersError, enterRoomError, exitRoomError, EnterRoomUserIdError } from './common/trtcCode';
import * as TYPE from './common/trtc_define'; // eslint-disable-line no-unused-vars
export * from './common/trtc_define';
let trtcCloudInstance: TRTCCloud | null = null;

/**
 * @class TRTCCloud
 * @example
 * // 创建 TRTCCloud 对象的示例代码：
 * import TRTCCloud from 'trtc-cloud-js-sdk';
 * const trtcCloud = new TRTCCloud();
 * // 获取 SDK 版本号
 * let version = trtcCloud.getSDKVersion();
 */
class TRTCCloud extends MixinsClass(
  EventEmitter,
  BaseCommon,
  MixCDN,
  Video,
  Audio,
  Camera,
  Mic,
  Share,
  // Beauty,
) {
  private enableAudioVolumeInterval = 0;
  private enableAudioVolumeTimer = -1;
  public log_: any;
  public frameWorkType: number = 40; // 默认 SDK frameWorkType
  constructor() {
    super();
    this.log_ = this.TRTC.Logger.loggerManager;
    this.handleError = this.handleError.bind(this);
    this.handlePeerJoin = this.handlePeerJoin.bind(this);
    this.handlePeerLeave = this.handlePeerLeave.bind(this);
    this.handleStreamAdded = this.handleStreamAdded.bind(this);
    this.handleStreamSubscribed = this.handleStreamSubscribed.bind(this);
    this.handleStreamRemoved = this.handleStreamRemoved.bind(this);
    this.handleStreamUpdated = this.handleStreamUpdated.bind(this);
    this.handleMuteAudio = this.handleMuteAudio.bind(this);
    this.handleUnmuteAudio = this.handleUnmuteAudio.bind(this);
    this.handleMuteVideo = this.handleMuteVideo.bind(this);
    this.handleUnmuteVideo = this.handleUnmuteVideo.bind(this);
    this.handleAudioVolume = this.handleAudioVolume.bind(this);
    this.handleNetworkQuality = this.handleNetworkQuality.bind(this);
    this.handleDeviceChange = this.handleDeviceChange.bind(this);

    navigator.mediaDevices.addEventListener('devicechange', debounce(this.handleDeviceChange, 30));

    // 获取默认 mic deviceId
    this.TRTC.getMicrophones()
      .then((microphoneList: Array<TRTCDeviceInfo>) => {
        this.micList = microphoneList || [];
        const defaultDeviceInfo: TRTCDeviceInfo = this.getDefaultDeviceInfo(microphoneList);
        this.currentMicId = defaultDeviceInfo.deviceId || '';
      })
      .catch((error: any) => {
        this.log_.error(`getMicrophones error observed ${error}`);
      });
    // 获取默认 camera deviceId
    this.TRTC.getCameras()
      .then((cameraList: Array<TRTCDeviceInfo>) => {
        this.cameraList = cameraList || [];
        const defaultDeviceInfo: TRTCDeviceInfo = this.getDefaultDeviceInfo(cameraList);
        this.currentCameraId = defaultDeviceInfo.deviceId || '';
      })
      .catch((error: any) => {
        this.log_.error(`getCameras error observed ${error}`);
      });
    // 获取默认 speaker deviceId
    this.TRTC.getSpeakers()
      .then((speakerList: Array<TRTCDeviceInfo>) => {
        this.speakerList = speakerList || [];
        const defaultDeviceInfo: TRTCDeviceInfo = this.getDefaultDeviceInfo(speakerList);
        this.currentSpeakerId = defaultDeviceInfo.deviceId || '';
      })
      .catch((error: any) => {
        this.log_.error(`getSpeakers error observed ${error}`);
      });
  }
  /**
   * 创建 TRTCCloud 对象单例
   * @memberof TRTCCloud
   * @returns {TRTCCloud}
   *
   * @example
   * import TRTCCloud from 'trtc-cloud-js-sdk';
   * const trtcCloud = TRTCCloud.getTRTCShareInstance(); // 创建 TRTCCloud 对象单例
   */
  static getTRTCShareInstance() {
    if (!trtcCloudInstance) {
      trtcCloudInstance = new TRTCCloud();
    }
    return trtcCloudInstance;
  }
  /**
   * 释放 TRTCCloud 对象并清理资源
   * @memberof TRTCCloud
   * @example
   * import TRTCCloud from 'trtc-cloud-js-sdk';
   * TRTCCloud.destroyTRTCShareInstance(); // 释放 TRTCCloud 对象并清理资源
   */
  static destroyTRTCShareInstance() {
    if (trtcCloudInstance) {
      trtcCloudInstance.destroy();
      trtcCloudInstance = null;
    }
  }
  /**
   * 设置 frameWorkType 值
   * @param {Number} frameWorkType
   */
  setFrameWorkType(frameWorkType: number) {
    this.frameWorkType = frameWorkType;
  }
  /**
   * 获取 frameWorkType 的值
   */
  getFrameWorkType() {
    return this.frameWorkType;
  }
  /**
   * 绑定事件<br>
   * @param {String} event 事件名称
   * @param {Function} callback 事件回调
   * @memberof TRTCCloud
   * @example
   * trtcCloud.on('onEnterRoom', callback);
   */
  // on(event: string, callback: Function = () => { }): void {}
  /**
   * 取消事件绑定<br>
   * @param {String} event 事件名称，传入通配符 '*' 会解除所有事件绑定。
   * @param {Function} callback 事件回调
   * @memberof TRTCCloud
   * @example
   * trtcCloud.off('onEnterRoom', callback);
   * trtcCloud.off('*'); // 取消所有绑定的事件
   */
  off(event: string, callback: Function = () => { }): void {
    try {
      if (event === '*') {
        this.removeAllListeners();
      } else {
        this.removeListener(event, callback);
      }
    } catch (error: any) {
      console.log('off error ', error);
    }
  }
  /**
   * 进房<br>
   * 调用接口后，您会收到来自 [TRTCCallback](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html) 中的 [onEnterRoom](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onEnterRoom) 回调
   * - 如果加入成功，result 会是一个正数（result > 0），表示加入房间所消耗的时间，单位是毫秒（ms）
   * - 如果加入失败，result 会是一个负数（result < 0），表示进房失败的错误码
   *
   * 参数 scene 的枚举值如下：
   * - {@link TRTCAppSceneVideoCall}：<br>
   *          视频通话场景，支持720P、1080P高清画质，单个房间最多支持300人同时在线，最高支持50人同时发言。<br>
   *          适合：[1对1视频通话]、[300人视频会议]、[在线问诊]、[视频聊天]、[远程面试]等。<br>
   * - {@link TRTCAppSceneAudioCall}：<br>
   *          语音通话场景，支持 48kHz，支持双声道。单个房间最多支持300人同时在线，最高支持50人同时发言。<br>
   *          适合：[1对1语音通话]、[300人语音会议]、[语音聊天]、[语音会议]、[在线狼人杀]等。<br>
   * - {@link TRTCAppSceneLIVE}：<br>
   *          视频互动直播，支持平滑上下麦，切换过程无需等待，主播延时小于300ms；支持十万级别观众同时播放，播放延时低至1000ms。<br>
   *          适合：[视频低延时直播]、[十万人互动课堂]、[视频直播 PK]、[视频相亲房]、[互动课堂]、[远程培训]、[超大型会议]等。<br>
   * - {@link TRTCAppSceneVoiceChatRoom}：<br>
   *          语音互动直播，支持平滑上下麦，切换过程无需等待，主播延时小于300ms；支持十万级别观众同时播放，播放延时低至1000ms。<br>
   *          适合：[语音低延时直播]、[语音直播连麦]、[语聊房]、[K 歌房]、[FM 电台]等。<br>
   *
   * **Note:**
   * 1. 当 scene 选择为 TRTCAppSceneLIVE 或 TRTCAppSceneVoiceChatRoom 时，您必须通过 TRTCParams 中的 role 字段指定当前用户的角色。
   * 2. 不管进房是否成功，{@link TRTCCloud#enterRoom enterRoom()} 都必须与 {@link TRTCCloud#exitRoom exitRoom()} 配对使用。
   *    在调用 {@link TRTCCloud#exitRoom exitRoom()} 前再次调用 {@link TRTCCloud#enterRoom enterRoom()} 函数会导致不可预期的错误问题。
   *
   * @param {TRTCParams} params - 进房参数
   * @param {Number} params.sdkAppId      - 应用标识（必填）
   * @param {String} params.userId        - 用户标识（必填）
   * @param {String} params.userSig       - 用户签名（必填）
   * @param {Number} params.roomId        - 房间号码, roomId 和 strRoomId 必须填一个, 若您选用 strRoomId，则 roomId 需要填写为0。
   * @param {String} params.strRoomId     - 字符串房间号码 [选填]，在同一个房间内的用户可以看到彼此并进行视频通话,
   * roomId 和 strRoomId 必须填一个。若两者都填，则优先选择 roomId
   * @param {TRTCRoleType} params.role    - 直播场景下的角色，默认值：主播
   * - TRTCRoleAnchor: 主播，可以上行视频和音频，一个房间里最多支持50个主播同时上行音视频。
   * - TRTCRoleAudience: 观众，只能观看，不能上行视频和音频，一个房间里的观众人数没有上限。
   * @param {String=} params.privateMapKey - 房间签名（非必填）
   * @param {String=} params.streamId      - 自定义 CDN 播放地址（非必填）
   * @param {String=} params.userDefineRecordId - 设置云端录制完成后的回调消息中的 "userdefinerecordid" 字段内容，便于您更方便的识别录制回调（非必填）
   * @param {TRTCAppScene} scene 应用场景，目前支持视频通话（TRTCAppSceneVideoCall）、语音通话（TRTCAppSceneAudioCall）、
   * 在线直播（TRTCAppSceneLIVE）、语音聊天室（VTRTCAppSceneVoiceChatRoom）四种场景，详见 [TrtcDefines] 中 TRTCAppScene 参数定义
   *
   * @returns {Promise}
   * @memberof TRTCCloud
   * @example
   * import TRTCCloud from 'trtc-cloud-js-sdk';
   * const trtcCloud = TRTCCloud.getTRTCShareInstance(); // 创建实例，只需创建一次
   * const params = {
   *   sdkAppId: 0,
   *   userId: 'denny',
   *   roomId: 12345,
   *   userSig: 'xxx'
   * };
   * await trtcCloud.enterRoom(params, TRTCAppScene.TRTCAppSceneVideoCall);
   */
  async enterRoom(params: any, scene: TRTCAppScene) {
    if (params instanceof TRTCParams) {
      const {
        sdkAppId,
        userId,
        userSig,
        roomId,
        strRoomId,
        role,
        privateMapKey,
        streamId,
      } = params;
      this.sdkAppId = sdkAppId;
      this.userId = userId;
      this.userSig = userSig;
      this.roomId = roomId;
      this.strRoomId = strRoomId;
      this.mode = joinSceneMap[scene];
      this.role = roleMap[role];
      this.remoteUserAvailable = new Map();
      if (this.isSharedStream(userId)) {
        this.log_.error(`(enterRoom) failed - ${EnterRoomUserIdError.message} userId: ${this.userId}`);
        this.emitError(EnterRoomUserIdError);
        return;
      }
      // To-do: 数据上报暂时注释掉，后续再放开
      // this.log_.setId(`${this.logPrefix}|${this.userId}`);
      // // configure the logger for uploading
      // log.setConfig({
      //   sdkAppId: this.sdkAppId,
      //   userId: this.userId,
      //   version: this.version,
      // });
      // // 上报当前环境
      // const browserInfo = rtcDetector.getBrowserInfo();
      // setLogEventConfig({
      //   sdkAppId: this.sdkAppId,
      //   userId: this.userId,
      //   version: this.VERSION,
      //   browserVersion: browserInfo.name + browserInfo.version,
      //   ua: navigator.userAgent,
      // });

      // 字符串房间号码 [选填]，在同一个房间内的用户可以看到彼此并进行视频通话, roomId 和 strRoomId 必须填一个。若两者都填，则优先选择 roomId
      let tempRoomId: number | string = roomId;
      let useStringRoomId: boolean = false;
      if (!roomId && strRoomId) {
        tempRoomId = strRoomId;
        useStringRoomId = true;
      }

      if (this.isJoining || this.isJoined) {
        this.log_.error(`(enterRoom) failed - ${enterRoomError.message} isJoining: ${this.isJoining}, isJoined: ${this.isJoined}`);
        this.emitError(enterRoomError);
        return;
      }

      try {
        this.isJoining = true;
        let clientConfig: IClientConfig = {
          sdkAppId,
          userId,
          userSig,
          mode: this.mode,
          useStringRoomId,
          frameWorkType: this.frameWorkType,
        };
        clientConfig = privateMapKey ? { ...clientConfig, privateMapKey } : clientConfig;
        clientConfig = streamId ? { ...clientConfig, streamId } : clientConfig;
        this.initClient(clientConfig);
        this.startJoinTimestamp = performanceNow();
        await this.client.join({
          roomId: tempRoomId,
          role: this.role,
        });
        this.isJoined = true;
        this.isJoining = false;
        this.joinedTimestamp = performanceNow();
        const delta = this.joinedTimestamp - this.startJoinTimestamp;
        this.emit('onEnterRoom', delta);
        this.log_.info('(enterRoom) success - enter room');
        // To-do: 数据上报暂时注释掉，后续再放开
        // const currentEnvInfo = basis();
        // uploadEvent(`${this.logPrefix} - ${JSON.stringify(currentEnvInfo)}`);
        await this.publishLocalStream();
      } catch (error: any) {
        this.isJoining = false;
        this.emit('onEnterRoom', EnterRoomFailure);
        this.callFunctionErrorManage(error, 'enterRoom');
      }
    } else {
      this.emitError(ParametersError);
      this.log_.error(`(enterRoom) failed - ${ParametersError.message}: ${JSON.stringify(params)}`);
    }
  }
  /**
   * 退房<br>
   * 执行退出房间的相关逻辑释放资源后，SDK 会通过 [onExitRoom](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onExitRoom) 回调通知到您
   *
   * **Note:**
   * 1. 如果您要再次调用 {@link TRTCCloud#enterRoom enterRoom()} 或者切换到其它的音视频 SDK，请等待 [onExitRoom()](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onExitRoom) 回调到来后再执行相关操作，否则可能会遇到如摄像头、麦克风设备被强占等各种异常问题。
   * @memberof TRTCCloud
   * @returns {Promise}
   * @example
   * await trtcCloud.exitRoom();
   */
  async exitRoom() {
    this.log_.info(`(exitRoom) exitRoom, isJoined: ${this.isJoined}; isPublished: ${this.isPublished}`);
    try {
      if (!this.isJoined || this.isExiting) {
        this.log_.error(`(exitRoom) failed - ${exitRoomError.message} isJoined: ${this.isJoined} isExiting: ${this.isExiting}`);
        this.emitError(exitRoomError);
        return;
      }
      this.isExiting = true;
      if (this.isSharing) {
        await this.stopScreenShare();
      }
      if (this.isPublished) {
        await this.unPublishStream();
        this.destroyLocalStream();
      }
      this.emit('onExitRoom', ExitRoomCode.ActiveExitRoom);
      await this.client.leave();
      // this.destroyBeautyPlugin();
      this.resetStatus();
      this.destroy();
      this.log_.info('(exitRoom) success - exit room');
    } catch (error: any) {
      this.isExiting = false;
      this.callFunctionErrorManage(error, 'exitRoom');
    }
  }
  /**
   * 切换角色，**仅适用于直播场景（TRTCAppSceneLIVE 和 TRTCAppSceneVoiceChatRoom）**<br>
   * 在直播场景下，一个用户可能需要在“观众”和“主播”之间来回切换。
   * 您可以在进房前通过 TRTCParams 中的 role 指定角色，也可以通过 {@link TRTCCloud#switchRole switchRole()} 在进房后切换角色。
   *
   * @param {TRTCRoleType} role - 目标角色，默认为主播
   * - TRTCRoleAnchor: 主播，可以上行视频和音频，一个房间里最多支持50个主播同时上行音视频
   * - TRTCRoleAudience: 观众，只能观看，不能上行视频和音频，一个房间里的观众人数没有上限
   * @returns {Promise}
   * @memberof TRTCCloud
   * @example
   * import TRTCCloud, { TRTCRoleType } from 'trtc-cloud-js-sdk';
   * const trtcCloud = TRTCCloud.getTRTCShareInstance();
   * await trtcCloud.switchRole(TRTCRoleType.TRTCRoleAudience);
   */
  async switchRole(role: TRTCRoleType) {
    try {
      if (this.mode === NAME.RTC) {
        this.log_.info(`(publishLocalStream) failed - mode = ${this.mode}, role = ${role}`);
        this.handleOnSwitchRole(-1, `(publishLocalStream) failed - mode = ${this.mode}, role = ${role}`);
        return;
      }
      if (this.client) {
        if (!roleMap[role]) {
          this.handleOnSwitchRole(-1, `please pass valid role parameter, role = ${role}`);
        } else {
          await this.client.switchRole(roleMap[role]);
          this.role = roleMap[role];
          if (role === TRTCRoleType.TRTCRoleAnchor && this.localStream) {
            await this.client.publish(this.localStream); // 切换成 "anchor" 时，需要重新推流
          }
          this.handleOnSwitchRole(0, `switch role success, role = ${role}, ${roleMap[role]}`);
        }
      } else {
        this.handleOnSwitchRole(-1, `switch role failed, client = ${this.client}`);
      }
    } catch (error: any) {
      this.handleOnSwitchRole(-1, JSON.stringify(error));
    }
  }
  /**
   * 开启或关闭音量大小回调<br>
   * 开启此功能后，SDK 会在 [onUserVoiceVolume](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onUserVoiceVolume) 中反馈对每一路声音音量大小值的评估。
   *
   * **Note:**
   * - 如需打开此功能，请在 {@link TRTCCloud#startLocalAudio startLocalAudio()} 之前调用才可以生效。
   *
   * @param {Number} interval - 设置 onUserVoiceVolume 回调的触发间隔，单位为ms，最小间隔为100ms，如果小于等于0则会关闭回调，建议设置为300ms
   * @memberof TRTCCloud
   * @example
   * trtcCloud.enableAudioVolumeEvaluation(300);
   */
  enableAudioVolumeEvaluation(interval: number): void {
    if (this.client) {
      this.client.enableAudioVolumeEvaluation(interval);
    } else if (interval <= 0) {
      this.enableAudioVolumeTimer && clearInterval(this.enableAudioVolumeTimer);
    }
    this.enableAudioVolumeInterval = interval;
  }

  // ///////////////////////////////////////////////////////////////////////////////
  //
  //                      内部方法
  //
  // ///////////////////////////////////////////////////////////////////////////////
  /**
   * 调用方法失败处理
   * @param error Error 实例或 trtc-js-sdk 中定义的 RtcError 实例
   * @param functionName 函数名称, 调用函数的名称用以记录出错的位置
   */
  callFunctionErrorManage(error: any, functionName: string): void {
    if (error && error.getCode && error.getCode()) {
      this.emit(NAME.ON_ERROR, error.getCode(), error.message_);
      this.log_.error(`(${functionName}) failed - ${error.message_}`);
    } else {
      this.emit(NAME.ON_ERROR, jsExecuteError.code, error.message);
      this.log_.error(`(${functionName}) failed - ${error.message}`);
    }
  }
  // 维护的状态复位
  resetStatus() {
    this.isExiting = false;
    this.isJoining = false;
    this.isJoined = false;
    this.isPublishing = false;
    this.isPublished = false;
    this.isSubscribed = false;
    this.remoteStreamMap.clear();
    this.videoEncodeParam = {
      width: this.defaultVideoWidth,
      height: this.defaultVideoHeight,
      frameRate: this.defaultVideoFps,
      bitrate: this.defaultVideoBitRate,
    };
    this.screenShareParams = {
      width: this.defaultShareWidth,
      height: this.defaultShareHeight,
      frameRate: this.defaultShareFrameRate,
      bitrate: this.defaultShareBitrate,
    };
  }
  // 推流
  async publishLocalStream() {
    const { mode, role, isJoined, isPublishing, isPublished, localStream, client } = this;
    // live + audience 时, 不推流
    if (mode === NAME.LIVE && role === NAME.AUDIENCE) {
      this.log_.info(`(publishLocalStream) failed - mode = ${mode}, role = ${role}`);
      return;
    }
    if (!isJoined || isPublishing || isPublished || !localStream || !client) {
      this.log_.info(`(publishLocalStream) failed - isJoined = ${isJoined},
        isPublishing = ${isPublishing}, isPublished = ${isPublished}, localStream = ${localStream}, client.userId = ${client ? client.getUserId() : null}`);
      return;
    }
    this.log_.info('(publishLocalStream) start - publish stream');
    // 如果：已进房 + 未推流, 此时需要推流
    if (isJoined && !isPublished) {
      this.isPublishing = true;
      try {
        await this.setStreamVideoParam(this.videoEncodeParam);
        this.localStream && await this.client.publish(this.localStream);
        this.isPublishing = false;
        this.isPublished = true;
        // 发布流之后不再单独获取本地流的音量
        this.enableAudioVolumeTimer && clearInterval(this.enableAudioVolumeTimer);
        this.log_.info('(publishLocalStream) success - publish stream');
      } catch (error: any) {
        this.isPublishing = false;
        this.callFunctionErrorManage(error, 'publishLocalStream');
      }
    }
  }
  // 停止推流
  async unPublishStream() {
    this.log_.info('(unPublishStream) unPublishStream', this.localStream);
    if (this.isPublished && this.localStream) {
      await this.client.unpublish(this.localStream);
      this.isPublished = false;
    }
  }
  // 设置 video 参数
  async setStreamVideoParam(videoEncodeParam: IVideoParam) {
    try {
      if (this.localStream) {
        let videoTrack = this.localStream.getVideoTrack();
        if (!videoTrack) {
          return;
        }
        await this.localStream.setVideoProfile(videoEncodeParam);

        // 获取实际采集的分辨率和帧率
        videoTrack = this.localStream.getVideoTrack();
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          console.log(`分辨率：${settings.width} * ${settings.height}, 帧率：${settings.frameRate}`);
        }
      } else {
        this.videoEncodeParam = videoEncodeParam;
      }
    } catch (error: any) {
      if (error.name === 'OverconstrainedError') {
        console.error('当前摄像头不支持该 profile');
        // 设置失败，当前摄像头已停止采集，需要恢复采集
        const stream = this.TRTC.createStream({
          video: true,
          audio: false,
        });
        await stream.initialize();
        this.localStream.replaceTrack(stream.getVideoTrack());
      } else {
        console.error('当前浏览器不支持动态调用该接口');
      }
    }
  }
  // 关闭本地流
  destroyLocalStream() {
    if (this.localStream) {
      this.localStream.stop();
      this.localStream && this.localStream.close();
      this.localStream = null;
    }
  }
  // 解绑 client 事件, 释放 client 资源
  destroy() {
    this.unbindEvents();
    if (this.client) {
      this.client = null;
    }
  }
  /**
   * stream 初始化
   * @param streamConfig stream 初始化需要的参数
   */
  async initStream(streamConfig: any) {
    this.localStream = this.TRTC.createStream(streamConfig);
    this.videoEncodeParam && this.localStream.setVideoProfile(this.videoEncodeParam);
    await this.localStream.initialize();
  }
  /**
   * 本地流是否包含音/视频
   * @param type {String} stream 中包含的track类型 ['video' | 'audio']
   * 返回: 是否包含的 boolean
   */
  localStreamHasVideoOrAudio(type: string): boolean {
    if (!type || !isString(type)) {
      this.emitError(ParametersError);
    }
    if (!this.localStream) {
      return false;
    }
    switch (type) {
      case NAME.VIDEO: {
        const videoTrack = this.localStream.getVideoTrack();
        return !!videoTrack;
      }
      case NAME.AUDIO: {
        const audioTrack = this.localStream.getAudioTrack();
        return !!audioTrack;
      }
      default: {
        return false;
      }
    }
  }
  /**
   * 播放流
   * @param stream 待播放的流
   * @param dom {string | HTMLElement} 播放的 dom id 或 dom 节点
   */
  async playStream(stream: any, dom: string | HTMLElement, options: any) {
    if (!dom || !stream) {
      this.log_.error(`(playStream) failed - dom = ${dom}, stream = ${stream}`);
      return;
    }
    stream.play(dom, options);
    let userId = stream.getUserId();
    userId = this.isSharedStream(userId) ? userId.slice(6) : userId;
    const streamType = this.getStreamType(stream);
    this.playViewMap.set(`${userId}-${streamType}`, dom);
  }
  /**
   * 客户端对象初始化
   * @param clientConfig {Object} client 对象初始化所需参数
   */
  initClient(clientConfig: any) {
    this.client = this.TRTC.createClient(clientConfig);
    if (this.enableAudioVolumeInterval) {
      this.client.enableAudioVolumeEvaluation(this.enableAudioVolumeInterval);
    }
    this.bindEvents();
  }
  // todo: 参考 sdk/src/signal/signal-channel.js 将 events 实现在 sdk 内部
  bindEvents() {
    this.client.on('error', this.handleError);
    this.client.on('peer-join', this.handlePeerJoin);
    this.client.on('peer-leave', this.handlePeerLeave);
    this.client.on('stream-added', this.handleStreamAdded);
    this.client.on('stream-subscribed', this.handleStreamSubscribed);
    this.client.on('stream-removed', this.handleStreamRemoved);
    this.client.on('stream-updated', this.handleStreamUpdated);
    this.client.on('mute-audio', this.handleMuteAudio);
    this.client.on('unmute-audio', this.handleUnmuteAudio);
    this.client.on('mute-video', this.handleMuteVideo);
    this.client.on('unmute-video', this.handleUnmuteVideo);
    this.client.on('client-banned', (error: any) => {
      this.log_.error(`client has been banned for ${error}`);
      this.emit('onExitRoom', ExitRoomCode.KickedExitRoom);
    });
    this.client.on('audio-volume', this.handleAudioVolume);
    this.client.on('network-quality', this.handleNetworkQuality);
  }
  // 解除所有事件绑定
  unbindEvents() {
    this.client && this.client.off('*');
  }
  // 抛出 onError, 上层应用监听该事件
  emitError(error: IError): void {
    if (!error || !this.emit) {
      return;
    }
    this.emit(NAME.ON_ERROR, error.code, error.message);
  }

  // //////////////////////////////////////////////////////////////////////////////
  //
  //                       设置 TRTCCallback 回调
  //
  // //////////////////////////////////////////////////////////////////////////////
  /**
   * 设置 TRTCCloud 回调
   *
   * @namespace TRTCCallback
   * @example
   * import TRTCCloud from 'trtc-cloud-js-sdk';
   * const trtcCloud = TRTCCloud.getTRTCShareInstance();
   *
   * // 添加事件监听的方法，事件关键字详见下方”通用事件回调“
   * trtcCloud.on('onEnterRoom', (result) => {
   *   if (result > 0) {
   *     console.log(`enter room success, spend ${result}ms`);
   *   } else {
   *     console.log(`enter room failed, error code = ${result}`);
   *   }
   * });
   */
  /**
   * 错误回调：SDK 不可恢复的错误，一定要监听，并分情况给用户适当的界面提示
   *
   * @event TRTCCallback#onError
   * @param {Number} code - 错误码
   * @param {String} message  - 错误信息
   */
  handleError(error: any) {
    this.log_.error(`handle error observed ${error}`);
    this.emit(NAME.ON_ERROR, error.getCode(), error.message);
  }
  /**
   * 进房后的回调<br>
   * 调用 {@link TRTCCloud#enterRoom enterRoom()} 接口执行进房操作后，会收到 [onEnterRoom](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onEnterRoom) 回调<br>
   * - 如果加入成功，result 会是一个正数（result > 0），代表加入房间的时间消耗，单位是毫秒（ms）。<br>
   * - 如果加入失败，result 会是一个负数（result < 0），代表进房失败的错误码。
   *
   * @event TRTCCallback#onEnterRoom
   * @param {Number} result 进房耗时
   */
  handleEnterRoom() { }
  /**
   * 离开房间的事件回调<br>
   * 调用 {@link TRTCCloud#exitRoom exitRoom()} 接口会执行退出房间的相关逻辑，例如释放音视频设备资源和编解码器资源等。待资源释放完毕，会通过 [onExitRoom](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onExitRoom) 回调通知到您<br>
   *
   * **Note:**
   * - 如果您要再次调用 {@link TRTCCloud#enterRoom enterRoom()} 或者切换到其他的音视频 SDK，
   *   请等待 [onExitRoom](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onExitRoom) 回调到来之后再执行相关操作。 否则可能会遇到音频设备被占用等各种异常问题
   *
   * @event TRTCCallback#onExitRoom
   * @param {Number} reason 离开房间原因，0：主动调用 exitRoom 退房；1：被服务器踢出当前房间；2：当前房间整个被解散
   */
  handleExitRoom() { }
  /**
   * 有用户加入当前房间<br>
   * @event TRTCCallback#onRemoteUserEnterRoom
   * @param {String} userId 用户标识 ID
   */
  handlePeerJoin(event: { userId: string }) {
    const { userId } = event;
    // webRtc 的屏幕分享也会有 client 进房
    if (this.isSharedStream(userId) && this.remoteUserAvailable.has(userId)) return;
    const tempArray = Array.from(this.remoteUserAvailable.keys()) || [];
    this.remoteUserAvailable.set(userId, {
      isAudioAvailable: false,
      isVideoAvailable: false,
    });
    // 本地屏幕分享进房时，不抛出远端用户进房 'onRemoteUserEnterRoom' 事件
    if (isContained(this.userId, userId)) {
      return;
    }
    // 远端 A 推了 video + 屏幕分享流；本地进房先收到音视频流，后收到屏幕分享流。不抛出 'onRemoteUserEnterRoom' 事件
    const list = tempArray.filter(str => isContained(str as string, userId)) || [];
    if (list.length > 0) {
      return;
    }
    // 远端 A 推了 video + 屏幕分享流；本地进房先收到屏幕分享流，后收到音视频流。此时也不抛出 'onRemoteUserEnterRoom' 事件
    if (this.isSharedStream(userId)) {
      return;
    }
    this.emit('onRemoteUserEnterRoom', userId);
  }
  /**
   * 有用户离开当前房间<br>
   * **Note:**
   * - live 模式下，不支持观众进退房通知
   *
   * @event TRTCCallback#onRemoteUserLeaveRoom
   * @param {String} userId 用户标识 ID
   * @param {Number} reason 离开原因，0 表示用户主动退出房间，1 表示用户超时退出，2 表示被踢出房间
   */
  handlePeerLeave(event: { userId: string }) {
    const { userId = '' } = event;
    // electron 离开原因，0表示用户主动退出房间，1表示用户超时退出，2表示被踢出房间
    // 这里固定为 0, 因为 webRtc 都是主动退房时抛出 peer-leave
    const reason = 0;
    if (this.isSharedStream(userId)) return;
    this.emit('onRemoteUserLeaveRoom', userId, reason);
  }
  /**
   * 远端用户是否存在可播放的音频数据<br>
   * @event TRTCCallback#onUserAudioAvailable
   * @param {String} userId 用户标识 ID
   * @param {Number} available 声音是否开启
   */
  async handleOnUserAudioAvailable(userId: string, available: boolean, streamType: string) {
    this.remoteUserAvailable.get(userId).isAudioAvailable = available;
    this.emit('onUserAudioAvailable', userId, available ? 1 : 0); // 和 electron 对齐抛出 available 为 number
    if (available) {
      const isPlaying = this.remoteStreamMap.get(`${userId}-${streamType}`).isPlaying();
      if (!isPlaying) {
        const tempContainer = this.generateTempAudioContainer(`${userId}-${streamType}_dom`);
        await this.remoteStreamMap.get(`${userId}-${streamType}`).play(tempContainer);
        await this.remoteStreamMap.get(`${userId}-${streamType}`).setAudioOutput(this.currentSpeakerId);
      }
    } else {
      this.clearTempAudioContainer(`${userId}-${streamType}_dom`);
    }
  }
  /**
   * 远端用户是否存在可播放的主路画面（一般用于摄像头）<br>
   * @event TRTCCallback#onUserVideoAvailable
   * @param {String} userId 用户标识 ID
   * @param {Number} available 画面是否开启
   */
  handleOnUserVideoAvailable(userId: string, available: boolean) {
    this.remoteUserAvailable.get(userId).isVideoAvailable = available;
    this.emit('onUserVideoAvailable', userId, available ? 1 : 0);
  }
  /**
   * 远端用户是否存在可播放的辅路画面（屏幕分享）<br>
   * @event TRTCCallback#onUserSubStreamAvailable
   * @param {String} userId 用户标识 ID
   * @param {Boolean} available 画面是否开启
   */
  handleOnUserSubStreamAvailable(userId: string, available: boolean) {
    try {
      this.remoteUserAvailable.get(userId).isVideoAvailable = available;
      let trimUserId = userId;
      if (this.isSharedStream(userId)) {
        trimUserId = userId.slice(6);
        if (trimUserId === this.userId) { // 收到自己的屏幕分享流时，不抛出 onUserSubStreamAvailable 事件
          return;
        }
      }
      this.emit('onUserSubStreamAvailable', trimUserId, available ? 1 : 0);
    } catch (error) {
      this.emitError(ParametersError);
    }
  }

  /**
   * 切换角色的事件回调<br>
   * @event TRTCCallback#onSwitchRole
   * @param {Number} code 状态码
   * @param {String} message 状态码对应的信息
   */
  handleOnSwitchRole(code: number, message: string) {
    this.emit('onSwitchRole', code, message);
  }
  /**
   * 音量大小事件<br>
   * 调用 {@link TRTCCloud#enableAudioVolumeEvaluation enableAudioVolumeEvaluation()} 接口开启音量大小回调后，
   * SDK 会定时抛出该事件，通知每个 userId 的音量大小。
   * @event TRTCCallback#onUserVoiceVolume
   * @param {Array<TRTCVolumeInfo>} userVolumes 房间内所用用户的音量
   */
  handleAudioVolume(event: { result: [] }) {
    let userVolumes: any = event.result || [];
    userVolumes = userVolumes.map((obj: any) => ({ userId: obj.userId === this.userId ? '' : obj.userId, volume: obj.audioVolume })) || [];
    userVolumes = userVolumes.filter((obj: any) => !this.isSharedStream(obj.userId)); // 过滤掉屏幕分享
    this.emit('onUserVoiceVolume', userVolumes, userVolumes.length);
  }

  async handleStreamAdded(event: {
    stream: {
      getUserId: () => string;
      getType: () => string;
      hasAudio: () => boolean;
      hasVideo: () => boolean;
    };
  }) {
    const { stream } = event;
    let userId = stream.getUserId();
    userId = this.isSharedStream(userId) ? userId.slice(6) : userId;
    const streamType = this.getStreamType(stream);
    this.remoteStreamMap.set(`${userId}-${streamType}`, event.stream);
    if (streamType === NAME.AUXILIARY) {
      this.handleOnUserSubStreamAvailable(userId, true);
    } else {
      if (stream.hasAudio()) {
        await this.handleOnUserAudioAvailable(userId, true, streamType);
      }
      if (stream.hasVideo()) {
        const tempArray = Array.from(this.remoteUserAvailable.keys()) || [];
        // 收到远端的屏幕分享流，抛出 onUserSubStreamAvailable 事件
        const list = tempArray.filter(str => isContained(str as string, userId)) || [];
        if (list.length > 0) {
          this.handleOnUserSubStreamAvailable(userId, true);
          return;
        }
        // stream-added 的用户前缀为 'share_' 并且 userId.slice(6) 等于自己的 userId，收到自己的屏幕分享时，不抛出 onUserVideoAvailable 事件
        if (this.isSharedStream(userId) && userId.slice(6) === this.userId) {
          return;
        }
        this.handleOnUserVideoAvailable(userId, true);
      }
    }
    this.handleSubscribe(event.stream);
  }
  async handleSubscribe(remoteStream: any, config = { audio: true, video: true }) {
    try {
      await this.client.subscribe(remoteStream, {
        audio: isUndefined(config.audio) ? true : config.audio,
        video: isUndefined(config.video) ? true : config.video,
      });
    } catch (error: any) {
      console.error(
        `subscribe ${remoteStream.getUserId()} with audio: ${config.audio} video: ${config.video
        } error`,
        error,
      );
    }
  }
  // 暂时没用
  handleStreamSubscribed() {
    this.isSubscribed = true;
  }
  async handleStreamRemoved(event: {
    stream: {
      getUserId: () => string;
      getType: () => string;
    };
  }) {
    const userId = event.stream.getUserId();
    const streamType = this.getStreamType(event.stream);
    if (streamType === NAME.MAIN) {
      const tempArray = Array.from(this.remoteUserAvailable.keys()) || [];
      // 收到远端的停止屏幕分享流，抛出 onUserSubStreamAvailable 事件
      const list = tempArray.filter(str => isContained(str as string, userId)) || [];
      if (list.length > 0) {
        this.handleOnUserSubStreamAvailable(userId, false);
        return;
      }
      await this.handleOnUserAudioAvailable(userId, false, streamType);
      this.handleOnUserVideoAvailable(userId, false);
    } else if (streamType === NAME.AUXILIARY) {
      this.handleOnUserSubStreamAvailable(userId, false);
    }
    this.remoteStreamMap.delete(`${userId}-${streamType}`);
  }
  async handleStreamUpdated(event: {
    stream: {
      getUserId: () => string;
      getType: () => string;
      hasAudio: () => boolean;
      hasVideo: () => boolean;
    };
  }) {
    const { stream } = event;
    const userId = stream.getUserId();
    const streamType = this.getStreamType(stream);
    // 屏幕分享不再抛出 onUserVideoAvailable、onUserAudioAvailable 事件
    if (streamType === NAME.AUXILIARY) return;
    if (stream.hasAudio() && !this.remoteUserAvailable.get(userId).isAudioAvailable) {
      await this.handleOnUserAudioAvailable(userId, true, streamType);
    }
    if (stream.hasVideo() && !this.remoteUserAvailable.get(userId).isVideoAvailable) {
      const tempArray = Array.from(this.remoteUserAvailable.keys()) || [];
      // 收到远端的屏幕分享流，抛出 onUserSubStreamAvailable 事件
      const list = tempArray.filter(str => isContained(str as string, userId)) || [];
      if (list.length > 0) {
        this.handleOnUserSubStreamAvailable(userId, true);
        return;
      }
      // stream-added 的用户前缀为 'share_' 并且 userId.slice(6) 等于自己的 userId，收到自己的屏幕分享时，不抛出 onUserVideoAvailable 事件
      if (this.isSharedStream(userId) && userId.slice(6) === this.userId) {
        return;
      }
      this.handleOnUserVideoAvailable(userId, true);
    }
  }
  async handleMuteAudio(event: { userId: string }) {
    const { userId } = event;
    if (this.isSharedStream(userId)) return;
    if (userId) {
      await this.handleOnUserAudioAvailable(userId, false, NAME.MAIN);
    }
  }
  async handleUnmuteAudio(event: { userId: string }) {
    const { userId } = event;
    if (this.isSharedStream(userId)) return;
    if (userId && !this.remoteUserAvailable.get(userId).isAudioAvailable) {
      await this.handleOnUserAudioAvailable(userId, true, NAME.MAIN);
    }
  }
  handleMuteVideo(event: { userId: string }) {
    const { userId } = event;
    if (this.isSharedStream(userId)) return;
    if (userId) {
      this.handleOnUserVideoAvailable(userId, false);
    }
  }
  handleUnmuteVideo(event: { userId: string }) {
    const { userId } = event;
    if (this.isSharedStream(userId)) return;
    if (userId && !this.remoteUserAvailable.get(userId).isVideoAvailable) {
      const tempArray = Array.from(this.remoteUserAvailable.keys()) || [];
      // 收到远端的屏幕分享流，抛出 onUserSubStreamAvailable 事件
      const list = tempArray.filter(str => isContained(str as string, userId)) || [];
      if (list.length > 0) {
        this.handleOnUserSubStreamAvailable(userId, true);
        return;
      }
      // stream-added 的用户前缀为 'share_' 并且 userId.slice(6) 等于自己的 userId，收到自己的屏幕分享时，不抛出 onUserVideoAvailable 事件
      if (this.isSharedStream(userId) && userId.slice(6) === this.userId) {
        return;
      }
      this.handleOnUserVideoAvailable(userId, true);
    }
  }
  getLocalStatistics(): Promise<TRTCLocalStatistics> {
    return this.client.getLocalVideoStats().then((stats: any) => {
      const localVideoStats = stats[this.client.getUserId()];
      let bytesSent = localVideoStats.bytesSent - this.prevLocalVideoStats.bytesSent;
      let framesEncoded = localVideoStats.framesEncoded - this.prevLocalVideoStats.framesEncoded;
      const width = localVideoStats.frameWidth;
      const height = localVideoStats.frameHeight;
      if (bytesSent < 0) {
        bytesSent = 0;
      }
      if (framesEncoded < 0) {
        framesEncoded = 0;
      }
      this.prevLocalVideoStats = localVideoStats;
      const videoBitrate = Number((bytesSent * 8 / 1000 / 2).toFixed());
      const frameRate = Number((framesEncoded / 2).toFixed());
      const streamType = TRTCVideoStreamType.TRTCVideoStreamTypeBig;
      const localStatistics = new TRTCLocalStatistics(width, height, frameRate, videoBitrate, 0, 0, streamType);
      return localStatistics;
    });
  }
  /**
   * 网络质量统计数据事件，进房后开始统计，每两秒触发一次，包括上、下行的网络质量数据<br>
   * - 上行网络质量（uplinkNetworkQuality）为 SDK 到腾讯云的上行连接网络质量
   * - 下行网络质量（downlinkNetworkQuality）为腾讯云到 SDK 的所有下行连接的平均网络质量 其枚举值及含义如下表所示
   *    其枚举值及含义如下表所示：
   *    | 数值 | 含义 |
   *    | :--- | :---- |
   *    | 0 | 网络状况未知，表示当前 client 实例还没有建立上行/下行连接 |
   *    | 1 | 网络状况极佳 |
   *    | 2 | 网络状况较好|
   *    | 3 | 网络状况一般 |
   *    | 4 | 网络状况差 |
   *    | 5 | 网络状况极差 |
   *    | 6 | 网络连接已断开<br/>注意：若下行网络质量为此值，则表示所有下行连接都断开了 |
   * - uplinkRTT，uplinkLoss 为上行 RTT(ms) 及上行丢包率。
   * - downlinkRTT，downlinkLoss 为所有下行连接的平均 RTT(ms) 及平均丢包率。
   *
   * @param {String} userId 用户 ID
   * @param {TRTCNetQuality} uplinkNetworkQuality 上行网络质量
   * @param {Number} uplinkRTT 上行 RTT(ms)
   * @param {Number} uplinkLoss 上行丢包率
   * @param {Number} downlinkRTT 所有下行连接的平均 RTT(ms)
   * @param {Number} downlinkLoss 所有下行连接的平均丢包率
   * @event TRTCCallback#onNetworkQuality
   */
  async handleNetworkQuality(event:
    {
      uplinkNetworkQuality: TRTCNetQuality,
      uplinkRTT: number,
      uplinkLoss: number,
      downlinkRTT: number,
      downlinkLoss: number,
    }) {
    const { uplinkNetworkQuality, uplinkRTT, uplinkLoss, downlinkRTT, downlinkLoss } = event;
    const userId = this.client ? this.client.getUserId() : '';
    // eslint-disable-next-line max-len
    const localQuality = new TRTCNetQualityInfo(userId, uplinkNetworkQuality, uplinkNetworkQuality, uplinkRTT, uplinkLoss, downlinkRTT, downlinkLoss);
    this.emit('onNetworkQuality', localQuality);

    const localStatistics: TRTCLocalStatistics = await this.getLocalStatistics();
    const statistics = new TRTCStatistics(uplinkLoss, downlinkLoss, 0, 0, uplinkRTT, 0, 0, [localStatistics]);
    this.emit('onStatistics', statistics);
  }
  /**
   * 内部方法：设备插拔事件处理
   */
  async handleDeviceChange() {
    // 重新获取 camera 设备列表
    this.TRTC.getCameras().then(async (list: Array<TRTCDeviceInfo>) => {
      if (this.cameraList.length === list.length) return;
      await this.deviceChangeManage(this.cameraList, list, TRTCDeviceType.TRTCDeviceTypeCamera);
      this.cameraList = list;
    });
    // 重新获取 mic 设备列表
    this.TRTC.getMicrophones().then(async (list: Array<TRTCDeviceInfo>) => {
      if (this.micList.length === list.length) return;
      await this.deviceChangeManage(this.micList, list, TRTCDeviceType.TRTCDeviceTypeMic);
      this.micList = list;
    });
    // 重新获取 speaker 设备列表
    this.TRTC.getSpeakers().then(async (list: Array<TRTCDeviceInfo>) => {
      if (this.speakerList.length === list.length) return;
      await this.deviceChangeManage(this.speakerList, list, TRTCDeviceType.TRTCDeviceTypeSpeaker);
      this.speakerList = list;
    });
  }
  /**
   * 设备插拔事件<br>
   * @param {String} deviceId 设备 ID
   * @param {TRTCDeviceType} type 设备类型
   * @param {TRTCDeviceState} state 设备状态
   * @event TRTCCallback#onDeviceChange
   */
  emitOnDeviceChange(deviceId: string, type: TRTCDeviceType, state: TRTCDeviceState) {
    this.emit('onDeviceChange', deviceId, type, state);
  }
  /**
   * 内部方法：设备插拔数据处理<br>
   * @param {Array<TRTCDeviceInfo>} currentDeviceList 原来设备列表
   * @param {Array<TRTCDeviceInfo>} list 当前获取的设备列表
   * @param {TRTCDeviceType} type 设备类型
   */
  // eslint-disable-next-line max-len
  async deviceChangeManage(currentDeviceList: Array<TRTCDeviceInfo>, list: Array<TRTCDeviceInfo>, type: TRTCDeviceType) {
    if (currentDeviceList.length !== list.length) {
      let deviceIdList: Array<String> = (list || []).map(obj => obj.deviceId);
      let deviceInfo: TRTCDeviceInfo = new TRTCDeviceInfo();
      let state: TRTCDeviceState = TRTCDeviceState.TRTCDeviceStateAdd;
      // 拔出设备
      if (currentDeviceList.length > list.length) {
        deviceInfo = currentDeviceList.filter(obj => !deviceIdList.includes(obj.deviceId))[0] || {};
        state = TRTCDeviceState.TRTCDeviceStateRemove;
      }
      // 插入设备
      if (currentDeviceList.length < list.length) {
        deviceIdList = (currentDeviceList || []).map(obj => obj.deviceId);
        deviceInfo = list.filter(obj => !deviceIdList.includes(obj.deviceId))[0] || {};
      }
      const { deviceId: changedDeviceId } = deviceInfo;
      this.emitOnDeviceChange(changedDeviceId, type, state);
      if (state === TRTCDeviceState.TRTCDeviceStateAdd) { // 插入设备
        await this.autoChangeDevice(type, state, changedDeviceId);
      } else if (state === TRTCDeviceState.TRTCDeviceStateRemove) { // 拔出设备
        // 当前拔出的设备 id 等于当前的 micId 或当前的 speakerId，拔出设备需要自动切换设备
        if (changedDeviceId === this.currentSpeakerId || changedDeviceId === this.currentMicId) {
          const defaultDeviceInfo: TRTCDeviceInfo = this.getDefaultDeviceInfo(list);
          defaultDeviceInfo.deviceId && await this.autoChangeDevice(type, state, defaultDeviceInfo.deviceId);
        }
        // 拔出 camera，底层 SDK 会进行切换，抛出 active 事件
        if (type === TRTCDeviceType.TRTCDeviceTypeCamera) {
          const defaultDeviceInfo: TRTCDeviceInfo = this.getDefaultDeviceInfo(list);
          defaultDeviceInfo.deviceId && await this.autoChangeDevice(type, state, defaultDeviceInfo.deviceId);
        }
      }
    }
  }
  /**
   * 内部方法：设备插拔后，自动切换设备<br>
   * @param {TRTCDeviceType} type 设备类型
   * @param {TRTCDeviceState} state 设备状态
   */
  async autoChangeDevice(type: TRTCDeviceType, state: TRTCDeviceState, deviceId: string) {
    // 拔出摄像头，底层 SDK 进行切换，返回当前活跃的摄像头
    if (type === TRTCDeviceType.TRTCDeviceTypeCamera) {
      this.currentCameraId = deviceId;
      this.emitOnDeviceChange(deviceId, type, TRTCDeviceState.TRTCDeviceStateActive);
    }
    // 插入、拔出麦克风，自动切换至插入的麦克风；如果当前 mic 不是插入的 mic，则不进行切换也不抛出事件
    if (type === TRTCDeviceType.TRTCDeviceTypeMic) {
      if (this.localStream) {
        await this.localStream.switchDevice(NAME.AUDIO, deviceId);
      }
      this.currentMicId = deviceId;
      this.emitOnDeviceChange(deviceId, type, TRTCDeviceState.TRTCDeviceStateActive);
    }
    // 插入、拔出 speaker，自动切换至插入的 speaker
    if (type === TRTCDeviceType.TRTCDeviceTypeSpeaker) {
      if (this.remoteStreamMap.size > 0) {
        const remoteStreamList = this.getRemoteStreamList();
        // TODO: 如果某个 remoteStream 出现切换失败呢？
        await Promise.all(remoteStreamList.map(async stream => await stream.setAudioOutput(deviceId)));
      }
      this.currentSpeakerId = deviceId;
      this.emitOnDeviceChange(deviceId, type, TRTCDeviceState.TRTCDeviceStateActive);
    }
  }
  // ----------------------------------------------------------------
  //                              内部公共方法
  // ----------------------------------------------------------------
  // 获取 remote stream list
  getRemoteStreamList() {
    const remoteStreamList: Array<any> = [];
    if (this.remoteStreamMap.size > 0) {
      Array.from(this.remoteStreamMap, ([, value]) => (value)).forEach((stream) => {
        if (stream) {
          remoteStreamList.push(stream);
        }
      });
      // remoteStreamList = [...this.remoteStreamMap.values()];
    }
    return remoteStreamList;
  }
  /**
   * 获取默认的设备信息：TRTC 获取设备列表时，里面会包含 deviceId = 'default' 的设备
   * - 设备列表中，含有 deviceId = 'default' 的设备，通过 groupId 获取该设备的信息
   * - 设备列表中，不含有 deviceId = 'default' 的设备，返回设备列表的第一个设备信息
   * @param {Array<TRTCDeviceInfo>} deviceList 传入的设备列表
   */
  getDefaultDeviceInfo(deviceList: Array<TRTCDeviceInfo>): TRTCDeviceInfo {
    let defaultDeviceInfo: TRTCDeviceInfo = new TRTCDeviceInfo();
    if (deviceList.length === 0) return defaultDeviceInfo;

    const list = deviceList.filter(obj => obj.deviceId === 'default');
    if (list.length > 0) {
      const { groupId } = list[0];
      // eslint-disable-next-line max-len
      [defaultDeviceInfo] = deviceList.filter(obj => obj.groupId === groupId).filter(obj => obj.deviceId !== NAME.DEFAULT);
    } else {
      [defaultDeviceInfo] = deviceList;
    }
    return defaultDeviceInfo;
  }
  /**
   * 解析 TRTCVideoResolution 将其转成 width、height。例如：TRTCVideoResolution_120_120 得到 { width: 120, height: 120 }
   * @param {TRTCVideoResolution} videoResolution 分辨率
   */
  getResolution(videoResolution: TRTCVideoResolution) {
    const TRTCVideoResolutionString = TRTCVideoResolution[videoResolution];
    const videoResolutionList = (TRTCVideoResolutionString || '').split('_');
    const width = videoResolutionList.length > 1 && videoResolutionList[1];
    const height = videoResolutionList.length > 2 && videoResolutionList[2];
    return { width, height };
  }
  /**
   * 返回 stream 的 type<br>
   * webRtc 推流时, 屏幕分享流也是主流, 因此需要将其 streamType 设置为 auxiliary
   * 判断规则：如果 stream 的 userId 前缀为 'share_'。返回 type = 'auxiliary'
   * @param {Stream} stream 流
   */
  getStreamType(stream: any) {
    if (!stream) {
      return '';
    }
    const userId: string = stream.getUserId();
    let streamType: string = stream && stream.getType();
    if (this.isSharedStream(userId) && streamType === NAME.MAIN) {
      streamType = NAME.AUXILIARY;
    }
    return streamType;
  }
  /**
   * 判断当前用户是否是屏幕分享的 userId
   * @param {String} userId 用户 ID
   * @returns {Boolean}
   */
  isSharedStream(userId: string) {
    return userId.slice(0, 6) === NAME.SCREEN_SHARE_USER_ID_PREFIX;
  }
}
export default TRTCCloud;

// (window as any).TRTCCloud = TRTCCloud;
// Object.keys(TYPE).forEach((key) => {
//   (window as any)[key] = TYPE[key];
// });
