import type { Component } from 'vue';
import { RoomLayoutTemplate, RoomUser, RoomType } from 'tuikit-atomicx-react/room';
import type TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import type { ExperimentalAPIParamsMap, CallExperimentalAPI } from 'tuikit-atomicx-react';
import type { CreateRoomOptions } from 'tuikit-atomicx-react/room';

export type { ExperimentalAPIParamsMap, CallExperimentalAPI };

export type { CreateRoomOptions, RoomLayoutTemplate };

export enum RoomEvent {
  ROOM_LEAVE = 'RoomLeave',
  ROOM_DISMISS = 'RoomDismiss',
  ROOM_ERROR = 'RoomError',
  KICKED_OUT = 'KickedOut',
  KICKED_OFFLINE = 'KickedOffline',
  USER_SIG_EXPIRED = 'UserSigExpired',
}

export enum FeatureButton {
  SwitchTheme = 'SwitchTheme',
  SwitchLayout = 'LayoutControl',
  SwitchLanguage = 'Language',
  FullScreen = 'FullScreen',
  Invitation = 'InviteControl',
  BasicBeauty = 'BasicBeauty',
}
export type ThemeOption = 'LIGHT' | 'DARK';

export enum BuiltinWidget {
  MicWidget = 'MicWidget',
  CameraWidget = 'CameraWidget',
  ScreenShareWidget = 'ScreenShareWidget',
  RoomChatWidget = 'RoomChatWidget',
  MemberWidget = 'MemberWidget',
  InviteWidget = 'InviteWidget',
  VirtualBackgroundWidget = 'VirtualBackgroundWidget',
  BasicBeautyWidget = 'BasicBeautyWidget',
  AIToolsWidget = 'AIToolsWidget',
  SettingsWidget = 'SettingsWidget',
  ThemeWidget = 'ThemeWidget',
  LayoutWidget = 'LayoutWidget',
  LocalNetworkInfoWidget = 'LocalNetworkInfoWidget',
  LanguageWidget = 'LanguageWidget',
  LoginUserInfoWidget = 'LoginUserInfoWidget',
  CurrentRoomInfoWidget = 'CurrentRoomInfoWidget',
  LeaveRoomWidget = 'LeaveRoomWidget',
  SwitchCameraWidget = 'SwitchCameraWidget',
  BarrageWidget = 'BarrageWidget',
  RaiseHandsWidget = 'RaiseHandsWidget',
  RaiseHandsListWidget = 'RaiseHandsListWidget',
  RecordingWidget = 'RecordingWidget',
}

export type WidgetZone =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type WidgetPlatform = 'pc' | 'h5';

export type WidgetZoneConfig = WidgetZone | {
  pc?: WidgetZone;
  h5?: WidgetZone;
};

interface BaseWidget {
  id: string;
  zone?: WidgetZoneConfig;
  order?: number;
  panel?: {
    title: string | (() => string);
    component: Component;
    props?: Record<string, any> | (() => Record<string, any>);
    keepAlive?: boolean;
  };
}

interface StandardTrigger {
  icon: Component | string | (() => Component | string);
  label: string | (() => string);
  onClick?: () => void;
  component?: never;
}

interface CustomTrigger {
  component: Component;
  props?: Record<string, any> | (() => Record<string, any>);
  onClick?: () => void;
  icon?: never;
  label?: never;
}

export type WidgetConfig = BaseWidget & (StandardTrigger | CustomTrigger);

export enum InterceptorAction {
  OpenMicrophone = 'openMicrophone',
  CloseMicrophone = 'closeMicrophone',
  OpenCamera = 'openCamera',
  CloseCamera = 'closeCamera',
  StartScreenShare = 'startScreenShare',
  StopScreenShare = 'stopScreenShare',
}

export type InterceptorHandler = (
  action: InterceptorAction,
  proceed: () => void,
  abort: () => void,
) => void | Promise<void>;

export interface WatermarkConfig {
  enable?: boolean;
  content?: string[];
  font?: {
    fontSize?: number;
  };
  gap?: [number, number];
}

export type ContactListProvider = () => Promise<RoomUser[]> | RoomUser[];

export interface VirtualBackgroundImage {
  url: string;
  label?: string | (() => string);
}

export interface VirtualBackgroundFeatureConfig {
  customImages?: VirtualBackgroundImage[];
}

export interface AIToolsConfig {
  enable?: boolean;
}

export interface ToolbarConfig {
  /** Whether to always show the header and footer (disable auto-hide). Default: false */
  alwaysShow?: boolean;
  /** Auto-hide delay in milliseconds (only effective when alwaysShow is false). Default: 5000 */
  autoHideDelay?: number;
}

export interface FeatureConfig {
  watermark?: WatermarkConfig;
  shareLink?: string;
  contactList?: ContactListProvider;
  virtualBackground?: VirtualBackgroundFeatureConfig;
  aiTools?: AIToolsConfig;
  layoutTemplate?: RoomLayoutTemplate;
  toolbar?: ToolbarConfig;
}

export interface IConference {
  // Auth
  login: (params: { sdkAppId: number; userId: string; userSig: string; [key: string]: any }) => Promise<void>;
  logout: () => Promise<void>;
  setSelfInfo: (options: { userName: string; avatarUrl: string }) => Promise<void>;

  // Room engine
  getRoomEngine: () => { instance: TUIRoomEngine } | null;

  // Events
  on: (eventType: RoomEvent, callback: (data?: any) => void) => void;
  off: (eventType: RoomEvent, callback: (data?: any) => void) => void;

  // New canonical room lifecycle methods
  createAndJoinRoom: (params: { roomId: string; roomType?: RoomType; options?: CreateRoomOptions }) => Promise<void>;
  joinRoom: (params: { roomId: string; roomType?: RoomType; password?: string }) => Promise<void>;
  leaveRoom: () => Promise<void>;
  endRoom: () => Promise<void>;

  // Feature configuration
  setFeatureConfig: (config: Partial<FeatureConfig>) => void;
  getFeatureConfig: <K extends keyof FeatureConfig>(key: K) => FeatureConfig[K] | undefined;

  // Experimental API gateway
  callExperimentalAPI: CallExperimentalAPI;
}
