/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   V2TXLiveDef @ TXLiteAVSDK
 * Function: Key type definitions for Tencent Cloud LVB
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
//                              Supported protocol
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * Supported protocol, RTMP is not supported on Windows or macOS.
 */
enum V2TXLiveMode {

    /// RTMP protocol.
    V2TXLiveModeRTMP,

    /// TRTC protocol.
    V2TXLiveModeRTC,

};

/////////////////////////////////////////////////////////////////////////////////
//
//           (1) Video type definitions
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * Video resolution.
 */
enum V2TXLiveVideoResolution {

    /// Resolution: 160×160. Bitrate range: 100 Kbps to 150 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution160x160,

    /// Resolution: 270×270. Bitrate range: 200 Kbps to 300 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution270x270,

    /// Resolution: 480×480. Bitrate range: 350 Kbps to 525 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution480x480,

    /// Resolution: 320×240. Bitrate range: 250 Kbps to 375 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution320x240,

    /// Resolution: 480×360. Bitrate range: 400 Kbps to 600 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution480x360,

    /// Resolution: 640×480. Bitrate range: 600 Kbps to 900 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution640x480,

    /// Resolution: 320×180. Bitrate range: 250 Kbps to 400 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution320x180,

    /// Resolution: 480×270. Bitrate range: 350 Kbps to 550 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution480x270,

    /// Resolution: 640×360. Bitrate range: 500 Kbps to 900 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution640x360,

    /// Resolution: 960×540. Bitrate range: 800 Kbps to 1500 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution960x540,

    /// Resolution: 1280×720. Bitrate range: 1000 Kbps to 1800 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution1280x720,

    /// Resolution: 1920×1080. Bitrate range: 2500 Kbps to 3000 Kbps. Frame rate: 15 fps.
    V2TXLiveVideoResolution1920x1080,

};

/**
 * Video aspect ratio mode
 *
 * @info Video aspect ratio mode.
 * @note
 * - Landscape resolution: V2TXLiveVideoResolution640x360 + V2TXLiveVideoResolutionModeLandscape = 640 × 360.
 * - Portrait resolution:  V2TXLiveVideoResolution640x360 + V2TXLiveVideoResolutionModePortrait  = 360 × 640.
 */
enum V2TXLiveVideoResolutionMode {

    /// Landscape resolution.
    V2TXLiveVideoResolutionModeLandscape,

    /// Portrait resolution.
    V2TXLiveVideoResolutionModePortrait

};

/**
 * Video encoding parameters
 *
 * These settings determine the quality of image viewed by remote users.
 */
struct V2TXLiveVideoEncoderParam {
    /// `Field description:` video resolution.
    /// `Recommended value:`
    /// - For desktop platforms (Windows and macOS), we recommend you select a resolution of 640x360 or above and select `Landscape` (landscape resolution) for `videoResolutionMode`.
    ///@note  to use a portrait resolution, please specify `videoResolutionMode` as `Portrait`; for example, when used together with `Portrait`, 640x360 represents 360x640.
    V2TXLiveVideoResolution videoResolution;

    ///`Field description:` resolution mode (landscape/portrait).
    ///`Recommended value:` for desktop platforms (Windows and macOS), `Landscape` is recommended.
    ///@note  to use a portrait resolution, please specify `videoResolutionMode` as `Portrait`; for example, when used together with `Portrait`, 640x360 represents 360x640.
    V2TXLiveVideoResolutionMode videoResolutionMode;

    ///`Field description:` video capturing frame rate.
    ///`Recommended value:` 15 or 20 fps. If the frame rate is lower than 5 fps, there will be obvious lagging; if lower than 10 fps but higher than 5 fps, there will be slight lagging; if higher than 20 fps, the bandwidth will be wasted (the frame
    /// rate of movies is generally 24 fps).
    uint32_t videoFps;

    ///`Field description:` target video bitrate. The SDK encodes streams at the target video bitrate and will actively reduce the bitrate only in weak network environments.
    ///`Recommended value:` please see the optimal bitrate for each specification in `V2TXLiveVideoResolution`. You can also slightly increase the optimal bitrate.
    ///           For example, `V2TXLiveVideoResolution1280x720` corresponds to the target bitrate of 1,200 Kbps. You can also set the bitrate to 1,500 Kbps for higher definition.
    ///@note  you can set the `videoBitrate` and `minVideoBitrate` parameters at the same time to restrict the SDK's adjustment range of the video bitrate:
    /// - If you set `videoBitrate` and `minVideoBitrate` to the same value, it is equivalent to disabling the adaptive adjustment capability of the SDK for the video bitrate.
    uint32_t videoBitrate;

    /// `Field description:` minimum video bitrate. The SDK will reduce the bitrate to as low as the value specified by `minVideoBitrate` to ensure the smoothness only if the network conditions are poor.
    ///`Recommended value:` you can set the `videoBitrate` and `minVideoBitrate` parameters at the same time to restrict the SDK's adjustment range of the video bitrate:
    /// - If you set `videoBitrate` and `minVideoBitrate` to the same value, it is equivalent to disabling the adaptive adjustment capability of the SDK for the video bitrate.
    uint32_t minVideoBitrate;

    V2TXLiveVideoEncoderParam(V2TXLiveVideoResolution resolution) : videoResolution(resolution), videoResolutionMode(V2TXLiveVideoResolutionModeLandscape), videoFps(15), videoBitrate(0), minVideoBitrate(0) {
    }
};

/**
 * Local camera mirror type.
 */
enum V2TXLiveMirrorType {

    /// Default mirror type. Images from the front camera are mirrored, and images from the rear camera are not mirrored.
    V2TXLiveMirrorTypeAuto,

    /// Both the front and rear cameras are switched to the mirror mode.
    V2TXLiveMirrorTypeEnable,

    /// Both the front and rear cameras are switched to the non-mirror mode.
    V2TXLiveMirrorTypeDisable

};

/**
 * Image fill mode
 */
enum V2TXLiveFillMode {

    /// The entire screen is covered by the image, without black edges. If the aspect ratio of the image is different from that of the screen, part of the image will be cropped.
    V2TXLiveFillModeFill,

    /// The image adapts to the screen and is not cropped. If the aspect ratio of the image is different from that of the screen, black edges will appear.
    V2TXLiveFillModeFit,

    /// The screen is entirely covered by the image. The image will be stretched if screen and image have different aspect ratios.
    V2TXLiveFillModeScaleFill

};

/**
 * Clockwise rotation of the video image
 */
enum V2TXLiveRotation {

    /// No rotation.
    V2TXLiveRotation0,

    /// Rotate 90 degrees clockwise.
    V2TXLiveRotation90,

    /// Rotate 180 degrees clockwise.
    V2TXLiveRotation180,

    /// Rotate 270 degrees clockwise.
    V2TXLiveRotation270

};

/**
 * Pixel format of video frames
 */
enum V2TXLivePixelFormat {

    /// Unknown.
    V2TXLivePixelFormatUnknown,

    /// YUV420P I420.
    V2TXLivePixelFormatI420,

    /// BGRA8888.
    V2TXLivePixelFormatBGRA32,

    /// RGBA32
    V2TXLivePixelFormatRGBA32

};

/**
 * Video data transfer method
 *
 * @info Video data transfer method.
 * @note For custom capturing and rendering features, you need to use the following enumerated values to specify the method of transferring video data.
 */
enum V2TXLiveBufferType {

    /// Unknown.
    V2TXLiveBufferTypeUnknown,

    /// Use memory buffer to transfer video data.
    V2TXLiveBufferTypeByteBuffer

};

/**
 * Beauty (skin smoothing) filter algorithm
 *
 * TRTC has multiple built-in skin smoothing algorithms. You can select the one most suitable for your product.
 */
enum V2TXLiveBeautyStyle {

    /// Smooth style, which uses a more radical algorithm for more obvious effect and is suitable for show live streaming.
    V2TXLiveBeautySmooth = 0,

    /// Natural style, which retains more facial details for more natural effect and is suitable for most live streaming use cases.
    V2TXLiveBeautyNature = 1

};

/**
 * Video frame information
 *
 * @info Video frame information.
 *         V2TXLiveVideoFrame describes the raw data of a video image frame, which can be the image before frame encoding or the image after frame decoding.
 * @note  Used during custom capture and rendering. During custom capture, you need to use V2TXLiveVideoFrame to contain the video frame to be sent. During custom rendering, the video frame contained by V2TXLiveVideoFrame will be returned.
 */
struct V2TXLiveVideoFrame {
    ///  `Field description:` Video pixel format.
    V2TXLivePixelFormat pixelFormat;

    ///  `Field description:` Video data container format.
    V2TXLiveBufferType bufferType;

    ///  `Field description:` Video data when bufferType is V2TXLiveBufferTypePixelBuffer.
    char* data;

    ///`Field description:` Video length.
    int32_t length;

    ///`Field description:` Video width.
    int32_t width;

    ///`Field description:` Video height.
    int32_t height;

    ///`Field description:` Clockwise rotation angle of video frames.
    V2TXLiveRotation rotation;

    V2TXLiveVideoFrame() : pixelFormat(V2TXLivePixelFormatUnknown), bufferType(V2TXLiveBufferTypeUnknown), data(nullptr), length(0), width(0), height(0), rotation(V2TXLiveRotation0) {
    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//          (2) Audio type definitions
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * Audio quality
 */
enum V2TXLiveAudioQuality {

    /// Audio: 16k sample rate, mono-channel, 16 Kbps audio raw bitrate. This quality is suitable for scenarios that mainly involve voice calls, such as online meetings and voice calls.
    V2TXLiveAudioQualitySpeech,

    /// General: 48k sample rate, mono-channel, 50 Kbps audio raw bitrate. This quality is the default audio quality of the SDK. We recommend that you choose this option unless you have special requirements.
    V2TXLiveAudioQualityDefault,

    /// Music: 48k sample rate, dual-channel + full-band, 128 Kbps audio raw bitrate. This quality is suitable for scenarios that require Hi-Fi music transmission, such as karaoke and music livestreams.
    V2TXLiveAudioQualityMusic

};

/**
 * @brief audio frame
 */
struct V2TXLiveAudioFrame {
    ///`Field description:` audio data.
    char* data;

    ///`Field description:` audio data length.
    uint32_t length;

    ///`Field description:` audio sample rate.
    uint32_t sampleRate;

    ///`Field description:` number of sound channels.
    uint32_t channel;

    V2TXLiveAudioFrame() : data(nullptr), length(0), sampleRate(48000), channel(1) {
    }
};

/**
 * audio callback format
 */
struct V2TXLiveAudioFrameObserverFormat {
    ///`Field description:` sample rate.
    ///`Recommended value:` default value: 48000 Hz. Valid values: 16000, 32000, 44100, 48000.
    int sampleRate;

    ///`Field description:` number of sound channels.
    ///`Recommended value:` default value: 1, which means mono channel. Valid values: 1: mono channel; 2: dual channel.
    int channel;

    ///`Field description:` number of sample points.
    ///`Recommended value:` the value must be an integer multiple of sampleRate/100.
    int samplesPerCall;

    V2TXLiveAudioFrameObserverFormat() : sampleRate(0), channel(0), samplesPerCall(0) {
    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//          (3) Definitions of statistical metrics for pushers and players
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * Pusher statistics
 */
struct V2TXLivePusherStatistics {
    ///`Field description:` CPU utilization of the current app (%).
    int32_t appCpu;

    ///`Field description:` CPU utilization of the current system (%).
    int32_t systemCpu;

    ///`Field description:` Video width.
    int32_t width;

    ///`Field description:` Video height.
    int32_t height;

    ///`Field description:` Frame rate (fps).
    int32_t fps;

    ///`Field description:` Video bitrate (Kbps).
    int32_t videoBitrate;

    ///`Field description:` Audio bitrate (Kbps).
    int32_t audioBitrate;

    ///`Field description:` Round-trip delay (ms) from the SDK to cloud.
    int32_t rtt;

    ///`Field description:` upload speed (Kbps).
    int32_t netSpeed;

    V2TXLivePusherStatistics() : appCpu(0), systemCpu(0), width(0), height(0), fps(0), videoBitrate(0), audioBitrate(0), rtt(0), netSpeed(0) {
    }
};

/**
 * Player statistics
 */
struct V2TXLivePlayerStatistics {
    ///`Field description:` CPU utilization of the current app (%).
    int32_t appCpu;

    ///`Field description:` CPU utilization of the current system (%).
    int32_t systemCpu;

    ///`Field description:` Video width.
    int32_t width;

    ///`Field description:` Video height.
    int32_t height;

    ///`Field description:` Frame rate (fps).
    int32_t fps;

    ///`Field description:` Video bitrate (Kbps).
    int32_t videoBitrate;

    ///`Field description:` Audio bitrate (Kbps).
    int32_t audioBitrate;

    ///`Field description`: Total packet loss rate (%) of the audio/video stream. Note: Only playback address prefixed with [trtc://] or [webrtc://] are supported.
    int32_t audioPacketLoss;

    ///`Field description`: Total packet loss rate (%) of the audio/video stream. Note: Only playback address prefixed with [trtc://] or [webrtc://] are supported.
    int32_t videoPacketLoss;

    ///`Field description`: Playback delay (ms).
    int32_t jitterBufferDelay;

    ///`Field description`: Cumulative audio playback lag duration (ms).
    /// The duration is the block duration within 2s.
    int32_t audioTotalBlockTime;

    ///`Field description`: Audio playback lag rate (%).
    /// Audio playback lag rate (audioBlockRate) = cumulative audio playback lag duration (audioTotalBlockTime)/audio playback interval duration (2000ms).
    int32_t audioBlockRate;

    ///`Field description`: Cumulative video playback lag duration (ms).
    /// The duration is the block duration within 2s.
    int32_t videoTotalBlockTime;

    ///`Field description`: Video playback lag rate (%).
    /// Video playback lag rate (videoBlockRate) = cumulative video playback lag duration (videoTotalBlockTime)/video playback interval duration (2000ms).
    int32_t videoBlockRate;

    ///`Field description:` Round-trip delay (ms) from the SDK to cloud. Note: Only playback address prefixed with [trtc://] or [webrtc://] are supported.
    int32_t rtt;

    ///`Field description:` donwload speed (Kbps).
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
//          (4) Definitions of connection-status-related enumerated values
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * Livestream connection status
 */
enum V2TXLivePushStatus {

    /// Disconnected from the server.
    V2TXLivePushStatusDisconnected,

    /// Connecting to the server.
    V2TXLivePushStatusConnecting,

    /// Connected to the server successfully.
    V2TXLivePushStatusConnectSuccess,

    /// Reconnecting to the server.
    V2TXLivePushStatusReconnecting

};

/**
 * Protocol configured with socks5 proxy.
 */
struct V2TXLiveSocks5ProxyConfig {
    ///`Field description:` Indicates whether HTTPS is supported.
    ///`Recommended value:` Default value: true.
    bool supportHttps;

    ///`Field description:` Indicates whether TCP is supported.
    ///`Recommended value:` Default value: true.
    bool supportTcp;

    ///`Field description:` Indicates whether UDP is supported.
    ///`Recommended value:` Default value: true.
    bool supportUdp;

    V2TXLiveSocks5ProxyConfig() : supportHttps(true), supportTcp(true), supportUdp(true) {
    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//          (5) Definitions of common configuration components
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * Log level
 */
enum V2TXLiveLogLevel {

    /// Output all levels of log.
    V2TXLiveLogLevelAll = 0,

    /// Output DEBUG, INFO, WARNING, ERROR and FATAL level log.
    V2TXLiveLogLevelDebug = 1,

    /// Output INFO, WARNING, ERROR and FATAL level log.
    V2TXLiveLogLevelInfo = 2,

    /// Output WARNING, ERROR and FATAL level log.
    V2TXLiveLogLevelWarning = 3,

    /// Output ERROR and FATAL level log.
    V2TXLiveLogLevelError = 4,

    /// Only output FATAL level log.
    V2TXLiveLogLevelFatal = 5,

    /// Does not output any sdk log.
    V2TXLiveLogLevelNULL = 6,

};

/**
 * Log configuration
 */
struct V2TXLiveLogConfig {
    ///`Field description:` Set Log level.
    ///`Recommended value:` Default value: V2TXLiveLogLevelAll.
    V2TXLiveLogLevel logLevel;

    ///`Field description:`    Whether to receive the log information to be printed through V2TXLivePremierObserver.
    ///`Special Instructions:` If you want to implement Log writing by yourself, you can turn on this switch, Log information will be called back to you V2TXLivePremierObserver#onLog.
    ///`Recommended value:`    Default value: false.
    bool enableObserver;

    ///`Field description:` Whether to allow the SDK to print Log on the console of the editor (XCoder, Android Studio, Visual Studio, etc.).
    ///`Recommended value:` Default value: false.
    bool enableConsole;

    ///`Field description:`    Whether to enable local log file.
    ///`Special Instructions:` If not for special needs, please do not close the local log file, otherwise the Tencent Cloud technical team will not be able to track and locate problems when they occur.
    ///`Recommended value:`    Default value: true.
    bool enableLogFile;

    ///`Field description:` Set the storage directory of the local log, default Log storage location:
    ///  Windows：%appdata%/liteav/log.
    const char* logPath;

    V2TXLiveLogConfig() : logLevel(V2TXLiveLogLevelAll), enableObserver(false), enableConsole(false), enableLogFile(true), logPath(nullptr) {
    }
};

/**
 * image types
 */
enum V2TXLiveImageType {

    /// support GIF、JPEG、PNG image types.
    V2TXLiveImageTypeFile = 0,

    /// pixel format BGRA32.
    V2TXLiveImageTypeBGRA32 = 1,

    /// pixel format RGBA32.
    V2TXLiveImageTypeRGBA32 = 2,
};

/**
 * Structure for storing window image infos
 */
struct V2TXLiveImage {
    /// V2TXLiveImageTypeFile:imagePath,others:image content.
    const char* imageSrc;

    /// image type.
    V2TXLiveImageType imageType;

    /// image width(ignore for V2TXLiveImageTypeFile).
    uint32_t imageWidth;

    /// image height(ignore for V2TXLiveImageTypeFile).
    uint32_t imageHeight;

    /// image lenght in bytes.
    uint32_t imageLength;

    V2TXLiveImage() : imageSrc(nullptr), imageType(V2TXLiveImageTypeBGRA32), imageWidth(0), imageHeight(0), imageLength(0) {
    }
};

/**
 * Screen sharing target type
 */
enum V2TXLiveScreenCaptureSourceType {

    /// Unknown.
    V2TXLiveScreenCaptureSourceTypeUnknown = -1,

    /// The screen sharing target is the window of an application.
    V2TXLiveScreenCaptureSourceTypeWindow = 0,

    /// The screen sharing target is the entire screen.
    V2TXLiveScreenCaptureSourceTypeScreen = 1,

    /// The screen sharing target is a user-defined data source.
    V2TXLiveScreenCaptureSourceTypeCustom = 2,

};

/**
 * Screen sharing windows
 *
 * Screen sharing windows.
 * You can call `getScreenCaptureSources` to get a list of the sharable windows, which is returned via `IV2TXLiveScreenCaptureSourceList`.
 */
struct V2TXLiveScreenCaptureSourceInfo {
    /// capturing source type (i.e., whether to share the entire screen or a certain window).
    V2TXLiveScreenCaptureSourceType sourceType;

    /// capturing source ID. For a window, this field indicates a window ID; for a screen, this field indicates a display ID.
    void* sourceId;

    /// capturing source name (encoded in UTF-8).
    const char* sourceName;

    /// thumbnail of the shared window.
    V2TXLiveImage thumbBGRA;

    /// icon of the shared window.
    V2TXLiveImage iconBGRA;

    /// is minimized window or not.
    bool isMinimizeWindow;

    /// Whether it is the main display (applicable to the case of multiple displays).
    bool isMainScreen;

    V2TXLiveScreenCaptureSourceInfo() : sourceType(V2TXLiveScreenCaptureSourceTypeUnknown), sourceId(nullptr), sourceName(nullptr), isMinimizeWindow(false), isMainScreen(false) {
    }
};

/**
 * List of sharable screens and windows
 */
class IV2TXLiveScreenCaptureSourceList {
   protected:
    virtual ~IV2TXLiveScreenCaptureSourceList() {
    }

   public:
    /// Size of this list.
    virtual uint32_t getCount() = 0;

    /// Get element(V2TXLiveScreenCaptureSourceInfo) by index.
    virtual V2TXLiveScreenCaptureSourceInfo getSourceInfo(uint32_t index) = 0;

    ///@info After traversing the list, call `release` to release the resources.
    virtual void release() = 0;
};

/**
 * Advanced control parameter of screen sharing
 *
 * This parameter is used in the screen sharing-related API {@link setScreenCaptureSource} to set a series of advanced control parameters when specifying the sharing target.
 * For example, whether to capture the cursor, whether to capture the subwindow, and whether to draw a frame around the shared target.
 */
struct V2TXLiveScreenCaptureProperty {
    /// whether to capture the cursor while capturing the target content. Default value: true.
    bool enableCaptureMouse;

    /// whether to highlight the window being shared (i.e., drawing a frame around the shared target). Default value: true.
    bool enableHighlightBorder;

    /// whether to enable the high performance mode (which will take effect only during screen sharing). Default value: true.
    ///@note  the screen capturing performance is the best after this mode is enabled, but the anti-blocking ability will be lost. If you enable `enableHighlightBorder` and `enableHighPerformance` at the same time, remote users will see the
    /// highlighted frame.
    bool enableHighPerformance;

    /// specify the color of the highlighted frame in RGB format. 0 indicates to use the default color of #FFE640.
    int highlightBorderColor;

    /// specify the width of the highlighted frame. 0 indicates to use the default width of 5 px. The maximum value you can set is 50.
    int highlightBorderSize;

    /// whether to capture the subwindow during window capturing (the subwindow and the captured window need to have an `Owner` or `Popup` attribute). Default value: false.
    bool enableCaptureChildWindow;

    V2TXLiveScreenCaptureProperty() : enableCaptureMouse(true), enableHighlightBorder(true), enableHighPerformance(true), highlightBorderColor(0), highlightBorderSize(0), enableCaptureChildWindow(false) {
    }
};

/**
 * Size
 */
struct V2TXLiveSize {
    /// width.
    uint64_t width;

    /// height.
    uint64_t height;

    V2TXLiveSize() : width(0), height(0) {
    }
};

/**
 * Rect
 */
struct V2TXLiveRect {
    /// left.
    uint64_t left;

    /// top.
    uint64_t top;

    /// right.
    uint64_t right;

    /// bottom.
    uint64_t bottom;

    V2TXLiveRect() : left(0), top(0), right(0), bottom(0) {
    }
};

}  // namespace liteav
#endif
