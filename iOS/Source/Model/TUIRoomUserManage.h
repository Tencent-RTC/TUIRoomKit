//
//  TUIRoomUserManage.h
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/15.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIRoomUserInfo.h"

NS_ASSUME_NONNULL_BEGIN
/**
  用户管理对象
 */
@interface TUIRoomUserManage : NSObject
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 * 清理缓存
 */
+ (void)clearCache;

/**
 * 销毁 TUIRoom 单例对象
 *
 */
+ (void)destroyInstance;

/**
 * 缓存roomId
 *
 * @param roomId roomId
 */
+ (void)cacheRoomId:(NSString *)roomId;
/**
 * 缓存用户
 *
 * @param userInfo userInfo
 */
+ (void)cacheUser:(TUIRoomUserInfo *)userInfo;

/**
 * 缓存麦上用户
 *
 * @param userInfo userInfo
 */
+ (void)cacheSpeechUser:(TUIRoomUserInfo *)userInfo;

/**
 * 获取用户
 *
 * @param userId userId
 */
+ (nullable TUIRoomUserInfo *)getUser:(NSString *)userId;

/**
 * 获取用户列表
 *
 * @return userList
 */
+ (NSArray<TUIRoomUserInfo *> *)userList;

/**
 * 获取用户ID列表
 *
 * @return userList
 */
+ (NSArray<NSString *> *)userIdList;

/**
 * 获取麦上用户ID列表
 *
 * @return userList
 */
+ (NSArray<NSString *> *)speechUserIdList;

/**
 *  获取用户资料
 *
 *  @param userId userId
 *  @param callback callback
 */
+ (void)getUserInfo:(NSString *)userId callback:(TUIRoomUserInfoCallback)callback;

/**
 * 删除用户
 *
 * @param userId userId
 */
+ (void)removeUser:(NSString *)userId;

/**
 * 删除麦上用户
 *
 * @param userId userId
 */
+ (void)removeSpeechUser:(NSString *)userId;

/**
 * 当前用户id
 *
 * @return 用户id
 */
+ (NSString *)currentUserId;

/**
 * 当前用户nickName
 *
 * @return 用户nickName
 */
+ (NSString *)currentNickName;

/**
 * 当前用户faceUrl
 *
 * @return 用户faceUrl
 */
+ (NSString *)currentFaceUrl;

/**
 * 刷新个人信息
 *
 */
+ (void)updateSelfUserInfo;

@end

NS_ASSUME_NONNULL_END
