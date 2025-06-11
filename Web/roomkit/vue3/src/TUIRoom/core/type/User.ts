import {
  TUIRole,
  TUIInvitationStatus,
  TUIVideoStreamType,
} from '@tencentcloud/tuiroom-engine-js';

export interface UserInfo {
  userId: string;
  userName: string;
  avatarUrl: string;
  nameCard: string;
  displayName: string;
  roomCustomInfo: Record<string, any>;
  userRole: TUIRole;
  hasAudioStream: boolean;
  hasVideoStream: boolean;
  hasScreenStream: boolean;
  isMessageDisabled: boolean;
  isOnSeat: boolean;
  isInRoom: boolean;
  invitationStatus: TUIInvitationStatus;
  timestamp: number;
}

export enum StreamPlayState {
  Loading = 'Loading',
  Playing = 'Playing',
  Stopped = 'Stopped',
}

export interface StreamInfo {
  userId: string;
  streamType: TUIVideoStreamType;
  streamId: string;
  hasAudioStream?: boolean;
  audioVolume?: number;
  hasVideoStream?: boolean;
  streamPlayState?: StreamPlayState;
  streamPlayDomMap?: Map<HTMLElement, TUIVideoStreamType>;
  timestamp?: number;
}

export enum UserAction {
  AudioAction = 'AudioAction',
  VideoAction = 'VideoAction',
  ChatAction = 'ChatAction',
  AdministratorAction = 'AdministratorAction',
  TransferOwnerAction = 'TransferOwnerAction',
  KickOutOfRoomAction = 'KickOutOfRoomAction',
  ChangeUserNameCardAction = 'ChangeUserNameCardAction',
  SeatAction = 'SeatAction',
  InviteEnterRoomAction = 'InviteEnterRoomAction',

  InviteOnSeatAction = 'InviteOnSeatAction',
  AgreeOnSeatAction = 'AgreeOnSeatAction',
  DenyOnSeatAction = 'DenyOnSeatAction',
  KickOffSeatAction = 'KickOutSeatAction',
}
