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

/**
  用户信息对象
 */
@interface TUIRoomUserInfo : NSObject

/// 用户ID
@property (nonatomic, strong) NSString *userId;
/// 用户Name
@property (nonatomic, strong) NSString *userName;
/// 用户Avatar
@property (nonatomic, strong) NSString *userAvatar;
/// 用户角色
@property (nonatomic, assign) TUIRoomRole role;
/// 用户是否打开了视频
@property (nonatomic, assign) BOOL isVideoAvailable;
/// 用户是否打开音频
@property (nonatomic, assign) BOOL isAudioAvailable;
/// 是否对远端用户静画
@property (nonatomic, assign) BOOL isRemoteVideoMuted;
/// 是否对远端用户静音
@property (nonatomic, assign) BOOL isRemoteAudioMuted;

/**
 * 用户音频是否打开
 *
 * @return yes打开 no 关闭
 */
- (BOOL)isAudioOpen;

/**
 * 用户视频是否打开
 *
 * @return yes打开 no 关闭
 */
- (BOOL)isVideoOpen;

@end

NS_ASSUME_NONNULL_END
