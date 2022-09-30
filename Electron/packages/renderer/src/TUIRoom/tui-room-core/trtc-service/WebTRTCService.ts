import {
  TRTCScreenCaptureSourceType,
  TRTCVideoEncParam,
  Rect,
  TRTCScreenCaptureSourceInfo,
} from '../../trtc-cloud';
import logger from '../common/logger';
import TUIRoomResponse from '../base/TUIRoomResponse';
import { TUIRoomErrorCode, TUIRoomErrorMessage } from '../constant';
import BaseTRTCService from "./BaseTRTCService";

class WebTRTCService extends BaseTRTCService {
  static logPrefix = '[TRTCService]';

  constructor(){
    super();
  }
  // Electron - 获取屏幕和窗口列表
  getScreenCaptureSources(
    thumbWidth: number,
    thumbHeight: number,
    iconWidth: number,
    iconHeight: number): Array<TRTCScreenCaptureSourceInfo> {
    throw new Error('getScreenCaptureSources() not supported');
  }

  // Electron - 选择要分享的屏幕或窗口
  selectScreenCaptureTarget(
    type: TRTCScreenCaptureSourceType,
    sourceId: string,
    sourceName: string,
    captureRect: Rect,
    captureMouse: boolean,
    highlightWindow: boolean
  ){
    throw new Error('selectScreenCaptureTarget() not supported');
  }

  // Electron - 启动屏幕分享
  async startScreenCapture(
    view: HTMLDivElement | null,
    params?: TRTCVideoEncParam
  ): Promise<TUIRoomResponse<any>> {
    throw new Error('startScreenCapture() not supported');
  }

  // Electron - 暂停屏幕分享
  async pauseScreenCapture(): Promise<TUIRoomResponse<any>> {
    throw new Error('pauseScreenCapture() not supported');
  }

  // Electron - 恢复屏幕分享
  async resumeScreenCapture(): Promise<TUIRoomResponse<any>> {
    throw new Error('resumeScreenCapture() not supported');
  }

  // Electron - 结束屏幕分享
  async stopScreenCapture(): Promise<TUIRoomResponse<any>> {
    throw new Error('stopScreenCapture() not supported');
  }

  // 开始屏幕分享
  async startScreenShare(options: { shareUserId: string; shareUserSig: string; screenAudio?: boolean }) {
    if (!options.shareUserId || !options.shareUserSig) {
      return TUIRoomResponse.fail(TUIRoomErrorCode.INVALID_PARAM_ERROR, TUIRoomErrorMessage.INVALID_PARAM_ERROR);
    }
    
    try {
      await this.rtcCloud?.startScreenShare(options);
      return TUIRoomResponse.success();
    } catch (error: any) {
      // 当屏幕分享流初始化失败时, 提醒用户并停止后续进房发布流程
      switch (error.name) {
        case 'NotReadableError':
          // 提醒用户确保系统允许当前浏览器获取屏幕内容
          return TUIRoomResponse.fail(TUIRoomErrorCode.WEB_SCREEN_SHARE_SYSTEM_DENY, TUIRoomErrorMessage.WEB_SCREEN_SHARE_SYSTEM_DENY);
        case 'NotAllowedError':
          if (error.message.includes('Permission denied by system')) {
            // 提醒用户确保系统允许当前浏览器获取屏幕内容
            return TUIRoomResponse.fail(TUIRoomErrorCode.WEB_SCREEN_SHARE_SYSTEM_DENY, TUIRoomErrorMessage.WEB_SCREEN_SHARE_SYSTEM_DENY);
          } else {
            // 用户拒绝/取消屏幕分享
            return TUIRoomResponse.fail(TUIRoomErrorCode.WEB_SCREEN_SHARE_USER_DENY, TUIRoomErrorMessage.WEB_SCREEN_SHARE_USER_DENY);
          }
        default:
          // 初始化屏幕分享流时遇到了未知错误，提醒用户重试
          logger.error(`${WebTRTCService.logPrefix}startScreenShare unknown error:`, error);
          return TUIRoomResponse.fail(TUIRoomErrorCode.WEB_SCREEN_SHARE_UNKNOWN, TUIRoomErrorMessage.WEB_SCREEN_SHARE_UNKNOWN);
      }
    }
    
  }
  // 设置采集参数
  setScreenProfile(options: {width: number; height: number; frameRate: number; bitrate: number;}) {

  }
  // 新的屏幕分享
  async replaceScreenShare() {

  }
  // 停止屏幕分享
  async stopScreenShare() {
    return await this.rtcCloud?.stopScreenShare();
  }
}

export default WebTRTCService;
