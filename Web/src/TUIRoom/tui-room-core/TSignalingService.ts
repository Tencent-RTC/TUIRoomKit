import TSignaling from 'tsignaling/tsignaling-js';
import TIM from 'tim-js-sdk';
import logger from './common/logger';
import TUIRoomResponse from './base/TUIRoomResponse';
import TUIRoomError from './base/TUIRoomError';
import { TUIRoomErrorCode, TUIRoomErrorMessage } from './constant';
import {
  TTUIInvitationReceivedParams,
  TTUIInviteeAcceptedParams,
  TTUIInvitationCancelledParams,
  TTUIInviteeRejectedParams,
  TTUIInvitationTimeoutParams,
  TTUIMethodDataParams,
  ETUISignalStatus,
  ETUIRoomCoordinatorCommand,
  TTUIInviteInfo,
  ETUIRoomEvents,
} from './types.d';
import Emitter from './common/emitter/event';
import { safelyParseJSON } from './utils/utils';

class TSignalingService {
  private static logPrefix = '[TSignalingService]';

  private sdkAppId = 0;

  private userId = '';

  private userSig = '';

  private isSdkReady = false;

  private isLogin = false;

  private tim: any;

  private tsignaling: any;

  private emitter: Emitter | null;

  private loginResolveRejectCache: Array<{
    resolve: (value: TUIRoomResponse<any>) => void;
    reject: (reason?: any) => void;
  }>;

  private inviteInfoMap: Map<string, TTUIInviteInfo>;

  constructor() {
    this.loginResolveRejectCache = [];
    this.onTIMReadyStateUpdate = this.onTIMReadyStateUpdate.bind(this);
    this.emitter = new Emitter();
    this.inviteInfoMap = new Map();
  }

  public init(options: {
    sdkAppId: number;
    userId: string;
    userSig: string;
    tim: any;
  }) {
    const { sdkAppId, userId, userSig, tim } = options;

    this.sdkAppId = sdkAppId;
    this.userId = userId;
    this.userSig = userSig;
    this.tim = tim;
    this.tsignaling = new TSignaling({
      SDKAppID: sdkAppId,
      tim,
    });
    this.bindTSignalingEvent();
    this.bindTIMEvent();
  }

  // 获取 inviteInfoMap 的key
  private getInviteInfoMapKey(userId: string, cmd: string) {
    logger.debug(`${TSignalingService.logPrefix}getInviteInfoMapKey: ${this}`);
    return `${userId}-${cmd}`;
  }

  // 获取信令公共体
  private setTSignalingData(data: Record<string, any>) {
    logger.debug(`${TSignalingService.logPrefix}setTSignalingData: ${this}`);
    return JSON.stringify({
      version: 1,
      businessID: 'TUIRoom',
      platform: 'Electron',
      data,
    });
  }

  /**
   * 通过 TSignaling 登录 TIM
   * @param options
   */
  public async login(
    userId: string,
    userSig: string
  ): Promise<TUIRoomResponse<any>> {
    logger.debug(
      `${TSignalingService.logPrefix}login userId: ${userId} userSig: ${userSig}`
    );

    await this.loginTSignaling(userId, userSig);
    this.isLogin = true;
    return TUIRoomResponse.success();
  }

  private loginTSignaling(
    userId: string,
    userSig: string
  ): Promise<TUIRoomResponse<any>> {
    return new Promise((resolve, reject) => {
      this.tsignaling
        .login({
          userID: userId,
          userSig,
        })
        .then((imResponse: any) => {
          logger.debug(
            `${TSignalingService.logPrefix}login cache resolve/reject`,
            imResponse
          );
          // // 如果已经登录，直接返回 true
          // if (imResponse.data.repeatLogin) {
          //   resolve(TUIRoomResponse.success());
          //   return null;
          // }
          this.loginResolveRejectCache.push({
            resolve,
            reject,
          });
          return null;
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  }

  public async logout(): Promise<TUIRoomResponse<any>> {
    try {
      const imResponse: {
        code: number;
        data: any;
      } = await this.tim.logout();
      if (imResponse.code === 0) {
        logger.debug(`${TSignalingService.logPrefix}logout success`);
        this.isLogin = false;
        return TUIRoomResponse.success(imResponse.data);
      }
      logger.error(`${TSignalingService.logPrefix}.logout error:`, imResponse);
      throw TUIRoomError.error(
        TUIRoomErrorCode.LOGOUT_ERROR,
        JSON.stringify(imResponse.data) || TUIRoomErrorMessage.LOGOUT_ERROR
      );
    } catch (imError: any) {
      logger.warn(`${TSignalingService.logPrefix}logout error:`, imError);
      throw new TUIRoomError(TUIRoomErrorCode.TIM_ERROR, imError.message);
    }
  }

  // 发送信令
  public async invite(
    userId: string,
    data: TTUIMethodDataParams,
    timeout?: number
  ): Promise<TUIRoomResponse<any>> {
    const key = this.getInviteInfoMapKey(userId, data?.cmd);
    if (this.inviteInfoMap?.has(key)) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TS_INVITE_ERROR,
        TUIRoomErrorMessage.TS_INVITE_ERROR
      );
    }
    return new Promise((resolve, reject) => {
      this.tsignaling
        .invite({
          userID: userId,
          data: this.setTSignalingData(data),
          timeout,
        })
        .then((tsResponse: Record<string, any>) => {
          logger.log(
            `${TSignalingService.logPrefix}invite cache resolve/reject: ${JSON.stringify(tsResponse)}`
          );
          const value: TTUIInviteInfo = {
            type: data?.cmd,
            inviteId: tsResponse.inviteID,
            resolve,
            reject,
          };
          this.inviteInfoMap.set(key, value);
          return null;
        })
        .catch((tsError: any) => {
          reject(tsError);
        });
    });
  }

  // 接受信令
  public async accept(
    userId: string,
    data: TTUIMethodDataParams
  ): Promise<TUIRoomResponse<any>> {
    const key = this.getInviteInfoMapKey(userId, data?.cmd);
    if (!this.inviteInfoMap?.has(key)) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TS_CMD_ERROR,
        TUIRoomErrorMessage.TS_CMD_ERROR
      );
    }
    try {
      logger.log(
        `${TSignalingService.logPrefix}accept`,
        key,
        this.inviteInfoMap?.get(key)
      );
      const inviteId = this.inviteInfoMap?.get(key)?.inviteId;
      const tsResponse = await this.tsignaling.accept({
        inviteID: inviteId,
        data: this.setTSignalingData(data),
      });
      this.inviteInfoMap?.delete(key);
      return TUIRoomResponse.success(tsResponse);
    } catch (tsError: any) {
      throw new TUIRoomError(TUIRoomErrorCode.TIM_ERROR, tsError.message);
    }
  }

  // 取消信令
  public async cancel(
    userId: string,
    data: TTUIMethodDataParams
  ): Promise<TUIRoomResponse<any>> {
    const key = this.getInviteInfoMapKey(userId, data?.cmd);
    if (!this.inviteInfoMap?.has(key)) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TS_CMD_ERROR,
        TUIRoomErrorMessage.TS_CMD_ERROR
      );
    }
    try {
      logger.log(
        `${TSignalingService.logPrefix}cancel`,
        key,
        this.inviteInfoMap?.get(key)
      );
      const inviteId = this.inviteInfoMap?.get(key)?.inviteId;
      const tsResponse = await this.tsignaling.cancel({
        inviteId,
        data: this.setTSignalingData(data),
      });
      const tsData = {
        code: ETUISignalStatus.CANCELLED,
        data: {
          inviteId,
          inviterId: userId,
        },
      };
      this.inviteInfoMap?.get(key)?.resolve(tsData);
      this.inviteInfoMap?.delete(key);
      return TUIRoomResponse.success(tsResponse);
    } catch (tsError: any) {
      throw new TUIRoomError(TUIRoomErrorCode.TIM_ERROR, tsError.message);
    }
  }

  // 拒绝信令
  public async reject(
    userId: string,
    data: TTUIMethodDataParams
  ): Promise<TUIRoomResponse<any>> {
    const key = this.getInviteInfoMapKey(userId, data?.cmd);
    if (!this.inviteInfoMap?.has(key)) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TS_CMD_ERROR,
        TUIRoomErrorMessage.TS_CMD_ERROR
      );
    }
    try {
      logger.log(
        `${TSignalingService.logPrefix}reject`,
        key,
        this.inviteInfoMap?.get(key)
      );
      const inviteId = this.inviteInfoMap?.get(key)?.inviteId;
      const tsResponse = await this.tsignaling.reject({
        inviteId,
        data: this.setTSignalingData(data),
      });
      this.inviteInfoMap?.delete(key);
      return TUIRoomResponse.success(tsResponse);
    } catch (tsError: any) {
      throw new TUIRoomError(TUIRoomErrorCode.TIM_ERROR, tsError.message);
    }
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   TIM 事件处理
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  // TIM 事件绑定
  private bindTIMEvent() {
    this.tim.on(TIM.EVENT.SDK_READY, this.onTIMReadyStateUpdate);
    this.tim.on(TIM.EVENT.SDK_NOT_READY, this.onTIMReadyStateUpdate);
  }

  // 解除 TIM 事件绑定
  private unbindTIMEvent() {
    this.tim.off(TIM.EVENT.SDK_READY, this.onTIMReadyStateUpdate);
    this.tim.off(TIM.EVENT.SDK_NOT_READY, this.onTIMReadyStateUpdate);
  }

  // 处理 SDK Ready 事件
  private onTIMReadyStateUpdate(event: Record<string, any>) {
    logger.debug(
      `${TSignalingService.logPrefix}onTIMReadyStateUpdate event:`,
      event,
      this.loginResolveRejectCache
    );
    const isSDKReady = event.name === TIM.EVENT.SDK_READY;
    if (isSDKReady) {
      this.isSdkReady = true;
      this.loginResolveRejectCache.forEach(({ resolve }) => {
        resolve(TUIRoomResponse.success());
      });
    } else {
      this.isSdkReady = false;
      this.loginResolveRejectCache.forEach(({ reject }) => {
        reject(
          TUIRoomError.error(
            TUIRoomErrorCode.LOGIN_ERROR,
            JSON.stringify(event)
          )
        );
      });

      // 退出登录后，注销绑定的事件处理函数
      this.unbindTIMEvent();
    }
    this.loginResolveRejectCache = [];
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   TSignaling 事件处理
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  // TSignaling 事件绑定
  private bindTSignalingEvent() {
    // 收到新的邀请
    this.tsignaling.on(
      TSignaling.EVENT.NEW_INVITATION_RECEIVED,
      this.onNewInvitationReceived,
      this
    );
    // 被邀请人接受了邀请
    this.tsignaling.on(
      TSignaling.EVENT.INVITEE_ACCEPTED,
      this.onInviteeAccepted,
      this
    );
    // 被邀请人拒绝了邀请
    this.tsignaling.on(
      TSignaling.EVENT.INVITEE_REJECTED,
      this.onInviteeRejected,
      this
    );
    // 邀请被取消
    this.tsignaling.on(
      TSignaling.EVENT.INVITATION_CANCELLED,
      this.onInvitationCancelled,
      this
    );
    // 邀请超时
    this.tsignaling.on(
      TSignaling.EVENT.INVITATION_TIMEOUT,
      this.onInvitationTimeout,
      this
    );
  }

  // 解除 TSignaling 事件绑定
  private unbindTSignalingEvent() {
    // 收到新的邀请
    this.tsignaling.off(
      TSignaling.EVENT.NEW_INVITATION_RECEIVED,
      this.onNewInvitationReceived,
      this
    );
    // 被邀请人接受了邀请
    this.tsignaling.off(
      TSignaling.EVENT.INVITEE_ACCEPTED,
      this.onInviteeAccepted,
      this
    );
    // 被邀请人拒绝了邀请
    this.tsignaling.off(
      TSignaling.EVENT.INVITEE_REJECTED,
      this.onInviteeRejected,
      this
    );
    // 邀请被取消
    this.tsignaling.off(
      TSignaling.EVENT.INVITATION_CANCELLED,
      this.onInvitationCancelled,
      this
    );
    // 邀请超时
    this.tsignaling.off(
      TSignaling.EVENT.INVITATION_TIMEOUT,
      this.onInvitationTimeout,
      this
    );
  }

  // 信令---新的邀请
  private onNewInvitationReceived(event: TTUIInvitationReceivedParams) {
    logger.debug(`${TSignalingService.logPrefix}onNewInvitationReceived: ${JSON.stringify(event)}`);
    const {
      data: {
        inviteID,
        data,
        inviter
      }
    } = event;
    const inviteData = safelyParseJSON(data);
    const key = this.getInviteInfoMapKey(inviter, inviteData?.data?.cmd);
    const value = {
      type: inviteData?.data?.cmd,
      inviteId: inviteID,
      resolve: () => {},
      reject: () => {},
    };
    switch (inviteData?.data?.cmd) {
      case ETUIRoomCoordinatorCommand.ReplyCallingRoll:
        this.inviteInfoMap.set(key, value);
        this.emitter?.emit(ETUIRoomEvents.onUserReplyCallingRoll, {
          inviterId: inviter,
          type: inviteData?.data?.cmd,
        });
        break;
      case ETUIRoomCoordinatorCommand.SendSpeechInvitation:
        this.inviteInfoMap.set(key, value);
        this.emitter?.emit(ETUIRoomEvents.onReceiveSpeechInvitation, {
          inviterId: inviter,
          type: inviteData?.data?.cmd,
        });
        break;
      case ETUIRoomCoordinatorCommand.SendSpeechApplication:
        this.inviteInfoMap.set(key, value);
        this.emitter?.emit(ETUIRoomEvents.onReceiveSpeechApplication, {
          inviterId: inviter,
          type: inviteData?.data?.cmd,
        });
        break;
      case ETUIRoomCoordinatorCommand.MuteUserMicrophone:
        this.inviteInfoMap.set(key, value);
        this.emitter?.emit(ETUIRoomEvents.onMicrophoneMuted, {
          inviterId: inviter,
          type: inviteData?.data?.cmd,
          mute: inviteData?.data?.mute,
        });
        break;
      case ETUIRoomCoordinatorCommand.MuteUserCamera:
        this.inviteInfoMap.set(key, value);
        this.emitter?.emit(ETUIRoomEvents.onCameraMuted, {
          inviterId: inviter,
          type: inviteData?.data?.cmd,
          mute: inviteData?.data?.mute,
        });
        break;
      case ETUIRoomCoordinatorCommand.MuteUserChatRoom:
        this.inviteInfoMap.set(key, value);
        this.emitter?.emit(ETUIRoomEvents.onUserChatRoomMuted, {
          inviterId: inviter,
          type: inviteData?.data?.cmd,
          mute: inviteData?.data?.mute,
        });
        break;
      case ETUIRoomCoordinatorCommand.KickOffUser:
        this.inviteInfoMap.set(key, value);
        this.emitter?.emit(ETUIRoomEvents.onUserKickOff, {
          inviterId: inviter,
          type: inviteData?.data?.cmd,
        });
        break;
      default:
        logger.warn(
          `${TSignalingService.logPrefix}onNewInvitationReceived ignored cmd:`,
          inviteData
        );
        break;
    }
  }

  // 信令---对方已接受
  private onInviteeAccepted(event: TTUIInviteeAcceptedParams) {
    logger.warn(`${TSignalingService.logPrefix}onInviteeAccepted:`, JSON.stringify(event));
    const {
      data: { data, invitee },
    } = event;
    const acceptData = safelyParseJSON(data);
    const key = this.getInviteInfoMapKey(invitee, acceptData?.data?.cmd);
    let tsResponse = {};
    switch (acceptData?.data?.cmd) {
      case ETUIRoomCoordinatorCommand.ReplyCallingRoll:
      case ETUIRoomCoordinatorCommand.SendSpeechInvitation:
      case ETUIRoomCoordinatorCommand.SendSpeechApplication:
      case ETUIRoomCoordinatorCommand.MuteUserMicrophone:
      case ETUIRoomCoordinatorCommand.MuteUserCamera:
      case ETUIRoomCoordinatorCommand.MuteUserChatRoom:
      case ETUIRoomCoordinatorCommand.KickOffUser:
        tsResponse = {
          code: ETUISignalStatus.ACCEPTED,
          data: {
            inviterId: invitee,
          },
        };
        this.inviteInfoMap?.get(key)?.resolve(tsResponse);
        this.inviteInfoMap?.delete(key);
        break;
      default:
        logger.warn(
          `${TSignalingService.logPrefix}onInviteeAccepted ignored cmd:`,
          acceptData
        );
        break;
    }
  }

  // 信令---对方已拒绝
  private onInviteeRejected(event: TTUIInviteeRejectedParams) {
    logger.warn(`${TSignalingService.logPrefix}onInviteeRejected:`, this);
    const {
      data: { data, invitee },
    } = event;
    const rejectData = safelyParseJSON(data);
    const key = this.getInviteInfoMapKey(invitee, rejectData?.data?.cmd);
    let tsResponse = {};
    switch (rejectData?.data?.cmd) {
      case ETUIRoomCoordinatorCommand.SendSpeechInvitation:
      case ETUIRoomCoordinatorCommand.SendSpeechApplication:
        tsResponse = {
          code: ETUISignalStatus.REJECTED,
          data: {
            inviterId: invitee,
          },
        };
        this.inviteInfoMap?.get(key)?.resolve(tsResponse);
        this.inviteInfoMap?.delete(key);
        break;
      default:
        logger.warn(
          `${TSignalingService.logPrefix}onInviteeRejected ignored cmd:`,
          rejectData
        );
        break;
    }
  }

  // 信令---对方已取消
  private onInvitationCancelled(event: TTUIInvitationCancelledParams) {
    logger.warn(`${TSignalingService.logPrefix}onInvitationCancelled:`, this);
    const {
      data: { data, inviter },
    } = event;
    const cancelData = safelyParseJSON(data);
    const key = this.getInviteInfoMapKey(inviter, cancelData?.data?.cmd);
    switch (cancelData?.data?.cmd) {
      case ETUIRoomCoordinatorCommand.SendSpeechInvitation:
        this.emitter?.emit(ETUIRoomEvents.onReceiveInvitationCancelled, {
          inviterId: inviter,
          type: cancelData?.data?.cmd,
        });
        this.inviteInfoMap?.delete(key);
        break;
      default:
        logger.warn(
          `${TSignalingService.logPrefix}onInvitationCancelled ignored cmd:`,
          cancelData
        );
        break;
    }
  }

  // 信令---超时
  private onInvitationTimeout(event: TTUIInvitationTimeoutParams) {
    logger.warn(`${TSignalingService.logPrefix}onInvitationTimeout:`, event);
    const {
      data: { inviteId, inviteeList, isSelfTimeout, inviter },
    } = event;
    for (let i = 0; i < inviteeList.length; i += 1) {
      this.inviteInfoMap?.forEach((value, key) => {
        // Api 调用收到超时，promise 返回 resolve
        // code：TSignalingResponseCode.timeout
        // isSelfTimeout = false 表示发起信令方超时
        // 发送方
        if (value?.inviteId === inviteId && isSelfTimeout === false) {
          const tsResponse = {
            code: ETUISignalStatus.TIMEOUT,
            data: {
              inviterId: inviteeList[i],
            },
          };
          logger.warn(
            `${TSignalingService.logPrefix}inviteInfoMap:`,
            tsResponse
          );
          value?.resolve(tsResponse);
          this.inviteInfoMap?.delete(key);
        } else if (value?.inviteId === inviteId && isSelfTimeout) {
          // isSelfTimeout = true
          // 表示收到信令事件方，监听超时，返回超时事件
          // 接收方
          switch (value?.type) {
            case ETUIRoomCoordinatorCommand.SendSpeechInvitation:
              this.emitter?.emit(ETUIRoomEvents.onReceiveInvitationTimeout, {
                inviterId: inviter,
              });
              this.inviteInfoMap?.delete(key);
              break;
            case ETUIRoomCoordinatorCommand.SendSpeechApplication:
              this.emitter?.emit(ETUIRoomEvents.onSpeechApplicationTimeout, {
                inviterId: inviter,
              });
              this.inviteInfoMap?.delete(key);
              break;
            default:
              logger.warn(
                `${TSignalingService.logPrefix}onInvitationTimeout ignored:`,
                value
              );
              break;
          }
        }
      });
    }
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
    this.unbindTSignalingEvent();
    this.unbindTIMEvent();
    if (this.loginResolveRejectCache.length) {
      this.loginResolveRejectCache.forEach(({ reject }) => {
        reject(
          TUIRoomError.error(
            TUIRoomErrorCode.ROOM_BEEN_DESTROYED,
            TUIRoomErrorMessage.ROOM_BEEN_DESTROYED
          )
        );
      });
      this.loginResolveRejectCache = [];
    }
  }
}

export default TSignalingService;
