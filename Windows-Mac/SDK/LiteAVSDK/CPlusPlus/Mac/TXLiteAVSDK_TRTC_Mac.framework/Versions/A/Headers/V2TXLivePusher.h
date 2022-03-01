//
//  Copyright © 2020 Tencent. All rights reserved.
//
//  Module: V2TXLive
//

#import "TXAudioEffectManager.h"
#import "TXBeautyManager.h"
#import "TXDeviceManager.h"
#import "V2TXLivePusherObserver.h"

/// @defgroup V2TXLivePusher_ios V2TXLivePusher
/// 腾讯云直播推流器。<br/>
/// 主要负责将本地的音频和视频画面进行编码，并推送到指定的推流地址，支持任意的推流服务端。
///
/// 推流器包含如下能力：
/// - 自定义的视频采集，让您可以根据项目需要定制自己的音视频数据源；
/// - 美颜、滤镜、贴纸，包含多套美颜磨皮算法（自然&光滑）和多款色彩空间滤镜（支持自定义滤镜）；
/// - Qos 流量控制技术，具备上行网络自适应能力，可以根据主播端网络的具体情况实时调节音视频数据量；
/// - 脸形调整、动效挂件，支持基于优图 AI 人脸识别技术的大眼、瘦脸、隆鼻等脸形微调以及动效挂件效果，只需要购买 **优图 License** 就可以轻松实现丰富的直播效果。
///
/// @{

@protocol V2TXLivePusher <NSObject>

/////////////////////////////////////////////////////////////////////////////////
//
//                    推流器相关接口
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 设置推流器回调。
 *
 * 通过设置回调，可以监听 V2TXLivePusher 推流器的一些回调事件，
 * 包括推流器状态、音量回调、统计数据、警告和错误信息等。
 *
 * @param observer 推流器的回调目标对象，更多信息请查看 {@link V2TXLivePusherObserver}
 */
- (void)setObserver:(id<V2TXLivePusherObserver>)observer;

/**
 * 设置本地摄像头预览 View。
 *
 * 本地摄像头采集到的画面，经过美颜、脸形调整、滤镜等多种效果叠加之后，最终会显示到传入的 View 上。
 *
 * @param view 本地摄像头预览 View
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK：成功
 */
- (V2TXLiveCode)setRenderView:(TXView *)view;

/**
 * 设置本地摄像头预览镜像。
 *
 * 本地摄像头分为前置摄像头和后置摄像头，系统默认情况下，是前置摄像头镜像，后置摄像头不镜像，这里可以修改前置后置摄像头的默认镜像类型。
 *
 * @param mirrorType 摄像头镜像类型 {@link V2TXLiveMirrorType}
 *         - V2TXLiveMirrorTypeAuto  【默认值】: 默认镜像类型. 在这种情况下，前置摄像头的画面是镜像的，后置摄像头的画面不是镜像的
 *         - V2TXLiveMirrorTypeEnable:  前置摄像头 和 后置摄像头，都切换为镜像模式
 *         - V2TXLiveMirrorTypeDisable: 前置摄像头 和 后置摄像头，都切换为非镜像模式
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)setRenderMirror:(V2TXLiveMirrorType)mirrorType;

/**
 * 设置视频编码镜像。
 *
 * @note  编码镜像只影响观众端看到的视频效果。
 * @param mirror 是否镜像
 *         - NO【默认值】: 播放端看到的是非镜像画面
 *         - YES: 播放端看到的是镜像画面
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)setEncoderMirror:(BOOL)mirror;

/**
 * 设置本地摄像头预览画面的旋转角度。
 *
 * @note  只旋转本地预览画面，不影响推流出去的画面。
 * @param rotation 预览画面的旋转角度 {@link V2TXLiveRotation}
 *         - V2TXLiveRotation0【默认值】: 0度, 不旋转
 *         - V2TXLiveRotation90:  顺时针旋转90度
 *         - V2TXLiveRotation180: 顺时针旋转180度
 *         - V2TXLiveRotation270: 顺时针旋转270度
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)setRenderRotation:(V2TXLiveRotation)rotation;

#if TARGET_OS_IPHONE

/**
 * 打开本地摄像头。
 *
 * @note startVirtualCamera，startCamera，startScreenCapture，同一 Pusher 实例下，仅有一个能上行，三者为覆盖关系。例如先调用 startCamera，后调用 startVirtualCamera。此时表现为暂停摄像头推流，开启图片推流
 *
 * @param frontCamera 是否为前置摄像头
 *         - YES 【默认值】: 切换到前置摄像头
 *         - NO: 切换到后置摄像头
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)startCamera:(BOOL)frontCamera;
#else

/**
 * 打开本地摄像头。
 *
 * @note startVirtualCamera，startCamera，startScreenCapture，同一 Pusher 实例下，仅有一个能上行，三者为覆盖关系。例如先调用 startCamera，后调用 startVirtualCamera。此时表现为暂停摄像头推流，开启图片推流
 *
 * @param cameraId 摄像头标识
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)startCamera:(NSString *)cameraId;
#endif

/**
 * 关闭本地摄像头。
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)stopCamera;

/**
 * 打开麦克风。
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)startMicrophone;

/**
 * 关闭麦克风。
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)stopMicrophone;

/**
 * 开启图片推流。
 *
 * @param image 图片
 *
 * @note startVirtualCamera，startCamera，startScreenCapture，同一 Pusher 实例下，仅有一个能上行，三者为覆盖关系。例如先调用 startCamera，后调用 startVirtualCamera。此时表现为暂停摄像头推流，开启图片推流
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)startVirtualCamera:(TXImage *)image;

/**
 * 关闭图片推流。
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)stopVirtualCamera;

#if TARGET_OS_IPHONE

/**
 * 开始全系统的屏幕分享（该接口支持 iOS 11.0 及以上的 iPhone 和 iPad）。
 *
 * @note 该接口支持共享整个 iOS 系统的屏幕，可以实现类似腾讯会议的全系统级的屏幕分享。<br/>
 *         需要通过 iOS Broadcast Upload Extension 来开启屏幕采集，
 *         然后设置 [enableCustomVideoCapture](@ref V2TXLivePusher#enableCustomVideoCapture:) 开启自定义采集支持。
 *         最后通过 [sendCustomVideoFrame](@ref V2TXLivePusher#sendCustomVideoFrame:) 把 Broadcast Upload Extension 中采集到的屏幕画面送出去。
 *
 * @note startVirtualCamera，startCamera，startScreenCapture，同一 Pusher 实例下，仅有一个能上行，三者为覆盖关系。例如先调用 startCamera，后调用 startVirtualCamera。此时表现为暂停摄像头推流，开启图片推流
 *
 * @param appGroup 主 App 与 Broadcast 共享的 Application Group Identifier，可以指定为 nil，但按照文档设置会使功能更加可靠。
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_ERROR_NOT_SUPPORTED: 功能不支持
 */
- (V2TXLiveCode)startScreenCapture:(NSString *)appGroup;
#endif

/**
 * 关闭屏幕采集。
 *
 * @note iOS 端暂不支持通过此接口关闭屏幕采集。<br/>
 *         可以直接在 iOS 系统的屏幕录制界面上关闭屏幕录制，
 *         也可以通过 [enableCustomVideoCapture](@ref V2TXLivePusher#enableCustomVideoCapture:) 关闭自定义采集支持。
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_ERROR_NOT_SUPPORTED: 功能不支持
 */
- (V2TXLiveCode)stopScreenCapture;

/**
 * 静音本地音频。
 *
 * 静音本地音频后，SDK 不会继续采集麦克风的声音
 * 与 stopMicrophone 不同之处在于 pauseAudio 并不会停止发送音频数据，而是继续发送码率极低的静音包
 * 由于 MP4 等视频文件格式，对于音频的连续性是要求很高的，使用 stopMicrophone 会导致录制出的 MP4 不易播放
 * 因此在对录制质量要求很高的场景中，建议选择 pauseAudio，从而录制出兼容性更好的 MP4 文件
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)pauseAudio;

/**
 * 取消静音本地音频。
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)resumeAudio;

/**
 * 暂停推流器的视频流。
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)pauseVideo;

/**
 * 恢复推流器的视频流。
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)resumeVideo;

/**
 * 开始音视频数据推流。
 *
 * @param url 推流的目标地址，支持任意推流服务端
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 操作成功，开始连接推流目标地址
 *         - V2TXLIVE_ERROR_INVALID_PARAMETER: 操作失败，url 不合法
 *         - V2TXLIVE_ERROR_INVALID_LICENSE: 操作失败，license 不合法，鉴权失败
 *         - V2TXLIVE_ERROR_REFUSED: 操作失败，RTC 不支持同一设备上同时推拉同一个 StreamId
 */
- (V2TXLiveCode)startPush:(NSString *)url;

/**
 * 停止推送音视频数据。
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)stopPush;

/**
 * 当前推流器是否正在推流中。
 *
 * @return 是否正在推流
 *         - 1: 正在推流中
 *         - 0: 已经停止推流
 */
- (int)isPushing;

/**
 * 设置推流音频质量。
 *
 * @param quality 音频质量 {@link V2TXLiveAudioQuality}
 *         - V2TXLiveAudioQualityDefault 【默认值】: 通用
 *         - V2TXLiveAudioQualitySpeech: 语音
 *         - V2TXLiveAudioQualityMusic:  音乐
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 *         - V2TXLIVE_ERROR_REFUSED: 推流过程中，不允许调整音质
 */
- (V2TXLiveCode)setAudioQuality:(V2TXLiveAudioQuality)quality;

/**
 * 设置推流视频编码参数
 *
 * @param param  视频编码参数 {@link V2TXLiveVideoEncoderParam}
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)setVideoQuality:(V2TXLiveVideoEncoderParam *)param;

/**
 * 获取音效管理对象 {@link TXAudioEffectManager}。
 *
 * 通过音效管理，您可以使用以下功能：
 * - 调整麦克风收集的人声音量。
 * - 设置混响和变声效果。
 * - 开启耳返，设置耳返音量。
 * - 添加背景音乐，调整背景音乐的播放效果。
 */
- (TXAudioEffectManager *)getAudioEffectManager;

/**
 * 获取美颜管理对象 {@link TXBeautyManager}。
 *
 * 通过美颜管理，您可以使用以下功能：
 * - 设置”美颜风格”、”美白”、“红润”、“大眼”、“瘦脸”、“V脸”、“下巴”、“短脸”、“小鼻”、“亮眼”、“白牙”、“祛眼袋”、“祛皱纹”、“祛法令纹”等美容效果。
 * - 调整“发际线”、“眼间距”、“眼角”、“嘴形”、“鼻翼”、“鼻子位置”、“嘴唇厚度”、“脸型”。
 * - 设置人脸挂件（素材）等动态效果。
 * - 添加美妆。
 * - 进行手势识别。
 */
- (TXBeautyManager *)getBeautyManager;

/**
 * 获取设备管理对象 {@link TXDeviceManager}。
 *
 * 通过设备管理，您可以使用以下功能：
 * - 切换前后摄像头。
 * - 设置自动聚焦。
 * - 设置摄像头缩放倍数。
 * - 打开或关闭闪光灯。
 * - 切换耳机或者扬声器。
 * - 修改音量类型(媒体音量或者通话音量)。
 */
- (TXDeviceManager *)getDeviceManager;

/**
 * 截取推流过程中的本地画面。
 *
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 *         - V2TXLIVE_ERROR_REFUSED: 已经停止推流，不允许调用截图操作
 */
- (V2TXLiveCode)snapshot;

/**
 * 设置推流器水印。默认情况下，水印不开启。
 *
 * @param image 水印图片。如果该值为 nil，则等效于禁用水印
 * @param x     水印的横坐标，取值范围为0 - 1的浮点数。
 * @param y     水印的纵坐标，取值范围为0 - 1的浮点数。
 * @param scale 水印图片的缩放比例，取值范围为0 - 1的浮点数。
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)setWatermark:(TXImage *)image x:(float)x y:(float)y scale:(float)scale;

/**
 * 启用采集音量大小提示。
 *
 * 开启后可以在 [onMicrophoneVolumeUpdate](@ref V2TXLivePusherObserver#onMicrophoneVolumeUpdate:) 回调中获取到 SDK 对音量大小值的评估。
 * @param intervalMs 决定了音量大小回调的触发间隔，单位为 ms，最小间隔为 100ms，如果小于等于0则会关闭回调，建议设置为 300ms。【默认值】：0，不开启
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)enableVolumeEvaluation:(NSUInteger)intervalMs;

/**
 * 开启/关闭自定义视频处理。
 *
 * @note RTMP 协议下仅支持 OpenGL 纹理格式的回调。
 * @param enable YES: 开启; NO: 关闭。【默认值】：NO
 * @param pixelFormat 指定回调的像素格式，【注意】：RTMP 协议下仅支持 V2TXLivePixelFormatTexture2D
 * @param bufferType 指定回调的数据格式，【注意】：RTMP 协议下仅支持 V2TXLiveBufferTypeTexture
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 *         - V2TXLIVE_ERROR_NOT_SUPPORTED: 不支持的格式
 */
- (V2TXLiveCode)enableCustomVideoProcess:(BOOL)enable pixelFormat:(V2TXLivePixelFormat)pixelFormat bufferType:(V2TXLiveBufferType)bufferType;

/**
 * 开启/关闭自定义视频采集。
 *
 * 在自定义视频采集模式下，SDK 不再从摄像头采集图像，只保留编码和发送能力。
 * @note  需要在 [startPush](@ref V2TXLivePusher#startPush:) 之前调用，才会生效。
 * @param enable YES：开启自定义采集；NO：关闭自定义采集。【默认值】：NO
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)enableCustomVideoCapture:(BOOL)enable;

/**
 * 开启/关闭自定义音频采集
 *
 *  @brief 开启/关闭自定义音频采集。<br/>
 *         在自定义音频采集模式下，SDK 不再从麦克风采集声音，只保留编码和发送能力。
 *  @note   需要在 [startPush]({@link V2TXLivePusher#startPush(String)}) 前调用才会生效。
 *  @param enable YES: 开启自定义采集; NO: 关闭自定义采集。【默认值】: NO
 *  @return 返回值 {@link V2TXLiveCode}
 *          - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)enableCustomAudioCapture:(BOOL)enable;

/**
 * 在自定义视频采集模式下，将采集的视频数据发送到SDK。
 *
 * 在自定义视频采集模式下，SDK不再采集摄像头数据，仅保留编码和发送功能。
 * 您可以把采集到的 SampleBuffer 打包到 V2TXLiveVideoFrame 中，然后通过该API定期的发送。
 *
 * @note  需要在 [startPush](@ref V2TXLivePusher#startPush:) 之前调用 [enableCustomVideoCapture](@ref V2TXLivePusher#enableCustomVideoCapture:) 开启自定义采集。
 * @param videoFrame 向 SDK 发送的 视频帧数据 {@link V2TXLiveVideoFrame}
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 *         - V2TXLIVE_ERROR_INVALID_PARAMETER: 发送失败，视频帧数据不合法
 *         - V2TXLIVE_ERROR_REFUSED: 您必须先调用 enableCustomVideoCapture 开启自定义视频采集。
 */
- (V2TXLiveCode)sendCustomVideoFrame:(V2TXLiveVideoFrame *)videoFrame;

/**
 * 在自定义音频采集模式下，将采集的音频数据发送到SDK
 *
 *  @brief 在自定义音频采集模式下，将采集的音频数据发送到SDK，SDK不再采集麦克风数据，仅保留编码和发送功能。
 *  @note   需要在 [startPush]({@link V2TXLivePusher#startPush(String)}) 之前调用  {@link V2TXLivePusher#enableCustomAudioCapture(boolean)} 开启自定义采集。
 *  @param audioFrame 向 SDK 发送的 音频帧数据 {@link V2TXLiveAudioFrame}
 *  @return 返回值 {@link V2TXLiveCode}
 *            - V2TXLIVE_OK: 成功
 *            - V2TXLIVE_ERROR_REFUSED: 发送失败，您必须先调用 enableCustomAudioCapture 开启自定义音频采集
 */
- (V2TXLiveCode)sendCustomAudioFrame:(V2TXLiveAudioFrame *)audioFrame;

/**
 * 发送 SEI 消息
 *
 * 播放端 {@link V2TXLivePlayer} 通过 {@link V2TXLivePlayerObserver} 中的  `onReceiveSeiMessage` 回调来接收该消息。
 *
 * @param payloadType 数据类型，支持 5、242。推荐填：242
 * @param data        待发送的数据
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 */
- (V2TXLiveCode)sendSeiMessage:(int)payloadType data:(NSData *)data;

/**
 * 显示仪表盘。
 *
 * @param isShow 是否显示。【默认值】：NO
 */
- (void)showDebugView:(BOOL)isShow;

/**
 * 调用 V2TXLivePusher 的高级 API 接口。
 *
 * @note  该接口用于调用一些高级功能。
 * @param key   高级 API 对应的 key。
 * @param value 调用 key 所对应的高级 API 时，需要的参数。
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 *         - V2TXLIVE_ERROR_INVALID_PARAMETER: 操作失败，key 不允许为 nil
 */
- (V2TXLiveCode)setProperty:(NSString *)key value:(NSObject *)value;

/**
 * 设置云端的混流转码参数
 *
 * 如果您在实时音视频 [控制台](https://console.cloud.tencent.com/trtc/) 中的功能配置页开启了“启用旁路推流”功能，
 * 房间里的每一路画面都会有一个默认的直播 [CDN 地址](https://cloud.tencent.com/document/product/647/16826)
 *
 * 一个直播间中可能有不止一位主播，而且每个主播都有自己的画面和声音，但对于 CDN 观众来说，他们只需要一路直播流
 * 所以您需要将多路音视频流混成一路标准的直播流，这就需要混流转码
 *
 * 当您调用 setMixTranscodingConfig 接口时，SDK 会向腾讯云的转码服务器发送一条指令，目的是将房间里的多路音视频流混合为一路,
 * 您可以通过 mixUsers 参数来调整每一路画面的位置，以及是否只混合声音，也可以通过 videoWidth、videoHeight、videoBitrate 等参数控制混合音视频流的编码参数
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
 * 参考文档：[云端混流转码](https://cloud.tencent.com/document/product/647/16827)
 *
 * @note 关于云端混流的注意事项：
 * - 云端转码会引入一定的 CDN 观看延时，大概会增加1 - 2秒
 * - 调用该函数的用户，会将连麦中的多路画面混合到自己当前这路画面或者 config 中指定的 streamId 上
 * - 请注意，若您还在房间中且不再需要混流，请务必传入 nil 进行取消，因为当您发起混流后，云端混流模块就会开始工作，不及时取消混流可能会引起不必要的计费损失
 * - 请放心，您退房时会自动取消混流状态
 * @param config 请参考 V2TXLiveDef.h 中关于 {@link V2TXLiveTranscodingConfig} 的介绍。如果传入 nil 则取消云端混流转码
 * @return 返回值 {@link V2TXLiveCode}
 *         - V2TXLIVE_OK: 成功
 *         - V2TXLIVE_ERROR_REFUSED: 未开启推流时，不允许设置混流转码参数
 */
- (V2TXLiveCode)setMixTranscodingConfig:(V2TXLiveTranscodingConfig *)config;

@end

/// @}

@interface V2TXLivePusher : NSObject <V2TXLivePusher>

/**
 * 初始化直播推流器
 *
 * @param liveMode 推流协议类型：RTMP/ROOM 协议，默认值：RTMP
 */
- (instancetype)initWithLiveMode:(V2TXLiveMode)liveMode;

@end
