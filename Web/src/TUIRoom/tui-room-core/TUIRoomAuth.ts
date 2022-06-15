import logger from './common/logger';
import TUIRoomResponse from './base/TUIRoomResponse';
import TUIRoomError from './base/TUIRoomError';
import { TUIRoomErrorCode, TUIRoomErrorMessage } from './constant';
import StateStore from './StateStore';
import TSignalingService from './TSignalingService';
import TRTCService from './trtc-service';

class TUIRoomAuthentication {
  static logPrefix = '[TUIRoomAuth]';

  private state: any;

  private tSignalingService: any;

  private trtcService: any;

  constructor(
    state: StateStore,
    tSignalingService: TSignalingService,
    trtcService: TRTCService
  ) {
    if (!state || !tSignalingService || !trtcService) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.INVALID_PARAM_ERROR,
        TUIRoomErrorMessage.INVALID_PARAM_ERROR
      );
    }

    this.state = state;
    this.tSignalingService = tSignalingService;
    this.trtcService = trtcService;
  }

  async init(userId: string, userSig: string) {
    logger.debug(
      `${TUIRoomAuthentication.logPrefix}.init userID: ${userId} userSig: ${userSig}`
    );
    // 同步执行更新 currentUser 的信息，防止抛出的事件 current.userId 为 ''
    this.state.currentUser.userId = userId;
    this.state.currentUser.isLocal = true;
    this.state.userMap.set(userId, this.state.currentUser);
  }

  async login(userId: string, userSig: string): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomAuthentication.logPrefix}.login userID: ${userId} userSig: ${userSig}`
    );
    const response = await this.tSignalingService.login(userId, userSig);
    logger.debug(`${TUIRoomAuthentication.logPrefix}login result:`, response);
    return response;
  }

  /**
   * 退出登录
   * @returns {Promise}
   */
  async logout(): Promise<TUIRoomResponse<any>> {
    logger.debug(`${TUIRoomAuthentication.logPrefix}logout`);
    await this.trtcService.exitRoom();
    await this.tSignalingService.logout();
    return TUIRoomResponse.success();
  }

  destroy() {
    this.state = null;
    this.tSignalingService = null;
    this.trtcService = null;
  }
}

export default TUIRoomAuthentication;
