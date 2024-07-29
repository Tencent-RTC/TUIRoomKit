import { defineStore } from 'pinia';
import {
  TUIRole,
  TUIRoomInfo,
  TUISeatInfo,
  TUISeatMode,
  TUIUserInfo,
  TUIVideoQuality,
  TUIVideoStreamType,
  TUIMediaDeviceType,
} from '@tencentcloud/tuiroom-engine-js';
import { useBasicStore } from './basic';
import { set, del } from '../utils/vue';
import useGetRoomEngine from '../hooks/useRoomEngine';
import { isMobile } from '../utils/environment';

const roomEngine = useGetRoomEngine();

export type StreamInfo = {
  userId: string,
  userName?: string,
  avatarUrl?: string,
  nameCard?: string,
  hasAudioStream?: boolean,
  hasVideoStream?: boolean,
  hasScreenStream?: boolean,
  streamType: TUIVideoStreamType,
  isVisible: boolean,
}

export type UserInfo = {
  userId: string,
  userName?: string,
  avatarUrl?: string,
  nameCard?: string,
  hasAudioStream?: boolean,
  hasVideoStream?: boolean,
  hasScreenStream?: boolean,
  isVideoVisible?: boolean,
  isScreenVisible?: boolean,
  isMessageDisabled?: boolean,
  userRole?: TUIRole,
  // Is it on the seat
  onSeat?: boolean,
  // Whether the user is being asked to turn on the microphone
  isRequestingUserOpenMic?: boolean,
  // The requestId for requesting the user to turn on the microphone
  requestUserOpenMicRequestId?: string,
  // Whether the user is being asked to open the camera
  isRequestingUserOpenCamera?: boolean,
  // The requestId for the user to turn on the camera
  requestUserOpenCameraRequestId?: string,
  // Whether the user is applying for seat
  isUserApplyingToAnchor?: boolean,
  // The requestId of the user requesting to be on the seat
  applyToAnchorRequestId?: string,
  // The time at which a user applies to be on the seat
  applyToAnchorTimestamp?: number,
  // Whether or not you are inviting users to the seat
  isInvitingUserToAnchor?: boolean,
  // The requestId to invite the user to the seat
  inviteToAnchorRequestId?: string,
  // The meaning of cameraStreamInfo and screenStreamInfo is to keep the stream rendering using the same reference to the passed data,
  // avoiding the problem of inconsistency between the large window and the actual data display.
  cameraStreamInfo: StreamInfo,
  screenStreamInfo: StreamInfo,
}

interface RoomState {
  localUser: UserInfo,
  remoteUserObj: Record<string, UserInfo>,
  userVolumeObj: Record<string, number>,
  isDefaultOpenCamera: boolean,
  isDefaultOpenMicrophone: boolean,
  // Moderators can unmute audio/video by themselves when they have all users unmuted, but when they unmute a user individually.
  canControlSelfAudio: boolean,
  canControlSelfVideo: boolean,
  localVideoQuality: TUIVideoQuality,
  currentCameraId: string,
  currentMicrophoneId: string,
  currentSpeakerId: string,
  cameraList: object[],
  microphoneList: object[],
  speakerList: object[],
  masterUserId: string,
  isMicrophoneDisableForAllUser: boolean,
  isCameraDisableForAllUser: boolean,
  isScreenShareDisableForAllUser: boolean,
  isSeatEnabled: boolean,
  seatMode: TUISeatMode,
  maxMembersCount: number,
  maxSeatCount: number,
  roomName: string,
  hasVideoStreamObject: Record<string, UserInfo>,
  currentStreamIdListInVisibleView: string[],
  hasOtherScreenShare: boolean,
  isOnStateTabActive: boolean,
}

export const useRoomStore = defineStore('room', {
  state: (): RoomState => ({
    localUser: {
      userId: '',
      userName: '',
      avatarUrl: '',
      nameCard: '',
      hasAudioStream: false,
      hasVideoStream: false,
      hasScreenStream: false,
      userRole: TUIRole.kGeneralUser,
      onSeat: false,
      cameraStreamInfo: {
        userId: '',
        userName: '',
        avatarUrl: '',
        nameCard: '',
        hasAudioStream: false,
        hasVideoStream: false,
        streamType: TUIVideoStreamType.kCameraStream,
        isVisible: true,
      },
      screenStreamInfo: {
        userId: '',
        userName: '',
        avatarUrl: '',
        nameCard: '',
        hasScreenStream: false,
        streamType: TUIVideoStreamType.kScreenStream,
        isVisible: true,
      },
    },
    remoteUserObj: {},
    userVolumeObj: {},
    isDefaultOpenCamera: false,
    isDefaultOpenMicrophone: false,
    canControlSelfAudio: true,
    canControlSelfVideo: true,
    localVideoQuality: isMobile ? TUIVideoQuality.kVideoQuality_360p : TUIVideoQuality.kVideoQuality_720p,
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
    isSeatEnabled: false,
    seatMode: TUISeatMode.kFreeToTake,
    maxMembersCount: 5, // Includes local streams and screen shares, above which subsequent streams are played
    maxSeatCount: 20,
    roomName: '',
    hasVideoStreamObject: {},
    // Visual area user flow list
    currentStreamIdListInVisibleView: [],
    hasOtherScreenShare: false,
    isOnStateTabActive: true,
  }),
  getters: {
    isMaster(state) {
      return state.localUser.userId === state.masterUserId;
    },
    isAdmin(state) {
      return state.localUser.userRole === TUIRole.kAdministrator;
    },
    isGeneralUser(state) {
      return state.localUser.userRole === TUIRole.kGeneralUser;
    },
    // Whether the current user is on the stage
    isAnchor(state) {
      if (this.isFreeSpeakMode) {
        return true;
      }
      if (this.isSpeakAfterTakingSeatMode) {
        return state.localUser.onSeat;
      }
    },
    // Whether the current user is under the stage
    isAudience(state) {
      if (this.isFreeSpeakMode) {
        return false;
      }
      if (this.isSpeakAfterTakingSeatMode) {
        return !state.localUser.onSeat;
      }
    },
    isSpeakAfterTakingSeatMode(): boolean {
      return this.isSeatEnabled && this.seatMode === TUISeatMode.kApplyToTake;
    },
    isFreeSpeakMode(): boolean {
      return !this.isSeatEnabled;
    },
    isLocalAudioIconDisable(): boolean {
      // All mute status
      const micForbidden = this.isGeneralUser && !this.canControlSelfAudio;
      return micForbidden as any || this.isAudience;
    },
    isLocalVideoIconDisable(): boolean {
      // All stop video status
      const cameraForbidden = this.isGeneralUser && !this.canControlSelfVideo;
      return cameraForbidden as any || this.isAudience;
    },
    localStream: (state) => {
      const { userId, userName, avatarUrl, nameCard, hasAudioStream, hasVideoStream } = state.localUser;
      Object.assign(
        state.localUser.cameraStreamInfo,
        { userId, userName, avatarUrl, nameCard, hasAudioStream, hasVideoStream },
      );
      return state.localUser.cameraStreamInfo;
    },
    localScreenStream: (state) => {
      const { userId, userName, avatarUrl, hasScreenStream } = state.localUser;
      Object.assign(
        state.localUser.screenStreamInfo,
        { userId, userName, avatarUrl, hasScreenStream },
      );
      return state.localUser.screenStreamInfo;
    },
    remoteStreamObj: (state) => {
      const obj: Record<string, StreamInfo> = {};
      [...Object.values(state.remoteUserObj)].forEach((userInfo) => {
        const {
          userId,
          avatarUrl,
          userName,
          nameCard,
          onSeat,
          hasAudioStream,
          hasVideoStream,
          hasScreenStream,
          isVideoVisible,
          isScreenVisible,
        } = userInfo;
        if (onSeat) {
          obj[`${userId}_${TUIVideoStreamType.kCameraStream}`] = Object.assign(userInfo.cameraStreamInfo, { userId, avatarUrl, userName,nameCard, hasAudioStream, hasVideoStream, streamType: TUIVideoStreamType.kCameraStream, isVisible: isVideoVisible });
        }
        if (hasScreenStream) {
          obj[`${userId}_${TUIVideoStreamType.kScreenStream}`] = Object.assign(userInfo.screenStreamInfo, { userId, avatarUrl, userName, nameCard, hasScreenStream, streamType: TUIVideoStreamType.kScreenStream, isVisible: isScreenVisible });
        }
      });
      return obj;
    },
    remoteStreamList(): Array<StreamInfo> {
      return [...Object.values(this.remoteStreamObj)];
    },
    streamList(): Array<StreamInfo> {
      const list = [this.localStream, ...Object.values(this.remoteStreamObj)];
      if (this.localUser.hasScreenStream) {
        list.unshift(this.localScreenStream);
      }
      return list;
    },
    cameraStreamList(): Array<StreamInfo> {
      const list = [
        this.localStream,
        ...(Object.values(this.remoteStreamObj)
          .filter(stream => stream.streamType === TUIVideoStreamType.kCameraStream)),
      ];
      return list;
    },
    streamNumber(): number {
      return this.streamList.length;
    },
    remoteUserList: state => [...Object.values(state.remoteUserObj)],
    remoteAnchorList: state => [...Object.values(state.remoteUserObj)].filter(item => item.onSeat),
    userList: state => [state.localUser, ...Object.values(state.remoteUserObj)],
    generalUserScreenStreamList: state => [...Object.values(state.remoteUserObj)].filter(item => item.hasScreenStream && item.userRole === TUIRole.kGeneralUser),
    userNumber(): number {
      return this.userList.length;
    },
    anchorUserList: state => [state.localUser, ...Object.values(state.remoteUserObj)].filter(item => item.onSeat),
    applyToAnchorList: state => [...Object.values(state.remoteUserObj)]
      .filter(item => item.isUserApplyingToAnchor)
      .sort((item1, item2) => (item1?.applyToAnchorTimestamp || 0) - (item2?.applyToAnchorTimestamp || 0)) || [],
    defaultStreamType(): TUIVideoStreamType {
      return Object.keys(this.hasVideoStreamObject).length > this.maxMembersCount
        ? TUIVideoStreamType.kCameraStreamLow : TUIVideoStreamType.kCameraStream;
    },
    getDisplayName: (state) =>  {
      return (userId: string) => {
      const userInfo = userId === state.localUser.userId ? state.localUser : state.remoteUserObj[userId];
      if (userInfo) {
        const { nameCard, userName, userId } = userInfo;
        return nameCard || userName || userId;
      }
      }
    }
  },
  actions: {
    setLocalUser(obj: Record<string, any>) {
      Object.assign(this.localUser, obj);
    },
    updateLocalStream(obj: Record<string, any>) {
      Object.assign(this.localStream, obj);
    },
    getUserName(userId: string) {
      if (userId === this.localUser.userId) {
        return this.localUser.nameCard || this.localUser.userName || userId;
      }
      return this.remoteUserObj[userId]?.nameCard || this.remoteUserObj[userId]?.userName || userId;
    },
    getUserRole(userId: string) {
      if (userId === this.localUser.userId) {
        return this.localUser.userRole;
      }
      return this.remoteUserObj[userId]?.userRole;
    },
    getNewUserInfo(userId: string) {
      const newUserInfo = {
        userId,
        userName: '',
        avatarUrl: '',
        nameCard: '',
        hasAudioStream: false,
        hasVideoStream: false,
        hasScreenStream: false,
        isVideoVisible: false,
        isScreenVisible: false,
        isMessageDisabled: false,
        userRole: TUIRole.kGeneralUser,
        onSeat: !this.isSpeakAfterTakingSeatMode,
        isUserApplyingToAnchor: false,
        isInvitingUserToAnchor: false,
        cameraStreamInfo: {
          userId,
          userName: '',
          avatarUrl: '',
          nameCard: '',
          hasAudioStream: false,
          hasVideoStream: false,
          streamType: TUIVideoStreamType.kCameraStream,
          isVisible: false,
        },
        screenStreamInfo: {
          userId,
          userName: '',
          avatarUrl: '',
          nameCard: '',
          hasScreenStream: false,
          streamType: TUIVideoStreamType.kScreenStream,
          isVisible: false,
        },
      };
      return newUserInfo;
    },
    updateUserList(userList: any[]) {
      userList.forEach((user) => {
        if (user.userId === this.localUser.userId) {
          Object.assign(this.localUser, user);
          return;
        }
        if (this.remoteUserObj[user.userId]) {
          Object.assign(this.remoteUserObj[user.userId], user);
        } else {
          const newUserInfo = Object.assign(this.getNewUserInfo(user.userId), user);
          set(this.remoteUserObj, user.userId, newUserInfo);
        }
      });
    },
    // Remote user enters the room (IM event)
    addRemoteUser(userInfo: TUIUserInfo) {
      const { userId } = userInfo;
      const basicStore = useBasicStore();
      if (!userId || userId === basicStore.userId) {
        return;
      }
      if (this.remoteUserObj[userId]) {
        Object.assign(this.remoteUserObj[userId], userInfo);
      } else {
        const newUserInfo = Object.assign(this.getNewUserInfo(userId), userInfo);
        set(this.remoteUserObj, userId, newUserInfo);
      }
    },
    updateRemoteUser(userId: string, newUserInfo: { nick: string, avatar: string }) {
      const remoteUser = this.remoteUserObj[userId];
      if (!remoteUser) {
        return;
      }
      const { nick, avatar } = newUserInfo;
      Object.assign(remoteUser, { userName: nick, avatarUrl: avatar });
    },
    setSeatList(seatList: TUISeatInfo[]) {
      seatList.forEach((seat) => {
        const { userId } = seat;
        if (!userId) return;
        if (userId === this.localUser.userId) {
          Object.assign(this.localUser, { onSeat: true });
        } else {
          const user = this.remoteUserObj[userId];
          if (user) {
            Object.assign(user, { onSeat: true });
          } else {
            const newUserInfo = Object.assign(this.getNewUserInfo(userId), { onSeat: true });
            set(this.remoteUserObj, userId, newUserInfo);
          }
        };
      });
    },
    // Updating changes to seatList
    // The onSeatListChanged, onUserVideoAvailable, onUserAudioAvailable events are notified as soon as the room is entered, so they are updated to the userMap first.
    // Wait for getUserList to get the full list of users before updating it.
    updateOnSeatList(seatedList: TUISeatInfo[], leftList: TUISeatInfo[]) {
      seatedList.forEach((seat) => {
        const { userId } = seat;
        if (userId === this.localUser.userId) {
          Object.assign(this.localUser, { onSeat: true });
        } else {
          const user = this.remoteUserObj[userId];
          if (user) {
            Object.assign(user, { onSeat: true });
          } else {
            const newUserInfo = Object.assign(this.getNewUserInfo(userId), { onSeat: true });
            set(this.remoteUserObj, userId, newUserInfo);
          }
        };
      });
      leftList.forEach((seat) => {
        if (seat.userId === this.localUser.userId) {
          Object.assign(this.localUser, { onSeat: false });
          const basicStore = useBasicStore();
          basicStore.setIsOpenMic(false);
        } else {
          const user = this.remoteUserObj[seat.userId];
          user && Object.assign(user, { onSeat: false });
        };
      });
    },
    updateUserVideoState(userId: string, streamType: TUIVideoStreamType, hasVideo: boolean) {
      const basicStore = useBasicStore();
      let user = userId === basicStore.userId ? this.localUser : this.remoteUserObj[userId];
      // You need to determine whether hasVideo is true or not to avoid the video cancellation event being thrown after onRemoteUserLeaveRoom
      if (!user && hasVideo) {
        user = this.getNewUserInfo(userId);
        set(this.remoteUserObj, userId, user);
      }
      if (user) {
        this.updatehasVideoStreamObject(user, hasVideo,  userId === basicStore.userId);
        if (streamType === TUIVideoStreamType.kCameraStream || streamType === TUIVideoStreamType.kCameraStreamLow) {
          user.hasVideoStream = hasVideo;
        } else if (streamType === TUIVideoStreamType.kScreenStream) {
          user.hasScreenStream = hasVideo;
        }
      }
    },
    updatehasVideoStreamObject(userInfo: UserInfo,  hasVideo: boolean, isSelf: boolean) {
      if (isSelf) return;
      const { userId, cameraStreamInfo, screenStreamInfo, hasVideoStream } = userInfo;
      const streamId = `${userId}_${hasVideoStream ? cameraStreamInfo.streamType : screenStreamInfo.streamType}`;
      if (hasVideo) {
        set(this.hasVideoStreamObject, streamId, userInfo);
      } else {
        del(this.hasVideoStreamObject, streamId);
      }
    },
    updateUserAudioState(userId: string, hasAudio: boolean) {
      const basicStore = useBasicStore();
      let user = userId === basicStore.userId ? this.localUser : this.remoteUserObj[userId];
      // You need to determine if hasAudio is true to avoid audio cancellation events being thrown after onRemoteUserLeaveRoom
      if (!user && hasAudio) {
        user = this.getNewUserInfo(userId);
        set(this.remoteUserObj, userId, user);
      }
      if (user) {
        user.hasAudioStream = hasAudio;
      }
    },

    removeRemoteUser(userId: string) {
      const basicStore = useBasicStore();
      if (!userId || userId === basicStore.userId) {
        return;
      }
      del(this.remoteUserObj, userId);
    },

    updateUserStreamVisible(streamIdList: string[]) {
      streamIdList.forEach((item) => {
        const userId = item.slice(0, item.length - 2);
        const streamType = Number(item.slice(-1)) as TUIVideoStreamType;
        if (userId === this.localUser.userId) {
          return;
        }
        const user = this.remoteUserObj[userId];
        if (!user) {
          return;
        }
        if (streamType === TUIVideoStreamType.kCameraStream || streamType === TUIVideoStreamType.kCameraStreamLow) {
          user.isVideoVisible = true;
        } else if (streamType === TUIVideoStreamType.kScreenStream) {
          user.isScreenVisible = true;
        }
      });
      // For streams that are not in the new streamIdList, isVideoVisible should be set to false.
      this.currentStreamIdListInVisibleView.forEach((item: string) => {
        const userId = item.slice(0, item.length - 2);
        const streamType = Number(item.slice(-1)) as TUIVideoStreamType;
        if (streamIdList.indexOf(item) < 0) {
          const user = this.remoteUserObj[userId];
          if (!user) {
            return;
          }
          if (streamType === TUIVideoStreamType.kCameraStream || streamType === TUIVideoStreamType.kCameraStreamLow) {
            user.isVideoVisible = false;
          } else if (streamType === TUIVideoStreamType.kScreenStream) {
            user.isScreenVisible = false;
          }
        }
      });
      this.currentStreamIdListInVisibleView = streamIdList;
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
    setRoomParam(roomParam: any) {
      if (!roomParam) {
        return;
      }
      const { isOpenCamera, isOpenMicrophone, defaultCameraId, defaultMicrophoneId, defaultSpeakerId } = roomParam;
      if (defaultCameraId) {
        this.setCurrentCameraId(defaultCameraId);
        roomEngine.instance?.setCurrentCameraDevice({ deviceId: defaultCameraId });
      }
      if (defaultMicrophoneId) {
        this.setCurrentMicrophoneId(defaultMicrophoneId);
        roomEngine.instance?.setCurrentMicDevice({ deviceId: defaultMicrophoneId });
      }
      if (defaultSpeakerId) {
        this.setCurrentSpeakerId(defaultSpeakerId);
        roomEngine.instance?.setCurrentSpeakerDevice({ deviceId: defaultSpeakerId });
      }
      // Ignore the setting to turn on the microphone by default if all hands are already turned on/currently in request-to-speak mode
      if (this.isMaster || (!this.isMicrophoneDisableForAllUser
        && this.isFreeSpeakMode)) {
        typeof isOpenMicrophone === 'boolean' && (this.isDefaultOpenMicrophone = isOpenMicrophone);
      }
      // Ignore the setting to turn on the camera by default if the all-persons ban is already on/currently in request-to-speak mode
      if (this.isMaster || (!this.isCameraDisableForAllUser
        && this.isFreeSpeakMode)) {
        typeof isOpenCamera === 'boolean' && (this.isDefaultOpenCamera = isOpenCamera);
      }
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
    setDeviceList(type: TUIMediaDeviceType, deviceList: {deviceId: string, deviceName: string}[]) {
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
    setCameraList(deviceList: {deviceId: string, deviceName: string}[]) {
      this.cameraList = deviceList;
      if (!this.currentCameraId && deviceList.length > 0) {
        this.setCurrentCameraId(deviceList[0].deviceId);
      }
    },
    setMicrophoneList(deviceList: {deviceId: string, deviceName: string}[]) {
      this.microphoneList = deviceList;
      if (!this.currentMicrophoneId && deviceList.length > 0) {
        this.setCurrentMicrophoneId(deviceList[0].deviceId);
      }
    },
    setSpeakerList(deviceList: {deviceId: string, deviceName: string}[]) {
      this.speakerList = deviceList;
      if (!this.currentSpeakerId && deviceList.length > 0) {
        this.setCurrentSpeakerId(deviceList[0].deviceId);
      }
    },
    // Moderator individually modifies the mute status of a user's outgoing text messages
    setMuteUserChat(userId: string, muted: boolean) {
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isMessageDisabled = muted;
      }
    },
    setRemoteUserRole(userId: string, role: TUIRole) {
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.userRole = role;
      }
    },
    setRemoteUserNameCard(userId: string, nameCard: string) {
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.nameCard = nameCard;
      }
    },
    setRequestUserOpenMic(options: { userId: string, isRequesting: boolean, requestId?: string }) {
      const { userId, isRequesting, requestId } = options;
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isRequestingUserOpenMic = isRequesting;
        remoteUserInfo.requestUserOpenMicRequestId = isRequesting ? requestId : '';
      }
    },
    setRequestUserOpenCamera(options: { userId: string, isRequesting: boolean, requestId?: string }) {
      const { userId, isRequesting, requestId } = options;
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isRequestingUserOpenCamera = isRequesting;
        remoteUserInfo.requestUserOpenCameraRequestId = isRequesting ? requestId : '';
      }
    },
    addApplyToAnchorUser(options: { userId: string, requestId: string, timestamp: number }) {
      const { userId, requestId, timestamp } = options;
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isUserApplyingToAnchor = true;
        remoteUserInfo.applyToAnchorRequestId = requestId;
        remoteUserInfo.applyToAnchorTimestamp = timestamp;
      }
    },
    removeApplyToAnchorUser(requestId: string) {
      const applyToAnchorItem = Object.values(this.remoteUserObj)
        .find(item => item.isUserApplyingToAnchor && item.applyToAnchorRequestId === requestId);
      if (applyToAnchorItem) {
        applyToAnchorItem.isUserApplyingToAnchor = false;
        applyToAnchorItem.applyToAnchorRequestId = '';
        applyToAnchorItem.applyToAnchorTimestamp = 0;
      }
    },
    addInviteToAnchorUser(options: { userId: string, requestId: string }) {
      const { userId, requestId } = options;
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isInvitingUserToAnchor = true;
        remoteUserInfo.inviteToAnchorRequestId = requestId;
      }
    },
    removeInviteToAnchorUser(userId: string) {
      const remoteUserInfo = this.remoteUserObj[userId];
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
    reset() {
      const basicStore = useBasicStore();
      basicStore.setIsOpenMic(false);
      this.localUser = {
        userId: '',
        userName: '',
        avatarUrl: '',
        hasAudioStream: false,
        hasVideoStream: false,
        hasScreenStream: false,
        userRole: TUIRole.kGeneralUser,
        onSeat: false,
        cameraStreamInfo: {
          userId: '',
          userName: '',
          avatarUrl: '',
          hasAudioStream: false,
          hasVideoStream: false,
          streamType: TUIVideoStreamType.kCameraStream,
          isVisible: true,
        },
        screenStreamInfo: {
          userId: '',
          userName: '',
          avatarUrl: '',
          hasScreenStream: false,
          streamType: TUIVideoStreamType.kScreenStream,
          isVisible: true,
        },
      };
      this.remoteUserObj = {};
      this.userVolumeObj = {};
      this.isDefaultOpenCamera = false;
      this.isDefaultOpenMicrophone = false;
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
      this.isSeatEnabled = false;
      this.seatMode = TUISeatMode.kFreeToTake;
      this.hasVideoStreamObject = {};
      this.hasOtherScreenShare = false;
      this.isOnStateTabActive = true;
      this.maxSeatCount = 20;
      this.roomName = '';
    },
  },
});
