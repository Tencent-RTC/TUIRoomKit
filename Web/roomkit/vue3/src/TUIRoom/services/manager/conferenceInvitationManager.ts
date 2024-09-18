import {
  TUIConferenceInvitationManagerEvents,
  TUIInvitation,
  TUIInvitationRejectedReason,
  TUIRoomInfo,
} from '@tencentcloud/tuiroom-engine-js';
import { EventType, IRoomService } from '../types';
import mitt from 'mitt';
export * from '@tencentcloud/tuiroom-engine-js';
interface IConferenceInvitationManager {
  on(
    eventType: TUIConferenceInvitationManagerEvents,
    callback: (data?: any) => any
  ): void;
  off(
    eventType: TUIConferenceInvitationManagerEvents,
    callback: (data?: any) => void
  ): void;
  dispose(): void;
  inviteUsers(options: { userIdList: string[] }): Promise<void>;
  cancelInvitation(options: {
    roomId: string;
    userIdList: string[];
  }): Promise<void>;
  accept(options: { roomId: string }): Promise<void>;
  reject(options: {
    roomId: string;
    reason: TUIInvitationRejectedReason;
  }): Promise<void>;
  getInvitationList(options: {
    roomId: string;
    cursor: string;
    count: number;
  }): Promise<void>;
}

export interface IConferenceInvitationManagerOptions {
  roomId: string;
}

export interface InviteParams {
  roomId: string;
  userIdList: string[];
  timeout: number;
  extensionInfo?: string;
}

export class ConferenceInvitationManager
  implements IConferenceInvitationManager
{
  private service: IRoomService;
  private emitter = mitt();

  private isBeingInvited = false;

  constructor(service: IRoomService) {
    this.service = service;
    this.bindEventContext();
    this.service.on(EventType.SERVICE_READY, () => {
      this.bindEvent();
    });
  }
  public dispose() {
    this.unbindEvent();
  }

  public on(
    eventType: TUIConferenceInvitationManagerEvents,
    callback: (data?: any) => any
  ) {
    this.emitter.on(eventType, callback);
  }

  public off(
    eventType: TUIConferenceInvitationManagerEvents,
    callback: (data?: any) => void
  ) {
    this.emitter.off(eventType, callback);
  }

  private emit(eventType: TUIConferenceInvitationManagerEvents, data?: any) {
    this.emitter.emit(eventType, data);
  }

  private bindEventContext() {
    this.onReceiveInvitation = this.onReceiveInvitation.bind(this);
    this.onInvitationHandledByOtherDevice =
      this.onInvitationHandledByOtherDevice.bind(this);
    this.onInvitationAccepted = this.onInvitationAccepted.bind(this);
    this.onInvitationRejected = this.onInvitationRejected.bind(this);
    this.onInvitationTimeout = this.onInvitationTimeout.bind(this);
    this.onInvitationAdded = this.onInvitationAdded.bind(this);
    this.onInvitationStatusChanged = this.onInvitationStatusChanged.bind(this);
    this.onInvitationRevokedByAdmin =
      this.onInvitationRevokedByAdmin.bind(this);
  }

  private bindEvent() {
    const conferenceInvitationManager =
      this.service.roomEngine?.instance.getConferenceInvitationManager();
    conferenceInvitationManager.on(
      TUIConferenceInvitationManagerEvents.onReceiveInvitation,
      this.onReceiveInvitation
    );
    conferenceInvitationManager.on(
      TUIConferenceInvitationManagerEvents.onInvitationHandledByOtherDevice,
      this.onInvitationHandledByOtherDevice
    );
    conferenceInvitationManager.on(
      TUIConferenceInvitationManagerEvents.onInvitationAccepted,
      this.onInvitationAccepted
    );
    conferenceInvitationManager.on(
      TUIConferenceInvitationManagerEvents.onInvitationRejected,
      this.onInvitationRejected
    );
    conferenceInvitationManager.on(
      TUIConferenceInvitationManagerEvents.onInvitationTimeout,
      this.onInvitationTimeout
    );
    conferenceInvitationManager.on(
      TUIConferenceInvitationManagerEvents.onInvitationAdded,
      this.onInvitationAdded
    );
    conferenceInvitationManager.on(
      TUIConferenceInvitationManagerEvents.onInvitationStatusChanged,
      this.onInvitationStatusChanged
    );
    conferenceInvitationManager.on(
      TUIConferenceInvitationManagerEvents.onInvitationRevokedByAdmin,
      this.onInvitationRevokedByAdmin
    );
  }

  private unbindEvent() {
    const conferenceInvitationManager =
      this.service.roomEngine?.instance.getConferenceListManager();
    conferenceInvitationManager.off(
      TUIConferenceInvitationManagerEvents.onReceiveInvitation,
      this.onReceiveInvitation
    );
    conferenceInvitationManager.off(
      TUIConferenceInvitationManagerEvents.onInvitationHandledByOtherDevice,
      this.onInvitationHandledByOtherDevice
    );
    conferenceInvitationManager.off(
      TUIConferenceInvitationManagerEvents.onInvitationAccepted,
      this.onInvitationAccepted
    );
    conferenceInvitationManager.off(
      TUIConferenceInvitationManagerEvents.onInvitationRejected,
      this.onInvitationRejected
    );
    conferenceInvitationManager.off(
      TUIConferenceInvitationManagerEvents.onInvitationTimeout,
      this.onInvitationTimeout
    );
    conferenceInvitationManager.off(
      TUIConferenceInvitationManagerEvents.onInvitationAdded,
      this.onInvitationAdded
    );
    conferenceInvitationManager.off(
      TUIConferenceInvitationManagerEvents.onInvitationStatusChanged,
      this.onInvitationStatusChanged
    );
    conferenceInvitationManager.off(
      TUIConferenceInvitationManagerEvents.onInvitationRevokedByAdmin,
      this.onInvitationRevokedByAdmin
    );
  }

  private onReceiveInvitation(data: {
    roomInfo: TUIRoomInfo;
    invitation: TUIInvitation;
    extensionInfo: string;
  }) {
    if (this.isBeingInvited || this.service.roomStore.localUser.isInRoom) {
      const reason = this.isBeingInvited
        ? TUIInvitationRejectedReason.kRejectToEnter
        : TUIInvitationRejectedReason.kInOtherConference;
      this.reject({ roomId: data.roomInfo.roomId, reason });
    } else {
      this.isBeingInvited = true;
      this.emit(TUIConferenceInvitationManagerEvents.onReceiveInvitation, data);
    }
  }

  private onInvitationHandledByOtherDevice(data: {
    roomInfo: TUIRoomInfo;
    accepted: boolean;
  }) {
    this.emit(
      TUIConferenceInvitationManagerEvents.onInvitationHandledByOtherDevice,
      data
    );
  }

  private onInvitationAccepted(data: {
    roomInfo: TUIRoomInfo;
    invitation: TUIInvitation;
  }) {
    const { userId, userName, avatarUrl } = data.invitation.invitee;
    const { status } = data.invitation;
    const inviteeInfo = { userId, userName, avatarUrl, status };
    this.service.roomStore.addRemoteUser(inviteeInfo);
    this.emit(TUIConferenceInvitationManagerEvents.onInvitationAccepted, data);
  }

  private onInvitationRejected(data: {
    roomInfo: TUIRoomInfo;
    invitation: TUIInvitation;
    reason: TUIInvitationRejectedReason;
  }) {
    const { userId, userName, avatarUrl } = data.invitation.invitee;
    const { status } = data.invitation;
    const inviteeInfo = { userId, userName, avatarUrl, status };
    this.service.roomStore.updateInviteeList([inviteeInfo]);
    this.emit(TUIConferenceInvitationManagerEvents.onInvitationRejected, data);
  }

  private onInvitationTimeout(data: {
    roomId: string;
    roomInfo: TUIRoomInfo;
    invitation: TUIInvitation;
  }) {
    const { userId, userName, avatarUrl } = data.invitation.invitee;
    const { status } = data.invitation;
    const inviteeInfo = { userId, userName, avatarUrl, status };
    this.service.roomStore.updateInviteeList([inviteeInfo]);
    this.isBeingInvited = false;
    this.emit(TUIConferenceInvitationManagerEvents.onInvitationTimeout, data);
  }

  private onInvitationAdded(data: {
    roomInfo: TUIRoomInfo;
    invitation: TUIInvitation;
  }) {
    const { userId, userName, avatarUrl } = data.invitation.invitee;
    const { status } = data.invitation;
    const inviteeInfo = { userId, userName, avatarUrl, status };
    this.service.roomStore.updateInviteeList([inviteeInfo]);
    this.emit(TUIConferenceInvitationManagerEvents.onInvitationAdded, data);
  }

  private onInvitationStatusChanged(data: {
    roomInfo: TUIRoomInfo;
    invitation: TUIInvitation;
  }) {
    const { userId, userName, avatarUrl } = data.invitation.invitee;
    const { status } = data.invitation;
    const inviteeInfo = { userId, userName, avatarUrl, status };
    this.service.roomStore.updateInviteeList([inviteeInfo]);
    this.emit(
      TUIConferenceInvitationManagerEvents.onInvitationStatusChanged,
      data
    );
  }

  private onInvitationRevokedByAdmin(data: {
    roomInfo: TUIRoomInfo;
    invitation: TUIInvitation;
  }) {
    this.emit(
      TUIConferenceInvitationManagerEvents.onInvitationRevokedByAdmin,
      data
    );
  }

  async inviteUsers(options: { userIdList: string[] }) {
    const { userIdList } = options;
    const inviteParams = {
      roomId: this.service.basicStore.roomId,
      timeout: 60,
      userIdList,
      extensionInfo: '',
    };
    return await this.service.roomEngine.instance
      ?.getConferenceInvitationManager()
      .inviteUsers(inviteParams);
  }

  async cancelInvitation(options: { roomId: string; userIdList: string[] }) {
    return await this.service.roomEngine.instance
      ?.getConferenceInvitationManager()
      .cancelInvitation(options);
  }

  async accept(options: { roomId: string }) {
    this.isBeingInvited = false;
    return await this.service.roomEngine.instance
      ?.getConferenceInvitationManager()
      .accept(options);
  }

  async reject(options: {
    roomId: string;
    reason: TUIInvitationRejectedReason;
  }) {
    this.isBeingInvited = false;
    return await this.service.roomEngine.instance
      ?.getConferenceInvitationManager()
      .reject(options);
  }

  async getInvitationList(options: {
    roomId: string;
    cursor: string;
    count: number;
  }) {
    return await this.service.roomEngine.instance
      ?.getConferenceInvitationManager()
      .getInvitationList(options);
  }
}
