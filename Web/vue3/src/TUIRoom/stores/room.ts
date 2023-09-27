import { defineStore } from 'pinia';
import { TUIRole, TUIVideoStreamType, TUIRoomInfo, TUIUserInfo, TUIVideoQuality, TUISeatInfo, TUISpeechMode } from '@tencentcloud/tuiroom-engine-js';
import { useBasicStore } from './basic';
import { isVue3 } from '../utils/constants';
import Vue from '../utils/vue';
import useGetRoomEngine from '../hooks/useRoomEngine';
import { isMobile } from '../utils/useMediaValue';

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
  // 是否在麦上
  onSeat?: boolean,
  isChatMutedByMaster?: boolean,
  // 是否正在请求用户打开麦克风
  isRequestingUserOpenMic?: boolean,
  // 请求用户打开麦克风的 requestId
  requestUserOpenMicRequestId?: string,
  // 是否正在请求用户打开摄像头
  isRequestingUserOpenCamera?: boolean,
  // 请求用户打开摄像头的 requestId
  requestUserOpenCameraRequestId?: string,
  // 用户是否正在申请上麦
  isUserApplyingToAnchor?: boolean,
  // 用户申请上麦的 requestId
  applyToAnchorRequestId?: string,
  // 用户申请上麦的时间点
  applyToAnchorTimestamp?: number,
  // 是否正在邀请用户上麦
  isInvitingUserToAnchor?: boolean,
  // 邀请用户上麦的 requestId
  inviteToAnchorRequestId?: string,
  // cameraStreamInfo 和 screenStreamInfo 存在的意义时，流渲染保持使用同一个引用传递的数据
  // 避免出现大窗口和实际数据显示不一致的问题
  cameraStreamInfo: StreamInfo,
  screenStreamInfo: StreamInfo,
}

interface RoomState {
  localUser: UserInfo,
  remoteUserObj: Record<string, UserInfo>,
  userVolumeObj: Record<string, number>,
  isDefaultOpenCamera: boolean,
  isDefaultOpenMicrophone: boolean,
  // 主持人全员禁麦，但是单独取消某个用户音视频禁止状态的时候，是可以自己 unmute audio/video 的
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
  speechMode: TUISpeechMode,
  maxMembersCount: number,
  hasVideoStreamObject: Record<string, UserInfo>,
  currentStreamIdListInVisibleView: string[],
  hasOtherScreenShare: boolean,
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
    speechMode: TUISpeechMode.kFreeToSpeak,
    maxMembersCount: 5, // 包含本地流和屏幕分享，超过该数目后续都播放小流
    hasVideoStreamObject: {},
    // 可视区域用户流列表
    currentStreamIdListInVisibleView: [],
    hasOtherScreenShare: false,
  }),
  getters: {
    // 当前用户是否是主持人
    isMaster(state) {
      return state.localUser.userId === state.masterUserId;
    },
    // 当前用户是否在麦上
    isAnchor(state) {
      if (this.isFreeSpeakMode) {
        return true;
      }
      if (this.isSpeakAfterTakingSeatMode) {
        return state.localUser.onSeat;
      }
    },
    // 当前用户是否是在麦下
    isAudience(state) {
      if (this.isFreeSpeakMode) {
        return false;
      }
      if (this.isSpeakAfterTakingSeatMode) {
        return !state.localUser.onSeat;
      }
    },
    isSpeakAfterTakingSeatMode(): boolean {
      return this.speechMode === TUISpeechMode.kSpeakAfterTakingSeat;
    },
    isFreeSpeakMode(): boolean {
      return this.speechMode === TUISpeechMode.kFreeToSpeak;
    },
    isLocalAudioIconDisable(): boolean {
      // 全员禁麦状态
      const micForbidden = !this.isMaster && !this.canControlSelfAudio;
      return micForbidden as any || this.isAudience;
    },
    isLocalVideoIconDisable(): boolean {
      // 全员禁画状态
      const cameraForbidden = !this.isMaster && !this.canControlSelfVideo;
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
      return [this.localStream, ...Object.values(this.remoteStreamObj)];
    },
    streamNumber(): number {
      return this.streamList.length;
    },
    remoteAnchorList: state => [...Object.values(state.remoteUserObj)].filter(item => item.onSeat),
    userList: state => [state.localUser, ...Object.values(state.remoteUserObj)],
    userNumber(): number {
      return this.userList.length;
    },
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
      // 本端为主持人，则记录用户禁言禁画, 申请发言等信息
      if (this.isMaster) {
        Object.assign(newUserInfo, {
          isChatMutedByMaster: false,
          isUserApplyingToAnchor: false,
          isInvitingUserToAnchor: false,
        });
      }
      return newUserInfo;
    },
    setUserList(userList: any[]) {
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
    // 远端用户进入房间（IM事件）
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
    // 更新 seatList 的变更
    // 进入房间后会立即通知 onSeatListChanged， onUserVideoAvailable，onUserAudioAvailable 事件，因此先更新到 userMap 中
    // 等待 getUserList 获取到全部用户列表后再做更新
    updateOnSeatList(seatList: TUISeatInfo[], seatedList: TUISeatInfo[], leftList: TUISeatInfo[]) {
      if (JSON.stringify(this.remoteUserObj) === '{}') {
        seatList.forEach((seat) => {
          const { userId } = seat;
          if (userId === this.localUser.userId) {
            Object.assign(this.localUser, { onSeat: true });
          } else {
            const newUserInfo = Object.assign(this.getNewUserInfo(userId), { onSeat: true });
            if (isVue3) {
              this.remoteUserObj[userId] = newUserInfo;
            } else {
              // @ts-ignore
              Vue.set(this.remoteUserObj, userId, newUserInfo);
            }
          };
        });
      } else {
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
          } else {
            const user = this.remoteUserObj[seat.userId];
            user && Object.assign(user, { onSeat: false });
          };
        });
      }
    },
    updateUserVideoState(userId: string, streamType: TUIVideoStreamType, hasVideo: boolean) {
      const basicStore = useBasicStore();
      let user = userId === basicStore.userId ? this.localUser : this.remoteUserObj[userId];
      // 需要判断 hasVideo 是否为 true，避免视频取消事件在 onRemoteUserLeaveRoom 之后抛出的情况
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
      // 需要判断 hasAudio 是否为 true，避免音频取消事件在 onRemoteUserLeaveRoom 之后抛出的情况
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
      // 在新的 streamIdList 里面没有的流, isVideoVisible 要设置为 false
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
      const { roomOwner, isMicrophoneDisableForAllUser,
        isCameraDisableForAllUser, isMessageDisableForAllUser, speechMode } = roomInfo;
      if (this.localUser.userId === roomOwner) {
        this.localUser.userRole = TUIRole.kRoomOwner;
      }

      this.masterUserId = roomOwner;
      this.isMicrophoneDisableForAllUser = isMicrophoneDisableForAllUser;
      this.isCameraDisableForAllUser = isCameraDisableForAllUser;
      this.isMessageDisableForAllUser = isMessageDisableForAllUser;
      this.speechMode = speechMode;
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
      // 如果已经开启全员禁言/当前为申请发言模式，则忽略默认打开麦克风的设置
      if (this.isMaster || (!this.isMicrophoneDisableForAllUser
        && this.isFreeSpeakMode)) {
        typeof isOpenMicrophone === 'boolean' && (this.isDefaultOpenMicrophone = isOpenMicrophone);
      }
      // 如果已经开启全员禁画/当前为申请发言模式，则忽略默认打开摄像头的设置
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
    // 全员禁麦/取消禁麦时设置所有人的禁麦状态
    setMicrophoneDisableState(isDisable: boolean) {
      this.isMicrophoneDisableForAllUser = isDisable;
    },
    // 全员禁画/取消禁画时设置所有人的禁画状态
    setCameraDisableState(isDisable: boolean) {
      this.isCameraDisableForAllUser = isDisable;
    },
    // 主持人单个修改用户的发文字消息 mute 状态
    setMuteUserChat(userId: string, muted: boolean) {
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isChatMutedByMaster = muted;
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
    removeApplyToAnchorUser(userId: string) {
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isUserApplyingToAnchor = false;
        remoteUserInfo.applyToAnchorRequestId = '';
        remoteUserInfo.applyToAnchorTimestamp = 0;
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
    reset() {
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
      this.speechMode = TUISpeechMode.kFreeToSpeak;
      this.hasVideoStreamObject = {};
      this.hasOtherScreenShare = false;
    },
  },
});
