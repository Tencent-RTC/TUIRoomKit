/* eslint-disable no-underscore-dangle */
import { EventEmitter } from 'events';
// import IDLogger from './utils/log/id-logger';
// import log from './utils/log/logger';
import { TRTCAppScene, TRTCParams, TRTCQualityInfo, TRTCStatistics, TRTCVideoStreamType, TRTCLocalStatistics } from './common/trtc_define';
import { EnterRoomFailure, roleMap, joinSceneMap, liveMode, audienceRole, ExitRoomCode, ON_ERROR, auxiliaryStream } from './common/constants';
// @ts-ignore
import { MixinsClass, isString, isUndefined, performanceNow } from './utils/utils';
import { BaseCommon } from './BaseCommon';
import { MixCDN } from './MixCDN';
import { Video } from './Video';
import { Audio } from './Audio';
import { Camera } from './Camera';
import { Mic } from './Mic';
import { Share } from './Share';
import { Beauty } from './Beauty';
import { IClientConfig } from './common/IClientConfig';
import { IError } from './common/IError';
import { IVideoParam } from './common/IVideoParam';
import { basis } from './utils/rtc-detection';
// import { setLogEventConfig, uploadEvent } from './utils/event-log';
import * as rtcDetector from './utils/rtc-detection';
import { jsExecuteError, ParametersError, enterRoomError, exitRoomError } from './common/trtcCode';
export * from './common/trtc_define';
// export * from './common/trtc_code';

let trtcCloudInstance: TRTCCloud | null = null;


/**
 * 腾讯云视频通话功能的主要接口类
 *
 * @example
 * // 创建/使用/销毁 TRTCCloud 对象的示例代码：
 * import TRTCCloud from 'trtc-universal-js-sdk';
 * this.rtcCloud = new TRTCCloud();
 * // 获取 SDK 版本号
 * let version = this.rtcCloud.getSDKVersion();
 *
 */
// eslint-disable-next-line new-cap
class TRTCCloud extends MixinsClass(
  EventEmitter,
  BaseCommon,
  MixCDN,
  Video,
  Audio,
  Camera,
  Mic,
  Share,
  Beauty,
) {
  private logPrefix = 'universal';
  private enableAudioVolumeInterval = 0;
  private enableAudioVolumeTimer = -1;
  public log_: any;
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
  }
  /**
   * 创建 TRTCCloud 对象单例
   * @returns {TRTCCloud}
   */
  static getTRTCShareInstance() {
    if (!trtcCloudInstance) {
      trtcCloudInstance = new TRTCCloud();
    }
    return trtcCloudInstance;
  }

  /**
   * 释放 TRTCCloud 对象并清理资源
   */
  static destroyTRTCShareInstance() {
    if (trtcCloudInstance) {
      trtcCloudInstance.destroy();
      trtcCloudInstance = null;
    }
  }
  /**
   * 进房
   * @param params
   * @param scene
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
          frameWorkType: 38,
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
      } catch (error) {
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
   * 1.2 退出房间
   *
   * 调用 exitRoom() 接口会执行退出房间的相关逻辑，例如释放音视频设备资源和编解码器资源。
   * 待资源释放完毕，SDK 会通过 TRTCCallback 中的 onExitRoom() 回调通知您。
   *
   * 如果您要再次调用 enterRoom() 或者切换到其它的音视频 SDK，请等待 onExitRoom() 回调到来后再执行相关操作，
   * 否则可能会遇到如摄像头、麦克风设备被强占等各种异常问题。
   */
  async exitRoom() {
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
      await this.client.leave();
      this.destroyBeautyPlugin();
      this.resetStatus();
      this.destroy();
      this.emit('onExitRoom', ExitRoomCode.ActiveExitRoom);
      this.log_.info('(exitRoom) success - exit room');
    } catch (error) {
      this.isExiting = false;
      this.callFunctionErrorManage(error, 'exitRoom');
    }
  }

  // ///////////////////////////////////////////////////////////////////////////////
  //
  //                      （十四）LOG 相关接口函数
  //
  // ///////////////////////////////////////////////////////////////////////////////
  /**
   * 14.1 获取 SDK 版本信息
   *
   * @return {String} UTF-8 编码的版本号。
   */
  getSDKVersion(): string {
    return this.VERSION || '';
  }

  // ====================== 内部方法 ======================
  /**
   * 调用方法失败处理
   * @param error Error 实例或 trtc-js-sdk 中定义的 RtcError 实例
   * @param functionName 函数名称, 调用函数的名称用以记录出错的位置
   */
  callFunctionErrorManage(error: any, functionName: string): void {
    if (error && error.getCode && error.getCode()) {
      this.emit(ON_ERROR, error.getCode(), error.message_);
      this.log_.error(`(${functionName}) failed - ${error.message_}`);
    } else {
      this.emit(ON_ERROR, jsExecuteError.code, error.message);
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
  }

  // 推流
  async publishLocalStream() {
    const { mode, role, isJoined, isPublishing, isPublished, localStream, client } = this;
    // live + audience 时, 不推流
    if (mode === liveMode && role === audienceRole) {
      this.log_.info(`(publishLocalStream) failed - mode = ${mode}, role = ${role}`);
      return;
    }
    if (!isJoined || isPublishing || isPublished || !localStream || !client) {
      this.log_.info(`(publishLocalStream) failed - isJoined = ${isJoined},
        isPublishing = ${isPublishing}, isPublished = ${isPublished}, localStream = ${localStream}, client = ${client}`);
      return;
    }
    this.log_.info('(publishLocalStream) start - publish stream');
    // 如果：已进房 + 未推流, 此时需要推流
    if (isJoined && !isPublished) {
      this.isPublishing = true;
      try {
        await this.setStreamVideoParam(this.videoEncodeParam);
        await this.client.publish(this.localStream);
        this.isPublishing = false;
        this.isPublished = true;
        // 发布流之后不再单独获取本地流的音量
        this.enableAudioVolumeTimer && clearInterval(this.enableAudioVolumeTimer);
        this.log_.info('(publishLocalStream) success - publish stream');
      } catch (error) {
        this.isPublishing = false;
        this.callFunctionErrorManage(error, 'publishLocalStream');
      }
    }
  }
  // 停止推流
  async unPublishStream() {
    if (this.localStream) {
      await this.client.unpublish(this.localStream);
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
   * 开启或关闭音量大小回调
   * @param interval number
   * 如需关闭音量回调，传入 interval 值小于等于0即可
   */
  enableAudioVolumeEvaluation(interval: number) {
    if (this.client) {
      this.client.enableAudioVolumeEvaluation(interval);
    }
    this.enableAudioVolumeInterval = interval;
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
      case 'video': {
        const videoTrack = this.localStream.getVideoTrack();
        return !!videoTrack;
      }
      case 'audio': {
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
    this.playViewMap.set(`${stream.getUserId()}_${stream.getType()}`, dom);
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
    this.emit(ON_ERROR, error.code, error.message);
  }

  handleError(error: any) {
    console.error('onError = ', error);
    this.emit(ON_ERROR, error.getCode(), error.message);
  }

  handlePeerJoin(event: { userId: string }) {
    const { userId } = event;
    this.remoteUserAvailable.set(userId, {
      isAudioAvailable: false,
      isVideoAvailable: false,
    });
    this.emit('onRemoteUserEnterRoom', userId);
  }

  handlePeerLeave(event: { userId: string }) {
    const { userId } = event;
    // electron 离开原因，0表示用户主动退出房间，1表示用户超时退出，2表示被踢出房间 // 这里固定为 0
    const reason = 0;
    this.emit('onRemoteUserLeaveRoom', userId, reason);
  }

  handleStreamAdded(event: {
    stream: {
      getUserId: () => string;
      getType: () => string;
      hasAudio: () => boolean;
      hasVideo: () => boolean;
    };
  }) {
    const { stream } = event;
    const userId = stream.getUserId();
    const streamType = stream && stream.getType();
    this.remoteStreamMap.set(`${userId}-${streamType}`, event.stream);
    if (streamType === auxiliaryStream) {
      this.emit('onUserSubStreamAvailable', userId, 1);
    } else {
      if (stream.hasAudio()) {
        this.remoteUserAvailable.get(userId).isAudioAvailable = true;
        this.emit('onUserAudioAvailable', userId, 1);
      }
      if (stream.hasVideo()) {
        this.remoteUserAvailable.get(userId).isVideoAvailable = true;
        this.emit('onUserVideoAvailable', userId, 1);
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
    } catch (error) {
      console.error(
        `subscribe ${remoteStream.getUserId()} with audio: ${config.audio} video: ${
          config.video
        } error`,
        error,
      );
    }
  }

  // 暂时没用
  handleStreamSubscribed() {
    this.isSubscribed = true;
  }

  handleStreamRemoved(event: {
    stream: {
      getUserId: () => string;
      getType: () => string;
    };
  }) {
    const remoteStream =  event.stream;
    const userId = remoteStream.getUserId();
    const streamType = remoteStream.getType();
    if (streamType === 'main') {
      this.emit('onUserAudioAvailable', userId, 0);
      this.emit('onUserVideoAvailable', userId, 0);
    } else if (streamType === 'auxiliary') {
      this.emit('onUserSubStreamAvailable', userId, 0);
    }
    this.remoteStreamMap.delete(`${userId}-${streamType}`);
  }

  handleStreamUpdated(event: {
    stream: {
      getUserId: () => string;
      getType: () => string;
      hasAudio: () => boolean;
      hasVideo: () => boolean;
    };
  }) {
    const { stream } = event;
    const userId = stream.getUserId();
    if (stream.hasAudio() && !this.remoteUserAvailable.get(userId).isAudioAvailable) {
      this.remoteUserAvailable.get(userId).isAudioAvailable = true;
      this.emit('onUserAudioAvailable', userId, 1);
    }
    if (stream.hasVideo() && !this.remoteUserAvailable.get(userId).isAudioAvailable) {
      this.remoteUserAvailable.get(userId).isVideoAvailable = true;
      this.emit('onUserVideoAvailable', userId, 1);
    }
  }

  handleMuteAudio(event: {userId: string}) {
    this.emit('onUserAudioAvailable', event.userId, 0);
  }

  handleUnmuteAudio(event: {userId: string}) {
    this.emit('onUserAudioAvailable', event.userId, 1);
  }

  handleMuteVideo(event: {userId: string}) {
    this.emit('onUserVideoAvailable', event.userId, 0);
  }

  handleUnmuteVideo(event: {userId: string}) {
    this.emit('onUserVideoAvailable', event.userId, 1);
  }

  handleAudioVolume(event: { result: [] }) {
    const { result } = event;
    this.emit('onUserVoiceVolume', result);
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

  async handleNetworkQuality(event:
    {
      uplinkNetworkQuality: number,
      uplinkRTT: number,
      uplinkLoss: number,
      downlinkRTT: number,
      downlinkLoss: number,
    }) {
    const { uplinkNetworkQuality, uplinkRTT, uplinkLoss, downlinkLoss } = event;
    const localQuality = new TRTCQualityInfo('', uplinkNetworkQuality);
    this.emit('onNetworkQuality', localQuality);

    const localStatistics: TRTCLocalStatistics = await this.getLocalStatistics();
    const statistics = new TRTCStatistics(uplinkLoss, downlinkLoss, 0, 0, uplinkRTT, 0, 0, [localStatistics]);
    this.emit('onStatistics', statistics);
  }
}

export default TRTCCloud;
