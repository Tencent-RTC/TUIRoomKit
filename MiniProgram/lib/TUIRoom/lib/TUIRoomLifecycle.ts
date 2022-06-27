import { simpleClone } from './util';
import { TUISpeechMode, TUIRoomRole } from './types';
import TUIRoomResponse from './base/TUIRoomResponse';
import TUIRoomError from './base/TUIRoomError';
import TUIRoomInfo from './base/TUIRoomInfo';
import TUIRoomUser from './base/TUIRoomUser';
import { TUIRoomErrorCode, TUIRoomErrorMessage } from './constant';
import TIMService from './TIMService';
import TRTCService from './TRTCService';
import StateStore from './StateStore';

class TUIRoomLifecycle {
  static logPrefix = '[TUIRoomLifecycle]';

  private state: any;

  private timService: any;

  private trtcService: any;

  constructor(
    state: StateStore,
    timService: TIMService,
    trtcService?: TRTCService,
  ) {
    if (!state || !timService) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.INVALID_PARAM_ERROR,
        TUIRoomErrorMessage.INVALID_PARAM_ERROR,
      );
    }
    this.state = state;
    this.timService = timService;
    this.trtcService = trtcService;
  }

  async createRoom(options: {
    SDKAppID: number;
    userID: string;
    userSig: string;
    roomID: string;
    rtcConfig?: object;
    mode: TUISpeechMode;
  }): Promise<TUIRoomResponse<{
    room: TUIRoomInfo;
    user: TUIRoomUser;
  }>> {
    const { SDKAppID, userID, userSig, roomID, rtcConfig = {}, mode } = options;
    try {
      // 新建 IM 群
      const timResponse = await this.timService.createGroup(roomID);
      const { data: groupInfo } = timResponse;

      this.state.roomInfo.roomID = roomID;
      this.state.roomInfo.ownerID = groupInfo.ownerID;
      this.state.currentUser.role = TUIRoomRole.MASTER;

      return TUIRoomResponse.success(
        simpleClone({
          room: this.state.roomInfo,
          user: this.state.currentUser,
        }),
      );
    } catch (error: any) {
      if (error instanceof TUIRoomError) {
        throw error;
      } else {
        throw TUIRoomError.error(
          TUIRoomErrorCode.ENTER_ROOM_ERROR,
          TUIRoomErrorMessage.ENTER_ROOM_ERROR,
        );
      }
    }
  }

  async enterRoom(options: {
    SDKAppID: number;
    userID: string;
    userSig: string;
    roomID: string;
  }): Promise<TUIRoomResponse<{
    room: TUIRoomInfo;
    user: TUIRoomUser;
  }>> {
    const { SDKAppID, userID, userSig, roomID } = options;
    try {
      // 加入 IM 群
      const timResponse = await this.timService.joinGroup(roomID);
      const { data: groupInfo } = timResponse;
      // 提取房间控制参数（通过IM群公告实现）
      if (groupInfo.notification) {
        try {
          this.state.roomInfo.roomConfig = Object.assign(
            this.state.roomInfo.roomConfig,
            JSON.parse(groupInfo.notification),
          );
        } catch (error: any) {
        }
      }

      this.state.roomInfo.roomID = roomID;
      this.state.roomInfo.ownerID = groupInfo.ownerID;
      this.state.currentUser.role = groupInfo.ownerID === userID ? TUIRoomRole.MASTER : TUIRoomRole.ANCHOR;
      this.state.currentUser.isCameraMuted = this.state.roomInfo.roomConfig.isAllCameraMuted;
      this.state.currentUser.isMicrophoneMuted = this.state.roomInfo.roomConfig.isAllMicMuted;
      return TUIRoomResponse.success(
        simpleClone({
          room: this.state.roomInfo,
          user: this.state.currentUser,
        }),
      );
    } catch (error: any) {
      if (error instanceof TUIRoomError) {
        throw error;
      } else {
        throw TUIRoomError.error(
          TUIRoomErrorCode.ENTER_ROOM_ERROR,
          TUIRoomErrorMessage.ENTER_ROOM_ERROR,
        );
      }
    }
  }

  async exitRoom(): Promise<TUIRoomResponse<{
    room: TUIRoomInfo;
    user: TUIRoomUser;
  }>> {
    try {
      await this.trtcService.exitRoom();
      await this.timService.quitGroup();

      const responseData = simpleClone({
        room: this.state.roomInfo,
        user: this.state.currentUser,
      });
      this.state.roomInfo.reset();
      this.state.currentUser.reset();
      this.state.userMapReset();

      return TUIRoomResponse.success(responseData);
    } catch (error: any) {
      if (error instanceof TUIRoomError) {
        throw error;
      } else {
        throw TUIRoomError.error(
          TUIRoomErrorCode.EXIT_ROOM_ERROR,
          TUIRoomErrorMessage.EXIT_ROOM_ERROR,
        );
      }
    }
  }

  async destroyRoom(): Promise<TUIRoomResponse<{
    room: TUIRoomInfo;
    user: TUIRoomUser;
  }>> {
    // 检查当前用户是否有权限销毁房间
    if (
      this.state.currentUser.role !== TUIRoomRole.MANAGER &&
      this.state.currentUser.role !== TUIRoomRole.MASTER
    ) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.NO_PRIVILEGE,
        TUIRoomErrorMessage.NO_PRIVILEGE,
      );
    }
    try {
      await this.trtcService.exitRoom();
      await this.timService.dismissGroup();

      const responseData = simpleClone({
        room: this.state.roomInfo,
        user: this.state.currentUser,
      });
      this.state.roomInfo.reset();
      this.state.currentUser.reset();
      this.state.userMapReset();

      return TUIRoomResponse.success(responseData);
    } catch (error: any) {
      if (error instanceof TUIRoomError) {
        throw error;
      } else {
        throw TUIRoomError.error(
          TUIRoomErrorCode.DESTROY_ROOM_ERROR,
          TUIRoomErrorMessage.DESTROY_ROOM_ERROR,
        );
      }
    }
  }

  public destroy() {
    this.state = null;
    this.timService = null;
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

export default TUIRoomLifecycle;
