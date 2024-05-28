/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   V2TXLivePlayerObserver @ TXLiteAVSDK
 * Function: Tencent Cloud live player callback notification
 * <H2>Function
 * Player callback notification for Tencent Cloud Live.
 * <H2>Introduce
 * You can receive some callback notifications from the {@link V2TXLivePlayer} player, including player status, playback volume callback, audio and video first frame callback, statistical data, warning and error messages, etc.
 */
#ifndef MODULE_CPP_V2TXLIVEPLAYEROBSERVER_H_
#define MODULE_CPP_V2TXLIVEPLAYEROBSERVER_H_

#include "V2TXLiveDef.hpp"

namespace liteav {
class V2TXLivePlayer;

class V2TXLivePlayerObserver {
   public:
    virtual ~V2TXLivePlayerObserver() {
    }

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Live Player Event Callback
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * live player error notification, which is called back when the player encounters an error
     *
     * @param player    Player object that calls back this notification.
     * @param code      Error code {@link V2TXLiveCode}.
     * @param msg       Error message.
     * @param extraInfo Extended information.
     */
    virtual void onError(V2TXLivePlayer* player, int32_t code, const char* msg, void* extraInfo) {
    }

    /**
     * live player warning notification
     *
     * @param player    Player object that calls back this notification.
     * @param code      Warning code {@link V2TXLiveCode}.
     * @param msg       Warning message.
     * @param extraInfo Extended information.
     */
    virtual void onWarning(V2TXLivePlayer* player, int32_t code, const char* msg, void* extraInfo) {
    }

    /**
     * live player resolution change notification
     *
     * @param player    Player object that calls back this notification.
     * @param width     Video width.
     * @param height    Video height.
     */
    virtual void onVideoResolutionChanged(V2TXLivePlayer* player, int width, int height) {
    }

    /**
     * live player has successfully connected to the server notification
     *
     * @param player    Player object that calls back this notification.
     * @param extraInfo Extended information.
     */
    virtual void onConnected(V2TXLivePlayer* player, void* extraInfo) {
    }

    /**
     * Video playback event
     *
     * @param player    Player object that calls back this notification.
     * @param firstPlay Play for the first time.
     * @param extraInfo Extended information.
     */
    virtual void onVideoPlaying(V2TXLivePlayer* player, bool firstPlay, void* extraInfo) {
    }

    /**
     * Audio playback event
     *
     * @param player    Player object that calls back this notification.
     * @param firstPlay Play for the first time.
     * @param extraInfo Extended information.
     */
    virtual void onAudioPlaying(V2TXLivePlayer* player, bool firstPlay, void* extraInfo) {
    }

    /**
     * Video loading event
     *
     * @param player    Player object that calls back this notification.
     * @param extraInfo Extended information.
     */
    virtual void onVideoLoading(V2TXLivePlayer* player, void* extraInfo) {
    }

    /**
     * Audio loading event
     *
     * @param player    Player object that calls back this notification.
     * @param extraInfo Extended information.
     */
    virtual void onAudioLoading(V2TXLivePlayer* player, void* extraInfo) {
    }

    /**
     * Player playback volume callback
     *
     * @note  This callback notification is received after {@link enableVolumeEvaluation} is called to enable playback volume display.
     * @param player Player object that calls back this notification.
     * @param volume Current playback volume.
     */
    virtual void onPlayoutVolumeUpdate(V2TXLivePlayer* player, int32_t volume) {
    }

    /**
     * Live player statistics callback
     *
     * @param player     Player object that calls back this notification.
     * @param statistics Player statistics {@link V2TXLivePlayerStatistics}.
     */
    virtual void onStatisticsUpdate(V2TXLivePlayer* player, V2TXLivePlayerStatistics statistics) {
    }

    /**
     * Screenshot callback
     *
     * @note This callback notification is received after {@link snapshot} is called to snapshot.
     * @param player Player object that calls back this notification.
     * @param image  Screenshot data. If it is `nullptr`, it indicates that the SDK failed to take the screenshot.
     * @param length Screenshot data length. In BGRA32 format, length = width * height * 4.
     * @param width  Screenshot width.
     * @param height Screenshot height.
     * @param format Screenshot data format. Only `TRTCVideoPixelFormat_BGRA32` is supported now.
     */
    virtual void onSnapshotComplete(V2TXLivePlayer* player, const char* image, int length, int width, int height, V2TXLivePixelFormat format) {
    }

    /**
     * Custom video rendering callback
     *
     * @note  Need you call {@link enableObserveVideoFrame} to turn on the callback switch.
     * @param player     Player object that calls back this notification.
     * @param videoFrame Video frame data {@link V2TXLiveVideoFrame}.
     */
    virtual void onRenderVideoFrame(V2TXLivePlayer* player, const V2TXLiveVideoFrame* videoFrame) {
    }

    /**
     * Audio Data callback
     *
     * @note  Need you call {@link enableObserveAudioFrame} to turn on the callback switch. Please use the data of audioFrame in the current callback.
     * @param player     Player object that calls back this notification.
     * @param aduioFrame Audio frame data {@link V2TXLiveAudioFrame}.
     */
    virtual void onPlayoutAudioFrame(V2TXLivePlayer* player, const V2TXLiveAudioFrame* audioFrame) {
    }

    /**
     * Callback of receiving an SEI message. The sender calls `sendSeiMessage` in {@link V2TXLivePusher} to send an SEI
     * message
     *
     * @note You will receive this callback after calling `enableReceiveSeiMessage` in {@link V2TXLivePlayer} to enable the receiving of SEI
     * messages.
     * @param player       Player object that calls back this notification.
     * @param payloadType  The payload type of the received sei message.
     * @param data         sei message data.
     * @param dataSize     sei message data size.
     */
    virtual void onReceiveSeiMessage(V2TXLivePlayer* player, int payloadType, const uint8_t* data, uint32_t dataSize) {
    }

    /**
     * Resolution stream switch callback
     *
     * @note  This callback notification is received after {@link switchStream} is called to switch stream.
     * @param player Player object that calls back this notification.
     * @param code   Status code, 0:success, -1:timeout, -2:failed, server error, -3:failed, client error.
     * @param url    Switched playback address.
     */
    virtual void onStreamSwitched(V2TXLivePlayer* player, const char* url, int32_t code) {
    }
};

}  // namespace liteav

#endif
