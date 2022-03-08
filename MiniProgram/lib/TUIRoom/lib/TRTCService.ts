import TRTCCloud from '../../../lib/trtc-wx';
import TUIRoomError from './base/TUIRoomError';
import TUIRoomResponse from './base/TUIRoomResponse';
import { TUIRoomErrorCode, TUIRoomErrorMessage } from './constant';

type TTRTCEnterRoomParams = {
  SDKAppID: number;
  roomID: number;
  userID: string;
  userSig: string;
  rtcConfig?: object;
};

type ResolveRejectRecord = {
  resolve: (data: any) => void;
  reject: (data: any) => void;
};

const METHOD_NAME = {
  ENTER_ROOM: 'enterRoom',
  EXIT_ROOM: 'exitRoom',
};

class TRTCService {
  static logPrefix = '[TRTCService]';

  private SDKAppID = 0;

  private roomID = 0;

  private userID = '';

  private userSig = '';

  private isInRoom = false;

  private rtcCloud: any | null;

  private ctx: any | null;

  private EVENT: any | null;

  private methodResolveRejectMap = new Map<string,
    Array<ResolveRejectRecord>>();

  constructor(ctx) {
    this.ctx = ctx;
    this.rtcCloud = new TRTCCloud(ctx);
    this.EVENT = this.rtcCloud.EVENT;
    this.onEnterRoom = this.onEnterRoom.bind(this);
    this.onExitRoom = this.onExitRoom.bind(this);
    this.bindEvent();
  }

  /**
   * 统一的事件处理函数
   *
   * TRTC 的主动同步接口封装成 Promise 返回，在 TRTC 相应事件发生后，
   * 调用对应的 resolve 和 reject 方法。这个内部方法，用来根据方法名，
   * 集中调用存储在 methodResolveRejectMap 中的 resolve 或 reject 方法。
   * @param methodName
   * @param result
   */
  private invokeEventCallbacks(
    methodName: string,
    result: {
      isSuccess: boolean;
      data?: any;
    },
  ) {
    if (this.methodResolveRejectMap.has(methodName)) {
      const list = this.methodResolveRejectMap.get(methodName);
      if (list && list.length) {
        list.forEach(({ resolve, reject }) => {
          if (result.isSuccess) {
            resolve(TUIRoomResponse.success(result.data || null));
          } else {
            reject(TUIRoomError.error(result.data.code, result.data.message));
          }
        });
        this.methodResolveRejectMap.delete(methodName);
      }
    }
  }

  // TRTC onEnterRoom 事件处理方法
  private onEnterRoom(result: number) {
    let responseData = null;
    if (result > 0) {
      responseData = {
        isSuccess: true,
        data: result,
      };
      this.isInRoom = true;
    } else {
      responseData = {
        isSuccess: false,
        data: {
          code: TUIRoomErrorCode.ENTER_ROOM_ERROR,
          message: TUIRoomErrorMessage.ENTER_ROOM_ERROR,
        },
      };
      this.isInRoom = false;
    }
    this.invokeEventCallbacks(METHOD_NAME.ENTER_ROOM, responseData);
  }

  // TRTC onExitRoom 事件处理方法
  private onExitRoom(reason: number) {
    this.invokeEventCallbacks(METHOD_NAME.EXIT_ROOM, {
      isSuccess: true,
    });
    this.isInRoom = false;
  }

  private bindEvent() {
    this.rtcCloud?.on(this.EVENT.LOCAL_JOIN, this.onEnterRoom);
    this.rtcCloud?.on(this.EVENT.LOCAL_LEAVE, this.onExitRoom);
  }

  private unbindEvent() {
    this.rtcCloud?.off(this.EVENT.LOCAL_JOIN, this.onEnterRoom);
    this.rtcCloud?.off(this.EVENT.LOCAL_LEAVE, this.onExitRoom);
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   进房、退房接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */

  public enterRoom(
    params: TTRTCEnterRoomParams,
    ctx: object,
  ): any {
    return this.innerRnterRoom(params, ctx);
  }

  private innerRnterRoom(params: TTRTCEnterRoomParams, ctx: object) {
    if (!this.rtcCloud) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TRTC_NOT_EXIST_ERROR,
        TUIRoomErrorMessage.TRTC_NOT_EXIST_ERROR,
      );
    }
    const { SDKAppID, roomID, userID, userSig, rtcConfig } = params;
    this.SDKAppID = SDKAppID;
    this.roomID = roomID;
    this.userID = userID;
    this.userSig = userSig;
    this.rtcCloud.ctx = ctx;
    this.rtcCloud.createPusher(rtcConfig);
    const pusher = this.rtcCloud.enterRoom({
      sdkAppID: SDKAppID, // 您的腾讯云账号
      userID: userID, //当前进房用户的userID
      userSig: userSig, // 您服务端生成的userSig
      roomID: roomID, // 您进房的房间号，
    });
    this.rtcCloud.getPusherInstance().start();
    return pusher;
  }

  public createPusher(rtcConfig: Record<string, any>) {
    return this.rtcCloud.createPusher(rtcConfig);
  }

  public getPlayerList() {
    return this.rtcCloud.getPlayerList();
  }


  public async exitRoom(): Promise<TUIRoomResponse<any>> {
    if (!this.isInRoom) {
      return TUIRoomResponse.success();
    }
    return new Promise((resolve, reject) => {
      const list = this.methodResolveRejectMap.get(METHOD_NAME.EXIT_ROOM) || [];
      list.push({
        resolve,
        reject,
      });
      this.methodResolveRejectMap.set(METHOD_NAME.EXIT_ROOM, list);

      this.innerExitRoom();
    });
  }

  private innerExitRoom() {
    if (!this.rtcCloud) {
      throw new TUIRoomError(
        TUIRoomErrorCode.TRTC_NOT_EXIST_ERROR,
        TUIRoomErrorMessage.TRTC_NOT_EXIST_ERROR,
      );
    }

    this.rtcCloud.stopLocalPreview();
    this.rtcCloud.stopLocalAudio();
    this.rtcCloud.stopScreenCapture();
    this.rtcCloud.exitRoom();
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   get/set类接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  setPusherAttributes(options: Record<string, any>): Array<Record<string, any>> {
    return this.rtcCloud.setPusherAttributes(options);
  }

  setPlayerAttributes(id: string, options: Record<string, any>): Array<Record<string, any>> {
    return this.rtcCloud.setPlayerAttributes(id, options);
  }


  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   音视频相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */


  switchCamera(options?: any) {
    this.rtcCloud.getPusherInstance().switchCamera(options);
  }


  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    事件回调注册接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  on(eventName: string, handler: (...args: any) => void, ctx: any) {
    this.rtcCloud?.on(eventName, handler, ctx);
  }

  off(eventName: string, handler: (...args: any) => void) {
    this.rtcCloud?.off(eventName, handler);
  }

  // live-pusher EventHandler
  pusherEventHandler(event) {
    this.rtcCloud.pusherEventHandler(event);
  }

  pusherNetStatusHandler(event) {
    this.rtcCloud.pusherNetStatusHandler(event);
  }

  pusherErrorHandler(event) {
    this.rtcCloud.pusherErrorHandler(event);
  }

  pusherBGMStartHandler(event) {
    this.rtcCloud.pusherBGMStartHandler(event);
  }

  pusherBGMProgressHandler(event) {
    this.rtcCloud.pusherBGMProgressHandler(event);
  }

  pusherBGMCompleteHandler(event) {
    this.rtcCloud.pusherBGMCompleteHandler(event);
  }

  pusherAudioVolumeNotify(event) {
    this.rtcCloud.pusherAudioVolumeNotify(event);
  }

  // live-player EventHandler

  playerEventHandler(event) {
    this.rtcCloud.playerEventHandler(event);
  }

  playerFullscreenChange(event) {
    this.rtcCloud.playerFullscreenChange(event);
  }

  playerNetStatus(event) {
    this.rtcCloud.playerNetStatus(event);
  }

  playerAudioVolumeNotify(event) {
    this.rtcCloud.playerAudioVolumeNotify(event);
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    其他接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */


  destroy() {
    this.unbindEvent();
    this.rtcCloud = null;
    this.SDKAppID = 0;
    this.userSig = '';
    this.userID = '';
    this.roomID = 0;
    this.isInRoom = false;
  }
}

export default TRTCService;
