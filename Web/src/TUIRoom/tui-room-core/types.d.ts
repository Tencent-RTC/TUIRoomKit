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
export enum ETUIRoomRole {
  MASTER = 1,    // 主持人，具有房间麦控管理能力，聊天能力和音视频能力 （IM-Owner + TRTC-Anchor）
  MANAGER = 2,   // 管理员，不具有音视频能力，具有群管理能力，无转交群能力。（IM-Owner + TRTC-Audience）
  ANCHOR = 3,    // 主播，有聊天能力和音视频能力（IM-Member+ TRTC-Anchor）
  AUDIENCE = 4,  // 观众，仅有聊天能力（IM-Member+ TRTC-Audience）
}

/**
 * 发言模式
 */
export enum ETUISpeechMode {
  FREE_SPEECH = 'FreeSpeech', // 自由发言模式
  APPLY_SPEECH = 'ApplySpeech', // 申请发言模式
}

/**
 * 信令状态
 */
export enum ETUISignalStatus {
  ACCEPTED = 0,     // 信令-接受
  REJECTED = 1,     // 信令-拒绝
  CANCELLED = 2,    // 信令-取消
  TIMEOUT = 3,      // 信令-超时
}

/**
 * 视频流类型
 */
export enum ETUIStreamType {
  CAMERA = 1,     // 摄像头
  SCREEN = 2,    // 屏幕分享
}

/**
 * 用户信息结构体
 */
export type TTUIUser = {
  userId: string;                     // 用户ID
  userName: string;                   // 用户名
  userAvatar: string;                 // 用户头像url
  role: ETUIRoomRole;                 // 用户角色
  isVideoStreamAvailable: boolean;    // 是否有视频流
  isAudioStreamAvailable: boolean;    // 是否有音频流
  isScreenStreamAvailable: boolean;   // 是否有屏幕分享流
  isVideoStreamSubscribed: boolean;   // 是否订阅视频流
  isAudioStreamSubscribed: boolean;   // 是否订阅音频流
  isScreenStreamSubscribed: boolean;  // 是否订阅屏幕分享流

};

/**
 * 房间配置信息结构体（对应群公告的 1vN 控制信令）
 * 注意：仅内部使用，不暴露给 UI 层
 */
export interface TTUIRoomConfig {
  speechMode: ETUISpeechMode;             // 发言模式
  isChatRoomMuted: boolean;               // 是否禁止IM聊天
  isSpeechApplicationForbidden: boolean;  // 是否禁止申请发言
  isAllCameraMuted: boolean;              // 是否全员禁摄像头
  isAllMicMuted: boolean ;         // 是否开启全员禁麦
  isCallingRoll: boolean;                 // 是否正在点名
  startTime: number;                      // 开始时间
}

/**
 * 房间信息结构体
 */
export interface TTUIRoomInfo extends TTUIRoomConfig {
  roomId: number;             //房间ID
  ownerId: string;            // 群拥有者ID
  roomName: string;           // 房间名
  roomMemberNum: number;      // 成员个数
}

/**
 * 事件名称枚举常量
 */
export enum ETUIRoomEvents {
  onError = 'onError',
  onRoomDestroyed = 'onRoomDestroyed', // supported
  onRoomExited = 'onRoomExited',
  onRoomMasterChanged = 'onRoomMasterChanged',
  onUserEnterRoom = 'onUserEnterRoom', // supported
  onUserLeaveRoom = 'onUserLeaveRoom', // supported
  onUserVideoAvailable = 'onUserVideoAvailable', // supported
  onUserAudioAvailable = 'onUserAudioAvailable', // supported
  onFirstVideoFrame = 'onFirstVideoFrame', // supported
  onUserVoiceVolume = 'onUserVoiceVolume', // supported web
  onUserStateChange = 'onUserStateChange', // supported new added
  onDeviceChange = 'onDeviceChange',
  onWebScreenSharingStopped = 'onWebScreenSharingStopped',
  onNetworkQuality = 'onNetworkQuality', // supported web
  onStatistics = 'onStatistics',  // supported web
  onReceiveChatMessage = 'onReceiveChatMessage', // supported
  onReceiveCustomMessage = 'onReceiveCustomMessage', // supported
  onUserEnterSpeechState = 'onUserEnterSpeechState',
  onUserExitSpeechState = 'onUserExitSpeechState',
  onReceiveSpeechInvitation = 'onReceiveSpeechInvitation', // supported
  onReceiveInvitationCancelled = 'onReceiveInvitationCancelled', // supported
  onReceiveInvitationTimeout = 'onReceiveInvitationTimeout', // supported
  // onReceiveReplyToSpeechInvitation = 'onReceiveReplyToSpeechInvitation', // not needed
  onReceiveSpeechApplication = 'onReceiveSpeechApplication', // supported
  onSpeechApplicationCancelled = 'onSpeechApplicationCancelled', // supported
  onSpeechApplicationTimeout = 'onSpeechApplicationTimeout', // supported
  // onReceiveReplyToSpeechApplication = 'onReceiveReplyToSpeechApplication', // not needed
  onSpeechApplicationForbidden = 'onSpeechApplicationForbidden',
  onOrderedToExitSpeechState = 'onOrderedToExitSpeechState',
  onCallingRollStarted = 'onCallingRollStarted',  // supported
  onCallingRollStopped = 'onCallingRollStopped',  // supported
  onUserReplyCallingRoll = 'onUserReplyCallingRoll',  // supported
  onChatRoomMuted = 'onChatRoomMuted',
  onMicrophoneMuted = 'onMicrophoneMuted', // supported
  onCameraMuted = 'onCameraMuted', // supported
  onUserChatRoomMuted = 'onUserChatRoomMuted', // supported
  onUserKickOff = 'onUserKickOff', // supported
}

/**
 * 信令事件枚举常量1vN
 */
export enum ETUIRoomCoordinatorConfig {
  isCallingRoll = 'isCallingRoll', // 是否签到
  speechMode = 'speechMode',
  isChatRoomMuted = 'isChatRoomMuted',
  isAllCameraMuted = 'isAllCameraMuted',
  isAllMicMuted = 'isAllMicMuted',
  startTime = 'startTime',
  isSpeechApplicationForbidden = 'isSpeechApplicationForbidden',
}

/**
* 信令事件枚举常量1v1
*/
export enum ETUIRoomCoordinatorCommand {
  SendSpeechInvitation = 'SendSpeechInvitation', // 主持人邀请观众上台
  SendOffSpeaker = 'SendOffSpeaker', // 主持人邀请观众下台
  SendSpeechApplication = 'SendSpeechApplication', // 观众申请上台
  MuteUserMicrophone = 'MuteUserMicrophone', // 主持人禁用观众麦克风，不可拒绝，只能接受
  MuteUserCamera = 'MuteUserCamera', //	主持人禁用观众摄像头，不可拒绝，只能接受
  MuteUserChatRoom = 'MuteUserChatRoom', // 主持人禁用观众文字聊天，不可拒绝，只能接受
  ReplyCallingRoll = 'ReplyCallingRoll', // 观众回复点名（签到）
  KickOffUser	= 'KickOffUser', //	主持人踢人出房间，不可拒绝，只能接受
}


/**
 * TSignalingService 返回基本数据类型
 */
export type TTUIRoomTSBase = {
  eventCode: string,
  data: {
    type: string,
    inviterId: string,
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
    inviteId: string;
    inviter: string;
    groupId: string;
    data: string;
  };
}

/**
 * 拒绝信令
 */
export type TTUIInviteeRejectedParams = {
  data: {
    inviteId: string;
    inviter: string;
    groupId: string;
    invitee: string;
    data: string;
  };
}

/**
 * 取消信令
 */
export type TTUIInvitationCancelledParams = {
  data: {
    inviteId: string;
    inviter: string;
    groupId: string;
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
    inviteId: string;
    groupId: string;
    isSelfTimeout: boolean;
  };
}

/**
 * inviteInfo value 数据类型
 */
 export type TTUIInviteInfo = {
  type: string,
  inviteId: string,
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

/**
 * 被 mute 的场景, 主持人全员禁麦/画还是单独禁麦/画
 */
export enum ETUIRoomMuteType {
  MasterMuteAll = 'MasterMuteAll',
  MasterMuteCurrentUser = 'MasterMuteCurrentUser'
}
