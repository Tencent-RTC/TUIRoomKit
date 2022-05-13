//
//  TUIRoomDefine.h
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#ifndef TUIRoomDefine_h
#define TUIRoomDefine_h

#import "TUIRoomKit.h"
@class TUIRoomInfo;
@class TUIRoomUserInfo;

typedef NS_ENUM (NSInteger, TUIRoomSpeechMode) {
	TUIRoomUnknownSpeech = 0,    // 未知类型
	TUIRoomFreeSpeech    = 1,// 自由模式，成员进入房间后以主播身份进入TRTC房间
	TUIRoomApplySpeech   = 2,// 申请模式，成员进入房间后以听众身份进入TRTC房间，申请发言成功后以主播身份进入TRTC房间
};

typedef NS_ENUM (NSInteger, TUIRoomInviteeCallBackType) {
	TUIRoomInviteeFailed    = -1,// 失败
	TUIRoomInviteeAccepted  = 1,// 接受
	TUIRoomInviteeRejected  = 2,// 拒绝
	TUIRoomInviteeCancelled = 3,// 取消
	TUIRoomInviteeTimeout   = 4,// 超时
};

/**
 * 错误码
 */
typedef NS_ENUM (NSInteger, TUIRoomError) {
	TUIRoomSuccessCode                              = 0, // 成功
	TUIRoomErrorParamInvalid                      = -999,// 无效参数
	TUIRoomErrorCreateRoomFailed                  = -1002,// 创建房间失败
	TUIRoomErrorDestoryRoomFailed                 = -1003,// 销毁房间失败
	TUIRoomErrorEnterRoomFailed                   = -1004,// 进入房间失败
	TUIRoomErrorExitRoomFailed                    = -1005,// 退出房间失败
	TUIRoomErrorKickOffUserFailed                 = -1006,// 踢出用户失败
	TUIRoomErrorChangeRoomInfoFailed              = -1007,// 修改群信息失败
	TUIRoomErrorGetRoomInfoFailed                 = -1008,// 获取群信息失败
	TUIRoomErrorGetRoomMemberFailed               = -1009,// 获取房间成员失败
	TUIRoomErrorSendChatMessageFailed             = -1010,// 发送消息失败
	TUIRoomErrorSetSelfProfileFailed              = -1023,// 设置个人信息失败
	TUIRoomErrorTransferRoomFailed                = -1024,// 转交群失败
	TUIRoomErrorReplyRollCallFailed               = -1026,// 成员回复主持人点名失败
};

/**
 * 角色类型
 */
typedef NS_ENUM (NSUInteger, TUIRoomRole) {
	TUIRoomMaster   = 1,// 主持人，具有房间麦控管理能力，聊天能力和音视频能力
	TUIRoomManager  = 2,// 管理员，不具有音视频能力，具有群管理能力，无转交群能力。
	TUIRoomAnchor   = 3,// 主播，有聊天能力和音视频能力
	TUIRoomAudience = 4, // 观众，仅有聊天能力
};

typedef NS_ENUM (NSInteger, TUIRoomSignalingType) {
	TUIRoomSignalingUnknown = 0, // 未知
	TUIRoomSignalingInviteSpeaker,    // 主持人邀请观众发言
	TUIRoomSignalingSendOffSpeaker,  // 主持人邀请观众下台
	TUIRoomSignalingApplyForSpeech, // 观众申请发言
	TUIRoomSignalingMuteMicrophone, // 主持人禁用观众麦克风
	TUIRoomSignalingMuteCamera, // 主持人禁用观众摄像头
	TUIRoomSignalingReplyCallingRoll, // 回复主持人点名
	TUIRoomSignalingKickOffUser, // 主持人踢人出房间
	TUIRoomSignalingSendOffAllSpeaker, // 邀请全体麦上成员下麦
	//群公告
	TUIRoomSignalingMuteRoomChat, // 主持人设置是否禁止IM聊天
	TUIRoomSignalingForbidStage, // 主持人设置是否禁止申请发言
	TUIRoomSignalingMuteAllCamera, // 主持人设置全员开/禁摄像头
	TUIRoomSignalingMuteAllMic, // 主持人设置开/禁麦克风
	TUIRoomSignalingCallingRoll, // 主持人发起点名/或结束点名
	TUIRoomSignalingStartTime, // 开始时间
};

typedef NS_ENUM (NSInteger, TUIRoomStreamType) {
	TUIRoomStreamCamera, // 主画面视频流
	TUIRoomStreamScreen, // 屏幕分享
};

/// 事件回调
typedef void (^TUIRoomActionCallback)(NSInteger code, NSString * _Nonnull message);
/// 获取成员信息回调
typedef void (^TUIRoomUserInfoCallback)(NSInteger code, NSString * _Nonnull message, TUIRoomUserInfo * _Nullable userInfo);
/// 获取成员信息列表回调
typedef void (^TUIRoomUserListCallback)(NSInteger code, NSString * _Nonnull message, NSArray<TUIRoomUserInfo *> * _Nullable userList);
/// 获取房间信息回调
typedef void (^TUIRoomRoomInfoCallback)(NSInteger code, NSString * _Nonnull message, TUIRoomInfo * _Nullable userInfo);
/// Invitation Callback
typedef void (^TUIRoomInviteeCallback)(TUIRoomInviteeCallBackType type, NSString * _Nonnull message);


#define TUIROOM_SIGNALING_EXTRA_KEY_TIME_OUT 30
/// 信令Key
#define TUIROOM_SIGNALING_KEY_VERSION @"version"
#define TUIROOM_SIGNALING_KEY_BUSINESS_ID @"businessID"
#define TUIROOM_SIGNALING_KEY_PLATFORM  @"platform"
#define TUIROOM_SIGNALING_KEY_DATA @"data"
#define TUIROOM_SIGNALING_KEY_CMD @"cmd"
#define TUIROOM_SIGNALING_KEY_ROOM_ID @"room_id"
#define TUIROOM_SIGNALING_KEY_RECEIVER_ID @"receiver_id"
#define TUIROOM_SIGNALING_KEY_SENDER_ID @"sender_id"
#define TUIROOM_SIGNALING_KEY_MUTE @"mute"
#define TUIROOM_SIGNALING_KEY_SPEECH_MODE @"speechMode"
#define TUIROOM_SIGNALING_KEY_IS_CHAT_ROOM_MUTED @"isChatRoomMuted"
#define TUIROOM_SIGNALING_KEY_IS_SPEECH_APPLICATION_FORBIDDEN @"isSpeechApplicationForbidden"
#define TUIROOM_SIGNALING_KEY_IS_ALL_CAMERA_MUTED @"isAllCameraMuted"
#define TUIROOM_SIGNALING_KEY_IS_ALL_MIC_MUTED @"isAllMicMuted"
#define TUIROOM_SIGNALING_KEY_IS_CALLING_ROLL @"isCallingRoll"
#define TUIROOM_SIGNALING_KEY_START_TIME @"startTime"

/// 信令Value
#define TUIROOM_DATA_VERSION @"1"
#define TUIROOM_DATA_PLATFORM @"iOS"
#define TUIROOM_DATA_BUSINESS_ID @"TUIRoom"
#define TUIROOM_DATA_FREE_SPEECH @"FreeSpeech"
#define TUIROOM_DATA_APPLY_SPEECH @"ApplySpeech"

/// 信令CMD
#define TUIROOM_SIGNALING_KEY_CMD_INVITE_SPEAKER @"SendSpeechInvitation"
#define TUIROOM_SIGNALING_KEY_CMD_SEND_OFF_SPEAKER @"SendOffSpeaker"
#define TUIROOM_SIGNALING_KEY_CMD_APPLY_FOR_SPEECH @"SendSpeechApplication"
#define TUIROOM_SIGNALING_KEY_CMD_MUTE_MICROPHONE @"MuteUserMicrophone"
#define TUIROOM_SIGNALING_KEY_CMD_MUTE_CAMERA @"MuteUserCamera"
#define TUIROOM_SIGNALING_KEY_CMD_REPLY_CALLING_ROLL @"ReplyCallingRoll"
#define TUIROOM_SIGNALING_KEY_CMD_KICK_OFF_USER @"KickOffUser"
#define TUIROOM_SIGNALING_KEY_CMD_SEND_OFF_ALL_SPEAKER @"SendOffAllSpeakers"


#define GetTUIRoomStreamType(type) ((type == TUIRoomStreamCamera) ? TRTCVideoStreamTypeBig : TRTCVideoStreamTypeSub)

#endif /* TUIRoomDefine_h */
