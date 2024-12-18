import TUIRoomEngine, {
  TUIRoomEvents,
  TUIUserInfo,
  TUIChangeReason,
  TUIVideoStreamType,
  TUISeatInfo,
  TRTCVolumeInfo,
  TUIRole,
} from '@tencentcloud/tuiroom-engine-js';
import { IRoomService } from '../types';
import { StreamInfo, UserInfo } from '../../stores/room';
import { isMobile } from '../../utils/environment';
import {
  throttle,
  createComparator,
  combineComparators,
  Comparator,
} from '../../utils/utils';
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

  private userListCompareFunction:
    | ((userInfoA: UserInfo, userInfoB: UserInfo) => number)
    | null;

  private streamListCompareFunction:
    | ((streamInfoA: StreamInfo, streamInfoB: StreamInfo) => number)
    | null;

  constructor(service: IRoomService) {
    this.service = service;
    this.userListCompareFunction = null;
    this.streamListCompareFunction = null;
    this.onRemoteUserEnterRoom = this.onRemoteUserEnterRoom.bind(this);
    this.onRemoteUserLeaveRoom = this.onRemoteUserLeaveRoom.bind(this);
    this.onSeatListChanged = this.onSeatListChanged.bind(this);
    this.onUserVideoStateChanged = this.onUserVideoStateChanged.bind(this);
    this.onUserAudioStateChanged = this.onUserAudioStateChanged.bind(this);
    this.onUserVoiceVolumeChanged = this.onUserVoiceVolumeChanged.bind(this);
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

  public setUserListSortComparator(comparator: Comparator<UserInfo>) {
    this.userListCompareFunction = comparator;
  }

  public getUserListSortComparator() {
    const defaultUserListCompareFunction = combineComparators(
      createComparator((userInfo: UserInfo) =>
        Boolean(userInfo.userId === this.service.basicStore.userId)
      ),
      createComparator((userInfo: UserInfo) =>
        Boolean(userInfo.userRole === TUIRole.kRoomOwner)
      ),
      createComparator((userInfo: UserInfo) =>
        Boolean(userInfo.userRole === TUIRole.kAdministrator)
      ),
      createComparator((userInfo: UserInfo) =>
        Boolean(userInfo.hasScreenStream)
      ),
      createComparator((userInfo: UserInfo) =>
        Boolean(userInfo.hasVideoStream && userInfo.hasAudioStream)
      ),
      createComparator((userInfo: UserInfo) =>
        Boolean(userInfo.hasVideoStream)
      ),
      createComparator((userInfo: UserInfo) =>
        Boolean(userInfo.hasAudioStream)
      ),
      createComparator((userInfo: UserInfo) => Boolean(userInfo.onSeat)),
      createComparator((userInfoA: UserInfo, userInfoB: UserInfo) =>
        Boolean(Number(userInfoA.timestamp) < Number(userInfoB.timestamp))
      )
    );
    return this.userListCompareFunction || defaultUserListCompareFunction;
  }

  public setStreamListSortComparator(comparator: Comparator<StreamInfo>) {
    this.streamListCompareFunction = comparator;
  }

  public getStreamListSortComparator() {
    const defaultUserListCompareFunction = combineComparators(
      createComparator((streamInfo: StreamInfo) =>
        Boolean(streamInfo.streamType === TUIVideoStreamType.kScreenStream)
      ),
      createComparator((streamInfo: StreamInfo) =>
        Boolean(streamInfo.userId === this.service.roomStore.masterUserId)
      ),
      createComparator((streamInfo: StreamInfo) =>
        Boolean(streamInfo.userId === this.service.basicStore.userId)
      ),
      createComparator((streamInfoA: StreamInfo) =>
        Boolean(streamInfoA.hasAudioStream && streamInfoA.hasVideoStream)
      ),
      createComparator((streamInfoA: StreamInfo) =>
        Boolean(streamInfoA.hasVideoStream)
      ),
      createComparator((streamInfoA: StreamInfo) =>
        Boolean(streamInfoA.hasAudioStream)
      ),
      createComparator((streamInfoA: StreamInfo, streamInfoB: StreamInfo) =>
        Boolean(Number(streamInfoA.timestamp) - Number(streamInfoB.timestamp))
      )
    );
    return this.streamListCompareFunction || defaultUserListCompareFunction;
  }

  private onRemoteUserEnterRoom(eventInfo: { userInfo: TUIUserInfo }) {
    const { userInfo } = eventInfo;
    this.service.roomStore.addUserInfo(
      Object.assign(userInfo, { isInRoom: true, timestamp: Date.now() })
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
      if (userId === this.service.roomStore.localUser.userId) {
        this.service.basicStore.setIsOpenMic(false);
      }
      const user = this.service.roomStore.userInfoObj[userId];
      if (user) {
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

  // Calculate the userId of the loudest speaker in the room
  // Calculate the userId of the remote user who speaks the loudest in the current room.
  private handleUserVoiceVolume(userVolumeList: Array<typeof TRTCVolumeInfo>) {
    const localUserVolume = {
      userId: this.service.basicStore.userId,
      volume: 0,
    };
    const largestRemoteUserVolume = {
      userId: '',
      volume: 0,
    };
    userVolumeList.forEach((item: typeof TRTCVolumeInfo) => {
      if (
        item.userId === this.service.basicStore.userId &&
        this.service.roomStore.localStream?.hasAudioStream
      ) {
        localUserVolume.volume = item.volume;
      } else if (
        item.userId !== this.service.basicStore.userId &&
        this.service.roomStore.userInfoObj[item.userId]?.hasAudioStream
      ) {
        const { userId, volume } = item;
        if (volume > largestRemoteUserVolume.volume) {
          largestRemoteUserVolume.userId = userId;
          largestRemoteUserVolume.volume = volume;
        }
      }
    });

    const largestUserVolume =
      localUserVolume.volume > largestRemoteUserVolume.volume
        ? localUserVolume
        : largestRemoteUserVolume;

    if (this.service.roomStore.currentSpeakerInfo.remoteSpeakerUserId) {
      const lastRemoteSpeakerUserVolumeInfo = userVolumeList.find(
        (item: typeof TRTCVolumeInfo) =>
          item.userId ===
          this.service.roomStore.currentSpeakerInfo.remoteSpeakerUserId
      );
      if (
        !lastRemoteSpeakerUserVolumeInfo ||
        (lastRemoteSpeakerUserVolumeInfo?.volume === 0 &&
          largestRemoteUserVolume.volume > 0)
      ) {
        this.service.roomStore.setCurrentSpeakerInfo({
          remoteSpeakerUserId: largestRemoteUserVolume.userId,
        });
      }
    } else {
      if (largestRemoteUserVolume.volume > 0) {
        this.service.roomStore.setCurrentSpeakerInfo({
          remoteSpeakerUserId: largestRemoteUserVolume.userId,
        });
      }
    }

    if (this.service.roomStore.currentSpeakerInfo.speakerUserId) {
      const lastSpeakerUserVolumeInfo: typeof TRTCVolumeInfo | undefined =
        userVolumeList.find(
          (item: typeof TRTCVolumeInfo) =>
            item.userId ===
            this.service.roomStore.currentSpeakerInfo.speakerUserId
        );
      if (
        !lastSpeakerUserVolumeInfo ||
        (lastSpeakerUserVolumeInfo.volume === 0 && largestUserVolume.volume > 0)
      ) {
        this.service.roomStore.setCurrentSpeakerInfo({
          speakerUserId: largestUserVolume.userId,
        });
      }
    } else {
      if (largestUserVolume.volume > 0) {
        this.service.roomStore.setCurrentSpeakerInfo({
          speakerUserId: largestUserVolume.userId,
        });
      }
    }
  }

  private handleUserVoiceVolumeThrottle = throttle(
    this.handleUserVoiceVolume,
    1000
  );

  private onUserVoiceVolumeChanged(eventInfo: { userVolumeList: [] }) {
    const { userVolumeList } = eventInfo;
    this.service.roomStore.setAudioVolume(userVolumeList);
    // Mobile needs to count the current speaker
    if (isMobile) {
      this.handleUserVoiceVolumeThrottle(userVolumeList);
    }
  }

  private bindRoomEngineEvents() {
    TUIRoomEngine.once('ready', () => {
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onRemoteUserEnterRoom,
        this.onRemoteUserEnterRoom
      );
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onRemoteUserLeaveRoom,
        this.onRemoteUserLeaveRoom
      );
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onSeatListChanged,
        this.onSeatListChanged
      );
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onUserVideoStateChanged,
        this.onUserVideoStateChanged
      );
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onUserAudioStateChanged,
        this.onUserAudioStateChanged
      );
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onUserVoiceVolumeChanged,
        this.onUserVoiceVolumeChanged
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
    this.service.roomEngine.instance?.off(
      TUIRoomEvents.onUserVoiceVolumeChanged,
      this.onUserVoiceVolumeChanged
    );
  }
}
