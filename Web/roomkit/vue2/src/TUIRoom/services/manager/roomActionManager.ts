import {
  TRTCVideoEncParam,
  TRTCVideoResolution,
  TUIRoomInfo,
  TUIRoomType,
  TUISeatMode,
  TUIMediaDeviceType,
  TUISeatInfo,
  TUIVideoStreamType,
  TUIUserInfo,
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
  password?: string;
}

export interface JoinParams extends DeviceParams {
  password?: string;
}

export type RoomParamsInfo = {
  roomId: string;
  roomType: TUIRoomType;
};

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
      password,
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
        password,
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
        password,
      },
    });
    this.service.emit(EventType.ROOM_START, { roomId });
  }

  public async join(roomId: string, params: JoinParams = {}) {
    const {
      isOpenCamera = false,
      isOpenMicrophone = false,
      defaultCameraId,
      defaultMicrophoneId,
      defaultSpeakerId,
      password,
    } = params;
    await this.enterRoom({
      roomId,
      roomParam: {
        isOpenCamera,
        isOpenMicrophone,
        defaultCameraId,
        defaultMicrophoneId,
        defaultSpeakerId,
        password,
      },
    });
    this.service.emit(EventType.ROOM_JOIN, { roomId });
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
    roomParam?: StartParams;
  }) {
    try {
      const { roomId, roomName, roomMode, roomParam } = options;

      const roomParams = {
        roomId,
        roomName,
        roomType: TUIRoomType.kConference,
        isSeatEnabled: roomMode !== 'FreeToSpeak',
        seatMode:
          roomMode === 'SpeakAfterTakingSeat'
            ? TUISeatMode.kApplyToTake
            : undefined,
        password: roomParam?.password || '',
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
      const roomInfo = await this.doEnterRoom({
        roomId,
        roomType: TUIRoomType.kConference,
        password: roomParam?.password || '',
      });

      this.service.roomStore.setRoomInfo(roomInfo);
      await this.getUserList();
      await this.syncUserInfo(this.service.basicStore.userId);
      await this.fetchAttendeeList(roomId);
      await this.getInvitationList(roomId);
      if (roomInfo.isSeatEnabled) {
        await this.getSeatList();
        this.service.roomStore.isMaster &&
          (await this.service.roomEngine.instance?.takeSeat({
            seatIndex: -1,
            timeout: 0,
          }));
      }
      this.setRoomParams(roomParam);
    } catch (error) {
      logger.error(`${logPrefix}enterRoom error:`, error);
      this.service.errorHandler.handleError(error, 'enterRoom');
      throw error;
    }
  }

  private async setRoomParams(roomParam?: RoomParam) {
    if (!roomParam) {
      return;
    }
    const {
      isOpenCamera,
      isOpenMicrophone,
      defaultCameraId,
      defaultMicrophoneId,
      defaultSpeakerId,
    } = roomParam;
    if (defaultCameraId) {
      this.service.roomStore.setCurrentCameraId(defaultCameraId);
      this.service.roomEngine.instance?.setCurrentCameraDevice({
        deviceId: defaultCameraId,
      });
    }
    if (defaultMicrophoneId) {
      this.service.roomStore.setCurrentMicrophoneId(defaultMicrophoneId);
      this.service.roomEngine.instance?.setCurrentMicDevice({
        deviceId: defaultMicrophoneId,
      });
    }
    if (defaultSpeakerId) {
      this.service.roomStore.setCurrentSpeakerId(defaultSpeakerId);
      this.service.roomEngine.instance?.setCurrentSpeakerDevice({
        deviceId: defaultSpeakerId,
      });
    }

    const {
      isMaster,
      isMicrophoneDisableForAllUser,
      isCameraDisableForAllUser,
      isFreeSpeakMode,
    } = this.service.roomStore;
    // 是否可以自动打开麦克风
    const isCanOpenMicrophone =
      isMaster || (!isMicrophoneDisableForAllUser && isFreeSpeakMode);
    if (isCanOpenMicrophone) {
      if (isOpenMicrophone) {
        await this.service.roomEngine.instance?.unmuteLocalAudio();
        if (!this.service.basicStore.isOpenMic) {
          this.service.roomEngine.instance?.openLocalMicrophone();
          this.service.basicStore.setIsOpenMic(true);
        }
        if (!isWeChat && !isMobile) {
          const microphoneList =
            await this.service.roomEngine.instance?.getMicDevicesList();
          const speakerList =
            await this.service.roomEngine.instance?.getSpeakerDevicesList();
          if (microphoneList?.length === 0 || speakerList?.length === 0) return;
          if (
            !this.service.roomStore.currentMicrophoneId &&
            microphoneList.length > 0
          ) {
            this.service.roomStore.setCurrentMicrophoneId(
              microphoneList[0].deviceId
            );
          }
          if (
            !this.service.roomStore.currentSpeakerId &&
            speakerList.length > 0
          ) {
            this.service.roomStore.setCurrentSpeakerId(speakerList[0].deviceId);
          }
          await this.service.roomEngine.instance?.setCurrentMicDevice({
            deviceId: this.service.roomStore.currentMicrophoneId,
          });
        }
      } else {
        await this.service.roomEngine.instance?.muteLocalAudio();
      }
    }

    // 是否可以自动打开摄像头
    const isCanOpenCamera =
      isMaster || (!isCameraDisableForAllUser && isFreeSpeakMode);
    if (isCanOpenCamera && isOpenCamera) {
      if (isMobile) {
        await this.service.roomEngine.instance?.openLocalCamera({
          isFrontCamera: this.service.basicStore.isFrontCamera,
        });
        return;
      }
      const deviceManager =
        this.service.roomEngine.instance?.getMediaDeviceManager();
      if (!this.service.roomStore.currentCameraId) {
        const cameraList = await deviceManager.getDevicesList({
          type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
        });
        if (cameraList && cameraList.length > 0) {
          this.service.roomStore.setCurrentCameraId(cameraList[0].deviceId);
        }
      }
      await deviceManager.setCurrentDevice({
        type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
        deviceId: this.service.roomStore.currentCameraId,
      });
      /**
       * Turn on the local camera
       *
       **/
      await this.service.roomEngine.instance?.openLocalCamera();
    }
  }

  private async doEnterRoom(params: {
    roomId: string;
    roomType: TUIRoomType;
    password: string;
  }) {
    const { roomEngine } = this.service;
    const { roomId, roomType, password } = params;
    this.service.basicStore.setRoomId(roomId);

    const isH5 = isMobile && !isWeChat;
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    trtcCloud?.setDefaultStreamRecvMode(true, false);

    const roomInfo = (await roomEngine.instance?.enterRoom({
      roomId,
      roomType,
      options: {
        password,
      },
    })) as TUIRoomInfo;

    // roomEngine enabled small stream by default in enterRoom api
    trtcCloud?.enableSmallVideoStream(!isH5, smallParam);
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
        result.userInfoList.forEach((user: TUIUserInfo) => {
          this.service.roomStore.addUserInfo(
            Object.assign(user, { isInRoom: true })
          );
          if (this.service.roomStore.isFreeSpeakMode) {
            this.service.roomStore.addStreamInfo(
              user.userId,
              TUIVideoStreamType.kCameraStream
            );
          }
        });
        nextSequence = result.nextSequence;
      } while (nextSequence !== 0);
    } catch (error: any) {
      logger.error('TUIRoomEngine.getUserList', error.code, error.message);
    }
  }

  private async getInvitationList(
    roomId: string,
    cursor = '',
    result: any[] = []
  ) {
    const res =
      await this.service.conferenceInvitationManager.getInvitationList({
        roomId,
        cursor,
        count: 20,
      });
    if (!res?.invitationList) return [];
    // eslint-disable-next-line no-unsafe-optional-chaining
    result.push(...res?.invitationList);
    if (res.cursor !== '') {
      await this.getInvitationList(roomId, res.cursor, result);
    }
    const list = result.map(({ invitee, status }) => ({
      ...invitee,
      status,
    }));
    this.service.roomStore.updateInviteeList(list as any);
  }

  private async fetchAttendeeList(
    roomId: string,
    cursor = '',
    result: any[] = []
  ) {
    const res = await this.service.scheduleConferenceManager.fetchAttendeeList({
      roomId,
      cursor,
      count: 20,
    });
    if (!res?.attendeeList) return [];
    // eslint-disable-next-line no-unsafe-optional-chaining
    result.push(...res?.attendeeList);
    if (res.cursor !== '') {
      await this.fetchAttendeeList(roomId, res.cursor, result);
    }
    const inviteeList = result.filter(user => {
      return !this.service.roomStore.userList.some(
        item => item.userId === user.userId
      );
    });
    this.service.roomStore.updateInviteeList(inviteeList);
  }

  private async syncUserInfo(userId: string) {
    const { roomEngine } = this.service;
    const userInfo = (await roomEngine.instance?.getUserInfo({
      userId,
    })) as any;
    const { isMessageDisabled } = userInfo;
    this.service.chatStore.setSendMessageDisableChanged(isMessageDisabled);
  }

  private async getSeatList() {
    const { roomEngine } = this.service;
    try {
      const seatList = (await roomEngine.instance?.getSeatList()) as any;
      seatList.forEach((seat: TUISeatInfo) => {
        const { userId } = seat;
        if (!userId) {
          return;
        }
        const user = this.service.roomStore.userInfoObj[userId];
        if (user) {
          this.service.roomStore.updateUserInfo({ userId, onSeat: true });
        } else {
          this.service.roomStore.addUserInfo({
            userId,
            onSeat: true,
            isInRoom: true,
          });
        }
        this.service.roomStore.addStreamInfo(
          userId,
          TUIVideoStreamType.kCameraStream
        );
      });
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

  public async fetchRoomInfo(options?: RoomParamsInfo) {
    return await this.service.roomEngine.instance?.fetchRoomInfo(options);
  }
}
