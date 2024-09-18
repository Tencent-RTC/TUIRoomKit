import { ChatSDK } from '@tencentcloud/chat';
import {
  roomService,
  StartParams,
  JoinParams,
  LanguageOption,
  Theme,
  EventType,
} from './services';
import { TUIRoomEngine } from './index';
import logger from './utils/common/logger';
import { toTargetTheme } from './utils/common';

export enum RoomEvent {
  ROOM_START = 'RoomStart',
  ROOM_JOIN = 'RoomJoin',
  ROOM_LEAVE = 'RoomLeave',
  ROOM_DISMISS = 'RoomDestroy',
  ROOM_ERROR = 'RoomError',
  KICKED_OUT = 'KickedOut',
  KICKED_OFFLINE = 'KickedOffline',
  USER_SIG_EXPIRED = 'UserSigExpired',
  USER_LOGOUT = 'UserLogout',
  LANGUAGE_CHANGED = 'LanguageChanged',
  THEME_CHANGED = 'ThemeChanged',
}
export enum FeatureButton {
  SwitchTheme = 'SwitchTheme',
  SwitchLayout = 'LayoutControl',
  SwitchLanguage = 'Language',
  FullScreen = 'FullScreen',
  Invitation = 'InviteControl',
}
export type ThemeOption = 'LIGHT' | 'DARK';

interface IConference {
  getRoomEngine(): TUIRoomEngine | null;

  on: (
    eventType: RoomEvent,
    callback: (data?: LanguageOption | ThemeOption | any) => void
  ) => void;

  off: (
    eventType: RoomEvent,
    callback: (data?: LanguageOption | ThemeOption | any) => void
  ) => void;

  login: (params: {
    sdkAppId: number;
    userId: string;
    userSig: string;
    tim?: ChatSDK;
  }) => Promise<void>;

  logout: () => Promise<void>;

  start: (roomId: string, params: StartParams) => Promise<void>;

  join: (roomId: string, params: JoinParams) => Promise<void>;

  leave: () => Promise<void>;

  dismiss: () => Promise<void>;

  setSelfInfo: (options: {
    userName: string;
    avatarUrl: string;
  }) => Promise<void>;

  setLanguage: (language: LanguageOption) => void;

  setTheme: (theme: ThemeOption) => void;

  disableTextMessaging: () => void;

  disableScreenSharing: () => void;

  enableWatermark: () => void;

  enableVirtualBackground: () => void;

  hideFeatureButton: (name: FeatureButton) => void;

  replaceFriendList: (userList: Array<any>) => void;
}
class Conference implements IConference {
  public login(params: {
    sdkAppId: number;
    userId: string;
    userSig: string;
    tim?: ChatSDK;
  }) {
    return roomService.initRoomKit(params);
  }

  public async logout() {
    return roomService.logOut();
  }

  public getRoomEngine() {
    const roomEngine = roomService.roomEngine.instance;
    if (!roomEngine) {
      logger.warn('getRoomEngine failed, roomEngine is not exist');
    }
    return roomService.roomEngine.instance;
  }

  public on(
    eventType: RoomEvent,
    callback: (data?: LanguageOption | ThemeOption | any) => void
  ) {
    roomService.on(eventType as unknown as EventType, callback);
  }

  public off(
    eventType: RoomEvent,
    callback: (data?: LanguageOption | ThemeOption | any) => void
  ) {
    roomService.off(eventType as unknown as EventType, callback);
  }

  public async start(roomId: string, params?: StartParams) {
    return await roomService.start(roomId, params);
  }

  public async join(roomId: string, params?: JoinParams) {
    return await roomService.join(roomId, params);
  }

  public async leave() {
    return await roomService.leaveRoom();
  }

  public async dismiss() {
    return await roomService.dismissRoom();
  }

  public setSelfInfo(options: { userName: string; avatarUrl: string }) {
    return roomService.setSelfInfo(options);
  }

  public setLanguage(language: LanguageOption) {
    return roomService.setLanguage(language);
  }

  public setTheme(theme: ThemeOption) {
    return roomService.setTheme(toTargetTheme(theme) as Theme);
  }

  public disableTextMessaging() {
    roomService.setComponentConfig({ ChatControl: { visible: false } });
  }

  public disableScreenSharing() {
    roomService.setComponentConfig({ ScreenShare: { visible: false } });
  }

  public enableWatermark() {
    roomService.waterMark.toggleWatermark(true);
  }

  public enableVirtualBackground() {
    roomService.setComponentConfig({ VirtualBackground: { visible: true } });
  }

  public hideFeatureButton(name: FeatureButton) {
    roomService.setComponentConfig({ [name]: { visible: false } });
  }

  public replaceFriendList(userList: Array<any>) {
    return roomService.scheduleConferenceManager.replaceFriendList(userList);
  }
}

export const conference = new Conference();
