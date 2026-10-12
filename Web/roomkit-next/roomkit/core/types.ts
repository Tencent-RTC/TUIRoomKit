import type { CreateRoomOptions } from 'tuikit-atomicx-vue3/room';

export enum ExitReason {
  EnterFailed = 'EnterFailed',
  RoomLeave = 'RoomLeave',
  RoomDismiss = 'RoomDismiss',
  KickedOut = 'KickedOut',
  KickedOffline = 'KickedOffline',
  UserSigExpired = 'UserSigExpired',
}

/** RoomView templates owned by RoomKit-next (not AtomicX). */
export enum RoomLayoutTemplate {
  GridLayout = 'gridLayout',
  CinemaLayout = 'cinemaLayout',
  SidebarLayout = 'sidebarLayout',
  /** One stream: share, then speaker, then self. Not offered by LayoutButton. */
  SingleLayout = 'singleLayout',
}

export interface Credentials {
  sdkAppId: number;
  userId: string;
  userSig: string;
  userName?: string;
  avatarUrl?: string;
}

export interface RoomContainer {
  appendTo: string | HTMLElement;
  width?: number | string;
  height?: number | string;
}

export interface RoomKitJoinOptions {
  roomId: string;
  container: RoomContainer;
  password?: string;
}

export interface CreateAndJoinOptions extends RoomKitJoinOptions, CreateRoomOptions {}

export interface ExitedPayload {
  roomId: string;
  reason: ExitReason;
  error?: unknown;
  /** The view has closed, but SDK room cleanup must be retried with leave() or destroyInstance(). */
  cleanupPending?: boolean;
}

export interface RoomKitEventMap {
  exited: ExitedPayload;
}
