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

@property(nonatomic, weak) id<TUIRoomCoreDelegate> delegate;

@property (nonatomic, strong) TUIRoomIMService *imService;

@property (nonatomic, strong) TUIRoomTRTCService *trtcService;

@property (nonatomic, strong) NSCache *inviteCache;

@end

@implementation TUIRoomCore

static TUIRoomCore *gInstance = nil;
static dispatch_once_t gOnceToken;

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

+ (void)destroyInstance {
	gInstance = nil;
    gOnceToken = 0;
    [[TRTCCloud sharedInstance] stopScreenCapture];
    [[TRTCCloud sharedInstance] exitRoom];
    [TRTCCloud destroySharedIntance];
    [TUIRoomUserManage destroyInstance];
}

- (void)setDelegate:(id<TUIRoomCoreDelegate>)delegate {
    _delegate = delegate;
}

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
        roomInfo.roomId = roomId;
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

- (void)enterRoom:(NSString *)roomId
         callback:(TUIRoomActionCallback)callback {
    if ([TUILogin getUserID].length <= 0) {
        if (callback) {
            callback(TUIRoomErrorEnterRoomFailed,@"no login");
        }
        return;
    }
    [self.imService enterRoom:roomId
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

- (void)leaveRoom:(TUIRoomActionCallback)callback {
    [self.trtcService leaveRoom:nil];
    [self.imService leaveRoom:callback];
}

- (nullable TUIRoomInfo *)getRoomInfo {
    return [self.imService getRoomInfo];
}

- (nullable NSArray<TUIRoomUserInfo *> *)getRoomUsers {
    return [self.imService getMemberList] ? : @[];
}

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

- (void)transferRoomMaster:(NSString *)userId
                  callback:(TUIRoomActionCallback)callback {
    [self.imService transferRoomMaster:userId callback:callback];
}

- (void)setSelfProfile:(NSString *)userName
             avatarURL:(NSString *)avatarURL
              callback:(TUIRoomActionCallback)callback {
    [self.imService setSelfProfile:userName avatarURL:avatarURL callback:callback];
}

- (void)startCameraPreview:(BOOL)isFront
                      view:(UIView *)view {
    if (view) {
        [[TRTCCloud sharedInstance] startLocalPreview:isFront view:view];
    }
}

- (void)stopCameraPreview {
    [[TRTCCloud sharedInstance] stopLocalPreview];
}

- (void)switchCamera:(BOOL)isFront {
    [self.trtcService switchCamera:isFront];
}

- (void)setSpeaker:(BOOL)isUseSpeaker {
    [self.trtcService setSpeaker:isUseSpeaker];
}

- (void)setVideoMirror:(TRTCVideoMirrorType)type {
    [self.trtcService setLocalViewMirror:type];
}

- (void)startLocalAudio:(TRTCAudioQuality)quality {
    [[TRTCCloud sharedInstance] startLocalAudio:quality];
    [self.trtcService muteLocalAudio:NO];
}

- (void)stopLocalAudio {
    [self.trtcService muteLocalAudio:YES];
}

- (void)startRemoteView:(NSString *)userId
                   view:(UIView *)view
             streamType:(TUIRoomStreamType)streamType
               callback:(TUIRoomActionCallback)callback {
    if (view && userId) {
        [self.trtcService startRemoteView:userId view:view type:streamType callback:callback];
    }
}

- (void)stopRemoteView:(NSString *)userId
            streamType:(TUIRoomStreamType)streamType
              callback:(TUIRoomActionCallback)callback {
    if (userId) {
        [self.trtcService stopRemoteView:userId type:streamType callback:callback];
    }
}

- (void)sendChatMessage:(NSString *)message
               callback:(TUIRoomActionCallback)callback {
    [self.imService sendChatMessage:message callback:callback];
}

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

- (void)muteAllUsersMicrophone:(BOOL)mute
                      callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isAllMicMuted = mute;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

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

- (void)muteAllUsersCamera:(BOOL)mute
                  callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isAllCameraMuted = mute;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

- (void)muteChatRoom:(BOOL)mute
            callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isChatRoomMuted = mute;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

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

- (void)startCallingRoll:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isCallingRoll = YES;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

- (void)stopCallingRoll:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isCallingRoll = NO;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

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

- (void)sendSpeechInvitation:(NSString *)userId
                    callback:(TUIRoomInviteeCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService sendSpeechInvitation:userId
                                   param:[TUIRoomIMProtocol inviteSpeaker:roomInfo.roomId receiverId:userId]
                                callback:callback];
}

- (void)cancelSpeechInvitation:(NSString *)userId
                      callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService cancelSpeechInvitation:userId
                                     param:[TUIRoomIMProtocol inviteSpeaker:roomInfo.roomId receiverId:userId]
                                  callback:callback];
}

- (void)replySpeechInvitation:(BOOL)agree
                     callback:(TUIRoomActionCallback)callback {
    NSString *key = TUIROOM_SIGNALING_KEY_CMD_INVITE_SPEAKER;
    NSString *inviteID = [self.inviteCache objectForKey:key];
    if (inviteID) {
        [self.inviteCache removeObjectForKey:key];
        __weak typeof(self) wealSelf = self;
        [self.imService acceptInvitation:agree inviteID:inviteID callback:^(NSInteger code, NSString * _Nonnull message) {
            __strong typeof(wealSelf) strongSelf = wealSelf;
            if ((code == 0) && agree) {
                [strongSelf.trtcService switchToAnchor:nil];
            }
            if (callback) {
                callback(code,message);
            }
        }];
    } else {
        if (callback) {
            callback(TUIRoomErrorParamInvalid,agree ? @"accept invatiaon failed":@"reject invatiaon failed");
        }
    }
}

- (void)sendSpeechApplication:(TUIRoomInviteeCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    __weak typeof(self) wealSelf = self;
    [self.imService sendSpeechApplication:roomInfo.ownerId
                                    param:[TUIRoomIMProtocol applyForSpeech:roomInfo.roomId receiverId:roomInfo.ownerId]
                                 callback:^(TUIRoomInviteeCallBackType type, NSString * _Nonnull message) {
        __strong typeof(wealSelf) strongSelf = wealSelf;
        if (type == TUIRoomInviteeAccepted) {
            [strongSelf.trtcService switchToAnchor:nil];
        }
        if (callback) {
            callback(type,message);
        }
    }];
}

- (void)cancelSpeechApplication:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService cancelSpeechApplication:[TUIRoomIMProtocol applyForSpeech:roomInfo.roomId receiverId:roomInfo.ownerId] callback:callback];
}

- (void)replySpeechApplication:(BOOL)agree
                        userId:(NSString *)userId
                      callback:(TUIRoomActionCallback)callback {
    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_APPLY_FOR_SPEECH stringByAppendingString:userId];
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

- (void)forbidSpeechApplication:(BOOL)forbid
                       callback:(TUIRoomActionCallback)callback {
    TUIRoomInfo *roomInfo = [[self.imService getRoomInfo]copy];
    roomInfo.isSpeechApplicationForbidden = forbid;
    [self.imService updateGroupNotification:[roomInfo getNotification] callback:callback];
}

- (void)sendOffSpeaker:(NSString *)userId
              callback:(TUIRoomInviteeCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService onInviteUser:userId
                           param:[TUIRoomIMProtocol sendOffSpeaker:roomInfo.roomId receiverId:userId]
                        callback:callback];
}

- (void)sendOffAllSpeakers:(TUIRoomInviteeCallback)callback {
    TUIRoomInfo *roomInfo = [self.imService getRoomInfo];
    [self.imService onInviteGroup:roomInfo.roomId
                      inviteeList:[TUIRoomUserManage speechUserIdList]
                            param:[TUIRoomIMProtocol sendOffAllSpeaker:roomInfo.roomId]
                         callback:callback];
}

- (void)exitSpeechState:(TUIRoomActionCallback)callback {
    NSString *key = TUIROOM_SIGNALING_KEY_CMD_SEND_OFF_SPEAKER;
    NSString *inviteID = [self.inviteCache objectForKey:key];
    if (inviteID) {
        [self.inviteCache removeObjectForKey:key];
        [self.imService acceptInvitation:YES inviteID:inviteID callback:callback];
    }
    [self.trtcService switchToAudience:callback];
}

- (void)startScreenCapture:(TRTCVideoEncParam *)encParam {
    [[TRTCCloud sharedInstance]
     startScreenCaptureByReplaykit:TRTCVideoStreamTypeSub
     encParam:encParam
     appGroup:@"com.tencent.TUIRoomTXReplayKit-Screen"];
}

- (void)stopScreenCapture  {
    if (_isScreenCapture) {
        _isScreenCapture = NO;
        [[TRTCCloud sharedInstance] stopScreenCapture];
    }
}

- (TXBeautyManager *)getBeautyManager {
    return [[TRTCCloud sharedInstance] getBeautyManager];
}

- (void)setVideoQosPreference:(TRTCNetworkQosParam *)preference {
    [self.trtcService setVideoQosPreference:preference];
}

- (void)setAudioCaptureVolume:(NSInteger)volume {
    [[TRTCCloud sharedInstance] setAudioCaptureVolume:volume];
}

- (void)setAudioQuality:(TRTCAudioQuality)quality {
    [self.trtcService setAudioQuality:quality];
}

- (void)setAudioPlayVolume:(NSInteger)volume {
    [[TRTCCloud sharedInstance] setAudioPlayoutVolume:volume];
}

- (void)startFileDumping:(TRTCAudioRecordingParams *)params {
    [[TRTCCloud sharedInstance] startAudioRecording:params];
}

- (void)stopFileDumping {
    [[TRTCCloud sharedInstance] stopAudioRecording];
}

- (void)enableAudioEvaluation:(BOOL)enable {
    [[TRTCCloud sharedInstance] enableAudioVolumeEvaluation:enable ? 300 : 0];
}

- (void)setVideoResolution:(TRTCVideoResolution)resolution {
    [self.trtcService setVideoResolution:resolution];
}

- (void)setVideoFps:(int)fps {
    [self.trtcService setVideoFps:fps];
}

- (void)setVideoBitrate:(int)bitrate {
    [self.trtcService setVideoBitrate:bitrate];
}

- (NSInteger)getSdkVersion {
    return 1;
}

- (void)dealloc {
    [self.trtcService releaseResources];
    [self.imService releaseResources];
    NSLog(@"dealloc %@",NSStringFromClass([self class]));
}

#pragma mark TUIRoomIMServiceDelegate
- (void)onInviteNotification:(NSString *)inviteID
                     inviter:(NSString *)inviter
                        type:(TUIRoomSignalingType)type
                        mute:(BOOL)mute {
    
    TRTCLog(@"on invite notification (inviteID=%@ inviter=%@ type=%d mute=%d)",inviteID ,inviter,type,mute);
    switch (type) {
        case TUIRoomSignalingInviteSpeaker: {
                if ([self.delegate respondsToSelector:@selector(onReceiveSpeechInvitation:)]) {
                    NSString *key = TUIROOM_SIGNALING_KEY_CMD_INVITE_SPEAKER;
                    [self.inviteCache setObject:inviteID forKey:key];
                    [self.delegate onReceiveSpeechInvitation:inviter];
                }
            }
            break;
        case TUIRoomSignalingSendOffSpeaker: {
                if ([self.delegate respondsToSelector:@selector(onOrderedToExitSpeechState:)]) {
                    NSString *key = TUIROOM_SIGNALING_KEY_CMD_SEND_OFF_SPEAKER;
                    [self.inviteCache setObject:inviteID forKey:key];
                    [self.delegate onOrderedToExitSpeechState:inviter];
                }
            }
            break;
        case TUIRoomSignalingApplyForSpeech: {
                if ([self.delegate respondsToSelector:@selector(onReceiveSpeechApplication:)]) {
                    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_APPLY_FOR_SPEECH stringByAppendingString:inviter];
                    [self.inviteCache setObject:inviteID forKey:key];
                    [self.delegate onReceiveSpeechApplication:inviter];
                }
            }
            break;
        case TUIRoomSignalingMuteMicrophone: {
                __weak typeof(self) wealSelf = self;
                [self.imService acceptInvitation:YES inviteID:inviteID callback:^(NSInteger code, NSString * _Nonnull message) {
                    __strong typeof(wealSelf) strongSelf = wealSelf;
                    if ([self.delegate respondsToSelector:@selector(onMicrophoneMuted:userId:)]) {
                        [strongSelf.delegate onMicrophoneMuted:mute userId:inviter];
                    }
                }];
            }
            break;
        case TUIRoomSignalingMuteCamera: {
                __weak typeof(self) wealSelf = self;
                [self.imService acceptInvitation:YES inviteID:inviteID callback:^(NSInteger code, NSString * _Nonnull message) {
                    __strong typeof(wealSelf) strongSelf = wealSelf;
                    if ([strongSelf.delegate respondsToSelector:@selector(onCameraMuted:userId:)]) {
                        [strongSelf.delegate onCameraMuted:mute userId:inviter];
                    }
                }];
            }
            break;
        case TUIRoomSignalingReplyCallingRoll: {
                if ([self.delegate respondsToSelector:@selector(onMemberReplyCallingRoll:)]) {
                    [self.delegate onMemberReplyCallingRoll:inviter];
                }
                [self.imService acceptInvitation:YES inviteID:inviteID callback:^(NSInteger code, NSString * _Nonnull message) {
                }];
            }
            break;
        case TUIRoomSignalingKickOffUser: {
                __weak typeof(self) wealSelf = self;
                [self.imService acceptInvitation:YES inviteID:inviteID callback:^(NSInteger code, NSString * _Nonnull message) {
                    __strong typeof(wealSelf) strongSelf = wealSelf;
                    if ([strongSelf.delegate respondsToSelector:@selector(onReceiveKickedOff:)] && (code == TUIRoomSuccessCode)) {
                        [strongSelf.delegate onReceiveKickedOff:inviter];
                    }
                }];
            }
            break;
        case TUIRoomSignalingSendOffAllSpeaker: {
            if ([self.delegate respondsToSelector:@selector(onOrderedToExitSpeechState:)]) {
                    [self.delegate onOrderedToExitSpeechState:inviter];
                }
            }
            break;
            
        default:
            break;
    }
}

- (void)onCancelInviteNotification:(NSString *)inviteID
                           inviter:(NSString *)inviter
                              type:(TUIRoomSignalingType)type {
    TRTCLog(@"on cancel invite notification (inviteID=%@ inviter=%@ type=%d mute=%d)",inviteID ,inviter,type);
    switch (type) {
        case TUIRoomSignalingInviteSpeaker: {
                if ([self.delegate respondsToSelector:@selector(onReceiveSpeechInvitation:)]) {
                    NSString *key = TUIROOM_SIGNALING_KEY_CMD_INVITE_SPEAKER;
                    [self.inviteCache removeObjectForKey:key];
                    if (![inviter isEqualToString:[TUIRoomUserManage currentUserId]] ) {
                        [self.delegate onReceiveInvitationCancelled:inviter];
                    }
                }
            }
            break;
       
        case TUIRoomSignalingApplyForSpeech: {
                if ([self.delegate respondsToSelector:@selector(onReceiveSpeechApplication:)]) {
                    NSString *key = [TUIROOM_SIGNALING_KEY_CMD_APPLY_FOR_SPEECH stringByAppendingString:inviter];
                    [self.inviteCache removeObjectForKey:key];
                    if (![inviter isEqualToString:[TUIRoomUserManage currentUserId]] ) {
                        [self.delegate onSpeechApplicationCancelled:inviter];
                    }
                }
            }
            break;
        default:
            break;
    }
}

- (void)onRoomDestroy {
    if ([self.delegate respondsToSelector:@selector(onDestroyRoom)]) {
        [self.delegate onDestroyRoom];
    }
}

- (void)onRoomMasterChanged:(NSString *)previousUserId
              currentUserId:(NSString *) currentUserId {
    if ([self.delegate respondsToSelector:@selector(onRoomMasterChanged:currentUserId:)]) {
        [self.delegate onRoomMasterChanged:previousUserId currentUserId:currentUserId];
    }
}

- (void)onGroupNotificationChange:(TUIRoomInfo *)roomInfo
                             type:(TUIRoomSignalingType)type
                           status:(BOOL)status {
    switch (type) {
        case TUIRoomSignalingMuteRoomChat: {
                if ([self.delegate respondsToSelector:@selector(onChatRoomMuted:userId:)]) {
                    [self.delegate onChatRoomMuted:status userId:roomInfo.ownerId];
                }
            }
            break;
        case TUIRoomSignalingForbidStage: {
                if ([self.delegate respondsToSelector:@selector(onSpeechApplicationForbidden:userId:)]) {
                    [self.delegate onSpeechApplicationForbidden:status userId:roomInfo.ownerId];
                }
            }
            break;
        case TUIRoomSignalingMuteAllCamera: {
                if ([self.delegate respondsToSelector:@selector(onCameraMuted:userId:)]) {
                    [self.delegate onCameraMuted:status userId:roomInfo.ownerId];
                }
            }
            break;
        case TUIRoomSignalingMuteAllMic: {
                if ([self.delegate respondsToSelector:@selector(onMicrophoneMuted:userId:)]) {
                    [self.delegate onMicrophoneMuted:status userId:roomInfo.ownerId];
                }
            }
            break;
        case TUIRoomSignalingCallingRoll: {
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
        case TUIRoomSignalingStartTime: {
            
            }
            break;
        default:
            break;
    }
}

- (void)onRecvGroupTextMessage:(NSString *)userId
                       message:(NSString *)message {
    if ([self.delegate respondsToSelector:@selector(onReceiveChatMessage:message:)]) {
        [self.delegate onReceiveChatMessage:userId message:message];
    }
}

- (void)onUserEnterIMRoom:(TUIRoomUserInfo *)userInfo {
    if ([self.delegate respondsToSelector:@selector(onRemoteUserEnter:)]) {
        [self.delegate onRemoteUserEnter:userInfo.userId];
    }
}

- (void)onUserLeaveIMRoom:(TUIRoomUserInfo *)userInfo {
    if ([self.delegate respondsToSelector:@selector(onRemoteUserLeave:)]) {
        [self.delegate onRemoteUserLeave:userInfo.userId];
    }
}

#pragma mark TUIRoomTRTCServiceDelegate
- (void)onTRTCError:(int)code
            message:(NSString*)message {
    if ([self.delegate respondsToSelector:@selector(onError:message:)]) {
        [self.delegate onError:code message:message];
    }
}

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

- (void)onUserLeaveTRTCRoom:(TUIRoomUserInfo *)userInfo {
    
    if (userInfo.role == TUIRoomAnchor) {
        userInfo.role = TUIRoomAudience;
    }
    if ([self.delegate respondsToSelector:@selector(onRemoteUserExitSpeechState:)]) {
        [self.delegate onRemoteUserExitSpeechState:userInfo.userId];
    }
    [TUIRoomUserManage removeSpeechUser:userInfo.userId];
}

- (void)onUserVideoAvailable:(TUIRoomUserInfo *)userInfo
                   available:(BOOL)available {
    if ([self.delegate respondsToSelector:@selector(onRemoteUserCameraAvailable:available:)]) {
        [self.delegate onRemoteUserCameraAvailable:userInfo.userId available:available];
    }
}

- (void)onUserAudioAvailable:(NSString *)userId
                   available:(BOOL)available {
    if ([self.delegate respondsToSelector:@selector(onRemoteUserAudioAvailable:available:)]) {
        [self.delegate onRemoteUserAudioAvailable:userId available:available];
    }
}

- (void)onNetworkQuality:(TRTCQualityInfo *)localQuality
           remoteQuality:(NSArray<TRTCQualityInfo *> *)remoteQuality {
    if ([self.delegate respondsToSelector:@selector(onNetworkQuality:remoteQuality:)]) {
        [self.delegate onNetworkQuality:localQuality remoteQuality:remoteQuality];
    }
}

- (void)onUserVoiceVolume:(NSString *)userId
              totalVolume:(NSInteger)totalVolume {
    if ([self.delegate respondsToSelector:@selector(onUserVoiceVolume:volume:)]) {
        [self.delegate onUserVoiceVolume:userId volume:totalVolume];
    }
}

- (void)onScreenCaptureStarted {
    if ([self.delegate respondsToSelector:@selector(onScreenCaptureStarted)]) {
        [self.delegate onScreenCaptureStarted];
    }
    _isScreenCapture = YES;
}

- (void)onScreenCaptureStopped:(NSInteger)reason {
    if (self.delegate && [self.delegate respondsToSelector:@selector(onScreenCaptureStopped:)]) {
        [self.delegate onScreenCaptureStopped:reason];
    }
    _isScreenCapture = NO;
}

- (void)onRemoteUserScreenVideoAvailable:(NSString *)userId
                               available:(BOOL)available {
    if ([self.delegate respondsToSelector:@selector(onRemoteUserScreenVideoAvailable:available:)]) {
        [self.delegate onRemoteUserScreenVideoAvailable:userId available:available];
    }
}

- (void)onStatistics:(TRTCStatistics *)statistics {
    if ([self.delegate respondsToSelector:@selector(onStatistics:)]) {
        [self.delegate onStatistics:statistics];
    }
}

@end
