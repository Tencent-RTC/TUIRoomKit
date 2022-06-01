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

@interface TUIRoomInfo : NSObject<NSCopying>

/// Room ID
@property (nonatomic, strong) NSString *roomId;
/// Group owner ID
@property (nonatomic, strong) NSString *ownerId;
/// Room name
@property (nonatomic, strong) NSString *roomName;
/// Number of members
@property (nonatomic, assign) NSInteger roomMemberNum;

@property (nonatomic, assign) BOOL isSharingScreen;

/// Speech mode
@property (nonatomic, strong) NSString *speechMode;
/// Start time
@property (nonatomic, assign) long startTime;
/// Whether messages can be sent in the chat room
@property (nonatomic, assign) BOOL isChatRoomMuted;
/// Whether speech is disabled
@property (nonatomic, assign) BOOL isSpeechApplicationForbidden;
/// Whether the video of all members is disabled
@property (nonatomic, assign) BOOL isAllCameraMuted;
/// Whether the mic of all members is disabled
@property (nonatomic, assign) BOOL isAllMicMuted;
/// Whether a roll call is ongoing
@property (nonatomic, assign) BOOL isCallingRoll;

/**
 * Get Room Owner Status
 *
 * @return yes/no
 */
- (BOOL)isHomeowner;

/**
 * Get Speech Mode
 *
 * @return TUIRoomSpeechMode
 */
- (TUIRoomSpeechMode)getSpeechModeType;

/**
 * Get Group Notification
 *
 * @return str
 */
- (NSString *)getNotification;

/**
 * Update Group Notification
 *
 * @param dict dict
 */
- (void)updateNotification:(NSDictionary *)dict;

/**
 * Get TRTC RoomId
 *
 * @return UInt32 roomId
 */
- (UInt32)getTRTCRoomId;

@end

NS_ASSUME_NONNULL_END
