import { defineStore } from 'pinia';
import { useBasicStore } from './basic';

export type StreamInfo = {
  userId?: string,
  userName?: string,
  userAvatar?: string,
  isAudioStreamAvailable?: boolean,
  isVideoStreamAvailable?: boolean,
  isScreenStreamAvailable?: boolean,
  audioVolume?: number,
  type?: string,
  // 主持人侧 remoteStream 有以下属性，用来标示主持人是否对该用户禁画/静音/禁止发文字消息
  isAudioMutedByMaster?: boolean,
  isVideoMutedByMaster?: boolean,
  isChatMutedByMaster?: boolean,
}

interface StreamState {
  localStream: StreamInfo,
  remoteStreamMap: Map<string, StreamInfo>,
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

export const useStreamStore = defineStore('stream', {
  state: (): StreamState => ({
    localStream: {},
    remoteStreamMap: new Map(),
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
    streamList: state => [state.localStream, ...state.remoteStreamMap.values()],
    streamNumber: state => state.remoteStreamMap.size + 1,
  },
  actions: {
    addLocalStream(obj: Record<string, any>) {
      Object.assign(this.localStream, { ...obj, type: 'main' });
    },
    updateLocalStream(obj: Record<string, any>) {
      Object.assign(this.localStream, obj);
    },
    addRemoteUser(streamInfo: any) {
      const {
        userId,
        name,
        avatar,
        isAudioStreamAvailable,
        isVideoStreamAvailable,
        isAudioMutedByMaster,
        isVideoMutedByMaster,
        isChatMutedByMaster,
      } = streamInfo;
      if (!userId || userId === this.localStream.userId || userId === `share_${this.localStream.userId}`) {
        return;
      }
      this.remoteStreamMap.set(`${userId}_main`, {
        userId,
        userName: name,
        userAvatar: avatar,
        isAudioStreamAvailable,
        isVideoStreamAvailable,
        isAudioMutedByMaster: !!isAudioMutedByMaster,
        isVideoMutedByMaster: !!isVideoMutedByMaster,
        isChatMutedByMaster: !!isChatMutedByMaster,
        type: 'main',
      });
    },
    updateRemoteAudioStream(eventInfo: any) {
      const {
        userId,
        available,
      } = eventInfo;
      const originData = this.remoteStreamMap.get(`${userId}_main`);
      if (!originData) {
        return;
      }
      this.remoteStreamMap.set(`${userId}_main`, {
        ...originData,
        isAudioStreamAvailable: !!available,
      });
    },

    updateRemoteVideoStream(eventInfo: any) {
      const {
        userId,
        available,
      } = eventInfo;
      const originData = this.remoteStreamMap.get(`${userId}_main`);
      if (!originData) {
        return;
      }
      this.remoteStreamMap.set(`${userId}_main`, {
        ...originData,
        isVideoStreamAvailable: !!available,
      });
    },

    updateRemoteScreenStream(eventInfo: any) {
      const {
        userId,
        available,
      } = eventInfo;
      const basicData = this.remoteStreamMap.get(`${userId}_main`);
      this.remoteStreamMap.set(`${userId}_screen`, {
        userId,
        userAvatar: basicData?.userAvatar,
        userName: basicData?.userName,
        isScreenStreamAvailable: available,
        type: 'screen',
      });
    },
    removeRemoteUser(streamInfo: any) {
      const {
        userId,
      } = streamInfo;
      if (!userId || userId === this.localStream.userId) {
        return;
      }
      this.remoteStreamMap.delete(`${userId}_main`);
      if (this.remoteStreamMap.has(`${userId}_screen`)) {
        this.remoteStreamMap.delete(`${userId}_screen`);
      }
    },
    setAudioVolume(audioVolumeArray: []) {
      audioVolumeArray.forEach((audioVolumeItem: any) => {
        const { userId, audioVolume } = audioVolumeItem;
        if (userId === this.localStream.userId || userId === 'local') {
          this.localStream.audioVolume = audioVolume;
        } else {
          const remoteStream = this.remoteStreamMap.get(`${userId}_main`);
          if (remoteStream !== undefined) {
            remoteStream.audioVolume = audioVolume;
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
      // 如果已经开启全员禁言，则忽略默认打开麦克风的设置
      if (basicStore.isMaster || !basicStore.isMuteAllAudio) {
        typeof isOpenCamera === 'boolean' && (this.isDefaultOpenCamera = isOpenCamera);
      }
      // 如果已经开启全员禁画，则忽略默认打开摄像头的设置
      if (basicStore.isMaster || !basicStore.isMuteAllVideo) {
        typeof isOpenMicrophone === 'boolean' && (this.isDefaultOpenMicrophone = isOpenMicrophone);
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
      const originData = this.remoteStreamMap.get(`${userId}_main`);
      if (!originData) {
        return;
      }
      this.remoteStreamMap.set(`${userId}_main`, {
        ...originData,
        isAudioMutedByMaster: muted,
      });
    },
    // 全员禁麦时设置所有人的禁麦状态
    setMuteAllAudio(muted: boolean) {
      const remoteStreamList = Array.from(this.remoteStreamMap.values());
      remoteStreamList.forEach((remoteStream) => {
        Object.assign(remoteStream, { isAudioMutedByMaster: muted });
      });
    },
    // 主持人单个修改用户的视频 mute 状态
    setMuteUserVideo(userId: string, muted: boolean) {
      const originData = this.remoteStreamMap.get(`${userId}_main`);
      if (!originData) {
        return;
      }
      this.remoteStreamMap.set(`${userId}_main`, {
        ...originData,
        isVideoMutedByMaster: muted,
      });
    },
    // 全员禁画时设置所有人的禁画状态
    setMuteAllVideo(muted: boolean) {
      const remoteStreamList = Array.from(this.remoteStreamMap.values());
      remoteStreamList.forEach((remoteStream) => {
        Object.assign(remoteStream, { isVideoMutedByMaster: muted });
      });
    },
    // 主持人单个修改用户的发文字消息 mute 状态
    setMuteUserChat(userId: string, muted: boolean) {
      const originData = this.remoteStreamMap.get(`${userId}_main`);
      if (!originData) {
        return;
      }
      this.remoteStreamMap.set(`${userId}_main`, {
        ...originData,
        isChatMutedByMaster: muted,
      });
    },
    reset() {
      this.localStream = {};
      this.remoteStreamMap = new Map();
      this.isDefaultOpenCamera = false;
      this.isDefaultOpenMicrophone = false;
      this.isLocalAudioMuted = false;
      this.isLocalVideoMuted = false;
      this.hasStartedCamera = false;
      this.hasStartedMicrophone = false;
    },
  },
});
