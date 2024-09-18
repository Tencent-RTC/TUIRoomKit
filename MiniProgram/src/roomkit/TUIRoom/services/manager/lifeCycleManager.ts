import mitt from 'mitt';
import { IRoomService, EventType as RoomEventType } from '../types';

export type LifeCycleEvent = 'mount' | 'unmount';

export enum LifeCycleChangeReason {
  RoomLogout = 'room logout',
  RoomStart = 'room start',
  RoomJoin = 'room join',
  RoomLeave = 'room leave',
  RoomDestroy = 'room destroy',
  RoomKickedOffline = 'room kicked offline',
  RoomKickedOut = 'room kicked out',
  RoomUserSigExpired = 'room user sig expired',
  RoomError = 'room error',
}

interface ILifeCycleManager {
  on(eventType: LifeCycleEvent, callback: (data?: any) => any): void;
  off(eventType: LifeCycleEvent, callback: (data?: any) => void): void;
  start(): void;
  stop(): void;
}

export class LifeCycleManager implements ILifeCycleManager {
  private service: IRoomService;
  private eventCallbacks: { [key: string]: (reason: string) => void } = {};
  private emitter = mitt();

  constructor(service: IRoomService) {
    this.service = service;
  }

  public start() {
    this.stop();
    this.addEventListeners();
  }

  public stop() {
    this.removeEventListeners();
  }

  public on(eventType: LifeCycleEvent, callback: (data?: any) => any) {
    this.emitter.on(eventType, callback);
  }

  public off(eventType: LifeCycleEvent, callback: (data?: any) => void) {
    this.emitter.off(eventType, callback);
  }

  private emit(eventType: LifeCycleEvent, data?: any) {
    this.emitter.emit(eventType, data);
  }

  private addEventListeners() {
    const handleMount = (reason: string) => this.emit('mount', { reason });
    const handleUnmount = (reason: string) => this.emit('unmount', { reason });
    const handleCallback = (type: LifeCycleEvent, reason: string) => {
      const callback = type === 'mount' ? handleMount : handleUnmount;
      return callback.bind(this, reason);
    };

    const eventReasonMap: {
      [key: string]: { reason: LifeCycleChangeReason; type: LifeCycleEvent };
    } = {
      [RoomEventType.ROOM_START]: {
        reason: LifeCycleChangeReason.RoomStart,
        type: 'mount',
      },
      [RoomEventType.ROOM_JOIN]: {
        reason: LifeCycleChangeReason.RoomJoin,
        type: 'mount',
      },
      [RoomEventType.USER_LOGOUT]: {
        reason: LifeCycleChangeReason.RoomLogout,
        type: 'unmount',
      },
      [RoomEventType.ROOM_LEAVE]: {
        reason: LifeCycleChangeReason.RoomLeave,
        type: 'unmount',
      },
      [RoomEventType.ROOM_DISMISS]: {
        reason: LifeCycleChangeReason.RoomDestroy,
        type: 'unmount',
      },
      [RoomEventType.KICKED_OFFLINE]: {
        reason: LifeCycleChangeReason.RoomKickedOffline,
        type: 'unmount',
      },
      [RoomEventType.KICKED_OUT]: {
        reason: LifeCycleChangeReason.RoomKickedOut,
        type: 'unmount',
      },
      [RoomEventType.USER_SIG_EXPIRED]: {
        reason: LifeCycleChangeReason.RoomUserSigExpired,
        type: 'unmount',
      },
      [RoomEventType.ROOM_ERROR]: {
        reason: LifeCycleChangeReason.RoomError,
        type: 'unmount',
      },
    };

    Object.entries(eventReasonMap).forEach(([event, { reason, type }]) => {
      const callback = handleCallback(type, reason);
      this.eventCallbacks[event] = callback;
      this.service.on(event as RoomEventType, callback);
    });
  }

  private removeEventListeners() {
    Object.entries(this.eventCallbacks).forEach(([event, callback]) => {
      this.service.off(event as RoomEventType, callback);
    });
  }
}
