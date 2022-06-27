import TIM from '../../tim-wx-sdk';
import Emitter from './emitter/event';
import TUIRoomResponse from './base/TUIRoomResponse';
import TUIRoomConfig from './base/TUIRoomConfig';
import TUIRoomError from './base/TUIRoomError';
import {
  TUIRoomErrorCode,
  TUIRoomErrorMessage,
  CommonConstant,
  TSignalingConfig,
} from './constant';
import ITUIRoomCoordinator from './interface/ITUIRoomCoordinator';
import TSignalingService from './TSignalingService';
import StateStore from './StateStore';
import {
  TUIRoomEvents,
  TUIRoomCoordinatorConfig,
  TUIRoomCoordinatorCommand,
  TTUIRoomConfig,
  TUIRoomRole,
} from './types';

import { safelyParseJSON, simpleClone } from './util';


class TUIRoomCoordinator implements ITUIRoomCoordinator {
  private static logPrefix = '[TUIRoomCoordinator]';

  private groupID = '';

  private roomID = '';

  private state: any;

  private tim: any;

  private emitter: Emitter | null;

  private tsignalingService: any;

  private resolveRejectCache = new Map<TUIRoomCoordinatorConfig,
    (value: TUIRoomResponse<any>) => void>();

  constructor(state: StateStore, tsignalingService: TSignalingService) {
    if (!state || !tsignalingService) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.INVALID_PARAM_ERROR,
        TUIRoomErrorMessage.INVALID_PARAM_ERROR,
      );
    }
    this.state = state;
    this.tsignalingService = tsignalingService;

    this.emitter = new Emitter();
  }

  /**
   *  初始化
   */
  init(options: { roomID: string; tim: any }) {
    const { roomID, tim } = options;
    this.roomID = roomID;
    this.groupID = `${CommonConstant.groupIDPrefix}${roomID}`;
    this.tim = tim;

    this.bindTIMEvent();
    this.bindTSignalingEvent();
    this.handleInitNotification(this.state.roomInfo.roomConfig);

  }

  // 进入房间，处理初始化的公告
  private handleInitNotification(roomConfig: TTUIRoomConfig) {
    const { isAllMicMuted } = roomConfig;
    if (isAllMicMuted) {
      if (this.state.currentUser.role !== TUIRoomRole.MASTER) {
        this.emitter?.emit(
          TUIRoomEvents.onMicrophoneMuted,
          roomConfig.isAllMicMuted,
        );
      }
    }
  }

  async setControlConfig(
    roomConfig: TUIRoomConfig,
  ): Promise<TUIRoomResponse<any>> {
    try {
      await this.tim.updateGroupProfile({
        groupID: this.groupID,
        notification: JSON.stringify(roomConfig),
      });
      return TUIRoomResponse.success();
    } catch (error: any) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.SET_ROOM_CONTROL_CONFIG_ERROR,
        TUIRoomErrorMessage.SET_ROOM_CONTROL_CONFIG_ERROR,
      );
    }
  }

  async getControlConfig(): Promise<TUIRoomResponse<TUIRoomConfig | null>> {
    try {
      const response = await this.tim.searchGroupByID(this.groupID);
      const { group } = response.data;
      if (group.notification) {
        try {
          const roomConfig = JSON.parse(group.notification);
          return TUIRoomResponse.success(roomConfig);
        } catch (error: any) {
        }
      }
      return TUIRoomResponse.success(null);
    } catch (error: any) {
      // 群不存在，需要新建
      throw TUIRoomError.error(
        TUIRoomErrorCode.GROUP_NOT_EXIST_ERROR,
        TUIRoomErrorMessage.GROUP_NOT_EXIST_ERROR,
      );
    }
  }

  async muteUserMicrophone(
    userID: string,
    mute: boolean,
  ): Promise<TUIRoomResponse<any>> {
    try {
      const message = {
        cmd: TUIRoomCoordinatorCommand.MuteUserMicrophone,
        room_id: this.roomID,
        receiver_id: userID,
        mute,
      };
      const tsResponse = await this.tsignalingService.invite(
        userID,
        message,
        TSignalingConfig.timeout,
      );
      if (tsResponse.code === 0) {
        const muteUser = this.state.userMap.get(userID);
        this.state.userMap.set(userID, { ...muteUser, isMicrophoneMuted: mute });
        console.log(this.state.userMap, userID);

        return TUIRoomResponse.success(tsResponse.data);
      }
      return TUIRoomResponse.fail(tsResponse.code, tsResponse.message, tsResponse.data);
    } catch (error: any) {
      throw error;
      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR,
      );
    }
  }

  async muteAllUsersMicrophone(mute: boolean): Promise<TUIRoomResponse<any>> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.tim.updateGroupProfile({
          groupID: this.groupID,
          notification: JSON.stringify({
            ...this.state.roomInfo.roomConfig,
            isAllMicMuted: mute,
          }),
        });
        this.resolveRejectCache.set(TUIRoomCoordinatorConfig.isAllMicMuted, resolve);
      } catch (error: any) {
        reject(TUIRoomResponse.fail(error.code, error.message, error));
        throw TUIRoomError.error(
          TUIRoomErrorCode.CHANGE_ALL_MIC_MUTE_ERROR,
          TUIRoomErrorMessage.CHANGE_ALL_MIC_MUTE_ERROR,
        );
      }
    });
  }

  async muteUserCamera(
    userID: string,
    mute: boolean,
  ): Promise<TUIRoomResponse<any>> {
    try {
      const message = {
        cmd: TUIRoomCoordinatorCommand.MuteUserCamera,
        room_id: this.roomID,
        receiver_id: userID,
        mute,
      };
      const tsResponse = await this.tsignalingService.invite(
        userID,
        message,
        TSignalingConfig.timeout,
      );
      if (tsResponse.code === 0) {
        const muteUser = this.state.userMap.get(userID);
        this.state.userMap.set(userID, { ...muteUser, isCameraMuted: mute });
        return TUIRoomResponse.success(tsResponse.data);
      }
      return TUIRoomResponse.fail(tsResponse.code, tsResponse.message, tsResponse.data);
    } catch (error: any) {
      throw error;
      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR,
      );
    }
  }

  async muteAllUsersCamera(mute: boolean): Promise<TUIRoomResponse<any>> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.tim.updateGroupProfile({
          groupID: this.groupID,
          notification: JSON.stringify({
            ...this.state.roomInfo.roomConfig,
            isAllCameraMuted: mute,
          }),
        });
        this.resolveRejectCache.set(TUIRoomCoordinatorConfig.isAllCameraMuted, resolve);

      } catch (error: any) {
        reject(TUIRoomResponse.fail(error.code, error.message, error));
        throw TUIRoomError.error(
          TUIRoomErrorCode.CHANGE_ALL_CAMERA_MUTE_ERROR,
          TUIRoomErrorMessage.CHANGE_ALL_CAMERA_MUTE_ERROR,
        );
      }
    });
  }

  async kickOffUser(userID: string): Promise<TUIRoomResponse<any>> {
    try {
      const message = {
        cmd: TUIRoomCoordinatorCommand.KickOffUser,
        room_id: this.roomID,
        receiver_id: userID,
      };
      const tsResponse = await this.tsignalingService.invite(
        userID,
        message,
        TSignalingConfig.timeout,
      );
      if (tsResponse.code === 0) {
        return TUIRoomResponse.success(tsResponse.data);
      }
      return TUIRoomResponse.fail(tsResponse.code, tsResponse.message, tsResponse.data);
    } catch (error: any) {

      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR,
      );
    }
  }


  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   TIM 事件处理
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */

  // 事件绑定
  private bindTIMEvent() {
    this.tim.on(TIM.EVENT.MESSAGE_RECEIVED, this.onMessageReceived, this);
  }

  // 解除事件绑定
  private unbindTIMEvent() {
    this.tim.off(TIM.EVENT.MESSAGE_RECEIVED, this.onMessageReceived, this);
  }

  // 处理消息接收事件
  private onMessageReceived(event: Record<string, any>) {
    event.data.forEach((message: Record<string, any>) => {
      switch (message.type) {
        case TIM.TYPES.MSG_GRP_TIP:
          this.handleGroupTip(message);
          break;
        default:
      }
    });
  }

  // 处理群提示消息
  private handleGroupTip(message: Record<string, any>) {
    const { operationType } = message.payload;
    const notification = safelyParseJSON(
      message.payload.newGroupProfile.notification,
    );
    switch (operationType) {
      case TIM.TYPES.GRP_TIP_GRP_PROFILE_UPDATED:
        // 收到群组资料变更
        this.handleGroupNotification(notification);
        break;
      default:
    }
  }

  // 处理群组资料变更消息
  private handleGroupNotification(params: TTUIRoomConfig) {
    const notification = simpleClone(params);
    Object.keys(this.state.roomInfo.roomConfig).forEach((key) => {
      if (this.state.roomInfo.roomConfig[key] !== notification[key]) {
        this.state.roomInfo.roomConfig[key] = notification[key];
        switch (key) {
          case TUIRoomCoordinatorConfig.isAllMicMuted:
            this.state.userMap.forEach(item => {
              if (item.ID !== this.state.roomInfo.ownerID) {
                item.isMicrophoneMuted = notification[key];
              }
            });
            if (this.state.currentUser.role !== TUIRoomRole.MASTER) {
              this.emitter?.emit(
                TUIRoomEvents.onMicrophoneMuted,
                notification[key],
              );
            }
            break;
          case TUIRoomCoordinatorConfig.isAllCameraMuted:
            this.state.userMap.forEach(item => {
              if (item.ID !== this.state.roomInfo.ownerID) {
                item.isCameraMuted = notification[key];
              }
            });
            if (this.state.currentUser.role !== TUIRoomRole.MASTER) {
              this.emitter?.emit(
                TUIRoomEvents.onCameraMuted,
                notification[key],
              );
            }
            break;
          default:
            break;
        }
      }
      if (this.resolveRejectCache.has(key as TUIRoomCoordinatorConfig)) {
        this.resolveRejectCache.get(key as TUIRoomCoordinatorConfig)(TUIRoomResponse.success());
      }
    });
  }


  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   TSignaling 事件处理
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  // 事件绑定
  private bindTSignalingEvent() {
    this.tsignalingService.on(
      TUIRoomEvents.onMicrophoneMuted,
      this.onMicrophoneMuted,
      this,
    );
    this.tsignalingService.on(
      TUIRoomEvents.onCameraMuted,
      this.onCameraMuted,
      this,
    );
    this.tsignalingService.on(
      TUIRoomEvents.onKickOff,
      this.onKickOff,
      this,
    );
  }

  // 解除事件绑定
  private unbindTSignalingEvent() {

    this.tsignalingService.off(
      TUIRoomEvents.onMicrophoneMuted,
      this.onMicrophoneMuted,
      this,
    );

    this.tsignalingService.off(
      TUIRoomEvents.onCameraMuted,
      this.onCameraMuted,
      this,
    );
    this.tsignalingService.off(
      TUIRoomEvents.onKickOff,
      this.onKickOff,
      this,
    );
  }

  private async onMicrophoneMuted(event: any) {
    const { eventCode, data } = event;
    const { mute, inviterID } = data;
    const message = {
      cmd: TUIRoomCoordinatorCommand.MuteUserMicrophone,
      room_id: this.roomID,
      receiver_id: this.state.currentUser.ID,
      mute,
    };
    this.emitter?.emit(TUIRoomEvents.onMicrophoneMuted, mute);
    await this.tsignalingService.accept(inviterID, message);
    this.state.currentUser.isMicrophoneMuted = mute;
  }

  private async onCameraMuted(event: any) {
    const { eventCode, data } = event;
    const { mute, inviterID } = data;
    const message = {
      cmd: TUIRoomCoordinatorCommand.MuteUserCamera,
      room_id: this.roomID,
      receiver_id: this.state.currentUser.ID,
      mute,
    };
    this.emitter?.emit(TUIRoomEvents.onCameraMuted, mute);
    await this.tsignalingService.accept(inviterID, message);
    this.state.currentUser.isCameraMuted = mute;
  }

  private async onKickOff(event: any) {
    const { eventCode, data } = event;
    const { inviterID } = data;
    const message = {
      cmd: TUIRoomCoordinatorCommand.KickOffUser,
      room_id: this.roomID,
      receiver_id: this.state.currentUser.ID,
    };
    this.emitter?.emit(TUIRoomEvents.onKickOff, inviterID);
    await this.tsignalingService.accept(inviterID, message);
  }

  /**
   * 注册事件监听
   */
  on(
    eventName: string,
    handler: (...args: any) => void,
    ctx?: Record<string, any>,
  ) {
    this.emitter?.on(eventName, handler, ctx);
  }

  /**
   * 取消事件监听
   */
  off(eventName: string, handler: (...args: any) => void) {
    this.emitter?.off(eventName as string, handler);
  }

  destroy() {
    this.groupID = '';
    this.roomID = '';
    this.state = null;
    this.tim = null;
    this.emitter = null;
    this.tsignalingService = null;
    this.unbindTSignalingEvent();
    this.unbindTIMEvent();
  }
}

export default TUIRoomCoordinator;
