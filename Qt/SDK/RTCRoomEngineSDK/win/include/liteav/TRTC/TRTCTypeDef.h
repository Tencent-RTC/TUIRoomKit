/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module: TRTC key class definition
 * Description: definitions of enumerated and constant values such as resolution and quality level
 */
#ifndef __TRTCTYPEDEF_H__
#define __TRTCTYPEDEF_H__

#include "ITXDeviceManager.h"
#include <stdint.h>
#include <memory>
#include <string.h>

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#ifdef TRTC_EXPORTS
#define TRTC_API __declspec(dllexport)
#else
#define TRTC_API __declspec(dllimport)
#endif
#elif __APPLE__
#include <TargetConditionals.h>
#define TRTC_API __attribute__((visibility("default")))
#elif __ANDROID__ || __linux__
#define TRTC_API __attribute__((visibility("default")))
#else
#define TRTC_API
#endif

#ifdef __GNUC__
#define TRTC_GCC_VERSION_AT_LEAST(x, y) (__GNUC__ > (x) || __GNUC__ == (x) && __GNUC_MINOR__ >= (y))
#else
#define TRTC_GCC_VERSION_AT_LEAST(x, y) 0
#endif

#if TRTC_GCC_VERSION_AT_LEAST(3, 1) || defined(__clang__)
#define trtc_attribute_deprecated __attribute__((deprecated))
#elif defined(_MSC_VER)
#define trtc_attribute_deprecated __declspec(deprecated)
#else
#define trtc_attribute_deprecated
#endif

#define TARGET_PLATFORM_DESKTOP ((__APPLE__ && TARGET_OS_MAC && !TARGET_OS_IPHONE) || _WIN32 || (!__ANDROID__ && __linux__))
#define TARGET_PLATFORM_PHONE (__ANDROID__ || (__APPLE__ && TARGET_OS_IOS))
#define TARGET_PLATFORM_MAC (__APPLE__ && TARGET_OS_MAC && !TARGET_OS_IPHONE)
namespace liteav {

#ifndef _WIN32
struct RECT {
    int left = 0;
    int top = 0;
    int right = 0;
    int bottom = 0;
};
struct SIZE {
    long width = 0;
    long height = 0;
};
#endif

/////////////////////////////////////////////////////////////////////////////////
//
//                    Rendering control
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * [VIEW] Rendering control that renders the video image
 * 1. ObjectiveC interface in iOS and MAC
 * There are many APIs in TRTC that need to manipulate the video image, for which you should specify the video rendering control.
 * - On iOS, you can directly use `UIView` as the video rendering control, and the SDK will draw the video image on the `UIView` you provide.
 * - On macOS, you can directly use `NSView` as the video rendering control, and the SDK will draw the video image on the `NSView` you provide.
 * Below is the sample code:
 * UIView *videoView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 360, 640)];
 * [self.view addSubview:videoView];
 * [trtcCloud startLocalPreview:YES view:_localView];
 * 2. On Android, you can use the `TXCloudVideoView` provided by us as the video rendering control, which supports two rendering schemes: `SurfaceView` and `TextureView`.
 * - When rendering the local video image, `TXCloudVideoView` uses `SurfaceView` preferably. This scheme has better performance, but it does not support animation or transformation effects on the `View`.
 * - When rendering the remote video image, `TXCloudVideoView` uses `TextureView` preferably. This scheme is highly flexible and supports animation and transformation effects.
 * If you want to force the use of a certain scheme, you can write the code as follows:
 * Usage 1. Force the use of `TextureView`:
 * TXCloudVideoView localView = findViewById(R.id.trtc_tc_cloud_view_main);
 * localView.addVideoView(new TextureView(context));
 * mTRTCCloud.startLocalPreview(true, localView);
 * Usage 2. Force the use of `SurfaceView`:
 * SurfaceView surfaceView = new SurfaceView(this);
 * TXCloudVideoView localView = new TXCloudVideoView(surfaceView);
 * mTRTCCloud.startLocalPreview(true, localView);
 * 3. All platform with C++
 * As the all-platform C++ APIs need to use a unified parameter type, you should uniformly convert the rendering controls into pointers in `TXView` type when calling these APIs:
 * - iOS: you can use the `UIView` object as the rendering control. When calling the C++ APIs, please pass in the pointer to the `UIView` object (which needs to be forcibly converted to the `void*` type).
 * - macOS: you can use the `NSView` object as the rendering control. When calling the C++ APIs, please pass in the pointer to the `NSView` object (which needs to be forcibly converted to the `void*` type).
 * - Android: when calling the C++ APIs, please pass in the `jobject` pointer to the `TXCloudVideoView` object (which needs to be forcibly converted to the `void*` type).
 * - Windows: you can use the window handle `HWND` as the rendering control. When calling the C++ APIs, you need to forcibly convert the `HWND` to `void*` type.
 * Code sample 1. Use the all-platform C++ APIs under QT
 * QWidget *videoView;
 * // The relevant code for setting the videoView is omitted here...
 * getTRTCShareInstance()->startLocalPreview(reinterpret_cast<TXView>(videoView->winId()));
 * Code sample 2. Call the all-platform C++ APIs through JNI on Android
 * native void nativeStartLocalPreview(String userId, int streamType, TXCloudVideoView view);
 * //...
 * Java_com_example_test_MainActivity_nativeStartRemoteView(JNIEnv *env, jobject thiz, jstring user_id, jint stream_type, jobject view) {
 *     const char *user_id_chars = env->GetStringUTFChars(user_id, nullptr);
 *     trtc_cloud->startRemoteView(user_id_chars, (trtc::TRTCVideoStreamType)stream_type, view);
 *     env->ReleaseStringUTFChars(user_id, user_id_chars);
 * }
 */
#ifdef _WIN32
typedef HWND TXView;
#else
typedef void *TXView;
#endif

/////////////////////////////////////////////////////////////////////////////////
//
//                    Definitions of video enumerated values
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 1.1 Video resolution
 *
 * Here, only the landscape resolution (e.g., 640x360) is defined. If the portrait resolution (e.g., 360x640) needs to be used, `Portrait` must be selected for `TRTCVideoResolutionMode`.
 */
enum TRTCVideoResolution {

    /// Aspect ratio: 1:1; resolution: 120x120; recommended bitrate (VideoCall): 80 Kbps; recommended bitrate (LIVE): 120 Kbps.
    TRTCVideoResolution_120_120 = 1,

    /// Aspect ratio: 1:1; resolution: 160x160; recommended bitrate (VideoCall): 100 Kbps; recommended bitrate (LIVE): 150 Kbps.
    TRTCVideoResolution_160_160 = 3,

    /// Aspect ratio: 1:1; resolution: 270x270; recommended bitrate (VideoCall): 200 Kbps; recommended bitrate (LIVE): 300 Kbps.
    TRTCVideoResolution_270_270 = 5,

    /// Aspect ratio: 1:1; resolution: 480x480; recommended bitrate (VideoCall): 350 Kbps; recommended bitrate (LIVE): 500 Kbps.
    TRTCVideoResolution_480_480 = 7,

    /// Aspect ratio: 4:3; resolution: 160x120; recommended bitrate (VideoCall): 100 Kbps; recommended bitrate (LIVE): 150 Kbps.
    TRTCVideoResolution_160_120 = 50,

    /// Aspect ratio: 4:3; resolution: 240x180; recommended bitrate (VideoCall): 150 Kbps; recommended bitrate (LIVE): 250 Kbps.
    TRTCVideoResolution_240_180 = 52,

    /// Aspect ratio: 4:3; resolution: 280x210; recommended bitrate (VideoCall): 200 Kbps; recommended bitrate (LIVE): 300 Kbps.
    TRTCVideoResolution_280_210 = 54,

    /// Aspect ratio: 4:3; resolution: 320x240; recommended bitrate (VideoCall): 250 Kbps; recommended bitrate (LIVE): 375 Kbps.
    TRTCVideoResolution_320_240 = 56,

    /// Aspect ratio: 4:3; resolution: 400x300; recommended bitrate (VideoCall): 300 Kbps; recommended bitrate (LIVE): 450 Kbps.
    TRTCVideoResolution_400_300 = 58,

    /// Aspect ratio: 4:3; resolution: 480x360; recommended bitrate (VideoCall): 400 Kbps; recommended bitrate (LIVE): 600 Kbps.
    TRTCVideoResolution_480_360 = 60,

    /// Aspect ratio: 4:3; resolution: 640x480; recommended bitrate (VideoCall): 600 Kbps; recommended bitrate (LIVE): 900 Kbps.
    TRTCVideoResolution_640_480 = 62,

    /// Aspect ratio: 4:3; resolution: 960x720; recommended bitrate (VideoCall): 1000 Kbps; recommended bitrate (LIVE): 1500 Kbps.
    TRTCVideoResolution_960_720 = 64,

    /// Aspect ratio: 16:9; resolution: 160x90; recommended bitrate (VideoCall): 150 Kbps; recommended bitrate (LIVE): 250 Kbps.
    TRTCVideoResolution_160_90 = 100,

    /// Aspect ratio: 16:9; resolution: 256x144; recommended bitrate (VideoCall): 200 Kbps; recommended bitrate (LIVE): 300 Kbps.
    TRTCVideoResolution_256_144 = 102,

    /// Aspect ratio: 16:9; resolution: 320x180; recommended bitrate (VideoCall): 250 Kbps; recommended bitrate (LIVE): 400 Kbps.
    TRTCVideoResolution_320_180 = 104,

    /// Aspect ratio: 16:9; resolution: 480x270; recommended bitrate (VideoCall): 350 Kbps; recommended bitrate (LIVE): 550 Kbps.
    TRTCVideoResolution_480_270 = 106,

    /// Aspect ratio: 16:9; resolution: 640x360; recommended bitrate (VideoCall): 500 Kbps; recommended bitrate (LIVE): 900 Kbps.
    TRTCVideoResolution_640_360 = 108,

    /// Aspect ratio: 16:9; resolution: 960x540; recommended bitrate (VideoCall): 850 Kbps; recommended bitrate (LIVE): 1300 Kbps.
    TRTCVideoResolution_960_540 = 110,

    /// Aspect ratio: 16:9; resolution: 1280x720; recommended bitrate (VideoCall): 1200 Kbps; recommended bitrate (LIVE): 1800 Kbps.
    TRTCVideoResolution_1280_720 = 112,

    /// Aspect ratio: 16:9; resolution: 1920x1080; recommended bitrate (VideoCall): 2000 Kbps; recommended bitrate (LIVE): 3000 Kbps.
    TRTCVideoResolution_1920_1080 = 114,

};

/**
 * 1.2 Video aspect ratio mode
 *
 * Only the landscape resolution (e.g., 640x360) is defined in `TRTCVideoResolution`. If the portrait resolution (e.g., 360x640) needs to be used, `Portrait` must be selected for `TRTCVideoResolutionMode`.
 */
enum TRTCVideoResolutionMode {

    /// Landscape resolution, such as TRTCVideoResolution_640_360 + TRTCVideoResolutionModeLandscape = 640x360.
    TRTCVideoResolutionModeLandscape = 0,

    /// Portrait resolution, such as TRTCVideoResolution_640_360 + TRTCVideoResolutionModePortrait = 360x640.
    TRTCVideoResolutionModePortrait = 1,

};

/**
 * 1.3 Video stream type
 *
 * TRTC provides three different video streams, including:
 *  - HD big image: it is generally used to transfer video data from the camera.
 *  - Smooth small image: it has the same content as the big image, but with lower resolution and bitrate and thus lower definition.
 *  - Substream image: it is generally used for screen sharing. Only one user in the room is allowed to publish the substream video image at any time, while other users must wait for this user to close the substream before they can publish their own
 * substream.
 * @note The SDK does not support enabling the smooth small image alone, which must be enabled together with the big image. It will automatically set the resolution and bitrate of the small image.
 */
enum TRTCVideoStreamType {

    /// HD big image: it is generally used to transfer video data from the camera.
    TRTCVideoStreamTypeBig = 0,

    /// Smooth small image: it has the same content as the big image, but with lower resolution and bitrate and thus lower definition.
    TRTCVideoStreamTypeSmall = 1,

    /// Substream image: it is generally used for screen sharing. Only one user in the room is allowed to publish the substream video image at any time, while other users must wait for this user to close the substream before they can publish their
    /// own substream.
    TRTCVideoStreamTypeSub = 2,

};

/**
 * 1.4 Video image fill mode
 *
 * If the aspect ratio of the video display area is not equal to that of the video image, you need to specify the fill mode:
 */
enum TRTCVideoFillMode {

    /// Fill mode: the video image will be centered and scaled to fill the entire display area, where parts that exceed the area will be cropped. The displayed image may be incomplete in this mode.
    TRTCVideoFillMode_Fill = 0,

    /// Fit mode: the video image will be scaled based on its long side to fit the display area, where the short side will be filled with black bars. The displayed image is complete in this mode, but there may be black bars.
    TRTCVideoFillMode_Fit = 1,

};

/**
 * 1.5 Video image rotation direction
 *
 * TRTC provides rotation angle setting APIs for local and remote images. The following rotation angles are all clockwise.
 */
enum TRTCVideoRotation {

    /// No rotation
    TRTCVideoRotation0 = 0,

    /// Clockwise rotation by 90 degrees
    TRTCVideoRotation90 = 1,

    /// Clockwise rotation by 180 degrees
    TRTCVideoRotation180 = 2,

    /// Clockwise rotation by 270 degrees
    TRTCVideoRotation270 = 3,

};

/**
 * 1.6 Beauty (skin smoothing) filter algorithm
 *
 * TRTC has multiple built-in skin smoothing algorithms. You can select the one most suitable for your product.
 */
enum TRTCBeautyStyle {

    /// Smooth style, which uses a more radical algorithm for more obvious effect and is suitable for show live streaming.
    TRTCBeautyStyleSmooth = 0,

    /// Natural style, which retains more facial details for more natural effect and is suitable for most live streaming use cases.
    TRTCBeautyStyleNature = 1,

};

/**
 * 1.7 Video pixel format
 *
 * TRTC provides custom video capturing and rendering features.
 * - For the custom capturing feature, you can use the following enumerated values to describe the pixel format of the video you capture.
 * - For the custom rendering feature, you can specify the pixel format of the video you expect the SDK to call back.
 */
enum TRTCVideoPixelFormat {

    /// Undefined format
    TRTCVideoPixelFormat_Unknown = 0,

    /// YUV420P (I420) format
    TRTCVideoPixelFormat_I420 = 1,

    /// OpenGL 2D texture format
    TRTCVideoPixelFormat_Texture_2D = 2,

    /// BGRA32 format
    TRTCVideoPixelFormat_BGRA32 = 3,

    /// NV21 format
    TRTCVideoPixelFormat_NV21 = 4,

    /// RGBA format
    TRTCVideoPixelFormat_RGBA32 = 5,

};

/**
 * 1.8 Video data transfer method
 *
 * For custom capturing and rendering features, you need to use the following enumerated values to specify the method of transferring video data:
 * - Method 1. This method uses memory buffer to transfer video data. It is efficient on iOS but inefficient on Android. It is the only method supported on Windows currently.
 * - Method 2. This method uses texture to transfer video data. It is efficient on both iOS and Android but is not supported on Windows. To use this method, you should have a general familiarity with OpenGL programming.
 */
enum TRTCVideoBufferType {

    /// Undefined transfer method
    TRTCVideoBufferType_Unknown = 0,

    /// Use memory buffer to transfer video data. iOS: `PixelBuffer`; Android: `Direct Buffer` for JNI layer; Windows: memory data block.
    TRTCVideoBufferType_Buffer = 1,

    /// Use OpenGL texture to transfer video data
    TRTCVideoBufferType_Texture = 3,

    /// Use D3D11 texture to transfer video data
    TRTCVideoBufferType_TextureD3D11 = 4,

};

/**
 * 1.9 Video mirror type
 *
 * Video mirroring refers to the left-to-right flipping of the video image, especially for the local camera preview image. After mirroring is enabled, it can bring anchors a familiar "look into the mirror" experience.
 */
enum TRTCVideoMirrorType {

/// Auto mode: mirror the front camera's image but not the rear camera's image (for mobile devices only).
#if TARGET_PLATFORM_PHONE
    TRTCVideoMirrorType_Auto = 0,
#endif

    /// Mirror the images of both the front and rear cameras.
    TRTCVideoMirrorType_Enable = 1,

    /// Disable mirroring for both the front and rear cameras.
    TRTCVideoMirrorType_Disable = 2,

};

/**
 * 1.10 Data source of local video screenshot
 *
 * The SDK can take screenshots from the following two data sources and save them as local files:
 * - Video stream: the SDK screencaptures the native video content from the video stream. The screenshots are not controlled by the display of the rendering control.
 * - Rendering layer: the SDK screencaptures the displayed video content from the rendering control, which can achieve the effect of WYSIWYG, but if the display area is too small, the screenshots will also be very small.
 */
enum TRTCSnapshotSourceType {

    /// The SDK screencaptures the native video content from the video stream. The screenshots are not controlled by the display of the rendering control.
    TRTCSnapshotSourceTypeStream = 0,

    /// The SDK screencaptures the displayed video content from the rendering control, which can achieve the effect of WYSIWYG, but if the display area is too small, the screenshots will also be very small.
    TRTCSnapshotSourceTypeView = 1,

};

/////////////////////////////////////////////////////////////////////////////////
//
//                    Definitions of network enumerated values
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 2.1 Use cases
 *
 * TRTC features targeted optimizations for common audio/video application scenarios to meet the differentiated requirements in various verticals. The main scenarios can be divided into the following two categories:
 * - Live streaming scenario (LIVE): including `LIVE` (audio + video) and `VoiceChatRoom` (pure audio).
 *   In the live streaming scenario, users are divided into two roles: "anchor" and "audience". A single room can sustain up to 100,000 concurrent online users. This is suitable for live streaming to a large audience.
 * - Real-Time scenario (RTC): including `VideoCall` (audio + video) and `AudioCall` (pure audio).
 *   In the real-time scenario, there is no role difference between users, but a single room can sustain only up to 300 concurrent online users. This is suitable for small-scale real-time communication.
 */
enum TRTCAppScene {

    /// In the video call scenario, 720p and 1080p HD image quality is supported. A single room can sustain up to 300 concurrent online users, and up to 50 of them can speak simultaneously.
    /// Use cases: [one-to-one video call], [video conferencing with up to 300 participants], [online medical diagnosis], [small class], [video interview], etc.
    TRTCAppSceneVideoCall = 0,

    /// In the interactive video live streaming scenario, mic can be turned on/off smoothly without waiting for switchover, and the anchor latency is as low as less than 300 ms. Live streaming to hundreds of thousands of concurrent users in the
    /// audience role is supported with the playback latency down to 1,000 ms.
    /// Use cases: [low-latency interactive live streaming], [big class], [anchor competition], [video dating room], [online interactive classroom], [remote training], [large-scale conferencing], etc.
    ///@note In this scenario, you must use the `role` field in `TRTCParams` to specify the role of the current user.
    TRTCAppSceneLIVE = 1,

    /// Audio call scenario, where the `SPEECH` sound quality is used by default. A single room can sustain up to 300 concurrent online users, and up to 50 of them can speak simultaneously.
    /// Use cases: [one-to-one audio call], [audio conferencing with up to 300 participants], [audio chat], [online Werewolf], etc.
    TRTCAppSceneAudioCall = 2,

    /// In the interactive audio live streaming scenario, mic can be turned on/off smoothly without waiting for switchover, and the anchor latency is as low as less than 300 ms. Live streaming to hundreds of thousands of concurrent users in the
    /// audience role is supported with the playback latency down to 1,000 ms.
    /// Use cases: [audio club], [online karaoke room], [music live room], [FM radio], etc.
    ///@note In this scenario, you must use the `role` field in `TRTCParams` to specify the role of the current user.
    TRTCAppSceneVoiceChatRoom = 3,

};

/**
 * 2.2 Role
 *
 * Role is applicable only to live streaming scenarios (`TRTCAppSceneLIVE` and `TRTCAppSceneVoiceChatRoom`). Users are divided into two roles:
 * - Anchor, who can publish their audio/video streams. There is a limit on the number of anchors. Up to 50 anchors are allowed to publish streams at the same time in one room.
 * - Audience, who can only listen to or watch audio/video streams of anchors in the room. If they want to publish their streams, they need to switch to the "anchor" role first through {@link switchRole}. One room can sustain up to 100,000 concurrent
 * online users in the audience role.
 */
enum TRTCRoleType {

    /// An anchor can publish their audio/video streams. There is a limit on the number of anchors. Up to 50 anchors are allowed to publish streams at the same time in one room.
    TRTCRoleAnchor = 20,

    /// Audience can only listen to or watch audio/video streams of anchors in the room. If they want to publish their streams, they need to switch to the "anchor" role first through {@link switchRole}. One room can sustain up to 100,000 concurrent
    /// online users in the audience role.
    TRTCRoleAudience = 21,

};

/**
 * 2.3 QoS control mode (disused)
 */
enum TRTCQosControlMode {

    /// Client-based control, which is for internal debugging of SDK and shall not be used by users.
    TRTCQosControlModeClient = 0,

    /// On-cloud control, which is the default and recommended mode.
    TRTCQosControlModeServer = 1,

};

/**
 * 2.4 Image quality preference
 *
 * TRTC has two control modes in weak network environments: "ensuring clarity" and "ensuring smoothness". Both modes will give priority to the transfer of audio data.
 */
enum TRTCVideoQosPreference {

    /// Ensuring smoothness: in this mode, when the current network is unable to transfer a clear and smooth video image, the smoothness of the image will be given priority, but there will be blurs.
    TRTCVideoQosPreferenceSmooth = 1,

    /// Ensuring clarity (default value): in this mode, when the current network is unable to transfer a clear and smooth video image, the clarity of the image will be given priority, but there will be lags.
    TRTCVideoQosPreferenceClear = 2,

};

/**
 * 2.5 Network quality
 *
 * TRTC evaluates the current network quality once every two seconds. The evaluation results are divided into six levels: `Excellent` indicates the best, and `Down` indicates the worst.
 */
enum TRTCQuality {

    /// Undefined
    TRTCQuality_Unknown = 0,

    /// The current network is excellent
    TRTCQuality_Excellent = 1,

    /// The current network is good
    TRTCQuality_Good = 2,

    /// The current network is fair
    TRTCQuality_Poor = 3,

    /// The current network is bad
    TRTCQuality_Bad = 4,

    /// The current network is very bad
    TRTCQuality_Vbad = 5,

    /// The current network cannot meet the minimum requirements of TRTC
    TRTCQuality_Down = 6,

};

/**
 * 2.6 Audio/Video playback status
 *
 * This enumerated type is used in the audio status changed API {@link onRemoteAudioStatusUpdated} and the video status changed API {@link onRemoteVideoStatusUpdated} to specify the current audio/video status.
 */
enum TRTCAVStatusType {

    /// Stopped
    TRTCAVStatusStopped = 0,

    /// Playing
    TRTCAVStatusPlaying = 1,

    /// Loading
    TRTCAVStatusLoading = 2,

};

/**
 * 2.7 Reasons for playback status changes
 *
 * This enumerated type is used in the audio status changed API {@link onRemoteAudioStatusUpdated} and the video status changed API {@link onRemoteVideoStatusUpdated} to specify the reason for the current audio/video status change.
 */
enum TRTCAVStatusChangeReason {

    /// Default value
    TRTCAVStatusChangeReasonInternal = 0,

    /// The stream enters the `Loading` state due to network congestion
    TRTCAVStatusChangeReasonBufferingBegin = 1,

    /// The stream enters the `Playing` state after network recovery
    TRTCAVStatusChangeReasonBufferingEnd = 2,

    /// As a start-related API was directly called locally, the stream enters the `Playing` state
    TRTCAVStatusChangeReasonLocalStarted = 3,

    /// As a stop-related API was directly called locally, the stream enters the `Stopped` state
    TRTCAVStatusChangeReasonLocalStopped = 4,

    /// As the remote user started (or resumed) publishing the audio or video stream, the stream enters the `Loading` or `Playing` state
    TRTCAVStatusChangeReasonRemoteStarted = 5,

    /// As the remote user stopped (or paused) publishing the audio or video stream, the stream enters the "Stopped" state
    TRTCAVStatusChangeReasonRemoteStopped = 6,

};

/////////////////////////////////////////////////////////////////////////////////
//
//                    Definitions of audio enumerated values
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 3.2 Sound quality
 *
 * TRTC provides three well-tuned modes to meet the differentiated requirements for sound quality in various verticals:
 * - Speech mode (Speech): it is suitable for application scenarios that focus on human communication. In this mode, the audio transfer is more resistant, and TRTC uses various voice processing technologies to ensure the optimal smoothness even in
 * weak network environments.
 * - Music mode (Music): it is suitable for scenarios with demanding requirements for music. In this mode, the amount of transferred audio data is very large, and TRTC uses various technologies to ensure that the high-fidelity details of music
 * signals can be restored in each frequency band.
 * - Default mode (Default): it is between `Speech` and `Music`. In this mode, the reproduction of music is better than that in `Speech` mode, and the amount of transferred data is much lower than that in `Music` mode; therefore, this mode has good
 * adaptability to various scenarios.
 */
enum TRTCAudioQuality {

    /// Speech mode: sample rate: 16 kHz; mono channel; bitrate: 16 Kbps. This mode has the best resistance among all modes and is suitable for audio call scenarios, such as online meeting and audio call.
    TRTCAudioQualitySpeech = 1,

    /// Default mode: sample rate: 48 kHz; mono channel; bitrate: 50 Kbps. This mode is between the speech mode and the music mode as the default mode in the SDK and is recommended.
    TRTCAudioQualityDefault = 2,

    /// Music mode: sample rate: 48 kHz; full-band stereo; bitrate: 128 Kbps. This mode is suitable for scenarios where Hi-Fi music transfer is required, such as online karaoke and music live streaming.
    TRTCAudioQualityMusic = 3,

};

/**
 * 3.7 Audio frame content format
 */
enum TRTCAudioFrameFormat {

    /// None
    TRTCAudioFrameFormatNone = 0,

    /// Audio data in PCM format
    TRTCAudioFrameFormatPCM,

};

/**
 * 3.9 Audio callback data operation mode
 *
 * TRTC provides two modes of operation for audio callback data.
 * - Read-only mode (ReadOnly): Get audio data only from the callback.
 * - ReadWrite mode (ReadWrite): You can get and modify the audio data of the callback.
 */
enum TRTCAudioFrameOperationMode {

    /// Read-write mode: You can get and modify the audio data of the callback, the default mode.
    TRTCAudioFrameOperationModeReadWrite = 0,

    /// Read-only mode: Get audio data from callback only.
    TRTCAudioFrameOperationModeReadOnly = 1,

};

/////////////////////////////////////////////////////////////////////////////////
//
//                      Definitions of other enumerated values
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 4.1 Log level
 *
 * Different log levels indicate different levels of details and number of logs. We recommend you set the log level to `TRTCLogLevelInfo` generally.
 */
enum TRTCLogLevel {

    /// Output logs at all levels
    TRTCLogLevelVerbose = 0,

    /// Output logs at the DEBUG, INFO, WARNING, ERROR, and FATAL levels
    TRTCLogLevelDebug = 1,

    /// Output logs at the INFO, WARNING, ERROR, and FATAL levels
    TRTCLogLevelInfo = 2,

    /// Output logs at the WARNING, ERROR, and FATAL levels
    TRTCLogLevelWarn = 3,

    /// Output logs at the ERROR and FATAL levels
    TRTCLogLevelError = 4,

    /// Output logs at the FATAL level
    TRTCLogLevelFatal = 5,

    /// Do not output any SDK logs
    TRTCLogLevelNone = 6,

};

/**
 * 4.3 Screen sharing target type (for desktops only)
 */
enum TRTCScreenCaptureSourceType {

    /// Undefined
    TRTCScreenCaptureSourceTypeUnknown = -1,

    /// The screen sharing target is the window of an application
    TRTCScreenCaptureSourceTypeWindow = 0,

    /// The screen sharing target is the entire screen
    TRTCScreenCaptureSourceTypeScreen = 1,

    /// The screen sharing target is a user-defined data source
    TRTCScreenCaptureSourceTypeCustom = 2,

};

/**
 * 4.4 Layout mode of On-Cloud MixTranscoding
 *
 * TRTC's On-Cloud MixTranscoding service can mix multiple audio/video streams in the room into one stream. Therefore, you need to specify the layout scheme of the video images. The following layout modes are provided:
 */
enum TRTCTranscodingConfigMode {

    /// Undefined
    TRTCTranscodingConfigMode_Unknown = 0,

    /// Manual layout mode
    /// In this mode, you need to specify the precise position of each video image. This mode has the highest degree of freedom, but its ease of use is the worst:
    ///- You need to enter all the parameters in `TRTCTranscodingConfig`, including the position coordinates of each video image (TRTCMixUser).
    ///- You need to listen on the `onUserVideoAvailable()` and `onUserAudioAvailable()` event callbacks in `TRTCCloudDelegate` and constantly adjust the `mixUsers` parameter according to the audio/video status of each user with mic on in the current
    /// room.
    TRTCTranscodingConfigMode_Manual = 1,

    /// Pure audio mode
    /// This mode is suitable for pure audio scenarios such as audio call (AudioCall) and audio chat room (VoiceChatRoom).
    ///- You only need to set it once through the `setMixTranscodingConfig()` API after room entry, and then the SDK will automatically mix the audio of all mic-on users in the room into the current user's live stream.
    ///- You don't need to set the `mixUsers` parameter in `TRTCTranscodingConfig`; instead, you only need to set the `audioSampleRate`, `audioBitrate` and `audioChannels` parameters.
    TRTCTranscodingConfigMode_Template_PureAudio = 2,

    /// Preset layout mode
    /// This is the most popular layout mode, because it allows you to set the position of each video image in advance through placeholders, and then the SDK automatically adjusts it dynamically according to the number of video images in the room.
    /// In this mode, you still need to set the `mixUsers` parameter, but you can set `userId` as a "placeholder". Placeholder values include:
    /// - "$PLACE_HOLDER_REMOTE$": image of remote user. Multiple images can be set.
    /// - "$PLACE_HOLDER_LOCAL_MAIN$": local camera image. Only one image can be set.
    /// - "$PLACE_HOLDER_LOCAL_SUB$": local screen sharing image. Only one image can be set.
    /// In this mode, you don't need to listen on the `onUserVideoAvailable()` and `onUserAudioAvailable()` callbacks in `TRTCCloudDelegate` to make real-time adjustments.
    /// Instead, you only need to call `setMixTranscodingConfig()` once after successful room entry. Then, the SDK will automatically populate the placeholders you set with real `userId` values.
    TRTCTranscodingConfigMode_Template_PresetLayout = 3,

    /// Screen sharing mode
    /// This mode is suitable for screen sharing-based use cases such as online education and supported only by the SDKs for Windows and macOS.
    /// In this mode, the SDK will first build a canvas according to the target resolution you set (through the `videoWidth` and `videoHeight` parameters).
    ///- Before the teacher enables screen sharing, the SDK will scale up the teacher's camera image and draw it onto the canvas.
    ///- After the teacher enables screen sharing, the SDK will draw the video image shared on the screen onto the same canvas.
    /// The purpose of this layout mode is to ensure consistency in the output resolution of the mixtranscoding module and avoid problems with blurred screen during course replay and webpage playback (web players don't support adjustable resolution).
    /// Meanwhile, the audio of mic-on students will be mixed into the teacher's audio/video stream by default.
    /// Video content is primarily the shared screen in teaching mode, and it is a waste of bandwidth to transfer camera image and screen image at the same time.
    /// Therefore, the recommended practice is to directly draw the camera image onto the current screen through the `setLocalVideoRenderCallback` API.
    /// In this mode, you don't need to set the `mixUsers` parameter in `TRTCTranscodingConfig`, and the SDK will not mix students' images so as not to interfere with the screen sharing effect.
    /// You can set width x height in `TRTCTranscodingConfig` to 0 px x 0 px, and the SDK will automatically calculate a suitable resolution based on the aspect ratio of the user's current screen.
    ///- If the teacher's current screen width is less than or equal to 1920 px, the SDK will use the actual resolution of the teacher's current screen.
    ///- If the teacher's current screen width is greater than 1920 px, the SDK will select one of the three resolutions of 1920x1080 (16:9), 1920x1200 (16:10), and 1920x1440 (4:3) according to the current screen aspect ratio.
    TRTCTranscodingConfigMode_Template_ScreenSharing = 4,

};

/**
 * 4.5 Media recording type
 *
 * This enumerated type is used in the local media recording API {@link startLocalRecording} to specify whether to record audio/video files or pure audio files.
 */
enum TRTCLocalRecordType {

    /// Record audio only
    TRTCLocalRecordType_Audio = 0,

    /// Record video only
    TRTCLocalRecordType_Video = 1,

    /// Record both audio and video
    TRTCLocalRecordType_Both = 2,

};

/**
 * 4.6 Stream mix input type
 */
enum TRTCMixInputType {

    /// Default.
    /// Considering the compatibility with older versions, if you specify the inputType as Undefined, the SDK will determine the stream mix input type according to the value of the `pureAudio` parameter
    TRTCMixInputTypeUndefined = 0,

    /// Mix both audio and video
    TRTCMixInputTypeAudioVideo = 1,

    /// Mix video only
    TRTCMixInputTypePureVideo = 2,

    /// Mix audio only
    TRTCMixInputTypePureAudio = 3,

    /// Mix watermark
    /// In this case, you don't need to specify the `userId` parameter, but you need to specify the `image` parameter. It is recommended to use png format.
    TRTCMixInputTypeWatermark = 4,

};

/**
 * 4.7 Device type (for desktop platforms only)
 *
 * This enumerated value is used to define three types of audio/video devices, namely, camera, mic, and speaker, so that the same device management API can control the three different types of devices.
 * Starting from v8.0, TRTC redefines `TXMediaDeviceType` in `TXDeviceManager` to replace `TRTCMediaDeviceType` on legacy versions.
 * Only the definition of `TRTCMediaDeviceType` is retained here for compatibility with customer code on legacy versions.
 */
typedef TXMediaDeviceType TRTCDeviceType;
#define TRTCDeviceTypeUnknow TXMediaDeviceTypeUnknown
#define TRTCDeviceTypeMic TXMediaDeviceTypeMic
#define TRTCDeviceTypeSpeaker TXMediaDeviceTypeSpeaker
#define TRTCDeviceTypeCamera TXMediaDeviceTypeCamera

/**
 * 4.8 Watermark image source type
 */
enum TRTCWaterMarkSrcType {

    /// Path of the image file, which can be in BMP, GIF, JPEG, PNG, TIFF, Exif, WMF, or EMF format
    TRTCWaterMarkSrcTypeFile = 0,

    /// Memory block in BGRA32 format
    TRTCWaterMarkSrcTypeBGRA32 = 1,

    /// Memory block in RGBA32 format
    TRTCWaterMarkSrcTypeRGBA32 = 2,

};

/**
 * 4.9 Device operation This enumerated value is used to notify the status change of the local device {@link onDeviceChange}.
 */
typedef TXMediaDeviceState TRTCDeviceState;
#define TRTCDeviceStateAdd TXMediaDeviceStateAdd
#define TRTCDeviceStateRemove TXMediaDeviceStateRemove
#define TRTCDeviceStateActive TXMediaDeviceStateActive

/**
 * 4.11 Audio recording content type
 *
 * This enumerated type is used in the audio recording API {@link startAudioRecording} to specify the content of the recorded audio.
 */
enum TRTCAudioRecordingContent {

    /// Record both local and remote audio
    TRTCAudioRecordingContentAll = 0,

    /// Record local audio only
    TRTCAudioRecordingContentLocal = 1,

    /// Record remote audio only
    TRTCAudioRecordingContentRemote = 2,

};

/**
 * 4.12 The publishing mode
 *
 * This enum type is used by the publishing API {@link startPublishMediaStream}.
 * TRTC can mix multiple streams in a room and publish the mixed stream to a CDN or to a TRTC room. It can also publish the stream of the local user to Tencent Cloud or a third-party CDN.
 * You can specify one of the following publishing modes to use:
 */
enum TRTCPublishMode {

    /// Undefined
    TRTCPublishModeUnknown = 0,

    /// Use this parameter to publish the primary stream ({@link TRTCVideoStreamTypeBig}) in the room to Tencent Cloud or a third-party CDN (only RTMP is supported).
    TRTCPublishBigStreamToCdn = 1,

    /// Use this parameter to publish the substream ({@link TRTCVideoStreamTypeSub}) in the room to Tencent Cloud or a third-party CDN (only RTMP is supported).
    TRTCPublishSubStreamToCdn = 2,

    /// Use this parameter together with the encoding parameter {@link TRTCStreamEncoderParam} and On-Cloud MixTranscoding parameter {@link TRTCStreamMixingConfig} to transcode the streams you specify and publish the mixed stream to Tencent Cloud or
    /// a third-party CDN (only RTMP is supported).
    TRTCPublishMixStreamToCdn = 3,

    /// Use this parameter together with the encoding parameter {@link TRTCStreamEncoderParam} and On-Cloud MixTranscoding parameter {@link TRTCStreamMixingConfig} to transcode the streams you specify and publish the mixed stream to the room you
    /// specify.
    ///- Use `TRTCUser` in {@link TRTCPublishTarget} to specify the robot that publishes the transcoded stream to a TRTC room.
    TRTCPublishMixStreamToRoom = 4,

};

/**
 * 4.13 Encryption Algorithm
 *
 * This enumeration type is used for media stream private encryption algorithm selection.
 */
enum TRTCEncryptionAlgorithm {

    /// AES GCM 128。
    TRTCEncryptionAlgorithmAes128Gcm = 0,

    /// AES GCM 256。
    TRTCEncryptionAlgorithmAes256Gcm = 1,

};

/**
 * 4.14 Speed Test Scene
 *
 * This enumeration type is used for speed test scene selection.
 */
enum TRTCSpeedTestScene {

    /// Delay testing.
    TRTCSpeedTestScene_DelayTesting = 1,

    /// Delay and bandwidth testing.
    TRTCSpeedTestScene_DelayAndBandwidthTesting = 2,

    /// Online chorus testing.
    TRTCSpeedTestScene_OnlineChorusTesting = 3,

};

/**
 * 4.15 Set the adaptation mode of gravity sensing (only applicable to mobile terminals)
 * Begin from v11.7 version，It only takes effect when the camera capture scene inside SDK is used.
 */
enum TRTCGravitySensorAdaptiveMode {

    /// Turn off the gravity sensor and make a decision based on the current acquisition resolution and the set encoding resolution. If the two are inconsistent, rotate 90 degrees to ensure the maximum frame.
    TRTCGravitySensorAdaptiveMode_Disable = 0,

    /// Turn on the gravity sensor to always ensure that the remote screen image is positive. When the intermediate process needs to deal with inconsistent resolutions, use the center cropping mode.
    TRTCGravitySensorAdaptiveMode_FillByCenterCrop = 1,

    /// Turn on the gravity sensor to always ensure that the remote screen image is positive. When the resolution needs to be processed inconsistently in the intermediate process, use the superimposed black border mode.
    TRTCGravitySensorAdaptiveMode_FitWithBlackBorder = 2,

};

/////////////////////////////////////////////////////////////////////////////////
//
//                      Definitions of core TRTC classes
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 5.1 Room entry parameters
 *
 * As the room entry parameters in the TRTC SDK, these parameters must be correctly set so that the user can successfully enter the audio/video room specified by `roomId` or `strRoomId`.
 * For historical reasons, TRTC supports two types of room IDs: `roomId` and `strRoomId`.
 * Note: do not mix `roomId` and `strRoomId`, because they are not interchangeable. For example, the number `123` and the string `123` are two completely different rooms in TRTC.
 */
struct TRTCParams {
    /// Field description: application ID, which is required. Tencent Cloud generates bills based on `sdkAppId`.
    /// Recommended value: the ID can be obtained on the account information page in the [TRTC console](https://console.cloud.tencent.com/rav/) after the corresponding application is created.
    uint32_t sdkAppId;

    /// Field description: user ID, which is required. It is the `userId` of the local user in UTF-8 encoding and acts as the username.
    /// Recommended value: if the ID of a user in your account system is "mike", `userId` can be set to "mike".
    const char *userId;

    /// Field description: user signature, which is required. It is the authentication signature corresponding to the current `userId` and acts as the login password for Tencent Cloud services.
    /// Recommended value: for the calculation method, please see [UserSig](https://www.tencentcloud.com/document/product/647/35166).
    const char *userSig;

    /// Field description: numeric room ID. Users (userId) in the same room can see one another and make audio/video calls.
    /// Recommended value: value range: 1–4294967294.
    ///@note `roomId` and `strRoomId` are mutually exclusive. If you decide to use `strRoomId`, then `roomId` should be entered as 0. If both are entered, `roomId` will be used.
    ///@note do not mix `roomId` and `strRoomId`, because they are not interchangeable. For example, the number `123` and the string `123` are two completely different rooms in TRTC.
    uint32_t roomId;

    /// Field description: string-type room ID. Users (userId) in the same room can see one another and make audio/video calls.
    ///@note `roomId` and `strRoomId` are mutually exclusive. If you decide to use `strRoomId`, then `roomId` should be entered as 0. If both are entered, `roomId` will be used.
    ///@note do not mix `roomId` and `strRoomId`, because they are not interchangeable. For example, the number `123` and the string `123` are two completely different rooms in TRTC.
    /// Recommended value: the length limit is 64 bytes. The following 89 characters are supported:
    ///  - Uppercase and lowercase letters (a–z and A–Z)
    ///  - Digits (0–9)
    ///  - Space, "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", "{", "}", "|", "~", and ",".
    const char *strRoomId;

    /// Field description: role in the live streaming scenario, which is applicable only to the live streaming scenario ({@link TRTCAppSceneLIVE} or {@link TRTCAppSceneVoiceChatRoom}) but doesn't take effect in the call scenario.
    /// Recommended value: default value: anchor ({@link TRTCRoleAnchor}).
    TRTCRoleType role;

    /// Field description: specified `streamId` in Tencent Cloud CSS, which is optional. After setting this field, you can play back the user's audio/video stream on Tencent Cloud CSS CDN through a standard pull scheme (FLV or HLS).
    /// Recommended value: this parameter can contain up to 64 bytes and can be left empty. We recommend you use `sdkappid_roomid_userid_main` as the `streamid`, which is easier to identify and will not cause conflicts in your multiple applications.
    ///@note to use Tencent Cloud CSS CDN, you need to enable the auto-relayed live streaming feature on the "Function Configuration" page in the [console](https://console.cloud.tencent.com/trtc/) first.
    /// For more information, please see [CDN Relayed Live Streaming](https://www.tencentcloud.com/document/product/647/35242).
    const char *streamId;

    /// Field description: on-cloud recording field, which is optional and used to specify whether to record the user's audio/video stream in the cloud.
    /// For more information, please see [On-Cloud Recording and Playback](https://www.tencentcloud.com/document/product/647/35426).
    /// Recommended value: it can contain up to 64 bytes. Letters (a–z and A–Z), digits (0–9), underscores, and hyphens are allowed.
    /// Scheme 1. Manual recording
    ///  1. Enable on-cloud recording in "Application Management" > "On-cloud Recording Configuration" in the [console](https://console.cloud.tencent.com/trtc).
    ///  2. Set "Recording Mode" to "Manual Recording".
    ///  3. After manual recording is set, in a TRTC room, only users with the `userDefineRecordId` parameter set will have video recording files in the cloud, while users without this parameter set will not.
    ///  4. The recording file will be named in the format of "userDefineRecordId_start time_end time" in the cloud.
    /// Scheme 2. Auto-recording
    ///  1. You need to enable on-cloud recording in "Application Management" > "On-cloud Recording Configuration" in the [console](https://console.cloud.tencent.com/trtc).
    ///  2. Set "Recording Mode" to "Auto-recording".
    ///  3. After auto-recording is set, any user who upstreams audio/video in a TRTC room will have a video recording file in the cloud.
    ///  4. The file will be named in the format of "userDefineRecordId_start time_end time". If `userDefineRecordId` is not specified, the file will be named in the format of "streamId_start time_end time".
    const char *userDefineRecordId;

    /// Field description: permission credential used for permission control, which is optional. If you want only users with the specified `userId` values to enter a room, you need to use `privateMapKey` to restrict the permission.
    /// Recommended value: we recommend you use this parameter only if you have high security requirements. For more information, please see [Enabling Advanced Permission Control](https://www.tencentcloud.com/document/product/647/35157).
    const char *privateMapKey;

    /// Field description: business data, which is optional. This field is needed only by some advanced features.
    /// Recommended value: do not set this field on your own.
    const char *businessInfo;

    TRTCParams() : sdkAppId(0), userId(nullptr), userSig(nullptr), roomId(0), strRoomId(nullptr), role(TRTCRoleAnchor), streamId(nullptr), userDefineRecordId(nullptr), privateMapKey(nullptr), businessInfo(nullptr) {
    }
};

/**
 * 5.2 Video encoding parameters
 *
 * These settings determine the quality of image viewed by remote users as well as the image quality of recorded video files in the cloud.
 */
struct TRTCVideoEncParam {
    /// Field description: video resolution
    /// Recommended value
    ///  - For mobile video call, we recommend you select a resolution of 360x640 or below and select `Portrait` (portrait resolution) for `resMode`.
    ///  - For mobile live streaming, we recommend you select a resolution of 540x960 and select `Portrait` (portrait resolution) for `resMode`.
    ///  - For desktop platforms (Windows and macOS), we recommend you select a resolution of 640x360 or above and select `Landscape` (landscape resolution) for `resMode`.
    ///@note to use a portrait resolution, please specify `resMode` as `Portrait`; for example, when used together with `Portrait`, 640x360 represents 360x640.
    TRTCVideoResolution videoResolution;

    /// Field description: resolution mode (landscape/portrait)
    /// Recommended value: for mobile platforms (iOS and Android), `Portrait` is recommended; for desktop platforms (Windows and macOS), `Landscape` is recommended.
    ///@note to use a portrait resolution, please specify `resMode` as `Portrait`; for example, when used together with `Portrait`, 640x360 represents 360x640.
    TRTCVideoResolutionMode resMode;

    /// Field description: video capturing frame rate
    /// Recommended value: 15 or 20 fps. If the frame rate is lower than 5 fps, there will be obvious lagging; if lower than 10 fps but higher than 5 fps, there will be slight lagging; if higher than 20 fps, the bandwidth will be wasted (the frame
    /// rate of movies is generally 24 fps).
    ///@note the front cameras on certain Android phones do not support a capturing frame rate higher than 15 fps. For some Android phones that focus on beautification features, the capturing frame rate of the front cameras may be lower than 10 fps.
    uint32_t videoFps;

    /// Field description: target video bitrate. The SDK encodes streams at the target video bitrate and will actively reduce the bitrate only in weak network environments.
    /// Recommended value: please see the optimal bitrate for each specification in `TRTCVideoResolution`. You can also slightly increase the optimal bitrate.
    ///            For example, `TRTCVideoResolution_1280_720` corresponds to the target bitrate of 1,200 Kbps. You can also set the bitrate to 1,500 Kbps for higher definition.
    ///@note you can set the `videoBitrate` and `minVideoBitrate` parameters at the same time to restrict the SDK's adjustment range of the video bitrate:
    ///  - If you want to "ensure clarity while allowing lag in weak network environments", you can set `minVideoBitrate` to 60% of `videoBitrate`.
    ///  - If you want to "ensure smoothness while allowing blur in weak network environments", you can set `minVideoBitrate` to a low value, for example, 100 Kbps.
    ///  - If you set `videoBitrate` and `minVideoBitrate` to the same value, it is equivalent to disabling the adaptive adjustment capability of the SDK for the video bitrate.
    uint32_t videoBitrate;

    /// Field description: minimum video bitrate. The SDK will reduce the bitrate to as low as the value specified by `minVideoBitrate` to ensure the smoothness only if the network conditions are poor.
    /// Note: default value: 0, indicating that a reasonable value of the lowest bitrate will be automatically calculated by the SDK according to the resolution you specify.
    /// Recommended value: you can set the `videoBitrate` and `minVideoBitrate` parameters at the same time to restrict the SDK's adjustment range of the video bitrate:
    ///  - If you want to "ensure clarity while allowing lag in weak network environments", you can set `minVideoBitrate` to 60% of `videoBitrate`.
    ///  - If you want to "ensure smoothness while allowing blur in weak network environments", you can set `minVideoBitrate` to a low value, for example, 100 Kbps.
    ///  - If you set `videoBitrate` and `minVideoBitrate` to the same value, it is equivalent to disabling the adaptive adjustment capability of the SDK for the video bitrate.
    uint32_t minVideoBitrate;

    /// Field description: whether to allow dynamic resolution adjustment. Once enabled, this field will affect on-cloud recording.
    /// Recommended value: this feature is suitable for scenarios that don't require on-cloud recording. After it is enabled, the SDK will intelligently select a suitable resolution according to the current network conditions to avoid the inefficient
    /// encoding mode of "large resolution + small bitrate".
    ///@note default value: false. If you need on-cloud recording, please do not enable this feature, because if the video resolution changes, the MP4 file recorded in the cloud cannot be played back normally by common players.
    bool enableAdjustRes;

    TRTCVideoEncParam() : videoResolution(TRTCVideoResolution_640_360), resMode(TRTCVideoResolutionModeLandscape), videoFps(15), videoBitrate(550), minVideoBitrate(0), enableAdjustRes(false) {
    }
};

/**
 * 5.3 Network QoS control parameter set
 *
 * Network QoS control parameter. The settings determine the QoS control policy of the SDK in weak network conditions (e.g., whether to "ensure clarity" or "ensure smoothness").
 */
struct TRTCNetworkQosParam {
    /// Field description: whether to ensure smoothness or clarity
    /// Recommended value: ensuring clarity
    ///@note this parameter mainly affects the audio/video performance of TRTC in weak network environments:
    ///  - Ensuring smoothness: in this mode, when the current network is unable to transfer a clear and smooth video image, the smoothness of the image will be given priority, but there will be blurs. See {@link TRTCVideoQosPreferenceSmooth}
    ///  - Ensuring clarity (default value): in this mode, when the current network is unable to transfer a clear and smooth video image, the clarity of the image will be given priority, but there will be lags. See {@link TRTCVideoQosPreferenceClear}
    TRTCVideoQosPreference preference;

    /// Field description: QoS control mode (disused)
    /// Recommended value: on-cloud control
    ///@note please set the on-cloud control mode (TRTCQosControlModeServer).
    TRTCQosControlMode controlMode;

    TRTCNetworkQosParam() : preference(TRTCVideoQosPreferenceClear), controlMode(TRTCQosControlModeServer) {
    }
};

/**
 * 5.4 Rendering parameters of video image
 *
 * You can use these parameters to control the video image rotation angle, fill mode, and mirror mode.
 */
struct TRTCRenderParams {
    /// Field description: clockwise image rotation angle
    /// Recommended value: rotation angles of 90, 180, and 270 degrees are supported. Default value: {@link TRTCVideoRotation_0}
    TRTCVideoRotation rotation;

    /// Field description: image fill mode
    /// Recommended value: fill (the image may be stretched or cropped) or fit (there may be black bars in unmatched areas). Default value: {@link TRTCVideoFillMode_Fill}
    TRTCVideoFillMode fillMode;

    /// Field description: image mirror mode
    /// Recommended value: default value: {@link TRTCVideoMirrorType_Auto}
    TRTCVideoMirrorType mirrorType;

    TRTCRenderParams() : rotation(TRTCVideoRotation0), fillMode(TRTCVideoFillMode_Fit), mirrorType(TRTCVideoMirrorType_Disable) {
    }
};

/**
 * 5.5 Network quality
 *
 * This indicates the quality of the network. You can use it to display the network quality of each user on the UI.
 */
struct TRTCQualityInfo {
    /// User ID
    const char *userId;

    /// Network quality
    TRTCQuality quality;

    TRTCQualityInfo() : userId(nullptr), quality(TRTCQuality_Unknown) {
    }
};

/**
 * 5.6 Volume
 *
 * This indicates the audio volume value. You can use it to display the volume of each user in the UI.
 */
struct TRTCVolumeInfo {
    ///`userId` of the speaker. An empty value indicates the local user.
    const char *userId;

    /// Volume of the speaker. Value range: 0–100.
    uint32_t volume;

    /// Vad result of the local user. 0: not speech 1: speech.
    int32_t vad;

    /// The local user's vocal frequency (unit: Hz), the value range is [0 - 4000]. For remote users, this value is always 0.
    float pitch;

    /// Audio spectrum data, which divides the sound frequency into 256 frequency domains, spectrumData records the energy value of each frequency domain,
    /// The value range of each energy value is [-300, 0] in dBFS.
    ///@note The local spectrum is calculated using the audio data before encoding, which will be affected by the capture volume, BGM, etc.; the remote spectrum is calculated using the received audio data, and operations such as adjusting the remote
    /// playback volume locally will not affect it.
    const float *spectrumData;

    /// The length of recorded audio spectrum data, which is 256.
    uint32_t spectrumDataLength;

    TRTCVolumeInfo() : userId(nullptr), volume(0), vad(0), pitch(0), spectrumData(nullptr), spectrumDataLength(0) {
    }
};

/**
 * 5.7 Network speed testing parameters
 *
 * You can test the network speed through the {@link startSpeedTest:} interface before the user enters the room (this API cannot be called during a call).
 */
struct TRTCSpeedTestParams {
    /// Application identification, please refer to the relevant instructions in {@link TRTCParams}.
    int sdkAppId;

    /// User identification, please refer to the relevant instructions in {@link TRTCParams}.
    const char *userId;

    /// User signature, please refer to the relevant instructions in {@link TRTCParams}.
    const char *userSig;

    /// Expected upstream bandwidth (kbps, value range: 10 to 5000, no uplink bandwidth test when it is 0).
    ///@note When the parameter `scene` is set to `TRTCSpeedTestScene_OnlineChorusTesting`, in order to obtain more accurate information such as rtt / jitter, the value range is limited to 10 ~ 1000.
    int expectedUpBandwidth;

    /// Expected downstream bandwidth (kbps, value range: 10 to 5000, no downlink bandwidth test when it is 0).
    ///@note When the parameter `scene` is set to `TRTCSpeedTestScene_OnlineChorusTesting`, in order to obtain more accurate information such as rtt / jitter, the value range is limited to 10 ~ 1000.
    int expectedDownBandwidth;

    /// Speed test scene.
    TRTCSpeedTestScene scene;

    TRTCSpeedTestParams() : sdkAppId(0), userId(nullptr), userSig(nullptr), expectedUpBandwidth(0), expectedDownBandwidth(0), scene(TRTCSpeedTestScene::TRTCSpeedTestScene_DelayAndBandwidthTesting) {
    }
};

/**
 * 5.8 Network speed test result
 *
 * The {@link startSpeedTest:} API can be used to test the network speed before a user enters a room (this API cannot be called during a call).
 */
struct TRTCSpeedTestResult {
    /// Whether the network speed test is successful.
    bool success;

    /// Error message for network speed test.
    const char *errMsg;

    /// Server IP address.
    const char *ip;

    /// Network quality, which is tested and calculated based on the internal evaluation algorithm. For more information, please see {@link TRTCQuality}
    TRTCQuality quality;

    /// Upstream packet loss rate between 0 and 1.0. For example, 0.3 indicates that 3 data packets may be lost in every 10 packets sent to the server.
    float upLostRate;

    /// Downstream packet loss rate between 0 and 1.0. For example, 0.2 indicates that 2 data packets may be lost in every 10 packets received from the server.
    float downLostRate;

    /// Delay in milliseconds, which is the round-trip time between the current device and TRTC server. The smaller the value, the better. The normal value range is 10–100 ms.
    int rtt;

    /// Upstream bandwidth (in kbps, -1: invalid value).
    int availableUpBandwidth;

    /// Downstream bandwidth (in kbps, -1: invalid value).
    int availableDownBandwidth;

    /// Uplink data packet jitter (ms) refers to the stability of data communication in the user's current network environment. The smaller the value, the better. The normal value range is 0ms - 100ms. -1 means that the speed test failed to obtain an
    /// effective value. Generally, the Jitter of the WiFi network will be slightly larger than that of the 4G/5G environment.
    int upJitter;

    /// Downlink data packet jitter (ms) refers to the stability of data communication in the user's current network environment. The smaller the value, the better. The normal value range is 0ms - 100ms. -1 means that the speed test failed to obtain
    /// an effective value. Generally, the Jitter of the WiFi network will be slightly larger than that of the 4G/5G environment.
    int downJitter;

    TRTCSpeedTestResult() : success(false), errMsg(nullptr), ip(nullptr), quality(TRTCQuality_Unknown), upLostRate(0.0f), downLostRate(0.0f), rtt(0), availableUpBandwidth(0), availableDownBandwidth(0), upJitter(0), downJitter(0) {
    }
};

/**
 * 5.9 Video texture data
 */
struct TRTCTexture {
    /// Field description: video texture ID
    int glTextureId;

    /// Field description: The OpenGL context to which the texture corresponds, for Windows and Android.
    void *glContext;

    /// Field description: The D3D11 texture, which is the pointer of ID3D11Texture2D, only for Windows.
    void *d3d11TextureId;

    TRTCTexture() : glTextureId(0), glContext(nullptr), d3d11TextureId(nullptr) {
    }
};

/**
 * 5.10 Video frame information
 *
 * `TRTCVideoFrame` is used to describe the raw data of a frame of the video image, which is the image data before frame encoding or after frame decoding.
 */
struct TRTCVideoFrame {
    /// Field description: video pixel format
    TRTCVideoPixelFormat videoFormat;

    /// Field description: video data structure type
    TRTCVideoBufferType bufferType;

    /// Field description: video data when `bufferType` is {@link TRTCVideoBufferType_Texture}, which carries the texture data used for OpenGL rendering.
    TRTCTexture *texture;

    /// Field description: video data when `bufferType` is {@link TRTCVideoBufferType_Buffer}, which carries the memory data blocks for the C++ layer.
    char *data;

    /// Field description: video data length in bytes. For I420, length = width * height * 3 / 2; for BGRA32, length = width * height * 4.
    uint32_t length;

    /// Field description: video width
    /// Recommended value: please enter the width of the video data passed in.
    uint32_t width;

    /// Field description: video height
    /// Recommended value: please enter the height of the video data passed in.
    uint32_t height;

    /// Field description: video frame timestamp in milliseconds
    /// Recommended value: this parameter can be set to 0 for custom video capturing. In this case, the SDK will automatically set the `timestamp` field. However, please "evenly" set the calling interval of `sendCustomVideoData`.
    uint64_t timestamp;

    /// Field description: clockwise rotation angle of video pixels
    TRTCVideoRotation rotation;

    TRTCVideoFrame() : videoFormat(TRTCVideoPixelFormat_Unknown), bufferType(TRTCVideoBufferType_Unknown), texture(nullptr), data(nullptr), length(0), width(640), height(360), timestamp(0), rotation(TRTCVideoRotation0) {
    }
};

/**
 * 5.11 Audio frame data
 */
struct TRTCAudioFrame {
    /// Field description: audio frame format
    TRTCAudioFrameFormat audioFormat;

    /// Field description: audio data
    char *data;

    /// Field description: audio data length
    uint32_t length;

    /// Field description: sample rate
    uint32_t sampleRate;

    /// Field description: number of sound channels
    uint32_t channel;

    /// Field description: timestamp in ms
    uint64_t timestamp;

    /// Field description: extra data in audio frame, message sent by remote users through `onLocalProcessedAudioFrame` that add to audio frame will be callback through this field.
    char *extraData;

    /// Field description: extra data length
    uint32_t extraDataLength;

    TRTCAudioFrame() : audioFormat(TRTCAudioFrameFormatNone), data(nullptr), length(0), sampleRate(48000), channel(1), timestamp(0), extraData(nullptr), extraDataLength(0) {
    }
};

/**
 * 5.12 Description information of each video image in On-Cloud MixTranscoding
 *
 * `TRTCMixUser` is used to specify the location, size, layer, and stream type of each video image in On-Cloud MixTranscoding.
 */
struct TRTCMixUser {
    /// Field description: user ID
    const char *userId;

    /// Field description: ID of the room where this audio/video stream is located (an empty value indicates the local room ID)
    const char *roomId;

    /// Field description: specify the coordinate area of this video image in px
    RECT rect;

    /// Field description: specify the level of this video image (value range: 1–15; the value must be unique)
    int zOrder;

    /// Field description: specify whether this video image is the primary stream image ({@link TRTCVideoStreamTypeBig}) or substream image ({@link TRTCVideoStreamTypeSub}).
    TRTCVideoStreamType streamType;

    /// Field description: specify whether this stream mixes audio only
    /// Recommended value: default value: false
    ///@note this field has been disused. We recommend you use the new field `inputType` introduced in v8.5.
    bool pureAudio;

    /// Field description: specify the mixed content of this stream (audio only, video only, audio and video, or watermark).
    /// Recommended value: default value: TRTCMixInputTypeUndefined.
    ///@note
    ///- When specifying `inputType` as TRTCMixInputTypeUndefined and specifying `pureAudio` to YES, it is equivalent to setting `inputType` to `TRTCMixInputTypePureAudio`.
    ///- When specifying `inputType` as TRTCMixInputTypeUndefined and specifying `pureAudio` to NO, it is equivalent to setting `inputType` to `TRTCMixInputTypeAudioVideo`.
    ///- When specifying `inputType` as TRTCMixInputTypeWatermark, you don't need to specify the `userId` field, but you need to specify the `image` field.
    TRTCMixInputType inputType;

    /// Field description: specify the display mode of this stream.
    /// Recommended value: default value: 0. 0 is cropping, 1 is zooming, 2 is zooming and displaying black background.
    ///@note image doesn't support setting `renderMode` temporarily, the default display mode is forced stretch.
    uint32_t renderMode;

    /// Field description: specify the target volumn level of On-Cloud MixTranscoding. (value range: 0-100)
    /// Recommended value: default value: 100.
    uint32_t soundLevel;

    /// Field description: specify the placeholder or watermark image. The placeholder image will be displayed when there is no upstream video.A watermark image is a semi-transparent image posted in the mixed image, and this image will always be
    /// overlaid on the mixed image.
    ///- When the `inputType` field is set to TRTCMixInputTypePureAudio, the image is a placeholder image, and you need to specify `userId`.
    ///- When the `inputType` field is set to TRTCMixInputTypeWatermark, the image is a watermark image, and you don't need to specify `userId`.
    /// Recommended value: default value: null, indicating not to set the placeholder or watermark image.
    ///@note TRTC's backend service will mix the image specified by the URL address into the final stream.URL link length is limited to 512 bytes. The image size is limited to 10MB.Support png, jpg, jpeg, bmp format. Take effects iff the `inputType`
    /// field is set to TRTCMixInputTypePureAudio or TRTCMixInputTypeWatermark.
    const char *image;

    TRTCMixUser() : userId(nullptr), roomId(nullptr), rect(), zOrder(0), streamType(TRTCVideoStreamTypeBig), pureAudio(false), inputType(TRTCMixInputTypeUndefined), renderMode(0), soundLevel(100), image(nullptr) {
        rect.left = 0;
        rect.top = 0;
        rect.right = 0;
        rect.bottom = 0;
    }
};

/**
 * 5.13 Layout and transcoding parameters of On-Cloud MixTranscoding
 *
 * These parameters are used to specify the layout position information of each video image and the encoding parameters of mixtranscoding during On-Cloud MixTranscoding.
 */
struct TRTCTranscodingConfig {
    /// Field description: layout mode
    /// Recommended value: please choose a value according to your business needs. The preset mode has better applicability.
    TRTCTranscodingConfigMode mode;

    /// Field description: `appId` of Tencent Cloud CSS
    /// Recommended value: please click `Application Management` > `Application Information` in the [TRTC console](https://console.cloud.tencent.com/trtc) and get the `appId` in `Relayed Live Streaming Info`.
    uint32_t appId;

    /// Field description: `bizId` of Tencent Cloud CSS
    /// Recommended value: please click `Application Management` > `Application Information` in the [TRTC console](https://console.cloud.tencent.com/trtc) and get the `bizId` in `Relayed Live Streaming Info`.
    uint32_t bizId;

    /// Field description: specify the target resolution (width) of On-Cloud MixTranscoding
    /// Recommended value: 360 px. If you only mix audio streams, please set both `width` and `height` to 0; otherwise, there will be a black background in the live stream after mixtranscoding.
    uint32_t videoWidth;

    /// Field description: specify the target resolution (height) of On-Cloud MixTranscoding
    /// Recommended value: 640 px. If you only mix audio streams, please set both `width` and `height` to 0; otherwise, there will be a black background in the live stream after mixtranscoding.
    uint32_t videoHeight;

    /// Field description: specify the target video bitrate (Kbps) of On-Cloud MixTranscoding
    /// Recommended value: if you enter 0, TRTC will estimate a reasonable bitrate value based on `videoWidth` and `videoHeight`. You can also refer to the recommended bitrate value in the video resolution enumeration definition (in the comment
    /// section).
    uint32_t videoBitrate;

    /// Field description: specify the target video frame rate (fps) of On-Cloud MixTranscoding
    /// Recommended value: default value: 15 fps. Value range: (0,30].
    uint32_t videoFramerate;

    /// Field description: specify the target video keyframe interval (GOP) of On-Cloud MixTranscoding
    /// Recommended value: default value: 2 (in seconds). Value range: [1,8].
    uint32_t videoGOP;

    /// Field description: specify the background color of the mixed video image.
    /// Recommended value: default value: 0x000000, which means black and is in the format of hex number; for example: "0x61B9F1" represents the RGB color (97,158,241).
    uint32_t backgroundColor;

    /// Field description: specify the background image of the mixed video image.
    ///**Recommended value: default value: null, indicating not to set the background image.
    ///@note TRTC's backend service will mix the image specified by the URL address into the final stream.URL link length is limited to 512 bytes. The image size is limited to 10MB.Support png, jpg, jpeg, bmp format.
    const char *backgroundImage;

    /// Field description: specify the target audio sample rate of On-Cloud MixTranscoding
    /// Recommended value: default value: 48000 Hz. Valid values: 12000 Hz, 16000 Hz, 22050 Hz, 24000 Hz, 32000 Hz, 44100 Hz, 48000 Hz.
    uint32_t audioSampleRate;

    /// Field description: specify the target audio bitrate of On-Cloud MixTranscoding
    /// Recommended value: default value: 64 Kbps. Value range: [32,192].
    uint32_t audioBitrate;

    /// Field description: specify the number of sound channels of On-Cloud MixTranscoding
    /// Recommended value: default value: 1, which means mono channel. Valid values: 1: mono channel; 2: dual channel.
    uint32_t audioChannels;

    /// Field description: specify the audio encoding type of On-Cloud MixTranscoding
    /// Recommended value: default value: 0, which means LC-AAC. Valid values: 0:  LC-AAC; 1: HE-AAC; 2: HE-AACv2.
    ///@note
    ///- HE-AAC and HE-AACv2 only support [48000, 44100, 32000, 24000, 16000]  sample rate.
    ///- HE-AACv2  only support dual channel.
    ///- HE-AAC and HE-AACv2 take effects iff the output streamId is specified.
    uint32_t audioCodec;

    /// Field description: specify the position, size, layer, and stream type of each video image in On-Cloud MixTranscoding
    /// Recommended value: this field is an array in `TRTCMixUser` type, where each element represents the information of a video image.
    TRTCMixUser *mixUsersArray;

    /// Field description: number of elements in the `mixUsersArray` array
    uint32_t mixUsersArraySize;

    /// Field description: ID of the live stream output to CDN
    /// Recommended value: default value: null, that is, the audio/video streams in the room will be mixed into the audio/video stream of the caller of this API.
    ///     - If you don't set this parameter, the SDK will execute the default logic, that is, it will mix the multiple audio/video streams in the room into the audio/video stream of the caller of this API, i.e., A + B => A.
    ///     - If you set this parameter, the SDK will mix the audio/video streams in the room into the live stream you specify, i.e., A + B => C (C is the `streamId` you specify).
    const char *streamId;

    /// Field description: SEI parameters. default value: null
    ///@note the parameter is passed in the form of a JSON string. Here is an example to use it:
    ///```json
    ///{
    ///   "payLoadContent":"xxx",
    ///   "payloadType":5,
    ///   "payloadUuid":"1234567890abcdef1234567890abcdef",
    ///   "interval":1000,
    ///   "followIdr":false
    /// }
    ///```
    /// The currently supported fields and their meanings are as follows:
    ///- payloadContent: Required. The payload content of the passthrough SEI, which cannot be empty.
    ///- payloadType: Required. The type of the SEI message, with a value range of 5 or an integer within the range of [100, 254] (excluding 244, which is an internally defined timestamp SEI).
    ///- payloadUuid: Required when payloadType is 5, and ignored in other cases. The value must be a 32-digit hexadecimal number.
    ///- interval: Optional, default is 1000. The sending interval of the SEI, in milliseconds.
    ///- followIdr: Optional, default is false. When this value is true, the SEI will be ensured to be carried when sending a key frame, otherwise it is not guaranteed.
    const char *videoSeiParams;

    TRTCTranscodingConfig()
        : mode(TRTCTranscodingConfigMode_Unknown),
          appId(0),
          bizId(0),
          videoWidth(0),
          videoHeight(0),
          videoBitrate(0),
          videoFramerate(15),
          videoGOP(2),
          backgroundColor(0),
          backgroundImage(nullptr),
          audioSampleRate(48000),
          audioBitrate(64),
          audioChannels(1),
          audioCodec(0),
          mixUsersArray(nullptr),
          mixUsersArraySize(0),
          streamId(nullptr),
          videoSeiParams(nullptr) {
    }
};

/**
 * 5.14 Push parameters required to be set when publishing audio/video streams to non-Tencent Cloud CDN
 *
 * TRTC's backend service supports publishing audio/video streams to third-party live CDN service providers through the standard RTMP protocol.
 * If you use the Tencent Cloud CSS CDN service, you don't need to care about this parameter; instead, just use the {@link startPublish} API.
 */
struct TRTCPublishCDNParam {
    /// Field description: `appId` of Tencent Cloud CSS
    /// Recommended value: please click `Application Management` > `Application Information` in the [TRTC console](https://console.cloud.tencent.com/trtc) and get the `appId` in `Relayed Live Streaming Info`.
    uint32_t appId;

    /// Field description: `bizId` of Tencent Cloud CSS
    /// Recommended value: please click `Application Management` > `Application Information` in the [TRTC console](https://console.cloud.tencent.com/trtc) and get the `bizId` in `Relayed Live Streaming Info`.
    uint32_t bizId;

    /// Field description: specify the push address (in RTMP format) of this audio/video stream at the third-party live streaming service provider
    /// Recommended value: the push URL rules vary greatly by service provider. Please enter a valid push URL according to the requirements of the target service provider. TRTC's backend server will push audio/video streams in the standard format to
    /// the third-party service provider according to the URL you enter.
    ///@note the push URL must be in RTMP format and meet the specifications of your target live streaming service provider; otherwise, the target service provider will reject the push requests from TRTC's backend service.
    const char *url;

    /// Field description: specify the push address (in RTMP format) of this audio/video stream at the third-party live streaming service provider
    /// Recommended value: default value: null,that is, the audio/video streams in the room will be pushed to the target service provider of the caller of this API.
    const char *streamId;

    TRTCPublishCDNParam() : appId(0), bizId(0), url(nullptr), streamId(nullptr) {
    }
};

/**
 * 5.15 Local audio file recording parameters
 *
 * This parameter is used to specify the recording parameters in the audio recording API {@link startAudioRecording}.
 */
struct TRTCAudioRecordingParams {
    /// Field description: storage path of the audio recording file, which is required.
    ///@note this path must be accurate to the file name and extension. The extension determines the format of the audio recording file. Currently, supported formats include PCM, WAV, and AAC.
    /// For example, if you specify the path as `mypath/record/audio.aac`, it means that you want the SDK to generate an audio recording file in AAC format.Please specify a valid path with read/write permissions; otherwise, the audio recording file
    /// cannot be generated.
    const char *filePath;

    /// Field description: Audio recording content type.
    /// Note: Record all local and remote audio by default.
    TRTCAudioRecordingContent recordingContent;

    /// Field description: `maxDurationPerFile` is the max duration of each recorded file segments, in milliseconds, with a minimum value of 10000. The default value is 0, indicating no segmentation.
    int maxDurationPerFile = 0;

    TRTCAudioRecordingParams() : filePath(nullptr), recordingContent(TRTCAudioRecordingContentAll), maxDurationPerFile(0) {
    }
};

/**
 * 5.16 Local media file recording parameters
 *
 * This parameter is used to specify the recording parameters in the local media file recording API {@link startLocalRecording}.
 * The `startLocalRecording` API is an enhanced version of the `startAudioRecording` API. The former can record video files, while the latter can only record audio files.
 */
struct TRTCLocalRecordingParams {
    /// Field description: address of the recording file, which is required. Please ensure that the path is valid with read/write permissions; otherwise, the recording file cannot be generated.
    ///@note this path must be accurate to the file name and extension. The extension determines the format of the recording file. Currently, only the MP4 format is supported.
    ///            For example, if you specify the path as `mypath/record/test.mp4`, it means that you want the SDK to generate a local video file in MP4 format.
    ///            Please specify a valid path with read/write permissions; otherwise, the recording file cannot be generated.
    const char *filePath = "";

    /// Field description: media recording type, which is `TRTCRecordTypeBoth` by default, indicating to record both audio and video.
    TRTCLocalRecordType recordType = TRTCLocalRecordType_Both;

    /// Field description: `interval` is the update frequency of the recording information in milliseconds. Value range: 1000–10000. Default value: -1, indicating not to call back
    int interval = -1;

    /// Field description: `maxDurationPerFile` is the max duration of each recorded file segments, in milliseconds, with a minimum value of 10000. The default value is 0, indicating no segmentation.
    int maxDurationPerFile = 0;
};

/**
 * 5.17 Sound effect parameter (disused)
 *
 * "Sound effects" in TRTC refer to some short audio files (usually only a few seconds), such as "applause" and "laughter".
 * This parameter is used to specify the path and number of playback times of a sound effect file (short audio file) in the sound effect playback API {@link TRTCCloud#playAudioEffect} on legacy versions.
 * After v7.3, the sound effect API has been replaced by a new {@link TXAudioEffectManager#startPlayMusic} API.
 * When you specify the {@link TXAudioMusicParam} parameter of `startPlayMusic`, if `isShortFile` is set to `true`, the file is a "sound effect" file.
 */
struct TRTCAudioEffectParam {
    /// Field description: sound effect ID
    /// Note: the SDK supports playing multiple sound effects. IDs are used to distinguish different sound effects and control their start, end, volume, etc.
    int effectId;

    /// Field description: sound effect file path. Supported file formats include AAC, MP3, and M4A.
    const char *path;

    /// Field description: number of times the sound effect is looped
    /// Valid values: 0 or any positive integer. 0 (default) indicates that the sound effect is played once, 1 twice, and so on.
    int loopCount;

    /// Field description: whether the sound effect is upstreamed
    /// Recommended value: true: when the sound effect is played back locally, it will be upstreamed to the cloud and can be heard by remote users. false: the sound effect will not be upstreamed to the cloud and can only be heard locally. Default
    /// value: false
    bool publish;

    /// Field description: sound effect volume
    /// Recommended value: value range: 0–100. Default value: 100
    int volume;

    TRTCAudioEffectParam(const int _effectId, const char *_path) : loopCount(0), publish(false), volume(100) {
        effectId = _effectId;
        path = _path;
    }
};

/**
 * 5.18 Room switch parameter
 *
 * This parameter is used for the room switch API {@link switchRoom}, which can quickly switch a user from one room to another.
 */
struct TRTCSwitchRoomConfig {
    /// Field description: numeric room ID, which is optional. Users in the same room can see one another and make audio/video calls.
    /// Recommended value: value range: 1–4294967294.
    ///@note either `roomId` or `strRoomId` must be entered. If both are entered, `roomId` will be used.
    uint32_t roomId;

    /// Field description: string-type room ID, which is optional. Users in the same room can see one another and make audio/video calls.
    ///@note either `roomId` or `strRoomId` must be entered. If both are entered, `roomId` will be used.
    const char *strRoomId;

    /// Field description: user signature, which is optional. It is the authentication signature corresponding to the current `userId` and acts as the login password.
    ///            If you don't specify the newly calculated `userSig` during room switch, the SDK will continue to use the `userSig` you specified during room entry (enterRoom).
    ///            This requires you to ensure that the old `userSig` is still within the validity period allowed by the signature at the moment of room switch; otherwise, room switch will fail.
    /// Recommended value: for the calculation method, please see [UserSig](https://www.tencentcloud.com/document/product/647/35166).
    const char *userSig;

    /// Field description: permission credential used for permission control, which is optional. If you want only users with the specified `userId` values to enter a room, you need to use `privateMapKey` to restrict the permission.
    /// Recommended value: we recommend you use this parameter only if you have high security requirements. For more information, please see [Enabling Advanced Permission Control](https://www.tencentcloud.com/document/product/647/35157).
    const char *privateMapKey;

    TRTCSwitchRoomConfig() : roomId(0), strRoomId(nullptr), userSig(nullptr), privateMapKey(nullptr) {
    }
};

/**
 * 5.19 Format parameter of custom audio callback
 *
 * This parameter is used to set the relevant format (including sample rate and number of channels) of the audio data called back by the SDK in the APIs related to custom audio callback.
 */
struct TRTCAudioFrameCallbackFormat {
    /// Field description: sample rate
    /// Recommended value: default value: 48000 Hz. Valid values: 16000, 32000, 44100, 48000.
    int sampleRate;

    /// Field description: number of sound channels
    /// Recommended value: default value: 1, which means mono channel. Valid values: 1: mono channel; 2: dual channel.
    int channel;

    /// Field description: number of sample points
    /// Recommended value: the value must be an integer multiple of sampleRate/100.
    int samplesPerCall;

    /// Field description: audio callback data operation mode
    /// Recommended value: TRTCAudioFrameOperationModeReadOnly, get audio data from callback only. The modes that can be set are TRTCAudioFrameOperationModeReadOnly, TRTCAudioFrameOperationModeReadWrite.
    TRTCAudioFrameOperationMode mode;

    TRTCAudioFrameCallbackFormat() : sampleRate(0), channel(0), samplesPerCall(0), mode(TRTCAudioFrameOperationModeReadWrite) {
    }
};

/**
 * 5.20 Structure for storing window thumbnails and icons.
 */
struct TRTCImageBuffer {
    /// image content in BGRA format
    const char *buffer;

    /// buffer size
    uint32_t length;

    /// image width
    uint32_t width;

    /// image height
    uint32_t height;

    TRTCImageBuffer() : buffer(nullptr), length(0), width(0), height(0) {
    }
};

/**
 * 5.21 Screen sharing target information (for desktop systems only)
 *
 * When users share the screen, they can choose to share the entire desktop or only the window of a certain program.
 * `TRTCScreenCaptureSourceInfo` is used to describe the information of the target to be shared, including ID, name, and thumbnail. The fields in this structure are read-only.
 */
struct TRTCScreenCaptureSourceInfo {
    /// Field description: capturing source type (i.e., whether to share the entire screen or a certain window)
    TRTCScreenCaptureSourceType type;

    /// Field description: capturing source ID. For a window, this field indicates a window ID; for a screen, this field indicates a display ID.
    TXView sourceId;

    /// Field description: capturing source name (encoded in UTF-8)
    const char *sourceName;

    /// Field description: thumbnail of the shared window
    TRTCImageBuffer thumbBGRA;

    /// Field description: icon of the shared window
    TRTCImageBuffer iconBGRA;

    /// Field description: is minimized window or not
    bool isMinimizeWindow;

    /// Field description: Whether it is the main display (applicable to the case of multiple displays)
    bool isMainScreen;

    /// Field description: The x (in pixels) of the shared window/screen
    int32_t x;

    /// Field description: The y (in pixels) of the shared window/screen
    int32_t y;

    /// Field description: The width (in pixels) of the shared window/screen
    uint32_t width;

    /// Field description: The height (in pixels) of the shared window/screen
    uint32_t height;

    TRTCScreenCaptureSourceInfo() : type(TRTCScreenCaptureSourceTypeUnknown), sourceId(nullptr), sourceName(nullptr), isMinimizeWindow(false), isMainScreen(false), x(0), y(0), width(0), height(0) {
    }
};
class ITRTCScreenCaptureSourceList {
   protected:
    virtual ~ITRTCScreenCaptureSourceList() {
    }

   public:
    virtual uint32_t getCount() = 0;
    virtual TRTCScreenCaptureSourceInfo getSourceInfo(uint32_t index) = 0;
    virtual void release() = 0;
};

/**
 * 5.23 Advanced control parameter of screen sharing
 *
 * This parameter is used in the screen sharing-related API {@link selectScreenCaptureTarget} to set a series of advanced control parameters when specifying the sharing target.
 * For example, whether to capture the cursor, whether to capture the subwindow, and whether to draw a frame around the shared target.
 */
struct TRTCScreenCaptureProperty {
    /// Field description: whether to capture the cursor while capturing the target content. Default value: true.
    bool enableCaptureMouse;

    /// Field description: whether to highlight the window being shared (i.e., drawing a frame around the shared target). Default value: true.
    bool enableHighLight;

    /// Field description: whether to enable the high performance mode (which will take effect only during screen sharing). Default value: true.
    ///@note the screen capturing performance is the best after this mode is enabled, but the anti-blocking ability will be lost. If you enable `enableHighLight` and `enableHighPerformance` at the same time, remote users will see the highlighted
    /// frame.
    bool enableHighPerformance;

    /// Field description: specify the color of the highlighted frame in RGB format. 0 indicates to use the default color of #FFE640.
    int highLightColor;

    /// Field description: specify the width of the highlighted frame. 0 indicates to use the default width of 5 px. The maximum value you can set is 50.
    int highLightWidth;

    /// Field description: whether to capture the subwindow during window capturing (the subwindow and the captured window need to have an `Owner` or `Popup` attribute). Default value: false.
    bool enableCaptureChildWindow;

    TRTCScreenCaptureProperty() : enableCaptureMouse(true), enableHighLight(true), enableHighPerformance(true), highLightColor(0), highLightWidth(0), enableCaptureChildWindow(false) {
    }
};
typedef ITXDeviceCollection ITRTCDeviceCollection;
typedef ITXDeviceInfo ITRTCDeviceInfo;

/**
 * 5.24 parameter of the parallel strategy of remote audio streams
 *
 * This parameter is used to set the parallel strategy of remote audio streams.
 */
struct TRTCAudioParallelParams {
    /// Field description: Max number of remote audio streams. Default value: 0
    ///- if maxCount > 0 and the number of people in the room is more than `maxCount`，SDK will select `maxCount` of remote audio streams in real time, which can reduce performance cost greatly.
    ///- if maxCount = 0，SDK won't limit the number of remote audio streams, which may cause performance cost when there are many speakers in one room.
    uint32_t maxCount;

    /// Field description: Users included that must be able to play.
    ///@note A list of user IDs. These users must be able to play and do not participate in smart selection.
    /// The number of `incluseUsers` must be less than `maxCount`. Otherwise, the setting of the parallel strategy of remote audio streams is invalid.
    ///`incluseUsers` is valid when `maxCount` > 0. When `incluseUsers` takes effect, the max number of remote audio streams is (`maxCount` - the number of valid users in `incluseUsers`).
    char **includeUsers;
    uint32_t includeUsersCount;

    TRTCAudioParallelParams() : maxCount(0), includeUsers(nullptr), includeUsersCount(0) {
    }
};

/**
 * 5.25 The users whose streams to publish
 *
 * You can use this parameter together with the publishing destination parameter {@link TRTCPublishTarget} and On-Cloud MixTranscoding parameter {@link TRTCStreamMixingConfig} to transcode the streams you specify and publish the mixed stream to the
 * destination you specify.
 */
struct TRTCUser {
    ////**Description**: UTF-8-encoded user ID (required)
    ///**Value:** For example, if the ID of a user in your account system is "mike", set it to `mike`.
    const char *userId;

    ///**Description:** Numeric room ID. The room ID must be of the same type as that in {@link TRTCParams}.
    ///**Value:** Value range: 1-4294967294
    ///**Note:** You cannot use both `intRoomId` and `strRoomId`. If you specify `strRoomId`, you need to set `intRoomId` to `0`. If you set both, only `intRoomId` will be used.
    uint32_t intRoomId;

    ///**Description:** String-type room ID. The room ID must be of the same type as that in {@link TRTCParams}.
    ///**Note:** You cannot use both `intRoomId` and `strRoomId`. If you specify `roomId`, you need to leave `strRoomId` empty. If you set both, only `intRoomId` will be used.
    ///**Value:** 64 bytes or shorter; supports the following character set (89 characters):
    /// - Uppercase and lowercase letters (a-z and A-Z)
    /// - Numbers (0-9)
    /// - Space, "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", "{", "}", "|", "~", ","
    const char *strRoomId;

    TRTCUser() : userId(nullptr), intRoomId(0), strRoomId(nullptr) {
    }
};

/**
 * 5.26 The destination URL when you publish to Tencent Cloud or a third-party CDN
 *
 * This enum type is used by the publishing destination parameter {@link TRTCPublishTarget} of the publishing API {@link startPublishMediaStream}.
 */
struct TRTCPublishCdnUrl {
    ///**Description:** The destination URL (RTMP) when you publish to Tencent Cloud or a third-party CDN.
    ///**Value:** The URLs of different CDN providers may vary greatly in format. Please enter a valid URL as required by your service provider. TRTC's backend server will push audio/video streams in the standard format to the URL you provide.
    ///**Note:** The URL must be in RTMP format. It must also meet the requirements of your service provider, or your service provider may reject push requests from the TRTC backend.
    const char *rtmpUrl;

    ///**Description:** Whether to publish to Tencent Cloud
    ///**Value:** The default value is `true`.
    ///**Note:** If the destination URL you set is provided by Tencent Cloud, set this parameter to `true`, and you will not be charged relaying fees.
    bool isInternalLine;

    TRTCPublishCdnUrl() : rtmpUrl(nullptr), isInternalLine(true) {
    }
};

/**
 * 5.27 The publishing destination
 *
 * This enum type is used by the publishing API {@link startPublishMediaStream}.
 */
struct TRTCPublishTarget {
    ///`Description:` The publishing mode.
    ///`Value:` You can relay streams to a CDN, transcode streams, or publish streams to an RTC room. Select the mode that fits your needs.
    ///@note If you need to use more than one publishing mode, you can call {@link startPublishMediaStream} multiple times and set `TRTCPublishTarget` to a different value each time.You can use one mode each time you call the {@link
    /// startPublishMediaStream}) API. To modify the configuration, call {@link updatePublishCDNStream}.
    TRTCPublishMode mode;

    ///`Description:` The destination URLs (RTMP) when you publish to Tencent Cloud or third-party CDNs.
    ///`Note:` You don’t need to set this parameter if you set the publishing mode to `TRTCPublishMixStreamToRoom`.
    TRTCPublishCdnUrl *cdnUrlList;

    ///`Description:` The length of the `cdnUrlList` array.
    ///`Note:` You don’t need to set this parameter if you set the publishing mode to `TRTCPublishMixStreamToRoom`.
    uint32_t cdnUrlListSize;

    ///`Description:` The information of the robot that publishes the transcoded stream to a TRTC room.
    ///`Note:` You need to set this parameter only if you set the publishing mode to `TRTCPublishMixStreamToRoom`.
    ///`Note:` After you set this parameter, the stream will be pushed to the room you specify. We recommend you set it to a special user ID to distinguish the robot from the anchor who enters the room via the TRTC SDK.
    ///`Note:` Users whose streams are transcoded cannot subscribe to the transcoded stream.
    ///`Note:` If you set the subscription mode (@link setDefaultStreamRecvMode}) to manual before room entry, you need to manage the streams to receive by yourself (normally, if you receive the transcoded stream, you need to unsubscribe from the
    /// streams that are transcoded). `Note:` If you set the subscription mode ({@link setDefaultStreamRecvMode}) to auto before room entry, users whose streams are not transcoded will receive the transcoded stream automatically and will unsubscribe
    /// from the users whose streams are transcoded. You call {@link muteRemoteVideoStream} and {@link muteRemoteAudio} to unsubscribe from the transcoded stream.
    TRTCUser *mixStreamIdentity;

    TRTCPublishTarget() : mode(TRTCPublishMode::TRTCPublishModeUnknown), cdnUrlList(nullptr), cdnUrlListSize(0), mixStreamIdentity(nullptr) {
    }
};

/**
 * 5.28 The video layout of the transcoded stream
 *
 * This enum type is used by the On-Cloud MixTranscoding parameter {@link TRTCStreamMixingConfig} of the publishing API {@link startPublishMediaStream}.
 * You can use this parameter to specify the position, size, layer, and stream type of each video in the transcoded stream.
 */
struct TRTCVideoLayout {
    ///`Description:` The coordinates (in pixels) of the video.
    RECT rect;

    ///`Description:` The layer of the video, which must be unique. Value range: 0-15.
    int zOrder;

    ///`Description:` The rendering mode.
    ///`Value:` The rendering mode may be fill (the image may be stretched or cropped) or fit (there may be black bars). Default value: {@link TRTCVideoFillMode_Fill}.
    TRTCVideoFillMode fillMode;

    ///`Description:` The background color of the mixed stream.
    ///`Value:` The value must be a hex number. For example, "0x61B9F1" represents the RGB color value (97,158,241). Default value: 0x000000 (black).
    uint32_t backgroundColor;

    ///`Description:` The URL of the placeholder image. If a user sends only audio, the image specified by the URL will be mixed during On-Cloud MixTranscoding.
    ///`Value:` This parameter is left empty by default, which means no placeholder image will be used.
    ///@note
    ///   - You need to specify the `userId` parameter in `fixedVideoUser`.
    ///   - The URL can be 512 bytes long at most, and the image must not exceed 2 MB.
    ///   - The image can be in PNG, JPG, JPEG, or BMP format. We recommend you use a semitransparent image in PNG format.
    const char *placeHolderImage;

    ///`Description:` The users whose streams are transcoded.
    ///@note If you do not specify {@link TRTCUser} (`userId`, `intRoomId`, `strRoomId`), the TRTC backend will automatically mix the streams of anchors who are sending audio/video in the room according to the video layout you specify.
    TRTCUser *fixedVideoUser;

    ///`Description:` Whether the video is the primary stream ({@link TRTCVideoStreamTypeBig}) or substream ({@linke TRTCVideoStreamTypeSub}).
    TRTCVideoStreamType fixedVideoStreamType;

    TRTCVideoLayout() : zOrder(0), fillMode(TRTCVideoFillMode_Fill), backgroundColor(0), placeHolderImage(nullptr), fixedVideoUser(nullptr), fixedVideoStreamType(TRTCVideoStreamTypeBig) {
    }
};

/**
 * 5.29 The watermark layout
 *
 * This enum type is used by the On-Cloud MixTranscoding parameter {@link TRTCStreamMixingConfig} of the publishing API {@link startPublishMediaStream}.
 */
struct TRTCWatermark {
    ///`Description:` The URL of the watermark image. The image specified by the URL will be mixed during On-Cloud MixTranscoding.
    ///@note
    ///   - The URL can be 512 bytes long at most, and the image must not exceed 2 MB.
    ///   - The image can be in PNG, JPG, JPEG, or BMP format. We recommend you use a semitransparent image in PNG format.
    const char *watermarkUrl;

    ///`Description:` The coordinates (in pixels) of the watermark.
    RECT rect;

    ///`Description:` The layer of the watermark, which must be unique. Value range: 0-15.
    int zOrder;

    TRTCWatermark() : watermarkUrl(nullptr), zOrder(0) {
    }
};

/**
 * 5.30 The encoding parameters
 *
 * `Description:` This enum type is used by the publishing API {@link startPublishMediaStream}.
 * `Note:` This parameter is required if you set the publishing mode to `TRTCPublish_MixStream_ToCdn` or `TRTCPublish_MixStream_ToRoom` in {@link TRTCPublishTarget}.
 * `Note:` If you use the relay to CDN feature (the publishing mode set to `RTCPublish_BigStream_ToCdn` or `TRTCPublish_SubStream_ToCdn`), to improve the relaying stability and playback compatibility, we also recommend you set this parameter.
 */
struct TRTCStreamEncoderParam {
    ///`Description:` The resolution (width) of the stream to publish.
    ///`Value:` Recommended value: 368. If you mix only audio streams, to avoid displaying a black video in the transcoded stream, set both `width` and `height` to `0`.
    uint32_t videoEncodedWidth;

    ///`Description:` The resolution (height) of the stream to publish.
    ///`Value:` Recommended value: 640. If you mix only audio streams, to avoid displaying a black video in the transcoded stream, set both `width` and `height` to `0`.
    uint32_t videoEncodedHeight;

    ///`Description:` The frame rate (fps) of the stream to publish.
    ///`Value:` Value range: (0,30]. Default: 20.
    uint32_t videoEncodedFPS;

    ///`Description:` The keyframe interval (GOP) of the stream to publish.
    ///`Value:` Value range: [1,5]. Default: 3 (seconds).
    uint32_t videoEncodedGOP;

    ///`Description:` The video bitrate (Kbps) of the stream to publish.
    ///`Value:` If you set this parameter to `0`, TRTC will work out a bitrate based on `videoWidth` and `videoHeight`. For details, refer to the recommended bitrates for the constants of the resolution enum type (see comment).
    uint32_t videoEncodedKbps;

    ///`Description:` The audio sample rate of the stream to publish.
    ///`Value:` Valid values: [48000, 44100, 32000, 24000, 16000, 8000]. Default: 48000 (Hz).
    uint32_t audioEncodedSampleRate;

    ///`Description:` The sound channels of the stream to publish.
    ///`Value:` Valid values: 1 (mono channel); 2 (dual-channel). Default: 1.
    uint32_t audioEncodedChannelNum;

    ///`Description:` The audio bitrate (Kbps) of the stream to publish.
    ///`Value:` Value range: [32,192]. Default: 50.
    uint32_t audioEncodedKbps;

    ///`Description:` The audio codec of the stream to publish.
    ///`Value:` Valid values: 0 (LC-AAC); 1 (HE-AAC); 2 (HE-AACv2). Default: 0.
    ///@note
    /// - The audio sample rates supported by HE-AAC and HE-AACv2 are 48000, 44100, 32000, 24000, and 16000.
    /// - When HE-AACv2 is used, the output stream can only be dual-channel.
    uint32_t audioEncodedCodecType;

    ///`Description:` The video codec of the stream to publish.
    ///`Value:` Valid values: 0 (H264); 1 (H265). Default: 0.
    uint32_t videoEncodedCodecType;

    ///`Description:` SEI parameters. Default: null
    ///`Note:` the parameter is passed in the form of a JSON string. Here is an example to use it:
    ///```json
    ///{
    ///  "payLoadContent":"xxx",
    ///  "payloadType":5,
    ///  "payloadUuid":"1234567890abcdef1234567890abcdef",
    ///  "interval":1000,
    ///  "followIdr":false
    ///}
    ///```
    /// The currently supported fields and their meanings are as follows:
    ///- payloadContent: Required. The payload content of the passthrough SEI, which cannot be empty.
    ///- payloadType: Required. The type of the SEI message, with a value range of 5 or an integer within the range of [100, 254] (excluding 244, which is an internally defined timestamp SEI).
    ///- payloadUuid: Required when payloadType is 5, and ignored in other cases. The value must be a 32-digit hexadecimal number.
    ///- interval: Optional, default is 1000. The sending interval of the SEI, in milliseconds.
    ///- followIdr: Optional, default is false. When this value is true, the SEI will be ensured to be carried when sending a key frame, otherwise it is not guaranteed.
    const char *videoSeiParams;

    TRTCStreamEncoderParam()
        : videoEncodedWidth(0),
          videoEncodedHeight(0),
          videoEncodedFPS(0),
          videoEncodedGOP(0),
          videoEncodedKbps(0),
          audioEncodedSampleRate(0),
          audioEncodedChannelNum(0),
          audioEncodedKbps(0),
          audioEncodedCodecType(0),
          videoEncodedCodecType(0),
          videoSeiParams(nullptr) {
    }
};

/**
 * 5.31 The transcoding parameters
 *
 * This enum type is used by the publishing API {@link startPublishMediaStream}.
 * You can use this parameter to specify the video layout and input audio information for On-Cloud MixTranscoding.
 */
struct TRTCStreamMixingConfig {
    ///`Description:` The background color of the mixed stream.
    ///`Value:` The value must be a hex number. For example, "0x61B9F1" represents the RGB color value (97,158,241). Default value: 0x000000 (black).
    uint32_t backgroundColor;

    ///`Description:` The URL of the background image of the mixed stream. The image specified by the URL will be mixed during On-Cloud MixTranscoding.
    ///`Value:` This parameter is left empty by default, which means no background image will be used.
    ///@note
    ///   - The URL can be 512 bytes long at most, and the image must not exceed 2 MB.
    ///   - The image can be in PNG, JPG, JPEG, or BMP format. We recommend you use a semitransparent image in PNG format.
    const char *backgroundImage;

    ///`Description:` The position, size, layer, and stream type of each video in On-Cloud MixTranscoding.
    ///`Value:` This parameter is an array. Each `TRTCVideoLayout` element in the array indicates the information of a video in On-Cloud MixTranscoding.
    TRTCVideoLayout *videoLayoutList;

    ///**Description:** The length of the `videoLayoutList` array.
    uint32_t videoLayoutListSize;

    ///`Description:` The information of each audio stream to mix.
    ///`Value:` This parameter is an array. Each `TRTCUser` element in the array indicates the information of an audio stream.
    ///@note If you do not specify this array, the TRTC backend will automatically mix all streams of the anchors who are sending audio in the room according to the audio encode param {@link TRTCStreamEncoderParam} you specify (currently only
    /// supports up to 16 audio and video inputs).
    TRTCUser *audioMixUserList;

    ///**Description:** The length of the `audioMixUserList` array.
    uint32_t audioMixUserListSize;

    ///`Description:` The position, size, and layer of each watermark image in On-Cloud MixTranscoding.
    ///`Value:` This parameter is an array. Each `TRTCWatermark` element in the array indicates the information of a watermark.
    TRTCWatermark *watermarkList;

    ///`Description:` The length of the `watermarkList` array.
    uint32_t watermarkListSize;

    TRTCStreamMixingConfig() : backgroundColor(0), backgroundImage(nullptr), videoLayoutList(nullptr), videoLayoutListSize(0), audioMixUserList(nullptr), audioMixUserListSize(0), watermarkList(nullptr), watermarkListSize(0) {
    }
};

/**
 * 5.32 Media Stream Private Encryption Configuration
 *
 * This configuration is used to set the algorithm and key for media stream private encryption.
 */
struct TRTCPayloadPrivateEncryptionConfig {
    ///`Description:` Encryption algorithm, the default is TRTCEncryptionAlgorithmAes128Gcm.
    TRTCEncryptionAlgorithm encryptionAlgorithm;

    ///`Description:` encryption key, string type.
    ///`Value:` If the encryption algorithm is TRTCEncryptionAlgorithmAes128Gcm, the key length must be 16 bytes;
    ///         if the encryption algorithm is TRTCEncryptionAlgorithmAes256Gcm, the key length must be 32 bytes.
    const char *encryptionKey;

    ///`Description:` Salt, initialization vector for encryption.
    ///`Value:` It is necessary to ensure that the array filled in this parameter is not empty, not all 0 and the data length is 32 bytes.
    uint8_t encryptionSalt[32];

    TRTCPayloadPrivateEncryptionConfig() : encryptionAlgorithm(TRTCEncryptionAlgorithm::TRTCEncryptionAlgorithmAes128Gcm), encryptionKey(nullptr) {
        memset(encryptionSalt, 0, sizeof(encryptionSalt));
    }
};

/**
 * 5.33 Volume evaluation and other related parameter settings.
 *
 * This setting is used to enable vocal detection and sound spectrum calculation.
 */
struct TRTCAudioVolumeEvaluateParams {
    ///`Description:` Set the trigger interval of the onUserVoiceVolume callback, the unit is milliseconds, the minimum interval is 100ms, if it is less than or equal to 0, the callback will be closed.
    ///`Value:` Recommended value: 300, in milliseconds.
    ///@note When the interval is greater than 0, the volume prompt will be enabled by default, no additional setting is required.
    uint32_t interval;

    ///`Description:` Whether to enable local voice detection.
    ///@note Call before startLocalAudio.
    bool enableVadDetection;

    ///`Description:` Whether to enable local vocal frequency calculation.
    bool enablePitchCalculation;

    ///`Description:` Whether to enable sound spectrum calculation.
    bool enableSpectrumCalculation;

    TRTCAudioVolumeEvaluateParams() : interval(300), enableVadDetection(false), enablePitchCalculation(false), enableSpectrumCalculation(false) {
    }
};

}  // namespace liteav

#ifdef _WIN32
using namespace liteav;
#endif

#endif
