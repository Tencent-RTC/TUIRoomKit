//
//  TUIRoomCore.m
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "TUIRoomCore.h"
#import "TUIRoomIMService.h"
#import "TUIRoomTRTCService.h"
#import <TUICore/TUILogin.h>

@interface TUIRoomCore ()<TUIRoomIMServiceDelegate,TUIRoomTRTCServiceDelegate>
{
    BOOL _isScreenCapture;
}

/// 代理
@property(nonatomic, weak) id<TUIRoomCoreDelegate> delegate;
/// im服务
@property (nonatomic, strong) TUIRoomIMService *imService;
/// trtc服务
@property (nonatomic, strong) TUIRoomTRTCService *trtcService;
/// 邀请缓存
@property (nonatomic, strong) NSCache *inviteCache;

@end

@implementation TUIRoomCore

static TUIRoomCore *gInstance = nil;
static dispatch_once_t gOnceToken;

/**
 * 获取 TUIRoom 单例对象
 *
 * @return 返回 TUIRoomCore 单例对象，需要调用 destroyInstance 释放单例对象。
 */
+ (instancetype)shareInstance {
	dispatch_once(&gOnceToken, ^{
        gInstance = [[TUIRoomCore alloc] init];
	});
	return gInstance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        [TUIRoomUserManage clearCache];
        self.imService = [[TUIRoomIMService alloc]init];
        self.imService.delegate = self;
        self.trtcService = [[TUIRoomTRTCService alloc]init];
        self.trtcService.delegate = self;
        _isScreenCapture = NO;
        self.inviteCache = [[NSCache alloc] init];
    }
    return self;
}

/**
 * 销毁 TUIRoom 单例对象
 */
+ (void)destroyInstance {
	gInstance = nil;
    gOnceToken = 0;
    [[TRTCCloud sharedInstance] stopScreenCapture];
    [[TRTCCloud sharedInstance] exitRoom];
    [TRTCCloud destroySharedIntance];
    [TUIRoomUserManage destroyInstance];
}

/**
 * 设置组件回调接口
 *
 * 您可以通过 TUIRoomCoreDelegate 获得各种状态通知
 *
 * @param delegate 回调接口
 * @note TUIRoom 中的事件，默认是在 Main Thread 中回调给您
 */
- (void)setDelegate:(id<TUIRoomCoreDelegate>)delegate {
    _delegate = delegate;
}

/**
 * 创建房间（主持人调用）
 *
 * @param roomId     房间标识，需要由您分配并进行统一管理
 * @param speechMode 发言模式
 * @param callback   创建房间的结果回调，成功时 code 为0
 */
- (void)createRoom:(NSString *)roomId
        speechMode:(TUIRoomSpeechMode)speechMode
          callback:(TUIRoomActionCallback)callback {
    if ([TUILogin getUserID].length <= 0) {
        if (callback) {
            callback(TUIRoomErrorCreateRoomFailed,@"no login");
        }
        return;
    }
    if (roomId && (speechMode != TUIRoomUnknownSpeech)) {
        TUIRoomInfo *roomInfo = [[TUIRoomInfo alloc]init];
        roomInfo.ownerId = [TUIRoomUserManage currentUserId];
        roomInfo.speechMode = (speechMode == TUIRoomFreeSpeech) ? TUIROOM_DATA_FREE_SPEECH : TUIROOM_DATA_APPLY_SPEECH;
        roomInfo.roomId = [TUIROOM_PREFIX_ID stringByAppendingString:roomId];
        roomInfo.roomName = roomId;
        __weak typeof(self) wealSelf = self;
        [self.imService createRoom:roomInfo
                          callback:^(NSInteger code, NSString * _Nonnull message) {
            __strong typeof(wealSelf) strongSelf = wealSelf;
            if (code == TUIRoomSuccessCode) {
                TRTCLog(@"im create room success");
                [strongSelf.trtcService enterRTCRoom:[strongSelf.imService getRoomInfo] callback:callback];
            } else {
                if (callback) {
                    callback(TUIRoomErrorCreateRoomFailed,@"create room failed.");
                }
                TRTCLog(@"im create room failed (code=%d message=%@)",code,message);
            }
        }];
    } else {
        if (callback) {
            callback(TUIRoomErrorCreateRoomFailed,@"create room failed.");
        }
        TRTCLog(@"im create room failed message:Invalid parameter(roomId=%@ speechMode=%d)",roomId,speechMode);
    }
}

/**
 * 销毁房间（主持人调用）
 *
 * 主持人在创建房间后，可以调用这个函数来销毁房间
 *
 * 调用销毁房间接口后，其它成员会收到来自TUIRoomCoreListener的onDestroyRoom()回调通知
 *
 * @param callback 销毁房间的结果回调，成功时 code 为0.
 */
- (void)destroyRoom:(TUIRoomActionCallback)callback {
    __weak typeof(self) wealSelf = self;
    [self.imService destroyRoom:^(NSInteger code, NSString * _Nonnull message) {
        __strong typeof(wealSelf) strongSelf = wealSelf;
        TRTCLog(@"im destroy room (code=%d message=%@)",code,message);
        if (code == TUIRoomSuccessCode) {
            [strongSelf.trtcService leaveRoom:nil];
        }
        if (callback) {
            callback(TUIRoomErrorDestoryRoomFailed,message);
        }
    }];
}

/**
 * 进入房间（进入房间成员调用）
 *
 * @param roomId   房间标识，需要由您分配并进行统一管理
 * @param callback 结果回调，成功时 code 为0
 */
- (void)enterRoom:(NSString *)roomId
         callback:(TUIRoomActionCallback)callback {
    if ([TUILogin getUserID].length <= 0) {
        if (callback) {
            callback(TUIRoomErrorEnterRoomFailed,@"no login");
        }
        return;
    }
    [self.imService enterRoom:[TUIROOM_PREFIX_ID stringByAppendingString:roomId]
                     callback:^(NSInteger code, NSString * _Nonnull message) {
        TRTCLog(@"im enter room (code=%d message=%@)",code,message);
        if (code == TUIRoomSuccessCode) {
            [self.trtcService enterRTCRoom:[self.imService getRoomInfo] callback:callback];
        } else {
            if (callback) {
                callback(TUIRoomErrorEnterRoomFailed,message);
            }
        }
    }];
}

/**
 * 离开房间（进入房间成员调用）
 *
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)leaveRoom:(TUIRoomActionCallback)callback {
    [self.trtcService leaveRoom:nil];
    [self.imService leaveRoom:callback];
}

/**
 * 获取房间信息
 * 该接口用于获取房间的ID、房间名称、发言模式以及开始时间等信息
 *
 * @return 返回房间信息
 */
- (nullable TUIRoomInfo *)getRoomInfo {
    return [self.imService getRoomInfo];
}

/**
 * 获取房间内所有成员信息
 *
 * 调用该接口可以获取房间内的成员列表信息
 *
 * @return 返回房间人员信息列表
 */
- (nullable NSArray<TUIRoomUserInfo *> *)getRoomUsers {
    return [self.imService getMemberList] ? : @[];
}

/**
 * 获取房间成员信息
 *
 * 调用该接口可以获取房间内指定userId的用户信息
 *
 * @param userId  用户id
 * @param callback  房间人员详细信息回调
 */
- (void)getUserInfo:(NSString *)userId
           callback:(TUIRoomUserInfoCallback)callback {
    TUIRoomUserInfo *userInfo = [TUIRoomUserManage getUser:userId];
    if (userInfo) {
        if (callback) {
            callback(TUIRoomSuccessCode,@"success",userInfo);
        }
    } else {
        [TUIRoomUserManage getUserInfo:userId callback:callback];
    }
}

/**
 * 将群转交给其他用户
 *
 * @param userId   转交的用户id
 * @param callback 结果回调，成功时 code 为0
 */
- (void)transferRoomMaster:(NSString *)userId
                  callback:(TUIRoomActionCallback)callback {
    [self.imService transferRoomMaster:userId callback:callback];
}

/**
 * 设置用户信息，您设置的用户信息会被存储于腾讯云 IM 云服务中。
 *
 * @param userName 用户昵称
 * @param avatarURL 用户头像
 * @param callback 是否设置成功的结果回调
 */
- (void)setSelfProfile:(NSString *)userName
             avatarURL:(NSString *)avatarURL
              callback:(TUIRoomActionCallback)callback {
    [self.imService setSelfProfile:userName avatarURL:avatarURL callback:callback];
}

/**
 * 开启本地视频的预览画面
 *
 * @param isFront true：前置摄像头；false：后置摄像头
 * @param view    承载视频画面的控件
 */
- (void)startCameraPreview:(BOOL)isFront
                      view:(UIView *)view {
    if (view) {
        [[TRTCCloud sharedInstance] startLocalPreview:isFront view:view];
    }
}

/**
 * 停止本地视频采集及预览
 */
- (void)stopCameraPreview {
    [[TRTCCloud sharedInstance] stopLocalPreview];
}

/**
 * 切换前后摄像头
 *
 * @param isFront YES：前置摄像头；NO：后置摄像头。
 */
- (void)switchCamera:(BOOL)isFront {
    [self.trtcService switchCamera:isFront];
}

/**
 * 设置开启扬声器
 *
 * @param isUseSpeaker YES：扬声器 NO：听筒
 */
- (void)setSpeaker:(BOOL)isUseSpeaker {
    [self.trtcService setSpeaker:isUseSpeaker];
}

/**
 * 设置本地画面镜像预览模式
 *
 * @param type 本地视频预览镜像类型
 */
- (void)setVideoMirror:(TRTCVideoMirrorType)type {
    [self.trtcService setLocalViewMirror:type];
}

/**
 * 开启麦克风采集
 *
 * @param quality 采集的声音音质 TRTC_AUDIO_QUALITY_MUSIC/TRTC_AUDIO_QUALITY_DEFAULT/TRTC_AUDIO_QUALITY_SPEECH
 */
- (void)startLocalAudio:(TRTCAudioQuality)quality {
    [[TRTCCloud sharedInstance] startLocalAudio:quality];
    [self.trtcService muteLocalAudio:NO];
}

/**
 * 停止麦克风采集
 */
- (void)stopLocalAudio {
    [self.trtcService muteLocalAudio:YES];
}

/**
 * 订阅远端用户的视频流
 *
 * @param userId   需要观看的用户id
 * @param view     承载视频画面的 view 控件
 * @param streamType     流类型
 * @param callback 操作回调
 */
- (void)startRemoteView:(NSString *)userId
                   view:(UIView *)view
             streamType:(TUIRoomStreamType)streamType
               callback:(TUIRoomActionCallback)callback {
    if (view && userId) {
        [self.trtcService startRemoteView:userId view:view type:streamType callback:callback];
    }
}

/**
 * 取消订阅远端用户的视频流
 *
 * @param userId 对方的用户信息
 * @param streamType 流类型
 * @param callback 操作回调
 *
 */
- (void)stopRemoteView:(NSString *)userId
            streamType:(TUIRoomStreamType)streamType
              callback:(TUIRoomActionCallback)callback {
    if (userId) {
        [self.trtcService stopRemoteView:userId type:streamType callback:callback];
    }
}

/**
 * 在房间中广播文本消息，一般用于文本聊天
 *
 * @param message  文本消息
 * @param callback 发送结果回调
 */
- (void)sendChatMessage:(NSString *)message
               callback:(TUIRoomActionCallback)callback {
    [self.imService sendChatMessage:message callback:callback];
}

/**
 * 禁用/恢复某用户的麦克风
 * 调用该接口，主持人禁用/恢复成员麦克风，成员端回收到onMicrophoneMuted()回调。
 *
 * @param userId   用户id
 * @param mute     YES：禁用房间用户麦克风；NO：恢复用户麦克风
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)muteUserMicrophone:(NSString *)userId
                      mute:(BOOL)mute
                  callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService onInviteUser:userId
                           param:[TUIRoomIMProtocol muteMicrophone:roomInfo.roomId receiverId:userId mute:mute]
                        callback:^(TUIRoomInviteeCallBackType type, NSString * _Nonnull message) {
        if (type == TUIRoomInviteeAccepted) {
            if (callback) {
                callback(TUIRoomSuccessCode,@"");
            }
        } else {
            if (callback) {
                callback(TUIRoomErrorReplyRollCallFailed,message?:@"failed");
            }
        }
    }];
}

/**
 * 禁用/恢复所有用户的麦克风，并且状态会同步到房间信息中
 * 调用该接口，主持人禁用/恢复所有成员麦克风，成员端回收到onMicrophoneMuted()回调
 *
 * @param mute     YES：禁用所有用户麦克风；NO：恢复所有用户麦克风
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)muteAllUsersMicrophone:(BOOL)mute
                      callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isAllMicMuted = mute;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

/**
 * 禁用/恢复某用户的摄像头
 *
 * 调用该接口，主持人禁用/恢复成员摄像头，成员端回收到onCameraMuted回调
 *
 * @param userId   用户id
 * @param mute     true：禁用房间用户摄像头；false：恢复用户ID为user_id的用户摄像头
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)muteUserCamera:(NSString *)userId
                  mute:(BOOL)mute
              callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService onInviteUser:userId
                           param:[TUIRoomIMProtocol muteCamera:roomInfo.roomId receiverId:userId mute:mute]
                        callback:^(TUIRoomInviteeCallBackType type, NSString * _Nonnull message) {
        if (type == TUIRoomInviteeAccepted) {
            if (callback) {
                callback(TUIRoomSuccessCode,@"");
            }
        } else {
            if (callback) {
                callback(TUIRoomErrorReplyRollCallFailed,message?:@"failed");
            }
        }
    }];
}

/**
 * 禁用/恢复所有用户的摄像头，并且状态会同步到房间信息中
 * 调用该接口，主持人禁用/恢复所有成员麦克风，成员端回收到onCameraMuted回调
 *
 * @param mute     true：禁用所有用户摄像头；false：恢复所有用户摄像头
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)muteAllUsersCamera:(BOOL)mute
                  callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isAllCameraMuted = mute;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

/**
 * 禁言/恢复文字聊天
 *
 * 调用该接口，主持人可以禁言/恢复房间内IM聊天
 * @param mute  mute true：禁言；false：恢复禁言。
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)muteChatRoom:(BOOL)mute
            callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isChatRoomMuted = mute;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

/**
 * 主持人踢人
 *
 * 调用该接口，主持人踢人
 * @param userId 用户ID。
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)kickOffUser:(NSString *)userId
           callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService onInviteUser:userId
                           param:[TUIRoomIMProtocol
                                  kickOffUser:roomInfo.roomId receiverId:userId]
                        callback:^(TUIRoomInviteeCallBackType type, NSString * _Nonnull message) {
        if (type == TUIRoomInviteeAccepted) {
            if (callback) {
                callback(TUIRoomSuccessCode,@"");
            }
        } else {
            if (callback) {
                callback(TUIRoomErrorKickOffUserFailed,message?:@"failed");
            }
        }
    }];
}

/**
 * 主持人开始点名
 *
 * @param callback 结果回调，成功时 code 为0
 * @note 主持人开始点名，成员端会收到onCallingRollStarted()回调
 */
- (void)startCallingRoll:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isCallingRoll = YES;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

/**
 * 主持人结束点名
 *
 * @param callback 结果回调，成功时 code 为0
 * @note 主持人结束点名，成员端会收到onCallingRollStopped()回调
 */
- (void)stopCallingRoll:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isCallingRoll = NO;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

/**
 * 成员回复主持人点名
 *
 * @param callback 结果回调，成功时 code 为0
 * @note 成员回复主持人点名，主持人会收到onMemberReplyCallingRoll()回调
 */
- (void)replyCallingRoll:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService onInviteUser:roomInfo.ownerId
                           param:[TUIRoomIMProtocol
                                  replyCallingRoll:roomInfo.roomId
                                  senderId:[TUIRoomUserManage currentUserId]]
                        callback:^(TUIRoomInviteeCallBackType type, NSString * _Nonnull message) {
        if (type == TUIRoomInviteeAccepted) {
            if (callback) {
                callback(TUIRoomSuccessCode,@"");
            }
        } else {
            if (callback) {
                callback(TUIRoomErrorReplyRollCallFailed,message?:@"failed");
            }
        }
    }];
}

/**
 * 主持人邀请成员发言
 *
 * 调用该接口，主持人邀请成员发言，成员端会收到onReceiveSpeechInvitation()回调通知
 *
 * @param userId   用户ID
 * @param callback 结果回调，成功时 code 为0
 */
- (void)sendSpeechInvitation:(NSString *)userId
                    callback:(TUIRoomInviteeCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService sendSpeechInvitation:userId
                                   param:[TUIRoomIMProtocol inviteSpeaker:roomInfo.roomId receiverId:userId]
                                callback:callback];
}

/**
 * 主持人取消邀请成员发言
 *
 * 调用该接口，主持人取消邀请成员发言，成员端会收到onReceiveInvitationCancelled()回调通知
 *
 * @param userId   用户ID
 * @param callback 结果回调，成功时 code 为0
 */
- (void)cancelSpeechInvitation:(NSString *)userId
                      callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService cancelSpeechInvitation:userId
                                     param:[TUIRoomIMProtocol inviteSpeaker:roomInfo.roomId receiverId:userId]
                                  callback:callback];
}

/**
 * 成员同意/拒绝主持人的申请发言
 *
 * 在TUIRoomCoreDef.SpeechMode.APPLY_SPEECH模式，成员同意/拒绝主持人邀请发言需要调用此接口
 * 主持人会收到onReceiveReplyToSpeechInvitation回调通知
 *
 * @param agree    YES：同意；NO：拒绝
 * @param callback 结果回调，成功时 code 为0
 */
- (void)replySpeechInvitation:(BOOL)agree
                     callback:(TUIRoomActionCallback)callback {
    NSString *currentUserId = [TUIRoomUserManage currentUserId];
    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_INVITE_SPEAKER stringByAppendingString:currentUserId];
    NSString *inviteID = [self.inviteCache objectForKey:key];
    if (inviteID) {
        [self.inviteCache removeObjectForKey:key];
        [self.imService acceptInvitation:agree inviteID:inviteID callback:callback];
    } else {
        if (callback) {
            callback(TUIRoomErrorParamInvalid,agree ? @"accept invatiaon failed":@"reject invatiaon failed");
        }
    }
}

/**
 * 成员申请发言
 *
 * 调用该接口，成员申请发言，主持人端会收到onReceiveSpeechApplication回调通知
 *
 * @param callback 结果回调，成功时 code 为0
 */
- (void)sendSpeechApplication:(TUIRoomInviteeCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService sendSpeechApplication:roomInfo.ownerId
                                    param:[TUIRoomIMProtocol applyForSpeech:roomInfo.roomId receiverId:roomInfo.ownerId]
                                 callback:callback];
}

/**
 * 成员取消申请发言
 *
 * 调用该接口，成员取消申请发言，主持人端会收到onSpeechApplicationCancelled回调通知
 * @param callback 结果回调，成功时 code 为0
 */
- (void)cancelSpeechApplication:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService cancelSpeechApplication:[TUIRoomIMProtocol applyForSpeech:roomInfo.roomId receiverId:roomInfo.ownerId] callback:callback];
}

/**
 * 主持人同意/拒绝成员的申请发言
 *
 * 在TUIRoomCoreDef.SpeechMode.APPLY_SPEECH模式，主持人同意/拒绝成员的申请需要调用此接口
 *
 * @param agree    YES：同意；NO：拒绝
 * @param userId   用户ID
 * @param callback 结果回调，成功时 code 为0
 */
- (void)replySpeechApplication:(BOOL)agree
                        userId:(NSString *)userId
                      callback:(TUIRoomActionCallback)callback {
    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_APPLY_FOR_SPEECH stringByAppendingString:userId];
    NSString *inviteID = [self.inviteCache objectForKey:key];
    if (inviteID) {
        [self.inviteCache removeObjectForKey:key];
        [self.imService acceptInvitation:agree inviteID:userId callback:callback];
    } else {
        if (callback) {
            callback(TUIRoomErrorParamInvalid,agree ? @"accept invatiaon failed":@"reject invatiaon failed");
        }
    }
}

/**
 * 主持人禁止申请发言
 *
 * @param forbid YES：禁止申请；NO：取消禁止
 * @param callback 结果回调，成功时 code 为0
 * @note 主持人禁止申请发言，成员端会收到onSpeechApplicationForbidden回调
 */
- (void)forbidSpeechApplication:(BOOL)forbid
                       callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isSpeechApplicationForbidden = forbid;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

/**
 * 主持人令成员下麦
 *
 * @param  userId 用户ID。
 * @param callback 结果回调
 * @note 调用该接口，主持人邀请成员下麦，成员端会收到onOrderedToExitSpeechState()回调通知。
 *
 */
- (void)sendOffSpeaker:(NSString *)userId
              callback:(TUIRoomInviteeCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService onInviteUser:userId
                           param:[TUIRoomIMProtocol sendOffSpeaker:roomInfo.roomId receiverId:userId]
                        callback:callback];
}

/**
 * 主持人令全体下麦
 *
 * @param callback 结果回调
 * @note 调用该接口，主持人邀请成员下麦，成员端会收到onOrderedToExitSpeechState()回调通知。
 */
- (void)sendOffAllSpeakers:(TUIRoomInviteeCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService onInviteGroup:roomInfo.roomId
                      inviteeList:[TUIRoomUserManage speechUserIdList]
                            param:[TUIRoomIMProtocol sendOffAllSpeaker:roomInfo.roomId]
                         callback:callback];
}

/**
 * 成员下麦,转变为观众
 * 如果成员在发言，调用该接口，则下麦，转变为观众
 *
 * @param callback 结果回调
 */
- (void)exitSpeechState:(TUIRoomActionCallback)callback {
    [self.trtcService switchToAudience:callback];
}

/**
 * 启动屏幕分享
 *
 * 手机的屏幕分享的推荐配置参数：
 * - 分辨率(videoResolution)：1280 x 720
 * - 帧率(videoFps)：10 FPS
 * - 码率(videoBitrate)：1200 kbps
 * - 分辨率自适应(enableAdjustRes)：false
 *
 * @param encParam 设置屏幕分享时的编码参数，推荐采用上述推荐配置，如果您指定 encParams 为 null，则使用您调用 startScreenCapture 之前的编码参数设置。
 */
- (void)startScreenCapture:(TRTCVideoEncParam *)encParam {
    [[TRTCCloud sharedInstance]
     startScreenCaptureByReplaykit:TRTCVideoStreamTypeSub
     encParam:encParam
     appGroup:@"com.tencent.TUIRoomTXReplayKit-Screen"];
}

/**
 * 停止屏幕采集
 */
- (void)stopScreenCapture  {
    if (_isScreenCapture) {
        _isScreenCapture = NO;
        [[TRTCCloud sharedInstance] stopScreenCapture];
    }
}

/**
 * 获取美颜管理对象
 *
 * 通过美颜管理，您可以使用以下功能：
 * - 设置"磨皮"、“美白”、“红润”等美颜特效。
 * - 设置“大眼”、“瘦脸”、“V脸”、“下巴”、“短脸”、“小鼻”、“亮眼”、“白牙”、“祛眼袋”、“祛皱纹”、“祛法令纹”等修脸特效。
 * - 设置“发际线”、“眼间距”、“眼角”、“嘴形”、“鼻翼”、“鼻子位置”、“嘴唇厚度”、“脸型”等修脸特效。
 * - 设置"眼影"、“腮红”等美妆特效。
 * - 设置动态贴纸和人脸挂件等动画特效。
 * @return TXBeautyManager
 */
- (TXBeautyManager *)getBeautyManager {
    return [[TRTCCloud sharedInstance] getBeautyManager];
}

/**
 * 设置网络qos参数
 *
 * @param preference 网络流控相关参数
 */
- (void)setVideoQosPreference:(TRTCNetworkQosParam *)preference {
    [self.trtcService setVideoQosPreference:preference];
}

/**
 * 设置麦克风采集音量
 *
 * @param volume 采集音量 0-100
 */
- (void)setAudioCaptureVolume:(NSInteger)volume {
    [[TRTCCloud sharedInstance] setAudioCaptureVolume:volume];
}

/**
 * 设置音质
 *
 * @param quality 音质
 */
- (void)setAudioQuality:(TRTCAudioQuality)quality {
    [self.trtcService setAudioQuality:quality];
}

/**
 * 设置播放音量
 *
 * @param volume 播放音量 0-100
 */
- (void)setAudioPlayVolume:(NSInteger)volume {
    [[TRTCCloud sharedInstance] setAudioPlayoutVolume:volume];
}

/**
 * 开始录音
 *
 * 该方法调用后， SDK 会将通话过程中的所有音频（包括本地音频，远端音频，BGM 等）录制到一个文件里。
 * 无论是否进房，调用该接口都生效。
 * 如果调用 exitMeeting 时还在录音，录音会自动停止。
 * @param params 录音参数
 */
- (void)startFileDumping:(TRTCAudioRecordingParams *)params {
    [[TRTCCloud sharedInstance] startAudioRecording:params];
}

/**
 * 停止录音
 *
 * 如果调用 exitMeeting 时还在录音，录音会自动停止。
 */
- (void)stopFileDumping {
    [[TRTCCloud sharedInstance] stopAudioRecording];
}

/**
 * 启用音量大小提示
 *
 * 开启后会在 onUserVolumeUpdate 中获取到 SDK 对音量大小值的评估。
 * @param enable true：打开  false：关闭
 */
- (void)enableAudioEvaluation:(BOOL)enable {
    [[TRTCCloud sharedInstance] enableAudioVolumeEvaluation:enable ? 300 : 0];
}

/**
 * 设置分辨率
 *
 * @param resolution 视频分辨率
 */
- (void)setVideoResolution:(TRTCVideoResolution)resolution {
    [self.trtcService setVideoResolution:resolution];
}

/**
 * 设置帧率
 *
 * @param fps 帧率数
 */
- (void)setVideoFps:(int)fps {
    [self.trtcService setVideoFps:fps];
}

/**
 * 设置码率
 *
 * @param bitrate 码率，单位：kbps
 */
- (void)setVideoBitrate:(int)bitrate {
    [self.trtcService setVideoBitrate:bitrate];
}

/**
 * 获取 SDK 版本接口函数
 * @return SDK版本号
 */
- (NSInteger)getSdkVersion {
    return 1;
}

- (void)dealloc {
    [self.trtcService releaseResources];
    [self.imService releaseResources];
    NSLog(@"dealloc %@",NSStringFromClass([self class]));
}

#pragma mark TUIRoomIMServiceDelegate

/**
 * 被邀请回调
 *
 * @param inviteID 邀请ID
 * @param inviter 邀请者
 * @param type 信令类型
 * @param mute 是否禁用yes/no
*/
- (void)onInviteNotification:(NSString *)inviteID
                     inviter:(NSString *)inviter
                        type:(TUIRoomSignalingType)type
                        mute:(BOOL)mute {
    
    TRTCLog(@"on invite notification (inviteID=%@ inviter=%@ type=%d mute=%d)",inviteID ,inviter,type,mute);
    switch (type) {
        case TUIRoomSignalingInviteSpeaker: {// 主持人邀请观众发言
                if ([self.delegate respondsToSelector:@selector(onReceiveSpeechInvitation:)]) {
                    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_INVITE_SPEAKER stringByAppendingString:[TUIRoomUserManage currentUserId]];
                    [self.inviteCache setObject:inviteID forKey:key];
                    [self.delegate onReceiveSpeechInvitation:inviter];
                }
            }
            break;
        case TUIRoomSignalingSendOffSpeaker: {// 主持人邀请观众下台
                if ([self.delegate respondsToSelector:@selector(onOrderedToExitSpeechState:)]) {
                    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_SEND_OFF_SPEAKER stringByAppendingString:[TUIRoomUserManage currentUserId]];
                    [self.inviteCache setObject:inviteID forKey:key];
                    [self.delegate onOrderedToExitSpeechState:inviter];
                }
            }
            break;
        case TUIRoomSignalingApplyForSpeech: {// 观众申请发言
                if ([self.delegate respondsToSelector:@selector(onReceiveSpeechApplication:)]) {
                    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_APPLY_FOR_SPEECH stringByAppendingString:[TUIRoomUserManage currentUserId]];
                    [self.inviteCache setObject:inviteID forKey:key];
                    [self.delegate onReceiveSpeechApplication:inviter];
                }
            }
            break;
        case TUIRoomSignalingMuteMicrophone: {// 主持人禁用观众麦克风
                __weak typeof(self) wealSelf = self;
                [self.imService acceptInvitation:YES inviteID:inviteID callback:^(NSInteger code, NSString * _Nonnull message) {
                    __strong typeof(wealSelf) strongSelf = wealSelf;
                    if ([self.delegate respondsToSelector:@selector(onMicrophoneMuted:userId:)]) {
                        [strongSelf.delegate onMicrophoneMuted:mute userId:inviter];
                    }
                }];
            }
            break;
        case TUIRoomSignalingMuteCamera: {// 主持人禁用观众摄像头
                __weak typeof(self) wealSelf = self;
                [self.imService acceptInvitation:YES inviteID:inviteID callback:^(NSInteger code, NSString * _Nonnull message) {
                    __strong typeof(wealSelf) strongSelf = wealSelf;
                    if ([strongSelf.delegate respondsToSelector:@selector(onCameraMuted:userId:)]) {
                        [strongSelf.delegate onCameraMuted:mute userId:inviter];
                    }
                }];
            }
            break;
        case TUIRoomSignalingReplyCallingRoll: {// 回复主持人点名
                if ([self.delegate respondsToSelector:@selector(onMemberReplyCallingRoll:)]) {
                    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_REPLY_CALLING_ROLL stringByAppendingString:[TUIRoomUserManage currentUserId]];
                    [self.inviteCache setObject:inviteID forKey:key];
                    [self.delegate onMemberReplyCallingRoll:inviter];
                }
                [self.imService acceptInvitation:YES inviteID:inviteID callback:^(NSInteger code, NSString * _Nonnull message) {
                }];
            }
            break;
        case TUIRoomSignalingKickOffUser: {// 主持人踢人出房间
                __weak typeof(self) wealSelf = self;
                [self.imService acceptInvitation:YES inviteID:inviteID callback:^(NSInteger code, NSString * _Nonnull message) {
                    __strong typeof(wealSelf) strongSelf = wealSelf;
                    if ([strongSelf.delegate respondsToSelector:@selector(onReceiveKickedOff:)] && (code == TUIRoomSuccessCode)) {
                        [strongSelf.delegate onReceiveKickedOff:inviter];
                    }
                }];
            }
            break;
        case TUIRoomSignalingSendOffAllSpeaker: {// 邀请全体麦上成员下麦
            if ([self.delegate respondsToSelector:@selector(onOrderedToExitSpeechState:)]) {
                    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_SEND_OFF_ALL_SPEAKER stringByAppendingString:[TUIRoomUserManage currentUserId]];
                    [self.inviteCache setObject:inviteID forKey:key];
                    [self.delegate onOrderedToExitSpeechState:inviter];
                }
            }
            break;
            
        default:
            break;
    }
}

/**
 * 邀请取消回调
 *
 * @param inviteID 邀请ID
 * @param inviter 取消者
 * @param type 信令类型
*/
- (void)onCancelInviteNotification:(NSString *)inviteID
                           inviter:(NSString *)inviter
                              type:(TUIRoomSignalingType)type {
    TRTCLog(@"on cancel invite notification (inviteID=%@ inviter=%@ type=%d mute=%d)",inviteID ,inviter,type);
    switch (type) {
        case TUIRoomSignalingInviteSpeaker: {// 主持人邀请观众发言
                if ([self.delegate respondsToSelector:@selector(onReceiveSpeechInvitation:)]) {
                    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_INVITE_SPEAKER stringByAppendingString:[TUIRoomUserManage currentUserId]];
                    [self.inviteCache removeObjectForKey:key];
                    [self.delegate onReceiveInvitationCancelled:inviter];
                }
            }
            break;
       
        case TUIRoomSignalingApplyForSpeech: {// 观众申请发言
                if ([self.delegate respondsToSelector:@selector(onReceiveSpeechApplication:)]) {
                    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_APPLY_FOR_SPEECH stringByAppendingString:[TUIRoomUserManage currentUserId]];
                    [self.inviteCache removeObjectForKey:key];
                    [self.delegate onSpeechApplicationCancelled:inviter];
                }
            }
            break;
        default:
            break;
    }
}
/**
 * 房间被销毁，当主播调用destroyRoom后，观众会收到该回调
 *
*/
- (void)onRoomDestroy {
    if ([self.delegate respondsToSelector:@selector(onDestroyRoom)]) {
        [self.delegate onDestroyRoom];
    }
}

/**
 * 主持人更改回调
 *
 * @param previousUserId 更改前的主持人
 * @param currentUserId  更改后的主持人
 */
- (void)onRoomMasterChanged:(NSString *)previousUserId
              currentUserId:(NSString *) currentUserId {
    if ([self.delegate respondsToSelector:@selector(onRoomMasterChanged:currentUserId:)]) {
        [self.delegate onRoomMasterChanged:previousUserId currentUserId:currentUserId];
    }
}

/**
 * 群公告变更
 *
 * @param roomInfo 房间信息
 * @param type type
 * @param status status
*/
- (void)onGroupNotificationChange:(TUIRoomInfo *)roomInfo
                             type:(TUIRoomSignalingType)type
                           status:(BOOL)status {
    switch (type) {
        case TUIRoomSignalingMuteRoomChat: {// 主持人设置是否禁止IM聊天
                if ([self.delegate respondsToSelector:@selector(onChatRoomMuted:userId:)]) {
                    [self.delegate onChatRoomMuted:status userId:roomInfo.ownerId];
                }
            }
            break;
        case TUIRoomSignalingForbidStage: {// 主持人设置是否禁止麦上
                if ([self.delegate respondsToSelector:@selector(onSpeechApplicationForbidden:userId:)]) {
                    [self.delegate onSpeechApplicationForbidden:status userId:roomInfo.ownerId];
                }
            }
            break;
        case TUIRoomSignalingMuteAllCamera: {// 主持人设置全员开/禁摄像头
                if ([self.delegate respondsToSelector:@selector(onCameraMuted:userId:)]) {
                    [self.delegate onCameraMuted:status userId:roomInfo.ownerId];
                }
            }
            break;
        case TUIRoomSignalingMuteAllMic: {// 主持人设置开/禁麦克风
                if ([self.delegate respondsToSelector:@selector(onMicrophoneMuted:userId:)]) {
                    [self.delegate onMicrophoneMuted:status userId:roomInfo.ownerId];
                }
            }
            break;
        case TUIRoomSignalingCallingRoll: {// 主持人发起点名
                if (status) {
                    if ([self.delegate respondsToSelector:@selector(onCallingRollStarted:)]) {
                        [self.delegate onCallingRollStarted:roomInfo.ownerId];
                    }
                } else {
                    if ([self.delegate respondsToSelector:@selector(onCallingRollStopped:)]) {
                        [self.delegate onCallingRollStopped:roomInfo.ownerId];
                    }
                }
            }
            break;
        case TUIRoomSignalingStartTime: {// 开始时间
            
            }
            break;
        default:
            break;
    }
}

/**
 * 收到群文本消息
 *
 * @param userId 用户ID
 * @param message  文本消息
*/
- (void)onRecvGroupTextMessage:(NSString *)userId
                       message:(NSString *)message {
    if ([self.delegate respondsToSelector:@selector(onReceiveChatMessage:message:)]) {
        [self.delegate onReceiveChatMessage:userId message:message];
    }
}


/**
* 新成员进房回调
*
* @param userInfo 新进房成员
*/
- (void)onUserEnterIMRoom:(TUIRoomUserInfo *)userInfo {
    if ([self.delegate respondsToSelector:@selector(onRemoteUserEnter:)]) {
        [self.delegate onRemoteUserEnter:userInfo.userId];
    }
}

/**
* 成员离开房间回调
*
* @param userInfo 离开房间成员
*/
- (void)onUserLeaveIMRoom:(TUIRoomUserInfo *)userInfo {
    if ([self.delegate respondsToSelector:@selector(onRemoteUserLeave:)]) {
        [self.delegate onRemoteUserLeave:userInfo.userId];
    }
}

#pragma mark TUIRoomTRTCServiceDelegate

/// 错误回调
/// @param code 错误码
/// @param message 错误信息
- (void)onTRTCError:(int)code
            message:(NSString*)message {
    if ([self.delegate respondsToSelector:@selector(onError:message:)]) {
        [self.delegate onError:code message:message];
    }
}

/**
* 新成员进房回调
*
* @param userId 用户ID
*/
- (void)onUserEnterTRTCRoom:(NSString *)userId {
    TUIRoomUserInfo *userInfo = [TUIRoomUserManage getUser:userId];
    if (!userInfo) {
        userInfo = [[TUIRoomUserInfo alloc]init];
        userInfo.userId = userId;
        TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
        if ([roomInfo.ownerId isEqualToString:userId]) {
            userInfo.role = TUIRoomMaster;
        } else {
            userInfo.role = TUIRoomAnchor;
        }
        [TUIRoomUserManage cacheUser:userInfo];
    }
    [TUIRoomUserManage cacheSpeechUser:userInfo];
    
    if ([self.delegate respondsToSelector:@selector(onRemoteUserEnterSpeechState:)]) {
        TRTCLog(@"------onUserEnterTRTCRoom success (self.delegate:%@ userId:%@ username:%@)",self.delegate,userId,userInfo.userName);
        [self.delegate onRemoteUserEnterSpeechState:userId];
    } else {
        TRTCLog(@"------onUserEnterTRTCRoom error (self.delegate:%@ userId:%@ username:%@)",self.delegate,userId,userInfo.userName);
    }
    
    [TUIRoomUserManage getUserInfo:userId callback:^(NSInteger code, NSString * _Nonnull message, TUIRoomUserInfo * _Nullable userInfo) {
        if (userInfo) {
            [TUIRoomUserManage cacheUser:userInfo];
        }
    }];
}

/**
* 成员离开房间回调
*
* @param userInfo 离开房间成员
*/
- (void)onUserLeaveTRTCRoom:(TUIRoomUserInfo *)userInfo {
    
    if (userInfo.role == TUIRoomAnchor) {
        userInfo.role = TUIRoomAudience;
    }
    if ([self.delegate respondsToSelector:@selector(onRemoteUserExitSpeechState:)]) {
        [self.delegate onRemoteUserExitSpeechState:userInfo.userId];
    }
    [TUIRoomUserManage removeSpeechUser:userInfo.userId];
}


/**
 * 远端用户发布/取消了主路视频画面回调
 *
 * @param userInfo 远端用户
 * @param available 该用户是否发布（或取消发布）了主路视频画面，YES: 发布；NO：取消发布。
 */
- (void)onUserVideoAvailable:(TUIRoomUserInfo *)userInfo
                   available:(BOOL)available {
    if ([self.delegate respondsToSelector:@selector(onRemoteUserCameraAvailable:available:)]) {
        [self.delegate onRemoteUserCameraAvailable:userInfo.userId available:available];
    }
}

/**
 * 远端用户发布/取消了自己的音频
 *
 * @param userId 远端用户的用户标识
 * @param available 该用户是否发布（或取消发布）了自己的音频，YES: 发布；NO：取消发布。
 */
- (void)onUserAudioAvailable:(NSString *)userId
                   available:(BOOL)available {
    if ([self.delegate respondsToSelector:@selector(onRemoteUserAudioAvailable:available:)]) {
        [self.delegate onRemoteUserAudioAvailable:userId available:available];
    }
}

/**
 * 网络质量的实时统计回调
 *
 * @param localQuality 上行网络质量
 * @param remoteQuality 下行网络质量
 */
- (void)onNetworkQuality:(TRTCQualityInfo *)localQuality
           remoteQuality:(NSArray<TRTCQualityInfo *> *)remoteQuality {
    if ([self.delegate respondsToSelector:@selector(onNetworkQuality:remoteQuality:)]) {
        [self.delegate onNetworkQuality:localQuality remoteQuality:remoteQuality];
    }
}

/**
 * 音量大小的反馈回调
 *
 * @param userId 远端用户的用户标识
 * @param totalVolume 所有远端用户的总音量大小, 取值范围 0 - 100。
 */
- (void)onUserVoiceVolume:(NSString *)userId
              totalVolume:(NSInteger)totalVolume {
    if ([self.delegate respondsToSelector:@selector(onUserVoiceVolume:volume:)]) {
        [self.delegate onUserVoiceVolume:userId volume:totalVolume];
    }
}

/**
 * 录屏开始通知
 */
- (void)onScreenCaptureStarted {
    if ([self.delegate respondsToSelector:@selector(onScreenCaptureStarted)]) {
        [self.delegate onScreenCaptureStarted];
    }
    _isScreenCapture = YES;
}

/**
 * 录屏停止通知
 *
 * @param reason 停止原因，0：用户主动停止；1：被其他应用抢占导致停止
 */
- (void)onScreenCaptureStopped:(NSInteger)reason {
    if (self.delegate && [self.delegate respondsToSelector:@selector(onScreenCaptureStopped:)]) {
        [self.delegate onScreenCaptureStopped:reason];
    }
    _isScreenCapture = NO;
}

/**
 * 成员 开启/关闭  视频分享的通知
 *
 * @param userId    用户ID
 * @param available true：用户打开麦克风；false：用户关闭麦克风
 */
- (void)onRemoteUserScreenVideoAvailable:(NSString *)userId
                               available:(BOOL)available {
    if ([self.delegate respondsToSelector:@selector(onRemoteUserScreenVideoAvailable:available:)]) {
        [self.delegate onRemoteUserScreenVideoAvailable:userId available:available];
    }
}

/**
 * 技术指标统计回调
 *
 * 如果您是熟悉音视频领域相关术语，可以通过这个回调获取 SDK 的所有技术指标。
 * 如果您是首次开发音视频相关项目，可以只关注 onNetworkQuality 回调，每2秒回调一次。
 *
 * @param statistics 统计数据，包括本地和远程的
 */
- (void)onStatistics:(TRTCStatistics *)statistics {
    if ([self.delegate respondsToSelector:@selector(onStatistics:)]) {
        [self.delegate onStatistics:statistics];
    }
}

@end
