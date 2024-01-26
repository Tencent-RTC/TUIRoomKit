/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   V2TXLiveDef @ TXLiteAVSDK
 * Function: 腾讯云直播服务(LVB)关键类型定义
 */
#ifndef MODULE_CPP_V2TXLIVEDEF_H_
#define MODULE_CPP_V2TXLIVEDEF_H_

#include <stdint.h>
#include "V2TXLiveCode.hpp"

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#ifdef TRTC_EXPORTS
#define V2_API __declspec(dllexport)
#else
#define V2_API __declspec(dllimport)
#endif
#elif __APPLE__
#include <TargetConditionals.h>
#define V2_API __attribute__((visibility("default")))
#elif __ANDROID__
#define V2_API __attribute__((visibility("default")))
#else
#define V2_API
#endif

#define TARGET_PLATFORM_DESKTOP ((__APPLE__ && TARGET_OS_MAC && !TARGET_OS_IPHONE) || _WIN32 || (!__ANDROID__ && __linux__))
#define TARGET_PLATFORM_PHONE (__ANDROID__ || (__APPLE__ && TARGET_OS_IOS))

namespace liteav {

/////////////////////////////////////////////////////////////////////////////////
//
//                              支持协议
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 支持协议
 */
enum V2TXLiveMode {

    /// 支持协议: RTMP。
    V2TXLiveModeRTMP,

    /// 支持协议: TRTC。
    V2TXLiveModeRTC,

};

/////////////////////////////////////////////////////////////////////////////////
//
//           （一）视频相关类型定义
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 视频分辨率
 */
enum V2TXLiveVideoResolution {

    ///分辨率 160*160，码率范围：100Kbps ~ 150Kbps，帧率：15fps。
    V2TXLiveVideoResolution160x160,

    ///分辨率 270*270，码率范围：200Kbps ~ 300Kbps，帧率：15fps。
    V2TXLiveVideoResolution270x270,

    ///分辨率 480*480，码率范围：350Kbps ~ 525Kbps，帧率：15fps。
    V2TXLiveVideoResolution480x480,

    ///分辨率 320*240，码率范围：250Kbps ~ 375Kbps，帧率：15fps。
    V2TXLiveVideoResolution320x240,

    /// 分辨率 480*360，码率范围：400Kbps ~ 600Kbps，帧率：15fps。
    V2TXLiveVideoResolution480x360,

    /// 分辨率 640*480，码率范围：600Kbps ~ 900Kbps，帧率：15fps。
    V2TXLiveVideoResolution640x480,

    ///分辨率 320*180，码率范围：250Kbps ~ 400Kbps，帧率：15fps。
    V2TXLiveVideoResolution320x180,

    /// 分辨率 480*270，码率范围：350Kbps ~ 550Kbps，帧率：15fps。
    V2TXLiveVideoResolution480x270,

    ///分辨率 640*360，码率范围：500Kbps ~ 900Kbps，帧率：15fps。
    V2TXLiveVideoResolution640x360,

    /// 分辨率 960*540，码率范围：800Kbps ~ 1500Kbps，帧率：15fps。
    V2TXLiveVideoResolution960x540,

    /// 分辨率 1280*720，码率范围：1000Kbps ~ 1800Kbps，帧率：15fps。
    V2TXLiveVideoResolution1280x720,

    /// 分辨率 1920*1080，码率范围：2500Kbps ~ 3000Kbps，帧率：15fps。
    V2TXLiveVideoResolution1920x1080,

};

/**
 * 视频宽高比模式
 *
 * @info 视频宽高比模式。
 * @note
 * - 横屏模式下的分辨率: V2TXLiveVideoResolution640x360 + V2TXLiveVideoResolutionModeLandscape = 640 × 360。
 * - 竖屏模式下的分辨率: V2TXLiveVideoResolution640x360 + V2TXLiveVideoResolutionModePortrait  = 360 × 640。
 */
enum V2TXLiveVideoResolutionMode {

    /// 横屏模式。
    V2TXLiveVideoResolutionModeLandscape,

    /// 竖屏模式。
    V2TXLiveVideoResolutionModePortrait,

};

/**
 * 视频编码参数
 *
 * 该设置决定远端用户看到的画面质量。
 */
struct V2TXLiveVideoEncoderParam {
    ///【字段含义】 视频分辨率。
    ///【特别说明】如需使用竖屏分辨率，请指定 videoResolutionMode 为 Portrait，例如： 640 × 360 + Portrait = 360 × 640。
    ///【推荐取值】
    /// - 桌面平台（Win + Mac）：建议选择 640 × 360 及以上分辨率，videoResolutionMode 选择 Landscape，即横屏分辨率。
    V2TXLiveVideoResolution videoResolution;

    ///【字段含义】分辨率模式（横屏分辨率 or 竖屏分辨率）。
    ///【推荐取值】桌面平台（Windows、Mac）建议选择 Landscape。
    ///【特别说明】如需使用竖屏分辨率，请指定 resMode 为 Portrait，例如： 640 × 360 + Portrait = 360 × 640。
    V2TXLiveVideoResolutionMode videoResolutionMode;

    ///【字段含义】视频采集帧率。
    ///【推荐取值】15fps 或 20fps。5fps 以下，卡顿感明显。10fps 以下，会有轻微卡顿感。20fps 以上，会浪费带宽（电影的帧率为 24fps）。
    uint32_t videoFps;

    ///【字段含义】目标视频码率，SDK 会按照目标码率进行编码，只有在弱网络环境下才会主动降低视频码率。
    ///【推荐取值】请参考 V2TXLiveVideoResolution 在各档位注释的最佳码率，也可以在此基础上适当调高。
    ///           比如：V2TXLiveVideoResolution1280x720 对应 1200kbps 的目标码率，您也可以设置为 1500kbps 用来获得更好的观感清晰度。
    ///【特别说明】您可以通过同时设置 videoBitrate 和 minVideoBitrate 两个参数，用于约束 SDK 对视频码率的调整范围：
    /// - 如果您将 videoBitrate 和 minVideoBitrate 设置为同一个值，等价于关闭 SDK 对视频码率的自适应调节能力。
    uint32_t videoBitrate;

    ///【字段含义】最低视频码率，SDK 会在网络不佳的情况下主动降低视频码率以保持流畅度，最低会降至 minVideoBitrate 所设定的数值。
    ///【推荐取值】您可以通过同时设置 videoBitrate 和 minVideoBitrate 两个参数，用于约束 SDK 对视频码率的调整范围：
    /// - 如果您将 videoBitrate 和 minVideoBitrate 设置为同一个值，等价于关闭 SDK 对视频码率的自适应调节能力。
    uint32_t minVideoBitrate;

    V2TXLiveVideoEncoderParam(V2TXLiveVideoResolution resolution) : videoResolution(resolution), videoResolutionMode(V2TXLiveVideoResolutionModeLandscape), videoFps(15), videoBitrate(0), minVideoBitrate(0) {
    }
};

/**
 * 本地摄像头镜像类型
 */
enum V2TXLiveMirrorType {

    ///系统默认镜像类型，前置摄像头镜像，后置摄像头不镜像。
    V2TXLiveMirrorTypeAuto,

    /// 前置摄像头和后置摄像头，都切换为镜像模式。
    V2TXLiveMirrorTypeEnable,

    ///前置摄像头和后置摄像头，都切换为非镜像模式。
    V2TXLiveMirrorTypeDisable

};

/**
 * 视频画面填充模式
 */
enum V2TXLiveFillMode {

    /// 图像铺满屏幕，超出显示视窗的视频部分将被裁剪，画面显示可能不完整。
    V2TXLiveFillModeFill,

    /// 图像长边填满屏幕，短边区域会被填充黑色，画面的内容完整。
    V2TXLiveFillModeFit,

    /// 图像拉伸铺满，因此长度和宽度可能不会按比例变化。
    V2TXLiveFillModeScaleFill

};

/**
 * 视频画面顺时针旋转角度
 */
enum V2TXLiveRotation {

    /// 不旋转。
    V2TXLiveRotation0,

    /// 顺时针旋转90度。
    V2TXLiveRotation90,

    /// 顺时针旋转180度。
    V2TXLiveRotation180,

    /// 顺时针旋转270度。
    V2TXLiveRotation270

};

/**
 * 视频帧的像素格式
 */
enum V2TXLivePixelFormat {

    /// 未知。
    V2TXLivePixelFormatUnknown,

    /// YUV420P I420。
    V2TXLivePixelFormatI420,

    /// BGRA8888。
    V2TXLivePixelFormatBGRA32,

    /// RGBA32
    V2TXLivePixelFormatRGBA32

};

/**
 * 视频数据包装格式
 *
 * @info 视频数据包装格式。
 * @note 在自定义采集和自定义渲染功能，您需要用到下列枚举值来指定您希望以什么样的格式来包装视频数据。
 */
enum V2TXLiveBufferType {

    /// 未知。
    V2TXLiveBufferTypeUnknown,

    /// 二进制Buffer类型。
    V2TXLiveBufferTypeByteBuffer

};

/**
 * 美颜（磨皮）算法
 *
 * TRTC 内置多种不同的磨皮算法，您可以选择最适合您产品定位的方案。
 */
enum V2TXLiveBeautyStyle {

    ///光滑，算法比较激进，磨皮效果比较明显，适用于秀场直播。
    V2TXLiveBeautySmooth = 0,

    ///自然，算法更多地保留了面部细节，磨皮效果更加自然，适用于绝大多数直播场景。
    V2TXLiveBeautyNature = 1

};

/**
 * 视频帧信息
 *
 * @info 视频帧信息。
 *         V2TXLiveVideoFrame 用来描述一帧视频画面的裸数据，它可以是一帧编码前的画面，也可以是一帧解码后的画面。
 * @note  自定义采集和自定义渲染时使用。自定义采集时，需要使用 V2TXLiveVideoFrame 来包装待发送的视频帧；自定义渲染时，会返回经过 V2TXLiveVideoFrame 包装的视频帧。
 */
struct V2TXLiveVideoFrame {
    /// 【字段含义】视频帧像素格式。
    V2TXLivePixelFormat pixelFormat;

    /// 【字段含义】视频数据包装格式。
    V2TXLiveBufferType bufferType;

    /// 【字段含义】bufferType 为 V2TXLiveBufferTypeByteBuffer 时的视频数据。
    char* data;

    /// 【字段含义】视频数据的长度，单位是字节。
    int32_t length;

    /// 【字段含义】视频宽度。
    int32_t width;

    /// 【字段含义】视频高度。
    int32_t height;

    /// 【字段含义】视频帧的顺时针旋转角度。
    V2TXLiveRotation rotation;

    V2TXLiveVideoFrame() : pixelFormat(V2TXLivePixelFormatUnknown), bufferType(V2TXLiveBufferTypeUnknown), data(nullptr), length(0), width(0), height(0), rotation(V2TXLiveRotation0) {
    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//          （二）音频相关类型定义
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 声音音质
 */
enum V2TXLiveAudioQuality {

    /// 语音音质：采样率：16k；单声道；音频码率：16kbps；适合语音通话为主的场景，比如在线会议，语音通话。
    V2TXLiveAudioQualitySpeech,

    /// 默认音质：采样率：48k；单声道；音频码率：50kbps；SDK 默认的音频质量，如无特殊需求推荐选择之。
    V2TXLiveAudioQualityDefault,

    /// 音乐音质：采样率：48k；双声道 + 全频带；音频码率：128kbps；适合需要高保真传输音乐的场景，比如K歌、音乐直播等。
    V2TXLiveAudioQualityMusic

};

/**
 * 音频帧数据
 */
struct V2TXLiveAudioFrame {
    /// 【字段含义】音频数据。
    char* data;

    /// 【字段含义】音频数据的长度。
    uint32_t length;

    /// 【字段含义】采样率。
    uint32_t sampleRate;

    /// 【字段含义】声道数。
    uint32_t channel;

    V2TXLiveAudioFrame() : data(nullptr), length(0), sampleRate(48000), channel(1) {
    }
};

/**
 * 音频帧回调格式
 */
struct V2TXLiveAudioFrameObserverFormat {
    ///【字段含义】采样率。
    ///【推荐取值】默认值：48000Hz。支持 16000, 32000, 44100, 48000。
    int sampleRate;

    ///【字段含义】声道数。
    ///【推荐取值】默认值：1，代表单声道。可设定的数值只有两个数字：1-单声道，2-双声道。
    int channel;

    ///【字段含义】采样点数。
    ///【推荐取值】取值必须是 sampleRate/100 的整数倍。
    int samplesPerCall;

    V2TXLiveAudioFrameObserverFormat() : sampleRate(0), channel(0), samplesPerCall(0) {
    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//          （三）推流器和播放器的一些统计指标数据定义
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 推流器的统计数据
 */
struct V2TXLivePusherStatistics {
    /// 【字段含义】当前 App 的 CPU 使用率（％）。
    int32_t appCpu;

    /// 【字段含义】当前系统的 CPU 使用率（％）。
    int32_t systemCpu;

    /// 【字段含义】视频宽度。
    int32_t width;

    /// 【字段含义】视频高度。
    int32_t height;

    /// 【字段含义】帧率（fps）。
    int32_t fps;

    /// 【字段含义】视频码率（Kbps）。
    int32_t videoBitrate;

    /// 【字段含义】音频码率（Kbps）。
    int32_t audioBitrate;

    /// 【字段含义】从 SDK 到云端的往返延时（ms）
    int32_t rtt;

    /// 【字段含义】上行速度（kbps）
    int32_t netSpeed;

    V2TXLivePusherStatistics() : appCpu(0), systemCpu(0), width(0), height(0), fps(0), videoBitrate(0), audioBitrate(0), rtt(0), netSpeed(0) {
    }
};

/**
 * 播放器的统计数据
 */
struct V2TXLivePlayerStatistics {
    /// 【字段含义】当前 App 的 CPU 使用率（％）。
    int32_t appCpu;

    /// 【字段含义】当前系统的 CPU 使用率（％）。
    int32_t systemCpu;

    /// 【字段含义】视频宽度。
    int32_t width;

    /// 【字段含义】视频高度。
    int32_t height;

    /// 【字段含义】帧率（fps）。
    int32_t fps;

    /// 【字段含义】视频码率（Kbps）。
    int32_t videoBitrate;

    /// 【字段含义】音频码率（Kbps）。
    int32_t audioBitrate;

    /// 【字段含义】网络音频丢包率（％），注：仅支持前缀为 [trtc://] 或 [webrtc://] 的播放地址。
    int32_t audioPacketLoss;

    /// 【字段含义】网络视频丢包率（％），注：仅支持前缀为 [trtc://] 或 [webrtc://] 的播放地址。
    int32_t videoPacketLoss;

    /// 【字段含义】播放延迟（ms）。
    int32_t jitterBufferDelay;

    /// 【字段含义】音频播放的累计卡顿时长（ms）。
    /// 该时长为区间（2s）内的卡顿时长。
    int32_t audioTotalBlockTime;

    /// 【字段含义】音频播放卡顿率，单位（％）。
    /// 音频播放卡顿率（audioBlockRate） = 音频播放的累计卡顿时长（audioTotalBlockTime） / 音频播放的区间时长（2000ms）。
    int32_t audioBlockRate;

    /// 【字段含义】视频播放的累计卡顿时长（ms）。
    /// 该时长为区间（2s）内的卡顿时长。
    int32_t videoTotalBlockTime;

    /// 【字段含义】视频播放卡顿率，单位（％）。
    /// 视频播放卡顿率（videoBlockRate） = 视频播放的累计卡顿时长（videoTotalBlockTime） / 视频播放的区间时长（2000ms）。
    int32_t videoBlockRate;

    /// 【字段含义】从 SDK 到云端的往返延时（ms），注：仅支持前缀为 [trtc://] 或 [webrtc://] 的播放地址。
    int32_t rtt;

    /// 【字段含义】下载速度（kbps）
    int32_t netSpeed;

    V2TXLivePlayerStatistics()
        : appCpu(0),
          systemCpu(0),
          width(0),
          height(0),
          fps(0),
          videoBitrate(0),
          audioBitrate(0),
          audioPacketLoss(0),
          videoPacketLoss(0),
          jitterBufferDelay(0),
          audioTotalBlockTime(0),
          audioBlockRate(0),
          videoTotalBlockTime(0),
          videoBlockRate(0),
          rtt(0),
          netSpeed(0) {
    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//          （四）连接状态相关枚举值定义
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 直播流的连接状态
 */
enum V2TXLivePushStatus {

    /// 与服务器断开连接。
    V2TXLivePushStatusDisconnected,

    /// 正在连接服务器。
    V2TXLivePushStatusConnecting,

    /// 连接服务器成功。
    V2TXLivePushStatusConnectSuccess,

    /// 重连服务器中。
    V2TXLivePushStatusReconnecting

};

/**
 * socks5 代理的协议配置
 */
struct V2TXLiveSocks5ProxyConfig {
    /// 【字段含义】是否支持 https。
    /// 【推荐取值】默认值：true。
    bool supportHttps;

    /// 【字段含义】是否支持 tcp。
    /// 【推荐取值】默认值：true。
    bool supportTcp;

    /// 【字段含义】是否支持 udp。
    /// 【推荐取值】默认值：true。
    bool supportUdp;

    V2TXLiveSocks5ProxyConfig() : supportHttps(true), supportTcp(true), supportUdp(true) {
    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//          (五) 公共配置组件
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 日志级别枚举值
 */
enum V2TXLiveLogLevel {

    /// 输出所有级别的 log。
    V2TXLiveLogLevelAll = 0,

    /// 输出 DEBUG，INFO，WARNING，ERROR 和 FATAL 级别的 log。
    V2TXLiveLogLevelDebug = 1,

    /// 输出 INFO，WARNING，ERROR 和 FATAL 级别的 log。
    V2TXLiveLogLevelInfo = 2,

    /// 只输出 WARNING，ERROR 和 FATAL 级别的 log。
    V2TXLiveLogLevelWarning = 3,

    /// 只输出 ERROR 和 FATAL 级别的 log。
    V2TXLiveLogLevelError = 4,

    /// 只输出 FATAL 级别的 log。
    V2TXLiveLogLevelFatal = 5,

    /// 不输出任何 sdk log。
    V2TXLiveLogLevelNULL = 6,

};

/**
 * Log配置
 */
struct V2TXLiveLogConfig {
    /// 【字段含义】设置 Log 级别。
    /// 【推荐取值】默认值：V2TXLiveLogLevelAll。
    V2TXLiveLogLevel logLevel;

    /// 【字段含义】是否通过 V2TXLivePremierObserver 接收要打印的 Log 信息。
    /// 【特殊说明】如果您希望自己实现 Log 写入，可以打开此开关，Log 信息会通过 V2TXLivePremierObserver#onLog 回调给您。
    /// 【推荐取值】默认值：false。
    bool enableObserver;

    /// 【字段含义】是否允许 SDK 在编辑器（XCoder、Android Studio、Visual Studio 等）的控制台上打印 Log。
    /// 【推荐取值】默认值：false。
    bool enableConsole;

    /// 【字段含义】是否启用本地 Log 文件。
    /// 【特殊说明】如非特殊需要，请不要关闭本地 Log 文件，否则腾讯云技术团队将无法在出现问题时进行跟踪和定位。
    /// 【推荐取值】默认值：true。
    bool enableLogFile;

    /// 【字段含义】设置本地 Log 的存储目录，默认 Log 存储位置：
    ///  Windows：%appdata%/liteav/log。
    const char* logPath;

    V2TXLiveLogConfig() : logLevel(V2TXLiveLogLevelAll), enableObserver(false), enableConsole(false), enableLogFile(true), logPath(nullptr) {
    }
};

/**
 * 图片类型
 */
enum V2TXLiveImageType {

    ///图片文件路径，支持 GIF、JPEG、PNG文件格式。
    V2TXLiveImageTypeFile = 0,

    /// BGRA32格式内存块。
    V2TXLiveImageTypeBGRA32 = 1,

    /// RGBA32格式内存块。
    V2TXLiveImageTypeRGBA32 = 2,
};

/**
 * 图片信息
 */
struct V2TXLiveImage {
    /// V2TXLiveImageTypeFile: 图片路径; 其他类型:图片内容。
    const char* imageSrc;

    ///图片数据类型,默认为V2TXLiveImageFile {@link V2TXLiveImageType}。
    V2TXLiveImageType imageType;

    ///图片宽度,默认为0(图片数据类型为V2TXLiveImageTypeFile,忽略该参数)。
    uint32_t imageWidth;

    ///图片高度,默认为0(图片数据类型为V2TXLiveImageTypeFile,忽略该参数)。
    uint32_t imageHeight;

    ///图片数据的长度;单位字节。
    uint32_t imageLength;

    V2TXLiveImage() : imageSrc(nullptr), imageType(V2TXLiveImageTypeBGRA32), imageWidth(0), imageHeight(0), imageLength(0) {
    }
};

/**
 * 屏幕分享有关的定义
 */
enum V2TXLiveScreenCaptureSourceType {

    /// 未知。
    V2TXLiveScreenCaptureSourceTypeUnknown = -1,

    /// 该分享目标是某一个窗口。
    V2TXLiveScreenCaptureSourceTypeWindow = 0,

    /// 该分享目标是整个桌面。
    V2TXLiveScreenCaptureSourceTypeScreen = 1,

    /// 自定义窗口类型。
    V2TXLiveScreenCaptureSourceTypeCustom = 2,

};

/**
 * 屏幕分享窗口信息
 *
 * 您可以通过 getScreenCaptureSources() 枚举可共享的窗口列表，列表通过 IV2TXLiveScreenCaptureSourceList 返回。
 */
struct V2TXLiveScreenCaptureSourceInfo {
    /// 采集源类型。
    V2TXLiveScreenCaptureSourceType sourceType;

    /// 采集源 ID；对于窗口，该字段指示窗口句柄；对于屏幕，该字段指示屏幕 ID。
    void* sourceId;

    /// 采集源名称，UTF8 编码。
    const char* sourceName;

    /// 缩略图内容。
    V2TXLiveImage thumbBGRA;

    /// 图标内容。
    V2TXLiveImage iconBGRA;

    /// 是否为最小化窗口，通过 getScreenCaptureSources 获取列表时的窗口状态，仅采集源为 Window 时才可用。
    bool isMinimizeWindow;

    /// 是否为主屏，是否为主屏，仅采集源类型为 Screen 时才可用。
    bool isMainScreen;

    V2TXLiveScreenCaptureSourceInfo() : sourceType(V2TXLiveScreenCaptureSourceTypeUnknown), sourceId(nullptr), sourceName(nullptr), isMinimizeWindow(false), isMainScreen(false) {
    }
};

/**
 * 屏幕分享窗口列表
 */
class IV2TXLiveScreenCaptureSourceList {
   protected:
    virtual ~IV2TXLiveScreenCaptureSourceList() {
    }

   public:
    ///窗口个数。
    virtual uint32_t getCount() = 0;

    ///窗口信息。
    virtual V2TXLiveScreenCaptureSourceInfo getSourceInfo(uint32_t index) = 0;

    ///@info 遍历完窗口列表后，调用 release 释放资源。
    virtual void release() = 0;
};

/**
 * 屏幕分享参数
 *
 * 您可以通过设置结构体内的参数控制屏幕分享边框的颜色、宽度、是否采集鼠标等参数。
 */
struct V2TXLiveScreenCaptureProperty {
    ///是否采集目标内容时顺带采集鼠标，默认为 true。
    bool enableCaptureMouse;

    /// 是否高亮正在共享的窗口，默认为 true。
    bool enableHighlightBorder;

    /// 是否开启高性能模式（只会在分享屏幕时会生效），开启后屏幕采集性能最佳，但无法过滤远端的高亮边框，默认为 true。
    bool enableHighPerformance;

    /// 指定高亮边框颜色，RGB 格式，传入 0 时采用默认颜色，默认颜色为 #8CBF26。
    int highlightBorderColor;

    /// 指定高亮边框的宽度，传入0时采用默认描边宽度，默认宽度为 5，最大值为 50。
    int highlightBorderSize;

    /// 窗口采集时是否采集子窗口（与采集窗口具有 Owner 或 Popup 属性），默认为 false。
    bool enableCaptureChildWindow;

    V2TXLiveScreenCaptureProperty() : enableCaptureMouse(true), enableHighlightBorder(true), enableHighPerformance(true), highlightBorderColor(0), highlightBorderSize(0), enableCaptureChildWindow(false) {
    }
};

/**
 * 大小
 */
struct V2TXLiveSize {
    /// 宽。
    uint64_t width;

    /// 高。
    uint64_t height;

    V2TXLiveSize() : width(0), height(0) {
    }
};

/**
 * 区域
 */
struct V2TXLiveRect {
    /// 左。
    uint64_t left;

    /// 上。
    uint64_t top;

    /// 右。
    uint64_t right;

    /// 下。
    uint64_t bottom;

    V2TXLiveRect() : left(0), top(0), right(0), bottom(0) {
    }
};

}  // namespace liteav

#endif
