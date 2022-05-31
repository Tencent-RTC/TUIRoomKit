/* eslint-disable no-underscore-dangle */
import { TRTCVideoStreamType, TRTCPublishCDNParam } from './common/trtc_define';
import { BaseCommon } from './BaseCommon';
import { MixinsClass } from './utils/utils';
import { ParametersError, conditionsError } from './common/trtcCode';

// eslint-disable-next-line new-cap
class MixCDN extends MixinsClass(BaseCommon) {
  // ///////////////////////////////////////////////////////////////////////////////
  //
  //                      （二）CDN 相关接口函数
  //
  // ///////////////////////////////////////////////////////////////////////////////
  /**
   * 2.1 开始向腾讯云的直播 CDN 推流
   *
   * 该接口会指定当前用户的音视频流在腾讯云 CDN 所对应的 StreamId，进而可以指定当前用户的 CDN 播放地址。
   *
   * 例如：如果我们采用如下代码设置当前用户的主画面 StreamId 为 user_stream_001，那么该用户主画面对应的 CDN 播放地址为：
   * “http://yourdomain/live/user_stream_001.flv”，其中 yourdomain 为您自己备案的播放域名，
   * 您可以在直播[控制台](https://console.cloud.tencent.com/live) 配置您的播放域名，腾讯云不提供默认的播放域名。
   *
   * 您也可以在设置 enterRoom 的参数 TRTCParams 时指定 streamId, 而且我们更推荐您采用这种方案。
   *
   * 注意：您需要先在实时音视频 [控制台](https://console.cloud.tencent.com/trtc/) 中的功能配置页开启“启动自动旁路直播”才能生效。
   *
   * @example
   * let trtcCloud = TRTCCloud.getTRTCShareInstance();
   * trtcCloud.enterRoom(params, TRTCAppScene.TRTCAppSceneLIVE);
   * trtcCloud.startLocalPreview(view);
   * trtcCloud.startLocalAudio(TRTCAudioQuality.TRTCAudioQualityDefault);
   * trtcCloud.startPublishing("user_stream_001", TRTCVideoStreamType.TRTCVideoStreamTypeBig);
   *
   *
   * @param {String} streamId - 自定义流 ID。
   * @param {TRTCVideoStreamType} type - 仅支持 TRTCVideoStreamTypeBig 和 TRTCVideoStreamTypeSub。
   * TODO: type 在 WebRTC 中没有意义
   */
  // eslint-disable-next-line
  async startPublishing(streamId: string, type: TRTCVideoStreamType) {
    try {
      if (!this.isPublished) {
        this.log_.error(`(startPublishing) failed - ${this.isPublished}`);
        this.emitError({
          conditionsError,
          message: `${conditionsError.message} - isPublished = ${this.isPublished}`,
        });
        return;
      }
      if (!this.client) {
        this.log_.error(`(startPublishing) failed - ${this.client}`);
        this.emitError({
          conditionsError,
          message: `${conditionsError.message} - client = ${this.client}`,
        });
        return;
      }
      const options = { streamId };
      await this.client.startPublishCDNStream(options);
    } catch (error) {
      this.callFunctionErrorManage(error, 'startPublishing');
    }
  }
  /**
   * 2.2 停止向腾讯云的直播 CDN 推流
   */
  async stopPublishing() {
    try {
      if (!this.client) {
        this.log_.error(`(stopPublishing) failed - ${this.client}`);
        this.emitError({
          conditionsError,
          message: `${conditionsError.message} - client = ${this.client}`,
        });
        return;
      }
      await this.client.stopPublishCDNStream();
    } catch (error) {
      this.callFunctionErrorManage(error, 'stopPublishing');
    }
  }
  /**
   * 2.3 开始向非腾讯云的直播 CDN 转推
   *
   * 该接口跟 startPublishing() 类似，但 startPublishCDNStream() 支持向非腾讯云的直播 CDN 转推。
   * 使用 startPublishing() 绑定腾讯云直播 CDN 不收取额外的费用。
   * 使用 startPublishCDNStream() 绑定非腾讯云直播 CDN 需要收取转推费用，且需要通过工单联系我们开通。
   *
   * @param {TRTCPublishCDNParam} param - 转推参数
   * @param {Number} param.appId - 腾讯云 AppID
   * @param {Number} param.bizId - 腾讯云直播 bizId
   * @param {String} param.url   - 旁路转推的 URL
   */
  async startPublishCDNStream(param: any) {
    try {
      if (param instanceof TRTCPublishCDNParam) {
        const { appId, bizId, url } = param;
        const options = {
          appId,
          bizId,
          url,
        };
        await this.client.startPublishCDNStream(options);
        // https://3891.liveplay.myqcloud.com/live/user_stream_rg.flv
        // options && await this.client.startPublishCDNStream({ streamId: 'user_stream_rg' });
      } else {
        this.log_.error(`(startPublishCDNStream) failed - ${JSON.stringify(param)}`);
        this.emitError(ParametersError);
      }
    } catch (error) {
      this.callFunctionErrorManage(error, 'startPublishCDNStream');
    }
  }
  /**
   * 2.4 停止向非腾讯云的直播 CDN 推流
   */
  async stopPublishCDNStream() {
    try {
      if (!this.client) {
        this.log_.error(`(stopPublishCDNStream) failed - ${this.client}`);
        this.emitError({
          conditionsError,
          message: `${conditionsError.message} - client = ${this.client}`,
        });
        return;
      }
      await this.client.stopPublishCDNStream();
    } catch (error) {
      this.callFunctionErrorManage(error, 'stopPublishCDNStream');
    }
  }
}

export { MixCDN };
