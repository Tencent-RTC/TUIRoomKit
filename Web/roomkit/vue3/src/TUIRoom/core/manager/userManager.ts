import TUIRoomEngine, {
  TUIVideoStreamType,
  TUIRole,
} from '@tencentcloud/tuiroom-engine-js';
import { UserInfo, StreamInfo } from '../type';
import useRoomEngine from '../../hooks/useRoomEngine';
import { roomService } from '../../services/roomService';
import UserEventManager from './userEventManger';
import RequestEventManager from './requestEventManger';

const roomEngine = useRoomEngine();

interface IUserManager {
  setSelfInfo(options: SelfInfoOptions): Promise<void>;
  setCustomInfoForUser(options: CustomInfoForUser): Promise<void>;
}

export type CustomInfoForUser = {
  userId: string;
  customInfo: Record<string, string>;
};
export type SelfInfoOptions = {
  userName?: string;
  avatarUrl?: string;
  customInfo?: Record<string, any>;
};

export default class UserManager implements IUserManager {
  static instance: UserManager;
  private store: any;
  private userListCompareFunction:
    | ((userInfoA: UserInfo, userInfoB: UserInfo) => number)
    | null;

  private streamListCompareFunction:
    | ((streamInfoA: StreamInfo, streamInfoB: StreamInfo) => number)
    | null;

  constructor(options: { store: any }) {
    if (!UserManager.instance) {
      UserManager.instance = this;
    }
    new UserEventManager(options);
    new RequestEventManager(options);
    this.store = options.store;
    this.userListCompareFunction = null;
    this.streamListCompareFunction = null;
    return UserManager.instance;
  }

  public async setSelfInfo(options: SelfInfoOptions): Promise<void> {
    const { avatarUrl, userName } = await TUIRoomEngine.getSelfInfo();
    const info = {
      userName: options.userName || userName,
      avatarUrl: options.avatarUrl || avatarUrl,
    };
    roomService.basicStore.setBasicInfo(info);
    return TUIRoomEngine.setSelfInfo(info);
  }

  public async setCustomInfoForUser(options: CustomInfoForUser) {
    return roomEngine.instance?.setCustomInfoForUser(options);
  }

  public setLocalUser(userInfo: { userId: string }) {
    this.store.addUserInfo(userInfo);
    this.store.addStreamInfo(userInfo.userId, TUIVideoStreamType.kCameraStream);
  }

  public async changeUserRole(options: { userId: string; userRole: TUIRole }) {
    await roomEngine.instance?.changeUserRole(options);
    this.store.updateUserInfo(options);
  }
}
