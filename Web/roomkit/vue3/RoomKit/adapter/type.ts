import type TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';

export interface StartOptions {
  roomName?: string;
  password?: string;
  isOpenCamera?: boolean;
  isOpenMicrophone?: boolean;
  defaultCameraId?: string;
  defaultMicrophoneId?: string;
  defaultSpeakerId?: string;
}

export interface JoinOptions {
  password?: string;
  isOpenCamera?: boolean;
  isOpenMicrophone?: boolean;
  defaultCameraId?: string;
  defaultMicrophoneId?: string;
  defaultSpeakerId?: string;
}

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
  CONFERENCE_INVITATION_ACCEPTED = 'ConferenceInvitationAccepted',
}

export enum FeatureButton {
  SwitchTheme = 'SwitchTheme',
  SwitchLayout = 'LayoutControl',
  SwitchLanguage = 'Language',
  FullScreen = 'FullScreen',
  Invitation = 'InviteControl',
  BasicBeauty = 'BasicBeauty',
}
export type ThemeOption = 'LIGHT' | 'DARK';

export enum ComponentName {
  AIToolsButton = 'AIToolsButton',
}

export interface ComponentConfig {
  componentName: ComponentName;
  visible: boolean;
}

export interface IConference {
  
  getRoomEngine(): { instance: TUIRoomEngine } | null;

  on: (eventType: RoomEvent, callback: (data?: any) => void) => void;

  off: (eventType: RoomEvent, callback: (data?: any) => void) => void;

  login: (params: {
    sdkAppId: number;
    userId: string;
    userSig: string;
    tim?: any;
  }) => Promise<void>;

  logout: () => Promise<void>;

  start: ({ roomId, options }: { roomId: string; options?: StartOptions }) => Promise<void>;

  join: ({ roomId, options }: { roomId: string; options?: JoinOptions }) => Promise<void>;

  leave: () => Promise<void>;

  dismiss: () => Promise<void>;

  setSelfInfo: (options: {
    userName: string;
    avatarUrl: string;
  }) => Promise<void>;

  setComponentConfig: (config: ComponentConfig) => void;

  getComponentConfig: (name: ComponentName) => ComponentConfig | undefined;

  // setLanguage: (language: LanguageOption) => void;

  // setTheme: (theme: ThemeOption) => void;

  // disableTextMessaging: () => void;

  // disableScreenSharing: () => void;

  // enableWatermark: () => void;

  // enableVirtualBackground: () => void;

  // hideFeatureButton: (name: FeatureButton) => void;

  // replaceFriendList: (userList: Array<any>) => void;

  // setUserListSortComparator: (comparator: Comparator<UserInfo>) => void;

  // setStreamListSortComparator: (comparator: Comparator<StreamInfo>) => void;

  // setParticipants: (
  //   participants: Array<{
  //     userName: string;
  //     userId: string;
  //     avatarUrl: string;
  //   }>
  // ) => void;
}
