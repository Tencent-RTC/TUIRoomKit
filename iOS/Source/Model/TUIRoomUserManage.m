//
//  TUIRoomUserManage.m
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/15.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "TUIRoomUserManage.h"
#import <ImSDK_Plus/ImSDK_Plus.h>
#import <TUICore/TUILogin.h>
#import "TUIRoomTRTCService.h"

@interface TUILogin (TUIRoom)

+ (void)getSelfUserInfo;

@end

@interface TUIRoomUserManage ()
{
	dispatch_queue_t _queue;
}
/// 全部用户缓存
@property (nonatomic, strong) NSMutableDictionary<NSString *,TUIRoomUserInfo *> *userCacheMap;
/// 上麦用户缓存
@property (nonatomic, strong) NSMutableDictionary<NSString *,TUIRoomUserInfo *> *userSpeechCacheMap;
/// 房间号
@property (nonatomic, strong) NSString *roomId;

@end

@implementation TUIRoomUserManage

static TUIRoomUserManage *gInstance = nil;
static dispatch_once_t gOnceToken;

#pragma mark 初始化
- (instancetype)init {
	self = [super init];
	if (self) {
		_queue = dispatch_queue_create("TUIRoomUserManage", DISPATCH_QUEUE_SERIAL);
		_userCacheMap = [[NSMutableDictionary alloc]init];
		_userSpeechCacheMap = [[NSMutableDictionary alloc]init];
	}
	return self;
}

#pragma mark public function

/**
 * 清理缓存
 */
+ (void)clearCache {
	[[TUIRoomUserManage shareInstance] deleteCache];
}

/**
 * 销毁 TUIRoom 单例对象
 *
 */
+ (void)destroyInstance {
	gInstance = nil;
    gOnceToken = 0;
}

/**
 * 缓存roomId
 *
 * @param roomId roomId
 */
+ (void)cacheRoomId:(NSString *)roomId {
	[TUIRoomUserManage shareInstance].roomId = roomId;
}

/**
 * 缓存用户
 *
 * @param userInfo userInfo
 */
+ (void)cacheUser:(TUIRoomUserInfo *)userInfo {
	[[TUIRoomUserManage shareInstance] saveUser:userInfo];
}

/**
 * 缓存麦上用户
 *
 * @param userInfo userInfo
 */
+ (void)cacheSpeechUser:(TUIRoomUserInfo *)userInfo {
	[[TUIRoomUserManage shareInstance] saveSpeechUser:userInfo];
}

/**
 * 获取用户
 *
 * @param userId userId
 */
+ (nullable TUIRoomUserInfo *)getUser:(NSString *)userId {
	if (userId) {
		return [[TUIRoomUserManage shareInstance] getUser:userId];
	} else {
		return nil;
	}
}

/**
 * 获取用户列表
 *
 * @return userList
 */
+ (NSArray<TUIRoomUserInfo *> *)userList {
	return [[TUIRoomUserManage shareInstance] getUserList];
}

/**
 * 获取用户ID列表
 *
 * @return userList
 */
+ (NSArray<NSString *> *)userIdList {
	return [[TUIRoomUserManage shareInstance] getUserIdList];
}

/**
 * 获取麦上用户ID列表
 *
 * @return userList
 */
+ (NSArray<NSString *> *)speechUserIdList {
	return [[TUIRoomUserManage shareInstance] getUserIdSpeechList];
}

/**
 *  获取用户资料
 *
 *  @param userId userId
 *  @param callback callback
 */
+ (void)getUserInfo:(NSString *)userId callback:(TUIRoomUserInfoCallback)callback {
    NSString *roomId = [TUIRoomUserManage shareInstance].roomId;
    if (!userId || !roomId) {
        if (callback) {
            callback(TUIRoomErrorParamInvalid,@"Invalid parameter",nil);
        }
        TRTCLog(@"get user info Invalid parameter (userId=%d roomId=%@)",userId,roomId);
        return;
    }
    [[V2TIMManager sharedInstance] getGroupMembersInfo:roomId memberList:@[userId] succ:^(NSArray<V2TIMGroupMemberFullInfo *> *memberList) {
        V2TIMGroupMemberFullInfo *obj = memberList.firstObject;
        TUIRoomUserInfo *userInfo = nil;
        if (obj) {
            userInfo = [[TUIRoomUserInfo alloc] init];
            userInfo.userId = obj.userID;
            userInfo.userName = obj.nickName;
            userInfo.userAvatar = obj.faceURL;
            if (obj.role == V2TIM_GROUP_MEMBER_ROLE_SUPER) {
                userInfo.role = TUIRoomMaster;
            } else {
                userInfo.role = TUIRoomAudience;
            }
        }
        if (callback) {
            if (userInfo) {
                callback(TUIRoomSuccessCode,@"success",userInfo);
            } else {
                callback(TUIRoomErrorParamInvalid,@"get user info fail",userInfo);
                TRTCLog(@"get user info fail (userId=%d roomId=%@ message=no find)",userId,roomId);
            }
        }
    } fail:^(int code, NSString *desc) {
        if (callback) {
            callback(code,desc,nil);
        }
        TRTCLog(@"get user info fail (userId=%d roomId=%@ code=%d message=%@)",userId,roomId,code,desc);
    }];
}

/**
 * 删除用户
 *
 * @param userId userId
 */
+ (void)removeUser:(NSString *)userId {
	if (userId) {
		[[TUIRoomUserManage shareInstance] deleteUser:userId];
	}
}

/**
 * 删除麦上用户
 *
 * @param userId userId
 */
+ (void)removeSpeechUser:(NSString *)userId {
	if (userId) {
		[[TUIRoomUserManage shareInstance] deleteSpeechUser:userId];
	}
}

/**
 * 当前用户id
 *
 * @return 用户id
 */
+ (NSString *)currentUserId {
	return [TUILogin getUserID] ? : @"";
}

/**
 * 当前用户nickName
 *
 * @return 用户nickName
 */
+ (NSString *)currentNickName {
	return [TUILogin getNickName] ? : @"";
}

/**
 * 当前用户faceUrl
 *
 * @return 用户faceUrl
 */
+ (NSString *)currentFaceUrl {
	return [TUILogin getFaceUrl] ? : @"";
}

/**
 * 刷新个人信息
 *
 */
+ (void)updateSelfUserInfo {
	if ([TUILogin getUserID].length > 0) {
		[TUILogin getSelfUserInfo];
	}
}

#pragma mark private function

+ (instancetype)shareInstance {
	dispatch_once(&gOnceToken, ^{
		gInstance = [[TUIRoomUserManage alloc] init];
	});
	return gInstance;
}

- (void)saveUser:(TUIRoomUserInfo *)userInfo {
	if (userInfo && userInfo.userId) {
		__weak typeof(self) wealSelf = self;
		[self syncRun:^{
		    __strong typeof(wealSelf) strongSelf = wealSelf;
		    TUIRoomUserInfo *cacheUserInfo = [strongSelf.userCacheMap objectForKey:userInfo.userId];
		    if (!cacheUserInfo) {
				[strongSelf.userCacheMap setValue:userInfo forKey:userInfo.userId];
			} else {
				if (userInfo.userName.length > 0) {
					cacheUserInfo.userName = userInfo.userName;
					cacheUserInfo.userAvatar = userInfo.userAvatar;
					cacheUserInfo.role = userInfo.role;
				}
			}
		}];
	}
}

- (void)saveSpeechUser:(TUIRoomUserInfo *)userInfo {
	if (userInfo && userInfo.userId) {
		__weak typeof(self) wealSelf = self;
		[self syncRun:^{
		    __strong typeof(wealSelf) strongSelf = wealSelf;
		    if (![strongSelf.userSpeechCacheMap objectForKey:userInfo.userId]) {
				[strongSelf.userSpeechCacheMap setValue:userInfo forKey:userInfo.userId];
			}
		}];
	}
}

- (NSArray<TUIRoomUserInfo *> *)getUserList {
	__weak typeof(self) wealSelf = self;
	__block NSArray<TUIRoomUserInfo *> *memberList = @[];
	[self syncRun:^{
        __strong typeof(wealSelf) strongSelf = wealSelf;
        memberList = [strongSelf.userCacheMap allValues];
	}];
	return memberList;
}

- (NSArray<NSString *> *)getUserIdList {
	__weak typeof(self) wealSelf = self;
	__block NSArray<NSString *> *memberIdList = @[];
	[self syncRun:^{
        __strong typeof(wealSelf) strongSelf = wealSelf;
        memberIdList = [strongSelf.userCacheMap allKeys];
	}];
	return memberIdList;
}

- (NSArray<NSString *> *)getUserIdSpeechList {
	__weak typeof(self) wealSelf = self;
	__block NSArray<NSString *> *memberIdList = @[];
	[self syncRun:^{
        __strong typeof(wealSelf) strongSelf = wealSelf;
        memberIdList = [strongSelf.userSpeechCacheMap allKeys];
	}];
	return memberIdList;
}

- (TUIRoomUserInfo *)getUser:(NSString *)userId {
	__weak typeof(self) wealSelf = self;
	__block TUIRoomUserInfo *user = nil;
	[self syncRun:^{
        __strong typeof(wealSelf) strongSelf = wealSelf;
        user = [strongSelf.userCacheMap objectForKey:userId];
	}];
	return user;
}

- (void)deleteUser:(NSString *)userId {
	if (userId) {
		__weak typeof(self) wealSelf = self;
		[self syncRun:^{
            __strong typeof(wealSelf) strongSelf = wealSelf;
            [strongSelf.userCacheMap removeObjectForKey:userId];
		}];
	}
}

- (void)deleteSpeechUser:(NSString *)userId {
	if (userId) {
		__weak typeof(self) wealSelf = self;
		[self syncRun:^{
            __strong typeof(wealSelf) strongSelf = wealSelf;
            [strongSelf.userSpeechCacheMap removeObjectForKey:userId];
		}];
	}
}

- (void)deleteCache {
	__weak typeof(self) wealSelf = self;
	[self syncRun:^{
        __strong typeof(wealSelf) strongSelf = wealSelf;
        if (strongSelf) {
			strongSelf->_userCacheMap = [[NSMutableDictionary alloc]init];
			strongSelf->_userSpeechCacheMap = [[NSMutableDictionary alloc]init];
		}
	}];
}

//同步
- (void)syncRun:(os_block_t)block {
	if (_queue) {
		dispatch_sync(_queue, ^{
			if (block) {
				block();
			}
		});
	}
}

- (void)dealloc {
	NSLog(@"dealloc %@",NSStringFromClass([self class]));
}

@end
