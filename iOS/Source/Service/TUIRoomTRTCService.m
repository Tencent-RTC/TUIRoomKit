//
//  TUIRoomTRTCService.m
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "TUIRoomTRTCService.h"
#import "TUIRoomUserInfo.h"
#import "TUIRoomUserManage.h"
#import <TUICore/TUILogin.h>
#import "TUIRoomInfo.h"

static const int TC_COMPONENT_ROOM = 5;
static const int TC_TRTC_FRAMEWORK = 1;

@interface TRTCCloud (TUIRoom)

- (void)apiLog:(NSString *)log;

@end

void tuiRoomLog(NSString *format, ...) {
    static dispatch_queue_t logQueue;
    if (!logQueue) {
        logQueue = dispatch_queue_create("com.tuiroom.LogQueue", DISPATCH_QUEUE_SERIAL);
    }
    if (!format || ![format isKindOfClass:[NSString class]] || format.length == 0) {
        return;
    }
    va_list arguments;
    va_start(arguments, format);
    NSString *content = [[NSString alloc] initWithFormat:format arguments:arguments];
    va_end(arguments);
    dispatch_async(logQueue, ^{
        if (content) {
            [[TRTCCloud sharedInstance]apiLog:content];
        }
    });
}

@interface TUIRoomTRTCService()<TRTCCloudDelegate>{
    TRTCVideoResolution _videoResolution;
    int _videoFPS;
    int _videoBitrate;
    dispatch_queue_t _delegateQueue;
}

@property (nonatomic, strong) TRTCParams *enterRoomParams;

@property (nonatomic, strong) TUIRoomActionCallback enterRoomCallback;

@property (nonatomic, strong) TUIRoomActionCallback leaveRoomCallback;

@property (nonatomic, strong) TUIRoomActionCallback switchRoleCallback;

@end

@implementation TUIRoomTRTCService

#pragma mark - init
- (instancetype)init {
    self = [super init];
    if (self) {
        _videoResolution = TRTCVideoResolution_960_540;
        _videoFPS = 15;
        _videoBitrate = 900;
        _delegateQueue = dispatch_get_main_queue();
    }
    return self;
}

- (void)enterRTCRoom:(TUIRoomInfo *)roomInfo
            callback:(TUIRoomActionCallback)callback {
    __block TRTCParams *params = [[TRTCParams alloc] init];
    __weak typeof(self) wealSelf = self;
    self.enterRoomCallback = ^(NSInteger code, NSString * _Nonnull message) {
        __strong typeof(wealSelf) strongSelf = wealSelf;
        if (code == TUIRoomSuccessCode) {
            strongSelf.enterRoomParams = params;
        }
        if (callback) {
            callback(code,message);
        }
    };
    [[TRTCCloud sharedInstance] setDelegate:self];
    [[TRTCCloud sharedInstance] setDelegateQueue:dispatch_queue_create("TUIRoomTRTCServiceQueue", DISPATCH_QUEUE_SERIAL)];
    UInt32 roomId = [roomInfo getTRTCRoomId];
    [self updateVideoEncoderParam];
    int sdkAppId = [TUILogin getSdkAppID];
    NSString *userId = [TUILogin getUserID] ? : @"";
    NSString *streamId = [NSString stringWithFormat:@"%u_%u_%@_main", sdkAppId, roomId, userId];
    params.sdkAppId = sdkAppId;
    params.userId = userId;
    params.roomId = roomId;
    params.userSig = [TUILogin getUserSig] ? : @"";
    if (([roomInfo getSpeechModeType] == TUIRoomFreeSpeech) || [roomInfo isHomeowner]) {
        params.role = TRTCRoleAnchor;
    } else {
        params.role = TRTCRoleAudience;
    }
    params.streamId = streamId;
    [self setFramework];
    [[TRTCCloud sharedInstance] enterRoom:params appScene:TRTCAppSceneLIVE];
}

- (void)leaveRoom:(nullable TUIRoomActionCallback)callback {
    if (callback) {
        __weak typeof(self) wealSelf = self;
        self.leaveRoomCallback = ^(NSInteger code, NSString * _Nonnull message) {
            __strong typeof(wealSelf) strongSelf = wealSelf;
            if (code == TUIRoomSuccessCode) {
                strongSelf.enterRoomParams = nil;
            }
            if (callback) {
                callback(code,message);
            }
            TRTCLog(@"trtc leave room (code=%d message=%@)",code,message);
        };
    } else {
        self.enterRoomParams = nil;
    }
    [[TRTCCloud sharedInstance] stopLocalAudio];
    [[TRTCCloud sharedInstance] stopLocalPreview];
    [[TRTCCloud sharedInstance] exitRoom];
}

- (void)switchToAnchor:(nullable TUIRoomActionCallback)callback {
    self.switchRoleCallback = callback;
    [[TRTCCloud sharedInstance] switchRole:TRTCRoleAnchor];
    [[TRTCCloud sharedInstance] startLocalAudio:TRTCAudioQualitySpeech];
}

- (void)switchToAudience:(nullable TUIRoomActionCallback)callback {
    self.switchRoleCallback = callback;
    [[TRTCCloud sharedInstance] stopLocalAudio];
    [[TRTCCloud sharedInstance] switchRole:TRTCRoleAudience];
}

- (void)startRemoteView:(NSString *)userId
                   view:(UIView *)view
                   type:(TUIRoomStreamType)type
               callback:(TUIRoomActionCallback)callback {
    
    [[TRTCCloud sharedInstance] startRemoteView:userId
                                     streamType:GetTUIRoomStreamType(type)
                                           view:view];
    TRTCRenderParams *params = [[TRTCRenderParams alloc]init];
    params.fillMode = TRTCVideoFillMode_Fit;
    if (type == TUIRoomStreamScreen) {
        [[TRTCCloud sharedInstance] setRemoteRenderParams:userId streamType:TRTCVideoStreamTypeSub params:params];
    } else {
        [[TRTCCloud sharedInstance] setRemoteRenderParams:userId streamType:TRTCVideoStreamTypeBig params:params];
    }
    if (callback) {
        callback(TUIRoomSuccessCode, @"success");
    }
}

- (void)stopRemoteView:(NSString *)userId
                  type:(TUIRoomStreamType)type
              callback:(TUIRoomActionCallback)callback {
    [[TRTCCloud sharedInstance] stopRemoteView:userId streamType:GetTUIRoomStreamType(type)];
    if (callback) {
        callback(TUIRoomSuccessCode, @"success");
    }
}

- (void)muteRemoteVideoStream:(NSString *)userId
                         type:(TUIRoomStreamType)type
                         mute:(BOOL)mute {
    [[TRTCCloud sharedInstance] muteRemoteVideoStream:userId streamType:GetTUIRoomStreamType(type) mute:mute];
}

- (void)switchCamera:(BOOL)isFront {
    if (isFront != [self isFrontCamera]) {
        [[[TRTCCloud sharedInstance] getDeviceManager] switchCamera:isFront];
    }
}

- (void)setSpeaker:(BOOL)useSpeaker {
    if (useSpeaker) {
        [[TRTCCloud sharedInstance] setAudioRoute:TRTCAudioModeSpeakerphone];
    } else {
        [[TRTCCloud sharedInstance] setAudioRoute:TRTCAudioModeEarpiece];
    }
}

- (BOOL)isFrontCamera {
    return [[[TRTCCloud sharedInstance] getDeviceManager] isFrontCamera];
}

- (void)setVideoResolution:(TRTCVideoResolution)resolution {
    _videoResolution = resolution;
    [self updateVideoEncoderParam];
}

- (void)setVideoFps:(int)fps {
    _videoFPS = fps;
    [self updateVideoEncoderParam];
}

- (void)setVideoBitrate:(int)bitrate {
    _videoBitrate = bitrate;
    [self updateVideoEncoderParam];
}

- (void)setLocalViewMirror:(TRTCVideoMirrorType)type {
    TRTCRenderParams *params = [[TRTCRenderParams alloc] init];
    params.fillMode = TRTCVideoFillMode_Fill;
    params.rotation = TRTCVideoRotation_0;
    params.mirrorType = type;
    [[TRTCCloud sharedInstance] setLocalRenderParams:params];
}

- (void)setVideoQosPreference:(TRTCNetworkQosParam *)preference {
    [[TRTCCloud sharedInstance] setNetworkQosParam:preference];
}

- (void)startMicrophone {
    [[TRTCCloud sharedInstance] startLocalAudio:TRTCAudioQualitySpeech];
}

- (void)stopMicrophone {
    [[TRTCCloud sharedInstance] stopLocalAudio];
}

- (void)setAudioQuality:(TRTCAudioQuality)quality {
    [[TRTCCloud sharedInstance] startLocalAudio:quality];
}

- (void)muteLocalAudio:(BOOL)mute {
    [[TRTCCloud sharedInstance] muteLocalAudio:mute];
}

- (void)setAudioCaptureVolume:(NSInteger)volume {
    [[TRTCCloud sharedInstance] setAudioCaptureVolume:volume];
}

- (void)setAudioPlayoutVolume:(NSInteger)volume {
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

- (NSString *)getStreamId {
    return self.enterRoomParams.streamId;
}

- (void)releaseResources {
}

- (void)dealloc {
    NSLog(@"dealloc %@",NSStringFromClass([self class]));
}

#pragma  private function
- (void)setFramework {
    NSDictionary *jsonDic = @{@"api": @"setFramework",
                              @"params":@{@"framework": @(TC_TRTC_FRAMEWORK),
                                          @"component": @(TC_COMPONENT_ROOM)}};
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:jsonDic options:NSJSONWritingPrettyPrinted error:nil];
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    [[TRTCCloud sharedInstance] callExperimentalAPI: jsonString];
}

- (void)updateVideoEncoderParam {
    TRTCVideoEncParam *param = [[TRTCVideoEncParam alloc] init];
    param.videoResolution = _videoResolution;
    param.videoBitrate = _videoBitrate;
    param.videoFps = _videoFPS;
    param.resMode = TRTCVideoResolutionModePortrait;
    param.enableAdjustRes = YES;
    [[TRTCCloud sharedInstance] setVideoEncoderParam:param];
}

- (void)asyncDelegateQueue:(os_block_t)block {
    if (_delegateQueue) {
        __weak typeof(self) wealSelf = self;
        dispatch_async(_delegateQueue, ^{
            __strong typeof(wealSelf) strongSelf = wealSelf;
            if (strongSelf && block) {
                block();
            }
        });
    }
}

#pragma mark - TRTCCloudDelegate
- (void)onError:(TXLiteAVError)errCode errMsg:(NSString *)errMsg extInfo:(NSDictionary *)extInfo {
    TRTCLog(@"on error (userid=%@ errCode=%d errMsg=%@ extInfo=%@)",[TUIRoomUserManage currentUserId],errCode,errMsg,extInfo);
    [self asyncDelegateQueue:^{
        if (self.delegate && [self.delegate respondsToSelector:@selector(onTRTCError:message:)]) {
            [self.delegate onTRTCError:errCode message:errMsg];
        }
    }];
}

- (void)onEnterRoom:(NSInteger)result {
    TRTCLog(@"on enter room (userid=%@ result=%d)",[TUIRoomUserManage currentUserId],result);
    [self asyncDelegateQueue:^{
        if (self.enterRoomCallback) {
            // result > 0 时为进房耗时（ms），result < 0 时为进房错误码。
            if (result >= 0) {
                self.enterRoomCallback(TUIRoomSuccessCode,@"enter room succeed");
            } else {
                self.enterRoomCallback(result, @"enter room failed");
            }
            self.enterRoomCallback = NULL;
        }
    }];
}

- (void)onExitRoom:(NSInteger)reason {
    TRTCLog(@"on exit room (userid=%@ reason=%d)",[TUIRoomUserManage currentUserId],reason);
    [self asyncDelegateQueue:^{
        if ((reason == 0) && self.leaveRoomCallback) {
            self.leaveRoomCallback(0,@"success");
            self.leaveRoomCallback = nil;
        }
    }];
}

- (void)onRemoteUserEnterRoom:(NSString *)userId {
    TRTCLog(@"on remote user enter room (userid=%@)",userId);
    [self asyncDelegateQueue:^{
        if ([self.delegate respondsToSelector:@selector(onUserEnterTRTCRoom:)]) {
            [self.delegate onUserEnterTRTCRoom:userId];
        }
    }];
}

- (void)onRemoteUserLeaveRoom:(NSString *)userId reason:(NSInteger)reason {
    TRTCLog(@"on remote user leave room (userid=%@ reason=%d)",userId,reason);
    TUIRoomUserInfo *userInfo = [TUIRoomUserManage getUser:userId];
    if (userInfo) {
        [self asyncDelegateQueue:^{
            if ([self.delegate respondsToSelector:@selector(onUserLeaveTRTCRoom:)]) {
                [self.delegate onUserLeaveTRTCRoom:userInfo];
            }
        }];
    }
}

- (void)onUserVideoAvailable:(NSString *)userId available:(BOOL)available {
    TRTCLog(@"on user video available (userid=%@ available=%d)",userId,available);
    TUIRoomUserInfo *userInfo = [TUIRoomUserManage getUser:userId];
    if (userInfo) {
        userInfo.isVideoAvailable = available;//本地状态
        [self asyncDelegateQueue:^{
            if ([self.delegate respondsToSelector:@selector(onUserVideoAvailable:available:)]) {
                [self.delegate onUserVideoAvailable:userInfo available:available];
            }
        }];
    } else {
        __weak typeof(self) wealSelf = self;
        [TUIRoomUserManage getUserInfo:userId callback:^(NSInteger code, NSString * _Nonnull message, TUIRoomUserInfo * _Nullable userInfo) {
            if (userInfo) {
                [TUIRoomUserManage cacheUser:userInfo];
                userInfo = [TUIRoomUserManage getUser:userId];
                userInfo.isVideoAvailable = available;//本地状态
                __strong typeof(wealSelf) strongSelf = wealSelf;
                if ([strongSelf.delegate respondsToSelector:@selector(onUserVideoAvailable:available:)]) {
                    [strongSelf.delegate onUserVideoAvailable:userInfo available:available];
                }
            }
        }];
    }
}

- (void)onUserSubStreamAvailable:(NSString *)userId available:(BOOL)available {
    TRTCLog(@"on user subStream available (userid=%@ available=%d)",userId,available);
    __weak typeof(self) wealSelf = self;
    __block TUIRoomUserInfo *currentUserInfo = [TUIRoomUserManage getUser:userId];
    os_block_t block = ^() {
        __strong typeof(wealSelf) strongSelf = wealSelf;
        if (available) {
            if ([strongSelf.delegate respondsToSelector:@selector(onRemoteUserScreenVideoAvailable:available:)]) {
                [strongSelf.delegate onRemoteUserScreenVideoAvailable:userId available:YES];
            }
        } else {
            if ([strongSelf.delegate respondsToSelector:@selector(onRemoteUserScreenVideoAvailable:available:)]) {
                [strongSelf.delegate onRemoteUserScreenVideoAvailable:userId available:NO];
            }
        }
    };
    
    if (currentUserInfo) {
        [self asyncDelegateQueue:^{
            if (block) {
                block();
            }
        }];
    } else {
        [TUIRoomUserManage getUserInfo:userId callback:^(NSInteger code, NSString * _Nonnull message, TUIRoomUserInfo * _Nullable userInfo) {
            if (userInfo) {
                [TUIRoomUserManage cacheUser:userInfo];
                if (block) {
                    block();
                }
            }
        }];
    }
}

- (void)onUserAudioAvailable:(NSString *)userId available:(BOOL)available {
    TUIRoomUserInfo *userInfo = [TUIRoomUserManage getUser:userId];
    if (userInfo) {
        userInfo.isAudioAvailable = available;//本地状态
        if ([self.delegate respondsToSelector:@selector(onUserAudioAvailable:available:)]) {
            [self asyncDelegateQueue:^{
                [self.delegate onUserAudioAvailable:userId available:available];
            }];
        }
    } else {
        __weak typeof(self) wealSelf = self;
        [TUIRoomUserManage getUserInfo:userId callback:^(NSInteger code, NSString * _Nonnull message, TUIRoomUserInfo * _Nullable userInfo) {
            if (userInfo) {
                [TUIRoomUserManage cacheUser:userInfo];
                userInfo = [TUIRoomUserManage getUser:userId];
                userInfo.isAudioAvailable = available;//本地状态
                __strong typeof(wealSelf) strongSelf = wealSelf;
                if ([strongSelf.delegate respondsToSelector:@selector(onUserAudioAvailable:available:)]) {
                    [strongSelf.delegate onUserAudioAvailable:userId available:available];
                }
            }
        }];
    }
}

- (void)onNetworkQuality:(TRTCQualityInfo *)localQuality remoteQuality:(NSArray<TRTCQualityInfo *> *)remoteQuality {
    [self asyncDelegateQueue:^{
        if ([self.delegate respondsToSelector:@selector(onNetworkQuality:remoteQuality:)]) {
            [self.delegate onNetworkQuality:localQuality remoteQuality:remoteQuality];
        }
    }];
}

- (void)onUserVoiceVolume:(NSArray<TRTCVolumeInfo *> *)userVolumes totalVolume:(NSInteger)totalVolume {
    if ([self.delegate respondsToSelector:@selector(onUserVoiceVolume:totalVolume:)]) {
        [self asyncDelegateQueue:^{
            for (TRTCVolumeInfo *info in userVolumes) {
                NSString *userId = (info.userId == nil ? self.enterRoomParams.userId : info.userId);
                [self.delegate onUserVoiceVolume:userId totalVolume:info.volume];
            }
        }];
    }
}

- (void)onSwitchRole:(TXLiteAVError)errCode errMsg:(NSString *)errMsg {
    [self asyncDelegateQueue:^{
        if (self.switchRoleCallback) {
            self.switchRoleCallback(errCode, errMsg);
            self.switchRoleCallback = nil;
        }
    }];
}

- (void)onScreenCaptureStarted {
    [self asyncDelegateQueue:^{
        if ([self.delegate respondsToSelector:@selector(onScreenCaptureStarted)]) {
            [self.delegate onScreenCaptureStarted];
        }
    }];
    TRTCLog(@"on screen capture started");
}

- (void)onScreenCaptureStoped:(int)reason {
    [self asyncDelegateQueue:^{
        if ([self.delegate respondsToSelector:@selector(onScreenCaptureStopped:)]) {
            [self.delegate onScreenCaptureStopped:reason];
        }
    }];
    TRTCLog(@"on screen capture ctoped");
}

- (void)onCameraDidReady {
    TRTCLog(@"on camera did ready");
}

- (void)onMicDidReady {
    TRTCLog(@"on mic did ready");
}

- (void)onAudioRouteChanged:(TRTCAudioRoute)route fromRoute:(TRTCAudioRoute)fromRoute {
    TRTCLog(@"on audio route changed  (route==%d fromRoute=%d)",route,fromRoute);
}

- (void)onSendFirstLocalVideoFrame:(TRTCVideoStreamType)streamType {
    TRTCLog(@"on send first local video frame  (userid==%@ streamType=%d)",[TUIRoomUserManage currentUserId],streamType);
}

- (void)onSendFirstLocalAudioFrame {
    TRTCLog(@"on send first local audio frame  (userid==%@ streamType=%d)",[TUIRoomUserManage currentUserId]);
}

- (void)onStatistics:(TRTCStatistics *)statistics {
    [self asyncDelegateQueue:^{
        if ([self.delegate respondsToSelector:@selector(onStatistics:)]) {
            [self.delegate onStatistics:statistics];
        }
    }];
}

@end
