//
//  TUIRoomIMProtocol.h
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/10.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIRoomDefine.h"

NS_ASSUME_NONNULL_BEGIN
/**
 IM protocol
 */
@interface TUIRoomIMProtocol : NSObject

/**
 * Get the signaling data
 *
 */
+ (NSMutableDictionary *)getMsgDict;

#pragma mark 1->1
/**
 * The host invites an audience member to speak
 *
 * @param roomId Room ID
 * @param receiverId Target user ID
 * @return Signaling data
 */
+ (NSMutableDictionary *)inviteSpeaker:(NSString *)roomId
                            receiverId:(NSString *)receiverId;

/**
 * The host requests the audience member to mic off
 *
 * @param roomId Room ID
 * @param receiverId Target user ID
 * @return Signaling data
 */
+ (NSMutableDictionary *)sendOffSpeaker:(NSString *)roomId
                             receiverId:(NSString *)receiverId;

/**
 * An audience member requests to speak
 *
 * @param roomId Room ID
 * @param receiverId Target user ID
 * @return Signaling data
 */
+ (NSMutableDictionary *)applyForSpeech:(NSString *)roomId
                             receiverId:(NSString *)receiverId;

/**
 * The host disables the mic of an audience member
 *
 * @param roomId Room ID
 * @param receiverId Target user ID
 * @param mute true/false
 * @return Signaling data
 * @note The request cannot be rejected
 */
+ (NSMutableDictionary *)muteMicrophone:(NSString *)roomId
                             receiverId:(NSString *)receiverId
                                   mute:(Boolean)mute;

/**
 * The host disables the camera of an audience member
 *
 * @param roomId Room ID
 * @param receiverId Target user ID
 * @param mute true/false
 * @return Signaling data
 * @note The request cannot be rejected
 */
+ (NSMutableDictionary *)muteCamera:(NSString *)roomId
                         receiverId:(NSString *)receiverId
                               mute:(Boolean)mute;

/**
 * An audience member replies to roll call
 *
 * @param roomId Room ID
 * @param senderId Inviter's user ID
 * @return Signaling data
 */
+ (NSMutableDictionary *)replyCallingRoll:(NSString *)roomId
                                 senderId:(NSString *)senderId;

/**
 * The host removes a user from the room, which cannot be rejected
 *
 * @param roomId Room ID
 * @param receiverId Target user ID
 * @return Signaling data
 */
+ (NSMutableDictionary *)kickOffUser:(NSString *)roomId
                          receiverId:(NSString *)receiverId;

#pragma mark 1->n
/**
 * Request all mic-on members to mic off
 *
 * @param roomId Room ID
 * @return Signaling data
 * @note This API is used to request all mic-on members to mic off, which cannot be rejected
 */
+ (NSMutableDictionary *)sendOffAllSpeaker:(NSString *)roomId;

@end

NS_ASSUME_NONNULL_END
