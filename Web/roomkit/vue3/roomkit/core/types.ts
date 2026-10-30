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

/** Which scene view RoomKit mounts for a room. */
export enum RoomScene {
  Conference = 'conference',
  Education = 'education',
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
  /** Defaults to `RoomScene.Conference`. */
  scene?: RoomScene;
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

/** User actions a host can intercept with `onWill`. */
export type InterceptorAction = 'startScreenShare';

/** Return `false` (or resolve to `false`) to cancel the action; any other result lets it continue. */
export type InterceptorHandler = () => boolean | void | Promise<boolean | void>;
