import TSignaling from '../../../lib/tsignaling-wx';
import TIM from '../../../lib/tim-wx-sdk';
import TUIRoomResponse from './base/TUIRoomResponse';
import TUIRoomError from './base/TUIRoomError';
import {
  TUIRoomErrorCode,
  TUIRoomErrorMessage,
} from './constant';
import Event from './emitter/event';
import { safelyParseJSON } from './util';

import {
  TTUIInvitationReceivedParams,
  TTUIInviteeAcceptedParams,
  TTUIInvitationCancelledParams,
  TTUIInviteeRejectedParams,
  TTUIInvitationTimeoutParams,
  TTUIMethodDataParams,
  TUISignalStatus,
  TUIRoomCoordinatorCommand,
  TTUIInviteInfo,
  TUIRoomEvents,
} from './types';

class TSignalingService {
  private static logPrefix = '[TSignalingService]';

  private SDKAppID = 0;

  private userID = '';

  private userSig = '';

  private isSdkReady = false;

  private isLogin = false;

  private tim: any;

  private tsignaling: any;
  private emitter: Event | null;

  private loginResolveRejectCache: Array<{
    resolve: (value: TUIRoomResponse<any>) => void;
    reject: (reason ?: any) => void;
  }>;
  private inviteInfoMap: Map<string, TTUIInviteInfo>;

  constructor() {
    this.loginResolveRejectCache = [];
    this.onTIMReadyStateUpdate = this.onTIMReadyStateUpdate.bind(this);
    this.emitter = new Event();
    this.inviteInfoMap = new Map();
  }

  public init(options: {
    SDKAppID: number;
    userID: string;
    userSig: string;
    tim: any;
  }) {
    const {
      SDKAppID,
      userID,
      userSig,
      tim,
    } = options;

    this.SDKAppID = SDKAppID;
    this.userID = userID;
    this.userSig = userSig;
    this.tim = tim;
    this.tsignaling = new TSignaling({
      SDKAppID,
      tim,
    });
    this.bindTSignalingEvent();
    this.bindTIMEvent();

  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   信令相关
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */

  // 获取 inviteInfoMap 的key
  private getInviteInfoMapKey(userID: string, cmd: string) {
    return `${userID}-${cmd}`;
  }

  // 获取信令公共体
  private setTSignalingData(data: Record<string, any>) {
    return JSON.stringify({
      version: 1,
      businessID: 'TUIRoom',
      platform: 'miniprogram',
      data,
    });
  }

  // 发送信令
  public async invite(
    userID: string,
    data: TTUIMethodDataParams,
    timeout?: number,
  ): Promise<TUIRoomResponse<any>> {
    return new Promise((resolve, reject) => {
      const key = this.getInviteInfoMapKey(userID, data?.cmd);
      if (this.inviteInfoMap?.has(key)) {
        let tsResponse = {
          code: TUIRoomErrorCode.TS_INVITE_ERROR,
          message: TUIRoomErrorMessage.TS_INVITE_ERROR,
          data: {
            inviterID: userID,
          },
        };
        resolve(tsResponse);
        return null;
      }
      this.tsignaling
        .invite({
          userID,
          data: this.setTSignalingData(data),
          timeout,
        })
        .then((tsResponse: Record<string, any>) => {
          const value: TTUIInviteInfo = {
            type: data?.cmd,
            inviteID: tsResponse.inviteID,
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
    userID: string,
    data: TTUIMethodDataParams,
  ): Promise<TUIRoomResponse<any>> {
    const key = this.getInviteInfoMapKey(userID, data?.cmd);
    if (!this.inviteInfoMap?.has(key)) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TS_CMD_ERROR,
        TUIRoomErrorMessage.TS_CMD_ERROR,
      );
    }
    try {
      const inviteID = this.inviteInfoMap?.get(key)?.inviteID;
      const tsResponse = await this.tsignaling.accept({
        inviteID,
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
    userID: string,
    data: TTUIMethodDataParams,
  ): Promise<TUIRoomResponse<any>> {
    const key = this.getInviteInfoMapKey(userID, data?.cmd);
    if (!this.inviteInfoMap?.has(key)) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TS_CMD_ERROR,
        TUIRoomErrorMessage.TS_CMD_ERROR,
      );
    }
    try {
      const inviteID = this.inviteInfoMap?.get(key)?.inviteID;
      const tsResponse = await this.tsignaling.cancel({
        inviteID,
        data: this.setTSignalingData(data),
      });
      const tsData = {
        code: TUISignalStatus.CANCELLED,
        data: {
          inviteID,
          inviterID: userID,
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
    userID: string,
    data: TTUIMethodDataParams,
  ): Promise<TUIRoomResponse<any>> {
    const key = this.getInviteInfoMapKey(userID, data?.cmd);
    if (!this.inviteInfoMap?.has(key)) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TS_CMD_ERROR,
        TUIRoomErrorMessage.TS_CMD_ERROR,
      );
    }
    try {
      const inviteID = this.inviteInfoMap?.get(key)?.inviteID;
      const tsResponse = await this.tsignaling.reject({
        inviteID,
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
      this,
    );
    // 被邀请人接受了邀请
    this.tsignaling.on(
      TSignaling.EVENT.INVITEE_ACCEPTED,
      this.onInviteeAccepted,
      this,
    );
    // 被邀请人拒绝了邀请
    this.tsignaling.on(
      TSignaling.EVENT.INVITEE_REJECTED,
      this.onInviteeRejected,
      this,
    );
    // 邀请被取消
    this.tsignaling.on(
      TSignaling.EVENT.INVITATION_CANCELLED,
      this.onInvitationCancelled,
      this,
    );
    // 邀请超时
    this.tsignaling.on(
      TSignaling.EVENT.INVITATION_TIMEOUT,
      this.onInvitationTimeout,
      this,
    );
  }

  // 解除 TSignaling 事件绑定
  private unbindTSignalingEvent() {
    // 收到新的邀请
    this.tsignaling.off(
      TSignaling.EVENT.NEW_INVITATION_RECEIVED,
      this.onNewInvitationReceived,
      this,
    );
    // 被邀请人接受了邀请
    this.tsignaling.off(
      TSignaling.EVENT.INVITEE_ACCEPTED,
      this.onInviteeAccepted,
      this,
    );
    // 被邀请人拒绝了邀请
    this.tsignaling.off(
      TSignaling.EVENT.INVITEE_REJECTED,
      this.onInviteeRejected,
      this,
    );
    // 邀请被取消
    this.tsignaling.off(
      TSignaling.EVENT.INVITATION_CANCELLED,
      this.onInvitationCancelled,
      this,
    );
    // 邀请超时
    this.tsignaling.off(
      TSignaling.EVENT.INVITATION_TIMEOUT,
      this.onInvitationTimeout,
      this,
    );
  }

  // 信令---新的邀请
  private onNewInvitationReceived(event: TTUIInvitationReceivedParams) {
    const {
      data: { inviteID, data, inviter },
    } = event;
    const inviteData = safelyParseJSON(data);
    const key = this.getInviteInfoMapKey(inviter, inviteData?.data?.cmd);
    const value = {
      type: inviteData?.data?.cmd,
      inviteID,
      resolve: () => {
      },
      reject: () => {
      },
    };
    switch (inviteData?.data?.cmd) {
      case TUIRoomCoordinatorCommand.MuteUserMicrophone:
        this.inviteInfoMap.set(key, value);
        this.emitter?.emit(TUIRoomEvents.onMicrophoneMuted, {
          inviterID: inviter,
          type: inviteData?.data?.cmd,
          mute: inviteData?.data?.mute,
        });
        break;
      case TUIRoomCoordinatorCommand.MuteUserCamera:
        this.inviteInfoMap.set(key, value);
        this.emitter?.emit(TUIRoomEvents.onCameraMuted, {
          inviterID: inviter,
          type: inviteData?.data?.cmd,
          mute: inviteData?.data?.mute,
        });
        break;
      case TUIRoomCoordinatorCommand.KickOffUser:
        this.inviteInfoMap.set(key, value);
        this.emitter?.emit(TUIRoomEvents.onKickOff, {
          inviterID: inviter,
          type: inviteData?.data?.cmd,
          mute: inviteData?.data?.mute,
        });
        break;
      default:
        break;
    }
  }

  // 信令---对方已接受
  private onInviteeAccepted(event: TTUIInviteeAcceptedParams) {
    const {
      data: { data, invitee },
    } = event;
    const acceptData = safelyParseJSON(data);
    const key = this.getInviteInfoMapKey(invitee, acceptData?.data?.cmd);
    let tsResponse = {};
    switch (acceptData?.data?.cmd) {
      case TUIRoomCoordinatorCommand.MuteUserMicrophone:
      case TUIRoomCoordinatorCommand.MuteUserCamera:
      case TUIRoomCoordinatorCommand.KickOffUser:
        tsResponse = {
          code: TUISignalStatus.ACCEPTED,
          data: {
            inviterID: invitee,
          },
        };
        this.inviteInfoMap?.get(key)?.resolve(tsResponse);
        this.inviteInfoMap?.delete(key);
        break;
      default:
        break;
    }
  }

  // 信令---对方已拒绝
  private onInviteeRejected(event: TTUIInviteeRejectedParams) {
    const {
      data: { data, invitee },
    } = event;
    const rejectData = safelyParseJSON(data);
    const key = this.getInviteInfoMapKey(invitee, rejectData?.data?.cmd);
    let tsResponse = {};
    switch (rejectData?.data?.cmd) {
      default:
        break;
    }
  }

  // 信令---对方已取消
  private onInvitationCancelled(event: TTUIInvitationCancelledParams) {
    const {
      data: { data, inviter },
    } = event;
    const cancelData = safelyParseJSON(data);
    const key = this.getInviteInfoMapKey(inviter, cancelData?.data?.cmd);
    switch (cancelData?.data?.cmd) {
      default:
        break;
    }
  }

  // 信令---超时
  private onInvitationTimeout(event: TTUIInvitationTimeoutParams) {
    const {
      data: { inviteID, inviteeList, isSelfTimeout, inviter },
    } = event;
    for (let i = 0; i < inviteeList.length; i += 1) {
      this.inviteInfoMap?.forEach((value, key) => {
        // Api 调用收到超时，premise 返回 resolve
        // code：TSignalingResponseCode.timeout
        // isSelfTimeout = false 表示发起信令方超时
        // 发送方
        if (value?.inviteID === inviteID && !isSelfTimeout) {
          const tsResponse = {
            code: TUISignalStatus.TIMEOUT,
            data: {
              inviterID: inviteeList[i],
            },
          };
          value.resolve(tsResponse);
          this.inviteInfoMap?.delete(key);
        } else if (value?.inviteID === inviteID && isSelfTimeout) {
          // isSelfTimeout = true
          // 表示收到信令事件方，监听超时，返回超时事件
          // 接收方
          switch (value?.type) {
            default:
              break;
          }
        }
      });
    }
  }

  /**
   * 通过 TSignaling 登录 TIM
   * @param options
   */
  public async login(
    userID: string,
    userSig: string,
  ): Promise<TUIRoomResponse<any>> {

    await this.loginTSignaling(userID, userSig);
    this.isLogin = true;
    return TUIRoomResponse.success();
  }

  private loginTSignaling(
    userID: string,
    userSig: string,
  ): Promise<TUIRoomResponse<any>> {
    return new Promise((resolve, reject) => {
      this.tsignaling
        .login({
          userID,
          userSig,
        })
        .then((res) => {
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
        this.isLogin = false;
        return TUIRoomResponse.success(imResponse.data);
      }
      throw TUIRoomError.error(
        TUIRoomErrorCode.LOGOUT_ERROR,
        JSON.stringify(imResponse.data) || TUIRoomErrorMessage.LOGOUT_ERROR,
      );
    } catch (imError: any) {
      throw new TUIRoomError(TUIRoomErrorCode.TIM_ERROR, imError.message);
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
    const isSDKReady = event.name === TIM.EVENT.SDK_READY;
    if (isSDKReady) {
      this.isSdkReady = true;
      this.loginResolveRejectCache.forEach(({
                                              resolve,
                                            }) => {
        resolve(TUIRoomResponse.success());
      });
    } else {
      this.isSdkReady = false;
      this.loginResolveRejectCache.forEach(({
                                              reject,
                                            }) => {
        reject(
          TUIRoomError.error(
            TUIRoomErrorCode.LOGIN_ERROR,
            JSON.stringify(event),
          ),
        );
      });

      // 退出登录后，注销绑定的事件处理函数
      this.unbindTIMEvent();
    }
    this.loginResolveRejectCache = [];
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
    this.unbindTIMEvent();
    if (this.loginResolveRejectCache.length) {
      this.loginResolveRejectCache.forEach(({ reject }) => {
        reject(
          TUIRoomError.error(
            TUIRoomErrorCode.ROOM_BEEN_DESTROYED,
            TUIRoomErrorMessage.ROOM_BEEN_DESTROYED,
          ),
        );
      });
      this.loginResolveRejectCache = [];
    }
  }
}

export default TSignalingService;