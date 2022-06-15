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
@interface TUIRoomUserManage : NSObject
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

+ (void)clearCache;

+ (void)destroyInstance;

+ (void)cacheRoomId:(NSString *)roomId;

+ (void)cacheUser:(TUIRoomUserInfo *)userInfo;

+ (void)cacheSpeechUser:(TUIRoomUserInfo *)userInfo;

+ (nullable TUIRoomUserInfo *)getUser:(NSString *)userId;

+ (NSArray<TUIRoomUserInfo *> *)userList;

+ (NSArray<NSString *> *)userIdList;

+ (NSArray<NSString *> *)speechUserIdList;

+ (void)getUserInfo:(NSString *)userId callback:(TUIRoomUserInfoCallback)callback;

+ (void)removeUser:(NSString *)userId;

+ (void)removeSpeechUser:(NSString *)userId;

+ (NSString *)currentUserId;

+ (NSString *)currentNickName;

+ (NSString *)currentFaceUrl;

+ (void)updateSelfUserInfo;

@end

NS_ASSUME_NONNULL_END
