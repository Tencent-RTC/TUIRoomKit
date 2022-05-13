//
//  TUIRoomInfo.m
//  Pods
//
//  Created by WesleyLei on 2021/12/10.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "TUIRoomInfo.h"
#import <ImSDK_Plus/ImSDK_Plus.h>
#import <TUICore/TUILogin.h>
#import "MJExtension.h"

@interface TUIRoomInfo ()
@end

@implementation TUIRoomInfo

- (id)copyWithZone:(NSZone *)zone {
	TUIRoomInfo * model = [[TUIRoomInfo alloc] init];
	model.roomId = self.roomId;
	model.ownerId = self.ownerId;
	model.roomName = self.roomName;
	model.roomMemberNum = self.roomMemberNum;
	model.isSharingScreen = self.isSharingScreen;
	model.speechMode = self.speechMode;
	model.startTime = self.startTime;
	model.isChatRoomMuted = self.isChatRoomMuted;
	model.isSpeechApplicationForbidden = self.isSpeechApplicationForbidden;
	model.isAllCameraMuted = self.isAllCameraMuted;
	model.isAllMicMuted = self.isAllMicMuted;
	model.isCallingRoll = self.isCallingRoll;
	return model;
}

- (instancetype)init {
	self = [super init];
	if (self) {
		self.roomId = @"";
		self.ownerId = @"";
		self.roomName = @"";
		self.speechMode = @"";
		self.startTime = [[NSDate date]timeIntervalSince1970];
		self.isChatRoomMuted = YES;
	}
	return self;
}

/**
 * 是否是房主
 *
 * @return yes/no
 */
- (BOOL)isHomeowner {
	NSString *currentUserId = [TUILogin getUserID];
	if ((currentUserId.length > 0) && [currentUserId isEqualToString:self.ownerId?:@""]) {
		return YES;
	}
	return NO;
}

/**
 * 获取TUIRoomSpeechMode
 *
 * @return TUIRoomSpeechMode
 */
- (TUIRoomSpeechMode)getSpeechModeType {
	if ([self.speechMode isEqual:TUIROOM_DATA_FREE_SPEECH]) {
		return TUIRoomFreeSpeech;
	} else if ([self.speechMode isEqual:TUIROOM_DATA_APPLY_SPEECH]) {
		return TUIRoomApplySpeech;
	}
	return TUIRoomUnknownSpeech;
}

/**
 * 获取群公告
 *
 * @return str
 */
- (NSString *)getNotification {
	NSMutableDictionary *msgDict = [[NSMutableDictionary alloc] initWithCapacity:3];
	[msgDict setValue:self.speechMode
	 forKey:TUIROOM_SIGNALING_KEY_SPEECH_MODE];
	[msgDict setValue:@(self.isChatRoomMuted)
	 forKey:TUIROOM_SIGNALING_KEY_IS_CHAT_ROOM_MUTED];
	[msgDict setValue:@(self.isSpeechApplicationForbidden)
	 forKey:TUIROOM_SIGNALING_KEY_IS_SPEECH_APPLICATION_FORBIDDEN];
	[msgDict setValue:@(self.isAllCameraMuted)
	 forKey:TUIROOM_SIGNALING_KEY_IS_ALL_CAMERA_MUTED];
	[msgDict setValue:@(self.isAllMicMuted)
	 forKey:TUIROOM_SIGNALING_KEY_IS_ALL_MIC_MUTED];
	[msgDict setValue:@(self.isCallingRoll)
	 forKey:TUIROOM_SIGNALING_KEY_IS_CALLING_ROLL];
	[msgDict setValue:@(self.startTime)
	 forKey:TUIROOM_SIGNALING_KEY_START_TIME];
	return [msgDict mj_JSONString];
}

/**
 * 更新群信息
 *
 * @param dict dict
 */
- (void)updateNotification:(NSDictionary *)dict {
	self.speechMode = [dict objectForKey:TUIROOM_SIGNALING_KEY_SPEECH_MODE]?:self.speechMode;
	self.isChatRoomMuted = [[dict objectForKey:TUIROOM_SIGNALING_KEY_IS_CHAT_ROOM_MUTED]boolValue];
	self.isSpeechApplicationForbidden = [[dict objectForKey:TUIROOM_SIGNALING_KEY_IS_SPEECH_APPLICATION_FORBIDDEN]boolValue];
	self.isAllCameraMuted = [[dict objectForKey:TUIROOM_SIGNALING_KEY_IS_ALL_CAMERA_MUTED]boolValue];
	self.isAllMicMuted = [[dict objectForKey:TUIROOM_SIGNALING_KEY_IS_ALL_MIC_MUTED]boolValue];
	self.isCallingRoll = [[dict objectForKey:TUIROOM_SIGNALING_KEY_IS_CALLING_ROLL]boolValue];
	self.startTime = [[dict objectForKey:TUIROOM_SIGNALING_KEY_START_TIME]longLongValue];
}

/**
 * 获取TRTC房间号
 *
 * @return 房间号
 */
- (UInt32)getTRTCRoomId {
	return [self.roomId intValue];
}
@end
