import useRoomEngine from '../../hooks/useRoomEngine';
import {
  TUIRoomType,
  TUIEnterRoomOptions,
  TRTCVideoEncParam,
  TRTCVideoResolution,
  TUIRoomInfo,
  TUIMediaDevice,
  TUISeatMode,
  TUIRole,
} from '@tencentcloud/tuiroom-engine-js';
import { isMobile, isWeChat } from '../../utils/environment';
import RoomEventManager from './roomEventManager';
import UserEventManager from './userEventManger';
import RequestEventManager from './requestEventManger';
import { RoomState } from '../type';

const roomEngine = useRoomEngine();
// RoomManger 里面不做状态的 set（这个待定），只处理业务逻辑过程中的兼容逻辑和错误处理，
// 不处理其他模块的特定逻辑，其他模块的逻辑监听房间状态变化来处理
export default class RoomManager {
  static instance: RoomManager;
  private store: any;
  constructor(options: { store: any }) {
    if (!RoomManager.instance) {
      RoomManager.instance = this;
      this.store = options.store;
      new RoomEventManager(options);
      new UserEventManager(options);
      new RequestEventManager(options);
    }
    return RoomManager.instance;
  }

  async createRoom(params: {
    roomId: string;
    roomName?: string;
    roomType?: TUIRoomType;
    isSeatEnabled?: boolean;
    seatMode?: TUISeatMode;
    isMicrophoneDisableForAllUser?: boolean;
    isScreenShareDisableForAllUser?: boolean;
    isCameraDisableForAllUser?: boolean;
    isMessageDisableForAllUser?: boolean;
    maxSeatCount?: number;
    password?: string;
  }) {
    try {
      this.store.setRoomState(RoomState.Loading);
      await roomEngine.instance?.createRoom(params);
      this.store.setRoomState(RoomState.Running);
    } catch (error) {
      // todo: 处理创建房间失败的情况
    }
  }

  async enterRoom(params: {
    roomId: string;
    roomType: TUIRoomType;
    options?: TUIEnterRoomOptions;
  }): Promise<TUIRoomInfo | undefined> {
    try {
      const roomInfo = await roomEngine.instance?.enterRoom(params);
      this.disableSmallVideoStreamForH5();
      return roomInfo;
    } catch (error) {
      // todo: 处理进房失败，需要密码的情况
      console.error('error');
      throw error;
    }

    // todo: 进房之后的状态变更之后，由 UserState 模块获取 userList 和 seatList 的信息
    // await this.getUserList();
    // if (roomInfo.isSeatEnabled) {
    //   await this.getSeatList();
    //   this.service.roomStore.isMaster &&
    //     (await this.service.roomEngine.instance?.takeSeat({
    //       seatIndex: -1,
    //       timeout: 0,
    //     }));
    // }
    // todo: 这里放到 chat 去做（Chat 这些要考虑到延迟加载）
    // await this.syncUserInfo(this.service.basicStore.userId);
    // todo: 放到各自模块去做(会议预定和会中邀请)
    // await this.fetchAttendeeList(roomId);
    // await this.getInvitationList(roomId);
  }

  // 兼容情况，H5 不开启小流逻辑
  private disableSmallVideoStreamForH5() {
    const isH5 = isMobile && !isWeChat;
    const smallParam = new TRTCVideoEncParam();
    smallParam.videoResolution =
      TRTCVideoResolution.TRTCVideoResolution_640_360;
    smallParam.videoFps = 10;
    smallParam.videoBitrate = 550;
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    trtcCloud?.enableSmallVideoStream(!isH5, smallParam);
  }

  public async leaveRoom() {
    await roomEngine.instance?.exitRoom();
    this.store.resetStore();
  }

  public async destroyRoom() {
    await roomEngine.instance?.destroyRoom();
    this.store.resetStore();
  }

  public async fetchRoomInfo() {
    const roomInfo = await roomEngine.instance?.fetchRoomInfo();
    roomInfo && this.store.setRoomInfo(roomInfo);
    return roomInfo;
  }

  public async updateRoomNameByAdmin(options: {
    roomName: string;
  }): Promise<void> {
    await roomEngine.instance?.updateRoomNameByAdmin(options);
    this.store.setRoomInfo({ roomName: options.roomName });
  }

  public async updateRoomSeatModeByAdmin(options: {
    seatMode: TUISeatMode;
  }): Promise<void> {
    await roomEngine.instance?.updateRoomSeatModeByAdmin(options);
    this.store.setRoomInfo({ seatMode: options.seatMode });
  }

  public async updateRoomPasswordByAdmin(options: {
    password: string;
  }): Promise<void> {
    await roomEngine.instance?.updateRoomPasswordByAdmin(options);
    this.store.setRoomInfo({ password: options.password });
  }

  public async disableDeviceForAllUserByAdmin(options: {
    device: TUIMediaDevice;
    isDisable: boolean;
  }): Promise<void> {
    await roomEngine.instance?.disableDeviceForAllUserByAdmin(options);
    const { device, isDisable } = options;
    switch (device) {
      case TUIMediaDevice.kCamera:
        this.store.setRoomInfo({
          isCameraDisableForAllUser: isDisable,
        });
        break;
      case TUIMediaDevice.kMicrophone:
        this.store.setRoomInfo({
          isMicrophoneDisableForAllUser: isDisable,
        });
        break;
      case TUIMediaDevice.kScreen:
        this.store.setRoomInfo({
          isScreenShareDisableForAllUser: isDisable,
        });
        break;
      default:
        break;
    }
  }

  public async disableSendingMessageForAllUser(options: {
    isDisable: boolean;
  }) {
    await roomEngine.instance?.disableSendingMessageForAllUser(options);
    this.store.setRoomInfo({
      isMessageDisableForAllUser: options.isDisable,
    });
  }

  public async changeUserRole(options: { userId: string; userRole: TUIRole }) {
    await roomEngine.instance?.changeUserRole(options);
    this.store.updateUserInfo(options);
  }

  public async closeRemoteDeviceByAdmin(options: {
    userId: string;
    device: TUIMediaDevice;
  }) {
    await roomEngine.instance?.closeRemoteDeviceByAdmin(options);
  }

  public async openRemoteDeviceByAdmin(options: {
    userId: string;
    device: TUIMediaDevice;
    timeout: number;
    requestCallback?: (callbackInfo: TUIRequestCallback) => void;
  }) {
    const { userId, device, timeout, requestCallback } = options;
    const request = await roomEngine.instance?.openRemoteDeviceByAdmin({
      userId,
      device,
      timeout,
      requestCallback: (callbackInfo: TUIRequestCallback) => {
        const currentUserInfo = this.store.getUserInfo({ userId });
        if (request?.requestId) {
          delete currentUserInfo.receivedRequestObj[request?.requestId];
        }
        requestCallback && requestCallback(callbackInfo);
      },
    });
    if (request && request.requestId) {
      const currentUserInfo = this.store.getUserInfo({ userId });
      currentUserInfo.receivedRequestObj[request.requestId] = request;
    }
    return request;
  }

  public async disableSendingMessageByAdmin(options: {
    userId: string;
    isDisable: boolean;
  }) {
    await roomEngine.instance?.disableSendingMessageByAdmin(options);
    this.store.updateUserInfo({
      userId: options.userId,
      isMessageDisabled: options.isDisable,
    });
  }

  public async kickRemoteUserOutOfRoom(options: { userId: string }) {
    await roomEngine.instance?.kickRemoteUserOutOfRoom(options);
    this.store.removeUserInfo(options.userId);
  }

  public async changeUserNameCard(options: {
    userId: string;
    nameCard: string;
  }) {
    await roomEngine.instance?.changeUserNameCard(options);
  }
}
