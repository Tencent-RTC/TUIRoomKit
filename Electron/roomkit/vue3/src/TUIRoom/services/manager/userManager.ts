import TUIRoomEngine from '@tencentcloud/tuiroom-engine-electron';
import { IRoomService } from '../types';
import { UserInfo } from '../../stores/room';

interface IUserManager {
  setSelfInfo(options: SelfInfoOptions): Promise<void>;
  setCustomInfoForUser(options: CustomInfoForUser): Promise<void>;
}

export type CustomInfoForUser = {
  userId: string;
  customInfo: Record<string, string>;
}
export type SelfInfoOptions = {
  userName?: string;
  avatarUrl?: string;
  customInfo?: Record<string, any>;
};

export class UserManager implements IUserManager {
  private service: IRoomService;

  constructor(service: IRoomService) {
    this.service = service;
  }

  public async setSelfInfo(options: SelfInfoOptions): Promise<void> {
    const { avatarUrl, userName } = await TUIRoomEngine.getSelfInfo();
    const info = {
      userName: options.userName || userName,
      avatarUrl: options.avatarUrl || avatarUrl,
    };
    this.service.basicStore.setBasicInfo(info);
    return TUIRoomEngine.setSelfInfo(info);
  }

  public async setCustomInfoForUser(options: CustomInfoForUser) {
    const roomEngine = this.service.roomEngine.instance;
    return roomEngine?.setCustomInfoForUser(options);
  }

  public getDisplayName(options: UserInfo) {
    const { nameCard, userName, userId} = options
    return nameCard || userName || userId
  }
}
