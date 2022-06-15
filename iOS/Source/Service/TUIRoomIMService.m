//
//  TUIRoomIMService.m
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "TUIRoomIMService.h"
#import <ImSDK_Plus/ImSDK_Plus.h>
#import <TUICore/TUILogin.h>
#import "TUIRoomUserInfo.h"
#import "TUIRoomIMProtocol.h"
#import "MJExtension.h"
#import "TUIRoomInfo.h"
#import "TUIRoomUserManage.h"
#import "TUIRoomTRTCService.h"

@interface TUIRoomIMService ()<V2TIMGroupListener,V2TIMSignalingListener,V2TIMSimpleMsgListener> {
    NSDictionary *_signalingMap;
}

@property (nonatomic, assign) BOOL mIsEnterRoom;

@property (nonatomic, strong) NSString *mRoomId;

@property (nonatomic, strong) TUIRoomInfo *roomInfo;
/// Invite Block Cache
@property (nonatomic, strong) NSCache *inviteBlockCache;
/// Speech Invitation UserId Cache
@property (nonatomic, strong) NSCache *speechInvitationUserIdCache;
/// Speech InviteID
@property (nonatomic, strong) NSString *speechInviteID;
@end

@implementation TUIRoomIMService

#pragma mark - init
- (instancetype)init {
	self = [super init];
	if (self) {
        _signalingMap = @{
            TUIROOM_SIGNALING_KEY_CMD_INVITE_SPEAKER:@(TUIRoomSignalingInviteSpeaker),
            TUIROOM_SIGNALING_KEY_CMD_SEND_OFF_SPEAKER:@(TUIRoomSignalingSendOffSpeaker),
            TUIROOM_SIGNALING_KEY_CMD_APPLY_FOR_SPEECH:@(TUIRoomSignalingApplyForSpeech),
            TUIROOM_SIGNALING_KEY_CMD_MUTE_MICROPHONE:@(TUIRoomSignalingMuteMicrophone),
            TUIROOM_SIGNALING_KEY_CMD_MUTE_CAMERA:@(TUIRoomSignalingMuteCamera),
            TUIROOM_SIGNALING_KEY_CMD_REPLY_CALLING_ROLL:@(TUIRoomSignalingReplyCallingRoll),
            TUIROOM_SIGNALING_KEY_CMD_KICK_OFF_USER:@(TUIRoomSignalingKickOffUser),
            TUIROOM_SIGNALING_KEY_CMD_SEND_OFF_ALL_SPEAKER:@(TUIRoomSignalingSendOffAllSpeaker),
        };
		self.mIsEnterRoom = NO;
		self.mRoomId = @"";
        self.inviteBlockCache = [[NSCache alloc] init];
        self.speechInvitationUserIdCache = [[NSCache alloc] init];
        [[V2TIMManager sharedInstance] addSignalingListener:self];
        [V2TIMManager.sharedInstance addGroupListener:self];
        [V2TIMManager.sharedInstance addSimpleMsgListener:self];
        
	}
	return self;
}

#pragma mark public function

- (void)setSelfProfile:(NSString *)userName
             avatarURL:(NSString *)avatarURL
              callback:(TUIRoomActionCallback)callback {
    V2TIMUserFullInfo *info = [[V2TIMUserFullInfo alloc] init];
    info.nickName = userName;
    info.faceURL = avatarURL;
    [[V2TIMManager sharedInstance] setSelfInfo:info succ:^{
        if (callback) {
            callback(TUIRoomSuccessCode, @"set profile success.");
        }
    } fail:^(int code, NSString *desc) {
        if (callback) {
            callback(TUIRoomErrorSetSelfProfileFailed, desc);
        }
        TRTCLog(@"set profile error (code=%d desc=%@)",code,desc);
    }];
}

- (void)transferRoomMaster:(NSString *)userId
                  callback:(TUIRoomActionCallback)callback {
    [V2TIMManager.sharedInstance transferGroupOwner:self.mRoomId member:userId succ:^{
        if (callback) {
            callback(TUIRoomSuccessCode,@"");
        }
    } fail:^(int code, NSString *desc) {
        if (callback) {
            callback(TUIRoomErrorTransferRoomFailed,desc);
        }
        TRTCLog(@"transfer room master error (code=%d desc=%@)",code,desc);
    }];
}

- (void)createRoom:(TUIRoomInfo *)roomInfo
          callback:(TUIRoomActionCallback)callback {
    if (self.isEnterRoom) {
        if (callback) {
            callback(TUIRoomSuccessCode, [NSString stringWithFormat:@"you have been in room :%@ can't create another room: %@", _mRoomId, roomInfo.roomId]);
        }
        return;
    }
    __weak typeof(self) wealSelf = self;
    os_block_t getGroupInfoBlock = ^() {
        __strong typeof(wealSelf) strongSelf = wealSelf;
        [strongSelf groupsInfo:roomInfo callback:callback];
    };

    V2TIMGroupInfo *info = [[V2TIMGroupInfo alloc] init];
    info.groupType = @"Public";
    info.groupID = roomInfo.roomId;
    info.groupName = roomInfo.roomName;
    info.notification = [roomInfo getNotification];
    info.groupAddOpt = V2TIM_GROUP_ADD_ANY;
    [[V2TIMManager sharedInstance] createGroup:info memberList:nil succ:^(NSString *groupID) {
        __strong typeof(wealSelf) strongSelf = wealSelf;
        if (callback) {
            strongSelf.roomInfo = roomInfo;
            strongSelf.mIsEnterRoom = YES;
            strongSelf.mRoomId = roomInfo.roomId;
            [TUIRoomUserManage cacheRoomId:strongSelf.mRoomId];
            callback(TUIRoomSuccessCode,@"create room success");
            [strongSelf memberList:0 callback:nil];
        }
    } fail:^(int code, NSString *desc) {
        if (code == ERR_SVR_GROUP_GROUPID_IN_USED_FOR_SUPER) {
            [[V2TIMManager sharedInstance] joinGroup:roomInfo.roomId msg:nil succ:^{
                if (getGroupInfoBlock) {
                    getGroupInfoBlock();
                }
            } fail:^(int code, NSString *desc) {
                if (code == ERR_SVR_GROUP_ALLREADY_MEMBER) {
                    if (getGroupInfoBlock) {
                        getGroupInfoBlock();
                    }
                } else {
                    if (callback) {
                        callback(code, desc ?: @"room exit ,but join group failed.");
                    }
                }
            }];
        } else {
            if (callback) {
                callback(code, desc ?: @"create room failed.");
            }
        }
    }];
}

- (void)groupsInfo:(TUIRoomInfo *)roomInfo
          callback:(TUIRoomActionCallback)callback {
    __weak typeof(self) wealSelf = self;
    [V2TIMManager.sharedInstance getGroupsInfo:@[roomInfo.roomId] succ:^(NSArray<V2TIMGroupInfoResult *> *groupResultList) {
        V2TIMGroupInfoResult *groupInfo = groupResultList.firstObject;
        if (!groupInfo || (groupInfo.resultCode != 0)) {
            if (callback) {
                callback(TUIRoomErrorEnterRoomFailed,@"");
            }
            return;
        }
        NSString* jsonString = groupInfo.info.notification ?: @"";
        NSDictionary* dic = [jsonString mj_JSONObject];
        if ([dic isKindOfClass:[NSDictionary class]] && dic.count) {
            __strong typeof(wealSelf) strongSelf = wealSelf;
            strongSelf.mIsEnterRoom = YES;
            strongSelf.mRoomId = groupInfo.info.groupID;
            strongSelf.roomInfo = [[TUIRoomInfo alloc]init];
            strongSelf.roomInfo.roomId = groupInfo.info.groupID;
            strongSelf.roomInfo.ownerId = groupInfo.info.owner;
            strongSelf.roomInfo.roomName = groupInfo.info.groupName;
            strongSelf.roomInfo.roomMemberNum = groupInfo.info.memberCount;
            [strongSelf.roomInfo updateNotification:dic];
            [TUIRoomUserManage cacheRoomId:strongSelf.mRoomId];
            if (callback) {
                callback(TUIRoomSuccessCode,@"");
            }
            [strongSelf memberList:0 callback:nil];
        } else {
            if (callback) {
                callback(TUIRoomErrorCreateRoomFailed,@"room exit ,but get groups info failed.");
            }
        }
    } fail:^(int code, NSString *desc) {
        if (callback) {
            callback(TUIRoomErrorCreateRoomFailed, desc);
        }
    }];
}

- (void)enterRoom:(NSString *)roomId
         callback:(TUIRoomActionCallback)callback {
    __weak typeof(self) wealSelf = self;
    os_block_t getGroupInfoBlock = ^() {
        [V2TIMManager.sharedInstance getGroupsInfo:@[roomId] succ:^(NSArray<V2TIMGroupInfoResult *> *groupResultList) {
            V2TIMGroupInfoResult *groupInfo = groupResultList.firstObject;
            if (!groupInfo || (groupInfo.resultCode != 0)) {
                if (callback) {
                    callback(TUIRoomErrorEnterRoomFailed,@"");
                }
                return;
            }
            NSString* jsonString = groupInfo.info.notification ?: @"";
            NSDictionary* dic = [jsonString mj_JSONObject];
            if ([dic isKindOfClass:[NSDictionary class]] && dic.count) {
                __strong typeof(wealSelf) strongSelf = wealSelf;
                strongSelf.mIsEnterRoom = YES;
                strongSelf.mRoomId = roomId;
                strongSelf.roomInfo = [[TUIRoomInfo alloc]init];
                strongSelf.roomInfo.roomId = groupInfo.info.groupID;
                strongSelf.roomInfo.ownerId = groupInfo.info.owner;
                strongSelf.roomInfo.roomName = groupInfo.info.groupName;
                strongSelf.roomInfo.roomMemberNum = groupInfo.info.memberCount;
                [strongSelf.roomInfo updateNotification:dic];
                [TUIRoomUserManage cacheRoomId:strongSelf.mRoomId];
                if (callback) {
                    callback(TUIRoomSuccessCode,@"");
                }
                [strongSelf memberList:0 callback:nil];
            } else {
                if (callback) {
                    callback(TUIRoomErrorEnterRoomFailed,@"enter room fail");
                }
            }
        } fail:^(int code, NSString *desc) {
            if (callback) {
                callback(TUIRoomErrorEnterRoomFailed, [NSString stringWithFormat:@"getGroupsInfo error, enter room fail. code: %d msg:%@", code, desc]);
            }
        }];
    };
    
    [V2TIMManager.sharedInstance joinGroup:roomId msg:@"" succ:^{
        if (getGroupInfoBlock) {
            getGroupInfoBlock();
        }
    } fail:^(int code, NSString *desc) {
        if (code == ERR_SVR_GROUP_ALLREADY_MEMBER) {
            if (getGroupInfoBlock) {
                getGroupInfoBlock();
            }
        } else {
            if (callback) {
                callback(code, desc);
            }
        }
    }];
}

- (void)leaveRoom:(TUIRoomActionCallback)callback {
    
    if (!self.isEnterRoom) {
        if (callback) {
            callback(TUIRoomSuccessCode, @"not enter room yet, can't leave room.");
        }
        return;
    }
    
    if ([self.roomInfo isHomeowner]) {
        callback(TUIRoomErrorExitRoomFailed, @"Homeowner please call destroyRoom");
        return;
    }
    __weak typeof(self) wealSelf = self;
    [V2TIMManager.sharedInstance quitGroup:self.mRoomId succ:^{
        __strong typeof(wealSelf) strongSelf = wealSelf;
        [strongSelf cleanRoomInfo];
        if (callback) {
            callback(TUIRoomSuccessCode, @"leave room success.");
        }
        TRTCLog(@"im leave room success");
    } fail:^(int code, NSString *desc) {
        if (callback) {
            callback(code, desc);
        }
        TRTCLog(@"im leave room (code=%d message=%@)",code,desc);
    }];
}

- (void)destroyRoom:(TUIRoomActionCallback)callback {
    
    if (!self.isEnterRoom) {
        if (callback) {
            callback(TUIRoomSuccessCode, @"not enter room yet, can't destroy room");
        }
        return;
    }
    
    if (![self.roomInfo isHomeowner]) {
        if (callback) {
            callback(TUIRoomErrorDestoryRoomFailed, @"Homeowner only destruction");
        }
        return;
    }
    
    __weak typeof(self) weakSelf = self;
    [V2TIMManager.sharedInstance dismissGroup:self.mRoomId succ:^{
        __strong typeof(weakSelf) strongSelf = weakSelf;
        if (!strongSelf) {
            return;
        }
        [strongSelf unInitIMListener];
        [strongSelf cleanRoomInfo];
        if (callback) {
            callback(TUIRoomSuccessCode, @"destroy room success.");
        }
    } fail:^(int code, NSString *desc) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
        if (!strongSelf) {
            return;
        }
        [strongSelf unInitIMListener];
        [strongSelf cleanRoomInfo];
        if (callback) {
            callback(code, desc);
        }
    }];
}

- (NSArray<TUIRoomUserInfo *> *)getMemberList {
    return [TUIRoomUserManage userList];
}

- (void)getRoomInfo:(TUIRoomRoomInfoCallback)callback {
    if (![self isEnterRoom] || !self.mRoomId) {
        if (callback) {
            callback(TUIRoomErrorGetRoomInfoFailed,@"",nil);
        }
        return;
    }
    __weak typeof(self) wealSelf = self;
    [[V2TIMManager sharedInstance] getGroupsInfo:@[self.mRoomId] succ:^(NSArray<V2TIMGroupInfoResult *> *groupResultList) {
        V2TIMGroupInfoResult *groupInfo = groupResultList.firstObject;
        if (!groupInfo || (groupInfo.resultCode != 0)) {
            if (callback) {
                callback(TUIRoomErrorGetRoomInfoFailed,@"",nil);
            }
            TRTCLog(@"get room info error not find (roomId=%@)",self.mRoomId);
            return;
        }
        NSString* jsonString = groupInfo.info.notification ?: @"";
        NSDictionary* dic = [jsonString mj_JSONObject];
        if ([dic isKindOfClass:[NSDictionary class]] && dic.count) {
            __strong typeof(wealSelf) strongSelf = wealSelf;
            strongSelf.roomInfo = [[TUIRoomInfo alloc]init];
            strongSelf.roomInfo.roomId = groupInfo.info.groupID;
            strongSelf.roomInfo.ownerId = groupInfo.info.owner;
            strongSelf.roomInfo.roomName = groupInfo.info.groupName;
            strongSelf.roomInfo.roomMemberNum = groupInfo.info.memberCount;
            [strongSelf.roomInfo updateNotification:dic];
            [TUIRoomUserManage cacheRoomId:strongSelf.mRoomId];
            if (callback) {
                callback(TUIRoomSuccessCode,@"",strongSelf.roomInfo);
            }
        } else {
            if (callback) {
                callback(TUIRoomErrorGetRoomInfoFailed,@"",nil);
            }
            TRTCLog(@"get room info error notification data error (roomId=%@)",self.mRoomId);
        }
    } fail:^(int code, NSString *msg) {
        if (callback) {
            callback(TUIRoomErrorGetRoomInfoFailed,@"",nil);
        }
        TRTCLog(@"get room info error (roomId=%@ code=%d message=%@)",self.mRoomId,code,msg);
    }];
}

#pragma mark invite
- (void)onInviteGroup:(NSString *)roomId
          inviteeList:(NSArray *)inviteeList
                param:(NSDictionary<NSString *,id> *)param
             callback:(TUIRoomInviteeCallback)callback {
    [self inviteGroup:roomId inviteeList:inviteeList param:param callback:callback];
}

- (void)sendSpeechInvitation:(NSString *)userId
                       param:(NSDictionary<NSString *,id> *)param
                    callback:(TUIRoomInviteeCallback)callback {
    NSString *data = [param mj_JSONString];
    NSString *inviteID = @"";
    __weak typeof(self) wealSelf = self;
    inviteID = [[V2TIMManager sharedInstance] invite:userId
                                                data:data
                                      onlineUserOnly:NO
                                     offlinePushInfo:nil
                                             timeout:TUIROOM_SIGNALING_EXTRA_KEY_TIME_OUT
                                                succ:^{
                                                    NSLog(@"inviteID :%@ send success",inviteID);
                                                }
                                                fail:^(int code, NSString *desc) {
                                                    __strong typeof(wealSelf) strongSelf = wealSelf;
                                                    if (inviteID) {
                                                        [strongSelf.inviteBlockCache removeObjectForKey:inviteID];
                                                    }
                                                    if (callback) {
                                                        callback(TUIRoomInviteeFailed,desc);
                                                    }
                                                }];
    if (callback && inviteID) {
        [self.inviteBlockCache setObject:callback forKey:inviteID];
    }
    if (inviteID && userId) {
        [self.speechInvitationUserIdCache setObject:inviteID forKey:userId];
    }
}

- (void)cancelSpeechInvitation:(NSString *)userId
                         param:(NSDictionary<NSString *,id> *)param
                      callback:(TUIRoomActionCallback)callback {
    NSString *inviteID = [self.speechInvitationUserIdCache objectForKey:userId?:@""];
    if (inviteID && [self.inviteBlockCache objectForKey:inviteID]) {
        __weak typeof(self) wealSelf = self;
        NSString *data = [param mj_JSONString];
        [[V2TIMManager sharedInstance] cancel:inviteID
                                        data:data
                                        succ:^{
                                            __strong typeof(wealSelf) strongSelf = wealSelf;
                                            if (inviteID) {
                                                [strongSelf.speechInvitationUserIdCache removeObjectForKey:inviteID];
                                            }
                                            if (callback) {
                                                callback(0,@"cancel success");
                                            }
                                        }
                                        fail:^(int code, NSString *desc) {
                                            if (callback) {
                                                callback(code,desc?:@"cancel error");
                                            }
                                        }];
    } else {
        if (inviteID) {
            [self.speechInvitationUserIdCache removeObjectForKey:inviteID];
        }
        if (callback) {
            callback(TUIRoomErrorParamInvalid,@"Invitation completed");
        }
    }
}

- (void)sendSpeechApplication:(NSString *)userId
                        param:(NSDictionary<NSString *,id> *)param
                     callback:(TUIRoomInviteeCallback)callback {
    NSString *data = [param mj_JSONString];
    NSString *inviteID = @"";
    __weak typeof(self) wealSelf = self;
    inviteID = [[V2TIMManager sharedInstance] invite:userId
                                                data:data
                                      onlineUserOnly:NO
                                     offlinePushInfo:nil
                                             timeout:TUIROOM_SIGNALING_EXTRA_KEY_TIME_OUT
                                                succ:^{
                                                    NSLog(@"inviteID :%@ send success",inviteID);
                                                }
                                                fail:^(int code, NSString *desc) {
                                                    __strong typeof(wealSelf) strongSelf = wealSelf;
                                                    if (inviteID) {
                                                        [strongSelf.inviteBlockCache removeObjectForKey:inviteID];
                                                    }
                                                    if (callback) {
                                                        callback(TUIRoomInviteeFailed,desc);
                                                    }
                                                }];
    if (callback && inviteID) {
        [self.inviteBlockCache setObject:callback forKey:inviteID];
    }
    self.speechInviteID = inviteID;
}

- (void)cancelSpeechApplication:(NSDictionary<NSString *,id> *)param
                       callback:(TUIRoomActionCallback)callback {
    
    NSString *inviteID = self.speechInviteID;
    if (inviteID && [self.inviteBlockCache objectForKey:inviteID]) {
        __weak typeof(self) wealSelf = self;
        NSString *data = [param mj_JSONString];
        [[V2TIMManager sharedInstance] cancel:inviteID
                                        data:data
                                        succ:^{
                                            __strong typeof(wealSelf) strongSelf = wealSelf;
                                            if ([strongSelf.speechInviteID isEqualToString:inviteID]) {
                                                strongSelf.speechInviteID = nil;
                                            }
                                            if (callback) {
                                                callback(0,@"cancel success");
                                            }
                                        }
                                        fail:^(int code, NSString *desc) {
                                            if (callback) {
                                                callback(code,desc?:@"cancel error");
                                            }
                                        }];
    } else {
        self.speechInviteID = nil;
        if (callback) {
            callback(TUIRoomErrorParamInvalid,@"Invitation completed");
        }
    }
}

- (void)onInviteUser:(NSString *)userId
               param:(NSDictionary<NSString *,id> *)param
            callback:(TUIRoomInviteeCallback)callback {
    [self inviteUser:userId param:param callback:callback];
}

- (void)sendChatMessage:(NSString *)message
               callback:(TUIRoomActionCallback)callback {
    
    if (!self.isEnterRoom) {
        if (callback) {
            callback(TUIRoomErrorSendChatMessageFailed, @"send room text fail, not enter room yet.");
        }
        TRTCLog(@"not join room error (roomId=%@)",self.mRoomId);
        return;
    }

    [V2TIMManager.sharedInstance sendGroupTextMessage:message to:self.mRoomId priority:V2TIM_PRIORITY_NORMAL succ:^{
        if (callback) {
            callback(TUIRoomSuccessCode, @"send group message success.");
        }
    } fail:^(int code, NSString *desc) {
        if (callback) {
            callback(TUIRoomErrorSendChatMessageFailed, desc);
        }
        TRTCLog(@"send chat message error (roomId=%@ code=%d message=%@)",self.mRoomId,code,desc);
    }];
}

- (void)updateGroupNotification:(NSString *)notification
                       callback:(TUIRoomActionCallback)callback {
    V2TIMGroupInfo *info = [[V2TIMGroupInfo alloc] init];
    info.groupID = self.mRoomId;
    info.notification = notification;
    [V2TIMManager.sharedInstance setGroupInfo:info succ:^{
        if (callback) {
            callback(TUIRoomSuccessCode,@"");
        }
    } fail:^(int code, NSString *desc) {
        if (callback) {
            callback(TUIRoomErrorChangeRoomInfoFailed,desc);
        }
        TRTCLog(@"update group notification error (roomId=%@ code=%d message=%@ notification=%@)",self.mRoomId,code,desc,notification);
    }];
}

- (void)acceptInvitation:(BOOL)isAgree
                inviteID:(NSString *)inviteID
                callback:(TUIRoomActionCallback)callback {
    NSDictionary *dic = [TUIRoomIMProtocol getMsgDict];
    NSString *jsonString = [dic mj_JSONString];
    if (isAgree) {
        [V2TIMManager.sharedInstance accept:inviteID data:jsonString succ:^{
            if (callback) {
                callback(TUIRoomSuccessCode, @"accept invitation success.");
            }
        } fail:^(int code, NSString *desc) {
            if (callback) {
                callback(code, desc ?: @"accept invatiaon failed");
            }
        }];
    } else {
        [V2TIMManager.sharedInstance reject:inviteID data:jsonString succ:^{
            if (callback) {
                callback(TUIRoomSuccessCode, @"reject invitation success.");
            }
        } fail:^(int code, NSString *desc) {
            if (callback) {
                callback(code, desc ?: @"reject invatiaon failed");
            }
        }];
    }
}

#pragma mark status
- (BOOL)isEnterRoom {
	return self.mIsEnterRoom;
}

- (nullable TUIRoomInfo *)getRoomInfo {
    return self.roomInfo;
}

- (void)releaseResources {
	[[V2TIMManager sharedInstance] removeSignalingListener:self];
	[[V2TIMManager sharedInstance] removeGroupListener:self];
}

- (void)dealloc {
    NSLog(@"dealloc %@",NSStringFromClass([self class]));
}

#pragma mark private function
- (void)cleanRoomInfo {
	self.mIsEnterRoom = NO;
	self.mRoomId = @"";
    self.roomInfo = nil;
}

- (void)unInitIMListener {
    [[V2TIMManager sharedInstance] setGroupListener:nil];
    [[V2TIMManager sharedInstance] removeSignalingListener:self];
    [[V2TIMManager sharedInstance] removeSimpleMsgListener:self];
}

- (void)memberList:(NSInteger)nextSeq callback:(TUIRoomUserListCallback)callback {
    __weak typeof(self) wealSelf = self;
    [[V2TIMManager sharedInstance] getGroupMemberList:self.mRoomId
                                               filter:V2TIM_GROUP_MEMBER_FILTER_ALL
                                              nextSeq:0 succ:^(uint64_t nextSeq,
                                                               NSArray<V2TIMGroupMemberFullInfo *> *memberList) {
        __strong typeof(wealSelf) strongSelf = wealSelf;
        if (memberList) {
            [memberList enumerateObjectsUsingBlock:^(V2TIMGroupMemberFullInfo * _Nonnull obj,
                                                     NSUInteger idx,
                                                     BOOL * _Nonnull stop) {
                TUIRoomUserInfo *userInfo = [[TUIRoomUserInfo alloc] init];
                userInfo.userId = obj.userID;
                userInfo.userName = obj.nickName;
                userInfo.userAvatar = obj.faceURL;
                if (obj.role == V2TIM_GROUP_MEMBER_ROLE_SUPER) {
                    userInfo.role = TUIRoomMaster;
                } else {
                    userInfo.role = TUIRoomAudience;
                }
                [TUIRoomUserManage cacheUser:userInfo];
            }];
            if (nextSeq == 0) {
                if (callback) {
                    callback(0,
                             @"get member list success.",
                             [TUIRoomUserManage userList]);
                }
            } else {
                [strongSelf memberList:nextSeq callback:callback];
            }
        } else {
            if (callback) {
                callback(TUIRoomErrorGetRoomMemberFailed,
                         @"get member list fail, results is nil",
                         [TUIRoomUserManage userList]);
            }
        }
    } fail:^(int code, NSString *desc) {
        if (callback) {
            callback(code,
                     desc ?: @"get member list fail.",
                     [TUIRoomUserManage userList]);
        }
    }];
}

- (void)inviteGroup:(NSString *)roomid
        inviteeList:(NSArray *)inviteeList
              param:(NSDictionary<NSString *,id> *)param
           callback:(TUIRoomInviteeCallback)callback {
	NSString *data = [param mj_JSONString];
    NSString *inviteID = @"";
    __weak typeof(self) wealSelf = self;
    inviteID = [[V2TIMManager sharedInstance] inviteInGroup:roomid
                                     inviteeList:inviteeList
                                            data:data
                                  onlineUserOnly:NO
                                         timeout:TUIROOM_SIGNALING_EXTRA_KEY_TIME_OUT
                                            succ:^{
                                                NSLog(@"inviteID :%@ send success",inviteID);
                                            } fail:^(int code, NSString *desc) {
                                                __strong typeof(wealSelf) strongSelf = wealSelf;
                                                if (inviteID) {
                                                    [strongSelf.inviteBlockCache removeObjectForKey:inviteID];
                                                }
                                                if (callback) {
                                                    callback(TUIRoomInviteeFailed,desc);
                                                }
                                            }];
}

- (void)inviteUser:(NSString *)userId
             param:(NSDictionary<NSString *,id> *)param
          callback:(TUIRoomInviteeCallback)callback {
    NSString *data = [param mj_JSONString];
    NSString *inviteID = @"";
    __weak typeof(self) wealSelf = self;
    inviteID = [[V2TIMManager sharedInstance] invite:userId
                                                data:data
                                      onlineUserOnly:NO
                                     offlinePushInfo:nil
                                             timeout:TUIROOM_SIGNALING_EXTRA_KEY_TIME_OUT
                                                succ:^{
                                                    NSLog(@"inviteID :%@ send success",inviteID);
                                                }
                                                fail:^(int code, NSString *desc) {
                                                    __strong typeof(wealSelf) strongSelf = wealSelf;
                                                    if (inviteID) {
                                                        [strongSelf.inviteBlockCache removeObjectForKey:inviteID];
                                                    }
                                                    if (callback) {
                                                        callback(TUIRoomInviteeFailed,desc);
                                                    }
                                                }];
    if (callback && inviteID) {
        [self.inviteBlockCache setObject:callback forKey:inviteID];
    }
}


- (void)invitationCallback:(TUIRoomInviteeCallBackType)type
                  inviteID:(NSString *)inviteID{
    if (inviteID) {
        TUIRoomInviteeCallback callback = [self.inviteBlockCache objectForKey:inviteID];
        if (callback) {
            callback(type,@"");
        }
        [self.inviteBlockCache removeObjectForKey:inviteID];
    }
}

#pragma mark - V2TIMGroupListener
- (void)onMemberEnter:(NSString *)groupID
           memberList:(NSArray<V2TIMGroupMemberInfo *>*)memberList {
    if (groupID && [self.mRoomId isEqualToString:groupID]) {
        [memberList enumerateObjectsUsingBlock:^(V2TIMGroupMemberInfo * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
            TUIRoomUserInfo *userInfo = [[TUIRoomUserInfo alloc] init];
            userInfo.userId = obj.userID;
            userInfo.userName = obj.nickName;
            userInfo.userAvatar = obj.faceURL;
            if ([userInfo.userId isEqualToString:self.roomInfo.ownerId]) {
                userInfo.role = TUIRoomMaster;
            } else {
                userInfo.role = TUIRoomAudience;
            }
            [TUIRoomUserManage cacheUser:userInfo];
            if ([self.delegate respondsToSelector:@selector(onUserEnterIMRoom:)]) {
                [self.delegate onUserEnterIMRoom:userInfo];
            }
        }];
    }
    
}

- (void)onMemberLeave:(NSString *)groupID
               member:(V2TIMGroupMemberInfo *)member {
    TUIRoomUserInfo *userInfo = [TUIRoomUserManage getUser:member.userID];
    if (groupID && [self.mRoomId isEqualToString:groupID] && userInfo) {
        if ([self.delegate respondsToSelector:@selector(onUserLeaveIMRoom:)]) {
            [self.delegate onUserLeaveIMRoom:userInfo];
            [TUIRoomUserManage removeUser:member.userID];
        }
    }
}

- (void)onGroupDismissed:(NSString *)groupID
                  opUser:(V2TIMGroupMemberInfo *)opUser {
    if (groupID && [self.mRoomId isEqualToString:groupID]) {
        [self unInitIMListener];
        [self cleanRoomInfo];
        if ([self.delegate respondsToSelector:@selector(onRoomDestroy)]) {
            [self.delegate onRoomDestroy];
        }
    }
}

- (void)onGroupInfoChanged:(NSString *)groupID
            changeInfoList:(NSArray <V2TIMGroupChangeInfo *> *)changeInfoList {
    if (groupID && [self.mRoomId isEqualToString:groupID]) {
        __weak typeof(self) wealSelf = self;
        [changeInfoList enumerateObjectsUsingBlock:^(V2TIMGroupChangeInfo * _Nonnull obj,
                                                     NSUInteger idx,
                                                     BOOL * _Nonnull stop) {
            TRTCLog(@"on group info changed (roomId=%@ type=%d value=%@)",self.mRoomId,obj.type,obj.value);
            __strong typeof(wealSelf) strongSelf = wealSelf;
            if (obj.type == V2TIM_GROUP_INFO_CHANGE_TYPE_NOTIFICATION) {///< 群公告修改
                NSDictionary* dic = [obj.value mj_JSONObject];
                if ([dic isKindOfClass:[NSDictionary class]]) {
                    if (![strongSelf.delegate respondsToSelector:@selector(onGroupNotificationChange:type:status:)]) {
                        return;
                    }
                    TUIRoomSignalingType type = TUIRoomSignalingUnknown;
                    BOOL status = NO;
                    if ([[dic objectForKey:TUIROOM_SIGNALING_KEY_IS_CHAT_ROOM_MUTED] boolValue]
                        != strongSelf.roomInfo.isChatRoomMuted) {
                        type = TUIRoomSignalingMuteRoomChat;
                        strongSelf.roomInfo.isChatRoomMuted = !strongSelf.roomInfo.isChatRoomMuted;
                        status = strongSelf.roomInfo.isChatRoomMuted;
                        [strongSelf.delegate onGroupNotificationChange:strongSelf.roomInfo type:type status:status];
                    }
                    if ([[dic objectForKey:TUIROOM_SIGNALING_KEY_IS_SPEECH_APPLICATION_FORBIDDEN] boolValue]
                        != strongSelf.roomInfo.isSpeechApplicationForbidden) {
                        type = TUIRoomSignalingForbidStage;
                        strongSelf.roomInfo.isSpeechApplicationForbidden = !strongSelf.roomInfo.isSpeechApplicationForbidden;
                        status = strongSelf.roomInfo.isSpeechApplicationForbidden;
                        [strongSelf.delegate onGroupNotificationChange:strongSelf.roomInfo type:type status:status];
                    }
                    if ([[dic objectForKey:TUIROOM_SIGNALING_KEY_IS_ALL_CAMERA_MUTED] boolValue]
                        != strongSelf.roomInfo.isAllCameraMuted) {
                        type = TUIRoomSignalingMuteAllCamera;
                        strongSelf.roomInfo.isAllCameraMuted = !strongSelf.roomInfo.isAllCameraMuted;
                        status = strongSelf.roomInfo.isAllCameraMuted;
                        [strongSelf.delegate onGroupNotificationChange:strongSelf.roomInfo type:type status:status];
                    }
                    if ([[dic objectForKey:TUIROOM_SIGNALING_KEY_IS_ALL_MIC_MUTED] boolValue]
                        != strongSelf.roomInfo.isAllMicMuted) {
                        type = TUIRoomSignalingMuteAllMic;
                        strongSelf.roomInfo.isAllMicMuted = !strongSelf.roomInfo.isAllMicMuted;
                        status = strongSelf.roomInfo.isAllMicMuted;
                        [strongSelf.delegate onGroupNotificationChange:strongSelf.roomInfo type:type status:status];
                    }
                    if ([[dic objectForKey:TUIROOM_SIGNALING_KEY_IS_CALLING_ROLL] boolValue]
                        != strongSelf.roomInfo.isCallingRoll) {
                        type = TUIRoomSignalingCallingRoll;
                        strongSelf.roomInfo.isCallingRoll = !strongSelf.roomInfo.isCallingRoll;
                        status = strongSelf.roomInfo.isCallingRoll;
                        [strongSelf.delegate onGroupNotificationChange:strongSelf.roomInfo type:type status:status];
                    }
                    if ([[dic objectForKey:TUIROOM_SIGNALING_KEY_START_TIME] intValue]
                        != strongSelf.roomInfo.startTime) {
                        type = TUIRoomSignalingStartTime;
                        strongSelf.roomInfo.startTime = [[dic objectForKey:TUIROOM_SIGNALING_KEY_START_TIME] intValue];
                        [strongSelf.delegate onGroupNotificationChange:strongSelf.roomInfo type:type status:status];
                    }
                }
            } else if (obj.type == V2TIM_GROUP_INFO_CHANGE_TYPE_OWNER) {///< 群主变更
                if ([strongSelf.delegate respondsToSelector:@selector(onRoomMasterChanged:currentUserId:)]) {
                    NSString *previousUserId = self.roomInfo.ownerId;
                    self.roomInfo.ownerId = obj.value;
                    TUIRoomUserInfo *masterInfo = [TUIRoomUserManage getUser:obj.value];
                    masterInfo.role = TUIRoomMaster;
                    [strongSelf.delegate onRoomMasterChanged:previousUserId currentUserId:obj.value];
                }
            }
        }];
    }
}

#pragma mark - V2TIMSignalingListener
- (void)onReceiveNewInvitation:(NSString *)inviteID
                      inviter:(NSString *)inviter
                      groupID:(NSString *)groupID
                  inviteeList:(NSArray<NSString *> *)inviteeList
                         data:(NSString * __nullable)data {

    NSString* jsonString = data ?: @"";
    NSDictionary* dic = [jsonString mj_JSONObject]?:@{};
    if (![dic isKindOfClass:[NSDictionary class]]) {
        return;
    }
    NSString *businessID = dic[TUIROOM_SIGNALING_KEY_BUSINESS_ID];
    if (![businessID isKindOfClass:[NSString class]] || ![businessID isEqualToString:TUIROOM_DATA_BUSINESS_ID]) {
        return;
    }

    NSDictionary *dicData = dic[TUIROOM_SIGNALING_KEY_DATA];
    if (![dicData isKindOfClass:[NSDictionary class]] || !dicData.count) {
        return;
    }
    NSString *cmd = dicData[TUIROOM_SIGNALING_KEY_CMD];
    if ([self.delegate respondsToSelector:@selector(onInviteNotification:inviter:type:mute:)] && cmd && _signalingMap) {
        [self.delegate onInviteNotification:inviteID
                                    inviter:inviter
                                       type:[_signalingMap[cmd] intValue]
                                       mute:[dicData[TUIROOM_SIGNALING_KEY_MUTE]boolValue]];
    }
}

- (void)onInviteeAccepted:(NSString *)inviteID
                  invitee:(NSString *)invitee
                     data:(NSString * __nullable)data {
    [self invitationCallback:TUIRoomInviteeAccepted inviteID:inviteID];
}

- (void)onInviteeRejected:(NSString *)inviteID
                  invitee:(NSString *)invitee
                     data:(NSString * __nullable)data {
    [self invitationCallback:TUIRoomInviteeRejected inviteID:inviteID];
}

- (void)onInvitationCancelled:(NSString *)inviteID
                      inviter:(NSString *)inviter
                         data:(NSString * __nullable)data {
    NSString* jsonString = data ?: @"";
    NSDictionary* dic = [jsonString mj_JSONObject]?:@{};
    if (![dic isKindOfClass:[NSDictionary class]]) {
        return;
    }
    NSString *businessID = dic[TUIROOM_SIGNALING_KEY_BUSINESS_ID];
    if (![businessID isKindOfClass:[NSString class]] || ![businessID isEqualToString:TUIROOM_DATA_BUSINESS_ID]) {
        return;
    }

    NSDictionary *dicData = dic[TUIROOM_SIGNALING_KEY_DATA];
    if (![dicData isKindOfClass:[NSDictionary class]] || !dicData.count) {
        return;
    }
    NSString *cmd = dicData[TUIROOM_SIGNALING_KEY_CMD];
    if ([self.delegate respondsToSelector:@selector(onCancelInviteNotification:inviter:type:)] && cmd && _signalingMap) {
        [self.delegate onCancelInviteNotification:inviteID inviter:inviter type:[_signalingMap[cmd] intValue]];
    }

    [self invitationCallback:TUIRoomInviteeCancelled inviteID:inviteID];
}

- (void)onInvitationTimeout:(NSString *)inviteID
                inviteeList:(NSArray<NSString *> *)inviteeList {
    [self invitationCallback:TUIRoomInviteeTimeout inviteID:inviteID];
}

#pragma mark - V2TIMSimpleMsgListener
- (void)onRecvGroupTextMessage:(NSString *)msgID
                       groupID:(NSString *)groupID
                        sender:(V2TIMGroupMemberInfo *)info
                          text:(NSString *)text {
    if (groupID && [self.mRoomId isEqualToString:groupID]) {
        if ([self.delegate respondsToSelector:@selector(onRecvGroupTextMessage:message:)]) {
            [self.delegate onRecvGroupTextMessage:info.userID message:text];
        }
    }
}

@end
