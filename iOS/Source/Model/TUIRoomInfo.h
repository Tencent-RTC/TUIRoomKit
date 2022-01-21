//
//  TUIRoomInfo.h
//  Pods
//
//  Created by WesleyLei on 2021/12/10.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIRoomDefine.h"

NS_ASSUME_NONNULL_BEGIN
/**
  房间信息对象
 */
@interface TUIRoomInfo : NSObject<NSCopying>

/// 房间ID
@property (nonatomic, strong) NSString *roomId;
/// 群拥有者ID
@property (nonatomic, strong) NSString *ownerId;
/// 房间名
@property (nonatomic, strong) NSString *roomName;
/// 成员个数
@property (nonatomic, assign) NSInteger roomMemberNum;
/// 是否在分享屏幕
@property (nonatomic, assign) BOOL isSharingScreen;

// 群Notification属性
/// 发言模式
@property (nonatomic, strong) NSString *speechMode;
/// 开始时间
@property (nonatomic, assign) long startTime;
/// 聊天室是否可以发消息
@property (nonatomic, assign) BOOL isChatRoomMuted;
/// 是否禁止申请发言
@property (nonatomic, assign) BOOL isSpeechApplicationForbidden;
/// 是否全体禁视频
@property (nonatomic, assign) BOOL isAllCameraMuted;
/// 是否全体禁麦克风
@property (nonatomic, assign) BOOL isAllMicMuted;
/// 是否正在点名
@property (nonatomic, assign) BOOL isCallingRoll;

/**
 * 是否是房主
 *
 * @return yes/no
 */
- (BOOL)isHomeowner;

/**
 * 获取TUIRoomSpeechMode
 *
 * @return TUIRoomSpeechMode
 */
- (TUIRoomSpeechMode)getSpeechModeType;

/**
 * 获取群公告
 *
 * @return str
 */
- (NSString *)getNotification;

/**
 * 更新群信息
 *
 * @param dict dict
 */
- (void)updateNotification:(NSDictionary *)dict;

/**
 * 获取TRTC房间号
 *
 * @return 房间号
 */
- (UInt32)getTRTCRoomId;

@end

NS_ASSUME_NONNULL_END
