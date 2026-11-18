import type { CreateRoomOptions, RoomParticipant, VideoStreamType } from 'tuikit-atomicx-react/room';

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

/**
 * Which scene view RoomKit mounts for a room. Each value is also an i18n namespace:
 * reword a scene's copy with i18next's `i18n.addResourceBundle(language, scene, translations, true, true)`,
 * for example `i18n.addResourceBundle('en-US', RoomScene.Education, { 'Room.RoomEnded': 'Class is over' }, true, true)`.
 * Add the scene copy for every language you support: a key found only in another
 * language's scene copy wins over the current language's base copy.
 */
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

/**
 * Devices the local user prefers on after entering. A preference, not a guarantee: it is
 * applied after the entry resolves, skipped while the room disables the device for everyone
 * (unless the user is the host or an admin), and capture failures never fail the entry.
 * Read the actual state from `useDeviceState()`.
 */
export interface MediaPreference {
  preferMicrophoneOn?: boolean;
  preferCameraOn?: boolean;
}

export interface RoomKitJoinOptions {
  roomId: string;
  container: RoomContainer;
  password?: string;
  /**
   * Defaults to `RoomScene.Conference`. The room does not record its scene, so every
   * participant of a room must pass the same value; otherwise they see different UIs.
   */
  scene?: RoomScene;
  mediaPreference?: MediaPreference;
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

/** Props RoomKit passes to the `participantViewUI` component set through `setUIConfig`. */
export interface ParticipantViewUIProps {
  participant: RoomParticipant;
  streamType: VideoStreamType;
}

/** User actions a host can intercept with `onWill`. */
export type InterceptorAction = 'startScreenShare';

/** Return `false` (or resolve to `false`) to cancel the action; any other result lets it continue. */
export type InterceptorHandler = () => boolean | void | Promise<boolean | void>;
