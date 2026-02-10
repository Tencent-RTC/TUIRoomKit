import {
  useLoginState,
  useRoomEngine,
  useRoomState,
  useDeviceState,
} from 'tuikit-atomicx-vue3/room';
import useRoomLifeCycle from '../hooks/useRoomLifeCycle';
import { eventCenter } from '../utils/eventCenter';
import { RoomEvent, StartOptions, JoinOptions, IConference, ComponentName, ComponentConfig } from './type';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';

class Conference implements IConference {
  private componentConfig: ComponentConfig[] = [];

  public login(params: {
    sdkAppId: number;
    userId: string;
    userSig: string;
    tim?: any;
  }) {
    const { login } = useLoginState();
    return login({
      userId: params.userId,
      userSig: params.userSig,
      sdkAppId: params.sdkAppId,
    });
  }

  public async logout() {
    const { logout } = useLoginState();
    return logout();
  }

  public getRoomEngine() {
    const roomEngine = useRoomEngine() as { instance: TUIRoomEngine } | null ;
    if (!roomEngine) {
      console.warn('getRoomEngine failed, roomEngine is not exist');
    }
    return roomEngine;
  }

  public on(eventType: RoomEvent, callback: (data?: any) => void) {
    eventCenter.on(eventType, callback);
  }

  public off(eventType: RoomEvent, callback: (data?: any) => void) {
    eventCenter.off(eventType, callback);
  }

  public async start({ roomId, options }: { roomId: string; options?: StartOptions }) {
    const { createAndJoinRoom } = useRoomState();
    const {
      openLocalCamera,
      openLocalMicrophone,
      setCurrentCamera,
      setCurrentMicrophone,
      setCurrentSpeaker,
    } = useDeviceState();

    const {
      roomName,
      isOpenCamera = false,
      isOpenMicrophone = false,
      defaultCameraId,
      defaultMicrophoneId,
      defaultSpeakerId,
      password,
    } = options || {};

    const { isJoiningRoom, handleJoinRoomError } = useRoomLifeCycle();
    isJoiningRoom.value = true;
    try {
      await createAndJoinRoom({
        roomId,
        options: {
          roomName,
          password,
        },
      });
    } catch (error) {
      isJoiningRoom.value = false;
      handleJoinRoomError(error);
      throw error;
    }
    isJoiningRoom.value = false;

    // Set default device before opening
    if (defaultCameraId) {
      await setCurrentCamera({ deviceId: defaultCameraId });
    }
    if (defaultMicrophoneId) {
      await setCurrentMicrophone({ deviceId: defaultMicrophoneId });
    }
    if (defaultSpeakerId) {
      await setCurrentSpeaker({ deviceId: defaultSpeakerId });
    }

    // Open device based on parameters
    if (isOpenCamera) {
      try {
        await openLocalCamera();
      } catch (error) {
        console.warn('Failed to open camera:', error);
      }
    }

    if (isOpenMicrophone) {
      try {
        await openLocalMicrophone();
      } catch (error) {
        console.warn('Failed to open microphone:', error);
      }
    }
  }

  public async join({ roomId, options }: { roomId: string; options?: JoinOptions }) {
    const { joinRoom } = useRoomState();
    const {
      openLocalCamera,
      openLocalMicrophone,
      setCurrentCamera,
      setCurrentMicrophone,
      setCurrentSpeaker,
    } = useDeviceState();

    const {
      isOpenCamera = false,
      isOpenMicrophone = false,
      defaultCameraId,
      defaultMicrophoneId,
      defaultSpeakerId,
      password,
    } = options || {};

    // Join existing room with atomicx API
    const { isJoiningRoom, joiningRoomId, handleJoinRoomError }
      = useRoomLifeCycle();
    isJoiningRoom.value = true;
    joiningRoomId.value = roomId;
    try {
      await joinRoom({
        roomId,
        password,
      });
    } catch (error) {
      isJoiningRoom.value = false;
      handleJoinRoomError(error);
      return;
    }
    isJoiningRoom.value = false;
    joiningRoomId.value = '';
    // Set default device before opening
    if (defaultCameraId) {
      await setCurrentCamera({ deviceId: defaultCameraId });
    }
    if (defaultMicrophoneId) {
      await setCurrentMicrophone({ deviceId: defaultMicrophoneId });
    }
    if (defaultSpeakerId) {
      await setCurrentSpeaker({ deviceId: defaultSpeakerId });
    }

    // Open device based on parameters
    if (isOpenCamera) {
      try {
        await openLocalCamera();
      } catch (error) {
        console.warn('Failed to open camera:', error);
      }
    }

    if (isOpenMicrophone) {
      try {
        await openLocalMicrophone();
      } catch (error) {
        console.warn('Failed to open microphone:', error);
      }
    }
  }

  public async leave() {
    const { leaveRoom } = useRoomState();
    await leaveRoom();
  }

  public async dismiss() {
    const { endRoom } = useRoomState();
    await endRoom();
  }

  public setSelfInfo(options: { userName: string; avatarUrl: string }) {
    const { setSelfInfo } = useLoginState();
    return setSelfInfo(options);
  }

  public setComponentConfig(config: ComponentConfig) {
    const index = this.componentConfig.findIndex(item => item.componentName === config.componentName);
    if (index !== -1) {
      this.componentConfig[index] = config;
    } else {
      this.componentConfig.push(config);
    }
  }

  public getComponentConfig(name: ComponentName) {
    return this.componentConfig.find(item => item.componentName === name);
  }



  // public disableTextMessaging() {
  //   roomService.dataReportManager.reportCount(MetricsKey.disableTextMessaging);
  //   roomService.setComponentConfig({ ChatControl: { visible: false } });
  // }

  // public disableScreenSharing() {
  //   roomService.dataReportManager.reportCount(MetricsKey.disableScreenSharing);
  //   roomService.setComponentConfig({ ScreenShare: { visible: false } });
  // }

  // public enableWatermark() {
  //   roomService.dataReportManager.reportCount(MetricsKey.enableWatermark);
  //   roomService.waterMark.toggleWatermark(true);
  // }

  // public enableVirtualBackground() {
  //   roomService.dataReportManager.reportCount(
  //     MetricsKey.enableVirtualBackground
  //   );
  //   roomService.setComponentConfig({ VirtualBackground: { visible: true } });
  // }

  // public hideFeatureButton(name: FeatureButton) {
  //   roomService.dataReportManager.reportCount(MetricsKey.hideFeatureButton);
  //   roomService.setComponentConfig({ [name]: { visible: false } });
  // }

  // public replaceFriendList(userList: Array<any>) {
  //   return roomService.scheduleConferenceManager.replaceFriendList(userList);
  // }

  // public setUserListSortComparator(comparator: Comparator<UserInfo>) {
  //   roomService.userManager.setUserListSortComparator(comparator);
  // }

  // public setStreamListSortComparator(comparator: Comparator<StreamInfo>) {
  //   roomService.userManager.setStreamListSortComparator(comparator);
  // }

  // public setParticipants(
  //   participants: Array<{
  //     userName: string;
  //     userId: string;
  //     avatarUrl: string;
  //   }>
  // ) {
  //   const list = participants.map(item => {
  //     const { userId, userName, avatarUrl } = item;
  //     return {
  //       userID: userId,
  //       profile: { userID: userId, nick: userName, avatar: avatarUrl },
  //     };
  //   });
  //   roomService.scheduleConferenceManager.replaceFriendList(list);
  // }
}

export const conference = new Conference();
