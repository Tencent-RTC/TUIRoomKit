import mitt from 'mitt';
import useGetRoomEngine from '../hooks/useRoomEngine';
import { EventType, RoomInitData, RoomParam } from './types';
import {
  TUIRoomEngine,
  TRTCVideoEncParam,
  TRTCVideoFillMode,
  TRTCVideoMirrorType,
  TRTCVideoResolution,
  TRTCVideoRotation,
  TUIKickedOutOfRoomReason,
  TUIRole,
  TUIRoomEvents,
  TUIRoomType,
  TUISeatMode,
} from '@tencentcloud/tuiroom-engine-uniapp-app';
import { useBasicStore } from '../stores/basic';
import { useRoomStore } from '../stores/room';
import { useChatStore } from '../stores/chat';
import useDeviceManager from '../hooks/useDeviceManager';
import logger from '../utils/common/logger';
import { isMobile, isWeChat, isApp } from '../utils/environment';
import TUIRoomAegis from '../utils/aegis';
import i18n from '../locales';
import { MESSAGE_DURATION } from '../constants/message';
import TencentCloudChat, { ChatSDK } from '@tencentcloud/chat';
const { t } = i18n.global;

const logPrefix = '[RoomService]';
export const roomEngine = useGetRoomEngine();
const smallParam = new TRTCVideoEncParam();
smallParam.videoResolution = TRTCVideoResolution.TRTCVideoResolution_640_360;
smallParam.videoFps = 10;
smallParam.videoBitrate = 550;

export class RoomService {
  static instance?: RoomService;
  private emitter = mitt();
  public tim: ChatSDK;
  get basicStore() {
    return useBasicStore();
  }

  get roomStore() {
    return useRoomStore();
  }

  get chatStore() {
    return useChatStore();
  }

  public t = t;
  constructor() {
    this.initEventCtx();
    TUIRoomEngine.once('ready', () => {
      if (roomEngine.instance === null) {
        roomEngine.instance = new TUIRoomEngine();
      }
      this.bindRoomEngineEvents();
      this.handleRoomKitOnMounted();
    });
  }

  private initEventCtx() {
    this.onError = this.onError.bind(this);
    this.onUserVoiceVolumeChanged = this.onUserVoiceVolumeChanged.bind(this);
    this.onUserNetworkQualityChanged = this.onUserNetworkQualityChanged.bind(this);
    this.onKickedOutOfRoom = this.onKickedOutOfRoom.bind(this);
    this.onSendMessageForUserDisableChanged = this.onSendMessageForUserDisableChanged.bind(this);
    this.onUserSigExpired = this.onUserSigExpired.bind(this);
    this.onKickedOffLine = this.onKickedOffLine.bind(this);
    this.onAllUserCameraDisableChanged = this.onAllUserCameraDisableChanged.bind(this);
    this.onAllUserMicrophoneDisableChanged = this.onAllUserMicrophoneDisableChanged.bind(this);
    this.onSendMessageForAllUserDisableChanged = this.onSendMessageForAllUserDisableChanged.bind(this);
    this.onReceiveMessage = this.onReceiveMessage.bind(this);
  }

  static getInstance(): RoomService {
    if (!RoomService.instance) {
      RoomService.instance = new RoomService();
    }
    return RoomService.instance;
  }

  static destroyInstance(): void {
    if (!RoomService.instance) return;
    RoomService.instance.unBindRoomEngineEvents();
    RoomService.instance = undefined;
  }

  public useExtension(extension: any) {
    extension._bind(this);
  }

  public getComponentConfig(names: string[]) {
    return names.map(name => this.basicStore.componentConfig[name] || {});
  }

  public setComponentConfig(options: { [name: string]: { [key: string]: any } }) {
    try {
      for (const name in options) {
        const current = options[name];
        for (const key in current) {
          this.basicStore.componentConfig[name][key] = current[key];
        }
      }
      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  public getRoomContainer(): HTMLElement | Element {
    return document?.fullscreenElement || document?.getElementById('roomContainer') || document?.body;
  }

  public initMediaDeviceList() {
    useDeviceManager({ listenForDeviceChange: true });
  }

  public bindChatEvents() {
    this.tim.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, this.onReceiveMessage);
  }

  public bindRoomEngineEvents() {
    roomEngine.instance?.on(TUIRoomEvents.onError, this.onError);
    roomEngine.instance?.on(TUIRoomEvents.onUserVoiceVolumeChanged, this.onUserVoiceVolumeChanged);
    roomEngine.instance?.on(TUIRoomEvents.onUserNetworkQualityChanged, this.onUserNetworkQualityChanged);
    roomEngine.instance?.on(TUIRoomEvents.onKickedOutOfRoom, this.onKickedOutOfRoom);
    roomEngine.instance?.on(
      TUIRoomEvents.onSendMessageForUserDisableChanged,
      this.onSendMessageForUserDisableChanged,
    );
    roomEngine.instance?.on(TUIRoomEvents.onUserSigExpired, this.onUserSigExpired);
    roomEngine.instance?.on(TUIRoomEvents.onKickedOffLine, this.onKickedOffLine);
    roomEngine.instance?.on(TUIRoomEvents.onAllUserCameraDisableChanged, this.onAllUserCameraDisableChanged);
    roomEngine.instance?.on(TUIRoomEvents.onAllUserMicrophoneDisableChanged, this.onAllUserMicrophoneDisableChanged);
    roomEngine.instance?.on(
      TUIRoomEvents.onSendMessageForAllUserDisableChanged,
      this.onSendMessageForAllUserDisableChanged,
    );
  }

  public unBindRoomEngineEvents() {
    roomEngine.instance?.off(TUIRoomEvents.onError, this.onError);
    roomEngine.instance?.off(TUIRoomEvents.onUserVoiceVolumeChanged, this.onUserVoiceVolumeChanged);
    roomEngine.instance?.off(TUIRoomEvents.onUserNetworkQualityChanged, this.onUserNetworkQualityChanged);
    roomEngine.instance?.off(TUIRoomEvents.onKickedOutOfRoom, this.onKickedOutOfRoom);
    roomEngine.instance?.off(TUIRoomEvents.onSendMessageForUserDisableChanged, this.onSendMessageForUserDisableChanged);
    roomEngine.instance?.off(TUIRoomEvents.onUserSigExpired, this.onUserSigExpired);
    roomEngine.instance?.off(TUIRoomEvents.onKickedOffLine, this.onKickedOffLine);
    roomEngine.instance?.off(TUIRoomEvents.onAllUserCameraDisableChanged, this.onAllUserCameraDisableChanged);
    roomEngine.instance?.off(TUIRoomEvents.onAllUserMicrophoneDisableChanged, this.onAllUserMicrophoneDisableChanged);
    roomEngine.instance?.off(
      TUIRoomEvents.onSendMessageForAllUserDisableChanged,
      this.onSendMessageForAllUserDisableChanged,
    );
    this.tim.off(TencentCloudChat.EVENT.MESSAGE_RECEIVED, this.onReceiveMessage);
  }

  private onError(error: any) {
    logger.error('roomEngine.onError: ', error);
    if (error.message === 'enter trtc room failed , error code : -1') {
      this.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
        type: 'warning',
        message: t('Failed to enter the meeting'),
        callback: () => {
          this.resetStore();
        },
      });
    }
  }

  private onReceiveMessage(options: { data: any }) {
    const messageTypeList = [
      TencentCloudChat.TYPES.MSG_TEXT,
      TencentCloudChat.TYPES.MSG_IMAGE,
      TencentCloudChat.TYPES.MSG_FILE,
      TencentCloudChat.TYPES.MSG_FACE,
      TencentCloudChat.TYPES.MSG_VIDEO,
    ];

    if (!options || !options.data) {
      return;
    }
    options.data.forEach((message: any) => {
      // eslint-disable-next-line no-undef
      const currentPageRoute = getCurrentPages()?.slice(-1)[0]?.route;
      const isChatPage = currentPageRoute === this.chatStore.route;
      const shouldUpdateUnreadCount = messageTypeList.includes(message.type) && !isChatPage;

      if (shouldUpdateUnreadCount) {
        this.chatStore?.updateUnReadCount((this.chatStore?.unReadCount || 0) + 1);
      }
    });
  }

  private onUserVoiceVolumeChanged(eventInfo: { userVolumeList: [] }) {
    const { userVolumeList } = eventInfo;
    this.roomStore.setAudioVolume(userVolumeList);
  }

  private onUserNetworkQualityChanged(eventInfo: { userNetworkList: [] }) {
    this.basicStore.setLocalQuality(eventInfo.userNetworkList);
  }

  private async onKickedOutOfRoom(eventInfo: { roomId: string; reason: TUIKickedOutOfRoomReason; message: string }) {
    const { roomId, reason, message } = eventInfo;
    try {
      let notice = '';
      switch (reason) {
        case TUIKickedOutOfRoomReason.kKickedByAdmin:
          notice = t('kicked out of the room by the host');
          break;
        case TUIKickedOutOfRoomReason.kKickedByLoggedOnOtherDevice:
          notice = t('kicked out of the room by other device');
          break;
        case TUIKickedOutOfRoomReason.kKickedByServer:
          notice = t('kicked out of the room by serve');
          break;
      }
      this.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
        title: t('Note'),
        message: notice,
        confirmButtonText: t('Sure'),
        showCancel: false,
        appendToRoomContainer: true,
        callback: async () => {
          this.emit(EventType.ROOM_KICKED_OUT, { roomId, reason, message });
          this.resetStore();
        },
      });
    } catch (error) {
      logger.error(`${logPrefix}onKickedOutOfRoom error:`, error);
    }
  }

  private onSendMessageForUserDisableChanged(data: { userId: string; isDisable: boolean }) {
    const { userId, isDisable } = data;
    if (userId === this.roomStore.localUser.userId) {
      const tipMessage = isDisable ? t('You have been banned from text chat') : t('You are allowed to text chat');
      this.emit(EventType.ROOM_NOTICE_MESSAGE, {
        code: -1,
        type: 'warning',
        message: tipMessage,
        duration: MESSAGE_DURATION.NORMAL,
      });
      this.chatStore.setSendMessageDisableChanged(isDisable);
    }
    this.roomStore.setMuteUserChat(userId, isDisable);
  }

  private onUserSigExpired() {
    this.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
      title: t('Note'),
      message: t('userSig 已过期'),
      showCancel: false,
      confirmButtonText: t('Sure'),
      appendToRoomContainer: true,
      callback: () => {
        this.emit(EventType.ROOM_USER_SIG_EXPIRED, {});
      },
    });
  }

  private onKickedOffLine(eventInfo: { message: string }) {
    const { message } = eventInfo;
    this.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
      title: t('Note'),
      message: t('系统检测到您的账号被踢下线'),
      showCancel: false,
      confirmButtonText: t('Sure'),
      appendToRoomContainer: true,
      callback: async () => {
        this.emit(EventType.ROOM_KICKED_OFFLINE, { message });
      },
    });
  }

  private async onAllUserCameraDisableChanged(eventInfo: { roomId: string; isDisable: boolean }) {
    const { isDisable } = eventInfo;
    if (
      isDisable !== this.roomStore.isCameraDisableForAllUser
      && this.roomStore.localUser.userRole === TUIRole.kGeneralUser
    ) {
      this.roomStore.setCanControlSelfVideo(!isDisable);
    }
    this.handleVideoStateChange(isDisable);
    this.roomStore.setDisableCameraForAllUserByAdmin(isDisable);
  }

  private async handleVideoStateChange(isDisableVideo: boolean) {
    const tipMessage = isDisableVideo ? t('All videos disabled') : t('All videos enabled');
    this.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'success',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    /**
     * If the host lifts the full ban on video, users does not actively turn up the user camera,
     * If the host open and does not actively turn up the user camera
     *
     * 如果主持人解除全员禁画，不主动调起用户摄像头；如果主持人开启全员禁画，则主动关闭用户摄像头
     **/
    if (isDisableVideo && this.roomStore.localUser.userRole === TUIRole.kGeneralUser) {
      await roomEngine.instance?.closeLocalCamera();
    }
  }

  private async onAllUserMicrophoneDisableChanged(eventInfo: { roomId: string; isDisable: boolean }) {
    const { isDisable } = eventInfo;
    if (
      isDisable !== this.roomStore.isMicrophoneDisableForAllUser
      && this.roomStore.localUser.userRole === TUIRole.kGeneralUser
    ) {
      this.roomStore.setCanControlSelfAudio(!isDisable);
    }
    this.handleAudioStateChange(isDisable);
    this.roomStore.setDisableMicrophoneForAllUserByAdmin(isDisable);
  }

  private async onSendMessageForAllUserDisableChanged(eventInfo: { roomId: string; isDisable: boolean }) {
    const { isDisable } = eventInfo;
    if (
      isDisable !== this.roomStore.isMessageDisableForAllUser
      && this.roomStore.localUser.userRole === TUIRole.kGeneralUser
    ) {
      this.handleMessageStateChange(isDisable);
    }
    this.roomStore.setDisableMessageAllUserByAdmin(isDisable);
  }

  private async handleMessageStateChange(isDisableMessage: boolean) {
    const tipMessage = isDisableMessage ? t('Disabling text chat for all is enabled') : t('Unblocked all text chat');
    this.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'success',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
  }

  private async handleAudioStateChange(isDisableAudio: boolean) {
    const tipMessage = isDisableAudio ? t('All audios disabled') : t('All audios enabled');
    this.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'success',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    /**
     * If the moderator unmutes the entire staff, users does not actively bring up the user's microphone;
     * if the moderator turns on the full staff mute, users actively turns off the user's microphone
     *
     * 如果主持人解除全员静音，不主动调起用户麦克风；如果主持人开启全员静音，则主动关闭用户麦克风
     **/
    if (isDisableAudio && this.roomStore.localUser.userRole === TUIRole.kGeneralUser) {
      await roomEngine.instance?.muteLocalAudio();
    }
  }

  public resetStore() {
    this.basicStore.reset();
    this.chatStore.reset();
    this.roomStore.reset();
  }

  private storeInit(option: RoomInitData) {
    this.basicStore.setBasicInfo(option);
    this.roomStore.setLocalUser(option);
  }

  public async initRoomKit(option: RoomInitData) {
    this.storeInit(option);
    const { sdkAppId, userId, userSig, userName, avatarUrl } = option;
    const loginParams = { sdkAppId, userId, userSig };
    if (uni.$tim) {
      loginParams.tim = uni.$tim;
    }
    await TUIRoomEngine.login(loginParams);
    this.tim = TUIRoomEngine.getTIM();
    await TUIRoomEngine.setSelfInfo({ userName, avatarUrl });
    this.bindChatEvents();
  }

  private async doEnterRoom(options: { roomId: string; roomType: TUIRoomType }) {
    const { roomId, roomType } = options;
    if (!isApp) {
      const isH5 = isMobile && !isWeChat;
      const trtcCloud = roomEngine.instance?.getTRTCCloud();
      trtcCloud?.setDefaultStreamRecvMode(true, false);
      trtcCloud?.enableSmallVideoStream(!isH5, smallParam);
    }

    await roomEngine.instance?.enterRoom({
      roomId,
      roomType,
    });
    const roomInfo = await roomEngine.instance?.fetchRoomInfo() as any;
    roomEngine.instance?.muteLocalAudio();
    if (!roomInfo.isSeatEnabled) {
      roomEngine.instance?.openLocalMicrophone();
      this.basicStore.setIsOpenMic(true);
    }
    return roomInfo;
  }

  private async getUserList() {
    let nextSequence = 0;
    try {
      do {
        const result = await roomEngine.instance?.getUserList({ nextSequence }) as any;
        this.roomStore.updateUserList(result.userInfoList);
        nextSequence = result.nextSequence;
      } while (nextSequence !== 0);
    } catch (error: any) {
      logger.error('TUIRoomEngine.getUserList', error.code, error.message);
    }
  }

  private async getSeatList() {
    try {
      const seatList = (await roomEngine.instance?.getSeatList()) as any;
      this.roomStore.setSeatList(seatList);
    } catch (error: any) {
      logger.error('TUIRoomEngine.getSeatList', error.code, error.message);
    }
  }

  public async createRoom(options: {
    roomId: string;
    roomName?: string;
    roomMode: 'FreeToSpeak' | 'SpeakAfterTakingSeat';
    roomParam?: RoomParam;
  }) {
    const { roomId, roomName, roomMode, roomParam } = options;
    try {
      if (!roomEngine.instance) {
        return;
      }
      this.basicStore.setRoomId(roomId);
      logger.debug(`${logPrefix}createRoom:`, roomId, roomMode, roomParam);
      const roomParams = {
        roomId,
        name: roomName,
        roomType: TUIRoomType.kConference,
      };
      if (roomMode === 'FreeToSpeak') {
        Object.assign(roomParams, {
          isSeatEnabled: false,
        });
      } else {
        Object.assign(roomParams, {
          isSeatEnabled: true,
          seatMode: TUISeatMode.kApplyToTake,
        });
      }
      await roomEngine.instance?.createRoom(roomParams);
      TUIRoomAegis.reportEvent({
        name: 'createRoom',
        ext1: 'createRoom-success',
      });
    } catch (error) {
      logger.error(`${logPrefix}createRoom error:`, error);
      this.basicStore.reset();
      throw error;
    }
  }

  private closeMediaBeforeLeave() {
    if (this.roomStore.localUser.hasAudioStream) {
      roomEngine.instance?.closeLocalMicrophone();
    }
    if (this.roomStore.localUser.hasVideoStream) {
      roomEngine.instance?.closeLocalCamera();
    }
  }

  public async leaveRoom() {
    try {
      this.closeMediaBeforeLeave();
      const response = await roomEngine.instance?.exitRoom();
      logger.log(`${logPrefix}leaveRoom:`, response);
    } catch (error) {
      logger.error(`${logPrefix}leaveRoom error:`, error);
    }
  }

  public async dismissRoom() {
    try {
      logger.log(`${logPrefix}dismissRoom: enter`);
      this.closeMediaBeforeLeave();
      await roomEngine.instance?.destroyRoom();
    } catch (error) {
      logger.error(`${logPrefix}dismissRoom error:`, error);
    }
  }

  public async enterRoom(options: { roomId: string; roomParam?: RoomParam }) {
    const { roomId, roomParam } = options;
    try {
      if (!roomEngine.instance) {
        return;
      }
      this.basicStore.setRoomId(roomId);
      logger.debug(`${logPrefix}enterRoom:`, roomId, roomParam);
      const roomParams = {
        roomId,
        roomType: TUIRoomType.kConference,
      };
      const roomInfo = await this.doEnterRoom(roomParams);
      this.roomStore.setRoomInfo(roomInfo);
      await this.getUserList();
      if (roomInfo.isSeatEnabled) {
        await this.getSeatList();
        this.roomStore.isMaster && await roomEngine.instance?.takeSeat({ seatIndex: -1, timeout: 0 });
      }
      /**
       * setRoomParam must come after setRoomInfo,because roomInfo contains information
       * about whether or not to turn on the no-mac ban.
       *
       * setRoomParam 必须在 setRoomInfo 之后，因为 roomInfo 中有是否开启全员禁麦禁画的信息
       **/
      this.roomStore.setRoomParam(roomParam);
      TUIRoomAegis.reportEvent({
        name: 'enterRoom',
        ext1: 'enterRoom-success',
      });
    } catch (error) {
      logger.error(`${logPrefix}enterRoom error:`, error);
      this.basicStore.reset();
      throw error;
    }
  }

  public async handleRoomKitOnMounted() {
    const storageCurrentTheme = uni.getStorageSync('tuiRoom-currentTheme');
    storageCurrentTheme && this.basicStore.setDefaultTheme(storageCurrentTheme);
    // 设置本地视频默认渲染模式
    if (isApp) {
      return;
    }
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    const mirrorType = isMobile
      ? TRTCVideoMirrorType.TRTCVideoMirrorType_Auto
      : this.basicStore.isLocalStreamMirror
        ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
        : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable;
    await trtcCloud?.setLocalRenderParams({
      mirrorType,
      rotation: TRTCVideoRotation.TRTCVideoRotation0,
      fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
    });
  }

  public logOut() {
    this.resetStore();
  }

  on(eventType: EventType, callback: (data?: any) => any) {
    this.emitter.on(eventType, callback);
  }

  off(eventType: EventType, callback: (data?: any) => void) {
    this.emitter.off(eventType, callback);
  }

  emit(eventType: EventType, data?: any) {
    this.emitter.emit(eventType, data);
  }
}

export const roomService = RoomService.getInstance();
