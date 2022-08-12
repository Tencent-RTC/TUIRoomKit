import logger from './common/logger';
import { safelyParseJSON, simpleClone } from './utils/utils';
import { ETUISpeechMode, ETUIRoomRole } from './types';
import TUIRoomResponse from './base/TUIRoomResponse';
import TUIRoomError from './base/TUIRoomError';
import TUIRoomInfo from './base/TUIRoomInfo';
import TUIRoomUser from './base/TUIRoomUser';
import { TUIRoomErrorCode, TUIRoomErrorMessage } from './constant';
import TIMService from './TIMService';
import TRTCService from './trtc-service';
import StateStore from './StateStore';
import { TRTCAppScene, TRTCRoleType } from './trtc_define';

class TUIRoomLifecycle {
  static logPrefix = '[TUIRoomLifecycle]';

  private state: any;

  private timService: any;

  private trtcService: any;

  constructor(
    state: StateStore,
    timService: TIMService,
    trtcService: TRTCService
  ) {
    if (!state || !timService || !trtcService) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.INVALID_PARAM_ERROR,
        TUIRoomErrorMessage.INVALID_PARAM_ERROR
      );
    }
    this.state = state;
    this.timService = timService;
    this.trtcService = trtcService;
  }

  async createRoom(options: {
    sdkAppId: number;
    userId: string;
    userSig: string;
    roomId: number;
    mode: ETUISpeechMode;
  }): Promise<
    TUIRoomResponse<{
      room: TUIRoomInfo;
      user: TUIRoomUser;
    }>
  > {
    logger.debug(`${TUIRoomLifecycle.logPrefix}createRoom options:`, options);
    const { sdkAppId, userId, userSig, roomId, mode } = options;
    const groupId = `${roomId}`;
    let groupInfo = null;
    try {
      // 设置开始时间
      this.state.roomInfo.roomConfig.startTime = new Date().getTime();
      this.state.roomInfo.roomConfig.speechMode = mode;
      // 检查群是否已经存在
      const timResponse = await this.timService.checkGroupExistence(groupId);
      groupInfo = timResponse.data;
      if (groupInfo) {
        if (groupInfo.ownerID === userId) {
          logger.log(
            `${TIMService.logPrefix}createGroup: group exist and current user is owner.`,
            groupInfo
          );
          // 更新 timService 内部信息
          this.timService.setGroupId(groupId);
          // 获取群组的详细信息，包括群公告
          const timResponse = await this.timService.getGroupProfile(groupId);
          groupInfo = timResponse.data;
          // 提取房间控制参数（通过IM群公告实现）
          if (groupInfo.notification) {
            try {
              this.state.roomInfo.roomConfig = Object.assign( 
                this.state.roomInfo.roomConfig,
                safelyParseJSON(groupInfo.notification),
              );
            } catch (error: any) {
              logger.error(
                `${TUIRoomLifecycle.logPrefix}createRoom parse group notification error:`,
                groupInfo.notification
              );
            }
          }
        } else {
          // 群已存在，当前用户不是群主，说明房间已存在，不能创建
          throw TUIRoomError.error(
            TUIRoomErrorCode.ROOM_EXISTED,
            TUIRoomErrorMessage.ROOM_EXISTED
          );
        }
      } else {
        // 新建 IM 群
        const timResponse = await this.timService.createGroup(
          roomId,
          this.state.roomInfo.roomConfig
        );
        const { data: groupInfo } = timResponse;
        logger.debug(
          `${TUIRoomLifecycle.logPrefix}createRoom createGroup response:`,
          groupInfo
        );
      }

      const scene = mode === ETUISpeechMode.APPLY_SPEECH ? TRTCAppScene.TRTCAppSceneLIVE : TRTCAppScene.TRTCAppSceneVideoCall;

      // 进入 TRTC 房间
      await this.trtcService.enterRoom({
        sdkAppId,
        userId,
        userSig,
        roomId,
        role: TRTCRoleType.TRTCRoleAnchor
      }, scene);
      this.state.roomInfo.roomId = roomId;
      this.state.roomInfo.ownerId = userId;
      this.state.currentUser.role = ETUIRoomRole.MASTER;

      return TUIRoomResponse.success(
        simpleClone({
          room: this.state.roomInfo,
          user: this.state.currentUser,
        })
      );
    } catch (error: any) {
      if (error instanceof TUIRoomError) {
        throw error;
      } else {
        logger.error(`${TUIRoomLifecycle.logPrefix}createRoom error:`, error);
        throw TUIRoomError.error(
          TUIRoomErrorCode.CREATE_ROOM_ERROR,
          TUIRoomErrorMessage.CREATE_ROOM_ERROR
        );
      }
    }
  }

  async enterRoom(options: {
    sdkAppId: number;
    userId: string;
    userSig: string;
    roomId: number;
  }): Promise<
    TUIRoomResponse<{
      room: TUIRoomInfo;
      user: TUIRoomUser;
    }>
  > {
    logger.debug(`${TUIRoomLifecycle.logPrefix}enterRoom options:`, options);
    const { sdkAppId, userId, userSig, roomId } = options;
    try {
      // 加入 IM 群
      await this.timService.joinGroup(roomId);
      // getGroupProfile 才能拿到详细的 groupProfile
      const timResponse = await this.timService.getGroupProfile(roomId);
      const { data: groupInfo } = timResponse;
      logger.debug(
        `${TUIRoomLifecycle.logPrefix}enterRoom joinGroup:`,
        groupInfo
      );

      // 提取房间控制参数（通过IM群公告实现）
      if (groupInfo.notification) {
        try {
          this.state.roomInfo.roomConfig = Object.assign( 
            this.state.roomInfo.roomConfig,
            safelyParseJSON(groupInfo.notification),
          );
        } catch (error: any) {
          logger.error(
            `${TUIRoomLifecycle.logPrefix}enterRoom parse group notification error:`,
            groupInfo.notification
          );
        }
      }
      const scene = this.state.roomInfo.roomConfig.speechMode === ETUISpeechMode.FREE_SPEECH ? TRTCAppScene.TRTCAppSceneVideoCall : TRTCAppScene.TRTCAppSceneLIVE;
      const role = scene === TRTCAppScene.TRTCAppSceneVideoCall ? TRTCRoleType.TRTCRoleAnchor : TRTCRoleType.TRTCRoleAudience;
      // 进入 TRTC 房间
      await this.trtcService.enterRoom({
        sdkAppId,
        userId,
        userSig,
        roomId,
        role,
      }, scene);
      this.state.roomInfo.roomId = roomId;
      this.state.roomInfo.ownerId = groupInfo.ownerID;
      if(this.state.currentUser.userId === this.state.roomInfo.ownerId) {
        this.state.currentUser.role = ETUIRoomRole.MASTER;
      } else {
        this.state.currentUser.role = ETUIRoomRole.ANCHOR;
      }

      return TUIRoomResponse.success(
        simpleClone({
          room: this.state.roomInfo,
          user: this.state.currentUser,
        })
      );
    } catch (error: any) {
      if (error instanceof TUIRoomError) {
        throw error;
      } else {
        logger.error(`${TUIRoomLifecycle.logPrefix}enterRoom error:`, error);
        throw TUIRoomError.error(
          TUIRoomErrorCode.ENTER_ROOM_ERROR,
          TUIRoomErrorMessage.ENTER_ROOM_ERROR
        );
      }
    }
  }

  async exitRoom(): Promise<
    TUIRoomResponse<{
      room: TUIRoomInfo;
      user: TUIRoomUser;
    }>
  > {
    logger.debug(`${TUIRoomLifecycle.logPrefix}exitRoom`);
    try {
      await this.trtcService.exitRoom();
      await this.timService.quitGroup();

      const responseData = simpleClone({
        room: this.state.roomInfo,
        user: this.state.currentUser,
      });
      this.state.reset();

      return TUIRoomResponse.success(responseData);
    } catch (error: any) {
      if (error instanceof TUIRoomError) {
        throw error;
      } else {
        logger.error(`${TUIRoomLifecycle.logPrefix}exitRoom error:`, error);
        throw TUIRoomError.error(
          TUIRoomErrorCode.EXIT_ROOM_ERROR,
          TUIRoomErrorMessage.EXIT_ROOM_ERROR
        );
      }
    }
  }

  async destroyRoom(): Promise<
    TUIRoomResponse<{
      room: TUIRoomInfo;
      user: TUIRoomUser;
    }>
  > {
    logger.debug(`${TUIRoomResponse}destroyRoom`,this.state.currentUser);
    // 检查当前用户是否有权限销毁房间
    if (
      this.state.currentUser.role !== ETUIRoomRole.MANAGER &&
      this.state.currentUser.role !== ETUIRoomRole.MASTER
    ) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.NO_PRIVILEGE,
        TUIRoomErrorMessage.NO_PRIVILEGE
      );
    }
    try {
      await this.trtcService.exitRoom();
      await this.timService.dismissGroup();

      const responseData = simpleClone({
        room: this.state.roomInfo,
        user: this.state.currentUser,
      });
      this.state.reset();

      return TUIRoomResponse.success(responseData);
    } catch (error: any) {
      if (error instanceof TUIRoomError) {
        throw error;
      } else {
        logger.error(`${TUIRoomLifecycle.logPrefix}destroyRoom error:`, error);
        throw TUIRoomError.error(
          TUIRoomErrorCode.DESTROY_ROOM_ERROR,
          TUIRoomErrorMessage.DESTROY_ROOM_ERROR
        );
      }
    }
  }

  public destroy() {
    this.state = null;
    this.timService = null;
    this.trtcService = null;
  }
}

export default TUIRoomLifecycle;
