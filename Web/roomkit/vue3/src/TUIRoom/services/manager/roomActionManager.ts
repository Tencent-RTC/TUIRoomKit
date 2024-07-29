import {
  TRTCVideoEncParam,
  TRTCVideoResolution,
  TUIRoomInfo,
  TUIRoomType,
  TUISeatMode,
} from '@tencentcloud/tuiroom-engine-js';
import { EventType, IRoomService, RoomParam } from '../types';
import { isMobile, isWeChat } from '../../utils/environment';
import logger from '../../utils/common/logger';

const logPrefix = '[RoomService:roomActionManager]';

const smallParam = new TRTCVideoEncParam();
smallParam.videoResolution = TRTCVideoResolution.TRTCVideoResolution_640_360;
smallParam.videoFps = 10;
smallParam.videoBitrate = 550;

export interface DeviceParams {
  isOpenCamera?: boolean;
  isOpenMicrophone?: boolean;
  defaultCameraId?: string;
  defaultMicrophoneId?: string;
  defaultSpeakerId?: string;
}

export interface StartParams extends DeviceParams {
  roomName?: string;
  isSeatEnabled?: boolean;
}

export interface JoinParams extends DeviceParams {
  // You can add additional properties for JoinParams here if needed
}

export class RoomActionManager {
  private service: IRoomService;

  constructor(service: IRoomService) {
    this.service = service;
  }

  public async start(roomId: string, params: StartParams = {}) {
    const {
      roomName,
      isSeatEnabled = false,
      isOpenCamera = false,
      isOpenMicrophone = false,
      defaultCameraId,
      defaultMicrophoneId,
      defaultSpeakerId,
    } = params;
    const roomMode = isSeatEnabled ? 'SpeakAfterTakingSeat' : 'FreeToSpeak';
    await this.createRoom({
      roomId,
      roomName,
      roomMode,
      roomParam: {
        isOpenCamera,
        isOpenMicrophone,
        defaultCameraId,
        defaultMicrophoneId,
        defaultSpeakerId,
      },
    });
    await this.enterRoom({
      roomId,
      roomParam: {
        isOpenCamera,
        isOpenMicrophone,
        defaultCameraId,
        defaultMicrophoneId,
        defaultSpeakerId,
      },
    });
    this.service.emit(EventType.ROOM_START);
  }

  public async join(roomId: string, params: JoinParams = {}) {
    const {
      isOpenCamera = false,
      isOpenMicrophone = false,
      defaultCameraId,
      defaultMicrophoneId,
      defaultSpeakerId,
    } = params;
    await this.enterRoom({
      roomId,
      roomParam: {
        isOpenCamera,
        isOpenMicrophone,
        defaultCameraId,
        defaultMicrophoneId,
        defaultSpeakerId,
      },
    });
    this.service.emit(EventType.ROOM_JOIN);
  }

  public async leaveRoom() {
    try {
      this.closeMediaBeforeLeave();
      const response = await this.service.roomEngine.instance?.exitRoom();
      this.service.resetStore();
      logger.log(`${logPrefix}leaveRoom:`, response);
      this.service.emit(EventType.ROOM_LEAVE, response);
    } catch (error) {
      logger.error(`${logPrefix}leaveRoom error:`, error);
    }
  }

  public async dismissRoom() {
    try {
      logger.log(`${logPrefix}dismissRoom: enter`);
      this.closeMediaBeforeLeave();
      await this.service.roomEngine.instance?.destroyRoom();
      this.service.resetStore();
      this.service.emit(EventType.ROOM_DISMISS, {});
    } catch (error) {
      logger.error(`${logPrefix}dismissRoom error:`, error);
    }
  }

  public async createRoom(options: {
    roomId: string;
    roomName?: string;
    roomMode?: 'FreeToSpeak' | 'SpeakAfterTakingSeat';
    roomParam?: DeviceParams;
  }) {
    try {
      const { roomId, roomName, roomMode } = options;

      const roomParams = {
        roomId,
        roomName,
        roomType: TUIRoomType.kConference,
        isSeatEnabled: roomMode !== 'FreeToSpeak',
        seatMode:
        roomMode === 'SpeakAfterTakingSeat'
          ? TUISeatMode.kApplyToTake
          : undefined,
      };

      await this.handleRoomCreation(roomParams, options);
    } catch (error) {
      logger.error(`${logPrefix}createRoom error:`, error);
      this.service.errorHandler.handleError(error, 'createRoom');
      throw error;
    }
  }

  private async handleRoomCreation(roomParams: any, options: any) {
    const { roomEngine } = this.service;
    if (!roomEngine.instance) {
      return;
    }
    this.service.basicStore.setRoomId(roomParams.roomId);
    logger.debug(`${logPrefix}createRoom:`, roomParams, options);
    await roomEngine.instance?.createRoom(roomParams);
  }

  public async enterRoom(options: { roomId: string; roomParam?: RoomParam }) {
    try {
      const { roomId, roomParam } = options;

      const roomParams = {
        roomId,
        roomType: TUIRoomType.kConference,
      };

      const roomInfo = await this.doEnterRoom(roomParams);

      this.service.roomStore.setRoomInfo(roomInfo);
      await this.getUserList();
      await this.syncUserInfo(this.service.basicStore.userId);

      if (roomInfo.isSeatEnabled) {
        await this.getSeatList();
        this.service.roomStore.isMaster
        && (await this.service.roomEngine.instance?.takeSeat({
          seatIndex: -1,
          timeout: 0,
        }));
      }

      this.service.roomStore.setRoomParam(roomParam);
    } catch (error) {
      logger.error(`${logPrefix}enterRoom error:`, error);
      this.service.errorHandler.handleError(error, 'enterRoom');
      throw error;
    }
  }

  private async doEnterRoom(options: {
    roomId: string;
    roomType: TUIRoomType;
  }) {
    const { roomEngine } = this.service;
    const { roomId, roomType } = options;
    this.service.basicStore.setRoomId(roomId);

    const isH5 = isMobile && !isWeChat;
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    trtcCloud?.setDefaultStreamRecvMode(true, false);
    trtcCloud?.enableSmallVideoStream(!isH5, smallParam);

    const roomInfo = (await roomEngine.instance?.enterRoom({
      roomId,
      roomType,
    })) as TUIRoomInfo;

    roomEngine.instance?.muteLocalAudio();

    if (!roomInfo.isSeatEnabled) {
      roomEngine.instance?.openLocalMicrophone();
      this.service.basicStore.setIsOpenMic(true);
    }

    return roomInfo;
  }

  private async getUserList() {
    const { roomEngine } = this.service;
    let nextSequence = 0;
    try {
      do {
        const result = (await roomEngine.instance?.getUserList({
          nextSequence,
        })) as any;
        this.service.roomStore.updateUserList(result.userInfoList);
        nextSequence = result.nextSequence;
      } while (nextSequence !== 0);
    } catch (error: any) {
      logger.error('TUIRoomEngine.getUserList', error.code, error.message);
    }
  }

  private async syncUserInfo(userId: string) {
    const { roomEngine } = this.service;
    const userInfo = (await roomEngine.instance?.getUserInfo({ userId })) as any;
    const { isMessageDisabled } = userInfo;
    this.service.chatStore.setSendMessageDisableChanged(isMessageDisabled);
  }

  private async getSeatList() {
    const { roomEngine } = this.service;
    try {
      const seatList = (await roomEngine.instance?.getSeatList()) as any;
      this.service.roomStore.setSeatList(seatList);
    } catch (error: any) {
      logger.error('TUIRoomEngine.getSeatList', error.code, error.message);
    }
  }

  private closeMediaBeforeLeave() {
    const { roomEngine } = this.service;
    if (this.service.roomStore.localUser.hasAudioStream) {
      roomEngine.instance?.closeLocalMicrophone();
    }
    if (this.service.roomStore.localUser.hasVideoStream) {
      roomEngine.instance?.closeLocalCamera();
    }
  }
}
