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
 IMP协议
 */
@interface TUIRoomIMProtocol : NSObject

/**
 * 获取信令数据
 *
 */
+ (NSMutableDictionary *)getMsgDict;

#pragma mark 1->1
/**
 * 主持人邀请观众发言
 *
 * @param roomId 房间id
 * @param receiverId 接收者用户id
 * @return 信令数据
 */
+ (NSMutableDictionary *)inviteSpeaker:(NSString *)roomId
                            receiverId:(NSString *)receiverId;

/**
 * 主持人邀请观众下台
 *
 * @param roomId 房间id
 * @param receiverId 接收者用户id
 * @return 信令数据
 */
+ (NSMutableDictionary *)sendOffSpeaker:(NSString *)roomId
                             receiverId:(NSString *)receiverId;

/**
 * 观众申请发言
 *
 * @param roomId 房间id
 * @param receiverId 接收者用户id
 * @return 信令数据
 */
+ (NSMutableDictionary *)applyForSpeech:(NSString *)roomId
                             receiverId:(NSString *)receiverId;

/**
 * 主持人禁用观众麦克风
 *
 * @param roomId 房间id
 * @param receiverId 接收者用户id
 * @param mute true/false
 * @return 信令数据
 * @note 不可拒绝，只能接受
 */
+ (NSMutableDictionary *)muteMicrophone:(NSString *)roomId
                             receiverId:(NSString *)receiverId
                                   mute:(Boolean)mute;

/**
 * 主持人禁用观众摄像头
 *
 * @param roomId 房间id
 * @param receiverId 接收者用户id
 * @param mute true/false
 * @return 信令数据
 * @note 不可拒绝，只能接受
 */
+ (NSMutableDictionary *)muteCamera:(NSString *)roomId
                         receiverId:(NSString *)receiverId
                               mute:(Boolean)mute;

/**
 * 观众回复点名（签到）
 *
 * @param roomId 房间id
 * @param senderId 邀请者用户id
 * @return 信令数据
 */
+ (NSMutableDictionary *)replyCallingRoll:(NSString *)roomId
                                 senderId:(NSString *)senderId;

/**
 * 主持人踢人出房间，不可拒绝，只能接受
 *
 * @param roomId 房间id
 * @param receiverId 接收者用户id
 * @return 信令数据
 */
+ (NSMutableDictionary *)kickOffUser:(NSString *)roomId
                          receiverId:(NSString *)receiverId;

#pragma mark 1->n
/**
 * 邀请全体麦上成员下麦
 *
 * @param roomId 房间id
 * @return 信令数据
 * @note 麦上所有成员下麦，不可拒绝，只能接受
 */
+ (NSMutableDictionary *)sendOffAllSpeaker:(NSString *)roomId;

@end

NS_ASSUME_NONNULL_END
