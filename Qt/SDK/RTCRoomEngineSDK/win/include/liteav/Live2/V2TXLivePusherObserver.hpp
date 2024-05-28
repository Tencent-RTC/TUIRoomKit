/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   V2TXLivePusherObserver @ TXLiteAVSDK
 * Function: Tencent Cloud live pusher callback notification
 * <H2>Function
 * Callback notification for push streaming of Tencent Cloud Live.
 * <H2>Introduce
 * You can receive some push notifications from the {@link V2TXLivePusher} pusher, including the connection status of the pusher, callback of the first frame of audio and video, statistical data, warning and error messages, etc.
 */
#ifndef MODULE_CPP_V2TXLIVEPUSHEROBSERVER_H_
#define MODULE_CPP_V2TXLIVEPUSHEROBSERVER_H_

#include "V2TXLiveDef.hpp"

namespace liteav {

class V2TXLivePusherObserver {
   public:
    virtual ~V2TXLivePusherObserver() {
    }

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   Live pusher Event Callback
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * Live pusher error notification, which is called back when the pusher encounters an error
     *
     * @param code      Error code {@link V2TXLiveCode}.
     * @param msg       Error message.
     * @param extraInfo Extended information.
     */
    virtual void onError(int32_t code, const char* msg, void* extraInfo) {
    }

    /**
     * Live pusher warning notification
     *
     * @param code      Warning code {@link V2TXLiveCode}.
     * @param msg       Warning message.
     * @param extraInfo Extended information.
     */
    virtual void onWarning(int32_t code, const char* msg, void* extraInfo) {
    }

    /**
     * Callback notification indicating that collection of the first audio frame is complete
     */
    virtual void onCaptureFirstAudioFrame() {
    }

    /**
     * Callback notification indicating that collection of the first video frame is complete
     */
    virtual void onCaptureFirstVideoFrame() {
    }

    /**
     * Microphone-collected volume callback
     *
     * @note  This callback notification is received after {@link enableVolumeEvaluation} is called.
     * @param volume Current volume value for collection.
     */
    virtual void onMicrophoneVolumeUpdate(int32_t volume) {
    }

    /**
     * Callback notification of the pusher connection status
     *
     * @param status    Pusher connection status {@link V2TXLivePushStatus} .
     * @param msg       Connection status message.
     * @param extraInfo Extended information.
     */
    virtual void onPushStatusUpdate(V2TXLivePushStatus state, const char* msg, void* extraInfo) {
    }

    /**
     * Live pusher statistics callback
     *
     * @param statistics Pusher statistics {@link V2TXLivePusherStatistics} .
     */
    virtual void onStatisticsUpdate(V2TXLivePusherStatistics statistics) {
    }

    /**
     * Screenshot callback
     *
     * @note  This callback notification will be received after calling {@link snapshot} .
     * @param image  Screenshot data. If it is `nullptr`, it indicates that the SDK failed to take the screenshot.
     * @param length Screenshot data length. In BGRA32 format, length = width * height * 4.
     * @param width  Screenshot width.
     * @param height Screenshot height.
     * @param format Screenshot data format. Only `TRTCVideoPixelFormat_BGRA32` is supported now.
     */
    virtual void onSnapshotComplete(const char* image, int length, int width, int height, V2TXLivePixelFormat format) {
    }

    /**
     * Custom video rendering callback
     *
     * @note You will receive this callback after calling {@link enableCustomVideoRender} to enable
     * local custom video rendering.
     * @param videoFrame Video frames to be rendered {@link V2TXLiveVideoFrame} .
     */
    virtual void onRenderVideoFrame(const V2TXLiveVideoFrame* videoFrame) {
    }

    /**
     * Callback of video data for custom pre-processing
     *
     * @note You can call {@link enableCustomVideoProcess} to enable/disable custom video pre-processing.
     *       Only the YUV420 format is supported on Windows currently.
     * @param srcFrame Used to carry images captured by SDK via the camera.
     * @param dstFrame Used to receive video images processed by third-party beauty filters.
     */
    virtual int onProcessVideoFrame(V2TXLiveVideoFrame* srcFrame, V2TXLiveVideoFrame* dstFrame) {
        return 0;
    }

    /**
     * The SDK returns this callback when you call {@link startScreenCapture} and other APIs to start screen sharing.
     */
    virtual void onScreenCaptureStarted() {
    }

    /**
     * The SDK returns this callback when you call {@link stopScreenCapture} to stop screen sharing
     *
     * @param Reason for stop.
     *               - `0`: Screen capture stopped by user.
     *               - `1`: On iOS platform means the screen recording is interrupted by the system; Mac, Windows means the screen sharing window is closed.
     *               - `2`: On windows platform indicates that the display screen status of screen sharing is changed (such as the interface is pulled out, the projection mode is changed, etc.); other platforms do not throw.
     */
    virtual void onScreenCaptureStoped(int reason) {
    }
};
}  // namespace liteav
#endif
