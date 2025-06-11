import TUIRoomEngine, {
  TUIRoomEvents,
  TUIUserInfo,
  TUIChangeReason,
  TUIVideoStreamType,
  TUISeatInfo,
  TRTCVolumeInfo,
} from '@tencentcloud/tuiroom-engine-js';
import { isMobile } from '../../utils/environment';
import { throttle } from '../../utils/utils';
import useRoomEngine from '../../hooks/useRoomEngine';
import { roomService } from '../../services/roomService';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../locales';

const roomEngine = useRoomEngine();
const { t } = useI18n();

export type CustomInfoForUser = {
  userId: string;
  customInfo: Record<string, string>;
};
export type SelfInfoOptions = {
  userName?: string;
  avatarUrl?: string;
  customInfo?: Record<string, any>;
};

export default class UserEventManager {
  static instance: UserEventManager;
  private store: any;
  constructor(options: { store: any }) {
    if (!UserEventManager.instance) {
      UserEventManager.instance = this;
    }
    this.store = options.store;
    this.onRemoteUserEnterRoom = this.onRemoteUserEnterRoom.bind(this);
    this.onRemoteUserLeaveRoom = this.onRemoteUserLeaveRoom.bind(this);
    this.onSeatListChanged = this.onSeatListChanged.bind(this);
    this.onUserVideoStateChanged = this.onUserVideoStateChanged.bind(this);
    this.onUserAudioStateChanged = this.onUserAudioStateChanged.bind(this);
    this.onUserVoiceVolumeChanged = this.onUserVoiceVolumeChanged.bind(this);
    this.onUserInfoChanged = this.onUserInfoChanged.bind(this);
    this.onSendMessageForUserDisableChanged =
      this.onSendMessageForUserDisableChanged.bind(this);

    this.bindRoomEngineEvents();
    return UserEventManager.instance;
  }

  private onRemoteUserEnterRoom(eventInfo: { userInfo: TUIUserInfo }) {
    const { userInfo } = eventInfo;
    this.store.addUserInfo(
      Object.assign(userInfo, { isInRoom: true, timestamp: Date.now() })
    );
    if (roomService.roomStore.isFreeSpeakMode) {
      this.store.addStreamInfo(
        userInfo.userId,
        TUIVideoStreamType.kCameraStream
      );
    }
  }

  private onRemoteUserLeaveRoom(eventInfo: { userInfo: TUIUserInfo }) {
    const { userId } = eventInfo.userInfo;
    this.store.removeUserInfo(userId);
    this.store.removeStreamInfo(userId, TUIVideoStreamType.kCameraStream);
    this.store.removeStreamInfo(userId, TUIVideoStreamType.kScreenStream);
  }

  private onSeatListChanged(eventInfo: {
    seatList: TUISeatInfo[];
    seatedList: TUISeatInfo[];
    leftList: TUISeatInfo[];
  }) {
    const { seatedList, leftList } = eventInfo;

    seatedList.forEach(seat => {
      const { userId } = seat;
      const user = this.store.getUserInfo(userId);
      if (user) {
        this.store.updateUserInfo({ userId, isOnSeat: true });
      } else {
        this.store.addUserInfo({
          userId,
          isOnSeat: true,
          isInRoom: true,
        });
      }
      this.store.addStreamInfo(userId, TUIVideoStreamType.kCameraStream);
    });
    leftList?.forEach(seat => {
      const { userId } = seat;
      const user = this.store.userInfoObj[userId];
      if (user) {
        this.store.updateUserInfo({ userId, isOnSeat: false });
      }
      this.store.removeStreamInfo(userId, TUIVideoStreamType.kCameraStream);
      this.store.removeStreamInfo(userId, TUIVideoStreamType.kScreenStream);
    });
  }

  private onUserAudioStateChanged(eventInfo: {
    userId: string;
    hasAudio: boolean;
    reason: TUIChangeReason;
  }) {
    const { userId, hasAudio } = eventInfo;
    let userInfo = this.store.userInfoObj[userId];
    if (!userInfo && hasAudio) {
      this.store.addUserInfo({ userId, isInRoom: true });
    }
    userInfo = this.store.userInfoObj[userId];
    if (!userInfo) {
      return;
    }

    this.store.updateUserInfo({ userId, hasAudioStream: hasAudio });

    const streamInfo =
      this.store.streamInfoObj[`${userId}_${TUIVideoStreamType.kCameraStream}`];
    if (!streamInfo) {
      this.store.addStreamInfo(userId, TUIVideoStreamType.kCameraStream);
    }
    this.store.updateStreamInfo({
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
    let userInfo = this.store.userInfoObj[userId];
    if (!userInfo && hasVideo) {
      this.store.addUserInfo({ userId, isInRoom: true });
    }
    userInfo = this.store.userInfoObj[userId];
    if (!userInfo) {
      return;
    }
    const updateInfo =
      streamType === TUIVideoStreamType.kScreenStream
        ? { hasScreenStream: hasVideo }
        : { hasVideoStream: hasVideo };
    this.store.updateUserInfo({ userId, ...updateInfo });

    if (
      streamType === TUIVideoStreamType.kCameraStream ||
      (streamType === TUIVideoStreamType.kScreenStream && hasVideo)
    ) {
      const streamInfo = this.store.streamInfoObj[`${userId}_${streamType}`];
      if (!streamInfo) {
        this.store.addStreamInfo(userId, streamType);
      }
      this.store.updateStreamInfo({
        userId,
        streamType,
        hasVideoStream: hasVideo,
      });
    } else if (streamType === TUIVideoStreamType.kScreenStream && !hasVideo) {
      this.store.removeStreamInfo(userId, streamType);
    }
  };

  // Calculate the userId of the loudest speaker in the room
  // Calculate the userId of the remote user who speaks the loudest in the current room.
  private handleUserVoiceVolume(userVolumeList: Array<typeof TRTCVolumeInfo>) {
    const localUserVolume = {
      userId: this.store.localUserId,
      volume: 0,
    };
    const largestRemoteUserVolume = {
      userId: '',
      volume: 0,
    };
    userVolumeList.forEach((item: typeof TRTCVolumeInfo) => {
      if (
        item.userId === this.store.localUserId &&
        this.store.localStream?.hasAudioStream
      ) {
        localUserVolume.volume = item.volume;
      } else if (
        item.userId !== this.store.localUserId &&
        this.store.userInfoObj[item.userId]?.hasAudioStream
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

    if (roomService.roomStore.currentSpeakerInfo.remoteSpeakerUserId) {
      const lastRemoteSpeakerUserVolumeInfo = userVolumeList.find(
        (item: typeof TRTCVolumeInfo) =>
          item.userId ===
          roomService.roomStore.currentSpeakerInfo.remoteSpeakerUserId
      );
      if (
        !lastRemoteSpeakerUserVolumeInfo ||
        (lastRemoteSpeakerUserVolumeInfo?.volume === 0 &&
          largestRemoteUserVolume.volume > 0)
      ) {
        roomService.roomStore.setCurrentSpeakerInfo({
          remoteSpeakerUserId: largestRemoteUserVolume.userId,
        });
      }
    } else {
      if (largestRemoteUserVolume.volume > 0) {
        roomService.roomStore.setCurrentSpeakerInfo({
          remoteSpeakerUserId: largestRemoteUserVolume.userId,
        });
      }
    }

    if (roomService.roomStore.currentSpeakerInfo.speakerUserId) {
      const lastSpeakerUserVolumeInfo: typeof TRTCVolumeInfo | undefined =
        userVolumeList.find(
          (item: typeof TRTCVolumeInfo) =>
            item.userId ===
            roomService.roomStore.currentSpeakerInfo.speakerUserId
        );
      if (
        !lastSpeakerUserVolumeInfo ||
        (lastSpeakerUserVolumeInfo.volume === 0 && largestUserVolume.volume > 0)
      ) {
        roomService.roomStore.setCurrentSpeakerInfo({
          speakerUserId: largestUserVolume.userId,
        });
      }
    } else {
      if (largestUserVolume.volume > 0) {
        roomService.roomStore.setCurrentSpeakerInfo({
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
    roomService.roomStore.setAudioVolume(userVolumeList);
    // Mobile needs to count the current speaker
    if (isMobile) {
      this.handleUserVoiceVolumeThrottle(userVolumeList);
    }
  }

  private onUserInfoChanged(eventInfo: { userInfo: TUIUserInfo }) {
    // todo: 确认这里的 hasAudioStream 和 hasVideoStream 数据不是最新的原因
    const { userId, nameCard, roomCustomInfo, userRole } = eventInfo.userInfo;
    this.store.updateUserInfo({ userId, nameCard, roomCustomInfo, userRole });
  }

  private onSendMessageForUserDisableChanged(eventInfo: {
    userId: string;
    isDisable: boolean;
  }) {
    const { userId, isDisable } = eventInfo;
    if (userId === this.store.localUser.userId) {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: isDisable
          ? t('You have been banned from text chat')
          : t('You are allowed to text chat'),
      });
      roomService.chatStore.setSendMessageDisableChanged(isDisable);
    }
    this.store.updateUserInfo({
      userId,
      isMessageDisabled: isDisable,
    });
  }

  private bindRoomEngineEvents() {
    TUIRoomEngine.once('ready', () => {
      roomEngine.instance?.on(
        TUIRoomEvents.onRemoteUserEnterRoom,
        this.onRemoteUserEnterRoom
      );
      roomEngine.instance?.on(
        TUIRoomEvents.onRemoteUserLeaveRoom,
        this.onRemoteUserLeaveRoom
      );
      roomEngine.instance?.on(
        TUIRoomEvents.onSeatListChanged,
        this.onSeatListChanged
      );
      roomEngine.instance?.on(
        TUIRoomEvents.onUserVideoStateChanged,
        this.onUserVideoStateChanged
      );
      roomEngine.instance?.on(
        TUIRoomEvents.onUserAudioStateChanged,
        this.onUserAudioStateChanged
      );
      roomEngine.instance?.on(
        TUIRoomEvents.onUserVoiceVolumeChanged,
        this.onUserVoiceVolumeChanged
      );
      roomEngine.instance?.on(
        TUIRoomEvents.onUserInfoChanged,
        this.onUserInfoChanged
      );
      roomEngine.instance?.on(
        TUIRoomEvents.onSendMessageForUserDisableChanged,
        this.onSendMessageForUserDisableChanged
      );
    });
  }

  private unbindRoomEngineEvents() {
    roomEngine.instance?.off(
      TUIRoomEvents.onRemoteUserEnterRoom,
      this.onRemoteUserEnterRoom
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onRemoteUserLeaveRoom,
      this.onRemoteUserLeaveRoom
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onSeatListChanged,
      this.onSeatListChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onUserVideoStateChanged,
      this.onUserVideoStateChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onUserAudioStateChanged,
      this.onUserAudioStateChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onUserVoiceVolumeChanged,
      this.onUserVoiceVolumeChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onUserInfoChanged,
      this.onUserInfoChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onSendMessageForUserDisableChanged,
      this.onSendMessageForUserDisableChanged
    );
  }
}
