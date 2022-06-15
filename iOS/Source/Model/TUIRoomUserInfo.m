//
//  TUIRoomUserInfo.m
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "TUIRoomUserInfo.h"

@implementation TUIRoomUserInfo

- (instancetype)init {
	self = [super init];
	if (self) {
		self.userId = @"";
		self.userAvatar = @"";
		self.userName = @"";
	}
	return self;
}

- (BOOL)isAudioOpen {
	if (!_isRemoteAudioMuted && _isAudioAvailable) {
		return YES;
	}
	return NO;
}

- (BOOL)isVideoOpen {
	if (!_isRemoteVideoMuted && _isVideoAvailable) {
		return YES;
	}
	return NO;
}

- (void)setIsRemoteAudioMuted:(BOOL)isRemoteAudioMuted {
	_isRemoteAudioMuted = isRemoteAudioMuted;
	if (_isRemoteAudioMuted) {
		_isAudioAvailable = NO;
	}
}

- (void)setIsRemoteVideoMuted:(BOOL)isRemoteVideoMuted {
	_isRemoteVideoMuted = isRemoteVideoMuted;
	if (_isRemoteVideoMuted) {
		_isVideoAvailable = NO;
	}
}

- (void)setIsAudioAvailable:(BOOL)isAudioAvailable {
	_isAudioAvailable = isAudioAvailable;
	if (isAudioAvailable) {
		_isRemoteAudioMuted = NO;
	}
}

- (void)setIsVideoAvailable:(BOOL)isVideoAvailable {
	_isVideoAvailable = isVideoAvailable;
	if (isVideoAvailable) {
		_isRemoteVideoMuted = NO;
	}
}


@end
