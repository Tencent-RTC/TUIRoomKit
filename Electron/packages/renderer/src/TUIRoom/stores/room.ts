import { defineStore } from 'pinia';
import { ETUIRoomRole, ETUISpeechMode } from '../tui-room-core';
import { useBasicStore } from './basic';

export type StreamInfo = {
  userId?: string,
  userName?: string,
  userAvatar?: string,
  isAudioStreamAvailable?: boolean,
  isVideoStreamAvailable?: boolean,
  isScreenStreamAvailable?: boolean,
  audioVolume?: number,
  // 主流(main) ｜ 辅流(screen)
  type?: string,
}

export type UserInfo = {
  userId: string,
  userName: string,
  userAvatar: string,
  mainStreamInfo: StreamInfo | null,
  screenStreamInfo: StreamInfo | null,
  // 观众 ｜ 主播
  role?: ETUIRoomRole,
  isAudioMutedByMaster?: boolean,
  isVideoMutedByMaster?: boolean,
  isChatMutedByMaster?: boolean,
  // 用户是否正在申请上麦
  isUserApplyingToAnchor?: boolean,
  // 是否正在邀请用户上麦
  isInvitingUserToAnchor?: boolean,
}

interface RoomState {
  localUser: UserInfo,
  localStream: StreamInfo,
  remoteUserMap: Map<string, UserInfo>
  isDefaultOpenCamera: boolean,
  isDefaultOpenMicrophone: boolean,
  isLocalAudioMuted: boolean,
  isLocalVideoMuted: boolean,
  hasStartedCamera: boolean,
  hasStartedMicrophone: boolean,
  currentCameraId: string,
  currentMicrophoneId: string,
  currentSpeakerId: string,
  cameraList: object[],
  microphoneList: object[],
  speakerList: object[],
}

export const useRoomStore = defineStore('room', {
  state: (): RoomState => ({
    localUser: {
      userId: '',
      userName: '',
      userAvatar: '',
      mainStreamInfo: null,
      screenStreamInfo: null,
    },
    localStream: {
      type: 'main',
    },
    remoteUserMap: new Map(),
    isDefaultOpenCamera: false,
    isDefaultOpenMicrophone: false,
    isLocalAudioMuted: false,
    isLocalVideoMuted: false,
    hasStartedCamera: false,
    hasStartedMicrophone: false,
    currentCameraId: '',
    currentMicrophoneId: '',
    currentSpeakerId: '',
    cameraList: [],
    microphoneList: [],
    speakerList: [],
  }),
  getters: {
    // localStream: (state) => {
    //   const { userId, userAvatar, userName, mainStreamInfo } = state.localUser;
    //   return { ...mainStreamInfo, userId, userAvatar, userName };
    // },
    remoteStreamMap: (state) => {
      const map = new Map();
      [...state.remoteUserMap.values()].forEach((userInfo) => {
        const { userId, userAvatar, userName, mainStreamInfo, screenStreamInfo } = userInfo;
        if (mainStreamInfo) {
          map.set(`${userId}_main`, Object.assign(mainStreamInfo, { userId, userAvatar, userName }));
        }
        if (screenStreamInfo) {
          map.set(`${userId}_screen`, Object.assign(screenStreamInfo, { userId, userAvatar, userName }));
        }
      });
      return map;
    },
    remoteStreamList(): Array<StreamInfo> {
      return [...this.remoteStreamMap.values()];
    },
    streamList(): Array<StreamInfo> {
      return [this.localStream, ...this.remoteStreamMap.values()];
    },
    streamNumber(): number {
      return this.streamList.length;
    },
    remoteAnchorList: state => [...state.remoteUserMap.values()].filter(item => item.role === ETUIRoomRole.ANCHOR),
    userList: state => [state.localUser, ...state.remoteUserMap.values()],
    userNumber(): number {
      return this.userList.length;
    },
    applyToAnchorList: state => [...state.remoteUserMap.values()].filter(item => item.isUserApplyingToAnchor) || [],
  },
  actions: {
    setLocalUser(obj: Record<string, any>) {
      Object.assign(this.localUser, obj);
      Object.assign(this.localStream, obj);
    },
    updateLocalStream(obj: StreamInfo) {
      Object.assign(this.localStream, obj);
    },
    // 远端用户进入房间（IM事件）
    addRemoteUser(userInfo: {
      userId: string,
      name: string,
      avatar: string,
    }) {
      const { userId, name, avatar } = userInfo;
      const basicStore = useBasicStore();
      if (!userId || userId === basicStore.userId || userId === `share_${basicStore.userId}`) {
        return;
      }
      let newUser: UserInfo = {
        userId,
        userName: name || '',
        userAvatar: avatar || '',
        mainStreamInfo: null,
        screenStreamInfo: null,
        role: ETUIRoomRole.AUDIENCE,
      };
      if (this.remoteUserMap.get(userId)) {
        // addRemoteUser 会多次触发, 如果已存在时需保留已设置的状态。修复 Electron 端 bug
        newUser = {
          ...newUser,
          ...this.remoteUserMap.get(userId)
        };
      }
      // 本端为主持人，则记录用户禁言禁画, 申请发言等信息
      if (basicStore.role === ETUIRoomRole.MASTER) {
        Object.assign(newUser, {
          isAudioMutedByMaster: basicStore.isMuteAllAudio,
          isVideoMutedByMaster: basicStore.isMuteAllVideo,
          isChatMutedByMaster: false,
          isUserApplyingToAnchor: false,
          isInvitingUserToAnchor: false,
        });
      }
      this.remoteUserMap.set(userId, newUser);
    },
    updateRemoteUser(userId: string, newUserInfo: { nick: string, avatar: string }) {
      const remoteUser = this.remoteUserMap.get(userId);
      if (!remoteUser) {
        return;
      }
      const { nick, avatar } = newUserInfo;
      Object.assign(remoteUser, { userName: nick, userAvatar: avatar });
    },
    updateUserAVAbility(userInfo: {
      userId: string,
      name: string,
      avatar: string,
    }, enabled: Boolean) {
      const { userId, name, avatar } = userInfo;
      const basicStore = useBasicStore();
      if (!userId || userId === basicStore.userId || userId === `share_${basicStore.userId}`) {
        return;
      }
      // 处理 Web 端屏幕分享
      if (userInfo.userId.indexOf('share_') === 0) {
        if (!this.remoteUserMap.get(userId.slice(6))) {
          return;
        }
        if (enabled) {
          const newUser = {
            userId,
            userName: name || '',
            userAvatar: avatar || '',
            role: ETUIRoomRole.ANCHOR,
            mainStreamInfo: {
              isAudioStreamAvailable: false,
              isVideoStreamAvailable: false,
              type: 'main',
            },
            screenStreamInfo: null,
          };
          this.remoteUserMap.set(userId, newUser);
        } else {
          this.remoteUserMap.delete(userId);
        }
      } else {
        const remoteUserInfo = this.remoteUserMap.get(userId);
        if (!remoteUserInfo) {
          return;
        }
        if (enabled) {
          remoteUserInfo.mainStreamInfo = {
            isAudioStreamAvailable: false,
            isVideoStreamAvailable: false,
            audioVolume: 0,
            type: 'main',
          };
          remoteUserInfo.role = ETUIRoomRole.ANCHOR;
        } else {
          remoteUserInfo.mainStreamInfo = null;
          remoteUserInfo.role = ETUIRoomRole.AUDIENCE;
        }
      }
    },
    updateRemoteAudioStream(eventInfo: any) {
      const {
        userId,
        available,
      } = eventInfo;
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (!remoteUserInfo) {
        return;
      }
      const streamInfo = remoteUserInfo.mainStreamInfo || { type: 'main' };
      remoteUserInfo.mainStreamInfo = Object.assign(streamInfo, { isAudioStreamAvailable: !!available });
    },

    updateRemoteVideoStream(eventInfo: any) {
      const {
        userId,
        available,
      } = eventInfo;
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (!remoteUserInfo) {
        return;
      }
      const streamInfo = remoteUserInfo.mainStreamInfo || { type: 'main' };
      remoteUserInfo.mainStreamInfo = Object.assign(streamInfo, { isVideoStreamAvailable: !!available });
    },

    updateRemoteScreenStream(eventInfo: any) {
      const {
        userId,
        available,
      } = eventInfo;
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (!remoteUserInfo) {
        return;
      }
      if (available) {
        const streamInfo = remoteUserInfo.screenStreamInfo || { type: 'screen' };
        remoteUserInfo.screenStreamInfo = Object.assign(streamInfo, { isScreenStreamAvailable: !!available });
      } else {
        remoteUserInfo.screenStreamInfo = null;
      }
    },

    removeRemoteUser(userId: string) {
      const basicStore = useBasicStore();
      if (!userId || userId === basicStore.userId || userId === `share_${basicStore.userId}`) {
        return;
      }
      this.remoteUserMap.delete(userId);
    },

    setAudioVolume(audioVolumeArray: []) {
      const basicStore = useBasicStore();
      audioVolumeArray.forEach((audioVolumeItem: any) => {
        const { userId, volume } = audioVolumeItem;
        if ((userId === basicStore.userId || userId === '') && this.localStream) {
          this.localStream.audioVolume = volume;
        } else {
          const remoteUserInfo = this.remoteUserMap.get(userId);
          if (remoteUserInfo && remoteUserInfo.mainStreamInfo) {
            remoteUserInfo.mainStreamInfo.audioVolume = volume;
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
    setRoomParam(roomParam: any) {
      if (!roomParam) {
        return;
      }
      const basicStore = useBasicStore();
      const { isOpenCamera, isOpenMicrophone, defaultCameraId, defaultMicrophoneId, defaultSpeakerId } = roomParam;
      defaultCameraId && this.setCurrentCameraId(defaultCameraId);
      defaultMicrophoneId && this.setCurrentMicrophoneId(defaultMicrophoneId);
      defaultSpeakerId && this.setCurrentSpeakerId(defaultSpeakerId);
      // 如果已经开启全员禁言/当前为申请发言模式，则忽略默认打开麦克风的设置
      if (basicStore.isMaster || (!basicStore.isMuteAllAudio && basicStore.roomMode !== ETUISpeechMode.APPLY_SPEECH)) {
        typeof isOpenMicrophone === 'boolean' && (this.isDefaultOpenMicrophone = isOpenMicrophone);
      }
      // 如果已经开启全员禁画/当前为申请发言模式，则忽略默认打开摄像头的设置
      if (basicStore.isMaster || (!basicStore.isMuteAllVideo && basicStore.roomMode !== ETUISpeechMode.APPLY_SPEECH)) {
        typeof isOpenCamera === 'boolean' && (this.isDefaultOpenCamera = isOpenCamera);
      }
    },
    setHasStartedCamera(state: boolean) {
      this.hasStartedCamera = state;
    },
    setHasStartedMicrophone(state: boolean) {
      this.hasStartedMicrophone = state;
    },
    setIsLocalAudioMuted(isLocalAudioMuted: boolean) {
      this.isLocalAudioMuted = isLocalAudioMuted;
    },
    setIsLocalVideoMuted(isLocalVideoMuted: boolean) {
      this.isLocalVideoMuted = isLocalVideoMuted;
    },
    setCameraList(deviceList: {deviceId: string, deviceName: string}[]) {
      this.cameraList = deviceList;
      if (!this.currentCameraId) {
        this.setCurrentCameraId(deviceList[0].deviceId);
      }
    },
    setMicrophoneList(deviceList: {deviceId: string, deviceName: string}[]) {
      this.microphoneList = deviceList;
      if (!this.currentMicrophoneId) {
        this.setCurrentMicrophoneId(deviceList[0].deviceId);
      }
    },
    setSpeakerList(deviceList: {deviceId: string, deviceName: string}[]) {
      this.speakerList = deviceList;
      if (!this.currentSpeakerId) {
        this.setCurrentSpeakerId(deviceList[0].deviceId);
      }
    },
    // 主持人单个修改用户的音频 mute 状态
    setMuteUserAudio(userId: string, muted: boolean) {
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (remoteUserInfo) {
        remoteUserInfo.isAudioMutedByMaster = muted;
      }
    },
    // 全员禁麦时设置所有人的禁麦状态
    setMuteAllAudio(muted: boolean) {
      const remoteUserList = Array.from(this.remoteUserMap.values());
      remoteUserList.forEach((remoteUserInfo) => {
        Object.assign(remoteUserInfo, { isAudioMutedByMaster: muted });
      });
    },
    // 主持人单个修改用户的视频 mute 状态
    setMuteUserVideo(userId: string, muted: boolean) {
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (remoteUserInfo) {
        remoteUserInfo.isVideoMutedByMaster = muted;
      }
    },
    // 全员禁画时设置所有人的禁画状态
    setMuteAllVideo(muted: boolean) {
      const remoteUserList = Array.from(this.remoteUserMap.values());
      remoteUserList.forEach((remoteUserInfo) => {
        Object.assign(remoteUserInfo, { isVideoMutedByMaster: muted });
      });
    },
    // 主持人单个修改用户的发文字消息 mute 状态
    setMuteUserChat(userId: string, muted: boolean) {
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (remoteUserInfo) {
        remoteUserInfo.isChatMutedByMaster = muted;
      }
    },
    setRemoteUserRole(userId: string, role: ETUIRoomRole) {
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (remoteUserInfo) {
        remoteUserInfo.role = role;
      }
    },
    addApplyToAnchorUser(userId: string) {
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (remoteUserInfo) {
        remoteUserInfo.isUserApplyingToAnchor = true;
      }
    },
    removeApplyToAnchorUser(userId: string) {
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (remoteUserInfo) {
        remoteUserInfo.isUserApplyingToAnchor = false;
      }
    },
    addInviteToAnchorUser(userId: string) {
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (remoteUserInfo) {
        remoteUserInfo.isInvitingUserToAnchor = true;
      }
    },
    removeInviteToAnchorUser(userId: string) {
      const remoteUserInfo = this.remoteUserMap.get(userId);
      if (remoteUserInfo) {
        remoteUserInfo.isInvitingUserToAnchor = false;
      }
    },
    reset() {
      this.localUser = {
        userId: '',
        userAvatar: '',
        userName: '',
        mainStreamInfo: null,
        screenStreamInfo: null,
      };
      this.localStream = {
        type: 'main',
      };
      this.remoteUserMap = new Map();
      this.isDefaultOpenCamera = false;
      this.isDefaultOpenMicrophone = false;
      this.isLocalAudioMuted = false;
      this.isLocalVideoMuted = false;
      this.hasStartedCamera = false;
      this.hasStartedMicrophone = false;
    },
  },
});
