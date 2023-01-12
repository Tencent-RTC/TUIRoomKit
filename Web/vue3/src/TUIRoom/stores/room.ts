import { defineStore } from 'pinia';
import { TUIRole, TUIVideoStreamType, TUIRoomInfo, TUIUserInfo, TUIVideoProfile, TUISeatInfo } from '@tencentcloud/tuiroom-engine-js';
import { useBasicStore } from './basic';
import { isVue3 } from '../utils/constants';
import Vue from '../utils/vue';

export type StreamInfo = {
  userId: string,
  userName?: string,
  avatarUrl?: string,
  hasAudioStream?: boolean,
  hasVideoStream?: boolean,
  hasScreenStream?: boolean,
  audioVolume?: number,
  streamType: TUIVideoStreamType,
}

export type UserInfo = {
  userId: string,
  userName?: string,
  avatarUrl?: string,
  hasAudioStream?: boolean,
  hasVideoStream?: boolean,
  hasScreenStream?: boolean,
  userRole?: TUIRole,
  // 是否在麦上
  onSeat?: boolean,
  isChatMutedByMaster?: boolean,
  // 是否正在请求用户打开麦克风
  isRequestingUserOpenMic?: boolean,
  // 请求用户打开麦克风的 requestId
  requestUserOpenMicRequestId?: number,
  // 是否正在请求用户打开摄像头
  isRequestingUserOpenCamera?: boolean,
  // 请求用户打开摄像头的 requestId
  requestUserOpenCameraRequestId?: number,
  // 用户是否正在申请上麦
  isUserApplyingToAnchor?: boolean,
  // 用户申请上麦的 requestId
  applyToAnchorRequestId?: number,
  // 是否正在邀请用户上麦
  isInvitingUserToAnchor?: boolean,
  // 邀请用户上麦的 requestId
  inviteToAnchorRequestId?: number,
  audioVolume?: number,
  // cameraStreamInfo 和 screenStreamInfo 存在的意义时，流渲染保持使用同一个引用传递的数据
  // 避免出现大窗口和实际数据显示不一致的问题
  cameraStreamInfo: StreamInfo,
  screenStreamInfo: StreamInfo,
}

interface RoomState {
  localUser: UserInfo,
  remoteUserObj: Record<string, UserInfo>,
  isDefaultOpenCamera: boolean,
  isDefaultOpenMicrophone: boolean,
  // 主持人全员禁麦，但是单独取消某个用户音视频禁止状态的时候，是可以自己 unmute audio/video 的
  canControlSelfAudio: boolean,
  canControlSelfVideo: boolean,
  localVideoProfile: TUIVideoProfile,
  currentCameraId: string,
  currentMicrophoneId: string,
  currentSpeakerId: string,
  cameraList: object[],
  microphoneList: object[],
  speakerList: object[],
  masterUserId: string,
  enableAudio: boolean,
  enableVideo: boolean,
  enableMessage: boolean,
  enableSeatControl: boolean,
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
      audioVolume: 0,
      onSeat: false,
      cameraStreamInfo: {
        userId: '',
        userName: '',
        avatarUrl: '',
        audioVolume: 0,
        hasAudioStream: false,
        hasVideoStream: false,
        streamType: TUIVideoStreamType.kCameraStream,
      },
      screenStreamInfo: {
        userId: '',
        userName: '',
        avatarUrl: '',
        hasScreenStream: false,
        streamType: TUIVideoStreamType.kScreenStream,
      },
    },
    remoteUserObj: {},
    isDefaultOpenCamera: false,
    isDefaultOpenMicrophone: false,
    canControlSelfAudio: true,
    canControlSelfVideo: true,
    localVideoProfile: TUIVideoProfile.kHighDefinition,
    currentCameraId: '',
    currentMicrophoneId: '',
    currentSpeakerId: '',
    cameraList: [],
    microphoneList: [],
    speakerList: [],
    masterUserId: '',
    enableAudio: true,
    enableVideo: true,
    enableMessage: true,
    enableSeatControl: false,
  }),
  getters: {
    // 当前用户是否是主持人
    isMaster(state) {
      return state.localUser.userId === state.masterUserId;
    },
    // 当前用户是否在麦上
    isAnchor(state) {
      return state.localUser.onSeat;
    },
    // 当前用户是否是在麦下
    isAudience(state) {
      return !state.localUser.onSeat;
    },
    isLocalAudioIconDisable(): boolean {
      // 全员禁麦状态
      const micForbidden = !this.isMaster && !this.canControlSelfAudio;
      // 举手发言麦下模式
      const audienceRole = this.enableSeatControl && this.isAudience;
      return micForbidden || audienceRole;
    },
    isLocalVideoIconDisable(): boolean {
      // 全员禁画状态
      const cameraForbidden = !this.isMaster && !this.canControlSelfVideo;
      // 举手发言麦下模式
      const audienceRole = this.enableSeatControl && this.isAudience;
      return cameraForbidden || audienceRole;
    },
    localStream: (state) => {
      const { userId, userName, avatarUrl, hasAudioStream, hasVideoStream, audioVolume } = state.localUser;
      Object.assign(
        state.localUser.cameraStreamInfo,
        { userId, userName, avatarUrl, hasAudioStream, hasVideoStream, audioVolume },
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
          audioVolume,
        } = userInfo;
        if (onSeat) {
          obj[`${userId}_${TUIVideoStreamType.kCameraStream}`] = Object.assign(userInfo.cameraStreamInfo, { userId, avatarUrl, userName, hasAudioStream, hasVideoStream, audioVolume, streamType: TUIVideoStreamType.kCameraStream });
        }
        if (hasScreenStream) {
          obj[`${userId}_${TUIVideoStreamType.kScreenStream}`] = Object.assign(userInfo.screenStreamInfo, { userId, avatarUrl, userName, hasScreenStream, streamType: TUIVideoStreamType.kScreenStream });
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
      .filter(item => item.isUserApplyingToAnchor) || [],
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
        return this.localUser.userName;
      }
      return this.remoteUserObj[userId]?.userName;
    },
    getNewUserInfo(userId: string) {
      const newUserInfo = {
        userId,
        userName: '',
        avatarUrl: '',
        hasAudioStream: false,
        hasVideoStream: false,
        hasScreenStream: false,
        userRole: TUIRole.kGeneralUser,
        audioVolume: 0,
        onSeat: false,
        cameraStreamInfo: {
          userId,
          userName: '',
          avatarUrl: '',
          audioVolume: 0,
          hasAudioStream: false,
          hasVideoStream: false,
          streamType: TUIVideoStreamType.kCameraStream,
        },
        screenStreamInfo: {
          userId,
          userName: '',
          avatarUrl: '',
          hasScreenStream: false,
          streamType: TUIVideoStreamType.kScreenStream,
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
    updateOnSeatList(seatList: TUISeatInfo[], usersSeated: TUISeatInfo[], usersLeft: TUISeatInfo[]) {
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
        usersSeated.forEach((seat) => {
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
        usersLeft.forEach((seat) => {
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
      const user = userId === basicStore.userId ? this.localUser : this.remoteUserObj[userId];
      if (!user) {
        return;
      }
      if (streamType === TUIVideoStreamType.kCameraStream) {
        user.hasVideoStream = hasVideo;
      } else if (streamType === TUIVideoStreamType.kScreenStream) {
        user.hasScreenStream = hasVideo;
      }
    },
    updateUserAudioState(userId: string, hasAudio: boolean) {
      const basicStore = useBasicStore();
      const user = userId === basicStore.userId ? this.localUser : this.remoteUserObj[userId];
      if (!user) {
        return;
      }
      user.hasAudioStream = hasAudio;
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

    setAudioVolume(audioVolumeArray: []) {
      const basicStore = useBasicStore();
      audioVolumeArray.forEach((audioVolumeItem: any) => {
        const { userId, volume } = audioVolumeItem;
        if (userId === basicStore.userId || userId === '') {
          this.localUser.audioVolume = volume;
        } else {
          const remoteUserInfo = this.remoteUserObj[userId];
          if (remoteUserInfo) {
            remoteUserInfo.audioVolume = volume;
          }
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
      const { owner, enableAudio, enableVideo, enableMessage, enableSeatControl } = roomInfo;
      if (this.localUser.userId === owner) {
        this.localUser.userRole = TUIRole.kRoomOwner;
      }
      this.masterUserId = owner;
      this.enableAudio = enableAudio;
      this.enableVideo = enableVideo;
      this.enableMessage = enableMessage;
      this.enableSeatControl = enableSeatControl;
      this.canControlSelfAudio = this.enableAudio;
      this.canControlSelfVideo = this.enableVideo;
    },
    setRoomParam(roomParam: any) {
      if (!roomParam) {
        return;
      }
      const { isOpenCamera, isOpenMicrophone, defaultCameraId, defaultMicrophoneId, defaultSpeakerId } = roomParam;
      defaultCameraId && this.setCurrentCameraId(defaultCameraId);
      defaultMicrophoneId && this.setCurrentMicrophoneId(defaultMicrophoneId);
      defaultSpeakerId && this.setCurrentSpeakerId(defaultSpeakerId);
      // 如果已经开启全员禁言/当前为申请发言模式，则忽略默认打开麦克风的设置
      if (this.isMaster || (this.enableAudio && !this.enableSeatControl)) {
        typeof isOpenMicrophone === 'boolean' && (this.isDefaultOpenMicrophone = isOpenMicrophone);
      }
      // 如果已经开启全员禁画/当前为申请发言模式，则忽略默认打开摄像头的设置
      if (this.isMaster || (this.enableVideo && !this.enableSeatControl)) {
        typeof isOpenCamera === 'boolean' && (this.isDefaultOpenCamera = isOpenCamera);
      }
    },
    setCanControlSelfAudio(capability: boolean) {
      this.canControlSelfAudio = capability;
    },
    setCanControlSelfVideo(capability: boolean) {
      this.canControlSelfVideo = capability;
    },
    setLocalVideoProfile(videoProfile: TUIVideoProfile) {
      this.localVideoProfile = videoProfile;
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
    setEnableAudio(enable: boolean) {
      this.enableAudio = enable;
    },
    // 全员禁画/取消禁画时设置所有人的禁画状态
    setEnableVideo(enable: boolean) {
      this.enableVideo = enable;
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
    setRequestUserOpenMic(options: { userId: string, isRequesting: boolean, requestId?: number }) {
      const { userId, isRequesting, requestId } = options;
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isRequestingUserOpenMic = isRequesting;
        remoteUserInfo.requestUserOpenMicRequestId = isRequesting ? requestId : 0;
      }
    },
    setRequestUserOpenCamera(options: { userId: string, isRequesting: boolean, requestId?: number }) {
      const { userId, isRequesting, requestId } = options;
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isRequestingUserOpenCamera = isRequesting;
        remoteUserInfo.requestUserOpenCameraRequestId = isRequesting ? requestId : 0;
      }
    },
    addApplyToAnchorUser(options: { userId: string, requestId: number }) {
      const { userId, requestId } = options;
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isUserApplyingToAnchor = true;
        remoteUserInfo.applyToAnchorRequestId = requestId;
      }
    },
    removeApplyToAnchorUser(userId: string) {
      const remoteUserInfo = this.remoteUserObj[userId];
      if (remoteUserInfo) {
        remoteUserInfo.isUserApplyingToAnchor = false;
        remoteUserInfo.applyToAnchorRequestId = 0;
      }
    },
    addInviteToAnchorUser(options: { userId: string, requestId: number }) {
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
        remoteUserInfo.inviteToAnchorRequestId = 0;
      }
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
        audioVolume: 0,
        onSeat: false,
        cameraStreamInfo: {
          userId: '',
          userName: '',
          avatarUrl: '',
          audioVolume: 0,
          hasAudioStream: false,
          hasVideoStream: false,
          streamType: TUIVideoStreamType.kCameraStream,
        },
        screenStreamInfo: {
          userId: '',
          userName: '',
          avatarUrl: '',
          hasScreenStream: false,
          streamType: TUIVideoStreamType.kScreenStream,
        },
      };
      this.remoteUserObj = {};
      this.isDefaultOpenCamera = false;
      this.isDefaultOpenMicrophone = false;
      this.canControlSelfAudio = true;
      this.canControlSelfVideo = true;
      this.localVideoProfile = TUIVideoProfile.kHighDefinition;
      this.currentCameraId = '';
      this.currentMicrophoneId = '';
      this.currentSpeakerId = '';
      this.cameraList = [];
      this.microphoneList = [];
      this.speakerList = [];
      this.masterUserId = '';
      this.enableAudio = true;
      this.enableVideo = true;
      this.enableMessage = true;
      this.enableSeatControl = false;
    },
  },
});
