import { defineStore } from 'pinia';
import { ETUIRoomRole, ETUISpeechMode } from '../tui-room-core';
import { useBasicStore } from './basic';
const basicStore = useBasicStore();

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
    localStream: {},
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
          map.set(`${userId}_main`, { userId, userAvatar, userName, ...mainStreamInfo });
        }
        if (screenStreamInfo) {
          map.set(`${userId}_screen`, { userId, userAvatar, userName, ...screenStreamInfo });
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
      this.localStream = { type: 'main', ...obj };
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
      if (!userId || userId === basicStore.userId || userId === `share_${basicStore.userId}`) {
        return;
      }
      const newUser = {
        userId,
        userName: name || '',
        userAvatar: avatar || '',
        mainStreamInfo: null,
        screenStreamInfo: null,
        role: ETUIRoomRole.AUDIENCE,
      };
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
    updateUserAVAbility(userInfo: {
      userId: string,
      name: string,
      avatar: string,
    }, enabled: Boolean) {
      const { userId, name, avatar } = userInfo;
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
      if (!userId || userId === basicStore.userId || userId === `share_${basicStore.userId}`) {
        return;
      }
      this.remoteUserMap.delete(userId);
    },

    setAudioVolume(audioVolumeArray: []) {
      audioVolumeArray.forEach((audioVolumeItem: any) => {
        const { userId, audioVolume } = audioVolumeItem;
        if ((userId === basicStore.userId || userId === 'local') && this.localStream) {
          this.localStream.audioVolume = audioVolume;
        } else {
          const remoteUserInfo = this.remoteUserMap.get(userId);
          if (remoteUserInfo && remoteUserInfo.mainStreamInfo) {
            remoteUserInfo.mainStreamInfo.audioVolume = audioVolume;
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
