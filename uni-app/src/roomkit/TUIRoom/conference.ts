import { ChatSDK } from '@tencentcloud/chat';
import { roomService, StartParams, JoinParams, EventType } from './services';
import { TUIRoomEngine } from './index';
import logger from './utils/common/logger';

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
}
interface IConference {
  getRoomEngine(): TUIRoomEngine | null;

  on: (eventType: RoomEvent, callback: () => void) => void;

  off: (eventType: RoomEvent, callback: () => void) => void;

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

  public on(eventType: RoomEvent, callback: () => any) {
    roomService.on(eventType as unknown as EventType, callback);
  }

  public off(eventType: RoomEvent, callback: () => void) {
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

  public setSelfInfo(options: {
    userName: string;
    avatarUrl: string;
  }) {
    return roomService.setSelfInfo(options);
  }
}

export const conference = new Conference();
