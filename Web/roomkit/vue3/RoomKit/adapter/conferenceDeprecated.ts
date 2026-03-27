import {
  useRoomState,
  useDeviceState,
  RoomType,
} from 'tuikit-atomicx-vue3/room';
import useRoomLifeCycle from '../hooks/useRoomLifeCycle';
import { StartOptions, JoinOptions, ComponentConfig, ComponentName } from './type';

/**
 * Deprecated backward-compatible methods.
 * Only the 4 deprecated methods live here; do not add shared state or new methods.
 */
export class ConferenceDeprecated {
  private componentConfig: ComponentConfig[] = [];

  /** @deprecated v5.7.0 use createAndJoinRoom */
  public async start({ roomId, roomType, options }: { roomId: string; roomType?: RoomType; options?: StartOptions }) {
    console.warn('start is deprecated since v5.7.0, use createAndJoinRoom instead');
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
        roomType: roomType || RoomType.Standard,
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

  /** @deprecated v5.7.0 use joinRoom */
  public async join({ roomId, roomType, options }: { roomId: string; roomType?: RoomType; options?: JoinOptions }) {
    console.warn('join is deprecated since v5.7.0, use joinRoom instead');
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
        roomType: roomType || RoomType.Standard,
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

  /** @deprecated v5.7.0 use leaveRoom */
  public async leave() {
    console.warn('leave is deprecated since v5.7.0, use leaveRoom instead');
    const { leaveRoom } = useRoomState();
    await leaveRoom();
  }

  /** @deprecated v5.7.0 use endRoom */
  public async dismiss() {
    console.warn('dismiss is deprecated since v5.7.0, use endRoom instead');
    const { endRoom } = useRoomState();
    await endRoom();
  }

  /** @deprecated v5.7.0 use setWidgetVisible */
  public setComponentConfig(config: ComponentConfig) {
    console.warn('setComponentConfig is deprecated since v5.7.0, use setWidgetVisible instead');
    const index = this.componentConfig.findIndex(item => item.componentName === config.componentName);
    if (index !== -1) {
      this.componentConfig[index] = config;
    } else {
      this.componentConfig.push(config);
    }
  }

  /** @deprecated v5.7.0 use getWidgetVisible */
  public getComponentConfig(name: ComponentName) {
    console.warn('getComponentConfig is deprecated since v5.7.0, use getWidgetVisible instead');
    return this.componentConfig.find(item => item.componentName === name);
  }
}
