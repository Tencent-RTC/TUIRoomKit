import {
  TUIConferenceCancelReason,
  TUIConferenceInfo,
  TUIConferenceListManagerEvents,
  TUIRoomType,
  TUISeatMode,
  TUIUserInfo,
  TUIConferenceStatus,
  TUIConferenceModifyInfo,
} from '@tencentcloud/tuiroom-engine-js';
import { EventType, IRoomService } from '../types';
import mitt from 'mitt';
export * from '@tencentcloud/tuiroom-engine-js';
interface IScheduleConferenceManager {
  on(
    eventType: TUIConferenceListManagerEvents,
    callback: (data?: any) => any
  ): void;
  off(
    eventType: TUIConferenceListManagerEvents,
    callback: (data?: any) => void
  ): void;
  dispose(): void;
  scheduleConference(conferenceInfo: IScheduleConferenceOptions): Promise<void>;
  cancelConference(options: { roomId: string }): Promise<void>;
  updateConferenceInfo(options: {
    roomId: string;
    roomName?: string;
    scheduleStartTime?: number;
    scheduleEndTime?: number;
  }): Promise<void>;
  fetchScheduledConferenceList(options: {
    statusArray?: TUIConferenceStatus[];
    cursor: string;
    count: number;
  }): Promise<Array<TUIConferenceInfo>>;
  fetchAttendeeList(options: {
    roomId: string;
    cursor: string;
    count: number;
  }): Promise<Array<TUIUserInfo>>;
  addAttendeesByAdmin(options: {
    roomId: string;
    userIdList: string[];
  }): Promise<void>;
  removeAttendeesByAdmin(options: {
    roomId: string;
    userIdList: string[];
  }): Promise<void>;

  fetchFriendList(): Promise<void>;
  replaceFriendList(
    userList: Array<{
      userID: string;
      avatar: string;
      nick: string;
    }>
  ): void;
}

export interface IScheduleConferenceOptions {
  scheduleStartTime: number;
  scheduleEndTime: number;
  scheduleAttendees?: string[];
  reminderSecondsBeforeStart?: number;
  roomId: string;
  roomName?: string;
  roomType?: TUIRoomType;
  isSeatEnabled?: boolean;
  seatMode?: TUISeatMode;
  isMicrophoneDisableForAllUser?: boolean;
  isScreenShareDisableForAllUser?: boolean;
  isCameraDisableForAllUser?: boolean;
  isMessageDisableForAllUser?: boolean;
  maxSeatCount?: number;
  password?: string;
}

export class ScheduleConferenceManager implements IScheduleConferenceManager {
  private service: IRoomService;
  private customFriendList?: Array<any>;
  private emitter = mitt();

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
    eventType: TUIConferenceListManagerEvents,
    callback: (data?: any) => any
  ) {
    this.emitter.on(eventType, callback);
  }

  public off(
    eventType: TUIConferenceListManagerEvents,
    callback: (data?: any) => void
  ) {
    this.emitter.off(eventType, callback);
  }

  private emit(eventType: TUIConferenceListManagerEvents, data?: any) {
    this.emitter.emit(eventType, data);
  }

  private bindEventContext() {
    this.onConferenceScheduled = this.onConferenceScheduled.bind(this);
    this.onConferenceWillStart = this.onConferenceWillStart.bind(this);
    this.onConferenceCancelled = this.onConferenceCancelled.bind(this);
    this.onConferenceInfoChanged = this.onConferenceInfoChanged.bind(this);
    this.onScheduleAttendeesChanged =
      this.onScheduleAttendeesChanged.bind(this);
    this.onConferenceStatusChanged = this.onConferenceStatusChanged.bind(this);
  }

  private bindEvent() {
    const conferenceListManager =
      this.service.roomEngine?.instance.getConferenceListManager();
    conferenceListManager.on(
      TUIConferenceListManagerEvents.onConferenceScheduled,
      this.onConferenceScheduled
    );
    conferenceListManager.on(
      TUIConferenceListManagerEvents.onConferenceWillStart,
      this.onConferenceWillStart
    );
    conferenceListManager.on(
      TUIConferenceListManagerEvents.onConferenceCancelled,
      this.onConferenceCancelled
    );
    conferenceListManager.on(
      TUIConferenceListManagerEvents.onConferenceInfoChanged,
      this.onConferenceInfoChanged
    );
    conferenceListManager.on(
      TUIConferenceListManagerEvents.onScheduleAttendeesChanged,
      this.onScheduleAttendeesChanged
    );
    conferenceListManager.on(
      TUIConferenceListManagerEvents.onConferenceStatusChanged,
      this.onConferenceStatusChanged
    );
  }

  private unbindEvent() {
    const conferenceListManager =
      this.service.roomEngine?.instance.getConferenceListManager();
    conferenceListManager.off(
      TUIConferenceListManagerEvents.onConferenceScheduled,
      this.onConferenceScheduled
    );
    conferenceListManager.off(
      TUIConferenceListManagerEvents.onConferenceWillStart,
      this.onConferenceWillStart
    );
    conferenceListManager.off(
      TUIConferenceListManagerEvents.onConferenceCancelled,
      this.onConferenceCancelled
    );
    conferenceListManager.off(
      TUIConferenceListManagerEvents.onConferenceInfoChanged,
      this.onConferenceInfoChanged
    );
    conferenceListManager.off(
      TUIConferenceListManagerEvents.onScheduleAttendeesChanged,
      this.onScheduleAttendeesChanged
    );
    conferenceListManager.off(
      TUIConferenceListManagerEvents.onConferenceStatusChanged,
      this.onConferenceStatusChanged
    );
  }

  private onConferenceScheduled(data: { conferenceInfo: TUIConferenceInfo }) {
    this.emit(TUIConferenceListManagerEvents.onConferenceScheduled, data);
  }

  private onConferenceWillStart(data: { conferenceInfo: TUIConferenceInfo }) {
    this.emit(TUIConferenceListManagerEvents.onConferenceWillStart, data);
  }

  private onConferenceCancelled(data: {
    roomId: string;
    reason: TUIConferenceCancelReason;
    operateUser: TUIUserInfo;
  }) {
    this.emit(TUIConferenceListManagerEvents.onConferenceCancelled, data);
  }

  private onConferenceInfoChanged(data: {
    conferenceModifyInfo: TUIConferenceModifyInfo;
  }) {
    this.emit(TUIConferenceListManagerEvents.onConferenceInfoChanged, data);
    const { roomId, roomName } = data.conferenceModifyInfo.basicRoomInfo;
    const isCurrentRoom = this.service.basicStore.roomId === roomId;
    if (!isCurrentRoom) return;
    roomName !== undefined &&
      roomName !== null &&
      this.service.roomStore.setRoomInfo({
        roomName,
      });
  }

  private onScheduleAttendeesChanged(data: {
    roomId: string;
    leftUsers: TUIUserInfo;
    joinedUsers: TUIUserInfo;
  }) {
    this.emit(TUIConferenceListManagerEvents.onScheduleAttendeesChanged, data);
  }

  private onConferenceStatusChanged(data: {
    roomId: string;
    status: TUIConferenceStatus;
  }) {
    this.emit(TUIConferenceListManagerEvents.onConferenceStatusChanged, data);
  }

  async fetchFriendList() {
    if (this.customFriendList) return this.customFriendList;
    const tim = this.service.roomEngine.instance?.getTIM();
    const { data } = await tim.getFriendList();
    return data;
  }

  replaceFriendList(
    userList: Array<{
      userID: string;
      avatar: string;
      nick: string;
    }>
  ) {
    this.customFriendList = userList;
  }

  async scheduleConference(options: IScheduleConferenceOptions) {
    return await this.service.roomEngine.instance
      ?.getConferenceListManager()
      .scheduleConference(options);
  }

  async cancelConference(options: { roomId: string }) {
    return await this.service.roomEngine.instance
      ?.getConferenceListManager()
      .cancelConference(options);
  }

  async updateConferenceInfo(options: {
    roomId: string;
    roomName?: string;
    scheduleStartTime?: number;
    scheduleEndTime?: number;
  }) {
    return await this.service.roomEngine.instance
      ?.getConferenceListManager()
      .updateConferenceInfo(options);
  }

  async fetchScheduledConferenceList(options: {
    statusArray?: TUIConferenceStatus[];
    cursor: string;
    count: number;
  }) {
    return await this.service.roomEngine.instance
      ?.getConferenceListManager()
      .fetchScheduledConferenceList(options);
  }

  async fetchAttendeeList(options: {
    roomId: string;
    cursor: string;
    count: number;
  }) {
    return await this.service.roomEngine.instance
      ?.getConferenceListManager()
      .fetchAttendeeList(options);
  }

  async addAttendeesByAdmin(options: { roomId: string; userIdList: string[] }) {
    return await this.service.roomEngine.instance
      ?.getConferenceListManager()
      .addAttendeesByAdmin(options);
  }

  async removeAttendeesByAdmin(options: {
    roomId: string;
    userIdList: string[];
  }) {
    return await this.service.roomEngine.instance
      ?.getConferenceListManager()
      .removeAttendeesByAdmin(options);
  }
}
