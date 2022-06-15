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
	TUIRoomUnknownSpeech = 0,
	TUIRoomFreeSpeech    = 1,    // Free speech mode: Members enter a TRTC room as an anchor
	TUIRoomApplySpeech   = 2,    // Mic-on request mode: Members enter a TRTC room as listeners and can become anchors after requesting to speak
};

typedef NS_ENUM (NSInteger, TUIRoomInviteeCallBackType) {
	TUIRoomInviteeFailed    = -1,
	TUIRoomInviteeAccepted  = 1,
	TUIRoomInviteeRejected  = 2,
	TUIRoomInviteeCancelled = 3,
	TUIRoomInviteeTimeout   = 4,
};

/**
 * 错误码
 */
typedef NS_ENUM (NSInteger, TUIRoomError) {
	TUIRoomSuccessCode                              = 0,
	TUIRoomErrorParamInvalid                      = -999,   // Invalid parameter
	TUIRoomErrorCreateRoomFailed                  = -1002,  // Failed to create the room
	TUIRoomErrorDestoryRoomFailed                 = -1003,  // Failed to terminate the room
	TUIRoomErrorEnterRoomFailed                   = -1004,  // Failed to enter the room
	TUIRoomErrorExitRoomFailed                    = -1005,  // Failed to exit the room
	TUIRoomErrorKickOffUserFailed                 = -1006,  // Failed to remove a user
	TUIRoomErrorChangeRoomInfoFailed              = -1007,  // Failed to modify the group information
	TUIRoomErrorGetRoomInfoFailed                 = -1008,  // Failed to get the group information
	TUIRoomErrorGetRoomMemberFailed               = -1009,  // ailed to get room members
	TUIRoomErrorSendChatMessageFailed             = -1010,  // Failed to send a message
	TUIRoomErrorSetSelfProfileFailed              = -1023,  // Failed to set the personal information
	TUIRoomErrorTransferRoomFailed                = -1024,  // Failed to transfer the group ownership
	TUIRoomErrorReplyRollCallFailed               = -1026,  // The member failed to reply to the host's roll call
};

/**
 * 角色类型
 */
typedef NS_ENUM (NSUInteger, TUIRoomRole) {
	TUIRoomMaster   = 1,   // Host: Has room mic control, chat, and audio/video capabilities
	TUIRoomManager  = 2,   // Admin: Has audio/video and group management capabilities but has no group transfer capabilities
	TUIRoomAnchor   = 3,   // Anchor: Has has chat and audio/video capabilities
	TUIRoomAudience = 4,   // Audience: Has only chat capabilities
};

typedef NS_ENUM (NSInteger, TUIRoomSignalingType) {
	TUIRoomSignalingUnknown = 0,
	TUIRoomSignalingInviteSpeaker,
	TUIRoomSignalingSendOffSpeaker,
	TUIRoomSignalingApplyForSpeech,
	TUIRoomSignalingMuteMicrophone,
	TUIRoomSignalingMuteCamera,
	TUIRoomSignalingReplyCallingRoll,
	TUIRoomSignalingKickOffUser,
	TUIRoomSignalingSendOffAllSpeaker,
	
	TUIRoomSignalingMuteRoomChat,
	TUIRoomSignalingForbidStage,
	TUIRoomSignalingMuteAllCamera,
	TUIRoomSignalingMuteAllMic,
	TUIRoomSignalingCallingRoll,
	TUIRoomSignalingStartTime,
};

typedef NS_ENUM (NSInteger, TUIRoomStreamType) {
	TUIRoomStreamCamera, // Primary video stream
	TUIRoomStreamScreen, // Screen sharing stream
};

/// Event Callback
typedef void (^TUIRoomActionCallback)(NSInteger code, NSString * _Nonnull message);

typedef void (^TUIRoomUserInfoCallback)(NSInteger code, NSString * _Nonnull message, TUIRoomUserInfo * _Nullable userInfo);

typedef void (^TUIRoomUserListCallback)(NSInteger code, NSString * _Nonnull message, NSArray<TUIRoomUserInfo *> * _Nullable userList);

typedef void (^TUIRoomRoomInfoCallback)(NSInteger code, NSString * _Nonnull message, TUIRoomInfo * _Nullable userInfo);
/// Invitation Callback
typedef void (^TUIRoomInviteeCallback)(TUIRoomInviteeCallBackType type, NSString * _Nonnull message);


#define TUIROOM_SIGNALING_EXTRA_KEY_TIME_OUT 30

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

#define TUIROOM_DATA_VERSION @"1"
#define TUIROOM_DATA_PLATFORM @"iOS"
#define TUIROOM_DATA_BUSINESS_ID @"TUIRoom"
#define TUIROOM_DATA_FREE_SPEECH @"FreeSpeech"
#define TUIROOM_DATA_APPLY_SPEECH @"ApplySpeech"

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
