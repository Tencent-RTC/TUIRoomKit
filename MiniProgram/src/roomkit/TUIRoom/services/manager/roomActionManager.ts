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
} from '@tencentcloud/tuiroom-engine-wx';
import {
  EventType,
  IRoomService,
  RoomParam,
  WX_MICROPHONE_REQUIRED,
} from '../types';
import { isMobile, isWeChat } from '../../utils/environment';
import logger from '../../utils/common/logger';
import { MediaAuthState } from '../../utils/wxPermission';
import {
  allowMountLocalPusher,
  resetLocalPusherState,
  waitForPusherRemount,
} from '../../hooks/useLocalPusher';
import {
  ensureMediaAfterEnter,
  ensureMediaBeforeEnter,
  setRoomEntering,
} from '../../hooks/useWxMediaGuard';

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

  /** Devices the room was asked to open, opened once the room is up. */
  private pendingWxMediaNeed: MediaAuthState = {
    camera: false,
    microphone: false,
  };

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
    this.service.roomStore.resetRoomData();
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
    this.openWxMediaAfterEnter();
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
    this.service.roomStore.resetRoomData();
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
    this.openWxMediaAfterEnter();
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
    setRoomEntering(true);
    try {
      const { roomId } = options;
      const roomParam = await this.prepareWxMedia(options.roomParam);
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
      // Not awaited: openLocalCamera can start the preview yet never resolve,
      // which would keep the entering overlay up forever.
      this.setRoomParams(roomParam).catch((mediaError: unknown) => {
        logger.error(`${logPrefix}setRoomParams error:`, mediaError);
      });
    } catch (error) {
      logger.error(`${logPrefix}enterRoom error:`, error);
      this.service.errorHandler.handleError(error, 'enterRoom');
      throw error;
    } finally {
      setRoomEntering(false);
    }
  }

  /**
   * Settle the WeChat scopes, then mount live-pusher with the answer and strip
   * the room params we are not allowed to honour.
   *
   * The record scope has to be resolved here rather than after the room is up:
   * live-pusher cannot start without it, and TUIRoomEngine.enterRoom never
   * settles while the pusher is down, so the user would sit on the entering
   * overlay forever with no prompt to act on.
   */
  private async prepareWxMedia(
    roomParam?: RoomParam
  ): Promise<RoomParam | undefined> {
    this.pendingWxMediaNeed = {
      microphone: !!roomParam?.isOpenMicrophone,
      camera: !!roomParam?.isOpenCamera,
    };
    if (!isWeChat) {
      return roomParam;
    }
    resetLocalPusherState();
    const auth = await ensureMediaBeforeEnter(
      { camera: !!roomParam?.isOpenCamera },
      this.service.t.bind(this.service)
    );
    this.pendingWxMediaNeed = {
      microphone: this.pendingWxMediaNeed.microphone && auth.microphone,
      camera: this.pendingWxMediaNeed.camera && auth.camera,
    };
    if (!auth.microphone) {
      const error = new Error(
        'WeChat denied the record scope, live-pusher cannot start'
      ) as Error & { code: string };
      error.code = WX_MICROPHONE_REQUIRED;
      throw error;
    }
    // TRTC enterRoom waits for live-pusher to exist on the page.
    this.restoreLocalUserForPusher();
    allowMountLocalPusher(auth);
    await waitForPusherRemount();
    if (!roomParam) {
      return roomParam;
    }
    return {
      ...roomParam,
      isOpenMicrophone: roomParam.isOpenMicrophone && auth.microphone,
      isOpenCamera: roomParam.isOpenCamera && auth.camera,
    };
  }

  private openWxMediaAfterEnter() {
    if (!isWeChat) {
      return;
    }
    // Not awaited: start / join should resolve as soon as the room is up,
    // rather than waiting for the devices to come online.
    ensureMediaAfterEnter(
      this.pendingWxMediaNeed,
      this.service.t.bind(this.service)
    ).catch((error: unknown) => {
      logger.error(`${logPrefix}ensureMediaAfterEnter error:`, error);
    });
  }

  /**
   * resetRoomData() clears local user/stream. Restore them so StreamRegion can
   * render trtc-pusher before enterRoom, which TRTC requires on WeChat.
   */
  private restoreLocalUserForPusher() {
    const { userId, userName, avatarUrl } = this.service.basicStore;
    if (!userId) {
      return;
    }
    this.service.roomStore.addUserInfo({
      userId,
      userName,
      avatarUrl,
    });
    this.service.roomStore.addStreamInfo(
      userId,
      TUIVideoStreamType.kCameraStream
    );
  }

  /**
   * Device selection and auto-open for platforms with a device list. WeChat
   * has neither: live-pusher owns the devices, and opening them before the
   * user grants a scope makes TRTC report "Not allowed to use microphone".
   * The WeChat path runs in openWxMediaAfterEnter instead.
   */
  private async setRoomParams(roomParam?: RoomParam) {
    if (!roomParam || isWeChat) {
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
      try {
        if (isOpenMicrophone) {
          await this.service.roomEngine.instance?.unmuteLocalAudio();
          if (!this.service.basicStore.isOpenMic) {
            await this.service.roomEngine.instance?.openLocalMicrophone();
            this.service.basicStore.setIsOpenMic(true);
          }
          if (!isMobile) {
            const microphoneList =
              await this.service.roomEngine.instance?.getMicDevicesList();
            const speakerList =
              await this.service.roomEngine.instance?.getSpeakerDevicesList();
            if (microphoneList?.length > 0 && speakerList?.length > 0) {
              if (!this.service.roomStore.currentMicrophoneId) {
                this.service.roomStore.setCurrentMicrophoneId(
                  microphoneList[0].deviceId
                );
              }
              if (!this.service.roomStore.currentSpeakerId) {
                this.service.roomStore.setCurrentSpeakerId(
                  speakerList[0].deviceId
                );
              }
              await this.service.roomEngine.instance?.setCurrentMicDevice({
                deviceId: this.service.roomStore.currentMicrophoneId,
              });
            }
          }
        } else {
          await this.service.roomEngine.instance?.muteLocalAudio();
        }
      } catch (error) {
        logger.error(`${logPrefix}open microphone error:`, error);
      }
    }

    const isCanOpenCamera =
      isMaster || (!isCameraDisableForAllUser && isFreeSpeakMode);
    if (isCanOpenCamera && isOpenCamera) {
      try {
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
        await this.service.roomEngine.instance?.openLocalCamera();
      } catch (error) {
        logger.error(`${logPrefix}open camera error:`, error);
      }
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

    // On WeChat, open the mic only after live-pusher is mounted with auth.
    if (!roomInfo.isSeatEnabled && !isWeChat) {
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
