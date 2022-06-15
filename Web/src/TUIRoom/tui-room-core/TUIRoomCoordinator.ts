// @ts-ignore
import TIM from 'tim-js-sdk';
import Emitter from './common/emitter/event';
import TUIRoomResponse from './base/TUIRoomResponse';
import TUIRoomConfig from './base/TUIRoomConfig';
import TUIRoomError from './base/TUIRoomError';
import {
  TUIRoomErrorCode,
  TUIRoomErrorMessage,
  TSignalingConfig,
} from './constant';
import ITUIRoomCoordinator from './ITUIRoomCoordinator';
import logger from './common/logger';
import TSignalingService from './TSignalingService';
import StateStore from './StateStore';
import {
  ETUIRoomEvents,
  ETUIRoomCoordinatorConfig,
  ETUIRoomCoordinatorCommand,
  TTUIRoomConfig,
  TTUIRoomTSBase,
  ETUIRoomRole,
} from './types.d';

import { safelyParseJSON, simpleClone } from './utils/utils';

class TUIRoomCoordinator implements ITUIRoomCoordinator {
  private static logPrefix = '[TUIRoomCoordinator]';

  private groupId = '';

  private roomId = 0;

  private state: any;

  private tim: any;

  private emitter: Emitter | null;

  private tSignalingService: any;

  constructor(state: StateStore, tSignalingService: TSignalingService) {
    if (!state || !tSignalingService) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.INVALID_PARAM_ERROR,
        TUIRoomErrorMessage.INVALID_PARAM_ERROR
      );
    }
    this.state = state;
    this.tSignalingService = tSignalingService;

    this.emitter = new Emitter();
  }

  /**
   *  初始化
   */
  init(options: { roomId: number; tim: any }) {
    const { roomId, tim } = options;
    this.roomId = roomId;
    this.groupId = `${roomId}`;
    this.tim = tim;
    this.bindTIMEvent();
    this.bindTSignalingEvent();
    this.handleInitNotification(this.state.roomInfo.roomConfig);
  }

  // 进入房间，处理初始化的公告
  private handleInitNotification(roomConfig: TTUIRoomConfig) {
    const { isCallingRoll, isAllMicMuted } = roomConfig;
    if (isCallingRoll) {
      this.emitter?.emit(
        ETUIRoomEvents.onCallingRollStarted,
        roomConfig.isCallingRoll
      );
    }
    if (isAllMicMuted) {
      if (this.state.currentUser.role !== ETUIRoomRole.MASTER) {
        this.emitter?.emit(
          ETUIRoomEvents.onMicrophoneMuted,
          roomConfig.isAllMicMuted
        );
      }
    }
  }

  async setControlConfig(
    roomConfig: TTUIRoomConfig
  ): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}setControlConfig params:`,
      roomConfig,
      this
    );
    try {
      await this.tim.updateGroupProfile({
        groupId: this.groupId,
        notification: JSON.stringify(roomConfig),
      });
      return TUIRoomResponse.success(roomConfig);
    } catch (error: any) {
      logger.error(
        `${TUIRoomCoordinator.logPrefix}setControlConfig error:`,
        error
      );
      throw TUIRoomError.error(
        TUIRoomErrorCode.SET_ROOM_CONTROL_CONFIG_ERROR,
        TUIRoomErrorMessage.SET_ROOM_CONTROL_CONFIG_ERROR
      );
    }
  }

  async getControlConfig(): Promise<TUIRoomResponse<TUIRoomConfig | null>> {
    logger.debug(`${TUIRoomCoordinator.logPrefix}getControlConfig`, this);
    try {
      const response = await this.tim.getGroupProfile({
        groupId: this.groupId,
        groupCustomFieldFilter: ['notification'],
      });
      logger.log(`${TUIRoomCoordinator.logPrefix}getGroupAttributes`, response);
      const { group } = response.data;
      if (group.notification) {
        try {
          const roomConfig = safelyParseJSON(group.notification);
          return TUIRoomResponse.success(roomConfig);
        } catch (error: any) {
          logger.error(
            `${TUIRoomCoordinator.logPrefix}getControlConfig parse group notification error:`,
            group.notification
          );
        }
      }
      return TUIRoomResponse.success(null);
    } catch (error: any) {
      // 群不存在，需要新建
      throw TUIRoomError.error(
        TUIRoomErrorCode.GROUP_NOT_EXIST_ERROR,
        TUIRoomErrorMessage.GROUP_NOT_EXIST_ERROR
      );
    }
  }

  async muteUserMicrophone(
    userId: string,
    mute: boolean
  ): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}muteUserMicrophone userId: ${userId} mute: ${mute}`,
      this
    );
    try {
      const message = {
        cmd: ETUIRoomCoordinatorCommand.MuteUserMicrophone,
        room_id: this.roomId,
        receiver_id: userId,
        mute,
      };
      const tsResponse = await this.tSignalingService.invite(
        userId,
        message,
        TSignalingConfig.timeout
      );
      if (tsResponse.code === 0) {
        return TUIRoomResponse.success(tsResponse.data);
      }
      return TUIRoomResponse.fail(tsResponse.code, '', tsResponse.data);
    } catch (error: any) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR
      );
    }
  }

  async muteAllUsersMicrophone(mute: boolean): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}muteAllUsersMicrophone mute: ${mute}`,
      this
    );
    try {
      await this.tim.updateGroupProfile({
        groupId: this.groupId,
        notification: JSON.stringify({
          ...this.state.roomInfo.roomConfig,
          isAllMicMuted: mute,
        }),
      });
      return TUIRoomResponse.success();
    } catch (error: any) {
      logger.error(
        `${TUIRoomCoordinator.logPrefix}muteAllUsersMicrophone error:`,
        error
      );
      throw TUIRoomError.error(
        TUIRoomErrorCode.CHANGE_ALL_MIC_MUTE_ERROR,
        TUIRoomErrorMessage.CHANGE_ALL_MIC_MUTE_ERROR
      );
    }
  }

  async muteUserCamera(
    userId: string,
    mute: boolean
  ): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}muteUserCamera userId: ${userId} mute: ${mute}`,
      this
    );
    return TUIRoomResponse.success();
  }

  async muteAllUsersCamera(mute: boolean): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}muteAllUsersCamera mute: ${mute}`,
      this
    );
    return TUIRoomResponse.success();
  }

  async muteChatRoom(mute: boolean): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}muteChatRoom mute: ${mute}`,
      this
    );
    return TUIRoomResponse.success();
  }

  async kickOffUser(userId: string): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}kickOffUser userId: ${userId}`,
      this
    );
    return TUIRoomResponse.success();
  }

  /**
   * 开始点名
   * @returns {Promise}
   */
  async startCallingRoll(): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}startCallingRoll`,
      this.state.roomInfo.roomConfig
    );
    if (this.state.roomInfo.roomConfig.isCallingRoll) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.CALLING_ROLL,
        TUIRoomErrorMessage.CALLING_ROLL
      );
    }
    try {
      await this.setControlConfig({
        ...this.state.roomInfo.roomConfig,
        isCallingRoll: true,
      });
      return TUIRoomResponse.success();
    } catch (error: any) {
      logger.error(
        `${TUIRoomCoordinator.logPrefix}startCallingRoll error:`,
        error
      );
      throw TUIRoomError.error(
        TUIRoomErrorCode.START_CALL_ROLL_ERROR,
        TUIRoomErrorMessage.START_CALL_ROLL_ERROR
      );
    }
  }

  /**
   * 结束点名
   * @returns {Promise}
   */
  async stopCallingRoll(): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}stopCallingRoll`,
      this.state.roomInfo.roomConfig
    );
    if (!this.state.roomInfo.roomConfig.isCallingRoll) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.NOT_CALL_ROLL,
        TUIRoomErrorMessage.NOT_CALL_ROLL
      );
    }
    try {
      await this.setControlConfig({
        ...this.state.roomInfo.roomConfig,
        isCallingRoll: false,
      });
      return TUIRoomResponse.success();
    } catch (error: any) {
      logger.error(
        `${TUIRoomCoordinator.logPrefix}stopCallingRoll error:`,
        error
      );
      throw TUIRoomError.error(
        TUIRoomErrorCode.STOP_CALL_ROLL_ERROR,
        TUIRoomErrorMessage.STOP_CALL_ROLL_ERROR
      );
    }
  }

  /**
   * 成员回复点名
   *
   * @return {Promise}
   */
  async replyCallingRoll(): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}replyCallingRoll`,
      this.state.roomInfo?.roomConfig
    );
    if (!this.state.roomInfo?.roomConfig?.isCallingRoll) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.NOT_CALL_ROLL,
        TUIRoomErrorMessage.NOT_CALL_ROLL
      );
    }
    try {
      const message = {
        cmd: ETUIRoomCoordinatorCommand.ReplyCallingRoll,
        room_id: this.roomId,
        sender_id: this.state.currentUser.userId,
      };
      const imResponse = await this.tSignalingService.invite(
        this.state.roomInfo.ownerId,
        message
      );
      return TUIRoomResponse.success(imResponse.data);
    } catch (error) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR
      );
    }
  }

  /**
   * 主持人邀请成员发言
   * @param {string} userId 成员Id
   * @returns {Promise}
   */
  async sendSpeechInvitation(userId: string): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}sendSpeechInvitation userId: ${userId}`,
      this
    );
    try {
      const message = {
        cmd: ETUIRoomCoordinatorCommand.SendSpeechInvitation,
        room_id: this.roomId,
        receiver_id: userId,
      };
      const tsResponse = await this.tSignalingService.invite(
        userId,
        message,
        TSignalingConfig.timeout
      );
      if (tsResponse.code === 0) {
        return TUIRoomResponse.success(tsResponse.data);
      }
      return TUIRoomResponse.fail(tsResponse.code, '', tsResponse.data);
    } catch (tsError) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR
      );
    }
  }

  /**
   * 主持人取消发言邀请
   * @param {string} userId 成员Id
   * @returns {Promise}
   */
  async cancelSpeechInvitation(userId: string): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}cancelSpeechInvitation userId: ${userId}`,
      this
    );
    try {
      const message = {
        cmd: ETUIRoomCoordinatorCommand.SendSpeechInvitation,
        room_id: this.roomId,
        receiver_id: userId,
      };
      const imResponse = await this.tSignalingService.cancel(userId, message);
      return TUIRoomResponse.success(imResponse.data);
    } catch (error) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR
      );
    }
  }

  /**
   * 成员响应发言邀请
   * @param {boolean} agree true: 接收邀请，false: 拒绝邀请
   * @returns {Promise}
   */
  async replySpeechInvitation(agree: boolean): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}replySpeechInvitation agree: ${agree}`,
      this
    );
    try {
      const message = {
        cmd: ETUIRoomCoordinatorCommand.SendSpeechInvitation,
        room_id: this.roomId,
        receiver_id: this.state.currentUser.userId,
      };
      let tsResponse = null;
      if (agree) {
        tsResponse = await this.tSignalingService.accept(
          this.state.roomInfo.ownerId,
          message
        );
      } else {
        tsResponse = await this.tSignalingService.reject(
          this.state.roomInfo.ownerId,
          message
        );
      }
      return TUIRoomResponse.success(tsResponse.data);
    } catch (error) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR
      );
    }
  }

  async sendSpeechApplication(): Promise<TUIRoomResponse<any>> {
    logger.debug(`${TUIRoomCoordinator.logPrefix}sendSpeechApplication`, this);
    try {
      const message = {
        cmd: ETUIRoomCoordinatorCommand.SendSpeechApplication,
        room_id: this.roomId,
        sender_id: this.state.currentUser.userId,
      };
      const tsResponse = await this.tSignalingService.invite(
        this.state.roomInfo.ownerId,
        message,
        TSignalingConfig.timeout
      );
      if (tsResponse.code === 0) {
        return TUIRoomResponse.success(tsResponse.data);
      }
      return TUIRoomResponse.fail(tsResponse.code, '', tsResponse.data);
    } catch (error) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR
      );
    }
  }

  async cancelSpeechApplication(): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}cancelSpeechApplication`,
      this
    );
    try {
      const message = {
        cmd: ETUIRoomCoordinatorCommand.SendSpeechApplication,
        room_id: this.roomId,
        sender_id: this.state.currentUser.userId,
      };
      const imResponse = await this.tSignalingService.cancel(
        this.state.currentUser.userId,
        message
      );
      return TUIRoomResponse.success(imResponse.data);
    } catch (error) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR
      );
    }
  }

  async replySpeechApplication(
    userId: string,
    agree: boolean
  ): Promise<TUIRoomResponse<any>> {
    try {
      const message = {
        cmd: ETUIRoomCoordinatorCommand.SendSpeechApplication,
        room_id: this.roomId,
        sender_id: userId,
        agree,
      };
      let tsResponse = null;
      if (agree) {
        tsResponse = await this.tSignalingService.accept(userId, message);
      } else {
        tsResponse = await this.tSignalingService.reject(userId, message);
      }
      return TUIRoomResponse.success(tsResponse.data);
    } catch (error) {
      throw TUIRoomError.error(
        TUIRoomErrorCode.SEND_CUSTOM_MESSAGE_ERROR,
        TUIRoomErrorMessage.SEND_CUSTOM_MESSAGE_ERROR
      );
    }
  }

  async forbidSpeechApplication(
    forbid: boolean
  ): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}forbidSpeechApplication forbid: ${forbid}`,
      this
    );
    return TUIRoomResponse.success();
  }

  async sendOffSpeaker(userId: string): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TUIRoomCoordinator.logPrefix}sendOffSpeaker userId: ${userId}`,
      this
    );
    return TUIRoomResponse.success();
  }

  async sendOffAllSpeakers(): Promise<TUIRoomResponse<any>> {
    logger.debug(`${TUIRoomCoordinator.logPrefix}sendOffAllSpeakers`, this);
    return TUIRoomResponse.success();
  }

  async exitSpeechState(): Promise<TUIRoomResponse<any>> {
    logger.debug(`${TUIRoomCoordinator.logPrefix}exitSpeechState`, this);
    return TUIRoomResponse.success();
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
    logger.log(
      `${TUIRoomCoordinator.logPrefix}onMessageReceived message:`,
      event
    );
    event.data.forEach((message: Record<string, any>) => {
      switch (message.type) {
        case TIM.TYPES.MSG_GRP_TIP:
          this.handleGroupTip(message);
          break;
        default:
          logger.warn(
            `${TUIRoomCoordinator.logPrefix}onMessageReceived ignored message:`,
            message
          );
      }
    });
  }

  // 处理群提示消息
  private handleGroupTip(message: Record<string, any>) {
    logger.log(
      `${TUIRoomCoordinator.logPrefix}handleGroupTip message:`,
      message
    );
    const { operationType } = message.payload;
    const notification = safelyParseJSON(
      message.payload.newGroupProfile.notification
    );
    switch (operationType) {
      case TIM.TYPES.GRP_TIP_GRP_PROFILE_UPDATED:
        // 收到群组资料变更
        this.handleGroupNotification(notification);
        break;
      default:
        logger.warn(
          `${TUIRoomCoordinator.logPrefix}handleGroupTip ignored notice:`,
          message
        );
    }
  }

  // 处理群组资料变更消息
  private handleGroupNotification(params: TTUIRoomConfig) {
    const notification = simpleClone(params);
    logger.log(
      `${TUIRoomCoordinator.logPrefix}handleGroupNotification message:`,
      notification
    );
    Object.keys(this.state.roomInfo.roomConfig).forEach((key) => {
      if (this.state.roomInfo.roomConfig[key] !== notification[key]) {
        switch (key) {
          case ETUIRoomCoordinatorConfig.isCallingRoll:
            this.emitter?.emit(
              notification[key]
                ? ETUIRoomEvents.onCallingRollStarted
                : ETUIRoomEvents.onCallingRollStopped,
              notification[key]
            );
            this.state.roomInfo.roomConfig[key] = notification[key];
            break;
          case ETUIRoomCoordinatorConfig.isAllMicMuted:
            logger.warn(
              `${TUIRoomCoordinator.logPrefix}.handleGroupProfileUpdate mute all`,
              notification[key]
            );
            this.state.roomInfo.roomConfig[key] = notification[key];
            if (this.state.currentUser.role !== ETUIRoomRole.MASTER) {
              this.emitter?.emit(
                ETUIRoomEvents.onMicrophoneMuted,
                notification[key]
              );
            }
            break;
          default:
            logger.warn(
              `${TUIRoomCoordinator.logPrefix}handleGroupNotification ignored notice:`,
              `${key}: ${notification[key]}`
            );
            break;
        }
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
    this.tSignalingService.on(
      ETUIRoomEvents.onUserReplyCallingRoll,
      this.onUserReplyCallingRoll,
      this
    );
    this.tSignalingService.on(
      ETUIRoomEvents.onReceiveSpeechInvitation,
      this.onReceiveSpeechInvitation,
      this
    );
    this.tSignalingService.on(
      ETUIRoomEvents.onReceiveInvitationCancelled,
      this.onReceiveInvitationCancelled,
      this
    );
    this.tSignalingService.on(
      ETUIRoomEvents.onReceiveInvitationTimeout,
      this.onReceiveInvitationTimeout,
      this
    );
    this.tSignalingService.on(
      ETUIRoomEvents.onReceiveSpeechApplication,
      this.onReceiveSpeechApplication,
      this
    );
    this.tSignalingService.on(
      ETUIRoomEvents.onSpeechApplicationCancelled,
      this.onSpeechApplicationCancelled,
      this
    );
    this.tSignalingService.on(
      ETUIRoomEvents.onSpeechApplicationTimeout,
      this.onSpeechApplicationTimeout,
      this
    );
    this.tSignalingService.on(
      ETUIRoomEvents.onMicrophoneMuted,
      this.onMicrophoneMuted,
      this
    );
  }

  // 解除事件绑定
  private unbindTSignalingEvent() {
    this.tSignalingService.off(
      ETUIRoomEvents.onUserReplyCallingRoll,
      this.onUserReplyCallingRoll,
      this
    );
    this.tSignalingService.off(
      ETUIRoomEvents.onReceiveSpeechInvitation,
      this.onReceiveSpeechInvitation,
      this
    );
    this.tSignalingService.off(
      ETUIRoomEvents.onReceiveInvitationCancelled,
      this.onReceiveInvitationCancelled,
      this
    );
    this.tSignalingService.off(
      ETUIRoomEvents.onReceiveInvitationTimeout,
      this.onReceiveInvitationTimeout,
      this
    );
    this.tSignalingService.off(
      ETUIRoomEvents.onReceiveSpeechApplication,
      this.onReceiveSpeechApplication,
      this
    );
    this.tSignalingService.off(
      ETUIRoomEvents.onSpeechApplicationCancelled,
      this.onSpeechApplicationCancelled,
      this
    );
    this.tSignalingService.off(
      ETUIRoomEvents.onSpeechApplicationTimeout,
      this.onSpeechApplicationTimeout,
      this
    );
    this.tSignalingService.off(
      ETUIRoomEvents.onMicrophoneMuted,
      this.onMicrophoneMuted,
      this
    );
  }

  // 学生签到
  private async onUserReplyCallingRoll(event: TTUIRoomTSBase) {
    const {
      eventCode,
      data: { inviterId, type },
    } = event;
    logger.log(
      `${TUIRoomCoordinator.logPrefix}onUserReplyCallingRoll event:`,
      eventCode,
      inviterId,
      type
    );
    const message = {
      cmd: ETUIRoomCoordinatorCommand.ReplyCallingRoll,
      room_id: this.roomId,
      sender_id: this.state.currentUser.userId,
    };
    await this.tSignalingService.accept(inviterId, message);
    this.emitter?.emit(ETUIRoomEvents.onUserReplyCallingRoll, { inviterId });
  }

  // 邀请上台发言
  private async onReceiveSpeechInvitation(event: TTUIRoomTSBase) {
    const {
      eventCode,
      data: { inviterId, type },
    } = event;
    logger.log(
      `${TUIRoomCoordinator.logPrefix}onReceiveSpeechInvitation event:`,
      eventCode,
      inviterId,
      type
    );
    this.emitter?.emit(ETUIRoomEvents.onReceiveSpeechInvitation, inviterId);
  }

  // 取消邀请上台发言
  private async onReceiveInvitationCancelled(event: TTUIRoomTSBase) {
    const {
      eventCode,
      data: { inviterId, type },
    } = event;
    logger.log(
      `${TUIRoomCoordinator.logPrefix}onReceiveInvitationCancelled event:`,
      eventCode,
      inviterId,
      type
    );
    this.emitter?.emit(ETUIRoomEvents.onReceiveInvitationCancelled, inviterId);
  }

  private async onReceiveInvitationTimeout(event: TTUIRoomTSBase) {
    const {
      eventCode,
      data: { inviterId, type },
    } = event;
    logger.log(
      `${TUIRoomCoordinator.logPrefix}onReceiveInvitationTimeout event:`,
      eventCode,
      inviterId,
      type
    );
    this.emitter?.emit(ETUIRoomEvents.onReceiveInvitationTimeout, inviterId);
  }

  async onReceiveSpeechApplication(event: TTUIRoomTSBase) {
    const {
      eventCode,
      data: { inviterId, type },
    } = event;
    logger.log(
      `${TUIRoomCoordinator.logPrefix}onReceiveSpeechApplication event:`,
      eventCode,
      type,
      inviterId
    );
    this.emitter?.emit(ETUIRoomEvents.onReceiveSpeechApplication, inviterId);
  }

  async onSpeechApplicationCancelled(event: TTUIRoomTSBase) {
    const {
      eventCode,
      data: { inviterId, type },
    } = event;
    logger.log(
      `${TUIRoomCoordinator.logPrefix}onSpeechApplicationCancelled event:`,
      eventCode,
      type,
      inviterId
    );
    this.emitter?.emit(ETUIRoomEvents.onSpeechApplicationCancelled, inviterId);
  }

  async onSpeechApplicationTimeout(event: TTUIRoomTSBase) {
    const {
      eventCode,
      data: { inviterId, type },
    } = event;
    logger.log(
      `${TUIRoomCoordinator.logPrefix}onSpeechApplicationTimeout event:`,
      eventCode,
      inviterId,
      type
    );
    this.emitter?.emit(ETUIRoomEvents.onSpeechApplicationTimeout, inviterId);
  }

  private async onMicrophoneMuted(event: any) {
    const { eventCode, data } = event;
    logger.log(
      `${TUIRoomCoordinator.logPrefix}onMicrophoneMuted event:`,
      eventCode,
      data
    );
    const { mute, inviterId } = data;
    const message = {
      cmd: ETUIRoomCoordinatorCommand.MuteUserMicrophone,
      room_id: this.roomId,
      receiver_id: this.state.currentUser.userId,
      mute,
    };
    this.emitter?.emit(ETUIRoomEvents.onMicrophoneMuted, mute);
    await this.tSignalingService.accept(inviterId, message);
  }

  /**
   * 注册事件监听
   */
  on(
    eventName: string,
    handler: (...args: any) => void,
    ctx?: Record<string, any>
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
    this.groupId = '';
    this.roomId = 0;
    this.state = null;
    this.tim = null;
    this.emitter = null;
    this.tSignalingService = null;
    this.unbindTSignalingEvent();
    this.unbindTIMEvent();
  }
}

export default TUIRoomCoordinator;
