/* eslint-disable no-underscore-dangle */
import { TRTCVideoStreamType, TRTCVideoEncParam, TRTCRenderParams, TRTCVideoMirrorType, TRTCVideoFillMode } from './common/trtc_define';
import { BaseCommon } from './BaseCommon';
import { MixinsClass, isUndefined, userIdMain, userIdAuxiliary } from './utils/utils';
import { IStreamConfig } from './common/IStreamConfig';
import { streamTypeMap, NAME } from './common/constants';
import { ParametersError } from './common/trtcCode';

interface PlayOption {
  mirror?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill';
}

/**
 * 视频相关接口<br>
 * @memberof TRTCClouds
 */
class Video extends MixinsClass(BaseCommon) {
  /**
   * 开启本地视频的预览画面<br>
   * 这个接口会启动默认的摄像头，可以通过 [setCurrentCameraDevice](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCloud.html#setCurrentCameraDevice) 接口选用其它摄像头
   *
   * @param {HTMLElement} view - 承载预览画面的 DOM
   * @returns {Promise}
   * @memberof TRTCCloud
   * @example
   * // 预览本地画面
   * const view = document.getElementById('local-view');
   * await trtcCloud.startLocalPreview(view);
   */
  async startLocalPreview(view: HTMLElement) {
    this.log_.info('(startLocalPreview) start - start local preview', view);
    try {
      if (this.localStreamHasVideoOrAudio(NAME.VIDEO)) {
        this.playStream(this.localStream, view);
        return;
      }
      // 等待 startLocalAudio 执行结束之后执行 startLocalPreview
      const retryFunction = this.promiseRetry({
        retryFunction: this.doStartLocalPreview,
        settings: {
          retries: 6,
          timeout: 1000,
        },
      });
      await retryFunction(view);
    } catch (error: any) {
      this.isStaringLocalPreview = false;
      this.callFunctionErrorManage(error, 'startLocalPreview');
    }
  }

  async doStartLocalPreview(view: HTMLElement) {
    if (this.isStaringLocalAudio) {
      throw new Error('startLocalAudio is under implementation.');
    }
    this.isStaringLocalPreview = true;
    if (!isUndefined(view)) {
      if (view !== null) {
        const streamConfig: IStreamConfig = {
          userId: (this.client && `${this.client.getUserId()} video`) || 'video undefined',
          video: true,
          audio: false,
          screenAudio: false,
        };
        if (this.currentCameraId) {
          streamConfig.cameraId = this.currentCameraId;
        }
        if (this.localStream) {
          const tempStream = this.TRTC.createStream(streamConfig);
          this.videoEncodeParam && await tempStream.setVideoProfile(this.videoEncodeParam);
          await tempStream.initialize();
          const localVideoTrack = tempStream.getVideoTrack();
          await this.localStream.addTrack(localVideoTrack);
        } else {
          await this.initStream(streamConfig);
        }
        this.isStartedLocalPreview = true;
        if (this.localStream) {
          this.playStream(this.localStream, view, this.localStreamRenderParams);
          this.clearTempAudioContainer('localAudio');
        }
        // 已进房未推流时: 需要推流
        await this.publishLocalStream();
        this.isStaringLocalPreview = false;
      }
    } else {
      this.emitError(ParametersError);
      this.log_.error(`(startLocalPreview) failed - ${ParametersError.message}: ${view}`);
    }
  }
  /**
   * 停止本地摄像头采集和预览<br>
   * 首先停止播放，然后关闭本地流（关闭摄像头和麦克风访问权限）
   * @returns {Promise}
   * @memberof TRTCCloud
   * @example
   * await trtcCloud.stopLocalPreview();
   */
  async stopLocalPreview() {
    this.log_.info('(stopLocalPreview) stop - stop local preview');
    if (!this.isStartedLocalPreview) {
      this.log_.info('(stopLocalPreview) stop - local preview has not been started');
      return;
    }
    return new Promise(async (resolve, reject) => {
      try {
        if (this.localStream) {
          const audioTrack = this.localStream.getAudioTrack();
          if (audioTrack) {
            const videoTrack = this.localStream.getVideoTrack();
            if (videoTrack) {
              this.localStream.removeTrack(videoTrack).then(() => {
                // 关闭视频通话成功，停止 videoTrack 并释放摄像头资源
                videoTrack.stop();
                this.isStartedLocalPreview = false;
                resolve(1);
              });
            }
          } else {
            await this.unPublishStream();
            this.localStream.stop();
            this.localStream.close();
            this.localStream = null;
            this.isStartedLocalPreview = false;
            resolve(1);
          }
        }
      } catch (error: any) {
        this.callFunctionErrorManage(error, 'stopLocalPreview');
        reject(error);
      }
    });
  }
  /**
   * 暂停/恢复发布本地的视频流<br>
   * 当屏蔽本地视频后，房间里的其它成员将会收到 [onUserVideoAvailable](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onUserVideoAvailable) 回调通知
   * @param {Boolean} mute - true：屏蔽；false：开启，默认值：false
   * @memberof TRTCCloud
   * @example
   * trtcCloud.muteLocalVideo(true);
   */
  muteLocalVideo(mute: boolean = false) {
    try {
      if (this.localStream) {
        if (mute) {
          this.localStream.muteVideo();
        } else {
          this.localStream.unmuteVideo();
        }
      }
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'muteLocalVideo');
    }
  }
  /**
   * 显示远端视频或辅流<br>
   * 在收到 SDK 的 [onUserVideoAvailable](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onUserVideoAvailable) 通知时，可以获知该远程用户开启了视频，
   * 此后调用 [startRemoteView](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCloud.html#startRemoteView) 接口加载该用户的远程画面时，可以用 loading 动画优化加载过程中的等待体验。
   *
   * @param {String}      userId - 对方的用户标识
   * @param {HTMLElement} view   - 承载预览画面的 DOM
   * @param {TRTCVideoStreamType} streamType   - 视频流类型
   * - 高清大画面：TRTCVideoStreamType.TRTCVideoStreamTypeBig
   * - 低清小画面：TRTCVideoStreamType.TRTCVideoStreamTypeSmall
   * - 辅流（屏幕分享）：TRTCVideoStreamType.TRTCVideoStreamTypeSub
   * @returns {Promise}
   * @memberof TRTCCloud
   * @example
   * import { TRTCVideoStreamType } from 'trtc-cloud-js-sdk';
   * const view = document.getElementById('remote-view');
   * await trtcCloud.startRemoteView('denny', view, TRTCVideoStreamType.TRTCVideoStreamTypeBig);
   */
  async startRemoteView(userId: string, view: HTMLElement, streamType: TRTCVideoStreamType) {
    try {
      if (!userId || isUndefined(view) || !(streamType in TRTCVideoStreamType)) {
        this.emitError(ParametersError);
        this.log_.error(`(startRemoteView) failed - ${ParametersError.message}: ${view}`);
        return;
      }
      let tempStreamType: TRTCVideoStreamType = streamType;
      let tempUserId = userIdMain(userId);
      // 目前抛出的 onUserSubStreamAvailable 去掉了 'share_' 前缀，用户调用 startLocalPreview 时传入的 userId 就没有 'share_'
      if (streamType === TRTCVideoStreamType.TRTCVideoStreamTypeSub) {
        tempUserId = userIdAuxiliary(`${NAME.SCREEN_SHARE_USER_ID_PREFIX}${userId}`);
        if (!this.remoteStreamMap.has(tempUserId)) { // electron 的屏幕分享流直接就是辅流
          tempUserId = userIdAuxiliary(userId);
        }
        tempStreamType = TRTCVideoStreamType.TRTCVideoStreamTypeBig; // webrtc 推流时, 屏幕分享流也是主流, 播放时传的 sub 改为 big
      } else if (!this.isSmallStreamSupported) {
        tempStreamType = TRTCVideoStreamType.TRTCVideoStreamTypeBig; // 非屏幕分享流时, 如果不支持大小流, 默认选择大流
      }
      const webrtcStreamType = streamTypeMap[tempStreamType];
      if (this.remoteStreamMap.has(tempUserId)) {
        const remoteStream: any = this.remoteStreamMap.get(tempUserId);
        // const videoTrack = remoteStream.getVideoTrack();
        // 观看端需要在订阅远端流成功后, 并且流含有 videoTrack，才调用 setRemoteVideoStreamType
        if (webrtcStreamType !== NAME.AUXILIARY) {
          this.client && await this.client.setRemoteVideoStreamType(remoteStream, tempStreamType);
        }
        if (remoteStream) {
          await this.client.subscribe(remoteStream, { audio: true, video: true });
          await this.playStream(remoteStream, view);
          this.clearTempAudioContainer(`${tempUserId}_dom`);
        }
      }
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'startRemoteView');
    }
  }
  /**
   * 停止显示远端视频画面，同时不再拉取该远端用户的视频数据流<br>
   * 指定要停止观看的 userId 的视频流类型
   *
   * @param {String} userId - userId 指定的远端用户 ID
   * @param {TRTCVideoStreamType} streamType - 视频流类型
   * - 高清大画面：TRTCVideoStreamType.TRTCVideoStreamTypeBig
   * - 低清小画面：TRTCVideoStreamType.TRTCVideoStreamTypeSmall
   * - 辅流（屏幕分享）：TRTCVideoStreamType.TRTCVideoStreamTypeSub
   * @returns {Promise}
   * @memberof TRTCCloud
   * @example
   * import { TRTCVideoStreamType } from 'trtc-cloud-js-sdk';
   * await trtcCloud.stopRemoteView('denny', TRTCVideoStreamType.TRTCVideoStreamTypeBig);
   */
  async stopRemoteView(userId: string, streamType?: TRTCVideoStreamType) {
    try {
      let tempUserId = userIdMain(userId);
      let tempStreamType = streamType;
      if (!isUndefined(streamType)) {
        tempStreamType = this.priorRemoteVideoStreamType;
      }
      console.log('stopRemoteView streamType: ', tempStreamType);
      if (streamType === TRTCVideoStreamType.TRTCVideoStreamTypeSub) {
        tempUserId = userIdAuxiliary(`${NAME.SCREEN_SHARE_USER_ID_PREFIX}${userId}`);
        if (!this.remoteStreamMap.has(tempUserId)) {
          tempUserId = userIdAuxiliary(userId);
        }
      }
      if (this.remoteStreamMap.has(tempUserId)) {
        const remoteMainStream = this.remoteStreamMap.get(tempUserId);
        if (streamType === TRTCVideoStreamType.TRTCVideoStreamTypeSub) {
          // 停止播放屏幕分享时要取消音视频的订阅
          // await this.client.subscribe(remoteMainStream, { audio: false, video: false });
        } else {
          await this.client.subscribe(remoteMainStream, { audio: true, video: false });
        }
      }
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'stopRemoteView');
    }
  }
  /**
   * 暂停接收指定的远端视频流<br>
   * 该接口仅停止接收远程用户的视频流，但并不释放显示资源，所以视频画面会冻屏在 mute 前的最后一帧。
   *
   * @param {String}  userId - 对方的用户标识
   * @param {Boolean} mute   - 是否停止接收
   * @memberof TRTCCloud
   */
  muteRemoteVideoStream(userId: string, mute: boolean = false) {
    try {
      if (!userId) {
        this.emitError(ParametersError);
        this.log_.error(`(muteRemoteVideoStream) failed - ${ParametersError.message}: userId = ${userId}`);
        return;
      }
      const remoteStream = this.remoteStreamMap.get(userIdMain(userId));
      if (remoteStream) {
        if (mute) {
          remoteStream.muteVideo();
        } else {
          remoteStream.unmuteVideo();
        }
      }
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'stopRemoteView');
    }
  }
  /**
   * 设置视频编码器相关参数<br>
   * 该设置决定了远端用户看到的画面质量（同时也是云端录制出的视频文件的画面质量）
   *
   * @param {TRTCVideoEncParam} params - 视频编码参数
   * @param {TRTCVideoResolution} params.videoResolution - 视频分辨率
   * @param {Number} params.videoFps     - 视频采集帧率
   * @param {Number} params.videoBitrate - 视频上行码率
   * @returns {Promise}
   * @memberof TRTCCloud
   * import { TRTCVideoResolution } from 'trtc-cloud-js-sdk';
   * const params = {
   *  videoResolution: TRTCVideoResolution.TRTCVideoResolution_640_480,
   *  videoFps: 15,
   *  videoBitrate: 900,
   * };
   * trtcCloud.setVideoEncoderParam(params);
   */
  async setVideoEncoderParam(params: TRTCVideoEncParam) {
    try {
      const { videoEncodeParam } = this;
      if (params.videoResolution) {
        const resolutionObject =  this.getResolution(params.videoResolution);
        videoEncodeParam.width = resolutionObject.width;
        videoEncodeParam.height = resolutionObject.height;
      }
      if (params.videoFps) {
        videoEncodeParam.frameRate = params.videoFps;
      }
      if (params.videoBitrate) {
        videoEncodeParam.bitrate = params.videoBitrate;
      }
      this.videoEncodeParam = videoEncodeParam;
      await this.setStreamVideoParam(this.videoEncodeParam);
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'setVideoEncoderParam');
    }
  }

  /**
   * 设置本地流渲染参数
   * @param {TRTCRenderParams} params 本地流渲染参数
   * @param {TRTCVideoRotation} rotation 旋转角度
   * @param {TRTCVideoFillMode} fillMode 填充模式
   * @param {TRTCVideoMirrorType} mirrorType 画面渲染镜像
   * @examples
   * import { TRTCVideoRotation, TRTCVideoFillMode, TRTCVideoMirrorType } from 'trtc-cloud-js-sdk';
   * const params = {
   *  rotation: TRTCVideoRotation.TRTCVideoRotation_0,
   *  fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
   *  mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Enable,
   * };
   * await trtcCloud.setRemoteRenderParams(params);
   */
  async setLocalRenderParams(params: TRTCRenderParams) {
    try {
      const playOption: PlayOption = {};
      if (params.mirrorType === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable) {
        playOption.mirror = true;
      }
      if (params.mirrorType === TRTCVideoMirrorType.TRTCVideoMirrorType_Disable) {
        playOption.mirror = false;
      }
      if (params.fillMode === TRTCVideoFillMode.TRTCVideoFillMode_Fill) {
        playOption.objectFit = 'cover';
      }
      if (params.fillMode === TRTCVideoFillMode.TRTCVideoFillMode_Fit) {
        playOption.objectFit = 'contain';
      }
      this.localStreamRenderParams = playOption;
      if (this.localStream) {
        const view = this.playViewMap.get(`${this.localStream.getUserId()}-${this.localStream.getType()}`);
        await this.playStream(this.localStream, view, playOption);
      }
      // Protected: 下面 if 代码块用在 TUIRoom 中，不能删除
      if (this.testCameraStream) {
        const testCameraView = this.playViewMap.get(`${this.testCameraStream.getUserId()}-${this.testCameraStream.getType()}`);
        this.playStream(this.testCameraStream, testCameraView, playOption);
      }
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'setLocalRenderParams');
    }
  }

  /**
   * 设置远端流渲染参数
   * @param {String} userId 流 userId
   * @param {TRTCVideoStreamType} streamType 流类型
   * - 高清大画面：TRTCVideoStreamType.TRTCVideoStreamTypeBig
   * - 低清小画面：TRTCVideoStreamType.TRTCVideoStreamTypeSmall
   * - 辅流（屏幕分享）：TRTCVideoStreamType.TRTCVideoStreamTypeSub
   * @param {TRTCRenderParams} params 远端流渲染参数
   * @param {TRTCVideoFillMode} params.fillMode 填充模式
   * @param {TRTCVideoMirrorType} params.mirrorType 画面渲染镜像
   * @returns {Promise}
   * @memberof TRTCCloud
   * @examples
   * import { TRTCVideoStreamType, TRTCVideoFillMode, TRTCVideoMirrorType } from 'trtc-cloud-js-sdk';
   * const params = {
   *  fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
   *  mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Enable,
   * };
   * await trtcCloud.setRemoteRenderParams('denny', TRTCVideoStreamType.TRTCVideoStreamTypeBig, params)
   */
  async setRemoteRenderParams(userId: string, streamType: TRTCVideoStreamType, params: TRTCRenderParams) {
    try {
      const playOption: PlayOption = {};
      if (params.mirrorType === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable) {
        playOption.mirror = true;
      }
      if (params.mirrorType === TRTCVideoMirrorType.TRTCVideoMirrorType_Disable) {
        playOption.mirror = false;
      }
      if (params.fillMode === TRTCVideoFillMode.TRTCVideoFillMode_Fill) {
        playOption.objectFit = 'cover';
      }
      if (params.fillMode === TRTCVideoFillMode.TRTCVideoFillMode_Fit) {
        playOption.objectFit = 'contain';
      }
      let tempUserId: string = userIdMain(userId);
      if (streamType === TRTCVideoStreamType.TRTCVideoStreamTypeSub) {
        tempUserId = userIdAuxiliary(userId);
      }
      const view = this.playViewMap.get(tempUserId);
      const remoteStream = this.remoteStreamMap.get(tempUserId);
      remoteStream && await this.playStream(remoteStream, view, playOption);
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'setRemoteRenderParams');
    }
  }

  // ----------------------------------------------------------------
  // Protected: 下面方法用在 TUIRoom 中，不能删除
  // ----------------------------------------------------------------
  async startCameraDeviceTest(view: HTMLElement) {
    this.log_.info('(startCameraDeviceTest) start - start test camera Device', view);
    if (view !== null) {
      const streamConfig: IStreamConfig = {
        userId: 'test camera',
        video: true,
        audio: false,
        screenAudio: false,
      };
      if (this.currentCameraId) {
        streamConfig.cameraId = this.currentCameraId;
      }
      this.testCameraStream = this.TRTC.createStream(streamConfig);
      this.videoEncodeParam && this.testCameraStream.setVideoProfile(this.videoEncodeParam);
      await this.testCameraStream.initialize();
      this.playStream(this.testCameraStream, view, this.localStreamRenderParams);
    }
  }

  stopCameraDeviceTest() {
    if (this.testCameraStream) {
      this.testCameraStream.stop();
      this.testCameraStream.close();
      this.testCameraStream = null;
    }
  }
}

export { Video };
