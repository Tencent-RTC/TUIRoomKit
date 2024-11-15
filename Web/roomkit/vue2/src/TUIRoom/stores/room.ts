import { defineStore } from 'pinia';
import {
  TUIRole,
  TUIRoomInfo,
  TUISeatMode,
  TUIVideoQuality,
  TUIVideoStreamType,
  TUIMediaDeviceType,
  TUIInvitationStatus,
} from '@tencentcloud/tuiroom-engine-js';
import { useBasicStore } from './basic';
import { set, del } from '../utils/vue';
import { isMobile } from '../utils/environment';

function getNewStreamInfo(userId: string, streamType?: TUIVideoStreamType) {
  const newStreamInfo = {
    userId,
    hasAudioStream: false,
    hasVideoStream: false,
    streamType: streamType || TUIVideoStreamType.kCameraStream,
    isLoading: false,
    playDomList: [],
  };
  return newStreamInfo;
}

function getNewUserInfo(userId: string) {
  const newUserInfo = {
    userId,
    userName: '',
    avatarUrl: '',
    nameCard: '',
    hasAudioStream: false,
    hasVideoStream: false,
    hasScreenStream: false,
    isMessageDisabled: false,
    userRole: TUIRole.kGeneralUser,
    onSeat: false,
    isUserApplyingToAnchor: false,
    isInvitingUserToAnchor: false,
    isInRoom: false,
    status: TUIInvitationStatus.kNone,
  };
  return newUserInfo;
}

function getRecordStreamType(streamType: TUIVideoStreamType) {
  if (streamType === TUIVideoStreamType.kCameraStreamLow) {
    return TUIVideoStreamType.kCameraStream;
  }
  return streamType;
}

function sortStreamList(streamList: StreamInfo[]) {
  const basicStore = useBasicStore();
  return streamList.sort((item1: StreamInfo, item2: StreamInfo) => {
    if (item1.userId === basicStore.userId) {
      return -1;
    }
    if (item2.userId === basicStore.userId) {
      return 1;
    }
    if (item1.streamType === TUIVideoStreamType.kScreenStream) {
      return -1;
    }
    if (item2.streamType === TUIVideoStreamType.kScreenStream) {
      return 1;
    }
    return 0;
  });
}

export type StreamInfo = {
  userId: string;
  streamType: TUIVideoStreamType;
  hasAudioStream?: boolean;
  hasVideoStream?: boolean;
  isLoading?: boolean;
  playDomList?: HTMLElement[];
};

export type UserInfo = {
  userId: string;
  userName?: string;
  avatarUrl?: string;
  nameCard?: string;
  hasAudioStream?: boolean;
  hasVideoStream?: boolean;
  hasScreenStream?: boolean;
  isMessageDisabled?: boolean;
  userRole?: TUIRole;
  // Is it on the seat
  onSeat?: boolean;
  // Whether the user is being asked to turn on the microphone
  isRequestingUserOpenMic?: boolean;
  // The requestId for requesting the user to turn on the microphone
  requestUserOpenMicRequestId?: string;
  // Whether the user is being asked to open the camera
  isRequestingUserOpenCamera?: boolean;
  // The requestId for the user to turn on the camera
  requestUserOpenCameraRequestId?: string;
  // Whether the user is applying for seat
  isUserApplyingToAnchor?: boolean;
  // The requestId of the user requesting to be on the seat
  applyToAnchorRequestId?: string;
  // The time at which a user applies to be on the seat
  applyToAnchorTimestamp?: number;
  // Whether or not you are inviting users to the seat
  isInvitingUserToAnchor?: boolean;
  // The requestId to invite the user to the seat
  inviteToAnchorRequestId?: string;
  isInRoom?: boolean;
  status?: TUIInvitationStatus;
};

interface RoomState {
  userInfoObj: Record<string, UserInfo>;
  streamInfoObj: Record<string, StreamInfo>;
  userVolumeObj: Record<string, number>;
  // Moderators can unmute audio/video by themselves when they have all users unmuted, but when they unmute a user individually.
  canControlSelfAudio: boolean;
  canControlSelfVideo: boolean;
  localVideoQuality: TUIVideoQuality;
  currentCameraId: string;
  currentMicrophoneId: string;
  currentSpeakerId: string;
  cameraList: object[];
  microphoneList: object[];
  speakerList: object[];
  masterUserId: string;
  isMicrophoneDisableForAllUser: boolean;
  isCameraDisableForAllUser: boolean;
  isScreenShareDisableForAllUser: boolean;
  isSeatEnabled: boolean | undefined;
  seatMode: TUISeatMode;
  maxMembersCount: number;
  maxSeatCount: number;
  password: string;
  roomName: string;
  hasOtherScreenShare: boolean;
  isOnStateTabActive: boolean;
  isLocalUserSharing: boolean;
  isWhiteboardVisiable: boolean;
  isSharingScreen: boolean;
  isAnnotationVisiable: boolean;
}

export const useRoomStore = defineStore('room', {
  state: (): RoomState => ({
    userInfoObj: {},
    streamInfoObj: {},
    userVolumeObj: {},
    canControlSelfAudio: true,
    canControlSelfVideo: true,
    localVideoQuality: isMobile
      ? TUIVideoQuality.kVideoQuality_360p
      : TUIVideoQuality.kVideoQuality_720p,
    currentCameraId: '',
    currentMicrophoneId: '',
    currentSpeakerId: '',
    cameraList: [],
    microphoneList: [],
    speakerList: [],
    masterUserId: '',
    isMicrophoneDisableForAllUser: false,
    isCameraDisableForAllUser: false,
    isScreenShareDisableForAllUser: false,
    isSeatEnabled: undefined,
    seatMode: TUISeatMode.kFreeToTake,
    maxMembersCount: 5, // Includes local streams and screen shares, above which subsequent streams are played
    maxSeatCount: 20,
    password: '',
    roomName: '',
    // Visual area user flow list
    hasOtherScreenShare: false,
    isOnStateTabActive: true,
    isLocalUserSharing: false,
    isWhiteboardVisiable: false,
    isSharingScreen: false,
    isAnnotationVisiable: false,
  }),
  getters: {
    localUser(state: RoomState): UserInfo {
      const basicStore = useBasicStore();
      return (
        state.userInfoObj[basicStore.userId] ||
        getNewUserInfo(basicStore.userId)
      );
    },
    localStream(state: RoomState): StreamInfo {
      const basicStore = useBasicStore();
      return (
        state.streamInfoObj[
          `${basicStore.userId}_${TUIVideoStreamType.kCameraStream}`
        ] ||
        getNewStreamInfo(basicStore.userId, TUIVideoStreamType.kCameraStream)
      );
    },
    localScreenStream(state: RoomState): StreamInfo {
      const basicStore = useBasicStore();
      return state.streamInfoObj[
        `${basicStore.userId}_${TUIVideoStreamType.kScreenStream}`
      ];
    },
    isMaster(state: RoomState): boolean {
      return this.localUser.userId === state.masterUserId;
    },
    isAdmin(): boolean {
      return this.localUser.userRole === TUIRole.kAdministrator;
    },
    isGeneralUser(): boolean {
      return this.localUser.userRole === TUIRole.kGeneralUser;
    },
    isFreeSpeakMode(): boolean {
      return this.isSeatEnabled === false;
    },
    isSpeakAfterTakingSeatMode(): boolean {
      return (
        Boolean(this.isSeatEnabled) &&
        this.seatMode === TUISeatMode.kApplyToTake
      );
    },
    // Whether the current user is on the stage
    isAnchor(): boolean | undefined {
      if (this.isFreeSpeakMode) {
        return true;
      }
      if (this.isSpeakAfterTakingSeatMode) {
        return this.localUser.onSeat;
      }
    },
    // Whether the current user is under the stage
    isAudience(): boolean | undefined {
      if (this.isFreeSpeakMode) {
        return false;
      }
      if (this.isSpeakAfterTakingSeatMode) {
        return !this.localUser.onSeat;
      }
    },
    isLocalAudioIconDisable(): boolean {
      // All mute status
      const micForbidden = this.isGeneralUser && !this.canControlSelfAudio;
      return (micForbidden as any) || this.isAudience;
    },
    isLocalVideoIconDisable(): boolean {
      // All stop video status
      const cameraForbidden = this.isGeneralUser && !this.canControlSelfVideo;
      return (cameraForbidden as any) || this.isAudience;
    },
    streamList(): Array<StreamInfo> {
      let streamList = [];
      if (this.isFreeSpeakMode) {
        streamList = Object.values(this.streamInfoObj);
      } else {
        streamList = Object.values(this.streamInfoObj).filter(item => {
          return this.userInfoObj[item.userId].onSeat;
        });
      }
      return sortStreamList(streamList);
    },
    remoteStreamList(): Array<StreamInfo> {
      const basicStore = useBasicStore();
      return this.streamList.filter(item => item.userId !== basicStore.userId);
    },
    cameraStreamList(): Array<StreamInfo> {
      return this.streamList.filter(
        stream => stream.streamType === TUIVideoStreamType.kCameraStream
      );
    },
    streamNumber(): number {
      return this.streamList.length;
    },
    userList(): Array<UserInfo> {
      const basicStore = useBasicStore();
      return [...Object.values(this.userInfoObj)].sort((item1, item2) => {
        if (item1.userId === basicStore.userId) {
          return -1;
        }
        if (item2.userId === basicStore.userId) {
          return 1;
        }
        if (item1.userRole === TUIRole.kRoomOwner) {
          return -1;
        }
        if (item2.userRole === TUIRole.kRoomOwner) {
          return 1;
        }
        if (item1.userRole === TUIRole.kAdministrator) {
          return -1;
        }
        if (item2.userRole === TUIRole.kAdministrator) {
          return 1;
        }
        return 0;
      });
    },
    userNumber(): number {
      return this.userList.filter(item => item.isInRoom).length;
    },
    remoteUserList(): Array<UserInfo> {
      const basicStore = useBasicStore();
      return [...Object.values(this.userInfoObj)].filter(
        item => item.userId !== basicStore.userId
      );
    },
    remoteEnteredUserList(): Array<UserInfo> {
      return this.remoteUserList.filter(item => item.isInRoom);
    },
    remoteNotEnteredUserList(): Array<UserInfo> {
      return this.userList.filter(item => !item.isInRoom);
    },
    remoteAnchorList(): Array<UserInfo> {
      return this.remoteUserList.filter(item => item.onSeat);
    },
    generalUserScreenStreamList(): Array<UserInfo> {
      return this.remoteUserList.filter(
        item => item.hasScreenStream && item.userRole === TUIRole.kGeneralUser
      );
    },
    anchorUserList(): Array<UserInfo> {
      return this.userList.filter(item => item.onSeat);
    },
    applyToAnchorList(): Array<UserInfo> {
      return (
        this.remoteUserList
          .filter(item => item.isUserApplyingToAnchor)
          .sort(
            (item1, item2) =>
              (item1?.applyToAnchorTimestamp || 0) -
              (item2?.applyToAnchorTimestamp || 0)
          ) || []
      );
    },
    defaultStreamType(): TUIVideoStreamType {
      return Object.values(this.streamInfoObj).filter(
        stream => stream.hasVideoStream
      ).length > this.maxMembersCount
        ? TUIVideoStreamType.kCameraStreamLow
        : TUIVideoStreamType.kCameraStream;
    },
    getDisplayName(): (userId: string) => string {
      return (userId: string) => {
        const userInfo = this.userInfoObj[userId];
        if (userInfo) {
          const { nameCard, userName, userId } = userInfo;
          return nameCard || userName || userId;
        }
        return userId;
      };
    },
  },
  actions: {
    getUserName(userId: string): string {
      return (
        this.userInfoObj[userId]?.nameCard ||
        this.userInfoObj[userId]?.userName ||
        userId
      );
    },
    getUserRole(userId: string): TUIRole | undefined {
      return this.userInfoObj[userId]?.userRole;
    },
    addUserInfo(userInfo: UserInfo) {
      const { userId } = userInfo;
      if (!userId) {
        return;
      }
      if (this.userInfoObj[userId]) {
        Object.assign(this.userInfoObj[userId], userInfo);
      } else {
        const newUserInfo = Object.assign(getNewUserInfo(userId), userInfo);
        set(this.userInfoObj, userId, newUserInfo);
      }
    },
    // todo: can use addUserInfo instead
    addRemoteUser(userInfo: UserInfo) {
      const { userId } = userInfo;
      const basicStore = useBasicStore();
      if (!userId || userId === basicStore.userId) {
        return;
      }
      if (this.userInfoObj[userId]) {
        Object.assign(this.userInfoObj[userId], userInfo, { isInRoom: true });
      } else {
        const newUserInfo = Object.assign(getNewUserInfo(userId), userInfo, {
          isInRoom: true,
        });
        set(this.userInfoObj, userId, newUserInfo);
      }
    },
    updateUserInfo(userInfo: UserInfo) {
      if (!userInfo.userId) {
        return;
      }
      Object.assign(this.userInfoObj[userInfo.userId], userInfo);
    },
    removeUserInfo(userId: string) {
      const basicStore = useBasicStore();
      if (!userId || userId === basicStore.userId) {
        return;
      }
      if (this.userInfoObj[userId]) {
        del(this.userInfoObj, userId);
      }
    },
    addStreamInfo(userId: string, streamType: TUIVideoStreamType) {
      const recordStreamType = getRecordStreamType(streamType);
      if (this.streamInfoObj[`${userId}_${recordStreamType}`]) {
        return;
      }
      const newStreamInfo = getNewStreamInfo(userId, recordStreamType);
      set(this.streamInfoObj, `${userId}_${recordStreamType}`, newStreamInfo);
    },
    updateStreamInfo(streamInfo: StreamInfo) {
      const { userId, streamType } = streamInfo;
      const recordStreamType = getRecordStreamType(streamType);
      if (!this.streamInfoObj[`${userId}_${recordStreamType}`]) {
        return;
      }
      if (streamType !== recordStreamType) {
        Object.assign(streamInfo, { streamType: recordStreamType });
      }
      set(
        this.streamInfoObj,
        `${userId}_${recordStreamType}`,
        Object.assign(
          this.streamInfoObj[`${userId}_${recordStreamType}`],
          streamInfo
        )
      );
    },
    removeStreamInfo(userId: string, streamType: TUIVideoStreamType) {
      const recordStreamType = getRecordStreamType(streamType);
      if (this.streamInfoObj[`${userId}_${recordStreamType}`]) {
        del(this.streamInfoObj, `${userId}_${recordStreamType}`);
      }
    },
    getStreamInfo(userId: string, streamType: TUIVideoStreamType) {
      const recordStreamType = getRecordStreamType(streamType);
      if (this.streamInfoObj[`${userId}_${recordStreamType}`]) {
        return this.streamInfoObj[`${userId}_${recordStreamType}`];
      }
    },
    setAudioVolume(audioVolumeArray: []) {
      const basicStore = useBasicStore();
      audioVolumeArray.forEach((audioVolumeItem: any) => {
        let { userId } = audioVolumeItem;
        const { volume } = audioVolumeItem;
        if (userId === '') {
          userId = basicStore.userId;
        }
        set(this.userVolumeObj, userId, volume);
      });
    },
    setCurrentDeviceId(type: TUIMediaDeviceType, deviceId: string) {
      switch (type) {
        case TUIMediaDeviceType.kMediaDeviceTypeVideoCamera:
          this.setCurrentCameraId(deviceId);
          break;
        case TUIMediaDeviceType.kMediaDeviceTypeAudioInput:
          this.setCurrentMicrophoneId(deviceId);
          break;
        case TUIMediaDeviceType.kMediaDeviceTypeAudioOutput:
          this.setCurrentSpeakerId(deviceId);
          break;
        default:
          break;
      }
    },
    setCurrentCameraId(deviceId: string) {
      this.currentCameraId = deviceId;
    },
    setCurrentMicrophoneId(deviceId: string) {
      this.currentMicrophoneId = deviceId;
    },
    setCurrentSpeakerId(deviceId: string) {
      this.currentSpeakerId = deviceId;
    },
    setRoomInfo(roomInfo: TUIRoomInfo) {
      if (!roomInfo) return;

      const {
        roomOwner = this.masterUserId,
        isMicrophoneDisableForAllUser = this.isMicrophoneDisableForAllUser,
        isCameraDisableForAllUser = this.isCameraDisableForAllUser,
        isScreenShareDisableForAllUser = this.isScreenShareDisableForAllUser,
        isSeatEnabled = this.isSeatEnabled,
        seatMode = this.seatMode,
        maxSeatCount = this.maxSeatCount,
        password = this.password,
        roomName = this.roomName,
      } = roomInfo;

      if (this.localUser.userId === roomOwner) {
        this.localUser.userRole = TUIRole.kRoomOwner;
      }

      this.masterUserId = roomOwner;
      this.isMicrophoneDisableForAllUser = isMicrophoneDisableForAllUser;
      this.isCameraDisableForAllUser = isCameraDisableForAllUser;
      this.isScreenShareDisableForAllUser = isScreenShareDisableForAllUser;
      this.isSeatEnabled = isSeatEnabled;
      this.seatMode = seatMode;
      this.maxSeatCount = maxSeatCount;
      this.password = password;
      this.roomName = roomName;

      this.canControlSelfAudio = !this.isMicrophoneDisableForAllUser;
      this.canControlSelfVideo = !this.isCameraDisableForAllUser;
    },
    setDisableMicrophoneForAllUserByAdmin(isDisable: boolean) {
      this.isMicrophoneDisableForAllUser = isDisable;
    },
    setDisableCameraForAllUserByAdmin(isDisable: boolean) {
      this.isCameraDisableForAllUser = isDisable;
    },
    setDisableScreenShareForAllUserByAdmin(isDisable: boolean) {
      this.isScreenShareDisableForAllUser = isDisable;
    },
    setMasterUserId(userId: string) {
      this.masterUserId = userId;
    },
    setCanControlSelfAudio(capability: boolean) {
      this.canControlSelfAudio = capability;
    },
    setCanControlSelfVideo(capability: boolean) {
      this.canControlSelfVideo = capability;
    },
    updateVideoQuality(quality: TUIVideoQuality) {
      this.localVideoQuality = quality;
    },
    setDeviceList(
      type: TUIMediaDeviceType,
      deviceList: { deviceId: string; deviceName: string }[]
    ) {
      switch (type) {
        case TUIMediaDeviceType.kMediaDeviceTypeVideoCamera:
          this.setCameraList(deviceList);
          break;
        case TUIMediaDeviceType.kMediaDeviceTypeAudioInput:
          this.setMicrophoneList(deviceList);
          break;
        case TUIMediaDeviceType.kMediaDeviceTypeAudioOutput:
          this.setSpeakerList(deviceList);
          break;
        default:
          break;
      }
    },
    setCameraList(deviceList: { deviceId: string; deviceName: string }[]) {
      this.cameraList = deviceList;
      if (!this.currentCameraId && deviceList.length > 0) {
        this.setCurrentCameraId(deviceList[0].deviceId);
      }
    },
    setMicrophoneList(deviceList: { deviceId: string; deviceName: string }[]) {
      this.microphoneList = deviceList;
      if (!this.currentMicrophoneId && deviceList.length > 0) {
        this.setCurrentMicrophoneId(deviceList[0].deviceId);
      }
    },
    setSpeakerList(deviceList: { deviceId: string; deviceName: string }[]) {
      this.speakerList = deviceList;
      if (!this.currentSpeakerId && deviceList.length > 0) {
        this.setCurrentSpeakerId(deviceList[0].deviceId);
      }
    },
    // Moderator individually modifies the mute status of a user's outgoing text messages
    setMuteUserChat(userId: string, muted: boolean) {
      const remoteUserInfo = this.userInfoObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isMessageDisabled = muted;
      }
    },
    setRemoteUserRole(userId: string, role: TUIRole) {
      const remoteUserInfo = this.userInfoObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.userRole = role;
      }
    },
    setRequestUserOpenMic(options: {
      userId: string;
      isRequesting: boolean;
      requestId?: string;
    }) {
      const { userId, isRequesting, requestId } = options;
      const remoteUserInfo = this.userInfoObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isRequestingUserOpenMic = isRequesting;
        remoteUserInfo.requestUserOpenMicRequestId = isRequesting
          ? requestId
          : '';
      }
    },
    setRequestUserOpenCamera(options: {
      userId: string;
      isRequesting: boolean;
      requestId?: string;
    }) {
      const { userId, isRequesting, requestId } = options;
      const remoteUserInfo = this.userInfoObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isRequestingUserOpenCamera = isRequesting;
        remoteUserInfo.requestUserOpenCameraRequestId = isRequesting
          ? requestId
          : '';
      }
    },
    addApplyToAnchorUser(options: {
      userId: string;
      requestId: string;
      timestamp: number;
    }) {
      const { userId, requestId, timestamp } = options;
      const remoteUserInfo = this.userInfoObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isUserApplyingToAnchor = true;
        remoteUserInfo.applyToAnchorRequestId = requestId;
        remoteUserInfo.applyToAnchorTimestamp = timestamp;
      }
    },
    removeApplyToAnchorUser(requestId: string) {
      const applyToAnchorItem = Object.values(this.userInfoObj).find(
        item =>
          item.isUserApplyingToAnchor &&
          item.applyToAnchorRequestId === requestId
      );
      if (applyToAnchorItem) {
        applyToAnchorItem.isUserApplyingToAnchor = false;
        applyToAnchorItem.applyToAnchorRequestId = '';
        applyToAnchorItem.applyToAnchorTimestamp = 0;
      }
    },
    addInviteToAnchorUser(options: { userId: string; requestId: string }) {
      const { userId, requestId } = options;
      const remoteUserInfo = this.userInfoObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isInvitingUserToAnchor = true;
        remoteUserInfo.inviteToAnchorRequestId = requestId;
      }
    },
    removeInviteToAnchorUser(userId: string) {
      const remoteUserInfo = this.userInfoObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isInvitingUserToAnchor = false;
        remoteUserInfo.inviteToAnchorRequestId = '';
      }
    },
    setHasOtherScreenShare(hasScreenShare: boolean) {
      this.hasOtherScreenShare = hasScreenShare;
    },
    setOnStageTabStatus(isOnStateTabActive: boolean) {
      this.isOnStateTabActive = isOnStateTabActive;
    },
    updateInviteeList(userList: any[]) {
      userList.forEach(user => {
        if (this.userInfoObj[user.userId]) {
          Object.assign(this.userInfoObj[user.userId], user);
        } else {
          const newUserInfo = Object.assign(getNewUserInfo(user.userId), user);
          set(this.userInfoObj, user.userId, newUserInfo);
        }
      });
    },
    reset() {
      const basicStore = useBasicStore();
      basicStore.setIsOpenMic(false);
      this.streamInfoObj = {};
      this.userInfoObj = {};
      this.userVolumeObj = {};
      this.canControlSelfAudio = true;
      this.canControlSelfVideo = true;
      this.localVideoQuality = TUIVideoQuality.kVideoQuality_720p;
      this.currentCameraId = '';
      this.currentMicrophoneId = '';
      this.currentSpeakerId = '';
      this.cameraList = [];
      this.microphoneList = [];
      this.speakerList = [];
      this.masterUserId = '';
      this.isMicrophoneDisableForAllUser = false;
      this.isCameraDisableForAllUser = false;
      this.isScreenShareDisableForAllUser = false;
      this.isSeatEnabled = undefined;
      this.seatMode = TUISeatMode.kFreeToTake;
      this.hasOtherScreenShare = false;
      this.isOnStateTabActive = true;
      this.maxSeatCount = 20;
      this.password = '';
      this.roomName = '';
      this.isLocalUserSharing = false;
      this.isWhiteboardVisiable = false;
      this.isSharingScreen = false;
      this.isAnnotationVisiable = false;
    },
  },
});
