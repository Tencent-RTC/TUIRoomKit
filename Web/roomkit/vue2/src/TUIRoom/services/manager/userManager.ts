import TUIRoomEngine, {
  TUIRoomEvents,
  TUIUserInfo,
  TUIChangeReason,
  TUIVideoStreamType,
  TUISeatInfo,
} from '@tencentcloud/tuiroom-engine-js';
import { IRoomService } from '../types';
import { UserInfo } from '../../stores/room';
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

export class UserManager implements IUserManager {
  private service: IRoomService;

  constructor(service: IRoomService) {
    this.service = service;
    this.bindRoomEngineEvents();
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
    const { nameCard, userName, userId } = options;
    return nameCard || userName || userId;
  }

  public setLocalUser(userInfo: { userId: string }) {
    this.service.roomStore.addUserInfo(userInfo);
    this.service.roomStore.addStreamInfo(
      userInfo.userId,
      TUIVideoStreamType.kCameraStream
    );
  }

  private onRemoteUserEnterRoom(eventInfo: { userInfo: TUIUserInfo }) {
    const { userInfo } = eventInfo;
    this.service.roomStore.addUserInfo(
      Object.assign(userInfo, { isInRoom: true })
    );
    if (this.service.roomStore.isFreeSpeakMode) {
      this.service.roomStore.addStreamInfo(
        userInfo.userId,
        TUIVideoStreamType.kCameraStream
      );
    }
  }

  private onRemoteUserLeaveRoom(eventInfo: { userInfo: TUIUserInfo }) {
    const { userId } = eventInfo.userInfo;
    this.service.roomStore.removeUserInfo(userId);
    this.service.roomStore.removeStreamInfo(
      userId,
      TUIVideoStreamType.kCameraStream
    );
    this.service.roomStore.removeStreamInfo(
      userId,
      TUIVideoStreamType.kScreenStream
    );
  }

  private onSeatListChanged(eventInfo: {
    seatList: TUISeatInfo[];
    seatedList: TUISeatInfo[];
    leftList: TUISeatInfo[];
  }) {
    const { seatedList, leftList } = eventInfo;

    seatedList.forEach(seat => {
      const { userId } = seat;
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
    leftList?.forEach(seat => {
      const { userId } = seat;
      const user = this.service.roomStore.userInfoObj[userId];
      if (user) {
        Object.assign(user, { onSeat: false });
        this.service.roomStore.updateUserInfo({ userId, onSeat: false });
      }
      this.service.roomStore.removeStreamInfo(
        userId,
        TUIVideoStreamType.kCameraStream
      );
      this.service.roomStore.removeStreamInfo(
        userId,
        TUIVideoStreamType.kScreenStream
      );
    });
  }

  private onUserAudioStateChanged(eventInfo: {
    userId: string;
    hasAudio: boolean;
    reason: TUIChangeReason;
  }) {
    const { userId, hasAudio } = eventInfo;
    let userInfo = this.service.roomStore.userInfoObj[userId];
    if (!userInfo && hasAudio) {
      this.service.roomStore.addUserInfo({ userId, isInRoom: true });
    }
    userInfo = this.service.roomStore.userInfoObj[userId];
    if (!userInfo) {
      return;
    }

    this.service.roomStore.updateUserInfo({ userId, hasAudioStream: hasAudio });

    const streamInfo =
      this.service.roomStore.streamInfoObj[
        `${userId}_${TUIVideoStreamType.kCameraStream}`
      ];
    if (!streamInfo) {
      this.service.roomStore.addStreamInfo(
        userId,
        TUIVideoStreamType.kCameraStream
      );
    }
    this.service.roomStore.updateStreamInfo({
      userId,
      streamType: TUIVideoStreamType.kCameraStream,
      hasAudioStream: hasAudio,
    });
  }

  private onUserVideoStateChanged = (eventInfo: {
    userId: string;
    streamType: TUIVideoStreamType;
    hasVideo: boolean;
    reason: TUIChangeReason;
  }) => {
    const { userId, streamType, hasVideo } = eventInfo;
    let userInfo = this.service.roomStore.userInfoObj[userId];
    if (!userInfo && hasVideo) {
      this.service.roomStore.addUserInfo({ userId, isInRoom: true });
    }
    userInfo = this.service.roomStore.userInfoObj[userId];
    if (!userInfo) {
      return;
    }
    const updateInfo =
      streamType === TUIVideoStreamType.kScreenStream
        ? { hasScreenStream: hasVideo }
        : { hasVideoStream: hasVideo };
    this.service.roomStore.updateUserInfo({ userId, ...updateInfo });

    if (
      streamType === TUIVideoStreamType.kCameraStream ||
      (streamType === TUIVideoStreamType.kScreenStream && hasVideo)
    ) {
      const streamInfo =
        this.service.roomStore.streamInfoObj[`${userId}_${streamType}`];
      if (!streamInfo) {
        this.service.roomStore.addStreamInfo(userId, streamType);
      }
      this.service.roomStore.updateStreamInfo({
        userId,
        streamType,
        hasVideoStream: hasVideo,
      });
    } else if (streamType === TUIVideoStreamType.kScreenStream && !hasVideo) {
      this.service.roomStore.removeStreamInfo(userId, streamType);
    }
  };

  private bindRoomEngineEvents() {
    TUIRoomEngine.once('ready', () => {
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onRemoteUserEnterRoom,
        this.onRemoteUserEnterRoom.bind(this)
      );
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onRemoteUserLeaveRoom,
        this.onRemoteUserLeaveRoom.bind(this)
      );
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onSeatListChanged,
        this.onSeatListChanged.bind(this)
      );
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onUserVideoStateChanged,
        this.onUserVideoStateChanged.bind(this)
      );
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onUserAudioStateChanged,
        this.onUserAudioStateChanged.bind(this)
      );
    });
  }

  private unbindRoomEngineEvents() {
    this.service.roomEngine.instance?.off(
      TUIRoomEvents.onRemoteUserEnterRoom,
      this.onRemoteUserEnterRoom
    );
    this.service.roomEngine.instance?.off(
      TUIRoomEvents.onRemoteUserLeaveRoom,
      this.onRemoteUserLeaveRoom
    );
    this.service.roomEngine.instance?.off(
      TUIRoomEvents.onSeatListChanged,
      this.onSeatListChanged
    );
    this.service.roomEngine.instance?.off(
      TUIRoomEvents.onUserVideoStateChanged,
      this.onUserVideoStateChanged
    );
    this.service.roomEngine.instance?.off(
      TUIRoomEvents.onUserAudioStateChanged,
      this.onUserAudioStateChanged
    );
  }
}
