//
//  TUIRoomTRTCService.h
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIRoomDefine.h"

NS_ASSUME_NONNULL_BEGIN
FOUNDATION_EXPORT void tuiRoomLog(NSString *format, ...);
// 使用TRTCCloud apiLog，日志会写入本地
#define TRTCLog(fmt, ...) tuiRoomLog((@"TUIRoom:%s [Line %d] " fmt), __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__)

/**
 TRTC Service Delegate
 */
@protocol TUIRoomTRTCServiceDelegate <NSObject>
/// 错误回调
/// @param code 错误码
/// @param message 错误信息
- (void)onTRTCError:(int)code
            message:(NSString*)message;

/**
* 新成员进房回调
*
* @param userId 用户ID
*/
- (void)onUserEnterTRTCRoom:(NSString *)userId;

/**
* 成员离开房间回调
*
* @param userInfo 离开房间成员
*/
- (void)onUserLeaveTRTCRoom:(TUIRoomUserInfo *)userInfo;

/**
 * 远端用户发布/取消了主路视频画面回调
 *
 * @param userInfo 远端用户
 * @param available 该用户是否发布（或取消发布）了主路视频画面，YES: 发布；NO：取消发布。
 */
- (void)onUserVideoAvailable:(TUIRoomUserInfo *)userInfo
                   available:(BOOL)available;

/**
 * 远端用户发布/取消了自己的音频
 *
 * @param userId 远端用户的用户标识
 * @param available 该用户是否发布（或取消发布）了自己的音频，YES: 发布；NO：取消发布。
 */
- (void)onUserAudioAvailable:(NSString *)userId
                   available:(BOOL)available;

/**
 * 网络质量的实时统计回调
 *
 * @param localQuality 上行网络质量
 * @param remoteQuality 下行网络质量
 */
- (void)onNetworkQuality:(TRTCQualityInfo *)localQuality
           remoteQuality:(NSArray<TRTCQualityInfo *> *)remoteQuality;

/**
 * 音量大小的反馈回调
 *
 * @param userId 远端用户的用户标识
 * @param totalVolume 所有远端用户的总音量大小, 取值范围 0 - 100。
 */
- (void)onUserVoiceVolume:(NSString *)userId
              totalVolume:(NSInteger)totalVolume;

/**
 * 录屏开始通知
 */
- (void)onScreenCaptureStarted;

/**
 * 录屏停止通知
 *
 * @param reason 停止原因，0：用户主动停止；1：被其他应用抢占导致停止
 */
- (void)onScreenCaptureStopped:(NSInteger)reason;

/**
 * 成员 开启/关闭 视频分享的通知
 *
 * @param userId    用户ID
 * @param available 是否有屏幕分享流数据
 */
- (void)onRemoteUserScreenVideoAvailable:(NSString *)userId
                               available:(BOOL)available;

/**
 * 技术指标统计回调
 *
 * 如果您是熟悉音视频领域相关术语，可以通过这个回调获取 SDK 的所有技术指标。
 * 如果您是首次开发音视频相关项目，可以只关注 onNetworkQuality 回调，每2秒回调一次。
 *
 * @param statistics 统计数据，包括本地和远程的
 */
- (void)onStatistics:(TRTCStatistics *)statistics;

@end

/**
 TRTC Service
 */
@interface TUIRoomTRTCService : NSObject

/**
 * 设置回调
 *
 */
@property(nonatomic, weak) id<TUIRoomTRTCServiceDelegate> delegate;


/**
 * 进入会议（其他参会者调用）
 *
 * @param roomInfo roomInfo
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)enterRTCRoom:(TUIRoomInfo *)roomInfo
            callback:(TUIRoomActionCallback)callback;

/**
 * 退出房间
 *
 * @param callback 事件回调
*/
- (void)leaveRoom:(nullable TUIRoomActionCallback)callback;


/**
 * 角色切换成主播
 *
 * @param callback 事件回调
*/
- (void)switchToAnchor:(nullable TUIRoomActionCallback)callback;

/**
 * 角色切换成观众
 *
 * @param callback 事件回调
*/
- (void)switchToAudience:(nullable TUIRoomActionCallback)callback;

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
               callback:(TUIRoomActionCallback)callback;


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
              callback:(TUIRoomActionCallback)callback;

/**
 * 暂停/恢复订阅远端用户的视频流
 *
 * @param userId 用户id
 * @param mute true：暂停  false：恢复
 */
- (void)muteRemoteVideoStream:(NSString *)userId
                         type:(TUIRoomStreamType)type
                         mute:(BOOL)mute;

/**
 * 切换前后摄像头
 *
 * @param isFront true：前置摄像头；false：后置摄像头。
 */
- (void)switchCamera:(BOOL)isFront;

/**
 * 判断当前是否为前置摄像头
 * @return yes/no
 */
- (BOOL)isFrontCamera;

/**
 * 设置分辨率
 *
 * @param resolution 视频分辨率
 */
- (void)setVideoResolution:(TRTCVideoResolution)resolution;

/**
 * 设置帧率
 *
 * @param fps 帧率数
 */
- (void)setVideoFps:(int)fps;

/**
 * 设置码率
 *
 * @param bitrate 码率，单位：kbps
 */
- (void)setVideoBitrate:(int)bitrate;

/**
 * 设置本地画面镜像预览模式
 *
 * @param type 本地视频预览镜像类型
 */
- (void)setLocalViewMirror:(TRTCVideoMirrorType)type;

/**
 * 设置网络qos参数
 *
 * @param preference 网络流控策略
 */
- (void)setVideoQosPreference:(TRTCNetworkQosParam *)preference;
    
/**
 * 开启麦克风采集
 */
- (void)startMicrophone;

/**
 * 停止麦克风采集
 */
- (void)stopMicrophone;

/**
 * 设置音质
 *
 * @param quality 音质
 */
- (void)setAudioQuality:(TRTCAudioQuality)quality;

/**
 * 开启本地静音
 *
 * @param mute 是否静音
 */
- (void)muteLocalAudio:(BOOL)mute;

/**
 * 设置开启扬声器
 *
 * @param useSpeaker true：扬声器 false：听筒
 */
- (void)setSpeaker:(BOOL)useSpeaker;

/**
 * 设置麦克风采集音量
 *
 * @param volume 采集音量 0-100
 */
- (void)setAudioCaptureVolume:(NSInteger)volume;

/**
 * 设置播放音量
 *
 * @param volume 播放音量 0-100
 */
- (void)setAudioPlayoutVolume:(NSInteger)volume;

/**
 * 开始录音
 *
 * 该方法调用后， SDK 会将通话过程中的所有音频（包括本地音频，远端音频，BGM 等）录制到一个文件里。
 * 无论是否进房，调用该接口都生效。
 * 如果调用 exitMeeting 时还在录音，录音会自动停止。
 * @param params 录音参数
 */
- (void)startFileDumping:(TRTCAudioRecordingParams *)params;

/**
 * 停止录音
 *
 * 如果调用 exitMeeting 时还在录音，录音会自动停止。
 */
- (void)stopFileDumping;

/**
 * 启用音量大小提示
 *
 * 开启后会在 onUserVolumeUpdate 中获取到 SDK 对音量大小值的评估。
 * @param enable true：打开  false：关闭
 */
- (void)enableAudioEvaluation:(BOOL)enable;

/**
 * 资源释放
 *
 * @note 持有此对象，在dealloc时候调用此方法
 */
- (void)releaseResources;

/**
 * 获取getStreamId
 *
 */
- (NSString *)getStreamId;

@end

NS_ASSUME_NONNULL_END
