/*
 * Module:   TRTCCloud @ TXLiteAVSDK
 *
 * Function: 腾讯云视频通话功能的主要接口类
 *
 * Version: 8.5.10028
 */

#import <Foundation/Foundation.h>
#import <VideoToolbox/VideoToolbox.h>
#import "TRTCCloudDelegate.h"
#import "TRTCCloudDef.h"
#import "TXBeautyManager.h"
#import "TXAudioEffectManager.h"
#import "TXDeviceManager.h"

/// @defgroup TRTCCloud_ios TRTCCloud
/// 腾讯云视频通话功能的主要接口类
/// @{
@interface TRTCCloud : NSObject

// 请使用 +sharedIntance 方法
+ (instancetype)new  __attribute__((unavailable("Use +sharedInstance instead")));
- (instancetype)init __attribute__((unavailable("Use +sharedInstance instead")));


/////////////////////////////////////////////////////////////////////////////////
//
//                      SDK 基础函数
//
/////////////////////////////////////////////////////////////////////////////////

/// @name 创建与销毁
/// @{

/**
*  创建 TRTCCloud 单例
*/
+ (instancetype)sharedInstance;

/**
*  销毁 TRTCCloud 单例
*/
+ (void)destroySharedIntance;

/**
*  设置回调接口 TRTCCloudDelegate
*
*  您可以通过 TRTCCloudDelegate 获得来自 SDK 的各种状态通知，详见 TRTCCloudDelegate.h 中的定义
*/
@property (nonatomic, weak) id<TRTCCloudDelegate> delegate;

/**
*  设置驱动 TRTCCloudDelegate 回调的队列
*
*  SDK 默认会采用 Main Queue 作为驱动 TRTCCloudDelegate。如果您不指定自己的 delegateQueue，
*  SDK 的 TRTCCloudDelegate 回调都将由 Main Queue 来调用。此时您在 TRTCCloudDelegate 的回调函数里操作 UI 是线程安全的。
*/
@property (nonatomic, strong) dispatch_queue_t delegateQueue;

/// @}

/////////////////////////////////////////////////////////////////////////////////
//
//                      （一）房间相关接口函数
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 房间相关接口函数
/// @name 房间相关接口函数
/// @{

/**
 * 1.1 进入房间
 *
 * 调用接口后，您会收到来自 TRTCCloudDelegate 中的 onEnterRoom(result) 回调:
 * - 如果加入成功，result 会是一个正数（result > 0），表示加入房间的时间消耗，单位是毫秒（ms）。
 * - 如果加入失败，result 会是一个负数（result < 0），表示进房失败的错误码。
 *
 * 进房失败的错误码含义请参见[错误码](https://cloud.tencent.com/document/product/647/32257)。
 *
 *  - 【视频通话】{@link TRTCAppSceneVideoCall}：<br>
 *     能力：支持720P、1080P高清画质，单个房间最多支持300人同时在线，最高支持50人同时发言。<br>
 *     适用：[1对1视频通话]、[300人视频会议]、[在线问诊]、[视频聊天]、[远程面试]等。<br>
 *  - 【语音通话】{@link TRTCAppSceneAudioCall}：<br>
 *     能力：支持 48kHz，支持双声道。单个房间最多支持300人同时在线，最高支持50人同时发言。<br>
 *     适用：[[1对1语音通话]、[300人语音会议]、[语音聊天]、[语音会议]、[在线狼人杀]等。<br>
 *  - 【连麦直播】{@link TRTCAppSceneLIVE}：<br>
 *     能力：支持平滑上下麦，切换过程无需等待，主播延时小于300ms；支持十万级别观众同时播放，播放延时低至1000ms。<br>
 *     适用：[视频低延时直播]、[十万人互动课堂]、[视频直播 PK]、[视频相亲房]、[互动课堂]、[远程培训]、[超大型会议]等。<br>
 *  - 【语聊房】{@link TRTCAppSceneVoiceChatRoom}：<br>
 *     能力：支持平滑上下麦，切换过程无需等待，主播延时小于300ms；支持十万级别观众同时播放，播放延时低至1000ms。<br>
 *     适用：[语聊房]、[语音直播连麦]、[K 歌房]、[FM 电台]等。<br>
 *
 * @param param 进房参数，请参考 TRTCParams
 * @param scene 应用场景，目前支持视频通话（VideoCall）、连麦直播（Live）、语音通话（AudioCall）、语聊房（VoiceChatRoom）四种场景。
 *
 * @note
 *  1. 当 scene 选择为 TRTCAppSceneLIVE 或 TRTCAppSceneVoiceChatRoom 时，您必须通过 TRTCParams 中的 role 字段指定当前用户的角色。<br>
 *  2. 不管进房是否成功，enterRoom 都必须与 exitRoom 配对使用，在调用 exitRoom 前再次调用 enterRoom 函数会导致不可预期的错误问题。
 */
- (void)enterRoom:(TRTCParams *)param appScene:(TRTCAppScene)scene;

/**
 * 1.2 离开房间
 *
 * 调用 exitRoom() 接口会执行退出房间的相关逻辑，例如释放音视频设备资源和编解码器资源等。
 * 待资源释放完毕，SDK 会通过 TRTCCloudDelegate 中的 onExitRoom() 回调通知到您。
 *
 * 如果您要再次调用 enterRoom() 或者切换到其他的音视频 SDK，请等待 onExitRoom() 回调到来之后再执行相关操作。
 * 否则可能会遇到摄像头或麦克风（例如 iOS 里的 AudioSession）被占用等各种异常问题。
 */
- (void)exitRoom;


/**
 * 1.3 切换角色，仅适用于直播场景（TRTCAppSceneLIVE 和 TRTCAppSceneVoiceChatRoom）
 *
 * 在直播场景下，一个用户可能需要在“观众”和“主播”之间来回切换。
 * 您可以在进房前通过 TRTCParams 中的 role 字段确定角色，也可以通过 switchRole 在进房后切换角色。
 *
 * @param role 目标角色，默认为主播：
 *  - {@link TRTCRoleAnchor} 主播，可以上行视频和音频，一个房间里最多支持50个主播同时上行音视频。
 *  - {@link TRTCRoleAudience} 观众，只能观看，不能上行视频和音频，一个房间里的观众人数没有上限。
 */
-(void)switchRole:(TRTCRoleType)role;


/**
 * 1.4 请求跨房通话（主播 PK）
 *
 * TRTC 中两个不同音视频房间中的主播，可以通过“跨房通话”功能拉通连麦通话功能。使用此功能时，
 * 两个主播无需退出各自原来的直播间即可进行“连麦 PK”。
 *
 * 例如：当房间“001”中的主播 A 通过 connectOtherRoom() 跟房间“002”中的主播 B 拉通跨房通话后，
 * 房间“001”中的用户都会收到主播 B 的 onUserEnter(B) 回调和 onUserVideoAvailable(B,YES) 回调。
 * 房间“002”中的用户都会收到主播 A 的 onUserEnter(A) 回调和 onUserVideoAvailable(A,YES) 回调。
 *
 * 简言之，跨房通话的本质，就是把两个不同房间中的主播相互分享，让每个房间里的观众都能看到两个主播。
 *
 * <pre>
 *                 房间 001                     房间 002
 *               -------------               ------------
 *  跨房通话前：| 主播 A      |             | 主播 B     |
 *              | 观众 U V W  |             | 观众 X Y Z |
 *               -------------               ------------
 *
 *                 房间 001                     房间 002
 *               -------------               ------------
 *  跨房通话后：| 主播 A B    |             | 主播 B A   |
 *              | 观众 U V W  |             | 观众 X Y Z |
 *               -------------               ------------
 * </pre>
 *
 * 跨房通话的参数考虑到后续扩展字段的兼容性问题，暂时采用了 JSON 格式的参数，要求至少包含两个字段：
 * - roomId：房间“001”中的主播 A 要跟房间“002”中的主播 B 连麦，主播 A 调用 connectOtherRoom() 时 roomId 应指定为“002”。
 * - userId：房间“001”中的主播 A 要跟房间“002”中的主播 B 连麦，主播 A 调用 connectOtherRoom() 时 userId 应指定为 B 的 userId。
 *
 * 跨房通话的请求结果会通过 TRTCCloudDelegate 中的 onConnectOtherRoom() 回调通知给您。
 *
 * <pre>
 *   NSMutableDictionary * jsonDict = [[NSMutableDictionary alloc] init];
 *   [jsonDict setObject:@(002) forKey:@"roomId"];
 *   [jsonDict setObject:@"userB" forKey:@"userId"];
 *   NSData* jsonData = [NSJSONSerialization dataWithJSONObject:jsonDict options:NSJSONWritingPrettyPrinted error:nil];
 *   NSString* jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
 *   [trtc connectOtherRoom:jsonString];
 * </pre>
 *
 * @param param JSON 字符串连麦参数，roomId 代表目标房间号，userId 代表目标用户 ID。
 *
 **/
- (void)connectOtherRoom:(NSString *)param;

/**
 * 1.5 退出跨房通话
 *
 * 跨房通话的退出结果会通过 TRTCCloudDelegate 中的 onDisconnectOtherRoom() 回调通知给您。
 **/
- (void)disconnectOtherRoom;

/**
 * 1.6 设置音视频数据接收模式，需要在进房前设置才能生效
 *
 * 为实现进房秒开的绝佳体验，SDK 默认进房后自动接收音视频。即在您进房成功的同时，您将立刻收到远端所有用户的音视频数据。
 * 若您没有调用 startRemoteView，视频数据将自动超时取消。
 * 若您主要用于语音聊天等没有自动接收视频数据需求的场景，您可以根据实际需求选择接收模式，以免产生预期之外的视频时长费用。
 *
 * @param autoRecvAudio YES：自动接收音频数据；NO：需要调用 muteRemoteAudio 进行请求或取消。默认值：YES
 * @param autoRecvVideo YES：自动接收视频数据；NO：需要调用 startRemoteView/stopRemoteView 进行请求或取消。默认值：YES
 *
 * @note 需要在进房前设置才能生效。
 **/
- (void)setDefaultStreamRecvMode:(BOOL)autoRecvAudio video:(BOOL)autoRecvVideo;

/**
* 1.7 创建子 TRTCCloud 实例
*
* 子 TRTCCloud 实例用于进入其他房间，观看其他房间主播的音视频流，还可以在不同的房间之间切换推送音视频流。
*
* 此接口主要应用于类似超级小班课这种需要进入多个房间推拉流的场景。
*
* <pre>
*   TRTCCloud *mainCloud = [TRTCCloud sharedInstance];
*   // 1、mainCloud 进房并开始推送音视频流。
*   // 2、创建子 TRTCCloud 实例并进入其他房间。
*   TRTCCloud *subCloud = [mainCloud createSubCloud];
*   [subCloud enterRoom:params appScene:scene)];
*
*   // 3、切换房间推送音视频流。
*   // 3.1、mainCloud 停止推送音视频流。
*   [mainCloud switchRole:TRTCRoleAudience];
*   [mainCloud muteLocalVideo:true];
*   [mainCloud muteLocalAudio:true];
*   // 3.2、subCLoud 推送音视频流。
*   [subCloud switchRole:TRTCRoleAnchor];
*   [subCloud muteLocalVideo:false];
*   [subCloud muteLocalAudio:false];
*
*   // 4、subCLoud 退房。
*   [subCloud exitRoom];
*
*   // 5、销毁 subCLoud。
*   [mainCloud destroySubCloud:subCloud];
* </pre>
*
* @return 子 TRTCCloud 实例
* @note
*  - 同一个用户，可以使用同一个 userId 进入多个不同 roomId 的房间。
*  - 两台手机不可以同时使用同一个 userId 进入同一个 roomId 的房间。
*  - 通过 createSubCloud 接口创建出来的子房间 TRTCCloud 实例有一个能力限制：不能调用子实例中与本地音视频
*    相关的接口（除了 switchRole、muteLocalVideo 和 muteLocalAudio 之外）， 设置美颜等接口请使用
*    原 TRTCCloud 实例对象。
*  - 同一个用户，同时只能在一个 TRTCCloud 实例中推流，在不同房间同时推流会引发云端的状态混乱，导致各种 bug。
*/
- (TRTCCloud *)createSubCloud;

/**
 * 1.8 销毁子 TRTCCloud 实例
 */
- (void)destroySubCloud:(TRTCCloud *)subCloud;

/**
 * 1.9 切换房间
 *
 * 调用接口后，会退出原来的房间，并且停止原来房间的音视频数据发送和所有远端用户的音视频播放，但不会停止本地视频的预览。
 * 进入新房间成功后，会自动恢复原来的音视频数据发送状态。
 *
 * 接口调用结果会通过 TRTCCloudDelegate 中的 onSwitchRoom(errCode, errMsg) 回调。
 */
- (void)switchRoom:(TRTCSwitchRoomConfig *)config;

/// @}

/////////////////////////////////////////////////////////////////////////////////
//
//                      （二）CDN 相关接口函数
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - CDN 相关接口函数

/// @name CDN 相关接口函数
/// @{

/**
 * 2.1 开始向腾讯云的直播 CDN 推流
 *
 * 该接口会指定当前用户的音视频流在腾讯云 CDN 所对应的 StreamId，进而可以指定当前用户的 CDN 播放地址。
 *
 * 例如：如果我们采用如下代码设置当前用户的主画面 StreamId 为 user_stream_001，那么该用户主画面对应的 CDN 播放地址为：
 * “http://yourdomain/live/user_stream_001.flv”，其中 yourdomain 为您自己备案的播放域名，
 * 您可以在直播[控制台](https://console.cloud.tencent.com/live) 配置您的播放域名，腾讯云不提供默认的播放域名。
 *
 * <pre>
 *  TRTCCloud *trtcCloud = [TRTCCloud sharedInstance];
 *  [trtcCloud enterRoom:params appScene:TRTCAppSceneLIVE];
 *  [trtcCloud startLocalPreview:frontCamera view:localView];
 *  [trtcCloud startLocalAudio];
 *  [trtcCloud startPublishing: @"user_stream_001" type:TRTCVideoStreamTypeBig];
 *
 * </pre>
 *
 * 您也可以在设置 enterRoom 的参数 TRTCParams 时指定 streamId, 而且我们更推荐您采用这种方案。
 *
 * @param streamId 自定义流 ID。
 * @param type 仅支持TRTCVideoStreamTypeBig 和 TRTCVideoStreamTypeSub。
 * @note 您需要先在实时音视频 [控制台](https://console.cloud.tencent.com/rav/) 中的功能配置页开启“启用旁路推流”才能生效。
 *  - 若您选择“指定流旁路”，则您可以通过该接口将对应音视频流推送到腾讯云 CDN 且指定为填写的流 ID。
 *  - 若您选择“全局自动旁路”，则您可以通过该接口调整默认的流 ID。
*/
- (void)startPublishing:(NSString *)streamId type:(TRTCVideoStreamType)type;

/**
 * 2.2 停止向腾讯云的直播 CDN 推流
 */
- (void)stopPublishing;

/**
 * 2.3 开始向友商云的直播 CDN 转推
 *
 * 该接口跟 startPublishing() 类似，但 startPublishCDNStream() 支持向非腾讯云的直播 CDN 转推。
 * @param param CDN 转推参数，请参考 TRTCCloudDef.h 中关于 TRTCPublishCDNParam 的介绍。
 * @note 使用 startPublishing() 绑定腾讯云直播 CDN 不收取额外的费用，但使用 startPublishCDNStream() 绑定非腾讯云直播 CDN 需要收取转推费用。
 */
- (void)startPublishCDNStream:(TRTCPublishCDNParam*)param;

/**
 * 2.4 停止向非腾讯云地址转推
 */
- (void)stopPublishCDNStream;

/**
 * 2.5 设置云端的混流转码参数
 *
 * 如果您在实时音视频 [控制台](https://console.cloud.tencent.com/trtc/) 中的功能配置页开启了“启用旁路直播”功能，
 * 房间里的每一路画面都会有一个默认的直播 [CDN 地址](https://cloud.tencent.com/document/product/647/16826)。
 *
 * 一个直播间中可能有不止一位主播，而且每个主播都有自己的画面和声音，但对于 CDN 观众来说，他们只需要一路直播流，
 * 所以您需要将多路音视频流混成一路标准的直播流，这就需要混流转码。
 *
 * 当您调用 setMixTranscodingConfig() 接口时，SDK 会向腾讯云的转码服务器发送一条指令，目的是将房间里的多路音视频流混合为一路,
 * 您可以通过 mixUsers 参数来调整每一路画面的位置，以及是否只混合声音，也可以通过 videoWidth、videoHeight、videoBitrate 等参数控制混合音视频流的编码参数。
 *
 * <pre>
 * 【画面1】=> 解码 ====> \
 *                         \
 * 【画面2】=> 解码 =>  画面混合 => 编码 => 【混合后的画面】
 *                         /
 * 【画面3】=> 解码 ====> /
 *
 * 【声音1】=> 解码 ====> \
 *                         \
 * 【声音2】=> 解码 =>  声音混合 => 编码 => 【混合后的声音】
 *                         /
 * 【声音3】=> 解码 ====> /
 * </pre>
 *
 * 参考文档：[云端混流转码](https://cloud.tencent.com/document/product/647/16827)。
 *
 * @param config 请参考 TRTCCloudDef.h 中关于 TRTCTranscodingConfig 的介绍。如果传入 nil 则取消云端混流转码。
 * @note 关于云端混流的注意事项：
 *  - 云端转码会引入一定的 CDN 观看延时，大概会增加1 - 2秒。
 *  - 调用该函数的用户，会将连麦中的多路画面混合到自己当前这路画面或者 config 中指定的 streamId 上。
 *  - 请注意，若您还在房间中且不再需要混流，请务必传入 nil 进行取消，因为当您发起混流后，云端混流模块就会开始工作，不及时取消混流可能会引起不必要的计费损失。
 *  - 请放心，您退房时会自动取消混流状态。
 */
- (void)setMixTranscodingConfig:(TRTCTranscodingConfig*)config;


/// @}

/////////////////////////////////////////////////////////////////////////////////
//
//                      （三）视频相关接口函数
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 视频相关接口函数
/// @name 视频相关接口函数
/// @{

#if TARGET_OS_IPHONE
/**
 * 3.1 开启本地视频的预览画面 (iOS 版本)
 *
 * 在 enterRoom 之前调用此函数，SDK 只会开启摄像头，并一直等到您调用 enterRoom 之后才开始推流。
 * 在 enterRoom 之后调用此函数，SDK 会开启摄像头并自动开始视频推流。
 * 当开始渲染首帧摄像头画面时，您会收到 TRTCCloudDelegate 中的 onFirstVideoFrame(nil) 回调。
 *
 * @note 如果希望开播前预览摄像头画面并通过 BeautyManager 调节美颜参数，您可以：
 *   - 方案一：在调用 enterRoom 之前调用 startLocalPreview
 *   - 方案二：在调用 enterRoom 之后调用 startLocalPreview + muteLocalVideo(true)
 * @param frontCamera YES：前置摄像头；NO：后置摄像头。
 * @param view 承载视频画面的控件
 */
- (void)startLocalPreview:(BOOL)frontCamera view:(TXView *)view;
#elif TARGET_OS_MAC
/**
 * 3.1 开启本地视频的预览画面 (Mac 版本)
 *
 * 在调用该方法前，可以先调用 setCurrentCameraDevice 选择使用 Mac 自带摄像头或外接摄像头。
 * 在 enterRoom 之前调用此函数，SDK 只会开启摄像头，并一直等到您调用 enterRoom 之后才开始推流。
 * 在 enterRoom 之后调用此函数，SDK 会开启摄像头并自动开始视频推流。
 * 当开始渲染首帧摄像头画面时，您会收到 TRTCCloudDelegate 中的 onFirstVideoFrame(nil) 回调。
 *
 * @note 如果希望开播前预览摄像头画面并通过 BeautyManager 调节美颜参数，您可以：
 *   - 方案一：在调用 enterRoom 之前调用 startLocalPreview
 *   - 方案二：在调用 enterRoom 之后调用 startLocalPreview + muteLocalVideo(true)
 *
 * @param view 承载视频画面的控件
 */
- (void)startLocalPreview:(TXView *)view;
#endif

/**
 * 3.2 更新本地视频预览画面的窗口
 *
 * @param view 承载视频画面的控件
 */
- (void)updateLocalView:(TXView *)view;

/**
 * 3.3 停止本地视频采集及预览
 */
- (void)stopLocalPreview;

/**
 * 3.4 暂停/恢复推送本地的视频数据
 *
 * 当暂停推送本地视频后，房间里的其它成员将会收到 onUserVideoAvailable(userId, NO) 回调通知
 * 当恢复推送本地视频后，房间里的其它成员将会收到 onUserVideoAvailable(userId, YES) 回调通知
 *
 * @param mute YES：暂停；NO：恢复
 */
- (void)muteLocalVideo:(BOOL)mute;

/**
 * 3.5 设置暂停推送本地视频时要推送的图片
 *
 * 当暂停推送本地视频后，会继续推送该接口设置的图片
 *
 * @param image 设置要推送的图片。 nil 表示不推送
 * @param fps 设置推送图片帧率，最小值为5，最大值为10，默认5。
 */
- (void)setVideoMuteImage:(TXImage *)image fps:(NSInteger)fps;

/**
 * 3.6 开始拉取并显示指定用户的远端画面
 *
 * 该函数会拉取指定 userid 的视频流显示在您指定的 view 控件上，您可以通过 setRemoteRenderParams:streamType:params: 设置显示模式。
 * - 如果您提前知道房间中某个 userid 正在推流，可以直接调用 startRemoteView 显示该用户的远端画面。
 * - 如果您不知道房间中有哪些用户开启了视频，可以在 enterRoom 后等待来自 SDK 的 onUserVideoAvailable(userId, true) 回调通知。
 * 调用 startRemoteView 只是启动拉取，此时画面还需要加载，当加载完毕后 TRTCCloudListener 会通过 onFirstVideoFrame(userId) 通知您。
 *
 * @param userId 指定远端用户的 userId
 * @param streamType 指定要观看 userId 的视频流类型：
 *   - 高清大画面：TRTCVideoStreamTypeBig
 *   - 低清小画面：TRTCVideoStreamTypeSmall
 *   - 辅流（屏幕分享）：TRTCVideoStreamTypeSub
 * @param view 承载视频画面的控件
 * @note 注意几点规则需要您关注：
 *   1. SDK 支持同时观看某 userid 的大画面和辅路，或者小画面和辅路，但不支持同时观看大画面和小画面。
 *   2. 只有当指定的 userid 通过 enableEncSmallVideoStream 开启双路编码后，才能观看该用户的小画面。
 *   3. 如果该用户的小画面不存在，则默认切换到大画面。
 */
- (void)startRemoteView:(NSString *)userId streamType:(TRTCVideoStreamType)streamType view:(TXView *)view;

/**
* 3.7 更新远端视频画面的窗口
*
* @param view 承载视频画面的控件
* @param type 要设置预览窗口的流类型(TRTCVideoStreamTypeBig、TRTCVideoStreamTypeSub)
* @param userId 对方的用户标识
*/
- (void)updateRemoteView:(TXView *)view streamType:(TRTCVideoStreamType)type forUser:(NSString *)userId;

/**
 * 3.8 停止显示远端视频画面，同时不再拉取该远端用户的视频数据流
 *
 * 调用此接口后，SDK 会停止接收该用户的远程视频流，同时会清理相关的视频显示资源。
 *
 * @param userId 指定远端用户的 userId
 * @param streamType 指定要停止观看的 userId 的视频流类型：
 *   - 高清大画面：TRTCVideoStreamTypeBig
 *   - 低清小画面：TRTCVideoStreamTypeSmall
 *   - 辅流（屏幕分享）：TRTCVideoStreamTypeSub

 */
- (void)stopRemoteView:(NSString *)userId streamType:(TRTCVideoStreamType)streamType;

/**
 * 3.9 停止显示所有远端视频画面，同时不再拉取远端用户的视频数据流
 *
 * @note 如果有屏幕分享的画面在显示，则屏幕分享的画面也会一并被关闭。
 */
- (void)stopAllRemoteView;

/**
 * 3.10 暂停/恢复接收指定的远端视频流
 *
 * 该接口仅暂停/恢复接收指定的远端用户的视频流，但并不释放显示资源，视频画面会冻屏在 mute 前的最后一帧。
 *
 * @param userId 对方的用户标识
 * @param mute  是否暂停接收
 * @note 您在 enterRoom 之前或之后调用此 API 均会进入屏蔽状态，屏蔽状态在您调用 exitRoom 之后会被重置为 false。
 */
- (void)muteRemoteVideoStream:(NSString*)userId mute:(BOOL)mute;

/**
 * 3.11 暂停/恢复接收所有远端视频流
 *
 * 该接口仅暂停/恢复接收所有远端用户的视频流，但并不释放显示资源，视频画面会冻屏在 mute 前的最后一帧。
 *
 * @param mute 是否暂停接收
 * @note 您在 enterRoom 之前或之后调用此 API 均会进入屏蔽状态，屏蔽状态在您调用 exitRoom 之后会被重置为 false。
 */
- (void)muteAllRemoteVideoStreams:(BOOL)mute;

/**
 * 3.12 设置视频编码器相关参数
 *
 * 该设置决定了远端用户看到的画面质量（同时也是云端录制出的视频文件的画面质量）
 *
 * @param param 视频编码参数，详情请参考 TRTCCloudDef.h 中的 TRTCVideoEncParam 定义
 */
- (void)setVideoEncoderParam:(TRTCVideoEncParam*)param;

/**
 * 3.13 设置网络流控相关参数
 *
 * 该设置决定 SDK 在各种网络环境下的调控策略（例如弱网下选择“保清晰”或“保流畅”）
 *
 * @param param 网络流控参数，详情请参考 TRTCCloudDef.h 中的 TRTCNetworkQosParam 定义
 */
- (void)setNetworkQosParam:(TRTCNetworkQosParam*)param;

/**
 * 3.14 本地图像的渲染设置
 *
 * @param type 视频线路，可以设置为主路（TRTCVideoStreamTypeBig）或者辅路（TRTCVideoStreamTypeSub）
 * @param params 参见 TRTCCouldDef.h 中对 TRTCRenderParams 的定义
 */
- (void)setLocalRenderParams:(TRTCRenderParams *)params;

/**
 * 3.15 远端图像的渲染设置
 *
 * @param userId 用户 ID
 * @param type 视频线路，可以设置为主路（TRTCVideoStreamTypeBig）或者辅路（TRTCVideoStreamTypeSub）
 * @param params 参见 TRTCCouldDef.h 中对 TRTCRenderParams 的定义
 */
- (void)setRemoteRenderParams:(NSString *)userId streamType:(TRTCVideoStreamType)type params:(TRTCRenderParams *)params;

/**
 * 3.16 设置视频编码输出的画面方向，即设置远端用户观看到的和服务器录制的画面方向
 *
 * 在 iPad、iPhone 等设备180度旋转时，由于摄像头的采集方向没有变，所以对方看到的画面是上下颠倒的，
 * 在这种情况下，您可以通过该接口将 SDK 输出到对方的画面旋转180度，这样可以可以确保对方看到的画面依然正常。
 *
 * @param rotation 目前支持0和180两个旋转角度，默认值：TRTCVideoRotation_0
 */
- (void)setVideoEncoderRotation:(TRTCVideoRotation)rotation;

/**
 * 3.17 设置编码器输出的画面镜像模式
 *
 * 该接口不改变本地摄像头的预览画面，但会改变另一端用户看到的（以及服务器录制的）画面效果。
 *
 * @param mirror 是否开启远端镜像，YES：开启远端画面镜像；NO：关闭远端画面镜像，默认值：NO。
 */
- (void)setVideoEncoderMirror:(BOOL)mirror;

/**
 * 3.18 设置重力感应的适应模式
 *
 * @param mode 重力感应模式，详情请参考 TRTCGSensorMode 的定义，默认值：TRTCGSensorMode_UIAutoLayout
 */
- (void)setGSensorMode:(TRTCGSensorMode) mode;

/**
 * 3.19 开启大小画面双路编码模式
 *
 * 如果当前用户是房间中的主要角色（例如主播、老师、主持人等），并且使用 PC 或者 Mac 环境，可以开启该模式。
 * 开启该模式后，当前用户会同时输出【高清大画面】和【低清小画面】两路视频流（但只有一路音频流）。
 * 对于开启该模式的当前用户，会占用更多的网络带宽，并且会更加消耗 CPU 计算资源。
 *
 * 对于同一房间的远程观众而言：
 * - 如果下行网络很好，可以选择观看【高清大画面】
 * - 如果下行网络较差，可以选择观看【低清小画面】
 *
 * @note 双路编码开启后，会消耗更多的 CPU 和 网络带宽，所以对于 iMac、Windows 或者高性能 Pad 可以考虑开启，但请不要在手机端开启。
 *
 * @param enable 是否开启小画面编码，默认值：NO
 * @param smallVideoEncParam 小流的视频参数
 * @return 0：成功；-1：大画面已经是最低画质
 */
- (int)enableEncSmallVideoStream:(BOOL)enable withQuality:(TRTCVideoEncParam*)smallVideoEncParam;

/**
 * 3.20 切换指定远端用户的大小画面
 * @note
 *   1. 此功能需要该 userId 通过 enableEncSmallVideoStream 提前开启双路编码模式。
 *      如果该 userId 没有开启双路编码模式，则此操作将无任何反应。
 *   2. 在不通过此接口进行设置的情况下，startRemoteView 默认观看的画面为大画面。
 *
 * @param userId 用于指定要观看的 userId
 * @param type 视频流类型，即选择看大画面或小画面，默认为大画面
 */
- (void)setRemoteVideoStreamType:(NSString*)userId type:(TRTCVideoStreamType)type;

/**
* 3.21 视频画面截图
*
* 截取本地、远程主路和远端辅流的视频画面，并通过 UIImage(iOS) 或 NSImage(macOS) 对象返回给您。
*
* @param userId 用户 ID，nil 表示截取本地视频画面。
* @param type 视频流类型，支持主路画面（TRTCVideoStreamTypeBig，一般用于摄像头）和 辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）。
* @prara sourceType 截图画面来源，支持视频流（TRTCSnapshotSourceTypeStream）和视频渲染画面（TRTCSnapshotSourceTypeView）
* @param completionBlock 画面截取后的回调。
*
* @note 设置 userId = nil，代表截取当前用户的本地画面，目前本地画面仅支持截取主路画面（TRTCVideoStreamTypeBig）。
*/
- (void)snapshotVideo:(NSString *)userId
                 type:(TRTCVideoStreamType)type
           sourceType:(TRTCSnapshotSourceType)sourceType
      completionBlock:(void (^)(TXImage *image))completionBlock;

/// @}

/////////////////////////////////////////////////////////////////////////////////
//
//                      （四）音频相关接口函数
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 音频相关接口函数
/// @name 音频相关接口函数
/// @{

/**
 * 4.1 开启本地音频的采集和上行
 *
 * SDK 默认不采集声音，您需要调用该函数启动麦克风采集，并将音频数据传输给房间里的其他用户。
 *
 * @param quality 声音音质
 * - {@link TRTCCloudDef#TRTCAudioQualitySpeech}， 流畅：采样率：16k；单声道；音频裸码率：16kbps；适合语音通话为主的场景，比如在线会议，语音通话。
 * - {@link TRTCCloudDef#TRTCAudioQualityDefault}，默认：采样率：48k；单声道；音频裸码率：50kbps；SDK 默认的音频质量，如无特殊需求推荐选择之。
 * - {@link TRTCCloudDef#TRTCAudioQualityMusic}，高音质：采样率：48k；双声道 + 全频带；音频裸码率：128kbps；适合需要高保真传输音乐的场景，比如K歌、音乐直播等。
 *
 * @note 该函数会检查麦克风的使用权限，如果当前 App 没有麦克风权限，SDK 会向用户申请开启。
 */
- (void)startLocalAudio:(TRTCAudioQuality)quality;

/**
 * 4.2 关闭本地音频的采集和上行
 *
 * 当关闭本地音频的采集和上行，房间里的其它成员会收到 onUserAudioAvailable(NO) 回调通知。
 */
- (void)stopLocalAudio;

/**
 * 4.3 静音/取消静音本地的音频
 *
 * 当静音本地音频后，房间里的其它成员会收到 onUserAudioAvailable(userId, NO) 回调通知。
 * 当取消静音本地音频后，房间里的其它成员会收到 onUserAudioAvailable(userId, YES) 回调通知。
 *
 * 与 stopLocalAudio 不同之处在于，muteLocalAudio:YES 并不会停止发送音视频数据，而是继续发送码率极低的静音包。
 * 由于 MP4 等视频文件格式，对于音频的连续性是要求很高的，使用 stopLocalAudio 会导致录制出的 MP4 不易播放。
 * 因此在对录制质量要求很高的场景中，建议选择 muteLocalAudio，从而录制出兼容性更好的 MP4 文件。
 *
 * @param mute YES：静音；NO：取消静音
 */
- (void)muteLocalAudio:(BOOL)mute;

/**
 * 4.4 静音/取消静音指定的远端用户的声音
 *
 * @param userId 对方的用户 ID
 * @param mute YES：静音；NO：取消静音
 *
 * @note 静音时会停止接收该用户的远端音频流并停止播放，取消静音时会自动拉取该用户的远端音频流并进行播放。
 *       您在 enterRoom 之前或之后调用此 API 均会进入屏蔽状态，屏蔽状态在您调用 exitRoom 之后会被重置为 false。
 */
- (void)muteRemoteAudio:(NSString *)userId mute:(BOOL)mute;

/**
 * 4.5 静音/取消静音所有用户的声音
 *
 * @param mute YES：静音；NO：取消静音
 *
 * @note 静音时会停止接收所有用户的远端音频流并停止播放，取消静音时会自动拉取所有用户的远端音频流并进行播放。
 *       您在 enterRoom 之前或之后调用此 API 均会进入屏蔽状态，屏蔽状态在您调用 exitRoom 之后会被重置为 false。
 */
- (void)muteAllRemoteAudio:(BOOL)mute;

/**
 * 4.6 设置音频路由
 *
 * 微信和手机 QQ 视频通话功能的免提模式就是基于音频路由实现的。
 * 一般手机都有两个扬声器，一个是位于顶部的听筒扬声器，声音偏小；一个是位于底部的立体声扬声器，声音偏大。
 * 设置音频路由的作用就是决定声音使用哪个扬声器播放。
 *
 * @param route 音频路由，即声音由哪里输出（扬声器、听筒），默认值：TRTCAudioModeSpeakerphone
 */
- (void)setAudioRoute:(TRTCAudioRoute)route;

/**
 * 4.7 设置某个远程用户的播放音量
 *
 * @param userId 远程用户 ID
 * @param volume 音量大小，100为原始音量，范围是：[0 ~ 150]，默认值为100
 *
 * @note  如果要将 volume 设置为大于100的数值，需要进行特殊配置，请联系技术支持。
 */
- (void)setRemoteAudioVolume:(NSString *)userId volume:(int)volume;

/**
 * 4.8 设置 SDK 采集音量。
 *
 * @param volume 音量大小，100为原始音量，范围是：[0 ~ 150]，默认值为100
 *
 * @note  如果要将 volume 设置为大于100的数值，需要进行特殊配置，请联系技术支持。
 */
- (void)setAudioCaptureVolume:(NSInteger)volume;

/**
 * 4.9 获取 SDK 采集音量
 */
- (NSInteger)getAudioCaptureVolume;

/**
 * 4.10 设置 SDK 播放音量。
 *
 * @param volume 音量大小，100为原始音量，范围是：[0 ~ 150]，默认值为100
 *
 * @note
 *  1. 该函数会控制最终交给系统播放的声音音量，会影响录制本地音频文件的音量大小，但不会影响耳返的音量。<br>
 *  2. 如果要将 volume 设置为大于100的数值，需要进行特殊配置，请联系技术支持。
 */
- (void)setAudioPlayoutVolume:(NSInteger)volume;

/**
 * 4.11 获取 SDK 播放音量
 */
- (NSInteger)getAudioPlayoutVolume;

/**
 * 4.12 启用音量大小提示
 *
 * 开启此功能后，SDK 会在 onUserVoiceVolume() 中反馈对每一路声音音量大小值的评估。
 * 如需打开此功能，请在 startLocalAudio() 之前调用。
 *
 * @note Demo 中有一个音量大小的提示条，就是基于这个接口实现的。
 * @param interval 设置 onUserVoiceVolume 回调的触发间隔，单位为ms，最小间隔为100ms，如果小于等于0则会关闭回调，建议设置为300ms；
 */
- (void)enableAudioVolumeEvaluation:(NSUInteger)interval;

/**
 * 4.13 开始录音
 *
 * 该方法调用后， SDK 会将通话过程中的所有音频（包括本地音频，远端音频，BGM 等）录制到一个文件里。
 * 无论是否进房，调用该接口都生效。
 * 如果调用 exitRoom 时还在录音，录音会自动停止。
 *
 * @param param 录音参数，请参考 TRTCAudioRecordingParams
 * @return 0：成功；-1：录音已开始；-2：文件或目录创建失败；-3：后缀指定的音频格式不支持
 */
- (int)startAudioRecording:(TRTCAudioRecordingParams*) param;

/**
 * 4.14 停止录音
 *
 * 如果调用 exitRoom 时还在录音，录音会自动停止。
 */
- (void)stopAudioRecording;

#if TARGET_OS_IPHONE
/**
 * 4.15 开启本地媒体录制(iOS)
 *
 * 开启后把直播过程中的音视频数据录制存储到本地文件。
 * 应用场景:
 * 1. 不推流情况下，通过调用 startLocalPreview 预览画面后，进行录制。
 * 2. 在推流的同时进行录制，把直播的全程录制保存到本地文件。
 *
 * @param params 录制参数，请参考 {@link TRTCCloudDef#TRTCLocalRecordingParams}
 *
 */
- (void)startLocalRecording:(TRTCLocalRecordingParams *)params;

/**
 * 4.16 停止录制
 *
 * 如果调用 exitRoom 时还在录制，录制会自动停止。
 */
- (void)stopLocalRecording;
#endif

#if !TARGET_OS_IPHONE && TARGET_OS_MAC

/**
 * 4.17 开始录制系统声音，仅适用 Mac 平台
 *
 * 开启系统声卡采集，并将其混入上行音频流中，从而可以直播当前 Mac 系统的声音（如电影播出的声音）。
 *
 * @note
 * 1. 此功能需要为用户的 Mac 系统安装虚拟音频设备插件，安装完成后，SDK 会从已经安装的虚拟音频设备中采集声音。
 * 2. SDK 会自动从网络上下载合适的插件进行安装，但是下载速度可能比较慢，如果您希望加速这个过程，可以将虚拟音频插件文件打包到您 App Bundle 的 Resources 目录下。
 *
 */
- (void)startSystemAudioLoopback;

/**
 * 4.18 停止录制系统声音，仅适用 Mac 平台
 */
- (void)stopSystemAudioLoopback;

/**
 * 4.19 设置系统声音采集的音量，仅适用 Mac 平台
 *
 * @param volume 设置的音量大小，范围是：[0 ~ 150]，默认值为100
 *
 */
- (void)setSystemAudioLoopbackVolume:(uint32_t)volume;

#endif

/// @}



/////////////////////////////////////////////////////////////////////////////////
//
//                      （五）设备管理相关接口
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 设备管理接口
/// @name 设备管理接口
/// @{

/**
 * 5.1 获取设备管理类 TXDeviceManager
 */
- (TXDeviceManager *)getDeviceManager;
/// @}


/////////////////////////////////////////////////////////////////////////////////
//
//                      （六）美颜特效和图像水印
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 美颜特效和变脸特效
/// @name 美颜特效和变脸特效
/// @{

/**
 * 6.1 获取美颜管理对象
 *
 * 通过美颜管理，您可以使用以下功能：
 * - 设置"美颜风格"、“美白”、“红润”、“大眼”、“瘦脸”、“V脸”、“下巴”、“短脸”、“小鼻”、“亮眼”、“白牙”、“祛眼袋”、“祛皱纹”、“祛法令纹”等美容效果。
 * - 调整“发际线”、“眼间距”、“眼角”、“嘴形”、“鼻翼”、“鼻子位置”、“嘴唇厚度”、“脸型”
 * - 设置人脸挂件（素材）等动态效果
 * - 添加美妆
 * - 进行手势识别
 */
- (TXBeautyManager *)getBeautyManager;

/**
 * 6.2 添加水印
 *
 * 水印的位置是通过 rect 来指定的，rect 的格式为 (x，y，width，height)
 * - x：水印的坐标，取值范围为0 - 1的浮点数。
 * - y：水印的坐标，取值范围为0 - 1的浮点数。
 * - width：水印的宽度，取值范围为0 - 1的浮点数。
 * - height：是不用设置的，SDK 内部会根据水印图片的宽高比自动计算一个合适的高度。
 *
 * 例如，如果当前编码分辨率是540 × 960，rect 设置为（0.1，0.1，0.2，0.0）。
 * 那么水印的左上坐标点就是（540 × 0.1，960 × 0.1）即（54，96），水印的宽度是 540 × 0.2 = 108px，高度自动计算。
 *
 * @param image 水印图片，**必须使用透明底的 png 格式**
 * @param streamType 如果要给辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）也设置水印，需要调用两次的 setWatermark。
 * @param rect 水印相对于编码分辨率的归一化坐标，x，y，width，height 取值范围0 - 1。
 */
- (void)setWatermark:(TXImage*)image streamType:(TRTCVideoStreamType)streamType rect:(CGRect)rect;

/// @}


/////////////////////////////////////////////////////////////////////////////////
//
//                      （七）音乐特效和人声特效
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 音乐特效和人声特效
/// @name 音乐特效和人声特效
/// @{

/**
* 7.1 获取音效管理类 TXAudioEffectManager
*
* 该模块是整个 SDK 的音效管理模块，支持如下功能：
* - 耳机耳返：麦克风捕捉的声音实时通过耳机播放。
* - 混响效果：KTV、小房间、大会堂、低沉、洪亮...
* - 变声特效：萝莉、大叔、重金属、外国人...
* - 背景音乐：支持在线音乐和本地音乐，支持变速、变调等特效、支持原生和伴奏并播放和循环播放。
* - 短音效：鼓掌声、欢笑声等简短的音效文件，对于小于10秒的文件，请将 isShortFile 参数设置为 YES。
*/
- (TXAudioEffectManager *)getAudioEffectManager;

/// @}

/////////////////////////////////////////////////////////////////////////////////
//
//                      （八）屏幕分享相关接口函数
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 屏幕分享相关接口函数
/// @name 屏幕分享相关接口函数
/// @{

#if TARGET_OS_IPHONE
/**
 * 8.1 开始应用内的屏幕分享（该接口仅支持 iOS 13.0 及以上的 iPhone 和 iPad）
 *
 * iPhone 屏幕分享的推荐配置参数：
 * - 分辨率(videoResolution): 1280 x 720
 * - 帧率(videoFps): 10 FPS
 * - 码率(videoBitrate): 1600 kbps
 * - 分辨率自适应(enableAdjustRes): NO
 *
 * @param encParams 设置屏幕分享时的编码参数，推荐采用上述推荐配置，如果您指定 encParams 为 nil，则使用您调用 startScreenCapture 之前的编码参数设置。
 */
- (void)startScreenCaptureInApp:(TRTCVideoEncParam *)encParams API_AVAILABLE(ios(13.0));

/**
 * 8.2 开始全系统的屏幕分享（该接口支持 iOS 11.0 及以上的 iPhone 和 iPad）
 *
 * 该接口支持共享整个 iOS 系统的屏幕，可以实现类似腾讯会议的全系统级的屏幕分享。
 * 但是实现复杂度要比 startScreenCaptureInApp 略繁琐一些，需要参考文档为 App 实现一个 Replaykit 扩展模块。
 *
 * 参考文档：[屏幕录制]https://cloud.tencent.com/document/product/647/32249
 *
 * iPhone 屏幕分享的推荐配置参数：
 * - 分辨率(videoResolution): 1280 x 720
 * - 帧率(videoFps): 10 FPS
 * - 码率(videoBitrate): 1600 kbps
 * - 分辨率自适应(enableAdjustRes): NO
 *
 * @param encParams 设置屏幕分享时的编码参数，推荐采用上述推荐配置，如果您指定 encParams 为 nil，则使用您调用 startScreenCapture 之前的编码参数设置。
 * @param appGroup 主 App 与 Broadcast 共享的 Application Group Identifier，可以指定为 nil，但按照文档设置会使功能更加可靠。
 */
- (void)startScreenCaptureByReplaykit:(TRTCVideoEncParam *)encParams
                             appGroup:(NSString *)appGroup API_AVAILABLE(ios(11.0));

#elif TARGET_OS_MAC

/**
 * 8.3 开始桌面端屏幕分享（该接口仅支持 Mac OS 桌面系统）
 *
 * @param view 渲染控件所在的父控件，可以设置为 nil，表示不显示屏幕分享的预览效果。
 * @param streamType 屏幕分享使用的线路，可以设置为主路（TRTCVideoStreamTypeBig）或者辅路（TRTCVideoStreamTypeSub），默认使用辅路。
 * @param encParam 屏幕分享的画面编码参数，可以设置为 nil，表示让 SDK 选择最佳的编码参数（分辨率、码率等）。
 *
 * @note 一个用户同时最多只能上传一条主路（TRTCVideoStreamTypeBig）画面和一条辅路（TRTCVideoStreamTypeSub）画面，
 * 默认情况下，屏幕分享使用辅路画面，如果使用主路画面，建议您提前停止摄像头采集（stopLocalPreview）避免相互冲突。
 */
- (void)startScreenCapture:(NSView *)view streamType:(TRTCVideoStreamType)streamType encParam:(TRTCVideoEncParam *)encParam;
#endif

/**
 * 8.4 停止屏幕采集
 *
 * @return 0：成功；<0：失败
 */
- (int)stopScreenCapture API_AVAILABLE(ios(11.0));

/**
 * 8.5 暂停屏幕分享
 *
 * @return 0：成功；<0：失败
 */
- (int)pauseScreenCapture API_AVAILABLE(ios(11.0));

/**
 * 8.6 恢复屏幕分享
 *
 * @return 0：成功；<0：失败
 */
- (int)resumeScreenCapture API_AVAILABLE(ios(11.0));

#if !TARGET_OS_IPHONE && TARGET_OS_MAC
/**
 * 8.7 枚举可分享的屏幕窗口，仅支持 Mac OS 平台，建议在 startScreenCapture 之前调用
 *
 * 如果您要给您的 App 增加屏幕分享功能，一般需要先显示一个窗口选择界面，这样用户可以选择希望分享的窗口。
 * 通过下列函数，您可以获得可分享窗口的 ID、类型、窗口名称以及缩略图。
 * 获取上述信息后，您就可以实现一个窗口选择界面。您也可以使用 Demo 源码中已经实现好的窗口选择界面。
 *
 * @note 返回的列表中包括屏幕和应用窗口，屏幕会在列表的前面几个元素中。
 *
 * @param thumbnailSize 指定要获取的窗口缩略图大小，缩略图可用于绘制在窗口选择界面上
 * @param iconSize 指定要获取的窗口图标大小
 * @return 窗口列表包括屏幕
 */
- (NSArray<TRTCScreenCaptureSourceInfo*>*)getScreenCaptureSourcesWithThumbnailSize:(CGSize)thumbnailSize iconSize:(CGSize)iconSize;

/**
 * 8.8 设置屏幕分享参数，仅支持 Mac OS 平台，该方法在屏幕分享过程中也可以调用
 *
 * 如果您期望在屏幕分享的过程中，切换想要分享的窗口，可以再次调用这个函数，无需重新开启屏幕分享。
 *
 * @param screenSource     指定分享源
 * @param rect      指定捕获的区域（传 CGRectZero：当分享目标是某一个Mac窗口时则默认分享整个窗口，当分享目标是Mac桌面时则默认分享整个桌面）
 * @param capturesCursor   是否捕获鼠标光标
 * @param highlight        是否高亮正在分享的窗口
 *
 */
- (void)selectScreenCaptureTarget:(TRTCScreenCaptureSourceInfo *)screenSource
                             rect:(CGRect)rect
                   capturesCursor:(BOOL)capturesCursor
                        highlight:(BOOL)highlight;

#endif

/**
 * 8.9 设置辅路视频的编码器参数，适用 iOS、Mac 平台
 * - setVideoEncoderParam() 用于设置主路画面（TRTCVideoStreamTypeBig，一般用于摄像头）的编码参数。
 * - setSubStreamEncoderParam() 用于设置辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享或者自定义辅路）的编码参数。
 * 该设置决定远端用户看到的画面质量，同时也是云端录制出的视频文件的画面质量。
 *
 * @param param 辅流编码参数，详情请参考 TRTCCloudDef.h 中的 TRTCVideoEncParam 定义
 * @note 即使使用主路传输屏幕分享的数据（在调用 startScreenCapture 时设置 type=TRTCVideoStreamTypeBig），依然要使用此接口更新屏幕分享或者自定义辅路的编码参数。
 */
- (void)setSubStreamEncoderParam:(TRTCVideoEncParam *)param;


#if !TARGET_OS_IPHONE && TARGET_OS_MAC

/**
 * 8.10 设置屏幕分享的混音音量大小，仅适用 Mac 平台
 *
 * 数值越高，辅路音量的占比越高，麦克风音量占比越小。不推荐将该参数值设置过大，数值太大容易压制麦克风的声音。
 *
 * @param volume 设置的音量大小，范围0 - 100
 */
- (void)setSubStreamMixVolume:(NSInteger)volume;

/**
 * 8.11 将指定窗口加入屏幕分享的排除列表中，加入排除列表中的窗口不会被分享出去，仅适用 Mac 平台
 *
 * 支持启动屏幕分享前设置过滤窗口，也支持屏幕分享过程中动态添加过滤窗口。
 *
 * @param windowID 不希望分享出去的窗口ID
 */
- (void)addExcludedShareWindow:(NSInteger)windowID;

/**
 * 8.12 将指定窗口从屏幕分享的排除列表中移除，仅适用 Mac 平台
 *
 * @param windowID 不希望分享出去的窗口ID
 */
- (void)removeExcludedShareWindow:(NSInteger)windowID;

/**
 * 8.13 将所有窗口从屏幕分享的排除列表中移除，仅适用 Mac 平台
 */
- (void)removeAllExcludedShareWindows;

/**
 * 8.14 将指定窗口加入窗口分享的包含列表中，加入包含列表中的窗口会被一起分享出去，仅适用 Mac 平台
 *
 * 支持启动屏幕分享前设置指定窗口，也支持屏幕分享过程中动态添加指定窗口。
 *
 * @param windowID 希望分享出去的窗口ID
 */
- (void)addIncludedShareWindow:(NSInteger)windowID;

/**
 * 8.15 将指定窗口从窗口分享的包含列表中移除，仅适用 Mac 平台
 *
 * @param windowID 不希望分享出去的窗口ID
 */
- (void)removeIncludedShareWindow:(NSInteger)windowID;

/**
 * 8.16 将所有窗口从窗口分享的包含列表中移除，仅适用 Mac 平台
 */
- (void)removeAllIncludedShareWindows;

#endif
/// @}

/////////////////////////////////////////////////////////////////////////////////
//
//                      （九）自定义采集和渲染
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 自定义采集和渲染
/// @name 自定义采集和渲染
/// @{
/**
 * 9.1 启用视频自定义采集模式
 *
 * 开启该模式后，SDK 不在运行原有的视频采集流程，只保留编码和发送能力。
 * 您需要用 sendCustomVideoData() 不断地向 SDK 塞入自己采集的视频画面。
 *
 * @param enable 是否启用，默认值：NO
 */
- (void)enableCustomVideoCapture:(BOOL)enable;

/**
 * 9.2 向 SDK 投送自己采集的视频数据
 *
 * TRTCVideoFrame 推荐下列填写方式（其他字段不需要填写）：
 * - pixelFormat：推荐选择 TRTCVideoPixelFormat_NV12。
 * - bufferType：推荐选择 TRTCVideoBufferType_PixelBuffer。
 * - pixelBuffer：iOS 平台上常用的视频数据格式。
 * - data：视频裸数据格式，bufferType 为 NSData 时使用。
 * - timestamp：如果 timestamp 间隔不均匀，会严重影响音画同步和录制出的 MP4 质量。
 * - width：视频图像长度，bufferType 为 NSData 时填写。
 * - height：视频图像宽度，bufferType 为 NSData 时填写。
 *
 * 参考文档：[自定义采集和渲染](https://cloud.tencent.com/document/product/647/34066)。
 *
 * @param frame 视频数据，支持 PixelBuffer NV12，BGRA 以及 I420 格式数据。
 * @note - SDK 内部有帧率控制逻辑，目标帧率以您在 setVideoEncoderParam 中设置的为准，太快会自动丢帧，太慢则会自动补帧。
 * @note - 可以设置 frame 中的 timestamp 为 0，相当于让 SDK 自己设置时间戳，但请“均匀”地控制 sendCustomVideoData 的调用间隔，否则会导致视频帧率不稳定。
 *
 */
- (void)sendCustomVideoData:(TRTCVideoFrame *)frame;

/**
 * 9.3 第三方美颜的视频数据回调
 *
 * 设置此方法后，SDK 内部会在本地渲染前，把采集到的视频纹理回调出来，用于第三方美颜处理。
 *
 * @param delegate 自定义预处理回调，详见 {@link TRTCVideoFrameDelegate}
 * @param pixelFormat 指定回调的像素格式
 * @param bufferType 指定回调的数据格式
 * @return 0：成功；<0：错误
 */
- (int)setLocalVideoProcessDelegete:(id<TRTCVideoFrameDelegate>)delegate pixelFormat:(TRTCVideoPixelFormat)pixelFormat bufferType:(TRTCVideoBufferType)bufferType;

/**
 * 9.4 设置本地视频的自定义渲染回调
 *
 * 设置此方法后，SDK 内部会跳过原来的渲染流程，并把采集到的数据回调出来，您需要自己完成画面渲染。
 * - pixelFormat 指定回调的数据格式，例如 NV12、i420 以及 32BGRA。
 * - bufferType 指定 buffer 的类型，直接使用 PixelBuffer 效率最高；使用 NSData 相当于让 SDK 在内部做了一次内存转换，因此会有额外的性能损耗。
 *
 * @param delegate    自定义渲染回调
 * @param pixelFormat 指定回调的像素格式
 * @param bufferType  PixelBuffer：可以直接使用 imageWithCVImageBuffer 转成 UIImage；NSData：经过内存整理的视频数据。
 * @return 0：成功；<0：错误
 */
- (int)setLocalVideoRenderDelegate:(id<TRTCVideoRenderDelegate>)delegate pixelFormat:(TRTCVideoPixelFormat)pixelFormat bufferType:(TRTCVideoBufferType)bufferType;

/**
 * 9.5 设置远端视频的自定义渲染回调
 *
 * 此方法同 setLocalVideoRenderDelegate，区别在于一个是本地画面的渲染回调， 一个是远程画面的渲染回调。
 *
 * @note 调用此函数之前，需要先调用 startRemoteView 来获取远端用户的视频流（view 设置为 nil 即可），否则不会有数据回调出来。
 *
 * @param userId 指定目标 userId。
 * @param delegate 自定义渲染的回调。
 * @param pixelFormat 指定回调的像素格式。
 * @param bufferType PixelBuffer：可以直接使用 imageWithCVImageBuffer 转成 UIImage；NSData：经过内存整理的视频数据。
 * @return 0：成功；<0：错误
 */
- (int)setRemoteVideoRenderDelegate:(NSString*)userId delegate:(id<TRTCVideoRenderDelegate>)delegate pixelFormat:(TRTCVideoPixelFormat)pixelFormat bufferType:(TRTCVideoBufferType)bufferType;

/**
 * 9.6 启用音频自定义采集模式
 *
 * 开启该模式后，SDK 不在运行原有的音频采集流程，只保留编码和发送能力。
 * 您需要用 sendCustomAudioData() 不断地向 SDK 塞入自己采集的音频数据。
 *
 * @note 由于回声抵消（AEC）需要严格的控制声音采集和播放的时间，所以开启自定义音频采集后，AEC 能力可能会失效。
 *
 * @param enable 是否启用, true：启用；false：关闭，默认值：NO
 */
- (void)enableCustomAudioCapture:(BOOL)enable;

/**
 * 9.7 向 SDK 投送自己采集的音频数据
 *
 * TRTCAudioFrame 推荐如下填写方式：
 *
 * - data：音频帧 buffer。音频帧数据只支持 PCM 格式，支持[5ms ~ 100ms]帧长，推荐使用20 ms帧长，【48000采样率、单声道的帧长度：48000 × 0.02s × 1 × 16bit = 15360bit = 1920字节】。
 * - sampleRate：采样率，支持：16000、24000、32000、44100、48000。
 * - channel：声道数（如果是立体声，数据是交叉的），单声道：1； 双声道：2。
 * - timestamp：时间戳，单位毫秒（ms），可以设置 timestamp 为0，相当于让 SDK 自己设置时间戳。
 *
 * 参考文档：[自定义采集和渲染](https://cloud.tencent.com/document/product/647/34066)。
 *
 * @param frame 音频数据
 * @note 需精准的按每帧时长的间隔调用 sendCustomAudioData，否则会容易触发声音卡顿。
 */
- (void)sendCustomAudioData:(TRTCAudioFrame *)frame;

/**
 * 9.8 设置音频数据回调
 *
 * 设置此方法，SDK 内部会把音频数据（PCM 格式）回调出来，包括：
 * - onCapturedRawAudioFrame：本地麦克风采集到的原始音频数据回调
 * - onLocalProcessedAudioFrame：本地采集并经过音频模块前处理后的音频数据回调
 * - onRemoteUserAudioFrame：混音前的每一路远程用户的音频数据
 * - onMixedPlayAudioFrame：各路音频数据混合后送入扬声器播放的音频数据
 *
 * @param delegate 音频数据回调，delegate = nil 则停止回调数据
 */
- (void)setAudioFrameDelegate:(id<TRTCAudioFrameDelegate>)delegate;

/**
 * 9.9 生成自定义采集时间戳
 *
 * 此函数仅适合自定义视频采集时使用，当您的 App 自己或由第三方美颜 SDK 调用摄像头 API 采集视频时，由于可能引入一些耗时的外部操作（比如美颜），这会导致视频的节奏和 SDK 内部的音频节奏不一致，进而导致音画不同步。
 * 为避免发生音画不同步的问题，请按照如下步骤正确使用该接口：
 * 1. 在调用系统相机 API 采集到一帧视频时，额外调用一次 generateCustomPTS 获得 pts 时间戳。
 * 2. 在调用 sendCustomVideoData: 时，将该帧采集时记录的 pts 时间戳赋值给入参 TRTCVideoFrame 中的 timestamp 字段。
 *
 * @return 时间戳（单位：ms）
 */
+ (uint64_t)generateCustomPTS;

/**
 * 9.10 设置本地麦克风采集回调出来的AudioFrame格式
 *
 * 设置 onCapturedRawAudioFrame 回调出来的AudioFrame的格式
 * - sampleRate：采样率，支持：16000、32000、44100、48000。
 * - channel：声道数（如果是立体声，数据是交叉的），单声道：1； 双声道：2。
 * - samplesPerCall：采样点数，定义回调数据帧长。帧长必须为 10ms 的整数倍。
 *   如果希望用毫秒数计算回调帧长，则将毫秒数转换成采样点数的公式为：采样点数 = 毫秒数 * 采样率 / 1000；
 *   举例：48000 采样率希望回调 20ms 帧长的数据，则采样点数应该填: 960 = 20 * 48000 / 1000；
 *   注意，最终回调的帧长度是以字节为单位，采样点数转换成字节数的计算公式为：字节数 = 采样点数 * channel * 2（位宽）
 *   举例：48000 采样率，双声道，20ms 帧长，采样点数为 960，字节数为 3840 = 960 * 2 * 2
 *
 * @param format 音频数据回调格式。
 * @return 0：成功；<0：错误
 */
- (int)setCapturedRawAudioFrameDelegateFormat:(TRTCAudioFrameDelegateFormat *)format;

/**
 * 9.11 设置本地采集并经过音频模块前处理后的音频数据回调出来的AudioFrame格式
 *
 * 设置 onLocalProcessedAudioFrame 回调出来的AudioFrame的格式
 * - sampleRate：采样率，支持：16000、32000、44100、48000。  
 * - channel：声道数（如果是立体声，数据是交叉的），单声道：1； 双声道：2。 
 * - samplesPerCall：采样点数，定义回调数据帧长。帧长必须为 10ms 的整数倍。
 *   如果希望用毫秒数计算回调帧长，则将毫秒数转换成采样点数的公式为：采样点数 = 毫秒数 * 采样率 / 1000； 
 *   举例：48000 采样率希望回调20ms帧长的数据，则采样点数应该填: 960 = 20 * 48000 / 1000；
 *   注意，最终回调的帧长度是以字节为单位，采样点数转换成字节数的计算公式为：字节数 = 采样点数 * channel * 2（位宽） 
 *   举例：48000 采样率，双声道，20ms 帧长，采样点数为 960，字节数为 3840 = 960 * 2 * 2
 *
 * @param format 音频数据回调格式。
 * @return 0：成功；<0：错误
 */
- (int)setLocalProcessedAudioFrameDelegateFormat:(TRTCAudioFrameDelegateFormat *)format;

/**
 * 9.12 设置送入扬声器播放的音频数据回调的AudioFrame格式
 *
 * 设置 onMixedPlayAudioFrame 回调出来的AudioFrame格式
 * - sampleRate：采样率，支持：16000、32000、44100、48000。  
 * - channel：声道数（如果是立体声，数据是交叉的），单声道：1； 双声道：2。 
 * - samplesPerCall：采样点数，定义回调数据帧长。帧长必须为 10ms 的整数倍。
 *   如果希望用毫秒数计算回调帧长，则将毫秒数转换成采样点数的公式为：采样点数 = 毫秒数 * 采样率 / 1000； 
 *   举例：48000 采样率希望回调 20ms 帧长的数据，则采样点数应该填: 960 = 20 * 48000 / 1000；
 *   注意，最终回调的帧长度是以字节为单位，采样点数转换成字节数的计算公式为：字节数 = 采样点数 * channel * 2（位宽） 
 *   举例：48000 采样率，双声道，20ms 帧长，采样点数为 960，字节数为3840 = 960 * 2 * 2
 *
 * @param format 音频数据回调格式。
 * @return 0：成功；<0：错误
 */
- (int)setMixedPlayAudioFrameDelegateFormat:(TRTCAudioFrameDelegateFormat *)format;

/**
 * 9.13 启用自定义视频采集模式
 *
 * 当 streamType 为 TRTCVideoStreamTypeBig 时，开启该模式后，SDK 不再运行原有的视频采集流程。
 * 当 streamType 为 TRTCVideoStreamTypeSub 时只开启辅路，SDK 仍运行原有的视频采集流程。
 * 您需要用 sendCustomVideoData:frame: 不断地向 SDK  指定 streamType  塞入自己采集的视频画面。
 *
 * @param streamType  自定义视频流类型：
 *   - 主路：TRTCVideoStreamTypeBig
 *   - 辅路：TRTCVideoStreamTypeSub
 * @param enable 是否启用，默认值：NO
 */
- (void)enableCustomVideoCapture:(TRTCVideoStreamType)streamType enable:(BOOL)enable;

/**
 * 9.14 向 SDK 中指定 streamType 投送自己采集的视频数据
 *
 * TRTCVideoFrame 推荐下列填写方式（其他字段不需要填写）：
 * - pixelFormat：推荐选择 TRTCVideoPixelFormat_NV12。
 * - bufferType：推荐选择 TRTCVideoBufferType_PixelBuffer。
 * - pixelBuffer：iOS 平台上常用的视频数据格式。
 * - data：视频裸数据格式，bufferType 为 NSData 时使用。
 * - timestamp：如果 timestamp 间隔不均匀，会严重影响音画同步和录制出的 MP4 质量。
 * - width：视频图像长度，bufferType 为 NSData 时填写。
 * - height：视频图像宽度，bufferType 为 NSData 时填写。
 *
 * 参考文档：[自定义采集和渲染](https://cloud.tencent.com/document/product/647/34066)。
 *
 * @param streamType 自定义视频流类型：
 *   - 主路：TRTCVideoStreamTypeBig
 *   - 辅路：TRTCVideoStreamTypeSub
 * @param frame 视频数据，支持 PixelBuffer NV12，BGRA 以及 I420 格式数据。
 * @note - SDK 内部有帧率控制逻辑，目标帧率以您在 setVideoEncoderParam 中设置的为准，太快会自动丢帧，太慢则会自动补帧。
 * @note - 可以设置 frame 中的 timestamp 为 0，相当于让 SDK 自己设置时间戳，但请“均匀”地控制 sendCustomVideoData 的调用间隔，否则会导致视频帧率不稳定。
 *
 */
- (void)sendCustomVideoData:(TRTCVideoStreamType)streamType frame:(TRTCVideoFrame *)frame;

/**
 * 9.15 控制外部音频是否要混入推流和混入播放
 *
 * 您需要通过 mixExternalAudioFrame: 增加一路音频混合到推流的音频流，同时可以支持在本地播放
 *
 * @param enablePublish 是否混入推流 YES：混入推流；NO：不混入推流，默认值：NO
 * @param enablePlayout 是否混入播放 YES：混入播放；NO：不混入播放，默认值：NO
 * @note enablePublish = NO， enablePlayout = NO 时，表示完全关闭这个额外的音频流，即不推流，也不播放
 */
- (void)enableMixExternalAudioFrame:(BOOL)enablePublish playout:(BOOL)enablePlayout;


/**
 * 9.16 向 SDK 投送自己附加的音频数据
 *
 * TRTCAudioFrame 推荐如下填写方式：
 *
 * - data：音频帧 buffer。音频帧数据只支持 PCM 格式，支持[5ms ~ 100ms]帧长，推荐使用20 ms帧长，【48000采样率、单声道的帧长度：48000 × 0.02s × 1 × 16bit = 15360bit = 1920字节】。
 * - sampleRate：采样率，支持：16000、24000、32000、44100、48000。
 * - channel：声道数（如果是立体声，数据是交叉的），单声道：1； 双声道：2。
 * - timestamp：时间戳，单位毫秒（ms），可以设置 timestamp 为0，相当于让 SDK 自己设置时间戳。
 *
 * @param frame 音频数据
 * @note 需精准的按每帧时长的间隔调用 mixExternalAudioFrame，否则会容易触发声音卡顿。
 */
- (void)mixExternalAudioFrame:(TRTCAudioFrame *)frame;
/// @}


/////////////////////////////////////////////////////////////////////////////////
//
//                      （十）自定义消息发送
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 自定义消息发送
/// @name 自定义消息发送
/// @{

/**
 * 10.1 发送自定义消息给房间内所有用户
 *
 * 该接口可以借助音视频数据通道向当前房间里的其他用户广播您自定义的数据，但因为复用了音视频数据通道，
 * 请务必严格控制自定义消息的发送频率和消息体的大小，否则会影响音视频数据的质量控制逻辑，造成不确定性的问题。
 *
 * @param cmdID 消息 ID，取值范围为1 - 10
 * @param data 待发送的消息，最大支持 1KB（1000 字节）的数据大小
 * @param reliable 是否可靠发送，可靠发送的代价是会引入一定的延时，因为接收端要暂存一段时间的数据来等待重传
 * @param ordered 是否要求有序，即是否要求接收端接收的数据顺序和发送端发送的顺序一致，这会带来一定的接收延时，因为在接收端需要暂存并排序这些消息。
 * @return YES：消息已经发出；NO：消息发送失败。
 *
 * @note 本接口有以下限制：
 *       - 发送消息到房间内所有用户（暂时不支持 Web/小程序端），每秒最多能发送30条消息。
 *       - 每个包最大为 1KB，超过则很有可能会被中间路由器或者服务器丢弃。
 *       - 每个客户端每秒最多能发送总计 8KB 数据。
 *       - 将 reliable 和 ordered 同时设置为 YES 或 NO，暂不支持交叉设置。
 *       - 强烈建议不同类型的消息使用不同的 cmdID，这样可以在要求有序的情况下减小消息时延。
 */
- (BOOL)sendCustomCmdMsg:(NSInteger)cmdID data:(NSData *)data reliable:(BOOL)reliable ordered:(BOOL)ordered;

/**
 * 10.2 将小数据量的自定义数据嵌入视频帧中
 *
 * 与 sendCustomCmdMsg 的原理不同，sendSEIMsg 是将数据直接塞入视频数据头中。因此，即使视频帧被旁路到了直播 CDN 上，
 * 这些数据也会一直存在。由于需要把数据嵌入视频帧中，建议尽量控制数据大小，推荐使用几个字节大小的数据。
 *
 * 最常见的用法是把自定义的时间戳（timstamp）用 sendSEIMsg 嵌入视频帧中，实现消息和画面的完美对齐。
 *
 * @param data 待发送的数据，最大支持 1KB（1000字节）的数据大小
 * @param repeatCount 发送数据次数
 * @return YES：消息已通过限制，等待后续视频帧发送；NO：消息被限制发送
 *
 * @note 本接口有以下限制：
 *       - 数据在接口调用完后不会被即时发送出去，而是从下一帧视频帧开始带在视频帧中发送。
 *       - 发送消息到房间内所有用户，每秒最多能发送 30 条消息（与 sendCustomCmdMsg 共享限制）。
 *       - 每个包最大为 1KB，若发送大量数据，会导致视频码率增大，可能导致视频画质下降甚至卡顿（与 sendCustomCmdMsg 共享限制）。
 *       - 每个客户端每秒最多能发送总计8KB数据（与 sendCustomCmdMsg 共享限制）。
 *       - 若指定多次发送（repeatCount > 1），则数据会被带在后续的连续 repeatCount 个视频帧中发送出去，同样会导致视频码率增大。
 *       - 如果 repeatCount > 1，多次发送，接收消息 onRecvSEIMsg 回调也可能会收到多次相同的消息，需要去重。
 */
- (BOOL)sendSEIMsg:(NSData *)data  repeatCount:(int)repeatCount;

/// @}


/////////////////////////////////////////////////////////////////////////////////
//
//                      （十一）设备和网络测试
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 设备和网络测试
/// @name 设备和网络测试
/// @{

/**
 * 11.1 开始进行网络测速（视频通话期间请勿测试，以免影响通话质量）
 *
 * 测速结果将会用于优化 SDK 接下来的服务器选择策略，因此推荐您在用户首次通话前先进行一次测速，这将有助于我们选择最佳的服务器。
 * 同时，如果测试结果非常不理想，您可以通过醒目的 UI 提示用户选择更好的网络。
 *
 * @note 测速本身会消耗一定的流量，所以也会产生少量额外的流量费用。
 *
 * @param sdkAppId 应用标识
 * @param userId 用户标识
 * @param userSig 用户签名
 * @param completion 测试回调，会分多次回调
 */
- (void)startSpeedTest:(uint32_t)sdkAppId userId:(NSString *)userId userSig:(NSString *)userSig completion:(void(^)(TRTCSpeedTestResult* result, NSInteger completedCount, NSInteger totalCount))completion;

/**
 * 11.2 停止服务器测速
 */
- (void)stopSpeedTest;

/// @}

/////////////////////////////////////////////////////////////////////////////////
//
//                      （十二）Log 相关接口函数
//
/////////////////////////////////////////////////////////////////////////////////
/// @name Log 相关接口函数
/// @{

#pragma mark - LOG 相关接口函数
/**
 * 12.1 获取 SDK 版本信息
 */
+ (NSString *)getSDKVersion;

/**
 * 12.2 设置 Log 输出级别
 *
 * @param level 参见 TRTCLogLevel，默认值：TRTC_LOG_LEVEL_NULL
 */
+ (void)setLogLevel:(TRTCLogLevel)level;

/**
 * 12.3 启用或禁用控制台日志打印
 *
 * @param enabled 指定是否启用，默认为禁止状态
 */
+ (void)setConsoleEnabled:(BOOL)enabled;

/**
 * 12.4 启用或禁用 Log 的本地压缩。
 *
 * 开启压缩后，Log 存储体积明显减小，但需要腾讯云提供的 Python 脚本解压后才能阅读。
 * 禁用压缩后，Log 采用明文存储，可以直接用记事本打开阅读，但占用空间较大。
 *
 *  @param enabled 指定是否启用，默认为启动状态
 */
+ (void)setLogCompressEnabled:(BOOL)enabled;

/**
 * 12.5 修改日志保存路径
 *
 * @note 日志文件默认保存在 sandbox Documents/log 下，如需修改，必须在所有方法前调用。
 * @param path 存储日志路径
 */
+ (void)setLogDirPath:(NSString *)path;

/**
 * 12.6 设置日志回调
 */
+ (void)setLogDelegate:(id<TRTCLogDelegate>)logDelegate;

/**
 * 12.7 显示仪表盘
 *
 * 仪表盘是状态统计和事件消息浮层 view，方便调试。
 * @param showType 0：不显示；1：显示精简版；2：显示全量版
 */
- (void)showDebugView:(NSInteger)showType;

/**
 * 12.8 设置仪表盘的边距
 *
 * 必须在 showDebugView 调用前设置才会生效
 * @param userId 用户 ID
 * @param margin 仪表盘内边距，注意这里是基于 parentView 的百分比，margin 的取值范围是0 - 1
 */
- (void)setDebugViewMargin:(NSString *)userId margin:(TXEdgeInsets)margin;


/**
 * 12.9 调用实验性 API 接口
 *
 * @note 该接口用于调用一些实验性功能
 * @param jsonStr 接口及参数描述的 JSON 字符串
 */
- (void)callExperimentalAPI:(NSString*)jsonStr;

/// @}

/////////////////////////////////////////////////////////////////////////////////
//
//                      （十三）弃用接口（建议使用对应的新接口）
//
/////////////////////////////////////////////////////////////////////////////////
#pragma mark - 弃用接口（建议使用对应的新接口）
/// @name 弃用接口（建议使用对应的新接口）
/// @{

/**
 * 设置麦克风的音量大小
 *
 * @deprecated v6.9 版本弃用
 * 播放背景音乐混音时使用，用来控制麦克风音量大小。
 *
 * @param volume 音量大小，100 为原始音量，范围是：[0 ~ 150]，默认值为 100
 *
 * @note  如果要将 volume 设置为大于 100 的数值，需要进行特殊配置，请联系技术支持。
 */
- (void)setMicVolumeOnMixing:(NSInteger)volume __attribute__((deprecated("use setAudioCaptureVolume instead")));

/**
 * 设置美颜、美白以及红润效果级别
 *
 * SDK 内部集成两套风格不同的磨皮算法，一套我们取名叫“光滑”，适用于美女秀场，效果比较明显。
 * 另一套我们取名“自然”，磨皮算法更多地保留了面部细节，主观感受上会更加自然。
 *
 * @deprecated v6.9 版本弃用，请使用 TXBeautyManager 设置美颜功能
 * @param beautyStyle 美颜风格，光滑或者自然，光滑风格磨皮更加明显，适合娱乐场景。
 * @param beautyLevel 美颜级别，取值范围 0 - 9； 0表示关闭，1 - 9 值越大，效果越明显。
 * @param whitenessLevel 美白级别，取值范围 0 - 9；0表示关闭，1 - 9 值越大，效果越明显。
 * @param ruddinessLevel 红润级别，取值范围 0 - 9；0表示关闭，1 - 9 值越大，效果越明显。
 */
- (void)setBeautyStyle:(TRTCBeautyStyle)beautyStyle beautyLevel:(NSInteger)beautyLevel
        whitenessLevel:(NSInteger)whitenessLevel ruddinessLevel:(NSInteger)ruddinessLevel
        __attribute__((deprecated("use getBeautyManager instead")));

#if TARGET_OS_IPHONE
/**
 * 设置大眼级别，该接口仅在 [企业版 SDK](https://cloud.tencent.com/document/product/647/32689#Enterprise) 中生效
 *
 * @deprecated v6.9 版本弃用，请使用 TXBeautyManager 设置美颜功能
 * @param eyeScaleLevel 大眼级别，取值范围 0 - 9；0表示关闭，1 - 9 值越大，效果越明显。
 */
- (void)setEyeScaleLevel:(float)eyeScaleLevel __attribute__((deprecated("use getBeautyManager instead")));

/**
 * 设置瘦脸级别，该接口仅在 [企业版 SDK](https://cloud.tencent.com/document/product/647/32689#Enterprise) 中生效
 *
 * @deprecated v6.9 版本弃用，请使用 TXBeautyManager 设置美颜功能
 *  @param faceScaleLevel 瘦脸级别，取值范围 0 - 9；0表示关闭，1 - 9 值越大，效果越明显。
 */
- (void)setFaceScaleLevel:(float)faceScaleLevel __attribute__((deprecated("use getBeautyManager instead")));

/**
 * 14.5设置 V 脸级别，该接口仅在 [企业版 SDK](https://cloud.tencent.com/document/product/647/32689#Enterprise) 中生效
 *
 * @deprecated v6.9 版本弃用，请使用 TXBeautyManager 设置美颜功能
 * @param faceVLevel V脸级别，取值范围 0 - 9；0表示关闭，1 - 9 值越大，效果越明显。
 */
- (void)setFaceVLevel:(float)faceVLevel __attribute__((deprecated("use getBeautyManager instead")));

/**
 * 设置下巴拉伸或收缩，该接口仅在 [企业版 SDK](https://cloud.tencent.com/document/product/647/32689#Enterprise) 中生效
 *
 * @deprecated v6.9 版本弃用，请使用 TXBeautyManager 设置美颜功能
 * @param chinLevel 下巴拉伸或收缩级别，取值范围 -9 - 9；0 表示关闭，小于 0 表示收缩，大于 0 表示拉伸。
 */
- (void)setChinLevel:(float)chinLevel __attribute__((deprecated("use getBeautyManager instead")));

/**
 * 设置短脸级别，该接口仅在 [企业版 SDK](https://cloud.tencent.com/document/product/647/32689#Enterprise) 中生效
 *
 * @deprecated v6.9 版本弃用，请使用 TXBeautyManager 设置美颜功能
 * @param faceShortlevel 短脸级别，取值范围 0 - 9；0 表示关闭，1 - 9 值越大，效果越明显。
 */
- (void)setFaceShortLevel:(float)faceShortlevel __attribute__((deprecated("use getBeautyManager instead")));

/**
 * 设置瘦鼻级别，该接口仅在 [企业版 SDK](https://cloud.tencent.com/document/product/647/32689#Enterprise) 中生效
 *
 * @deprecated v6.9 版本弃用，请使用 TXBeautyManager 设置美颜功能
 * @param noseSlimLevel 瘦鼻级别，取值范围 0 - 9；0 表示关闭，1 - 9 值越大，效果越明显。
 */
- (void)setNoseSlimLevel:(float)noseSlimLevel __attribute__((deprecated("use getBeautyManager instead")));

/**
 * 选择使用哪一款 AI 动效挂件，该接口仅在 [企业版 SDK](https://cloud.tencent.com/document/product/647/32689#Enterprise) 中生效
 *
 * @deprecated v6.9 版本弃用，请使用 TXBeautyManager 设置美颜功能
 * @param tmplPath 动效文件路径
 */
- (void)selectMotionTmpl:(NSString *)tmplPath __attribute__((deprecated("use getBeautyManager instead")));

/**
 * 设置动效静音，该接口仅在 [企业版 SDK](https://cloud.tencent.com/document/product/647/32689#Enterprise) 中生效
 *
 * 部分挂件本身会有声音特效，通过此 API 可以关闭特效播放时所带的声音效果。
 *
 * @deprecated v6.9 版本弃用，请使用 TXBeautyManager 设置美颜功能
 * @param motionMute YES：静音；NO：不静音。
 */
- (void)setMotionMute:(BOOL)motionMute __attribute__((deprecated("use getBeautyManager instead")));

#elif TARGET_OS_MAC
/**
 * 启动屏幕分享
 *
 * @deprecated v7.2 版本弃用，请使用 startScreenCapture:streamType:encParam: 启动屏幕分享
 * @param view 渲染控件所在的父控件
 */
- (void)startScreenCapture:(NSView *)view __attribute__((deprecated("use startScreenCapture:streamType:encParam: instead")));

#endif

/**
 * 设置指定素材滤镜特效
 *
 * @deprecated v7.2 版本弃用，请使用 TXBeautyManager 设置素材滤镜
 * @param image 指定素材，即颜色查找表图片。**必须使用 png 格式**
 */
- (void)setFilter:(TXImage *)image __attribute__((deprecated("use getBeautyManager instead")));

/**
 * 设置滤镜浓度
 *
 * 在美女秀场等应用场景里，滤镜浓度的要求会比较高，以便更加突显主播的差异。
 * 我们默认的滤镜浓度是0.5，如果您觉得滤镜效果不明显，可以使用下面的接口进行调节。
 *
 * @deprecated v7.2 版本弃用，请使用 TXBeautyManager setFilterStrength 接口
 * @param concentration 从 0 到 1，越大滤镜效果越明显，默认值为0.5。
 */
- (void)setFilterConcentration:(float)concentration __attribute__((deprecated("use getBeautyManager instead")));

/**
 * 设置绿幕背景视频（企业版有效，其它版本设置此参数无效）
 *
 * 此处的绿幕功能并非智能抠背，需要被拍摄者的背后有一块绿色的幕布来辅助产生特效
 *
 * @deprecated v7.2 版本弃用，请使用 TXBeautyManager 设置绿幕背景视频
 * @param file 视频文件路径。支持 MP4; nil 表示关闭特效。
 */
- (void)setGreenScreenFile:(NSURL *)file __attribute__((deprecated("use getBeautyManager instead")));

/**
 * 启动播放背景音乐
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager startPlayMusic 接口，支持并发播放多个 BGM
 * @param path 音乐文件路径，支持的文件格式：aac, mp3, m4a。
 * @param beginNotify 音乐播放开始的回调通知
 * @param progressNotify 音乐播放的进度通知，单位毫秒
 * @param completeNotify 音乐播放结束的回调通知
 */
- (void) playBGM:(NSString *)path
   withBeginNotify:(void (^)(NSInteger errCode))beginNotify
withProgressNotify:(void (^)(NSInteger progressMS, NSInteger durationMS))progressNotify
 andCompleteNotify:(void (^)(NSInteger errCode))completeNotify
 __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 停止播放背景音乐
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager stopPlayMusic 接口
 */
- (void)stopBGM __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 暂停播放背景音乐
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager pausePlayMusic 接口
 */
- (void)pauseBGM __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 继续播放背景音乐
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager resumePlayMusic 接口
 */
- (void)resumeBGM __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 获取音乐文件总时长，单位毫秒
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager getMusicDurationInMS 接口
 * @param path 音乐文件路径，如果 path 为空，那么返回当前正在播放的 music 时长。
 * @return 成功返回时长，失败返回 -1
 */
- (NSInteger)getBGMDuration:(NSString *)path __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 设置 BGM 播放进度
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager seekMusicToPosInMS 接口
 * @param pos 单位毫秒
 * @return 0：成功；-1：失败
 */
- (int)setBGMPosition:(NSInteger)pos __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 设置背景音乐播放音量的大小
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager setMusicVolume 接口
 * 播放背景音乐混音时使用，用来控制背景音乐播放音量的大小，
 * 该接口会同时控制远端播放音量的大小和本地播放音量的大小，
 * 因此调用该接口后，setBGMPlayoutVolume 和 setBGMPublishVolume 设置的音量值会被覆盖
 *
 * @param volume 音量大小，100 为原始音量，范围是：[0 ~ 150]，默认值为 100
 *
 * @note  如果要将 volume 设置为大于100的数值，需要进行特殊配置，请联系技术支持。
 */
- (void)setBGMVolume:(NSInteger)volume __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 设置背景音乐本地播放音量的大小
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager setMusicPlayoutVolume 接口
 * 播放背景音乐混音时使用，用来控制背景音乐在本地播放时的音量大小。
 *
 * @param volume 音量大小，100 为原始音量，范围是：[0 ~ 150]，默认值为 100
 *
 * @note  如果要将 volume 设置为大于 100 的数值，需要进行特殊配置，请联系技术支持。
 */
- (void)setBGMPlayoutVolume:(NSInteger)volume __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 设置背景音乐远端播放音量的大小
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager setMusicPublishVolume 接口
 * 播放背景音乐混音时使用，用来控制背景音乐在远端播放时的音量大小。
 *
 * @param volume 音量大小，100 为原始音量，范围是：[0 ~ 150]，默认值为 100
 *
 * @note  如果要将 volume 设置为大于 100 的数值，需要进行特殊配置，请联系技术支持。
 */
- (void)setBGMPublishVolume:(NSInteger)volume __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 设置混响效果，目前仅支持 iOS
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager setVoiceReverbType 接口
 * @param reverbType 混响类型，详情请参见 TXReverbType
 */
- (void)setReverbType:(TRTCReverbType)reverbType __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 设置变声类型，目前仅支持 iOS
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager setVoiceChangerType 接口
 * @param voiceChangerType 变声类型，详情请参见 TXVoiceChangerType
 */
- (void)setVoiceChangerType:(TRTCVoiceChangerType)voiceChangerType __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 播放音效
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager startPlayMusic 接口
 * 每个音效都需要您指定具体的 ID，您可以通过该 ID 对音效的开始、停止、音量等进行设置。
 * 支持的文件格式：aac, mp3, m4a。
 *
 * @note 若您想同时播放多个音效，请分配不同的 ID 进行播放。因为使用同一个 ID 播放不同音效，SDK 会先停止播放旧的音效，再播放新的音效。
 *
 * @param effect 音效
 */
- (void)playAudioEffect:(TRTCAudioEffectParam*)effect __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 设置音效音量
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager setMusicPublishVolume / setMusicPlayoutVolume 接口
 * @note 该操作会覆盖通过 setAllAudioEffectsVolume 指定的整体音效音量。
 *
 * @param effectId 音效 ID
 * @param volume   音量大小，100 为原始音量，范围是：[0 ~ 150]，默认值为 100
 *
 * @note  如果要将 volume 设置为大于 100 的数值，需要进行特殊配置，请联系技术支持。
 */
- (void)setAudioEffectVolume:(int)effectId volume:(int) volume __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 停止音效
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager stopPlayMusic 接口
 * @param effectId 音效 ID
 */
- (void)stopAudioEffect:(int)effectId __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 停止所有音效
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager stopPlayMusic 接口
 */
- (void)stopAllAudioEffects __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 设置所有音效音量
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager setMusicPublishVolume / setMusicPlayoutVolume 接口
 * @note 该操作会覆盖通过 setAudioEffectVolume 指定的单独音效音量。
 *
 * @param volume 音量大小，100 为原始音量，范围是：[0 ~ 150]，默认值为 100
 *
 * @note  如果要将 volume 设置为大于 100 的数值，需要进行特殊配置，请联系技术支持。
 */
- (void)setAllAudioEffectsVolume:(int)volume __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 暂停音效
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager pausePlayMusic 接口
 * @param effectId 音效 ID
 */
- (void)pauseAudioEffect:(int)effectId __attribute__((deprecated("use getAudioEffectManager instead")));

/**
 * 恢复音效
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager resumePlayMusic 接口
 * @param effectId 音效 ID
 */
- (void)resumeAudioEffect:(int)effectId __attribute__((deprecated("use getAudioEffectManager instead")));

#if TARGET_OS_IPHONE
/**
 * 开启耳返
 *
 * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager setVoiceEarMonitor 接口
 * 开启后会在耳机里听到自己的声音。
 *
 * @note 仅在戴耳机时有效
 *
 * @param enable YES：开启；NO：关闭，默认值：NO
 */
- (void)enableAudioEarMonitoring:(BOOL)enable __attribute__((deprecated("use getAudioEffectManager instead")));
#endif

/**
 * 开始显示远端视频画面
 *
 * @deprecated v8.0 版本弃用，请使用 startRemoteView:streamType:view 接口
 * 在收到 SDK 的 onUserVideoAvailable(userid, YES) 通知时，可以获知该远程用户开启了视频，
 * 此后调用 startRemoteView(userid) 接口加载该用户的远程画面，此时可以用 loading 动画优化加载过程中的等待体验。
 * 待该用户的首帧画面开始显示时，您会收到 onFirstVideoFrame(userId) 事件回调。
 *
 * @param userId 对方的用户标识
 * @param view 承载视频画面的控件
 */
- (void)startRemoteView:(NSString *)userId view:(TXView *)view __attribute__((deprecated("use startRemoteView:streamType:view: instead")));

/**
 * 停止显示远端视频画面，同时不再拉取该远端用户的视频数据流
 *
 * @deprecated v8.0 版本弃用，请使用 stopRemoteView:streamType: 接口
 * 调用此接口后，SDK 会停止接收该用户的远程视频流，同时会清理相关的视频显示资源。
 *
 * @param userId 对方的用户标识
 */
- (void)stopRemoteView:(NSString *)userId __attribute__((deprecated("use stopRemoteView:streamType: instead")));

/**
 * 设置远端图像的渲染模式
 *
 * @deprecated v8.0 版本弃用，请使用 setRemoteRenderParams:streamType:params: 接口
 * @param userId 用户 ID
 * @param mode 填充（画面可能会被拉伸裁剪）或适应（画面可能会有黑边），默认值：TRTCVideoFillMode_Fill
 */
- (void)setRemoteViewFillMode:(NSString*)userId mode:(TRTCVideoFillMode)mode __attribute__((deprecated("use setRemoteRenderParams:streamType:params: instead")));


/**
 * 设置远端图像的顺时针旋转角度
 *
 * @deprecated v8.0 版本弃用，请使用 setRemoteRenderParams:streamType:params: 接口
 * @param userId 用户 ID
 * @param rotation 支持90、180以及270旋转角度，默认值：TRTCVideoRotation_0
 */
- (void)setRemoteViewRotation:(NSString*)userId rotation:(TRTCVideoRotation)rotation __attribute__((deprecated("use setRemoteRenderParams:streamType:params: instead")));

/**
 * 开始显示远端用户的辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）
 *
 * @deprecated v8.0 版本弃用，请使用 startRemoteView:streamType:view 接口
 * - startRemoteView() 用于显示主路画面（TRTCVideoStreamTypeBig，一般用于摄像头）。
 * - startRemoteSubStreamView() 用于显示辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）。
 *
 * @param userId 对方的用户标识
 * @param view 渲染控件
 * @note 请在 onUserSubStreamAvailable 回调后再调用这个接口。
 */
- (void)startRemoteSubStreamView:(NSString *)userId view:(TXView *)view __attribute__((deprecated("use startRemoteView:type:view: instead")));

/**
 * 停止显示远端用户的辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）。
 *
 * @deprecated v8.0 版本弃用，请使用 stopRemoteView:streamType: 接口
 * @param userId 对方的用户标识
 */
- (void)stopRemoteSubStreamView:(NSString *)userId __attribute__((deprecated("use stopRemoteView:streamType: instead")));

/**
 * 设置本地图像的渲染模式
 *
 * @deprecated v8.0 版本弃用，请使用 setLocalRenderParams: 接口
 * @param mode 填充（画面可能会被拉伸裁剪）或适应（画面可能会有黑边），默认值：TRTCVideoFillMode_Fill
 */
- (void)setLocalViewFillMode:(TRTCVideoFillMode)mode __attribute__((deprecated("use setLocalRenderParams: instead")));

/**
 * 设置本地图像的顺时针旋转角度
 *
 * @deprecated v8.0 版本弃用，请使用 setLocalRenderParams: 接口
 * @param rotation 支持90、180以及270旋转角度，默认值：TRTCVideoRotation_0
 */
- (void)setLocalViewRotation:(TRTCVideoRotation)rotation __attribute__((deprecated("use setLocalRenderParams: instead")));

#if TARGET_OS_IPHONE
/**
 * 设置本地摄像头预览画面的镜像模式（iOS）
 *
 * @deprecated v8.0 版本弃用，请使用 setLocalRenderParams: 接口
 * @param mirror 镜像模式，默认值：TRTCLocalVideoMirrorType_Auto
 */
- (void)setLocalViewMirror:(TRTCLocalVideoMirrorType)mirror __attribute__((deprecated("use setLocalRenderParams: instead")));
#elif TARGET_OS_MAC

/**
 * 设置本地摄像头预览画面的镜像模式（Mac）
 *
 * @deprecated v8.0 版本弃用，请使用 setLocalRenderParams: 接口
 * @param mirror 镜像模式，默认值：YES
 */
- (void)setLocalViewMirror:(BOOL)mirror __attribute__((deprecated("use setLocalRenderParams: instead")));
#endif

/**
 * 设置辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）的显示模式
 *
 * @deprecated v8.0 版本弃用，请使用 setRemoteRenderParams:streamType:params: 接口
 * - setRemoteViewFillMode() 用于设置远端主路画面（TRTCVideoStreamTypeBig，一般用于摄像头）的显示模式。
 * - setRemoteSubStreamViewFillMode() 用于设置远端辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）的显示模式。
 *
 * @param userId 用户的 ID
 * @param mode 填充（画面可能会被拉伸裁剪）或适应（画面可能会有黑边），默认值：TRTCVideoFillMode_Fit
 */
- (void)setRemoteSubStreamViewFillMode:(NSString *)userId mode:(TRTCVideoFillMode)mode __attribute__((deprecated("use setRemoteRenderParams:streamType:params: instead")));

/**
 * 设置辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）的顺时针旋转角度
 *
 * @deprecated v8.0 版本弃用，请使用 setRemoteRenderParams:streamType:params: 接口
 * - setRemoteViewRotation() 用于设置远端主路画面（TRTCVideoStreamTypeBig，一般用于摄像头）的旋转角度。
 * - setRemoteSubStreamViewRotation() 用于设置远端辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）的旋转角度。
 *
 * @param userId 用户 ID
 * @param rotation 支持 90、180、270 旋转角度
 */
- (void)setRemoteSubStreamViewRotation:(NSString*)userId rotation:(TRTCVideoRotation)rotation __attribute__((deprecated("use setRemoteRenderParams:streamType:params: instead")));

/**
 * 设定观看方优先选择的视频质量
 *
 * @deprecated v8.0 版本弃用，请使用 startRemoteView:streamType:view: 接口
 * 低端设备推荐优先选择低清晰度的小画面。
 * 如果对方没有开启双路视频模式，则此操作无效。
 *
 * @param type 默认观看大画面或小画面，默认为大画面
 */
- (void)setPriorRemoteVideoStreamType:(TRTCVideoStreamType)type __attribute__((deprecated("use startRemoteView:streamType:view: instead")));

/**
 * 设置音频质量
 *
 * @deprecated v8.0 版本弃用，请使用 startLocalAudio(quality) 接口
 *  主播端的音质越高，观众端的听感越好，但传输所依赖的带宽也就越高，在带宽有限的场景下也更容易出现卡顿。
 *
 * - {@link TRTCCloudDef#TRTCAudioQualitySpeech}， 流畅：采样率：16k；单声道；音频裸码率：16kbps；适合语音通话为主的场景，比如在线会议，语音通话。
 * - {@link TRTCCloudDef#TRTCAudioQualityDefault}，默认：采样率：48k；单声道；音频裸码率：50kbps；SDK 默认的音频质量，如无特殊需求推荐选择之。
 * - {@link TRTCCloudDef#TRTCAudioQualityMusic}，高音质：采样率：48k；双声道 + 全频带；音频裸码率：128kbps；适合需要高保真传输音乐的场景，比如K歌、音乐直播等。
 * @note 该方法需要在 startLocalAudio 之前进行设置，否则不会生效。
 */
- (void)setAudioQuality:(TRTCAudioQuality)quality __attribute__((deprecated("use startLocalAudio(quality) instead")));

/**
 * 开启本地音频的采集和上行
 *
 * @deprecated v8.0 版本弃用，请使用 startLocalAudio(quality) 接口
 * 该函数会启动麦克风采集，并将音频数据传输给房间里的其他用户。
 * SDK 不会默认开启本地音频采集和上行，您需要调用该函数开启，否则房间里的其他用户将无法听到您的声音。
 *
 * @note 该函数会检查麦克风的使用权限，如果当前 App 没有麦克风权限，SDK 会向用户申请开启。
 */
- (void)startLocalAudio __attribute__((deprecated("use startLocalAudio(quality) instead")));

#if TARGET_OS_IPHONE

/**
 * 切换摄像头
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager switchCamera 接口
 */
- (void)switchCamera __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 查询当前摄像头是否支持缩放
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager isCameraZoomSupported 接口
 */
- (BOOL)isCameraZoomSupported __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 查询是否支持开关闪光灯（手电筒模式）
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager isCameraTorchSupported 接口
 */
- (BOOL)isCameraTorchSupported __attribute__((deprecated("use getDeviceManager instead")));


/**
 * 查询是否支持设置焦点
 *
 * @deprecated v8.0 版本弃用
 */
- (BOOL)isCameraFocusPositionInPreviewSupported __attribute__((deprecated));

/**
 * 设置摄像头焦点
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager setCameraFocusPosition 接口
 * @param touchPoint 对焦位置
 */
- (void)setFocusPosition:(CGPoint)touchPoint __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 查询是否支持自动识别人脸位置
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager isAutoFocusEnabled 接口
 */
- (BOOL)isCameraAutoFocusFaceModeSupported __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 自动识别人脸位置
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager enableCameraAutoFocus 接口
 * @param enable YES：开启；NO：关闭，默认值：YES
 */
- (void)enableAutoFaceFoucs:(BOOL)enable __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 设置摄像头缩放因子（焦距）
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager setCameraZoomRatio 接口
 * 取值范围1 - 5，取值为 1 表示最远视角（正常镜头），取值为 5 表示最近视角（放大镜头）。
 * 最大值推荐为 5，若超过 5，视频数据会变得模糊不清。
 *
 * @param distance 取值范围为1 - 5，数值越大，焦距越远
 */
- (void)setZoom:(CGFloat)distance __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 开关闪光灯
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager enableCameraTorch 接口
 * @param enable YES：开启；NO：关闭，默认值：NO
 */
- (BOOL)enbaleTorch:(BOOL)enable __attribute__((deprecated("use getDeviceManager instead")));

#endif

/**
 * 设置通话时使用的系统音量类型
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager setSystemVolumeType 接口
 * 智能手机一般具备两种系统音量类型，即通话音量类型和媒体音量类型。
 * - 通话音量：手机专门为通话场景设计的音量类型，使用手机自带的回声抵消功能，音质相比媒体音量类型较差，
 *             无法通过音量按键将音量调成零，但是支持蓝牙耳机上的麦克风。
 *
 * - 媒体音量：手机专门为音乐场景设计的音量类型，音质相比于通话音量类型要好，通过通过音量按键可以将音量调成零。
 *             使用媒体音量类型时，如果要开启回声抵消（AEC）功能，SDK 会开启内置的声学处理算法对声音进行二次处理。
 *             在媒体音量模式下，蓝牙耳机无法使用自带的麦克风采集声音，只能使用手机上的麦克风进行声音采集。
 *
 * SDK 目前提供了三种系统音量类型的控制模式，分别为：
 * - {@link TRTCSystemVolumeTypeAuto}：
 *       “麦上通话，麦下媒体”，即主播上麦时使用通话音量，观众不上麦则使用媒体音量，适合在线直播场景。
 *       如果您在 enterRoom 时选择的场景为 {@link TRTCAppSceneLIVE} 或 {@link TRTCAppSceneVoiceChatRoom}，SDK 会自动选择该模式。
 *
 * - {@link TRTCSystemVolumeTypeVOIP}：
 *       通话全程使用通话音量，适合多人会议场景。
 *       如果您在 enterRoom 时选择的场景为 {@link TRTCAppSceneVideoCall} 或 {@link TRTCAppSceneAudioCall}，SDK 会自动选择该模式。
 *
 * - {@link TRTCSystemVolumeTypeMedia}：
 *       通话全程使用媒体音量，不常用，适合个别有特殊需求（如主播外接声卡）的应用场景。
 *
 * @note
 *   1. 需要在调用 startLocalAudio() 之前调用该接口。<br>
 *   2. 如无特殊需求，不推荐您自行设置，您只需通过 enterRoom 设置好适合您的场景，SDK 内部会自动选择相匹配的音量类型。
 *
 * @param type 系统音量类型，如无特殊需求，不推荐您自行设置。
 */
- (void)setSystemVolumeType:(TRTCSystemVolumeType)type __attribute__((deprecated("use getDeviceManager instead")));

#if !TARGET_OS_IPHONE && TARGET_OS_MAC

/**
 * 开始进行摄像头测试
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager startCameraDeviceTest 接口
 * @note 在测试过程中可以使用 setCurrentCameraDevice 接口切换摄像头。
 * @param view 预览控件所在的父控件
 */
- (void)startCameraDeviceTestInView:(NSView *)view __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 结束视频测试预览
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager stopCameraDeviceTest 接口
 */
- (void)stopCameraDeviceTest __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 开始进行麦克风测试
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager startMicDeviceTest 接口
 * 该方法测试麦克风是否能正常工作，volume 的取值范围为0 - 100。
 */
- (void)startMicDeviceTest:(NSInteger)interval testEcho:(void (^)(NSInteger volume))testEcho __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 停止麦克风测试
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager stopMicDeviceTest 接口
 */
- (void)stopMicDeviceTest __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 开始扬声器测试
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager startSpeakerDeviceTest 接口
 * 该方法播放指定的音频文件测试播放设备是否能正常工作。如果能听到声音，说明播放设备能正常工作。
 */
- (void)startSpeakerDeviceTest:(NSString*)audioFilePath onVolumeChanged:(void (^)(NSInteger volume, BOOL isLastFrame))volumeBlock __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 停止扬声器测试
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager stopSpeakerDeviceTest 接口
 */
- (void)stopSpeakerDeviceTest __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 获取麦克风设备列表
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager getDevicesList:type: 接口
 * Mac 主机本身自带一个质量很好的麦克风，但它也允许用户外接其他的麦克风，而且很多 USB 摄像头上也自带麦克风。
 * 如果您希望用户选择自己外接的麦克风，可以提供一个多麦克风选择的功能。
 *
 * @return 麦克风设备列表，第一项为当前系统默认设备
 */
- (NSArray<TRTCMediaDeviceInfo*>*)getMicDevicesList __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 获取当前的麦克风设备
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager getCurrentDevice 接口
 * @return 当前麦克风设备信息
 */
- (TRTCMediaDeviceInfo*)getCurrentMicDevice __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 设置要使用的麦克风
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager setCurrentDevice 接口
 * @param deviceId 从 getMicDevicesList 中得到的设备 ID
 * @return 0：成功；<0：失败
 */
- (int)setCurrentMicDevice:(NSString*)deviceId __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 获取当前麦克风设备音量
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager getCurrentDeviceVolume 接口
 * @return 麦克风音量
 */
- (float)getCurrentMicDeviceVolume __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 设置麦克风设备的音量
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager setCurrentDeviceVolume 接口
 * 该接口的功能是调节系统采集音量，如果用户直接调节 Mac 系统设置的采集音量时，该接口的设置结果会被用户的操作所覆盖。
 *
 * @param volume 麦克风音量值，范围0 - 100
 */
- (void)setCurrentMicDeviceVolume:(NSInteger)volume __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 设置系统当前麦克风设备的静音状态
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager setCurrentDeviceMute 接口
 * @param mute 设置为 YES 时，麦克风设备静音
 */
- (void)setCurrentMicDeviceMute:(BOOL)mute __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 获取系统当前麦克风设备是否静音
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager getCurrentDeviceMute 接口
 * @return 静音状态
 */
- (BOOL)getCurrentMicDeviceMute __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 获取扬声器设备列表
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager getDevicesList:type: 接口
 * @return 扬声器设备列表，第一项为当前系统默认设备
 */
- (NSArray<TRTCMediaDeviceInfo*>*)getSpeakerDevicesList __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 获取当前的扬声器设备
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager getCurrentDevice 接口
 * @return 当前扬声器设备信息
 */
- (TRTCMediaDeviceInfo*)getCurrentSpeakerDevice __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 设置要使用的扬声器
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager setCurrentDevice 接口
 * @param deviceId 从 getSpeakerDevicesList 中得到的设备 ID
 * @return 0：成功；<0：失败
 */
- (int)setCurrentSpeakerDevice:(NSString*)deviceId __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 当前扬声器设备音量
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager getCurrentDeviceVolume 接口
 * @return 扬声器音量
 */
- (float)getCurrentSpeakerDeviceVolume __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 设置当前扬声器音量
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager setCurrentDeviceVolume 接口
 * 该接口的功能是调节系统播放音量，如果用户直接调节 Mac 系统设置的播放音量时，该接口的设置结果会被用户的操作所覆盖。
 *
 * @param volume 设置的扬声器音量，范围0 - 100
 * @return 0：成功；<0：失败
 */
- (int)setCurrentSpeakerDeviceVolume:(NSInteger)volume __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 设置系统当前扬声器设备的静音状态
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager setCurrentDeviceMute 接口
 * @param mute 设置为 YES 时，扬声器设备静音
 */
- (void)setCurrentSpeakerDeviceMute:(BOOL)mute __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 获取系统当前扬声器设备是否静音
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager getCurrentDeviceMute 接口
 * @return 静音状态
 */
- (BOOL)getCurrentSpeakerDeviceMute __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 获取摄像头设备列表
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager getDevicesList 接口
 * Mac 主机本身自带一个摄像头，也允许插入 USB 摄像头。
 * 如果您希望用户选择自己外接的摄像头，可以提供一个多摄像头选择的功能。
 *
 * @return 摄像头设备列表，第一项为当前系统默认设备
 */
- (NSArray<TRTCMediaDeviceInfo *> *)getCameraDevicesList __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 获取当前使用的摄像头
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager getCurrentDevice 接口
 */
- (TRTCMediaDeviceInfo *)getCurrentCameraDevice __attribute__((deprecated("use getDeviceManager instead")));

/**
 * 设置要使用的摄像头
 *
 * @deprecated v8.0 版本弃用，请使用 TXDeviceManager setCurrentDevice 接口
 * @param deviceId 从 getCameraDevicesList 中得到的设备 ID
 * @return 0：成功；-1：失败
 */
- (int)setCurrentCameraDevice:(NSString *)deviceId __attribute__((deprecated("use getDeviceManager instead")));

#endif

/**
 * 设置要使用的摄像头
 *
 * @deprecated v8.2 版本弃用，请使用 snapshotVideo:type:sourceType:completionBlock 接口
 */
- (void)snapshotVideo:(NSString *)userId
                 type:(TRTCVideoStreamType)type
      completionBlock:(void (^)(TXImage *image))completionBlock __attribute__((deprecated("use snapshotVideo:type:sourceType:completionBlock instead")));

/// @}

@end
///@}
