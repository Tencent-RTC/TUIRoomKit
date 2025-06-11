import useRoomEngine from '../../hooks/useRoomEngine';
import {
  TUIUserInfo,
  TUIRole,
  TUIRoomEvents,
  TUISeatMode,
} from '@tencentcloud/tuiroom-engine-js';

const roomEngine = useRoomEngine();
// RoomManger 里面不做状态的 set（这个待定），只处理业务逻辑过程中的兼容逻辑和错误处理，
// 不处理其他模块的特定逻辑，其他模块的逻辑监听房间状态变化来处理
export default class RoomEventManager {
  private store: any;
  constructor(options: { store: any }) {
    this.store = options.store;

    this.onRoomNameChanged = this.onRoomNameChanged.bind(this);
    this.onRoomSeatModeChanged = this.onRoomSeatModeChanged.bind(this);
    this.onRoomUserCountChanged = this.onRoomUserCountChanged.bind(this);
    this.onAllUserCameraDisableChanged =
      this.onAllUserCameraDisableChanged.bind(this);
    this.onScreenShareForAllUserDisableChanged =
      this.onScreenShareForAllUserDisableChanged.bind(this);
    this.onAllUserMicrophoneDisableChanged =
      this.onAllUserMicrophoneDisableChanged.bind(this);
    this.onSendMessageForAllUserDisableChanged =
      this.onSendMessageForAllUserDisableChanged.bind(this);
    this.onUserInfoChanged = this.onUserInfoChanged.bind(this);
    this.bindRoomEngineEvents();
  }

  private onRoomNameChanged({ roomName }: { roomName: string }) {
    this.store.setRoomInfo({ roomName });
  }

  private onRoomSeatModeChanged({ seatMode }: { seatMode: TUISeatMode }) {
    this.store.setRoomInfo({ seatMode });
  }

  private onRoomUserCountChanged({ userCount }: { userCount: number }) {
    this.store.setRoomInfo({ roomMemberCount: userCount });
  }

  private onAllUserCameraDisableChanged({ isDisable }: { isDisable: boolean }) {
    this.store.setRoomInfo({ isCameraDisableForAllUser: isDisable });
  }

  private onScreenShareForAllUserDisableChanged({
    isDisable,
  }: {
    isDisable: boolean;
  }) {
    this.store.setRoomInfo({ isScreenShareDisableForAllUser: isDisable });
  }

  private onAllUserMicrophoneDisableChanged({
    isDisable,
  }: {
    isDisable: boolean;
  }) {
    this.store.setRoomInfo({ isMicrophoneDisableForAllUser: isDisable });
  }

  private onSendMessageForAllUserDisableChanged({
    isDisable,
  }: {
    isDisable: boolean;
  }) {
    this.store.setRoomInfo({ isMessageDisableForAllUser: isDisable });
  }

  private onUserInfoChanged({ userInfo }: { userInfo: TUIUserInfo }) {
    if (userInfo.userRole === TUIRole.kRoomOwner) {
      this.store.setRoomInfo({
        roomOwner: userInfo.userId,
        ownerId: userInfo.userId,
      });
    }
  }

  private bindRoomEngineEvents() {
    roomEngine.instance?.on(
      TUIRoomEvents.onRoomNameChanged,
      this.onRoomNameChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onRoomSeatModeChanged,
      this.onRoomSeatModeChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onRoomUserCountChanged,
      this.onRoomUserCountChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onAllUserCameraDisableChanged,
      this.onAllUserCameraDisableChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onScreenShareForAllUserDisableChanged,
      this.onScreenShareForAllUserDisableChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onAllUserMicrophoneDisableChanged,
      this.onAllUserMicrophoneDisableChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onSendMessageForAllUserDisableChanged,
      this.onSendMessageForAllUserDisableChanged
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onUserInfoChanged,
      this.onUserInfoChanged
    );
  }
}
