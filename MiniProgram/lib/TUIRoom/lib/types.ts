/* eslint-disable */
/**
 * 基础数据类型定义
 */

/**
 * 异步接口响应结构体
 */
export type TTUIRoomResponse<T> = {
  /**
   * 0: accepted/success - 信令相关的接口发送的信令被被接受，或者非信令相关的接口成功返回
   * 1: rejected         - 信令相关的接口发送的信令被被拒绝
   * 2: timeout          - 信令相关的接口发送的信令超时
   * 3: cancelled        - 信令相关的接口发送的信令被取消
   * 小于0表示业务异常/业务Error
   */
  code: number;
  message?: string;
  data?: T;
};

/**
 * 异常/报错结构体
 */
export type TTUIRoomError = {
  code: number;
  message: string;
};

/**
 * 角色类型
 */
export enum TUIRoomRole {
  MASTER = 1, // 主持人，具有房间麦控管理能力，聊天能力和音视频能力 （IM-Owner + TRTC-Anchor）
  MANAGER = 2, // 管理员，不具有音视频能力，具有群管理能力，无转交群能力。（IM-Owner + TRTC-Audience）
  ANCHOR = 3, // 主播，有聊天能力和音视频能力（IM-Member+ TRTC-Anchor）
  AUDIENCE = 4, // 观众，仅有聊天能力（IM-Member+ TRTC-Audience）
}

/**
 * 发言模式
 */
export enum TUISpeechMode {
  FREE_SPEECH = 'FreeSpeech', // 自由发言模式
}

/**
 * 信令状态
 */
export enum TUISignalStatus {
  ACCEPTED = 0, // 信令-接受
  REJECTED = 1, // 信令-拒绝
  TIMEOUT = 2, // 信令-超时
  CANCELLED = 3, // 信令-取消
}

/**
 * 视频流类型
 */
export enum TUIStreamType {
  CAMERA = 1, // 摄像头
  SCREEN = 2, // 屏幕分享
}

/**
 * 用户信息结构体
 */
export type TTUIUser = {
  userID: string; // 用户ID
  userName: string; // 用户名
  userAvatar: string; // 用户头像url
  role: TUIRoomRole; // 用户角色

};

/**
 * 房间配置信息结构体（对应群公告的 1vN 控制信令）
 * 注意：仅内部使用，不暴露给 UI 层
 */
export interface TTUIRoomConfig {
  speechMode: TUISpeechMode;             // 发言模式
  isChatRoomMuted: boolean;               // 是否禁止IM聊天
  isAllCameraMuted: boolean;              // 是否全员禁摄像头
  isAllMicMuted: boolean;                // 是否开启全员禁麦
  startTime: number;                      // 开始时间
}

/**
 * 房间信息结构体
 */
export interface TTUIRoomInfo extends TTUIRoomConfig {
  roomId: number; //房间ID
  ownerID: string; // 群拥有者ID
  roomName: string; // 房间名
  roomMemberNum: number; // 成员个数
}

/**
 * 事件名称枚举常量
 */
export enum TUIRoomEvents {
  onError = 'onError',
  onRoomDestroyed = 'onRoomDestroyed', // supported
  onRoomExited = 'onRoomExited',
  onRoomMasterChanged = 'onRoomMasterChanged',
  onUserEnterRoom = 'onUserEnterRoom', // supported
  onReceiveChatMessage = 'onReceiveChatMessage', // supported
  onReceiveCustomMessage = 'onReceiveCustomMessage', // supported
  onMicrophoneMuted = 'onMicrophoneMuted',
  onAllMicrophoneMuted = 'onAllMicrophoneMuted',
  onCameraMuted = 'onCameraMuted',
  onKickOff = 'onKickOff',
}

/**
 * trtc事件
 */
export enum TRTCEvents {
  BGM_PLAY_COMPLETE = 'BGM_PLAY_COMPLETE',
  BGM_PLAY_FAIL = 'BGM_PLAY_FAIL',
  BGM_PLAY_PROGRESS = 'BGM_PLAY_PROGRESS',
  BGM_PLAY_START = 'BGM_PLAY_START',
  ERROR = 'ERROR',
  IM_ERROR = 'IM_ERROR',
  IM_KICKED_OUT = 'IM_KICKED_OUT',
  IM_MESSAGE_RECEIVED = 'IM_MESSAGE_RECEIVED',
  IM_NOT_READY = 'IM_NOT_READY',
  IM_READY = 'IM_READY',
  KICKED_OUT = 'KICKED_OUT',
  LOCAL_AUDIO_VOLUME_UPDATE = 'LOCAL_AUDIO_VOLUME_UPDATE',
  LOCAL_JOIN = 'LOCAL_JOIN',
  LOCAL_LEAVE = 'LOCAL_LEAVE',
  LOCAL_NET_STATE_UPDATE = 'LOCAL_NET_STATE_UPDATE',
  REMOTE_AUDIO_ADD = 'REMOTE_AUDIO_ADD',
  REMOTE_AUDIO_REMOVE = 'REMOTE_AUDIO_REMOVE',
  REMOTE_AUDIO_VOLUME_UPDATE = 'REMOTE_AUDIO_VOLUME_UPDATE',
  REMOTE_NET_STATE_UPDATE = 'REMOTE_NET_STATE_UPDATE',
  REMOTE_STATE_UPDATE = 'REMOTE_STATE_UPDATE',
  REMOTE_USER_JOIN = 'REMOTE_USER_JOIN',
  REMOTE_USER_LEAVE = 'REMOTE_USER_LEAVE',
  REMOTE_VIDEO_ADD = 'REMOTE_VIDEO_ADD',
  REMOTE_VIDEO_REMOVE = 'REMOTE_VIDEO_REMOVE',
  VIDEO_FULLSCREEN_UPDATE = 'VIDEO_FULLSCREEN_UPDATE',
}

/**
 * 信令事件枚举常量1vN
 */
export enum TUIRoomCoordinatorConfig {
  speechMode = 'speechMode',
  isChatRoomMuted = 'isChatRoomMuted',
  isAllCameraMuted = 'isAllCameraMuted',
  isAllMicMuted = 'isAllMicMuted',
  startTime = 'startTime',
}

/**
 * 信令事件枚举常量1v1
 */
export enum TUIRoomCoordinatorCommand {
  MuteUserMicrophone = 'MuteUserMicrophone', // 主持人禁用观众麦克风，不可拒绝，只能接受
  MuteUserCamera = 'MuteUserCamera', //	主持人禁用观众摄像头，不可拒绝，只能接受
  KickOffUser = 'KickOffUser', //	主持人踢人出房间，不可拒绝，只能接受
}

/**
 * TSignalingService 返回基本数据类型
 */
export type TTUIRoomTSBase = {
  eventCode: string,
  data: {
    type: string,
    inviterID: string,
  }
}

/**
 * 新的信令
 */
export type TTUIInvitationReceivedParams = {
  data: {
    inviter: string;
    inviteeList: string[];
    data: string;
    inviteID: string;
    groupID: string;
  };
}

/**
 * 接受信令
 */
export type TTUIInviteeAcceptedParams = {
  name: string;
  data: {
    invitee: string;
    inviteID: string;
    inviter: string;
    groupID: string;
    data: string;
  };
}

/**
 * 拒绝信令
 */
export type TTUIInviteeRejectedParams = {
  data: {
    inviteID: string;
    inviter: string;
    groupID: string;
    invitee: string;
    data: string;
  };
}

/**
 * 取消信令
 */
export type TTUIInvitationCancelledParams = {
  data: {
    inviteID: string;
    inviter: string;
    groupID: string;
    data: string;
  };
}

/**
 * 超时信令
 */
export type TTUIInvitationTimeoutParams = {
  data: {
    inviter: string;
    inviteeList: string[];
    inviteID: string;
    groupID: string;
    isSelfTimeout: boolean;
  };
}

/**
 * inviteInfo value 数据类型
 */
export type TTUIInviteInfo = {
  type: string,
  inviteID: string,
  resolve?: void | any,
  reject?: void | any,
}
/**
 * TSignalingService 方法参数 data 的数据类型
 */
export type TTUIMethodDataParams = {
  cmd: string,
  [propName: string]: any;
}
