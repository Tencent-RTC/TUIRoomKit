//
//  Copyright © 2020 Tencent. All rights reserved.
//
//  Module: V2TXLive
//

#import "V2TXLiveDef.h"

/// @defgroup V2TXLivePusherObserver_ios V2TXLivePusherObserver
/// 腾讯云直播推流的回调通知。<br/>
/// V2TXLivePusher 的一些回调事件，包括推流器状态，推流音量，统计信息，警告以及错误信息。
/// @{

@protocol V2TXLivePusherObserver <NSObject>

@optional

/////////////////////////////////////////////////////////////////////////////////
//
//                   直播推流器事件回调
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 直播推流器错误通知，推流器出现错误时，会回调该通知
 *
 * @param code      错误码 {@link V2TXLiveCode}
 * @param msg       错误信息
 * @param extraInfo 扩展信息
 */
- (void)onError:(V2TXLiveCode)code message:(NSString *)msg extraInfo:(NSDictionary *)extraInfo;

/**
 * 直播推流器警告通知
 *
 * @param code      警告码 {@link V2TXLiveCode}
 * @param msg       警告信息
 * @param extraInfo 扩展信息
 */
- (void)onWarning:(V2TXLiveCode)code message:(NSString *)msg extraInfo:(NSDictionary *)extraInfo;

/**
 * 首帧音频采集完成的回调通知
 */
- (void)onCaptureFirstAudioFrame;

/**
 * 首帧视频采集完成的回调通知
 */
- (void)onCaptureFirstVideoFrame;

/**
 * 麦克风采集音量值回调
 *
 * @param volume 音量大小
 * @note  调用 [enableVolumeEvaluation](@ref V2TXLivePusher#enableVolumeEvaluation:) 开启采集音量大小提示之后，会收到这个回调通知。
 */
- (void)onMicrophoneVolumeUpdate:(NSInteger)volume;

/**
 * 推流器连接状态回调通知
 *
 * @param status    推流器连接状态 {@link V2TXLivePushStatus}
 * @param msg       连接状态信息
 * @param extraInfo 扩展信息
 */
- (void)onPushStatusUpdate:(V2TXLivePushStatus)status message:(NSString *)msg extraInfo:(NSDictionary *)extraInfo;

/**
 * 直播推流器统计数据回调
 *
 * @param statistics 推流器统计数据 {@link V2TXLivePusherStatistics}
 */
- (void)onStatisticsUpdate:(V2TXLivePusherStatistics *)statistics;

/**
 * 截图回调
 *
 * @param image 已截取的视频画面
 * @note 调用 [snapshot](@ref V2TXLivePusher#snapshot) 截图之后，会收到这个回调通知
 */
- (void)onSnapshotComplete:(TXImage *)image;

/**
 * 自定义视频处理回调
 *
 * @note 需要调用 [enableCustomVideoProcess](@ref V2TXLivePusher#enableCustomVideoProcess:pixelFormat:bufferType:)
 *       开启自定义视频处理，才会收到这个回调通知。
 *
 * 【情况一】美颜组件会产生新的纹理
 * 如果您使用的美颜组件会在处理图像的过程中产生一帧全新的纹理（用于承载处理后的图像），那请您在回调函数中将 dstFrame.textureId 设置为新纹理的 ID。
 * <pre>
 *   - (void) onProcessVideoFrame:(V2TXLiveVideoFrame * _Nonnull)srcFrame dstFrame:(V2TXLiveVideoFrame * _Nonnull)dstFrame
 *   {
 *       GLuint dstTextureId = renderItemWithTexture(srcFrame.textureId, srcFrame.width, srcFrame.height);
 *       dstFrame.textureId = dstTextureId;
 *       return 0;
 *   }
 * </pre>
 *
 * 【情况二】美颜组件并不自身产生新纹理
 * 如果您使用的第三方美颜模块并不生成新的纹理，而是需要您设置给该模块一个输入纹理和一个输出纹理，则可以考虑如下方案：
 * <pre>
 *   - (void) onProcessVideoFrame:(V2TXLiveVideoFrame * _Nonnull)srcFrame dstFrame:(V2TXLiveVideoFrame * _Nonnull)dstFrame
 *   {
 *       thirdparty_process(srcFrame.textureId, srcFrame.width, srcFrame.height, dstFrame.textureId);
 *       return 0;
 *   }
 * </pre>
 *
 * @param srcFrame 用于承载未处理的视频画面
 * @param dstFrame 用于承载处理过的视频画面
 */
- (void)onProcessVideoFrame:(V2TXLiveVideoFrame *_Nonnull)srcFrame dstFrame:(V2TXLiveVideoFrame *_Nonnull)dstFrame;

/**
 * SDK 内部的 OpenGL 环境的销毁通知
 */
- (void)onGLContextDestroyed;

/**
 * 设置云端的混流转码参数的回调，对应于 [setMixTranscodingConfig](@ref V2TXLivePusher#setMixTranscodingConfig:) 接口
 *
 * @param code 0表示成功，其余值表示失败
 * @param msg 具体错误原因
 */
- (void)onSetMixTranscodingConfig:(V2TXLiveCode)code message:(NSString *)msg;

/**
 * 当屏幕分享开始时，SDK 会通过此回调通知
 */
- (void)onScreenCaptureStarted;

/**
 * 当屏幕分享停止时，SDK 会通过此回调通知
 *
 * @param reason 停止原因
 *               - 0：表示用户主动停止；
 *               - 1：表示屏幕分享窗口被关闭；
 *               - 2：表示屏幕分享的显示屏状态变更（如接口被拔出、投影模式变更等）
 */
- (void)onScreenCaptureStopped:(int)reason;

@end
/// @}
