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
} from '@tencentcloud/tuiroom-engine-wx';
import { useBasicStore } from './basic';
import { isVue3 } from '../utils/constants';
import Vue from '../utils/vue';
import useGetRoomEngine from '../hooks/useRoomEngine';
import { isMobile } from '../utils/environment';

const roomEngine = useGetRoomEngine();

export type StreamInfo = {
  userId: string,
  userName?: string,
  avatarUrl?: string,
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
  hasAudioStream?: boolean,
  hasVideoStream?: boolean,
  hasScreenStream?: boolean,
  isVideoVisible?: boolean,
  isScreenVisible?: boolean,
  userRole?: TUIRole,
  onSeat?: boolean,
  isChatMutedByMasterOrAdmin?: boolean,
  isRequestingUserOpenMic?: boolean,
  requestUserOpenMicRequestId?: string,
  isRequestingUserOpenCamera?: boolean,
  requestUserOpenCameraRequestId?: string,
  isUserApplyingToAnchor?: boolean,
  applyToAnchorRequestId?: string,
  applyToAnchorTimestamp?: number,
  isInvitingUserToAnchor?: boolean,
  inviteToAnchorRequestId?: string,
  cameraStreamInfo: StreamInfo,
  screenStreamInfo: StreamInfo,
}

interface RoomState {
  localUser: UserInfo,
  remoteUserObj: Record<string, UserInfo>,
  userVolumeObj: Record<string, number>,
  isDefaultOpenCamera: boolean,
  isDefaultOpenMicrophone: boolean,
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
  isMessageDisableForAllUser: boolean,
  isSeatEnabled: boolean,
  seatMode: TUISeatMode,
  maxMembersCount: number,
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
    isMessageDisableForAllUser: false,
    isSeatEnabled: false,
    seatMode: TUISeatMode.kFreeToTake,
    maxMembersCount: 5,
    hasVideoStreamObject: {},
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
    isAnchor(state) {
      if (this.isFreeSpeakMode) {
        return true;
      }
      if (this.isSpeakAfterTakingSeatMode) {
        return state.localUser.onSeat;
      }
    },
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
      const micForbidden = this.isGeneralUser && !this.canControlSelfAudio;
      return micForbidden as any || this.isAudience;
    },
    isLocalVideoIconDisable(): boolean {
      const cameraForbidden = this.isGeneralUser && !this.canControlSelfVideo;
      return cameraForbidden as any || this.isAudience;
    },
    localStream: (state) => {
      const { userId, userName, avatarUrl, hasAudioStream, hasVideoStream } = state.localUser;
      Object.assign(
        state.localUser.cameraStreamInfo,
        { userId, userName, avatarUrl, hasAudioStream, hasVideoStream },
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
          onSeat,
          hasAudioStream,
          hasVideoStream,
          hasScreenStream,
          isVideoVisible,
          isScreenVisible,
        } = userInfo;
        if (onSeat) {
          obj[`${userId}_${TUIVideoStreamType.kCameraStream}`] = Object.assign(userInfo.cameraStreamInfo, { userId, avatarUrl, userName, hasAudioStream, hasVideoStream, streamType: TUIVideoStreamType.kCameraStream, isVisible: isVideoVisible });
        }
        if (hasScreenStream) {
          obj[`${userId}_${TUIVideoStreamType.kScreenStream}`] = Object.assign(userInfo.screenStreamInfo, { userId, avatarUrl, userName, hasScreenStream, streamType: TUIVideoStreamType.kScreenStream, isVisible: isScreenVisible });
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
    streamNumber(): number {
      return this.streamList.length;
    },
    remoteUserList: state => [...Object.values(state.remoteUserObj)],
    remoteAnchorList: state => [...Object.values(state.remoteUserObj)].filter(item => item.onSeat),
    userList: state => [state.localUser, ...Object.values(state.remoteUserObj)],
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
        return this.localUser.userName || userId;
      }
      return this.remoteUserObj[userId]?.userName || userId;
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
        hasAudioStream: false,
        hasVideoStream: false,
        hasScreenStream: false,
        isVideoVisible: false,
        isScreenVisible: false,
        userRole: TUIRole.kGeneralUser,
        onSeat: !this.isSpeakAfterTakingSeatMode,
        isChatMutedByMasterOrAdmin: false,
        isUserApplyingToAnchor: false,
        isInvitingUserToAnchor: false,
        cameraStreamInfo: {
          userId,
          userName: '',
          avatarUrl: '',
          hasAudioStream: false,
          hasVideoStream: false,
          streamType: TUIVideoStreamType.kCameraStream,
          isVisible: false,
        },
        screenStreamInfo: {
          userId,
          userName: '',
          avatarUrl: '',
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
          if (isVue3) {
            this.remoteUserObj[user.userId] = newUserInfo;
          } else {
            // @ts-ignore
            Vue.set(this.remoteUserObj, user.userId, newUserInfo);
          }
        }
      });
    },
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
        if (isVue3) {
          this.remoteUserObj[userId] = newUserInfo;
        } else {
          // @ts-ignore
          Vue.set(this.remoteUserObj, userId, newUserInfo);
        }
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
            if (isVue3) {
              this.remoteUserObj[userId] = newUserInfo;
            } else {
              // @ts-ignore
              Vue.set(this.remoteUserObj, userId, newUserInfo);
            }
          }
        };
      });
    },
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
            if (isVue3) {
              this.remoteUserObj[userId] = newUserInfo;
            } else {
              // @ts-ignore
              Vue.set(this.remoteUserObj, userId, newUserInfo);
            }
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
      if (!user && hasVideo) {
        user = this.getNewUserInfo(userId);
        if (isVue3) {
          this.remoteUserObj[userId] = user;
        } else {
          // @ts-ignore
          Vue.set(this.remoteUserObj, userId, user);
        }
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
        if (isVue3) {
          this.hasVideoStreamObject[streamId] = userInfo;
        } else {
          // @ts-ignore
          Vue.set(this.hasVideoStreamObject, streamId, userInfo);
        }
      } else {
        if (isVue3) {
          delete this.hasVideoStreamObject[streamId];
        } else {
          // @ts-ignore
          Vue.delete(this.hasVideoStreamObject, streamId);
        }
      }
    },
    updateUserAudioState(userId: string, hasAudio: boolean) {
      const basicStore = useBasicStore();
      let user = userId === basicStore.userId ? this.localUser : this.remoteUserObj[userId];
      if (!user && hasAudio) {
        user = this.getNewUserInfo(userId);
        if (isVue3) {
          this.remoteUserObj[userId] = user;
        } else {
          // @ts-ignore
          Vue.set(this.remoteUserObj, userId, user);
        }
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
      if (isVue3) {
        delete this.remoteUserObj[userId];
      } else {
        // @ts-ignore
        Vue.delete(this.remoteUserObj, userId);
      }
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
        if (isVue3) {
          this.userVolumeObj[userId] = volume;
        } else {
          // @ts-ignore
          Vue.set(this.userVolumeObj, userId, volume);
        }
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
      const {
        roomOwner, isMicrophoneDisableForAllUser,
        isCameraDisableForAllUser, isMessageDisableForAllUser,
        isSeatEnabled, seatMode,
      } = roomInfo;
      if (this.localUser.userId === roomOwner) {
        this.localUser.userRole = TUIRole.kRoomOwner;
      }

      this.masterUserId = roomOwner;
      this.isMicrophoneDisableForAllUser = isMicrophoneDisableForAllUser;
      this.isCameraDisableForAllUser = isCameraDisableForAllUser;
      this.isMessageDisableForAllUser = isMessageDisableForAllUser;
      this.isSeatEnabled = isSeatEnabled;
      this.seatMode = seatMode;
      this.canControlSelfAudio = !this.isMicrophoneDisableForAllUser;
      this.canControlSelfVideo = !this.isCameraDisableForAllUser;
    },
    setDisableMicrophoneForAllUserByAdmin(isDisable: boolean) {
      this.isMicrophoneDisableForAllUser = isDisable;
    },
    setDisableCameraForAllUserByAdmin(isDisable: boolean) {
      this.isCameraDisableForAllUser = isDisable;
    },
    setDisableMessageAllUserByAdmin(isDisable: boolean) {
      this.isMessageDisableForAllUser = isDisable;
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
      if (this.isMaster || (!this.isMicrophoneDisableForAllUser
        && this.isFreeSpeakMode)) {
        typeof isOpenMicrophone === 'boolean' && (this.isDefaultOpenMicrophone = isOpenMicrophone);
      }
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
    setMicrophoneDisableState(isDisable: boolean) {
      this.isMicrophoneDisableForAllUser = isDisable;
    },
    setCameraDisableState(isDisable: boolean) {
      this.isCameraDisableForAllUser = isDisable;
    },
    setMuteUserChat(userId: string, muted: boolean) {
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isChatMutedByMasterOrAdmin = muted;
      }
    },
    setRemoteUserRole(userId: string, role: TUIRole) {
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.userRole = role;
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
      this.isMessageDisableForAllUser = false;
      this.isSeatEnabled = false;
      this.seatMode = TUISeatMode.kFreeToTake;
      this.hasVideoStreamObject = {};
      this.hasOtherScreenShare = false;
      this.isOnStateTabActive = true;
    },
  },
});
