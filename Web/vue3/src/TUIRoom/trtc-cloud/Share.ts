import { TRTCVideoStreamType } from './common/trtc_define';
import { BaseCommon } from './BaseCommon';
import { MixinsClass } from './utils/utils';

// eslint-disable-next-line new-cap
class Share extends MixinsClass(BaseCommon) {
  // ///////////////////////////////////////////////////////////////////////////////
  //
  //                      （八）辅流相关接口函数（屏幕共享，播片等）
  //
  // ///////////////////////////////////////////////////////////////////////////////
  getScreenCaptureSources() {
    return;
  }
  selectScreenCaptureTarget() {
    return;
  }
  /**
   * SDK  不支持屏幕分享, 需要用户自己实现: https://www.electronjs.org/docs/api/desktop-capturer
   * 8.7 启动屏幕分享，支持选择使用主路或辅路进行屏幕分享。（暂不支持 mac 平台预览界面）
   *
   * 注意:
   * 一个用户同时最多只能上传一条主路（TRTCVideoStreamTypeBig）画面和一条辅路（TRTCVideoStreamTypeSub）画面，
   * 默认情况下，屏幕分享使用辅路画面，如果使用主路画面，建议您提前停止摄像头采集（stopLocalPreview）避免相互冲突。
   *
   * @param {HTMLElement} view - 承载预览画面的 DOM
   * @param {TRTCVideoStreamType} type 屏幕分享使用的线路，可以设置为主路（TRTCVideoStreamTypeBig）或者辅路（TRTCVideoStreamTypeSub），默认使用辅路。
   * @param {TRTCVideoEncParam} params 屏幕分享的画面编码参数，可以设置为 null，表示让 SDK 选择最佳的编码参数（分辨率、码率等）。
   *        即使在调用 startScreenCapture 时设置 type=TRTCVideoStreamTypeBig，依然可以使用此接口更新屏幕分享的编码参数。
   */
  // eslint-disable-next-line
  async startScreenCapture(view: HTMLElement, type: TRTCVideoStreamType.TRTCVideoStreamTypeSub, params: any) {
    return;
    // // 屏幕分享使用的线路, 可以使用主路、或者辅路, 默认使用辅路
    // if((type !== TRTCVideoStreamType.TRTCVideoStreamTypeSub && type !== TRTCVideoStreamType.TRTCVideoStreamTypeBig)){
    //   type = TRTCVideoStreamType.TRTCVideoStreamTypeSub;
    // }
    // if (params && !(params instanceof TRTCVideoEncParam)) {
    //   console.error('startScreenCapture, params is not instanceof TRTCVideoEncParam!');
    //   return;
    // }

    // const shareClientConfig = {
    //   sdkAppId: this.sdkAppId,
    //   userId: this.userId,
    //   userSig: this.userSig,
    //   mode: this.shareClientMode,
    //   autoSubscribe: false,
    // };
    // this.shareClient = await this.TRTC.createClient(shareClientConfig);
    // await this.shareClient.join({ roomId: this.roomId });
    // this.shareClientLocalStream = await this.TRTC.createStream({
    //   userId: this.client && this.client.userId || 'initial share userId',
    //   screen: true,
    //   audio: false,
    // });

    // try {
    //   this.shareClientLocalStream.setScreenProfile({
    //     width: params && params.videoResolution || 1920,
    //     height: params && params.videoResolution || 1080,
    //     // params.resMode, // TRTCCloud 分辨率模式(横屏、竖屏) WebRTC 暂不支持
    //     frameRate: params && params.videoFps || 5,
    //     bitrate: params && params.videoBitrate || 1600,
    //     // params.minVideoBitrate, // TRTCCloud 最低视频码率 WebRTC 暂不支持
    //     // params.enableAdjustRes, // TRTCCloud 是否允许调整分辨率 WebRTC 暂不支持
    //   });
    //   await this.shareClientLocalStream.initialize();
    //   await this.shareClient.publish(this.shareClientLocalStream);
    // } catch (error) {
    // }
  }

  /**
   * 初始化屏幕分享的客户端对象
   */
  private async initShareClient(shareUserId: string, shareUserSig: string) {
    try {
      this.shareClient = await this.TRTC.createClient({
        mode: 'rtc',
        sdkAppId: this.sdkAppId,
        userId: shareUserId,
        userSig: shareUserSig,
        autoSubscribe: false, // 不自动订阅远端流
      });
      console.log(`ShareClient [${shareUserId}] created.`);
      this.installShareClientEventHandlers();
    } catch (error: any) {
      console.error(`Failed to create Client [${shareUserId}].`);
      throw error;
    }
  }

  private installShareClientEventHandlers() {
    this.shareClient.on('error', this.handleShareClientError.bind(this));
    this.shareClient.on('client-banned', this.handleShareClientBanned.bind(this));
    this.shareClient.on('stream-subscribed', this.handleShareClientStreamSubscribed.bind(this));
  }

  private handleShareClientError(error: any) {
    console.error('ShareClient error:', error);
  }

  private handleShareClientBanned(error: any) {
    console.error('ShareClient has been banned for:', error);
  }

  private handleShareClientStreamSubscribed(event: any) {
    const remoteStream = event.stream;
    const id = remoteStream.getId();
    const userId = remoteStream.getUserId();
    console.log(`remote stream received and unsubscribed: [${userId}] ID: ${id} type: ${remoteStream.getType()}`);

    this.shareClient.unsubscribe(remoteStream);
  }

  private async initShareStream() {
    try {
      this.shareStream = this.TRTC.createStream({
        audio: false,
        screen: true,
        userId: this.userId,
      });
      this.shareStream.setScreenProfile({
        width: 1920,
        height: 1080,
        frameRate: 15,
        bitrate: 1500,
      });
      await this.shareStream.initialize();
      this.shareStream.on('screen-sharing-stopped', () => {
        console.log('ShareStream video track ended');
        // 用户通过浏览器自带的按钮停止屏幕分享，透传事件给外部处理
        this.emit('onWebScreenSharingStopped');
        this.shareClientLeave();
      });
      return this.shareStream;
    } catch (error: any) {
      console.error(`ShareStream failed to initialize. Error: ${error}`);
      throw error;
    }
  }

  private async shareClientJoin(shareUserId: string, shareUserSig: string) {
    try {
      if (!this.shareClient) {
        await this.initShareClient(shareUserId, shareUserSig);
      }
      await this.shareClient.join({ roomId: this.roomId });
      this.isShareClientJoined = true;
    } catch (error: any) {
      console.error('ShareClient join room failed:', error);
      throw error;
    }
  }

  private async shareClientPublish() {
    if (!this.isShareClientJoined) {
      console.warn('ShareClient cannot publish() - please join() firstly');
      return;
    }
    if (this.isShareStreamPublished) {
      console.warn('ShareClient duplicate publish() observed');
      return;
    }
    try {
      await this.shareClient.publish(this.shareStream);
      console.log('ShareStream is published successfully');
      this.isShareStreamPublished = true;
    } catch (error: any) {
      console.error(`ShareStream is failed to publish. Error: ${error}`);
      throw error;
    }
  }

  private async shareClientUnpublish() {
    if (!this.isShareClientJoined) {
      console.warn('ShareClient cannot unpublish() - please join() firstly');
      return;
    }
    if (!this.isShareStreamPublished) {
      console.warn('ShareClient cannot unpublish() - you have not published yet');
      return;
    }
    try {
      if (this.shareStream) {
        await this.shareClient.unpublish(this.shareStream);
      }
      this.isShareStreamPublished = false;
      console.log('Unpublish ShareStream success');
    } catch (error: any) {
      console.error('unpublish failed', error);
      throw error;
    }
  }

  private async shareClientLeave() {
    if (!this.isShareClientJoined) {
      console.warn('ShareClient cannot leave() - please join() firstly');
      return;
    }
    if (this.isShareClientLeaving) {
      console.warn('ShareClient duplicate leave() observed');
      return;
    }
    if (this.isShareStreamPublished) {
      await this.shareClientUnpublish();
    }

    try {
      this.isShareClientLeaving = true;
      await this.shareClient.leave();
      this.isShareClientJoined = false;
      console.log('ShareClient leave room success');

      if (this.shareStream) {
        this.shareStream.stop();
        this.shareStream.close();
        this.shareStream = null;
      }
      this.isShareClientLeaving = false;
    } catch (error: any) {
      console.error('ShareClient leave failed:', error);
      throw error;
    }
  }

  async startScreenShare(options: { shareUserId: string; shareUserSig: string; }) {
    const { shareUserId, shareUserSig } = options;
    try {
      await this.initShareStream();
      await this.shareClientJoin(shareUserId, shareUserSig);
      await this.shareClientPublish();
      console.log('Start share screen success');
      this.isSharing = true;
    } catch (error: any) {
      console.error('Start share screen error:', error);
      throw error;
    }
  }

  async stopScreenShare() {
    try {
      await this.shareClientUnpublish();
      await this.shareClientLeave();
      this.isSharing = false;
    } catch (error: any) {
      console.error('Stop screen share error:', error);
      throw error;
    }
  }
}

export { Share };
