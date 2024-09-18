import mitt from 'mitt';
import useGetRoomEngine from '../hooks/useRoomEngine';
import { EventType, IRoomService, RoomInitData, RoomParam } from './types';
import TUIRoomEngine, {
  TRTCVideoFillMode,
  TRTCVideoMirrorType,
  TRTCVideoRotation,
  TUIKickedOutOfRoomReason,
  TUIRole,
  TUIRoomEvents,
} from '@tencentcloud/tuiroom-engine-js';
import { useBasicStore } from '../stores/basic';
import { UserInfo, useRoomStore } from '../stores/room';
import { useChatStore } from '../stores/chat';
import useDeviceManager from '../hooks/useDeviceManager';
import logger from '../utils/common/logger';
import { isMobile } from '../utils/environment';
import i18n from '../locales';
import { MESSAGE_DURATION } from '../constants/message';
import {
  ComponentConfig,
  ComponentManager,
  ComponentName,
} from './manager/componentManager';
import { ConfigManager, LanguageOption, Theme } from './manager/configManager';
import { SelfInfoOptions, UserManager } from './manager/userManager';
import { LifeCycleManager } from './manager/lifeCycleManager';
import { MediaManager } from './manager/MediaManager';
import {
  JoinParams,
  RoomActionManager,
  StartParams,
  RoomParamsInfo,
} from './manager/roomActionManager';
import { WaterMark } from './function/waterMark';
import { VirtualBackground } from './function/virtualBackground';
import { ScheduleConferenceManager } from './manager/scheduleConferenceManager';
import { ConferenceInvitationManager } from './manager/conferenceInvitationManager';
import { ErrorHandler } from './function/errorHandler';

const { t } = i18n.global;

const logPrefix = '[RoomService]';

export const roomEngine = useGetRoomEngine();
export class RoomService implements IRoomService {
  static instance?: RoomService;
  private emitter = mitt();
  public componentManager = new ComponentManager(this);
  public configManager = new ConfigManager(this);
  public userManager = new UserManager(this);
  public mediaManager = new MediaManager(this);
  public lifeCycleManager: LifeCycleManager = new LifeCycleManager(this);
  public roomActionManager: RoomActionManager = new RoomActionManager(this);
  public waterMark = new WaterMark(this);
  public virtualBackground = new VirtualBackground(this);
  public scheduleConferenceManager: ScheduleConferenceManager =
    new ScheduleConferenceManager(this);
  public conferenceInvitationManager: ConferenceInvitationManager =
    new ConferenceInvitationManager(this);
  public errorHandler: ErrorHandler = new ErrorHandler(this);

  public roomEngine = roomEngine;
  public t = t;

  get basicStore() {
    return useBasicStore();
  }

  get roomStore() {
    return useRoomStore();
  }

  get chatStore() {
    return useChatStore();
  }

  constructor() {
    this.lifeCycleManager.start();
    this.initEventCtx();
    TUIRoomEngine.once('ready', () => {
      this.bindRoomEngineEvents();
      this.handleRoomEngineReady();
      this.emit(EventType.SERVICE_READY);
    });
  }

  private initEventCtx() {
    this.onError = this.onError.bind(this);
    this.onRoomDismissed = this.onRoomDismissed.bind(this);
    this.onUserVoiceVolumeChanged = this.onUserVoiceVolumeChanged.bind(this);
    this.onUserNetworkQualityChanged =
      this.onUserNetworkQualityChanged.bind(this);
    this.onKickedOutOfRoom = this.onKickedOutOfRoom.bind(this);
    this.onSendMessageForUserDisableChanged =
      this.onSendMessageForUserDisableChanged.bind(this);
    this.onUserSigExpired = this.onUserSigExpired.bind(this);
    this.onKickedOffLine = this.onKickedOffLine.bind(this);
    this.onAllUserCameraDisableChanged =
      this.onAllUserCameraDisableChanged.bind(this);
    this.onAllUserMicrophoneDisableChanged =
      this.onAllUserMicrophoneDisableChanged.bind(this);
    this.onScreenShareForAllUserDisableChanged =
      this.onScreenShareForAllUserDisableChanged.bind(this);
    this.onUserInfoChanged = this.onUserInfoChanged.bind(this);
  }

  static getInstance(): RoomService {
    if (!RoomService.instance) {
      RoomService.instance = new RoomService();
    }
    return RoomService.instance;
  }

  static destroyInstance(): void {
    if (!RoomService.instance) return;
    RoomService.instance.lifeCycleManager.stop();
    RoomService.instance.unBindRoomEngineEvents();
    RoomService.instance.waterMark.dispose();
    RoomService.instance.virtualBackground.dispose();
    RoomService.instance.scheduleConferenceManager.dispose();
    RoomService.instance.conferenceInvitationManager.dispose();
    RoomService.instance.mediaManager.dispose();
    RoomService.instance = undefined;
  }

  public useExtension(extension: any) {
    // eslint-disable-next-line no-underscore-dangle
    extension._bind(this);
  }

  public getRoomContainer(): HTMLElement | Element {
    return (
      document.fullscreenElement ||
      document.getElementById('roomContainer') ||
      document.body
    );
  }

  public initMediaDeviceList() {
    useDeviceManager({ listenForDeviceChange: true });
  }

  public bindRoomEngineEvents() {
    roomEngine.instance?.on(TUIRoomEvents.onError, this.onError);
    roomEngine.instance?.on(
      TUIRoomEvents.onRoomDismissed,
      this.onRoomDismissed
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onUserVoiceVolumeChanged,
      this.onUserVoiceVolumeChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onUserNetworkQualityChanged,
      this.onUserNetworkQualityChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onKickedOutOfRoom,
      this.onKickedOutOfRoom
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onSendMessageForUserDisableChanged,
      this.onSendMessageForUserDisableChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onUserSigExpired,
      this.onUserSigExpired
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onKickedOffLine,
      this.onKickedOffLine
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onAllUserCameraDisableChanged,
      this.onAllUserCameraDisableChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onAllUserMicrophoneDisableChanged,
      this.onAllUserMicrophoneDisableChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onScreenShareForAllUserDisableChanged,
      this.onScreenShareForAllUserDisableChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onUserInfoChanged,
      this.onUserInfoChanged
    );
  }

  public unBindRoomEngineEvents() {
    roomEngine.instance?.off(TUIRoomEvents.onError, this.onError);
    roomEngine.instance?.off(
      TUIRoomEvents.onRoomDismissed,
      this.onRoomDismissed
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onUserVoiceVolumeChanged,
      this.onUserVoiceVolumeChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onUserNetworkQualityChanged,
      this.onUserNetworkQualityChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onKickedOutOfRoom,
      this.onKickedOutOfRoom
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onSendMessageForUserDisableChanged,
      this.onSendMessageForUserDisableChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onUserSigExpired,
      this.onUserSigExpired
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onKickedOffLine,
      this.onKickedOffLine
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onAllUserCameraDisableChanged,
      this.onAllUserCameraDisableChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onAllUserMicrophoneDisableChanged,
      this.onAllUserMicrophoneDisableChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onScreenShareForAllUserDisableChanged,
      this.onScreenShareForAllUserDisableChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onUserInfoChanged,
      this.onUserInfoChanged
    );
  }

  private onError(error: any) {
    logger.error('roomEngine.onError: ', error);
    this.errorHandler.handleError(error, 'onError');
  }

  private onRoomDismissed(eventInfo: { roomId: string }) {
    const { roomId } = eventInfo;
    logger.log(`${logPrefix}onRoomDismissed:`, roomId);
    this.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
      title: t('Note'),
      message: t('The host closed the room.'),
      confirmButtonText: t('Sure'),
      duration: 5000,
      callback: async () => {
        this.emit(EventType.ROOM_DISMISS, {});
        this.resetStore();
      },
    });
  }

  private onUserVoiceVolumeChanged(eventInfo: { userVolumeList: [] }) {
    const { userVolumeList } = eventInfo;
    this.roomStore.setAudioVolume(userVolumeList);
  }

  private onUserNetworkQualityChanged(eventInfo: { userNetworkList: [] }) {
    this.basicStore.setLocalQuality(eventInfo.userNetworkList);
  }

  private async onKickedOutOfRoom(eventInfo: {
    roomId: string;
    reason: TUIKickedOutOfRoomReason;
    message: string;
  }) {
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
        callback: async () => {
          this.emit(EventType.KICKED_OUT, { roomId, reason, message });
          this.resetStore();
        },
      });
    } catch (error) {
      logger.error(`${logPrefix}onKickedOutOfRoom error:`, error);
    }
  }

  private onSendMessageForUserDisableChanged(data: {
    userId: string;
    isDisable: boolean;
  }) {
    const { userId, isDisable } = data;
    if (userId === this.roomStore.localUser.userId) {
      const tipMessage = isDisable
        ? t('You have been banned from text chat')
        : t('You are allowed to text chat');
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
      message: t('userSig has expired'),
      confirmButtonText: t('Sure'),
      callback: () => {
        this.emit(EventType.USER_SIG_EXPIRED, {});
        this.resetStore();
      },
    });
  }

  private onKickedOffLine(eventInfo: { message: string }) {
    const { message } = eventInfo;
    this.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
      title: t('Note'),
      message: t(
        'The system has detected that your account has been kicked offline'
      ),
      confirmButtonText: t('Sure'),
      callback: async () => {
        this.emit(EventType.KICKED_OFFLINE, { message });
      },
    });
  }

  private async onAllUserCameraDisableChanged(eventInfo: {
    roomId: string;
    isDisable: boolean;
  }) {
    const { isDisable } = eventInfo;
    if (
      isDisable !== this.roomStore.isCameraDisableForAllUser &&
      this.roomStore.localUser.userRole === TUIRole.kGeneralUser
    ) {
      this.roomStore.setCanControlSelfVideo(!isDisable);
    }
    this.handleVideoStateChange(isDisable);
    this.roomStore.setDisableCameraForAllUserByAdmin(isDisable);
  }

  private async handleVideoStateChange(isDisableVideo: boolean) {
    const tipMessage = isDisableVideo
      ? t('All videos disabled')
      : t('All videos enabled');
    this.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'success',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    /**
     * If the host lifts the full ban on video, users does not actively turn up the user camera,
     * If the host open and does not actively turn up the user camera
     *
     **/
    if (
      isDisableVideo &&
      this.roomStore.localUser.userRole === TUIRole.kGeneralUser
    ) {
      await roomEngine.instance?.closeLocalCamera();
    }
  }

  private async onUserInfoChanged(eventInfo: { userInfo: UserInfo }) {
    const { userId, nameCard } = eventInfo.userInfo;
    this.roomStore.updateUserInfo({ userId, nameCard });
  }

  private async onAllUserMicrophoneDisableChanged(eventInfo: {
    roomId: string;
    isDisable: boolean;
  }) {
    const { isDisable } = eventInfo;
    if (
      isDisable !== this.roomStore.isMicrophoneDisableForAllUser &&
      this.roomStore.localUser.userRole === TUIRole.kGeneralUser
    ) {
      this.roomStore.setCanControlSelfAudio(!isDisable);
    }
    this.handleAudioStateChange(isDisable);
    this.roomStore.setDisableMicrophoneForAllUserByAdmin(isDisable);
  }

  private async handleAudioStateChange(isDisableAudio: boolean) {
    const tipMessage = isDisableAudio
      ? t('All audios disabled')
      : t('All audios enabled');
    this.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'success',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    /**
     * If the moderator unmutes the entire staff, users does not actively bring up the user's microphone;
     * if the moderator turns on the full staff mute, users actively turns off the user's microphone
     *
     **/
    if (
      isDisableAudio &&
      this.roomStore.localUser.userRole === TUIRole.kGeneralUser
    ) {
      await roomEngine.instance?.muteLocalAudio();
    }
  }
  private async onScreenShareForAllUserDisableChanged(eventInfo: {
    roomId: string;
    isDisable: boolean;
  }) {
    const { isDisable } = eventInfo;
    this.roomStore.setDisableScreenShareForAllUserByAdmin(isDisable);
  }
  public resetStore() {
    this.basicStore.reset();
    this.chatStore.reset();
    this.roomStore.reset();
  }

  private storeInit(option: RoomInitData) {
    this.basicStore.setBasicInfo(option);
    this.userManager.setLocalUser(option);
  }

  public async initRoomKit(option: RoomInitData) {
    this.storeInit(option);
    const {
      sdkAppId,
      userId,
      userSig,
      userName = userId,
      avatarUrl = '',
    } = option;
    await TUIRoomEngine.login({ sdkAppId, userId, userSig });
    await TUIRoomEngine.setSelfInfo({ userName, avatarUrl });
    this.emit(EventType.ROOM_LOGIN);
  }

  public async start(roomId: string, params?: StartParams) {
    return this.roomActionManager.start(roomId, params);
  }

  public async join(roomId: string, params?: JoinParams) {
    return this.roomActionManager.join(roomId, params);
  }

  public async createRoom(options: {
    roomId: string;
    roomName?: string;
    roomMode: 'FreeToSpeak' | 'SpeakAfterTakingSeat';
    roomParam?: RoomParam;
  }) {
    await this.roomActionManager.createRoom(options);
  }

  public async enterRoom(options: { roomId: string; roomParam?: RoomParam }) {
    await this.roomActionManager.enterRoom(options);
  }

  public async leaveRoom() {
    await this.roomActionManager.leaveRoom();
  }

  public async dismissRoom() {
    await this.roomActionManager.dismissRoom();
  }

  public fetchRoomInfo(options?: RoomParamsInfo) {
    return this.roomActionManager.fetchRoomInfo(options);
  }

  public async handleRoomEngineReady() {
    const storageCurrentTheme = localStorage.getItem('tuiRoom-currentTheme');
    storageCurrentTheme && this.basicStore.setDefaultTheme(storageCurrentTheme);
    // Set the default rendering mode of local video
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    // eslint-disable-next-line no-nested-ternary
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
    this.emit(EventType.USER_LOGOUT);
    this.resetStore();
  }

  on(eventType: EventType, callback: (data?: any) => void) {
    this.emitter.on(eventType, callback);
  }

  off(eventType: EventType, callback: (data?: any) => void) {
    this.emitter.off(eventType, callback);
  }

  emit(eventType: EventType, data?: any) {
    this.emitter.emit(eventType, data);
  }

  // Component Manager
  public getComponentConfig(name: ComponentName) {
    return this.componentManager.getComponentConfig(name);
  }
  public setComponentConfig(options: Partial<ComponentConfig>) {
    return this.componentManager.setComponentConfig(options);
  }
  // Config Manager
  public setTheme(theme: Theme) {
    return this.configManager.setTheme(theme);
  }
  public setLanguage(language: LanguageOption) {
    return this.configManager.setLanguage(language);
  }
  // User Manager
  setSelfInfo(options: SelfInfoOptions) {
    return this.userManager.setSelfInfo(options);
  }

  getDisplayName(options: UserInfo) {
    return this.userManager.getDisplayName(options);
  }

  getMediaManager() {
    return this.mediaManager;
  }
}

export const roomService = RoomService.getInstance();
