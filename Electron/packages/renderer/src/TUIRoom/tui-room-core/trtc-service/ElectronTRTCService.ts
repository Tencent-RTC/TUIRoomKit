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
} from 'trtc-electron-sdk';
import TUIRoomError from '../base/TUIRoomError';
import TUIRoomResponse from '../base/TUIRoomResponse';
import BaseTRTCService from "./BaseTRTCService";


class ElectronTRTCService extends BaseTRTCService {
  constructor(){
    super();
  }
  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   屏幕分享相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
   getScreenCaptureSources(
    thumbWidth: number,
    thumbHeight: number,
    iconWidth: number,
    iconHeight: number
  ): Array<TRTCScreenCaptureSourceInfo> {
    return this.rtcCloud?.getScreenCaptureSources(
      thumbWidth,
      thumbHeight,
      iconWidth,
      iconHeight
    );
  }

  selectScreenCaptureTarget(
    type: TRTCScreenCaptureSourceType,
    sourceId: string,
    sourceName: string,
    captureRect: Rect,
    captureMouse: boolean,
    highlightWindow: boolean
  ) {
    this.rtcCloud?.selectScreenCaptureTarget(
      type,
      sourceId,
      sourceName,
      captureRect,
      captureMouse,
      highlightWindow
    );
  }

  async startScreenCapture(
    view: HTMLDivElement | null,
    params?: TRTCVideoEncParam
  ): Promise<TUIRoomResponse<any>> {
    this.rtcCloud?.startScreenCapture(
      view,
      TRTCVideoStreamType.TRTCVideoStreamTypeSub,
      params || null
    );
    return TUIRoomResponse.success();
  }

  async pauseScreenCapture(): Promise<TUIRoomResponse<any>> {
    this.rtcCloud?.pauseScreenCapture();
    return TUIRoomResponse.success();
  }

  async resumeScreenCapture(): Promise<TUIRoomResponse<any>> {
    this.rtcCloud?.resumeScreenCapture();
    return TUIRoomResponse.success();
  }

  async stopScreenCapture(): Promise<TUIRoomResponse<any>> {
    this.rtcCloud?.stopScreenCapture();
    return TUIRoomResponse.success();
  }

  // Web - 开始屏幕分享
  async startScreenShare(options: { shareUserId: string; shareUserSig: string; }) {
    throw new Error('startScreenShare() not supported');
  }
  // Web - 设置采集参数
  setScreenProfile(options: {width: number; height: number; frameRate: number; bitrate: number;}) {
    throw new Error('setScreenProfile() not supported');
  }
  // Web - 新的屏幕分享
  async replaceScreenShare() {
    throw new Error('replaceScreenShare() not supported');
  }
  // Web - 停止屏幕分享
  async stopScreenShare() {
    throw new Error('stopScreenShare() not supported');
  }
}

export default ElectronTRTCService;
