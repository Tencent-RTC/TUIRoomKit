/* eslint-disable no-underscore-dangle */
import { TRTCBeautyStyle } from './common/trtc_define';
import { BaseCommon } from './BaseCommon';
import { MixinsClass } from './utils/utils';
// @ts-ignore
import RTCBeautyPlugin from 'rtc-beauty-plugin';

// eslint-disable-next-line new-cap
class Beauty extends MixinsClass(BaseCommon) {
  // ///////////////////////////////////////////////////////////////////////////////
  //
  //                      （七）图像前处理相关接口函数
  //
  // ///////////////////////////////////////////////////////////////////////////////
  /**
   * 7.1 设置美颜、美白、红润效果级别
   *
   * SDK 内部集成了两套风格不同的磨皮算法，一套我们取名叫“光滑”，适用于美女秀场，效果比较明显。
   * 另一套我们取名“自然”，磨皮算法更多地保留了面部细节，主观感受上会更加自然。
   *
   * @param {TRTCBeautyStyle} style - 美颜风格，光滑或者自然，光滑风格磨皮更加明显，适合娱乐场景。
   * - TRTCBeautyStyleSmooth: 光滑，适用于美女秀场，效果比较明显。
   * - TRTCBeautyStyleNature: 自然，磨皮算法更多地保留了面部细节，主观感受上会更加自然。
   * @param {Number} beauty    - 美颜级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显
   * @param {Number} white     - 美白级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显
   * @param {Number} ruddiness - 红润级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显，该参数 windows 平台暂未生效
   */
  async setBeautyStyle(style: TRTCBeautyStyle, beauty: number, white: number, ruddiness: number) {
    try {
      if (!this.beautyPlugin) {
        this.beautyPlugin = new RTCBeautyPlugin();
        if (this.localStream) {
          const videoTrack = this.localStream.getVideoTrack();
          if (videoTrack) {
            this.beautyPlugin.generateBeautyStream(this.localStream);
          }
        }
      }
      const factor = 0.11; // electron 美颜范围 1~9, WebRTC 美颜插件取值范围 0.1~1
      const params = {
        beauty: beauty * factor || this.beautyDefaultBeauty,
        brightness: white * factor || this.beautyDefaultBrightness,
        ruddy: ruddiness * factor || this.beautyDefaultRuddy,
      };
      this.beautyPlugin.setBeautyParam(params);
    } catch (error) {
      this.callFunctionErrorManage(error, 'setBeautyStyle');
    }
  }
  // 销毁美颜插件
  destroyBeautyPlugin() {
    try {
      if (this.beautyPlugin) {
        this.beautyPlugin.destroy();
      }
    } catch (error) {
      this.callFunctionErrorManage(error, 'destroyBeautyPlugin');
    }
  }
}

export { Beauty };
