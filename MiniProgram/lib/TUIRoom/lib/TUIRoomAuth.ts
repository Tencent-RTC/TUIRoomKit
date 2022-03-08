import TUIRoomResponse from './base/TUIRoomResponse';
import TUIRoomError from './base/TUIRoomError';
import { TUIRoomErrorCode, TUIRoomErrorMessage } from './constant';
import StateStore from './StateStore';
import TSignalingService from './TSignalingService';
import TRTCService from './TRTCService';
import TIMService from './TIMService';

class TUIRoomAuthentication {
  static logPrefix = '[TUIRoomLifecycle]';

  private state: any;

  private tsignalingService: any;

  private trtcService: any;
  private timService: any;

  constructor(
    state: StateStore,
    tsignalingService: TSignalingService,
    timService?: TIMService,
    trtcService?: TRTCService,
  ) {
    if (!state || !tsignalingService) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.INVALID_PARAM_ERROR,
        TUIRoomErrorMessage.INVALID_PARAM_ERROR,
      );
    }

    this.state = state;
    this.tsignalingService = tsignalingService;
    this.trtcService = trtcService;
    this.timService = timService;
  }

  async login(userID: string, userSig: string): Promise<TUIRoomResponse<any>> {
    const response = await this.tsignalingService.login(userID, userSig);
    // const response = await this.timService.login(userID, userSig);
    const userInfo = await (await this.timService.getUserProfile([userID])).data[0];
    this.state.currentUser.ID = userID;
    this.state.currentUser.nick = userInfo.nick;
    this.state.currentUser.avatar = userInfo.avatar;
    return response;
  }

  /**
   * 退出登录
   * @returns {Promise}
   */
  async logout(): Promise<TUIRoomResponse<any>> {
    await this.tsignalingService.logout();
    return TUIRoomResponse.success();
  }

  destroy() {
    this.state = null;
    this.tsignalingService = null;
    this.trtcService = null;
  }


  /*************************************
   * 私有属性修改
   *
   *************************************
   */

  setTRTCService(trtcService: TRTCService) {
    this.trtcService = trtcService;
  }
}

export default TUIRoomAuthentication;
