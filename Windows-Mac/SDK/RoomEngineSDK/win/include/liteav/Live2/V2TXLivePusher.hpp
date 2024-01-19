/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   V2TXLivePusher @ TXLiteAVSDK
 * Function: 腾讯云直播推流器
 * <H2>功能
 * 腾讯云直播推流器
 * <H2>介绍
 * 主要负责将本地的音频和视频画面进行编码，并推送到指定的推流地址，支持任意的推流服务端。
 * 推流器包含如下能力：
 * - 自定义的视频采集，让您可以根据项目需要定制自己的音视频数据源。
 * - 美颜、滤镜、贴纸，包含多套美颜磨皮算法（自然&光滑）和多款色彩空间滤镜（支持自定义滤镜）。
 * - Qos 流量控制技术，具备上行网络自适应能力，可以根据主播端网络的具体情况实时调节音视频数据量。
 * - 脸型调整、动效挂件，支持基于优图 AI 人脸识别技术的大眼、瘦脸、隆鼻等脸型微调以及动效挂件效果，只需要购买 优图 License 就可以轻松实现丰富的直播效果。
 */
#ifndef MODULE_CPP_V2TXLIVEPUSHER_H_
#define MODULE_CPP_V2TXLIVEPUSHER_H_

#include "V2TXLiveDef.hpp"
#include "V2TXLivePusherObserver.hpp"
#include "ITXAudioEffectManager.h"
#include "ITXDeviceManager.h"

namespace liteav {
class V2TXLivePusher;
}

extern "C" {
#ifdef __ANDROID__

/////////////////////////////////////////////////////////////////////////////////
//
//                    推流器相关接口
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 用于动态加载 dll 时，获取 V2TXLivePusher 对象指针。
 *
 * @return 返回 V2TXLivePusher 对象的指针，注意：需要调用 releaseV2TXLivePusher析构。
 * @param context Android 上下文，内部会转为 ApplicationContext 用于系统 API 调用。
 * @param mode 推流协议，RTMP还是ROOM。
 * @note 本接口仅适用于Android平台。
 */
V2_API liteav::V2TXLivePusher* createV2TXLivePusher(void* context, liteav::V2TXLiveMode mode);
#else

/**
 * 用于动态加载 dll 时，获取 V2TXLivePusher 对象指针。
 *
 * @return 返回 V2TXLivePusher 对象的指针，注意：需要调用 releaseV2TXLivePusher析构。
 * @param mode 推流协议，RTMP还是ROOM。
 * @note 本接口适用于Windows、Mac、iOS平台。
 */
V2_API liteav::V2TXLivePusher* createV2TXLivePusher(liteav::V2TXLiveMode mode);
#endif

/**
 * 析构 V2TXLivePusher 对象
 *
 * @param pusher V2TXLivePusher 对象的指针。
 */
V2_API void releaseV2TXLivePusher(liteav::V2TXLivePusher* pusher);
}

namespace liteav {

class V2TXLivePusher {
   public:
    /**
     * 设置推流器回调
     *
     * 通过设置回调，可以监听 V2TXLivePusher 推流器的一些回调事件，
     * 包括推流器状态、音量回调、统计数据、警告和错误信息等。
     * @param observer 推流器的回调目标对象，更多信息请查看 {@link V2TXLivePusherObserver}。
     */
    virtual void setObserver(V2TXLivePusherObserver* observer) = 0;

    /**
     * 设置本地摄像头预览 View
     *
     * 本地摄像头采集到的画面，经过美颜、脸型调整、滤镜等多种效果叠加之后，最终会显示到传入的 View 上。
     * @param view 本地摄像头预览 View。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK：成功。
     */
    virtual int32_t setRenderView(void* view) = 0;

    /**
     * 设置本地摄像头预览镜像
     *
     * 本地摄像头分为前置摄像头和后置摄像头，系统默认情况下，是前置摄像头镜像，后置摄像头不镜像，这里可以修改前置后置摄像头的默认镜像类型。
     * @param mirrorType 摄像头镜像类型 {@link V2TXLiveMirrorType}。
     *         - V2TXLiveMirrorTypeAuto  【默认值】: 默认镜像类型. 在这种情况下，前置摄像头的画面是镜像的，后置摄像头的画面不是镜像的。
     *         - V2TXLiveMirrorTypeEnable:  前置摄像头 和 后置摄像头，都切换为镜像模式。
     *         - V2TXLiveMirrorTypeDisable: 前置摄像头 和 后置摄像头，都切换为非镜像模式。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t setRenderMirror(V2TXLiveMirrorType mirrorType) = 0;

    /**
     * 设置视频编码镜像
     *
     * @param mirror 是否镜像。
     *         - false【默认值】: 播放端看到的是非镜像画面。
     *         - true: 播放端看到的是镜像画面。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     * @note  编码镜像只影响观众端看到的视频效果。
     */
    virtual int32_t setEncoderMirror(bool mirror) = 0;

    /**
     * 设置本地摄像头预览画面的旋转角度
     *
     * @param rotation 预览画面的旋转角度 {@link V2TXLiveRotation}。
     *         - V2TXLiveRotation0【默认值】: 0度, 不旋转。
     *         - V2TXLiveRotation90:  顺时针旋转90度。
     *         - V2TXLiveRotation180: 顺时针旋转180度。
     *         - V2TXLiveRotation270: 顺时针旋转270度。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     * @note  只旋转本地预览画面，不影响推流出去的画面。
     */
    virtual int32_t setRenderRotation(V2TXLiveRotation rotation) = 0;

    /**
     * 设置本地摄像头预览画面的填充模式
     *
     * @param mode 画面填充模式 {@link V2TXLiveFillMode}。
     *         - V2TXLiveFillModeFill 【默认值】: 图像铺满屏幕，不留黑边，如果图像宽高比不同于屏幕宽高比，部分画面内容会被裁剪掉。
     *         - V2TXLiveFillModeFit: 图像适应屏幕，保持画面完整，但如果图像宽高比不同于屏幕宽高比，会有黑边的存在。
     *         - V2TXLiveFillModeScaleFill: 图像拉伸铺满，因此长度和宽度可能不会按比例变化。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t setRenderFillMode(V2TXLiveFillMode mode) = 0;

#if TARGET_PLATFORM_PHONE

    /**
     * 打开本地摄像头
     *
     * @param frontCamera 指定摄像头方向是否为前置。
     *         - true 【默认值】: 切换到前置摄像头。
     *         - false: 切换到后置摄像头。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t startCamera(bool frontCamera) = 0;
#elif TARGET_PLATFORM_DESKTOP

    /**
     * 打开本地摄像头
     *
     * @param cameraId 摄像头标识。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     * @note startVirtualCamera，startCamera，startScreenCapture，同一 Pusher
     * 实例下，仅有一个采集源可以上行，不同采集源之间切换，请先关闭前一采集源，再开启后一采集源，保证同一采集源的开启和关闭是成对调用的。比如：采集源从Camera切换到VirtualCamera，调用顺序是 startCamera -> stopCamera -> startVirtualCamera。
     */
    virtual int32_t startCamera(const char* cameraId) = 0;
#endif

    /**
     * 关闭本地摄像头
     *
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t stopCamera() = 0;

    /**
     * 打开麦克风
     *
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t startMicrophone() = 0;

    /**
     * 关闭麦克风
     *
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t stopMicrophone() = 0;

    /**
     * 开启图片推流
     *
     * @param image 图片。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     * @note startVirtualCamera，startCamera，startScreenCapture，同一 Pusher
     * 实例下，仅有一个采集源可以上行，不同采集源之间切换，请先关闭前一采集源，再开启后一采集源，保证同一采集源的开启和关闭是成对调用的。比如：采集源从Camera切换到VirtualCamera，调用顺序是 startCamera -> stopCamera -> startVirtualCamera。
     */
    virtual int32_t startVirtualCamera(V2TXLiveImage* image) = 0;

    /**
     * 关闭图片推流
     *
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t stopVirtualCamera() = 0;

    /**
     * 暂停推流器的音频流
     *
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t pauseAudio() = 0;

    /**
     * 恢复推流器的音频流
     *
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t resumeAudio() = 0;

    /**
     * 暂停推流器的视频流
     *
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t pauseVideo() = 0;

    /**
     * 恢复推流器的视频流
     *
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t resumeVideo() = 0;

    /**
     * 开始音视频数据推流
     *
     * @param url 推流的目标地址，支持任意推流服务端。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 操作成功，开始连接推流目标地址。
     *         - V2TXLIVE_ERROR_INVALID_PARAMETER: 操作失败，url 不合法。
     *         - V2TXLIVE_ERROR_INVALID_LICENSE: 操作失败，license 不合法，鉴权失败。
     *         - V2TXLIVE_ERROR_REFUSED: 操作失败，RTC 不支持同一设备上同时推拉同一个 StreamId。
     */
    virtual int32_t startPush(const char* url) = 0;

    /**
     * 停止推送音视频数据
     *
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t stopPush() = 0;

    /**
     * 当前推流器是否正在推流中
     *
     * @return 是否正在推流。
     *         - 1: 正在推流中。
     *         - 0: 已经停止推流。
     */
    virtual int32_t isPushing() = 0;

    /**
     * 设置推流音频质量
     *
     * @param quality 音频质量 {@link V2TXLiveAudioQuality}。
     *         - V2TXLiveAudioQualityDefault 【默认值】: 通用。
     *         - V2TXLiveAudioQualitySpeech: 语音。
     *         - V2TXLiveAudioQualityMusic:  音乐。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     *         - V2TXLIVE_ERROR_REFUSED: 推流过程中，不允许调整音质。
     */
    virtual int32_t setAudioQuality(V2TXLiveAudioQuality quality) = 0;

    /**
     * 设置推流视频编码参数
     *
     * @param param  视频编码参数 {@link V2TXLiveVideoEncoderParam}。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t setVideoQuality(const V2TXLiveVideoEncoderParam& param) = 0;

    /**
     * 获取音效管理对象
     *
     * 通过音效管理，您可以使用以下功能：
     * - 调整麦克风收集的人声音量。
     * - 设置混响和变声效果。
     * - 开启耳返，设置耳返音量。
     * - 添加背景音乐，调整背景音乐的播放效果。
     * 参考  {@link TXAudioEffectManager}
     */
    virtual ITXAudioEffectManager* getAudioEffectManager() = 0;

    /**
     * 获取设备管理对象
     *
     * 通过设备管理，您可以使用以下功能：
     * - 切换前后摄像头。
     * - 设置自动聚焦。
     * - 设置摄像头缩放倍数。
     * - 打开或关闭闪光灯。
     * - 切换耳机或者扬声器。
     * - 修改音量类型(媒体音量或者通话音量)。
     * 参考  {@link TXDeviceManager}
     */
    virtual ITXDeviceManager* getDeviceManager() = 0;

    /**
     * 设置美颜、美白、红润等特效
     *
     * SDK 内部集成了两套风格不同的磨皮算法：
     * -“光滑”：算法比较激进，磨皮效果比较明显，适用于秀场直播。
     * -“自然”：算法更多地保留了面部细节，磨皮效果更加自然，适用于绝大多数直播场景。
     * @param style 磨皮算法，有“光滑”和“自然”两种算法。
     * @param beautyLevel 美颜级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显。
     * @param whitenessLevel 美白级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显。
     * @param ruddinessLevel 红润级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显。
     */
    virtual void setBeautyStyle(V2TXLiveBeautyStyle style, uint32_t beauty, uint32_t white, uint32_t ruddiness) = 0;

    /**
     * 截取推流过程中的本地画面
     *
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     *         - V2TXLIVE_ERROR_REFUSED: 已经停止推流，不允许调用截图操作。
     */
    virtual int32_t snapshot() = 0;

    /**
     * 设置推流器水印。默认情况下，水印不开启。
     *
     * 水印的位置是通过 x, y, scale 来指定的。
     * - x：水印的坐标，取值范围为0 - 1的浮点数。
     * - y：水印的坐标，取值范围为0 - 1的浮点数。
     * - scale：水印的大小比例，取值范围为0 - 1的浮点数。
     *
     * @param watermarkPath 水印图片文件路径，为 nullptr 则等同于关闭水印。
     * @param x             水印显示的左上角 x 轴偏移。
     * @param y             水印显示的左上角 y 轴偏移。
     * @param scale         水印显示的宽度占画面宽度比例（水印按该参数等比例缩放显示）。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     * @note watermarkPath
     * 1、在 iOS/Mac 坏境下，如果图片存放在 .xcassets 中，请直接传入文件名：
     * self.pusher->setWatermark(“imageName”, 0.1, 0.1, 0.2)。
     * 2、在 Android 坏境，如果图片存放在 assets 目录下，请直接传入文件名或者路径名：
     * self.pusher->setWatermark(“imageName.png”, 0.1, 0.1, 0.2)。
     * 其它没有列举到的情况，按照各平台的方式获取文件路径并传入即可。
     */
    virtual int32_t setWatermark(const char* watermarkPath, float x, float y, float scale) = 0;

    /**
     * 启用采集音量大小提示
     *
     * 开启后可以在 {@link onMicrophoneVolumeUpdate} 回调中获取到 SDK 对音量大小值的评估。
     * @param intervalMs 决定了 onMicrophoneVolumeUpdate 回调的触发间隔，单位为ms，最小间隔为100ms，如果小于等于0则会关闭回调，建议设置为300ms；【默认值】：0，不开启。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t enableVolumeEvaluation(int32_t intervalMs) = 0;

    /**
     * 开启/关闭视频自定义预处理
     *
     * @param enable      是否开启自定义视频预处理。【默认值】：false。
     * @param pixelFormat 自定义视频预处理回调的视频像素格式 {@link V2TXLivePixelFormat}。
     * @param bufferType  自定义视频预处理的视频数据格式 {@link V2TXLiveBufferType}。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     *         - V2TXLIVE_ERROR_NOT_SUPPORTED: 不支持的格式。
     * @note 支持的格式组合：
     *         V2TXLivePixelFormatBGRA32+V2TXLiveBufferTypeByteBuffer
     *         V2TXLivePixelFormatI420+V2TXLiveBufferTypeByteBuffer
     */
    virtual int32_t enableCustomVideoProcess(bool enable, V2TXLivePixelFormat pixelFormat, V2TXLiveBufferType bufferType) = 0;

    /**
     * 开启/关闭自定义视频采集
     *
     * 在自定义视频采集模式下，SDK 不再从摄像头采集图像，只保留编码和发送能力。
     * @param enable true：开启自定义采集；false：关闭自定义采集。【默认值】：false。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     * @note  需要在 {@link startPush} 之前调用，才会生效。
     */
    virtual int32_t enableCustomVideoCapture(bool enable) = 0;

    /**
     * 设置本地视频自定义渲染回调
     *
     * 通过该方法，可以获取解码后的每一帧视频画面，进行自定义渲染处理，添加自定义显示效果。
     * @param enable      是否开启自定义渲染。【默认值】：false。
     * @param pixelFormat 自定义渲染回调的视频像素格式 {@link V2TXLivePixelFormat}。
     * @param bufferType  自定义渲染回调的视频数据格式 {@link V2TXLiveBufferType}。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t enableCustomVideoRender(bool enable, V2TXLivePixelFormat pixelFormat, V2TXLiveBufferType bufferType) = 0;

    /**
     * 开启/关闭自定义音频采集
     *
     * @brief 开启/关闭自定义音频采集。
     *         在自定义音频采集模式下，SDK 不再从麦克风采集声音，只保留编码和发送能力。
     * @param enable true: 开启自定义采集; false: 关闭自定义采集。【默认值】: false。
     * @return 返回值 {@link V2TXLiveCode}。
     *          - V2TXLIVE_OK: 成功。
     * @note   需要在 {@link startPush} 前调用才会生效。
     */
    virtual int32_t enableCustomAudioCapture(bool enable) = 0;

    /**
     * 在自定义视频采集模式下，将采集的视频数据发送到SDK
     *
     * 在自定义视频采集模式下，SDK不再采集摄像头数据，仅保留编码和发送功能。
     * @param videoFrame 向 SDK 发送的 视频帧数据 {@link V2TXLiveVideoFrame}。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     *         - V2TXLIVE_ERROR_INVALID_PARAMETER: 发送失败，视频帧数据不合法。
     * @note  需要在 {@link startPush} 之前调用 {@link enableCustomVideoCapture} 开启自定义采集。
     */
    virtual int32_t sendCustomVideoFrame(V2TXLiveVideoFrame* videoFrame) = 0;

    /**
     * 在自定义音频采集模式下，将采集的音频数据发送到SDK
     *
     *  @info 在自定义音频采集模式下，将采集的音频数据发送到SDK，SDK不再采集麦克风数据，仅保留编码和发送功能。
     *  @param audioFrame 向 SDK 发送的 音频帧数据 {@link V2TXLiveAudioFrame}。
     *  @return 返回值 {@link V2TXLiveCode}。
     *            - V2TXLIVE_OK: 成功。
     *            - V2TXLIVE_ERROR_INVALID_PARAMETER: 发送失败，音频帧数据不合法。
     *  @note   需要在 {@link startPush} 之前调用  {@link enableCustomAudioCapture} 开启自定义采集。
     */
    virtual int32_t sendCustomAudioFrame(V2TXLiveAudioFrame* audioFrame) = 0;

    /**
     * 发送 SEI 消息
     *
     * 播放端 {@link V2TXLivePlayer} 通过 {@link V2TXLivePlayerObserver} 中的 `onReceiveSeiMessage` 回调来接收该消息。
     * @param payloadType 数据类型，支持 5、242。推荐填：242。
     * @param data        待发送的数据。
     * @param dataSize    数据大小。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     */
    virtual int32_t sendSeiMessage(int payloadType, const uint8_t* data, uint32_t dataSize) = 0;

    /**
     * 启动屏幕分享
     *
     * @note startVirtualCamera，startCamera，startScreenCapture，同一 Pusher
     * 实例下，仅有一个采集源可以上行，不同采集源之间切换，请先关闭前一采集源，再开启后一采集源，保证同一采集源的开启和关闭是成对调用的。比如：采集源从Camera切换到ScreenCapture，调用顺序是 startCamera -> stopCamera -> startScreenCapture。
     */
    virtual int32_t startScreenCapture() = 0;

    /**
     * 停止屏幕采集
     */
    virtual int32_t stopScreenCapture() = 0;

#if TARGET_PLATFORM_DESKTOP

    /**
     * 打开系统声音采集
     *
     * 开启后可以采集整个操作系统的播放声音（path 为空）或某一个播放器（path 不为空）的声音，
     * 并将其混入到当前麦克风采集的声音中一起发送到云端。
     * @param path
     *        - path 为空，代表采集整个操作系统的声音。( Windows 平台)。
     *        - path 填写 exe 程序（如 QQ音乐）所在的路径，将会启动此程序并只采集此程序的声音。( Windows 平台，采集程序声音仅支持32位 SDK )。
     *        - path 默认为空，其他值未定义。（ Mac 平台）。
     * @note 此接口目前仅适用于 Windows 、 Mac 平台。
     */
    virtual int32_t startSystemAudioLoopback(const char* path = nullptr) = 0;

    /**
     * 关闭系统声音采集
     *
     * @note 此接口目前仅适用于 Windows 、 Mac 平台。
     */
    virtual int32_t stopSystemAudioLoopback() = 0;

    /**
     * 枚举可分享的屏幕窗口
     *
     * 如果您要给您的 App 增加屏幕分享功能，一般需要先显示一个窗口选择界面，这样用户可以选择希望分享的窗口。
     * 通过如下函数，您可以获得可分享窗口的 ID、类型、窗口名称以及缩略图。
     * 拿到这些信息后，您就可以实现一个窗口选择界面，当然，您也可以使用我们在 Demo 源码中已经实现好的一个界面。
     * @param thumbSize 指定要获取的窗口缩略图大小，缩略图可用于绘制在窗口选择界面上。
     * @param iconSize  指定要获取的窗口图标大小。
     * @return 窗口列表包括屏幕。
     * @note
     * - 返回的列表中包括屏幕和应用窗口，屏幕会在列表的前面几个元素中。
     * - delete IV2TXLiveScreenCaptureSourceList* 指针会导致编译错误，SDK 维护 IV2TXLiveScreenCaptureSourceList 对象的生命周期。
     * - 获取完屏幕窗口列表后请手动调用 IV2TXLiveScreenCaptureSourceList 的 release 方法释放资源，否则可能会引起内存泄漏。
     * - Windows 平台 v8.3 版本后获取窗口列表默认携带最小化窗口，且最小化窗口的缩略图数据默认填充窗口图标数据。
     *
     */
    virtual IV2TXLiveScreenCaptureSourceList* getScreenCaptureSources(const V2TXLiveSize& thumbSize, const V2TXLiveSize& iconSize) = 0;

    /**
     * 设置屏幕分享参数，该方法在屏幕分享过程中也可以调用。
     *
     * 如果您期望在屏幕分享的过程中，切换想要分享的窗口，可以再次调用这个函数而不需要重新开启屏幕分享。
     * 支持如下四种情况：
     * - 共享整个屏幕：sourceInfoList 中 type 为 Screen 的 source，captureRect 设为 { 0, 0, 0, 0 }。
     * - 共享指定区域：sourceInfoList 中 type 为 Screen 的 source，captureRect 设为非 nullptr，例如 { 100, 100, 300, 300 }。
     * - 共享整个窗口：sourceInfoList 中 type 为 Window 的 source，captureRect 设为 { 0, 0, 0, 0 }。
     * - 共享窗口区域：sourceInfoList 中 type 为 Window 的 source，captureRect 设为非 nullptr，例如 { 100, 100, 300, 300 }。
     *
     * @param source      指定分享源。
     * @param captureRect 指定捕获的区域。
     * @param property    指定屏幕分享目标的属性，包括捕获鼠标，高亮捕获窗口等，详情参考 V2TXLiveScreenCaptureProperty 定义。
     * @note 设置高亮边框颜色、宽度参数在 Mac 平台不生效。
     */
    virtual int32_t setScreenCaptureSource(const V2TXLiveScreenCaptureSourceInfo& source, const V2TXLiveRect& captureRect, const V2TXLiveScreenCaptureProperty& property) = 0;

#endif

    /**
     * 显示仪表盘。
     *
     * @param isShow 是否显示。【默认值】：false。
     */
    virtual void showDebugView(bool isShow) = 0;

    /**
     * 调用 V2TXLivePusher 的高级 API 接口。
     *
     * @param key   高级 API 对应的 key, 详情请参考 {@link V2TXLiveProperty} 定义。
     * @param value 调用 key 所对应的高级 API 时，需要的参数。
     * @return 返回值 {@link V2TXLiveCode}。
     *         - V2TXLIVE_OK: 成功。
     *         - V2TXLIVE_ERROR_INVALID_PARAMETER: 操作失败，key 不允许为空。
     * @note  该接口用于调用一些高级功能。
     */
    virtual int32_t setProperty(const char* key, const void* value) = 0;

   protected:
    virtual ~V2TXLivePusher() {
    }
};

}  // namespace liteav

#endif
