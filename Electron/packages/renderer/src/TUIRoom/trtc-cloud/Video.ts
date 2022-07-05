/* eslint-disable no-underscore-dangle */
import { TRTCVideoStreamType, TRTCVideoEncParam, TRTCVideoResolution, TRTCRenderParams, TRTCVideoMirrorType, TRTCVideoFillMode } from './common/trtc_define';
import { BaseCommon } from './BaseCommon';
import { MixinsClass, isUndefined, userIdMain, userIdAuxiliary } from './utils/utils';
import { IStreamConfig } from './common/IStreamConfig';
import { streamTypeMap, auxiliaryStream } from './common/constants';
import { ParametersError } from './common/trtcCode';

// eslint-disable-next-line new-cap

interface PlayOption {
  mirror?: boolean;
  objectFit?: 'contain'|'cover'|'fill';
}

class Video extends MixinsClass(BaseCommon) {
  // ///////////////////////////////////////////////////////////////////////////////
  //
  //                      （三）视频相关接口函数
  //
  // ///////////////////////////////////////////////////////////////////////////////
  /**
   * 3.1 启动本地摄像头采集和预览
   *
   * 这个接口会启动默认的摄像头，可以通过 [setCurrentCameraDevice()]{@link TRTCCloud#setCurrentCameraDevice} 接口选用其它摄像头
   * 当开始渲染首帧摄像头画面时，您会收到 TRTCCallback 中的 onFirstVideoFrame(null) 回调。
   *
   * @param {HTMLElement} view - 承载预览画面的 DOM, HTML <div> 标签 ID 或者 HTMLDivElement 对象
   *
   * TODO: 先初始化本地流再进房时, userId = undefined, 目前设置默认的字符串 'init local stream before create client'
   */
  async startLocalPreview(view: HTMLElement) {
    this.log_.info('(startLocalPreview) start - start local preview', view);
    try {
      if (this.localStreamHasVideoOrAudio('video')) {
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
    } catch (error) {
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
          this.videoEncodeParam && tempStream.setVideoProfile(this.videoEncodeParam);
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
   * 3.2 停止本地摄像头采集和预览
   * 首先: 停止播放; 然后: 关闭本地流(关闭摄像头和麦克风访问权限)
   */
  async stopLocalPreview() {
    this.log_.info('(stopLocalPreview) stop - stop local preview');
    if (!this.isStartedLocalPreview) {
      this.log_.info('(stopLocalPreview) stop - local preview has not been started');
      return;
    }
    return new Promise((resolve, reject) => {
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
            this.localStream.stop();
            this.localStream.close();
            this.localStream = null;
            this.isStartedLocalPreview = false;
            resolve(1);
          }
        }
      } catch (error) {
        this.callFunctionErrorManage(error, 'stopLocalPreview');
        reject(error);
      }
    });
  }
  /**
   * 3.3 是否屏蔽自己的视频画面
   *
   * 当屏蔽本地视频后，房间里的其它成员将会收到 onUserVideoAvailable 回调通知
   * @param {Boolean} mute - true：屏蔽；false：开启，默认值：false
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
    } catch (error) {
      this.callFunctionErrorManage(error, 'muteLocalVideo');
    }
  }
  /**
   * 3.4 开始显示远端视频画面
   *
   * 在收到 SDK 的 onUserVideoAvailable(userId, true) 通知时，可以获知该远程用户开启了视频，
   * 此后调用 startRemoteView(userId) 接口加载该用户的远程画面时，可以用 loading 动画优化加载过程中的等待体验。
   * 待该用户的首帧画面开始显示时，您会收到 onFirstVideoFrame(userId) 事件回调。
   *
   * @param {String}      userId - 对方的用户标识
   * @param {HTMLElement} view   - 承载预览画面的 DOM
   * @param {TRTCVideoStreamType} streamType   - 视频流类型
   */
  startRemoteView(userId: string, view: HTMLElement, streamType?: TRTCVideoStreamType) {
    try {
      let tempStreamType: string = streamTypeMap[streamType || TRTCVideoStreamType.TRTCVideoStreamTypeBig];
      // 非分享流时, 如果不支持大小流, 默认选择大流
      if (!this.isSmallStreamSupported && (streamType && streamType !== TRTCVideoStreamType.TRTCVideoStreamTypeSub)) {
        tempStreamType = streamTypeMap[TRTCVideoStreamType.TRTCVideoStreamTypeBig];
      }

      if (!isUndefined(view)) {
        const userIdString: string = tempStreamType === auxiliaryStream ? userIdAuxiliary(userId) : userIdMain(userId);

        if (this.remoteStreamMap.has(userIdString)) {
          const remoteStream: any = this.remoteStreamMap.get(userIdString);
          // const videoTrack = remoteStream.getVideoTrack();
          // 观看端需要在订阅远端流成功后, 并且流含有 videoTrack，才调用 setRemoteVideoStreamType
          if (tempStreamType !== auxiliaryStream) {
            this.client && this.client.setRemoteVideoStreamType(remoteStream, tempStreamType);
          }
          if (remoteStream) {
            this.playStream(remoteStream, view);
          }
        }
      } else {
        this.emitError(ParametersError);
        this.log_.error(`(startRemoteView) failed - ${ParametersError.message}: ${view}`);
      }
    } catch (error) {
      this.callFunctionErrorManage(error, 'startRemoteView');
    }
  }
  /**
   * 3.5 停止显示远端视频画面，同时不再拉取该远端用户的视频数据流
   *
   * 调用此接口后，SDK 会停止接收该用户的远程视频流，同时会清理相关的视频显示资源。
   *
   * @param {String} userId - 对方的用户标识
   * @param {TRTCVideoStreamType} streamType - 视频流类型
   */
  async stopRemoteView(userId: string, streamType?: TRTCVideoStreamType) {
    try {
      let tempStreamType = streamType;
      if (!isUndefined(streamType)) {
        tempStreamType = this.priorRemoteVideoStreamType;
      }
      console.log('stopRemoteView streamType: ', tempStreamType);
      const remoteMainStream = this.remoteStreamMap.get(userIdMain(userId));
      if (remoteMainStream) {
        await remoteMainStream.stop();
        await remoteMainStream.close();
        this.remoteStreamMap.delete(userIdMain(userId));
        this.remoteStreamMap.delete(userIdAuxiliary(userId));
      }
    } catch (error) {
      this.callFunctionErrorManage(error, 'stopRemoteView');
    }
  }
  /**
   * 3.7 暂停接收指定的远端视频流
   *
   * 该接口仅停止接收远程用户的视频流，但并不释放显示资源，所以视频画面会冻屏在 mute 前的最后一帧。
   * TODO: TRTC remoteStream.muteVideo 该方法会停止播放视频，但是仍然接收视频数据.
   *
   * @param {String}  userId - 对方的用户标识
   * @param {Boolean} mute   - 是否停止接收
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
    } catch (error) {
      this.callFunctionErrorManage(error, 'stopRemoteView');
    }
  }
  /**
   * 3.9 设置视频编码器相关参数
   *
   * 该设置决定了远端用户看到的画面质量（同时也是云端录制出的视频文件的画面质量）
   *
   * @param {TRTCVideoEncParam} params - 视频编码参数
   * @param {TRTCVideoResolution} params.videoResolution - 视频分辨率
   * @param {TRTCVideoResolutionMode} params.resMode - 分辨率模式（横屏分辨率 - 竖屏分辨率）
   * - TRTCVideoResolutionModeLandscape: 横屏分辨率
   * - TRTCVideoResolutionModePortrait : 竖屏分辨率
   * @param {Number} params.videoFps     - 视频采集帧率
   * @param {Number} params.videoBitrate - 视频上行码率
   * @param {Number} params.minVideoBitrate - 视频最小码率
   */
  async setVideoEncoderParam(params: TRTCVideoEncParam) {
    try {
      const { videoEncodeParam } = this;
      if (params.videoResolution) {
        const TRTCVideoResolutionString = TRTCVideoResolution[params.videoResolution];
        const videoResolutionList = (TRTCVideoResolutionString || '').split('_');
        videoEncodeParam.width = videoResolutionList.length > 1 && videoResolutionList[1];
        videoEncodeParam.height = videoResolutionList.length > 2 && videoResolutionList[2];
      }
      if (params.videoFps) {
        videoEncodeParam.frameRate = params.videoFps;
      }
      if (params.videoBitrate) {
        videoEncodeParam.bitrate = params.videoBitrate;
      }
      this.videoEncodeParam = videoEncodeParam;
      await this.setStreamVideoParam(this.videoEncodeParam);
    } catch (error) {
      this.callFunctionErrorManage(error, 'setVideoEncoderParam');
    }
  }

  /**
   * 设置本地流渲染参数
   * @param {TRTCRenderParams} params 本地流渲染参数
   * @param {TRTCVideoRotation} rotation 旋转角度
   * @param {TRTCVideoFillMode} fillMode 填充模式
   * @param {TRTCVideoMirrorType} mirrorType 画面渲染镜像
   */
  setLocalRenderParams(params: TRTCRenderParams) {
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
      const view = this.playViewMap.get(`${this.localStream.getUserId()}_${this.localStream.getType()}`);
      this.playStream(this.localStream, view, playOption);
      if (this.testCameraStream) {
        const testCameraView = this.playViewMap.get(`${this.testCameraStream.getUserId()}_${this.testCameraStream.getType()}`);
        this.playStream(this.testCameraStream, testCameraView, playOption);
      }
    } catch (error) {
      this.callFunctionErrorManage(error, 'setLocalRenderParams');
    }
  }

  /**
   * 设置远端流渲染参数
   * @param userId 流 userId
   * @param streamType 流类型
   * @param {TRTCRenderParams} params 远端流渲染参数
   * @param {TRTCVideoRotation} rotation 旋转角度
   * @param {TRTCVideoFillMode} fillMode 填充模式
   * @param {TRTCVideoMirrorType} mirrorType 画面渲染镜像
   */
  setRemoteRenderParams(userId: string, streamType: string, params: TRTCRenderParams) {
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
      const view = this.playViewMap.get(`${userId}_${streamType}`);
      const remoteStream = this.remoteStreamMap.get(`${userId}-${streamType}`);
      this.playStream(remoteStream, view, playOption);
    } catch (error) {
      this.callFunctionErrorManage(error, 'setRemoteRenderParams');
    }
  }

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
