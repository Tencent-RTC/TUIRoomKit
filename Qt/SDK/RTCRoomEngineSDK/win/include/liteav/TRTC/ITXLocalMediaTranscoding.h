/**
 * Copyright (c) 2024 Tencent. All rights reserved.
 * Module:   Local media transcoding(Current version only supports Windows platform).
 * Function: Transcode local media sources.
 */
#if defined(_WIN32)

#ifndef TRTC_CPP_ITXLOCALMEDIATRANSCODING_H_
#define TRTC_CPP_ITXLOCALMEDIATRANSCODING_H_

#include "ITRTCCloud.h"
#include "TRTCTypeDef.h"
#include "TXLiteAVBase.h"

namespace liteav {
class ITXLocalMediaTranscoding;
}

/**
 * Obtain ITXLocalMediaTranscoding instance using C function.
 *
 * You can create and destroy ITXLocalMediaTranscoding Instance as follows:
 *
 * <pre>
 * ITXLocalMediaTranscoding *instance = createTXLocalMediaTranscoding();
 * if(instance) {
 *     instance->startTranscoding(xxxx);
 * }
 * destroyTXLocalMediaTranscoding(instance);
 * instance = nullptr;
 * </pre>
 */
extern "C" {
LITEAV_API liteav::ITXLocalMediaTranscoding* createTXLocalMediaTranscoding();

LITEAV_API void destroyTXLocalMediaTranscoding(liteav::ITXLocalMediaTranscoding* instance);
}

namespace liteav {

/**
 * Media source type.
 */
enum LocalMediaTranscodingSourceType {

    /// Camera media type.
    MediaSourceCamera = 0,

    /// Screen media type.
    MediaSourceScreen = 1,

    /// Image media type currently only supports four formats: BMP, JPG, PNG, and GIF.
    MediaSourceImage = 2,

    /// Reserved field. The current version does not support remote user video source mixing and transcoding.
    MediaSourceRemoteVideo = 3,

};

/**
 * Media source.
 */
struct LocalMediaTranscodingSource {
    /// Field description: Media source type.
    LocalMediaTranscodingSourceType sourceType = LocalMediaTranscodingSourceType::MediaSourceCamera;

    /// Field description: Camera ID.
    /// This field is valid when sourceType is MediaSourceCamera.
    /// You can use this field to specify the device ID of the camera.
    /// The device ID of the camera can be obtained through the interface in TXDeviceManager.
    const char* cameraDeviceId = nullptr;

    /// Field description: Screen or window ID.
    /// This field is valid when sourceType is MediaSourceScreen,
    /// and you can use this field to specify the window ID of the entire screen or a window.
    /// You can get the source ID through the getScreenCaptureSources interface in TRTCCloud.
    TXView screenSourceId = nullptr;

    /// Field description: Image path.
    /// This field is valid when sourceType is MediaSourceImage, and you can use this field to specify the file path of the image.
    /// The current version only supports four image formats: BMP, JPG, PNG, and GIF.
    const char* imagePath = nullptr;

    /// Field description: User ID of the remote video stream.
    /// This field is valid when sourceType is MediaSourceRemoteVideo, but the current version of the SDK does not yet support this capability.
    const char* userId = nullptr;

    /// Field description: Specify the coordinate area of the media source (unit: pixel).
    RECT rect = RECT{0};

    /// Field description: Specify the level of the media source (value range: 0 - 15, non-repeatable).
    int zOrder = 0;

    /// Field description: Specify whether the media source is rotated, mirrored and fill mode. For details, see {@link TRTCRenderParams}.
    const TRTCRenderParams* renderParams = nullptr;

    /// Field description: Whether the media source is selected.
    bool isSelected = false;
};

/**
 * Local media transcoding parameters.
 */
struct LocalMediaTranscodingParams {
    /// Field description: Specify the configuration information of each input media source in the transcoding stream.
    /// This field is an array of type LocalMediaTranscodingSource. Each element in the array is used to represent information about each input media source.
    ///@note Media source information does not support leaving blank, otherwise ITXLocalTranscodingCallback::onTranscodingStarted will report an error.
    LocalMediaTranscodingSource* inputSourceList = nullptr;

    /// Field description: The size of the array inputSourceList.
    unsigned int inputSourceListSize = 0;

    /// Field description: Video encoding parameters for the transcoded stream.
    TRTCVideoEncParam videoEncoderParams;

    /// Field description: Specifies the background color of the blended image.
    /// Recommended value: Default value: 0x000000 represents black. The format is a hexadecimal number, for example: "0x61B9F1" represents RGB (97, 158, 241) respectively.
    int canvasColor = 0x000000;
};

/**
 * Local media stream mixed transcoding error code.
 */
enum LocalMediaTranscodingError {

    /// The call was successful.
    Success = 0,

    /// Common error code.
    Error = -1,

    /// The parameter is illegal.
    InvalidParams = -2,

    /// A media source mixes abnormally.
    /// LocalMediaTranscodingSource throws this exception if there is no data for a media source for more than 30 seconds.
    NotFoundSource = -3,

    /// The image source fails to load.
    ImageSourceLoadFailed = -4,

};

class ITXVideoFrameProcessCallback {
   public:
    virtual ~ITXVideoFrameProcessCallback() {
    }

    /**
     * Custom image processing callback (connecting with third-party beauty SDK).
     *
     * If you choose a third-party beauty SDK, you need to set the third-party beauty callback in ITXLocalMediaTranscoding,
     * Afterwards, ITXLocalMediaTranscoding will throw the video frames originally intended for preprocessing to you through this callback interface.
     * Then you can hand over the video frames thrown by ITXLocalMediaTranscoding to the third-party beauty SDK for image processing.
     * Since the thrown data is readable and writable, the processing results of third-party beauty SDK can
     * be returned to ITXLocalMediaTranscoding for subsequent encoding and sending.
     *
     * Situation 1: The beauty component itself will generate new textures.
     * If the beauty component you are using will generate a new texture frame (used to carry the processed image) during image processing,
     * please set processedVideoFrame.textureId to the ID of the new texture in the callback function:
     *
     * <pre>
     * int onProcessCameraVideo(char* cameraDeviceId,TRTCVideoFrame*
     * originalVideoFrame,TRTCVideoFrame* processedVideoFrame) {
     *     processedVideoFrame->textureId =
     *     mFURenderer.onDrawFrameSingleImput(originalVideoFrame->textureId);
     *     return 0;
     * }
     * </pre>
     *
     * Scenario 2: The beauty component requires you to provide the target texture.
     * If the third-party beauty module you use does not generate new textures,
     * but requires you to set an input texture and an output texture to the module, you can consider the following solution:
     *
     * <pre>
     * int onProcessCameraVideo(char* cameraDeviceId,
     *                          TRTCVideoFrame* originalVideoFrame,
     *                          TRTCVideoFrame* processedVideoFrame) {
     *     thirdparty_process(originalVideoFrame->textureId,
     *                        originalVideoFrame->width,
     *                        originalVideoFrame->height,
     *                        processedVideoFrame->textureId);
     *     return 0;
     * }
     * </pre>
     *
     * @param originalVideoFrame Used to carry camera images collected by TRTC.
     * @param processedVideoFrame Used to receive video images processed by third-party beauty SDK.
     * @return - 0: success.
     *         - others: mistake.
     * @note Currently only OpenGL texture scheme is supported (PC only supports TRTCVideoBufferType_Buffer format).
     */
    virtual int onProcessVideoFrame(const char* cameraDeviceId, const TRTCVideoFrame* originalVideoFrame, TRTCVideoFrame* processedVideoFrame) = 0;
};

class ITXVideoFrameRenderCallback {
   public:
    virtual ~ITXVideoFrameRenderCallback() {
    }

    /**
     * Custom image rendering callback (used to render video image by yourself).
     *
     * @param mixedVideoFrame Video frames after local mixing.
     */
    virtual int onRenderMixedFrame(const TRTCVideoFrame* mixedVideoFrame) = 0;
};

class ILocalMediaTranscodingCallback {
   public:
    virtual ~ILocalMediaTranscodingCallback() {
    }

    /**
     * Event callback when local media transcoding is enabled.
     *
     * When you call {@link startTranscoding} to start local media transcoding,
     * whether the startup is successful or not will be synchronized to you through this callback.
     * @param errCode error code, see {@link LocalMediaTranscodingError} for details.
     * @param errMsg error message.
     */
    virtual void onTranscodingStarted(LocalMediaTranscodingError errCode, const char* errMsg) = 0;

    /**
     * Event callback for stopping local media transcoding.
     *
     * This event callback is thrown by the SDK when you stop local media transcoding via {@link stopTranscoding}.
     * @param reason Stop reason:
     *
     *    - 0: user actively stops.
     *    - 1: passive stop, the collection source may be invalid.
     * @param reasonMsg Stop reason description information.
     */
    virtual void onTranscodingStopped(int reason, const char* reasonMsg) = 0;

    /**
     * Event callback for local camera opening.
     *
     * When you call {@link startCameraSource} to open the camera,
     * whether the startup is successful or not will be synchronized to you through this callback.
     * @param deviceId Camera device ID.
     * @param errCode Error code, see {@link LocalMediaTranscodingError} for details.
     * @param errMsg error message.
     */
    virtual void onCameraSourceStarted(const char* deviceId, LocalMediaTranscodingError errCode, const char* errMsg) = 0;

    /**
     * Event callback for local camera stopped.
     *
     * @param deviceId Camera device ID.
     * @param reasonMsg Stop reason description information.
     */
    virtual void onCameraSourceStopped(const char* deviceId, const char* reasonMsg) = 0;

    /**
     * Event callback for image mixing enabled.
     *
     * When you call {@link addImageSource} to open image capture,
     * whether the startup is successful or not will be synchronized to you through this callback.
     * @param imagePath Image path .
     * @param errCode Error code, see {@link LocalMediaTranscodingError} for details.
     * @param errMsg Error message.
     */
    virtual void onImageSourceStarted(const char* imagePath, LocalMediaTranscodingError errCode, const char* errMsg) = 0;

    /**
     * Event callback for image source stopped.
     *
     * @param imagePath Image path.
     */
    virtual void onImageSourceStopped(const char* imagePath) = 0;

    /**
     * Event callback for screen sharing enabled.
     *
     * When you start screen sharing through related interfaces such as {@link startScreenSource}, the SDK will throw this event callback.
     * @param sourceId Screen or window ID.
     * @param errCode Error code, see {@link LocalMediaTranscodingError} for details.
     * @param errMsg error message.
     */
    virtual void onScreenSourceStarted(TXView sourceId, LocalMediaTranscodingError errCode, const char* errMsg) {
    }

    /**
     * Screen sharing pause event callback.
     *
     * @param sourceId Screen or window ID.
     * @param reason Paused reason:
     *
     *    - 0: The user actively pauses.
     *    - 1: Indicates a pause caused by the screen sharing window not being visible (Mac only).
     *    - 2: Indicates a pause caused by the screen sharing window being minimized (Windows only).
     *    - 3: Indicates a pause caused by the screen sharing window being hidden (Windows only).
     */
    virtual void onScreenSourcePaused(TXView sourceId, int reason) {
    }

    /**
     * Screen sharing resume event callback
     *
     * @param sourceId Screen or window ID.
     * @param reason Resumed reason:
     *
     *    - 0: The user actively resumes.
     *    - 1: Indicates recovery caused by the screen sharing window being visible (Mac only).
     *    - 2: Indicates the recovery of the screen sharing window from unminimization (Windows only).
     *    - 3: Indicates the recovery of the screen sharing window from unhiding (Windows only).
     */
    virtual void onScreenSourceResumed(TXView sourceId, int reason) {
    }

    /**
     * Screen sharing stop event callback.
     *
     * The SDK throws this event callback when you stop screen sharing via {@link stopScreenSource}.
     * @param sourceId Screen or window ID.
     * @param reason Stop reason:
     *
     *    - 0: The user actively stops.
     *    - 1: Indicates a stop caused by closing the screen sharing window.
     *    - 2: Indicates a stop caused by screen sharing monitor status changes (such as the interface being unplugged, projection mode changes, etc.).
     */
    virtual void onScreenSourceStopped(TXView sourceId, int reason) {
    }

    /**
     * Event callback when media source screen size changes.
     *
     * When the screen size of the input media source changes, the latest size of the input source will be returned through this interface.
     * and you can dynamically adjust the screen proportions based on this size.
     * @param mediaSource The field represents the input media source information of this channel.
     * @param newSize The field represents the latest screen size of the input media source.
     * @note Currently, media source types only support window capture.
     */
    virtual void onMediaSourceSizeChanged(const LocalMediaTranscodingSource& mediaSource, const SIZE& newSize) {
    }
};

class ITXLocalMediaTranscoding {
   public:
    /**
     * Set TXLocalMediaTranscoding event callback.
     *
     * You can get various event notifications from the SDK (such as error codes, warning codes, interface call status, etc.) through {@link ILocalMediaTranscodingCallback}.
     * @param callback Callback instance.
     */
    virtual void setTranscodingCallback(ILocalMediaTranscodingCallback* callback) = 0;

    /**
     * Set ITXLocalMediaTranscoding video custom preprocessing data callback.
     *
     * You can get custom preprocessing frame from the ITXVideoFrameProcessCallback through {@link setVideoFrameProcessCallback}.
     * @param pixelFormat Specifies the pixel format of video frame.
     * Currently, only the TRTCVideoPixelFormat_I420 || TRTCVideoPixelFormat_BGRA32 || TRTCVideoPixelFormat_RGBA32 format is supported.
     * @param bufferType  Specify the video frame buffer type. Currently, only TRTCVideoBufferType_Buffer is supported.
     * @param callback Callback instance.
     */
    virtual void setVideoFrameProcessCallback(TRTCVideoPixelFormat pixelFormat, TRTCVideoBufferType bufferType, ITXVideoFrameProcessCallback* callback) = 0;

    /**
     * Set ITXLocalMediaTranscoding video custom rendering data callback.
     *
     * You can get custom rendering video frame from ITXVideoFrameRenderCallback through {@link setVideoFrameRenderCallback}.
     * You can stop the callback by calling setVideoFrameRenderCallback(TRTCVideoPixelFormat_Unknown, TRTCVideoBufferType_Unknown, nullptr):
     *
     *   - The iOS、Mac、Windows platform currently only supports {@link TRTCVideoPixelFormat_I420}
     *     or {@link TRTCVideoPixelFormat_BGRA32} pixel formats.
     *   - The Android platform currently only supports {@link TRTCVideoPixelFormat_I420},
     *     {@link TRTCVideoPixelFormat_RGBA32} or {@link TRTCVideoPixelFormat_Texture_2D} pixel formats.
     * @param pixelFormat Specifies the pixel format of video frame.
     * @param bufferType  Specify the video frame buffer type. Currently, only {@link TRTCVideoBufferType_Buffer} is supported.
     * @param callback Callback instance.
     */
    virtual void setVideoFrameRenderCallback(TRTCVideoPixelFormat pixelFormat, TRTCVideoBufferType bufferType, ITXVideoFrameRenderCallback* callback) = 0;

    /**
     * Start local media transcoding.
     *
     * @param streamType Specify whether to use TRTC's TRTCVideoStreamTypeBig to push the stream or TRTCVideoStreamTypeSub to push the stream.
     * @param params Specify the parameters for local media transcoding. For details, see {@link LocalMediaTranscodingParams}.
     */
    virtual void startTranscoding(TRTCVideoStreamType streamType, const LocalMediaTranscodingParams& params) = 0;

    /**
     * Update local media transcoding parameters.
     *
     * @param params Specify the parameters for local media transcoding. For details, see {@link LocalMediaTranscodingParams}.
     */
    virtual void updateTranscodingParams(const LocalMediaTranscodingParams& params) = 0;

    /**
     * Stop local media transcoding.
     */
    virtual void stopTranscoding() = 0;

    /**
     * Start camera capture.
     *
     * @param cameraDeviceId Camera device Id.
     */
    virtual void startCameraSource(const char* cameraDeviceId) = 0;

    /**
     * Stop camera capture.
     *
     * @param cameraDeviceId Camera device Id.
     */
    virtual void stopCameraSource(const char* cameraDeviceId) = 0;

    /**
     * Set camera capture parameters.
     *
     * @param cameraDeviceId Camera device Id.
     * @param cameraParam Specify the camera capture resolution and frame rate. For details, see {@link TXCameraCaptureParam}.
     */
    virtual void setCameraCaptureParam(const char* cameraDeviceId, const TXCameraCaptureParam* cameraParam) = 0;

    /**
     * Enable green screen extraction for camera-captured images.
     *
     * @param cameraDeviceId Camera device Id.
     * @param enable Whether to enable green screen extraction for camera-captured images.
     */
    virtual void enableCameraGreenScreen(const char* cameraDeviceId, bool enable) = 0;

    /**
     * Start screen/window capture.
     *
     * @param screenSource Detailed parameters for screen/window capture, please see {@link TRTCScreenCaptureSourceInfo} for details.
     * @param captureRect Specify the area to capture.
     */
    virtual void startScreenSource(const TRTCScreenCaptureSourceInfo& screenSource, const RECT& captureRect) = 0;

    /**
     * Update window/screen capture properties.
     *
     * @param sourceId The Id of the screen/window.
     * @param property Screen/window capture parameters, see {@link TRTCScreenCaptureProperty} for details.
     */
    virtual void updateScreenCaptureProperty(TXView sourceId, const liteav::TRTCScreenCaptureProperty& property) = 0;

    /**
     * Stop screen/window capture.
     *
     * @param screenSourceId The Id of the screen/window.
     */
    virtual void stopScreenSource(const TXView screenSourceId) = 0;

    /**
     * Start image source.
     *
     * @param imagePath Image path currently only supports four formats: BMP, JPG, PNG, and GIF.
     * @param fps The capture output frame rate does not need to be set and the SDK will make the best decision.
     */
    virtual void addImageSource(const char* imagePath, int fps = 0) = 0;

    /**
     * Stop image source.
     *
     * @param imagePath Image path.
     */
    virtual void removeImageSource(const char* imagePath) = 0;

    /**
     * Set render window.
     *
     * @param view Render window.
     */
    virtual void setMixedVideoRenderView(TXView view) = 0;

    /**
     * Attach TRTC to ITXLocalMediaTranscoding to push stream.
     *
     * @param trtcCloud TRTC instance pointer.
     * @note The SDK will decide which stream to use based on the TRTCVideoStreamType set by {@link startTranscoding}.
     */
    virtual void attachTRTC(ITRTCCloud* trtcCloud) = 0;

    /**
     * Detach TRTC from current ITXLocalMediaTranscoding.
     */
    virtual void detachTRTC() = 0;

   protected:
    virtual ~ITXLocalMediaTranscoding() {
    }
};

}  // namespace liteav

#endif  // TRTC_CPP_ITXLOCALMEDIATRANSCODING_H_

#endif
