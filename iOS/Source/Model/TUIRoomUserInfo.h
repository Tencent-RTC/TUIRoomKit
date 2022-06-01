//
//  TUIRoomUserInfo.h
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIRoomDefine.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUIRoomUserInfo : NSObject

/// User ID
@property (nonatomic, strong) NSString *userId;
/// Username
@property (nonatomic, strong) NSString *userName;
/// User profile photo URL
@property (nonatomic, strong) NSString *userAvatar;
/// User role
@property (nonatomic, assign) TUIRoomRole role;
/// Whether the user's video is enabled
@property (nonatomic, assign) BOOL isVideoAvailable;
/// Whether the user's audio is enabled
@property (nonatomic, assign) BOOL isAudioAvailable;
/// Whether the remote user's video is enabled
@property (nonatomic, assign) BOOL isRemoteVideoMuted;
/// Whether the remote user's audio is enabled
@property (nonatomic, assign) BOOL isRemoteAudioMuted;

- (BOOL)isAudioOpen;

- (BOOL)isVideoOpen;

@end

NS_ASSUME_NONNULL_END
