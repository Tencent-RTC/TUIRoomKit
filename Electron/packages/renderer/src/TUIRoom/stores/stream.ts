import { defineStore } from 'pinia';

export type StreamInfo = {
  userId?: string,
  userName?: string,
  userAvatar?: string,
  isAudioStreamAvailable?: boolean,
  isVideoStreamAvailable?: boolean,
  isScreenStreamAvailable?: boolean,
  audioVolume?: number,
  type?: string,
}

interface StreamState {
  localStream: StreamInfo,
  remoteStreamMap: Map<string, StreamInfo>,
  isDefaultOpenCamera: boolean,
  isDefaultOpenMicrophone: boolean,
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
      this.localStream = { ...obj, type: 'main' };
    },
    updateLocalStream(obj: Record<string, any>) {
      this.localStream = { ...this.localStream, ...obj };
    },
    addRemoteUser(streamInfo: any) {
      const {
        userId,
        name,
        avatar,
      } = streamInfo;
      if (!userId || userId === this.localStream.userId || userId === `share_${this.localStream.userId}`) {
        return;
      }
      this.remoteStreamMap.set(`${userId}_main`, {
        userId,
        userName: name,
        userAvatar: avatar,
        isAudioStreamAvailable: false,
        isVideoStreamAvailable: false,
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
        isAudioStreamAvailable: available,
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
        isVideoStreamAvailable: available,
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
      const { isOpenCamera, isOpenMicrophone, defaultCameraId, defaultMicrophoneId, defaultSpeakerId } = roomParam;
      defaultCameraId && this.setCurrentCameraId(defaultCameraId);
      defaultMicrophoneId && this.setCurrentMicrophoneId(defaultMicrophoneId);
      defaultSpeakerId && this.setCurrentSpeakerId(defaultSpeakerId);
      typeof isOpenCamera === 'boolean' && (this.isDefaultOpenCamera = isOpenCamera);
      typeof isOpenMicrophone === 'boolean' && (this.isDefaultOpenMicrophone = isOpenMicrophone);
    },
    setHasStartedCamera(state: boolean) {
      this.hasStartedCamera = state;
    },
    setHasStartedMicrophone(state: boolean) {
      this.hasStartedMicrophone = state;
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
    reset() {
      this.remoteStreamMap = new Map();
      this.isDefaultOpenCamera = false;
      this.isDefaultOpenMicrophone = false;
      this.hasStartedCamera = false;
      this.hasStartedMicrophone = false;
    },
  },
});
