/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   V2TXLivePusher @ TXLiteAVSDK
 * Function: Tencent Cloud live pusher
 * <H2>Function
 * Tencent Cloud Live Pusher
 * <H2>Introduce
 * It is mainly responsible for encoding the local audio and video images and pushing them to the specified streaming address, supporting any streaming server.
 * Flowmakers include the following capabilities:
 * - Customized video capture, allowing you to customize your own audio and video data sources according to project needs.
 * - Beautification, filters, stickers, including multiple sets of beautification and microdermabrasion algorithms (natural & smooth) and a variety of color space filters (support custom filters).
 * - Qos flow control technology, with uplink network adaptive capability, can adjust the amount of audio and video data in real time according to the specific conditions of the host network.
 * - Face shape adjustment, animation pendants, support face shape fine-tuning and animation pendant effects based on Youtu AI face recognition technology such as big eyes, thin face, nose augmentation, etc. You only need to purchase Youtu License to
 * easily achieve rich live broadcast effects.
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
//                    LivePusher Interface
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * Gets the `V2TXLivePusher` object pointer during dynamic DLL loading
 *
 * @return The `V2TXLivePusher` object pointer is returned. Please call `releaseV2TXLivePusher` to destruct the object.
 * @param context Android context, which will be converted to `ApplicationContext` for the calling of system APIs.
 * @param mode Stream publishing protocol. Valid values: `RTMP`, `ROOM`.
 * @note This API works only on Android.
 */
V2_API liteav::V2TXLivePusher* createV2TXLivePusher(void* context, liteav::V2TXLiveMode mode);
#else

/**
 * Gets the `V2TXLivePusher` object pointer during dynamic DLL loading
 *
 * @return The `V2TXLivePusher` object pointer is returned. Please call `releaseV2TXLivePusher` to destruct the object.
 * @param mode Stream publishing protocol. Valid values: `RTMP`, `ROOM`.
 * @note This API works on Windows, macOS, and iOS.
 */
V2_API liteav::V2TXLivePusher* createV2TXLivePusher(liteav::V2TXLiveMode mode);
#endif

/**
 * Destructs the `V2TXLivePusher` object
 *
 * @param pusher Pointer to the `V2TXLivePusher` object.
 */
V2_API void releaseV2TXLivePusher(liteav::V2TXLivePusher* pusher);
}

namespace liteav {

class V2TXLivePusher {
   public:
    /**
     * Sets the pusher callback
     *
     * By setting the callback, you can listen to some callback events of V2TXLivePusher,
     * including the pusher status, volume callback, statistics, warnings, and error messages.
     * @param observer Callback target of the pusher. For more information, see {@link V2TXLivePusherObserver}.
     */
    virtual void setObserver(V2TXLivePusherObserver* observer) = 0;

    /**
     * Sets the local camera preview
     *
     * Images collected by the local camera will be eventually displayed on the view that is passed in after it is overlaid by multiple effects, such as beauty filters, facial feature adjustments, and filters.
     * @param view Local camera preview.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t setRenderView(void* view) = 0;

    /**
     * Sets the view mirror of the local camera
     *
     * Local cameras are divided into the front camera and the rear camera. By default, images from the front camera are mirrored, and images from the rear camera are not mirrored. Here, you can modify the default mirror type of the front or rear
     * camera.
     * @param mirrorType Mirror type of the camera {@link V2TXLiveMirrorType}.
     *         - V2TXLiveMirrorTypeAuto `Default`: default mirror type. In this case, images from the front camera are mirrored, and images from the rear camera are not mirrored.
     *         - V2TXLiveMirrorTypeEnable:  both the front camera and rear camera are switched to mirror mode.
     *         - V2TXLiveMirrorTypeDisable: both the front camera and rear camera are switched to non-mirror mode.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t setRenderMirror(V2TXLiveMirrorType mirrorType) = 0;

    /**
     * Sets the video encoder mirror
     *
     * @note  The encoder mirror only influences video effects on the audience side.
     * @param mirror Specifies whether the mirrored images are viewed.
     *         - false `Default`: non-mirrored images are viewed on the player side.
     *         - true: mirrored images are viewed on the player side.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t setEncoderMirror(bool mirror) = 0;

    /**
     * Sets the rotation angle of the view
     *
     * @param rotation Rotation angle of the view {@link V2TXLiveRotation}.
     *         - V2TXLiveRotation0  `Default`: 0 degrees, which means the view is not rotated.
     *         - V2TXLiveRotation90:  rotate 90 degrees clockwise.
     *         - V2TXLiveRotation180: rotate 180 degrees clockwise.
     *         - V2TXLiveRotation270: rotate 270 degrees clockwise.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     * @note  Only the view is rotated, and images that are pushed are not affected.
     */
    virtual int32_t setRenderRotation(V2TXLiveRotation rotation) = 0;

    /**
     * Sets the fill mode of the local video image
     *
     * @param mode Fill mode of the view {@link V2TXLiveFillMode}.
     *         - V2TXLiveFillModeFill: **Default**: fill the screen with the image without leaving any black edges. If the aspect ratio of the view is different from that of the screen, part of the view will be cropped.
     *         - V2TXLiveFillModeFit  make the view fit the screen without cropping. If the aspect ratio of the view is different from that of the screen, black edges will appear.
     *         - V2TXLiveFillModeScaleFill  fill the screen with the stretched image, thus the length and width may not change proportionally.
     * @return Return code {@link V2TXLiveCode}
     *         - V2TXLIVE_OK: successful
     */
    virtual int32_t setRenderFillMode(V2TXLiveFillMode mode) = 0;

#if TARGET_PLATFORM_PHONE

    /**
     * Enables the local camera
     *
     * @param frontCamera Specifies whether to switch to the front camera.
     *         - true `Default`: switch to the front camera.
     *         - false: switch to the rear camera.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t startCamera(bool frontCamera) = 0;
#elif TARGET_PLATFORM_DESKTOP

    /**
     * Enables the local camera
     *
     * @param cameraId camera id.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     * @note startVirtualCamera, startCamera, startScreenCapture, if use the same Pusher instance, only one can publish. To switch between different capture sources, first stop the previous capture source, and then start the next capture source to
     * ensure that start and stop of the same capture source are called in pairs. eg: when the capture source is switched from Camera to VirtualCamera, the call sequence is startCamera -> stopCamera -> startVirtualCamera.
     */
    virtual int32_t startCamera(const char* cameraId) = 0;
#endif

    /**
     * Disables the local camera
     *
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t stopCamera() = 0;

    /**
     * Enables the local microphone
     *
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t startMicrophone() = 0;

    /**
     * Disables the microphone
     *
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t stopMicrophone() = 0;

    /**
     * Enables the image streaming
     *
     * @param image image.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     * @note startVirtualCamera, startCamera, startScreenCapture, if use the same Pusher instance, only one can publish. To switch between different capture sources, first stop the previous capture source, and then start the next capture source to
     * ensure that start and stop of the same capture source are called in pairs. eg: when the capture source is switched from Camera to VirtualCamera, the call sequence is startCamera -> stopCamera -> startVirtualCamera.
     */
    virtual int32_t startVirtualCamera(V2TXLiveImage* image) = 0;

    /**
     * Disables the image streaming
     *
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t stopVirtualCamera() = 0;

    /**
     * Pause the audio stream of the pusher
     *
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t pauseAudio() = 0;

    /**
     * Resume the audio stream of the pusher
     *
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t resumeAudio() = 0;

    /**
     * Pause the video stream of the pusher
     *
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t pauseVideo() = 0;

    /**
     * Resume the video stream of the pusher
     *
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t resumeVideo() = 0;

    /**
     * Starts pushing the audio and video data
     *
     * @param url Push URL, which can be any push server.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: operation succeeded. The pusher starts connecting to the target push URL.
     *         - V2TXLIVE_ERROR_INVALID_PARAMETER: operation failed. The URL is invalid.
     *         - V2TXLIVE_ERROR_INVALID_LICENSE: operation failed. The license is invalid and authentication failed.
     *         - V2TXLIVE_ERROR_REFUSED: operation failed. Duplicate streamId, please ensure that no other player or pusher is using this streamId now.
     */
    virtual int32_t startPush(const char* url) = 0;

    /**
     * Stops pushing the audio and video data
     *
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t stopPush() = 0;

    /**
     * Indicates whether the pusher is currently pushing streams
     *
     * @return Indicates whether the pusher is pushing streams.
     *         - 1: yes.
     *         - 0: no.
     */
    virtual int32_t isPushing() = 0;

    /**
     * Sets the audio quality for pushing
     *
     * @param quality Audio quality {@link V2TXLiveAudioQuality}.
     *         - V2TXLiveAudioQualityDefault `Default`: universal.
     *         - V2TXLiveAudioQualitySpeech: speech.
     *         - V2TXLiveAudioQualityMusic:  music.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     *         - V2TXLIVE_ERROR_REFUSED: the audio quality cannot be adjusted in the pushing process.
     */
    virtual int32_t setAudioQuality(V2TXLiveAudioQuality quality) = 0;

    /**
     * Set the video encoding parameters for pushing
     *
     * @param param  video encoding parameters {@link V2TXLiveVideoEncoderParam}.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t setVideoQuality(const V2TXLiveVideoEncoderParam& param) = 0;

    /**
     * Obtains the audio effect manager
     *
     * With the audio effect manager, you can use the following features:
     * - Adjust the volume of human voice collected by the microphone.
     * - Set the reverb and voice changing effects.
     * - Start the headphone monitor, and set the volume of the headphone monitor.
     * - Add the BGM, and adjust the playback effect of BGM.
     * please see {@link TXAudioEffectManager}
     */
    virtual ITXAudioEffectManager* getAudioEffectManager() = 0;

    /**
     * Obtains the video device manager
     *
     * With the device manager, you can use the following features:
     * - Switch between the front and rear cameras.
     * - Set the auto focus.
     * - Adjust the camera magnification.
     * - Turn the flash on or off.
     * - Switch between the earphone and speaker.
     * - Modify the volume type (media volume or conversation volume).
     * please see {@link TXDeviceManager}
     */
    virtual ITXDeviceManager* getDeviceManager() = 0;

    /**
     * Set up special effects such as beauty, whitening and ruddy
     *
     * Two sets of skin grinding algorithms with different styles are integrated in SDK：
     * -“smooth”：The algorithm is radical, and the skin grinding effect is obvious, which is suitable for live show.
     * -“natural”：The algorithm retains more facial details, and the skin grinding effect is more natural, which is applicable to most live scenes.
     * @param style There are two kinds of skin grinding algorithms: "smooth" and "natural".
     * @param beautyLevel Beauty level, the value range is 0 - 9, 0 means off, the greater the value of 1 - 9, the more obvious the effect.
     * @param whitenessLevel Whitening level. The value range is 0 - 9. 0 means off. The greater the value of 1 - 9, the more obvious the effect.
     * @param ruddinessLevel The value range of the ruddy level is 0 - 9. 0 means closed. The greater the value of 1 - 9, the more obvious the effect is.
     */
    virtual void setBeautyStyle(V2TXLiveBeautyStyle style, uint32_t beauty, uint32_t white, uint32_t ruddiness) = 0;

    /**
     * Captures the local view in the pushing process
     *
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     *         - V2TXLIVE_ERROR_REFUSED: pushing is stopped, and the snapshot operation cannot be called.
     */
    virtual int32_t snapshot() = 0;

    /**
     * Sets the pusher watermark image. By default, the watermark is disabled
     *
     * The watermark position is determined by the `x`, `y`, and `scale` parameters.
     * - `x`: X coordinate of watermark, which is a floating-point number between 0 and 1.
     * - `y`: Y coordinate of watermark, which is a floating-point number between 0 and 1.
     * - `scale`: watermark dimensions ratio, which is a floating-point number between 0 and 1.
     *
     * @param watermarkPath watermark image path (if `nullptr` is passed in, the watermark will be removed).
     * @param x    Top-left offset on the X axis of watermark.
     * @param y    Top-left offset on the Y axis of watermark.
     * @param scale Ratio of watermark width to image width (the watermark will be scaled according to this parameter).
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     * @note watermarkPath
     * 1. On iOS/macOS, if images are saved in `.xcassets`, pass in the file name:
     * self.pusher->setWatermark(“imageName”, 0.1, 0.1, 0.2).
     * 2. On Android, if images are saved in the `assets` directory, pass in the file name or path:
     * self.pusher->setWatermark(“imageName.png”, 0.1, 0.1, 0.2).
     * In other cases, get the file path as required by the platform and pass it in.
     */
    virtual int32_t setWatermark(const char* watermarkPath, float x, float y, float scale) = 0;

    /**
     * Enables volume update
     *
     * After this feature is enabled, you can obtain the volume evaluation through the {@link onMicrophoneVolumeUpdate} callback.
     * @param intervalMs Interval for triggering the volume callback. The unit is ms. The minimum interval is 100 ms. If the value is equal to or smaller than 0, the callback is disabled. We recommend that you set this parameter to 300 ms. `Default`:
     * 0.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t enableVolumeEvaluation(int32_t intervalMs) = 0;

    /**
     * Enables/Disables custom video pre-processing
     *
     * @param enable Whether to enable custom video pre-processing. `Default value`: `false`.
     * @param pixelFormat Pixel format of the video called back for custom pre-processing {@link V2TXLivePixelFormat}.
     * @param bufferType Data format of the video called back for custom pre-processing {@link V2TXLiveBufferType}.
     * @note Supported format combinations:
     *         V2TXLivePixelFormatBGRA32+V2TXLiveBufferTypeByteBuffer
     *         V2TXLivePixelFormatI420+V2TXLiveBufferTypeByteBuffer
     */
    virtual int32_t enableCustomVideoProcess(bool enable, V2TXLivePixelFormat pixelFormat, V2TXLiveBufferType bufferType) = 0;

    /**
     * Enables or disables custom video capture
     *
     * In the custom video capture mode, the SDK no longer captures images from cameras. Only the encoding and sending capabilities are retained.
     * @param enable `true`: enable custom video capture; `false` (**default**): disable custom video capture.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     * @note  This API takes effect only when it is called before {@link startPush}.
     */
    virtual int32_t enableCustomVideoCapture(bool enable) = 0;

    /**
     * Sets the callback of local video for custom rendering
     *
     * You can use this API to obtain each frame of decoded video and render them by yourself.
     * @param enable Whether to enable custom rendering. `Default value`: `false`.
     * @param pixelFormat Pixel format of the video called back for custom rendering {@link V2TXLivePixelFormat}.
     * @param bufferType Data format of the video called back for custom rendering {@link V2TXLiveBufferType}.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t enableCustomVideoRender(bool enable, V2TXLivePixelFormat pixelFormat, V2TXLiveBufferType bufferType) = 0;

    /**
     * Turn on/off custom audio capture
     *
     *  @brief Turn on/off custom audio capture.
     *         In the custom audio capture mode, the SDK no longer collects sound from the microphone, and only retains the encoding and sending capabilities.
     *  @note   It needs to be called before {@link startPush} to take effect.
     *  @param enable true: Open custom capture; false: Close custom capture.`Default value`: `false`.
     *  @return Return code for {@link V2TXLiveCode}.
     *          - `V2TXLIVE_OK`: successful.
     */
    virtual int32_t enableCustomAudioCapture(bool enable) = 0;

    /**
     * Sends the collected video data to the SDK in the custom video capture mode
     *
     * In the custom video capture mode, the SDK no longer captures images from cameras. Only the encoding and sending capabilities are retained.
     * You can pack collected SampleBuffer packets into V2TXLiveVideoFrame and periodically send them through this API.
     * @param videoFrame Video frames sent to the SDK {@link V2TXLiveVideoFrame}.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     *         - V2TXLIVE_ERROR_INVALID_PARAMETER: The video frames fail to be sent because they are invalid.
     * @note  You must call {@link enableCustomVideoCapture} to enable custom video capture before {@link startPush} .
     */
    virtual int32_t sendCustomVideoFrame(V2TXLiveVideoFrame* videoFrame) = 0;

    /**
     * In the custom audio collection mode, send the collected audio data to the SDK
     *
     * @param audioFrame Audio frame data sent to SDK {@link V2TXLiveAudioFrame}.
     * @return Return code for {@link V2TXLiveCode}.
     *          - `V2TXLIVE_OK`: successful.
     *          - `V2TXLIVE_ERROR_INVALID_PARAMETER`:  The audio frames fail to be sent because they are invalid.
     * @info In the custom audio collection mode, the collected audio data is sent to the SDK. The SDK no longer collects microphone data, and only retains the encoding and sending functions.
     * @note   You need to call {@link enableCustomAudioCapture(boolean)} before {@link startPush} to enable custom capture.
     */
    virtual int32_t sendCustomAudioFrame(V2TXLiveAudioFrame* audioFrame) = 0;

    /**
     * Use SEI channel to send custom message
     *
     * The player end {@link V2TXLivePlayer} can receive the message via `onReceiveSeiMessage` callback in {@link V2TXLivePlayerObserver}.
     * @param payloadType Payload type. Valid values: `5`, `242`, `242` recommended.
     * @param data Data to be sent.
     * @param dataSize Data size.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t sendSeiMessage(int payloadType, const uint8_t* data, uint32_t dataSize) = 0;

    /**
     * Start desktop screen sharing
     *
     * @note startVirtualCamera, startCamera, startScreenCapture, if use the same Pusher instance, only one can publish. To switch between different capture sources, first stop the previous capture source, and then start the next capture source to
     * ensure that start and stop of the same capture source are called in pairs. eg: when the capture source is switched from Camera to ScreenCapture, the call sequence is startCamera -> stopCamera -> startScreenCapture.
     */
    virtual int32_t startScreenCapture() = 0;

    /**
     * Stop screen sharing
     */
    virtual int32_t stopScreenCapture() = 0;

#if TARGET_PLATFORM_DESKTOP

    /**
     * Enable system audio capturing (for desktop systems only)
     *
     * Captures the audio of the entire OS (when `path` is empty) or a player (when `path` is not empty).
     * The audio is then mixed into the audio captured by the mic before being published to the cloud.
     * @param path
     *         - If `path` is empty, the audio of the entire OS is captured (Windows).
     *         - If `path` is the path of an EXE file (e.g., QQ Music), the application will be started, and its audio will be captured. On Windows, only the 32-bit SDK supports capturing the audio of an application.
     *         - `path` is empty by default. No other values are defined (macOS).
     * @note This API works only on Windows and macOS.
     */
    virtual int32_t startSystemAudioLoopback(const char* path = nullptr) = 0;

    /**
     * Stop system audio capturing (for desktop systems only)
     *
     * @note This API works only on Windows and macOS.
     */
    virtual int32_t stopSystemAudioLoopback() = 0;

    /**
     * Enumerate shareable screens and windows
     *
     * When you integrate the screen sharing feature of a desktop system, you generally need to display a UI for selecting the sharing target, so that users can use the UI to choose whether to share the entire screen or a certain window.
     * Through this API, you can query the IDs, names, and thumbnails of sharable windows on the current system. We provide a default UI implementation in the demo for your reference.
     * @param thumbSize Specify the thumbnail size of the window to be obtained. The thumbnail can be drawn on the window selection UI.
     * @param iconSize  Specify the icon size of the window to be obtained.
     * @return List of windows (including the screen).
     * @note
     * - The returned list contains the screen and the application windows. The screen is the first element in the list. If the user has multiple displays, then each display is a sharing target.
     * - Please do not use `delete IV2TXLiveScreenCaptureSourceList*` to delete the `SourceList`; otherwise, crashes may occur. Instead, please use the `release` method in `IV2TXLiveScreenCaptureSourceList` to release the list.
     *
     */
    virtual IV2TXLiveScreenCaptureSourceList* getScreenCaptureSources(const V2TXLiveSize& thumbSize, const V2TXLiveSize& iconSize) = 0;

    /**
     * Select the screen or window to share
     *
     * After you get the sharable screens and windows through `getScreenCaptureSources`, you can call this API to select the target screen or window you want to share.
     * During the screen sharing process, you can also call this API at any time to switch the sharing target.
     * The following four sharing modes are supported:
     * - Sharing the entire screen: for `source` whose `sourceType` is `Screen` in `sourceInfoList`, set `captureRect` to `{ 0, 0, 0, 0 }`.
     * - Sharing a specified area: for `source` whose `sourceType` is `Screen` in `sourceInfoList`, set `captureRect` to a non-nullptr value, e.g., `{ 100, 100, 300, 300 }`.
     * - Sharing an entire window: for `source` whose `sourceType` is `Window` in `sourceInfoList`, set `captureRect` to `{ 0, 0, 0, 0 }`.
     * - Sharing a specified window area: for `source` whose `sourceType` is `Window` in `sourceInfoList`, set `captureRect` to a non-nullptr value, e.g., `{ 100, 100, 300, 300 }`.
     *
     * @param source      Specify sharing source.
     * @param captureRect Specify the area to be captured.
     * @param property    Specify the attributes of the screen sharing target, such as capturing the cursor and highlighting the captured window. For more information, please see the definition of `V2TXLiveScreenCaptureProperty`.
     * @note Setting the highlight border color and width parameters does not take effect on macOS.
     */
    virtual int32_t setScreenCaptureSource(const V2TXLiveScreenCaptureSourceInfo& source, const V2TXLiveRect& captureRect, const V2TXLiveScreenCaptureProperty& property) = 0;

#endif

    /**
     * Indicates whether the debug view of the pusher video status information is displayed
     *
     * @param isShow Specifies whether to display the debug view. `Default`: false.
     */
    virtual void showDebugView(bool isShow) = 0;

    /**
     * Calls the advanced API of V2TXLivePusher
     *
     * @param key   Key of the advanced API, please see {@link V2TXLiveProperty}.
     * @param value Parameter needed to call the advanced API corresponding to the key.
     * @return Return code for {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     *         - V2TXLIVE_ERROR_INVALID_PARAMETER: operation failed. The key cannot be nil.
     * @note  This API is used to call some advanced features.
     */
    virtual int32_t setProperty(const char* key, const void* value) = 0;

   protected:
    virtual ~V2TXLivePusher() {
    }
};

}  // namespace liteav
#endif
