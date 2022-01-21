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

// 打印一些关键log到本地日志中
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

/// 进房参数缓存
@property (nonatomic, strong) TRTCParams *enterRoomParams;
/// 进房成功回调
@property (nonatomic, strong) TUIRoomActionCallback enterRoomCallback;
/// 退房成功回调
@property (nonatomic, strong) TUIRoomActionCallback leaveRoomCallback;
/// 切换角色
@property (nonatomic, strong) TUIRoomActionCallback switchRoleCallback;

@end

@implementation TUIRoomTRTCService

#pragma mark 初始化
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

/**
 * 进入会议（其他参会者调用）
 *
 * @param callback 结果回调，成功时 code 为0.
 */
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
        params.role = TRTCRoleAnchor; // 主播角色
    } else {
        params.role = TRTCRoleAudience; // 观众
    }
    params.streamId = streamId;
    [self setFramework];
    [[TRTCCloud sharedInstance] enterRoom:params appScene:TRTCAppSceneLIVE];
}

/**
 * 退出房间
 *
 * @param callback 事件回调
*/
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

/**
 * 角色切换成主播
 *
 * @param callback 事件回调
*/
- (void)switchToAnchor:(nullable TUIRoomActionCallback)callback {
    self.switchRoleCallback = callback;
    [[TRTCCloud sharedInstance] switchRole:TRTCRoleAnchor];
    [[TRTCCloud sharedInstance] startLocalAudio:TRTCAudioQualitySpeech];
}

/**
 * 角色切换成观众
 *
 * @param callback 事件回调
*/
- (void)switchToAudience:(nullable TUIRoomActionCallback)callback {
    self.switchRoleCallback = callback;
    [[TRTCCloud sharedInstance] stopLocalAudio];
    [[TRTCCloud sharedInstance] switchRole:TRTCRoleAudience];
}

/**
 * 播放远端视频画面
 *
 * @param userId 需要观看的用户id
 * @param view 承载视频画面的 view 控件
 * @param type 流类型
 * @param callback 操作回调
 * @note 在 onUserVideoAvailable 为 true 回调时，调用这个接口
 */
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

/**
 * 取消订阅远端用户的视频流
 *
 * @param userId 对方的用户信息
 * @param type 流类型
 * @param callback 操作回调
 *
 */
- (void)stopRemoteView:(NSString *)userId
                  type:(TUIRoomStreamType)type
              callback:(TUIRoomActionCallback)callback {
    [[TRTCCloud sharedInstance] stopRemoteView:userId streamType:GetTUIRoomStreamType(type)];
    if (callback) {
        callback(TUIRoomSuccessCode, @"success");
    }
}

/**
 * 暂停/恢复订阅远端用户的视频流
 *
 * @param userId 用户id
 * @param mute true：暂停  false：恢复
 */
- (void)muteRemoteVideoStream:(NSString *)userId
                         type:(TUIRoomStreamType)type
                         mute:(BOOL)mute {
    [[TRTCCloud sharedInstance] muteRemoteVideoStream:userId streamType:GetTUIRoomStreamType(type) mute:mute];
}

/**
 * 切换前后摄像头
 *
 * @param isFront true：前置摄像头；false：后置摄像头。
 */
- (void)switchCamera:(BOOL)isFront {
    if (isFront != [self isFrontCamera]) {
        [[[TRTCCloud sharedInstance] getDeviceManager] switchCamera:isFront];
    }
}

/**
 * 设置开启扬声器
 *
 * @param useSpeaker true：扬声器 false：听筒
 */
- (void)setSpeaker:(BOOL)useSpeaker {
    if (useSpeaker) {
        [[TRTCCloud sharedInstance] setAudioRoute:TRTCAudioModeSpeakerphone];
    } else {
        [[TRTCCloud sharedInstance] setAudioRoute:TRTCAudioModeEarpiece];
    }
}

/**
 * 判断当前是否为前置摄像头
 * @return yes/no
 */
- (BOOL)isFrontCamera {
    return [[[TRTCCloud sharedInstance] getDeviceManager] isFrontCamera];
}

/**
 * 设置分辨率
 *
 * @param resolution 视频分辨率
 */
- (void)setVideoResolution:(TRTCVideoResolution)resolution {
    _videoResolution = resolution;
    [self updateVideoEncoderParam];
}

/**
 * 设置帧率
 *
 * @param fps 帧率数
 */
- (void)setVideoFps:(int)fps {
    _videoFPS = fps;
    [self updateVideoEncoderParam];
}

/**
 * 设置码率
 *
 * @param bitrate 码率，单位：kbps
 */
- (void)setVideoBitrate:(int)bitrate {
    _videoBitrate = bitrate;
    [self updateVideoEncoderParam];
}

/**
 * 设置本地画面镜像预览模式
 *
 * @param type 本地视频预览镜像类型
 */
- (void)setLocalViewMirror:(TRTCVideoMirrorType)type {
    TRTCRenderParams *params = [[TRTCRenderParams alloc] init];
    params.fillMode = TRTCVideoFillMode_Fill;
    params.rotation = TRTCVideoRotation_0;
    params.mirrorType = type;
    [[TRTCCloud sharedInstance] setLocalRenderParams:params];
}

/**
 * 设置网络qos参数
 *
 * @param preference 网络流控策略
 */
- (void)setVideoQosPreference:(TRTCNetworkQosParam *)preference {
    [[TRTCCloud sharedInstance] setNetworkQosParam:preference];
}

/**
 * 开启麦克风采集
 */
- (void)startMicrophone {
    [[TRTCCloud sharedInstance] startLocalAudio:TRTCAudioQualitySpeech];
}

/**
 * 停止麦克风采集
 */
- (void)stopMicrophone {
    [[TRTCCloud sharedInstance] stopLocalAudio];
}

/**
 * 设置音质
 *
 * @param quality 音质
 */
- (void)setAudioQuality:(TRTCAudioQuality)quality {
    [[TRTCCloud sharedInstance] startLocalAudio:quality];
}

/**
 * 开启本地静音
 *
 * @param mute 是否静音
 */
- (void)muteLocalAudio:(BOOL)mute {
    [[TRTCCloud sharedInstance] muteLocalAudio:mute];
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
 * 设置播放音量
 *
 * @param volume 播放音量 0-100
 */
- (void)setAudioPlayoutVolume:(NSInteger)volume {
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
 * 获取getStreamId
 *
 */
- (NSString *)getStreamId {
    return self.enterRoomParams.streamId;
}

/**
 * 资源释放
 *
 * @note 持有此对象，在dealloc时候调用此方法
 */
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
/**
 * 错误事件回调
 *
 * @param errCode 错误码
 * @param errMsg  错误信息
 * @param extInfo 扩展信息字段，个别错误码可能会带额外的信息帮助定位问题
 */
- (void)onError:(TXLiteAVError)errCode errMsg:(NSString *)errMsg extInfo:(NSDictionary *)extInfo {
    TRTCLog(@"on error (userid=%@ errCode=%d errMsg=%@ extInfo=%@)",[TUIRoomUserManage currentUserId],errCode,errMsg,extInfo);
    [self asyncDelegateQueue:^{
        if (self.delegate && [self.delegate respondsToSelector:@selector(onTRTCError:message:)]) {
            [self.delegate onTRTCError:errCode message:errMsg];
        }
    }];
}

/**
 * 进入房间成功与否的事件回调
 *
 * @param result result > 0 时为进房耗时（ms），result < 0 时为进房错误码。
 */
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

/**
 * 离开房间的事件回调
 *
 * @param reason 离开房间原因，0：主动调用 exitRoom 退出房间；1：被服务器踢出当前房间；2：当前房间整个被解散。
 */
- (void)onExitRoom:(NSInteger)reason {
    TRTCLog(@"on exit room (userid=%@ reason=%d)",[TUIRoomUserManage currentUserId],reason);
    [self asyncDelegateQueue:^{
        if ((reason == 0) && self.leaveRoomCallback) {
            self.leaveRoomCallback(0,@"success");
            self.leaveRoomCallback = nil;
        }
    }];
}

/**
 * 有用户加入当前房间
 *
 * @param userId 远端用户的用户标识
 */
- (void)onRemoteUserEnterRoom:(NSString *)userId {
    TRTCLog(@"on remote user enter room (userid=%@)",userId);
    [self asyncDelegateQueue:^{
        if ([self.delegate respondsToSelector:@selector(onUserEnterTRTCRoom:)]) {
            [self.delegate onUserEnterTRTCRoom:userId];
        }
    }];
}

/**
 * 有用户离开当前房间
 *
 * @param userId 远端用户的用户标识
 * @param reason 离开原因，0表示用户主动退出房间，1表示用户超时退出，2表示被踢出房间。
 */
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

/**
 * 某远端用户发布/取消了主路视频画面
 *
 * @param userId 远端用户的用户标识
 * @param available 该用户是否发布（或取消发布）了主路视频画面，YES: 发布；NO：取消发布。
 */
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

/**
 * 某远端用户发布/取消了辅路视频画面
 *
 * “辅路画面”一般被用于承载屏幕分享的画面。当您收到 onUserSubStreamAvailable(userId, YES) 通知时，表示该路画面已经有可播放的视频帧到达。
 * 此时，您需要调用 {@link startRemoteSubStreamView} 接口订阅该用户的远程画面，订阅成功后，您会继续收到该用户的首帧画面渲染回调 onFirstVideoFrame(userid)。
 *
 * @param userId 远端用户的用户标识
 * @param available 该用户是否发布（或取消发布）了辅路视频画面，YES: 发布；NO：取消发布。
 */
- (void)onUserSubStreamAvailable:(NSString *)userId available:(BOOL)available {
    TRTCLog(@"on user subStream available (userid=%@ available=%d)",userId,available);
    __weak typeof(self) wealSelf = self;
    __block TUIRoomUserInfo *currentUserInfo = [TUIRoomUserManage getUser:userId];
    os_block_t block = ^() {
        __strong typeof(wealSelf) strongSelf = wealSelf;
        if (available) {
            // 有一条新的辅流进来
            if ([strongSelf.delegate respondsToSelector:@selector(onRemoteUserScreenVideoAvailable:available:)]) {
                [strongSelf.delegate onRemoteUserScreenVideoAvailable:userId available:YES];
            }
        } else {
            // 有一条新的辅流离开了
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

/**
 * 某远端用户发布/取消了自己的音频
 *
 * @param userId 远端用户的用户标识
 * @param available 该用户是否发布（或取消发布）了自己的音频，YES: 发布；NO：取消发布。
 */
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

/**
 * 网络质量的实时统计回调
 *
 * @param localQuality 上行网络质量
 * @param remoteQuality 下行网络质量
 */
- (void)onNetworkQuality:(TRTCQualityInfo *)localQuality remoteQuality:(NSArray<TRTCQualityInfo *> *)remoteQuality {
    [self asyncDelegateQueue:^{
        if ([self.delegate respondsToSelector:@selector(onNetworkQuality:remoteQuality:)]) {
            [self.delegate onNetworkQuality:localQuality remoteQuality:remoteQuality];
        }
    }];
}

/**
 * 音量大小的反馈回调
 *
 * @param userVolumes 是一个数组，用于承载所有正在说话的用户的音量大小，取值范围 0 - 100。
 * @param totalVolume 所有远端用户的总音量大小, 取值范围 0 - 100。
 */
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

/**
 * 切换角色的事件回调
 *
 * @param errCode 错误码
 * @param errMsg  错误信息。
 */
- (void)onSwitchRole:(TXLiteAVError)errCode errMsg:(NSString *)errMsg {
    [self asyncDelegateQueue:^{
        if (self.switchRoleCallback) {
            self.switchRoleCallback(errCode, errMsg);
            self.switchRoleCallback = nil;
        }
    }];
}

/**
 * 录屏开始通知
 */
- (void)onScreenCaptureStarted {
    [self asyncDelegateQueue:^{
        if ([self.delegate respondsToSelector:@selector(onScreenCaptureStarted)]) {
            [self.delegate onScreenCaptureStarted];
        }
    }];
    TRTCLog(@"on screen capture started");
}

/**
 * 录屏停止通知
 *
 * @param reason 停止原因，0：用户主动停止；1：被其他应用抢占导致停止
 */
- (void)onScreenCaptureStoped:(int)reason {
    [self asyncDelegateQueue:^{
        if ([self.delegate respondsToSelector:@selector(onScreenCaptureStopped:)]) {
            [self.delegate onScreenCaptureStopped:reason];
        }
    }];
    TRTCLog(@"on screen capture ctoped");
}

/**
 * 摄像头准备就绪
 *
 */
- (void)onCameraDidReady {
    TRTCLog(@"on camera did ready");
}

/**
 * 麦克风准备就绪
 *
 */
- (void)onMicDidReady {
    TRTCLog(@"on mic did ready");
}

/**
 * 当前音频路由发生变化
 *
 * 所谓“音频路由”，是指声音是从手机的扬声器还是从听筒中播放出来，音频路由变化也就是声音的播放位置发生了变化。
 * - 当音频路由为听筒时，声音比较小，只有将耳朵凑近才能听清楚，隐私性较好，适合用于接听电话。
 * - 当音频路由为扬声器时，声音比较大，不用将手机贴脸也能听清，因此可以实现“免提”的功能。
 *
 * @param route 音频路由，即声音由哪里输出（扬声器、听筒）。
 * @param fromRoute 变更前的音频路由。
 */
- (void)onAudioRouteChanged:(TRTCAudioRoute)route fromRoute:(TRTCAudioRoute)fromRoute {
    TRTCLog(@"on audio route changed  (route==%d fromRoute=%d)",route,fromRoute);
}

/**
 * 自己本地的首个视频帧已被发布出去
 *
 * @param streamType 视频流类型：主路（Main）一般用于承载摄像头画面，辅路（Sub）一般用于承载屏幕分享画面。
 */
- (void)onSendFirstLocalVideoFrame:(TRTCVideoStreamType)streamType {
    TRTCLog(@"on send first local video frame  (userid==%@ streamType=%d)",[TUIRoomUserManage currentUserId],streamType);
}

/**
 * 自己本地的首个音频帧已被发布出去
 *
 * 当 SDK 成功地向云端送出自己的第一帧音频数据帧以后，就会抛出 onSendFirstLocalAudioFrame 事件回调。
 */
- (void)onSendFirstLocalAudioFrame {
    TRTCLog(@"on send first local audio frame  (userid==%@ streamType=%d)",[TUIRoomUserManage currentUserId]);
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
    [self asyncDelegateQueue:^{
        if ([self.delegate respondsToSelector:@selector(onStatistics:)]) {
            [self.delegate onStatistics:statistics];
        }
    }];
}

@end
