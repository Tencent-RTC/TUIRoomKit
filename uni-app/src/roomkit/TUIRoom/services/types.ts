import { ChatSDK } from '@tencentcloud/chat';
export interface RoomInitData {
  sdkAppId: number;
  userId: string;
  userSig: string;
  userName: string;
  avatarUrl: string;
  showHeaderTool?: boolean;
  tim?: ChatSDK;
  theme?: {
    defaultTheme?: 'black' | 'white';
    isSupportSwitchTheme: boolean;
  };
}

export interface RoomParam {
  isOpenCamera: boolean;
  isOpenMicrophone: boolean;
  defaultCameraId?: string;
  defaultMicrophoneId?: string;
  defaultSpeakerId?: string;
}

export enum EventType {
  VISIBLE_CHANGE = 'RoomVisibleChange',
  ROOM_DESTROY = 'RoomDestroy',
  ROOM_CONTAINER_RESIZE = 'RoomContainerResize',
  ROOM_ERROR = 'RoomError',
  ROOM_NOTICE_MESSAGE = 'RoomNoticeMessage',
  ROOM_NOTICE_MESSAGE_BOX = 'RoomNoticeMessageBox',
  ROOM_KICKED_OUT = 'RoomKickedOut',
  ROOM_USER_SIG_EXPIRED = 'RoomUserSigExpired',
  ROOM_KICKED_OFFLINE = 'RoomKickedOffline',
}
