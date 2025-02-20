import { ChatSDK } from '@tencentcloud/chat';
import { useBasicStore } from '../stores/basic';
import { useRoomStore } from '../stores/room';
import { useChatStore } from '../stores/chat';
import { LifeCycleManager } from './manager/lifeCycleManager';
import { ScheduleConferenceManager } from './manager/scheduleConferenceManager';
import { RoomActionManager } from './manager/roomActionManager';
import { ErrorHandler } from './function/errorHandler';
import { AITask } from './function/aiTask';
import { ConferenceInvitationManager } from './manager/conferenceInvitationManager';
import { DataReportManager } from './manager/dataReportManager';
import { WidgetsManager } from './manager/widgetsManager';
export interface IRoomService {
  t: any;
  roomEngine: Record<string, any>;
  basicStore: ReturnType<typeof useBasicStore>;
  roomStore: ReturnType<typeof useRoomStore>;
  chatStore: ReturnType<typeof useChatStore>;
  lifeCycleManager: LifeCycleManager;
  roomActionManager?: RoomActionManager;
  scheduleConferenceManager: ScheduleConferenceManager;
  conferenceInvitationManager: ConferenceInvitationManager;
  dataReportManager: DataReportManager;
  widgetsManager: WidgetsManager;
  errorHandler: ErrorHandler;
  aiTask: AITask;
  on: (eventType: EventType, callback: (data?: any) => any) => void;
  off: (eventType: EventType, callback: (data?: any) => void) => void;
  emit: (eventType: EventType, data?: any) => void;
  resetStore: () => void;
}

export interface RoomInitData {
  sdkAppId: number;
  userId: string;
  userSig: string;
  userName?: string;
  avatarUrl?: string;
  showHeaderTool?: boolean;
  tim?: ChatSDK;
  theme?: {
    defaultTheme?: 'dark' | 'light';
    isSupportSwitchTheme: boolean;
  };
}

export interface RoomParam {
  isOpenCamera: boolean;
  isOpenMicrophone: boolean;
  defaultCameraId?: string;
  defaultMicrophoneId?: string;
  defaultSpeakerId?: string;
  password?: string;
}

export enum EventType {
  SERVICE_READY = 'ServiceReady',
  ROOM_LOGIN = 'RoomLogin',
  ROOM_CONTAINER_RESIZE = 'RoomContainerResize',
  ROOM_NOTICE_MESSAGE = 'RoomNoticeMessage',
  ROOM_NOTICE_MESSAGE_BOX = 'RoomNoticeMessageBox',
  ROOM_START = 'RoomStart',
  ROOM_JOIN = 'RoomJoin',
  ROOM_LEAVE = 'RoomLeave',
  ROOM_DISMISS = 'RoomDestroy',
  ROOM_ERROR = 'RoomError',
  ROOM_NEED_PASSWORD = 'RoomNeedPassword',
  KICKED_OUT = 'KickedOut',
  KICKED_OFFLINE = 'KickedOffline',
  USER_SIG_EXPIRED = 'UserSigExpired',
  USER_LOGOUT = 'UserLogout',
  LANGUAGE_CHANGED = 'LanguageChanged',
  THEME_CHANGED = 'ThemeChanged',
  CONFERENCE_INVITATION_ACCEPTED = 'ConferenceInvitationAccepted',
}
