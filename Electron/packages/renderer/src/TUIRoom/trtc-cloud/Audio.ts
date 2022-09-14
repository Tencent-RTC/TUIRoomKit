/* eslint-disable no-underscore-dangle */
import { WebRTCAudioQuality } from './common/trtc_define';
import { BaseCommon } from './BaseCommon';
import { MixinsClass, isUndefined, userIdMain } from './utils/utils';
import { audioQualityMap } from './common/constants';
import { ParametersError } from './common/trtcCode';
import { IStreamConfig } from './common/IStreamConfig';

/**
 * 音频相关接口函数<br>
 * @memberof TRTCClouds
 */
class Audio extends MixinsClass(BaseCommon) {
  /**
   * 开启本地音频的采集和上行, 并设置音频质量<br>
   * 该函数会启动麦克风采集，并将音频数据传输给房间里的其他用户。 SDK 不会默认开启本地音频采集和上行，您需要调用该函数开启，否则房间里的其他用户将无法听到您的声音<br>
   * 主播端的音质越高，观众端的听感越好，但传输所依赖的带宽也就越高，在带宽有限的场景下也更容易出现卡顿
   *
   * **Note:**
   * 1. 音质参数 WebRTCAudioQuality 不同于 [Electron startLocalAudio](https://web.sdk.qcloud.com/trtc/electron/doc/zh-cn/trtc_electron_sdk/TRTCCloud.html#startLocalAudio)
   *
   * @param {WebRTCAudioQuality} quality 声音音质
   * - WebRTCAudioQualityStandard，采样率：48k；单声道；码率：40kbps，默认使用 WebRTCAudioQualityStandard
   * - WebRTCAudioQualityHigh，采样率：48k；单声道；码率：128kbps
   * - WebRTCAudioQualityStandardStereo，采样率：48k；双声道；码率：64kbps
   * - WebRTCAudioQualityHighStereo，采样率：48k；双声道；码率：192kbps
   * @returns {Promise}
   * @memberof TRTCCloud
   * @example
   * import { WebRTCAudioQuality } from 'trtc-cloud-js-sdk';
   * await trtcCloud.startLocalAudio(WebRTCAudioQuality.WebRTCAudioQualityHigh);
   */
  async startLocalAudio(quality?: WebRTCAudioQuality) {
    this.log_.info('(startLocalAudio) start - start local audio');
    // startLocalPreview 没有执行结束时执行 startLocalAudio 会报错，如若此时正在执行 startLocalPreview，需要进行重试
    try {
      const retryFunction = this.promiseRetry({
        retryFunction: this.doStartLocalAudio,
        settings: {
          retries: 6,
          timeout: 1000,
        },
      });
      await retryFunction(quality);
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'startLocalAudio');
    }
  }

  async doStartLocalAudio(quality?: WebRTCAudioQuality) {
    if (this.isStaringLocalPreview) {
      throw new Error('startLocalPreview is under implementation.');
    }
    try {
      this.isStaringLocalAudio = true;
      let tempQuality = quality;
      if (!isUndefined(quality)) {
        tempQuality = this.audioQuality;
      }
      // 方式一：TRTC.createStream 产生音频流
      const audioStreamConfig: IStreamConfig = {
        userId: (this.client && `${this.client.getUserId()} audio`) || 'audio undefined',
        video: false,
        audio: true,
        screenAudio: false,
      };
      if (this.currentMicId) {
        audioStreamConfig.microphoneId = this.currentMicId;
      }
      const tempStream = this.TRTC.createStream(audioStreamConfig);
      tempStream.setAudioProfile(audioQualityMap[tempQuality || WebRTCAudioQuality.WebRTCAudioQualityStandard]);
      await tempStream.initialize();
      const localAudioTrack = tempStream.getAudioTrack();
      if (this.localStream) {
        this.muteLocalAudio(false);
        const audioTrack = this.localStream.getAudioTrack();
        if (audioTrack) {
          await this.localStream.replaceTrack(localAudioTrack);
        } else {
          await this.localStream.addTrack(localAudioTrack);
        }
      } else {
        this.localStream = tempStream;
        // 视频还没有播放的时候，需要先临时播放本地音频
        const tempContainer = this.generateTempAudioContainer('localAudio');
        this.localStream.play(tempContainer);
        // this.localStream && this.playStream(this.localStream, tempContainer);
      }
      this.isStartedLocalAudio = true;

      // 已进房 + 未推流时: 需要推流, 详见 publishLocalStream 里的逻辑
      await this.publishLocalStream();
      this.isStaringLocalAudio = false;
      if (!this.isPublished) {
        this.getLocalStreamAudioLevel();
      }
    } catch (error: any) {
      throw error;
    }
  }

  getLocalStreamAudioLevel() {
    if (this.enableAudioVolumeInterval) {
      this.enableAudioVolumeTimer = setInterval(() => {
        const result: any = [];
        const volume = Math.floor(this.localStream.getAudioLevel() * 100);
        result.push({ userId: '', volume }); // eslint-disable-line
        this.emit('onUserVoiceVolume', result, result.length);
      }, this.enableAudioVolumeInterval);
    }
  }

  /**
   * 生成临时的音频播放容器<br>
   * 只有本地音频，但是没有本地视频的时候，音频播放需要在临时容器中播放
   *
   * TODO: 需要处理远端流只有音频的情况，这个时候 trtc-cloud 应该建立临时播放区域去播放
   * 思路二：可以建立一个临时播放区域，专门用来在没有视频的时候播放音频
   * @param domId 临时容器的 domId
   * @returns HTMLDivElement
   */
  generateTempAudioContainer(domId: string) {
    const divElement = document.createElement('div');
    divElement.id = domId;
    divElement.style.width = '0';
    divElement.style.height = '0';
    document.getElementsByTagName('body')[0].appendChild(divElement);
    return divElement;
  }
  /**
   * 删除临时的音频播放容器
   *
   * 调用时机：停止播放本地音频，开始播放本地视频（指定了view）
   * @param domId 临时容器的 domId
   * @returns HTMLDivElement
   */
  clearTempAudioContainer(domId: string) {
    const divElement = document.getElementById(domId);
    if (divElement) {
      document.getElementsByTagName('body')[0].removeChild(divElement as Node);
    }
  }

  /**
   * 关闭本地音频的采集和上行<br>
   * 当关闭本地音频的采集和上行，房间里的其它成员会收到 [onUserAudioAvailable](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onUserAudioAvailable) 回调通知
   *
   * @returns {Promise}
   * @memberof TRTCCloud
   * @example
   * await trtcCloud.stopLocalAudio();
   */
  async stopLocalAudio() {
    this.log_.info('(stopLocalAudio) stop - stop local audio');
    if (!this.isStartedLocalAudio) {
      this.log_.info('(stopLocalAudio) stop - local audio has not been started');
      return;
    }
    return new Promise(async (resolve, reject) => {
      try {
        if (this.localStream) {
          this.enableAudioVolumeTimer && clearInterval(this.enableAudioVolumeTimer);

          const videoTrack = this.localStream.getVideoTrack();
          if (videoTrack) {
            const audioTrack = this.localStream.getAudioTrack();
            if (audioTrack) {
              // audio track 无法 remove, 在有 video 时, stopLocalAudio 后远端收不到 onUserVideoAvailable 为 false 回调
              this.muteLocalAudio(true);
              audioTrack.stop();
              this.isStartedLocalAudio = false;
              resolve(1);
            }
          } else {
            await this.unPublishStream();
            this.localStream.stop();
            this.localStream.close();
            this.clearTempAudioContainer('localAudio');
            this.localStream = null;
            this.isStartedLocalAudio = false;
            resolve(1);
          }
        }
      } catch (error: any) {
        this.callFunctionErrorManage(error, 'stopLocalAudio');
        reject(error);
      }
    });
  }
  /**
   * 静音本地的音频<br>
   * 当静音本地音频后，房间里的其它成员会收到 [onUserAudioAvailable](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCallback.html#event:onUserAudioAvailable) 回调通知。
   * 与 [stopLocalAudio](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCloud.html#stopLocalAudio) 不同之处在于，[muteLocalAudio](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCloud.html#muteLocalAudio)
   * 并不会停止发送音视频数据，而是会继续发送码率极低的静音包。
   * 在对录制质量要求很高的场景中，选择 [muteLocalAudio](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCloud.html#muteLocalAudio) 是更好的选择，能录制出兼容性更好的 MP4 文件。
   * 这是由于 MP4 等视频文件格式，对于音频的连续性是要求很高的，简单粗暴地 [stopLocalAudio](https://web.sdk.qcloud.com/trtc/webrtc/trtcCloud/doc/TRTCCloud.html#stopLocalAudio) 会导致录制出的 MP4 不易播放。
   *
   * @param {Boolean} mute - true：屏蔽；false：开启，默认值：false
   * @memberof TRTCCloud
   * @example
   * trtcCloud.muteLocalAudio(true);
   */
  muteLocalAudio(mute: boolean = false) {
    try {
      if (this.localStream) {
        if (mute) {
          this.localStream.muteAudio();
        } else {
          this.localStream.unmuteAudio();
        }
      }
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'muteLocalAudio');
    }
  }
  /**
   * 静音掉某个用户的声音，同时不再拉取该远端用户的音频数据流<br>
   * @param {String}  userId - 用户 ID
   * @param {Boolean} mute   - true：静音；false：非静音
   * @memberof TRTCCloud
   * @example
   * trtcCloud.muteRemoteAudio('denny', true);
   */
  muteRemoteAudio(userId: string, mute: boolean = false) {
    try {
      if (!userId) {
        this.emitError(ParametersError);
        this.log_.error(`(muteRemoteVideoStream) failed - ${ParametersError.message}: userId = ${userId}`);
        return;
      }
      const remoteStream = this.remoteStreamMap.get(userIdMain(userId));
      if (remoteStream) {
        if (mute) {
          remoteStream.muteAudio();
        } else {
          remoteStream.unmuteAudio();
        }
      }
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'muteRemoteAudio');
    }
  }
  /**
   * 静音掉远端所有用户的声音，同时不再拉取远端用户的音频数据流<br>
   * @param {Boolean} mute - true：静音；false：非静音
   * @memberof TRTCCloud
   * @example
   * trtcCloud.muteAllRemoteAudio(true);
   */
  muteAllRemoteAudio(mute: boolean): void {
    try {
      if (this.remoteStreamMap.size > 0) {
        Array.from(this.remoteStreamMap, ([, value]) => (value)).forEach((stream) => {
          if (stream) {
            if (mute) {
              stream.muteAudio();
            } else {
              stream.unmuteAudio();
            }
          }
        });
      }
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'muteAllRemoteAudio');
    }
  }
  /**
   * 设置某个远程用户的播放音量<br>
   * @param {String} userId 远程用户 ID
   * @param {Number} volume 音量大小，100为原始音量，范围是：[0 ~ 100]，默认值为100
   * @memberof TRTCCloud
   * @example
   * trtcCloud.setRemoteAudioVolume('denny', 80);
   */
  setRemoteAudioVolume(userId: string, volume: number) {
    try {
      if (!userId || volume < 0) {
        this.emitError(ParametersError);
        this.log_.error(`(muteRemoteVideoStream) failed - ${ParametersError.message}: userId = ${userId}, volume = ${volume}`);
        return;
      }
      const remoteStream = this.remoteStreamMap.get(userIdMain(userId));
      if (remoteStream) {
        const tempVolume = volume > 100 ? 1 : volume / 100;
        remoteStream.setAudioVolume(tempVolume);
      }
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'setRemoteAudioVolume');
    }
  }
  /**
   * 获取 SDK 采集音量<br>
   * @return {Number} SDK 采集音量
   * @memberof TRTCCloud
   * @example
   * trtcCloud.getAudioCaptureVolume('denny', 80);
   */
  getAudioCaptureVolume(): number {
    try {
      if (!this.localStream) {
        this.log_.warn(`(getAudioCaptureVolume) failed - localStream = ${this.localStream}`);
        return 0;
      }
      return this.localStream.getAudioLevel() * 100;
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'getAudioCaptureVolume');
      return 0;
    }
  }
}

export { Audio };
