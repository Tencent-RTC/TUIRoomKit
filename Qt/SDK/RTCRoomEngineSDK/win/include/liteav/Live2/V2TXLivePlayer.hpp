/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   V2TXLivePlayer @ TXLiteAVSDK
 * Function: Tencent Cloud live player
 * <H2>Function
 * Tencent Cloud Live Player.
 * It is mainly responsible for pulling audio and video data from the specified live stream address, decoding and rendering locally.
 * <H2>Introduce
 * The player includes the following capabilities:
 * - Support RTMP, HTTP-FLV, HLS, TRTC, WebRTC protocols.
 * - Screen capture, you can capture the video screen of the current live stream.
 * - Delay adjustment, you can set the minimum and maximum time for automatic adjustment of the player cache.
 * - Customized video data processing, you can process the video data in the live stream according to the needs of the project, and then render and play it.
 */
#ifndef MODULE_CPP_IV2TXLIVEPLAYER_H_
#define MODULE_CPP_IV2TXLIVEPLAYER_H_

#include "V2TXLiveDef.hpp"
#include "V2TXLivePlayerObserver.hpp"

namespace liteav {
class V2TXLivePlayer;
}

extern "C" {
#ifdef __ANDROID__

/////////////////////////////////////////////////////////////////////////////////
//
//                   V2TXLivePlayer Interface
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * Gets the `V2TXLivePlayer` object pointer during dynamic DLL loading
 *
 * @return The `V2TXLivePlayer` object pointer is returned. Please call `releaseV2TXLivePlayer` to destruct the object.
 * @param context Android context, which will be converted to `ApplicationContext` for the calling of system APIs.
 * @note This API works only on Android.
 */
V2_API liteav::V2TXLivePlayer* createV2TXLivePlayer(void* context);
#else

/**
 * Gets the `V2TXLivePlayer` object pointer during dynamic DLL loading
 *
 * @return The `V2TXLivePlayer` object pointer is returned. Please call `releaseV2TXLivePlayer` to destruct the object.
 * @note This API works on Windows, macOS, and iOS.
 */
V2_API liteav::V2TXLivePlayer* createV2TXLivePlayer();
#endif

/**
 * Destructs the `V2TXLivePlayer` object
 *
 * @param player Pointer to the `V2TXLivePlayer` object.
 */
V2_API void releaseV2TXLivePlayer(liteav::V2TXLivePlayer* player);
}

namespace liteav {

class V2TXLivePlayer {
   public:
    /**
     * Sets the player callback
     *
     * By setting the callback, you can listen to some callback events of V2TXLivePlayer,
     * including the player status, playback volume callback, first frame audio/video callback, statistics, warnings, and error messages.
     * @param observer Callback target of the player. For more information, see {@link V2TXLivePlayerObserver}.
     */
    virtual void setObserver(V2TXLivePlayerObserver* observer) = 0;

    /**
     * Sets the rendering view of the player. This control is responsible for presenting the video content
     *
     * @param view Player rendering view.
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t setRenderView(void* view) = 0;

    /**
     * Sets the rotation angle of the player view
     *
     * @param rotation Rotation angle of the view {@link V2TXLiveRotation}.
     *         - V2TXLiveRotation0 **Default**: 0 degrees, which means the view is not rotated.
     *         - V2TXLiveRotation90:  rotate 90 degrees clockwise.
     *         - V2TXLiveRotation180: rotate 180 degrees clockwise.
     *         - V2TXLiveRotation270: rotate 270 degrees clockwise.
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t setRenderRotation(V2TXLiveRotation rotation) = 0;

    /**
     * Sets the fill mode of the view
     *
     * @param mode Fill mode of the view {@link V2TXLiveFillMode}.
     *         - V2TXLiveFillModeFill: **Default**: fill the screen with the image without leaving any black edges. If the aspect ratio of the view is different from that of the screen, part of the view will be cropped.
     *         - V2TXLiveFillModeFit  make the view fit the screen without cropping. If the aspect ratio of the view is different from that of the screen, black edges will appear.
     *         - V2TXLiveFillModeScaleFill  fill the screen with the stretched image, thus the length and width may not change proportionally.
     * @return Return code {@link V2TXLiveCode}
     *         - V2TXLIVE_OK: successful
     */
    virtual int32_t setRenderFillMode(V2TXLiveFillMode mode) = 0;

    /**
     * Starts playing the audio and video streams
     *
     * @param url URL of the audio and video streams to be played. The RTMP, HTTP-FLV and TRTC streaming protocols are supported.
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: operation succeeded. The player starts connecting to the URL and playing the audio and video streams.
     *         - V2TXLIVE_ERROR_INVALID_PARAMETER: operation failed. The URL is invalid.
     *         - V2TXLIVE_ERROR_REFUSED: operation failed. Duplicate streamId, please ensure that no other player or pusher is using this streamId now.
     */
    virtual int32_t startPlay(const char* url) = 0;

    /**
     * Stops playing the audio and video streams
     *
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t stopPlay() = 0;

    /**
     * Indicates whether the player is playing the audio and video streams
     *
     * @return Indicates whether the player is playing the audio and video streams.
     *         - 1: yes.
     *         - 0: no.
     */
    virtual int32_t isPlaying() = 0;

    /**
     * Pauses the audio stream of the player
     *
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t pauseAudio() = 0;

    /**
     * Resumes the audio stream of the player
     *
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t resumeAudio() = 0;

    /**
     * Pauses the video stream of the player
     *
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t pauseVideo() = 0;

    /**
     * Resumes the video stream of the player
     *
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t resumeVideo() = 0;

    /**
     * Sets the volume
     *
     * @param volume Volume. Valid range: 0 - 100. **Default**: 100.
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t setPlayoutVolume(int32_t volume) = 0;

    /**
     * Set the minimum time and maximum time (unit: s) for auto adjustment of the player cache
     *
     * @param minTime Minimum time for auto cache adjustment. The value must be greater than 0. **Default**: 1.
     * @param maxTime Maximum time for auto cache adjustment. The value must be greater than 0. **Default**: 5.
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     *         - V2TXLIVE_ERROR_INVALID_PARAMETER: operation failed. MinTime and maxTime must be greater than 0.
     *         - V2TXLIVE_ERROR_REFUSED: operation failed. Change of cache is not suppoted when playing.
     */
    virtual int32_t setCacheParams(float minTime, float maxTime) = 0;

    /**
     * Seamlessly switch live stream urls, supporting  FLV and LEB protocols
     *
     * @param newUrl New pull address.
     */
    virtual int32_t switchStream(const char* newUrl) = 0;

    /**
     * Enables playback volume update
     *
     * After this feature is enabled, you can obtain the SDK’s volume evaluation through the {@link onPlayoutVolumeUpdate} callback.
     * @param intervalMs Interval for triggering the volume callback. The unit is ms. The minimum interval is 100 ms. If the value is equal to or smaller than 0, the callback is disabled. We recommend that you set this parameter to 300 ms.
     * **Default**: 0.
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t enableVolumeEvaluation(int32_t intervalMs) = 0;

    /**
     * Captures the video view in the playback process
     *
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     *         - V2TXLIVE_ERROR_REFUSED: playback is stopped, the snapshot operation cannot be called.
     */
    virtual int32_t snapshot() = 0;

    /**
     * Turn on/off the monitoring callback of the video frame
     *
     * The SDK will no longer render the video after you turn on this switch. You can get the video frame through V2TXLivePlayerObserver and execute custom rendering logic.
     * @param enable      Whether to enable custom rendering. **Default**: false.
     * @param pixelFormat Video pixel format for custom rendering callback {@link V2TXLivePixelFormat}。
     * @param bufferType  Video data format for custom rendering callback {@link V2TXLiveBufferType}。
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     *         - V2TXLIVE_ERROR_NOT_SUPPORTED: the pixel format or data format is not supported.
     */
    virtual int32_t enableObserveVideoFrame(bool enable, V2TXLivePixelFormat pixelFormat, V2TXLiveBufferType bufferType) = 0;

    /**
     * Turn on/off the monitoring callback of the audio frame
     *
     * if you turn on this switch, You can get the audio frame through V2TXLivePlayerObserver and execute custom logic.
     * @param enable Whether to enable the callback of the audio frame. **Default**: false.
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t enableObserveAudioFrame(bool enable) = 0;

    /**
     * Enables the receiving of SEI messages
     *
     * @param enable `true`: enable; `false` (**default**): disable.
     * @param payloadType The payload type of SEI messages. Valid values: `5`, `242`, please be consistent with the payload type of the sender.
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     */
    virtual int32_t enableReceiveSeiMessage(bool enable, int payloadType) = 0;

    /**
     * Indicates whether the debug view of the player video status information is displayed
     *
     * @param isShow Specifies whether to display the debug view. **Default**: false.
     */
    virtual void showDebugView(bool isShow) = 0;

    /**
     * Calls the advanced API of V2TXLivePlayer
     *
     * @note  This API is used to call some advanced features.
     * @param key   Key of the advanced API.
     * @param value Parameter needed to call the advanced API corresponding to the key.
     * @return Return code {@link V2TXLiveCode}.
     *         - V2TXLIVE_OK: successful.
     *         - V2TXLIVE_ERROR_INVALID_PARAMETER: operation failed. The key cannot be null.
     */
    virtual int32_t setProperty(const char* key, const void* value) = 0;

   protected:
    virtual ~V2TXLivePlayer() {
    }
};

}  // namespace liteav

#endif
