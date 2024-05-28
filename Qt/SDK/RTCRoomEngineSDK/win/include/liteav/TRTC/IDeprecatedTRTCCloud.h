/**
 * Copyright (c) 2022 Tencent. All rights reserved.
 */
#ifndef __IDEPRECATEDTRTCCLOUD_H__
#define __IDEPRECATEDTRTCCLOUD_H__

#include "TRTCTypeDef.h"
#include "TRTCCloudCallback.h"

namespace liteav {

class IDeprecatedTRTCCloud {
   public:
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Disused APIs (the corresponding new APIs are recommended)
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * Enable volume reminder
     *
     * @deprecated This API is not recommended after v10.1. Please use {@link enableAudioVolumeEvaluation}(enable, params) instead.
     */
    trtc_attribute_deprecated virtual void enableAudioVolumeEvaluation(uint32_t interval) = 0;

    /**
     * Enable volume reminder
     *
     * @deprecated This API is not recommended after v11.2. Please use {@link enableAudioVolumeEvaluation}(enable, params) instead.
     */
    trtc_attribute_deprecated virtual void enableAudioVolumeEvaluation(uint32_t interval, bool enable_vad) = 0;

    /**
     * Set sound quality
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link startLocalAudio}:quality instead.
     */
    trtc_attribute_deprecated virtual void startLocalAudio() = 0;

    /**
     * Start displaying remote video image
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link startRemoteView}:streamType:view: instead.
     */
    trtc_attribute_deprecated virtual void startRemoteView(const char* userId, TXView rendView) = 0;

    /**
     * Stop displaying remote video image and pulling the video data stream of remote user
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link stopRemoteView}:streamType: instead.
     */
    trtc_attribute_deprecated virtual void stopRemoteView(const char* userId) = 0;

    /**
     * Set the rendering mode of local image
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link setLocalRenderParams} instead.
     */
    trtc_attribute_deprecated virtual void setLocalViewFillMode(TRTCVideoFillMode mode) = 0;

    /**
     * Set the clockwise rotation angle of local image
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link setLocalRenderParams} instead.
     */
    trtc_attribute_deprecated virtual void setLocalViewRotation(TRTCVideoRotation rotation) = 0;

    /**
     * Set the mirror mode of local camera's preview image
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link setLocalRenderParams} instead.
     */
    trtc_attribute_deprecated virtual void setLocalViewMirror(bool mirror) = 0;

    /**
     * Set the fill mode of substream image
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link setRemoteRenderParams}:streamType:params: instead.
     */
    trtc_attribute_deprecated virtual void setRemoteViewFillMode(const char* userId, TRTCVideoFillMode mode) = 0;

    /**
     * Set the clockwise rotation angle of remote image
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link setRemoteRenderParams}:streamType:params: instead.
     */
    trtc_attribute_deprecated virtual void setRemoteViewRotation(const char* userId, TRTCVideoRotation rotation) = 0;

    /**
     * Start displaying the substream image of remote user
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link startRemoteView}:streamType:view: instead.
     */
    trtc_attribute_deprecated virtual void startRemoteSubStreamView(const char* userId, TXView rendView) = 0;

    /**
     * Stop displaying the substream image of remote user
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link stopRemoteView}:streamType: instead.
     */
    trtc_attribute_deprecated virtual void stopRemoteSubStreamView(const char* userId) = 0;

    /**
     * Set the fill mode of substream image
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link setRemoteRenderParams}:streamType:params: instead.
     */
    trtc_attribute_deprecated virtual void setRemoteSubStreamViewFillMode(const char* userId, TRTCVideoFillMode mode) = 0;

    /**
     * Set the clockwise rotation angle of substream image
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link setRemoteRenderParams}:streamType:params: instead.
     */
    trtc_attribute_deprecated virtual void setRemoteSubStreamViewRotation(const char* userId, TRTCVideoRotation rotation) = 0;

    /**
     * Set sound quality
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link startLocalAudio}:quality instead.
     */
    trtc_attribute_deprecated virtual void setAudioQuality(TRTCAudioQuality quality) = 0;

    /**
     * Specify whether to view the big or small image
     *
     * @deprecated This API is not recommended after v8.0. Please use {@link startRemoteView}:streamType:view: instead.
     */
    trtc_attribute_deprecated virtual void setPriorRemoteVideoStreamType(TRTCVideoStreamType type) = 0;

    /**
     * Set mic volume
     *
     * @deprecated This API is not recommended after v6.9. Please use {@link setAudioCaptureVolume} instead.
     */
    trtc_attribute_deprecated virtual void setMicVolumeOnMixing(uint32_t volume) = 0;

    /**
     * Start background music
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link getAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void playBGM(const char* path) = 0;

    /**
     * Stop background music
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link getAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void stopBGM() = 0;

    /**
     * Stop background music
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link getAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void pauseBGM() = 0;

    /**
     * Stop background music
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link getAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void resumeBGM() = 0;

    /**
     * Get the total length of background music in ms
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link getMusicDurationInMS} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual uint32_t getBGMDuration(const char* path) = 0;

    /**
     * Set background music playback progress
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link seekMusicToPosInMS} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void setBGMPosition(uint32_t pos) = 0;

    /**
     * Set background music volume
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link setMusicVolume} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void setBGMVolume(uint32_t volume) = 0;

    /**
     * Set the local playback volume of background music
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link setMusicPlayoutVolume} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void setBGMPlayoutVolume(uint32_t volume) = 0;

    /**
     * Set the remote playback volume of background music
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link setBGMPublishVolume} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void setBGMPublishVolume(uint32_t volume) = 0;

    /**
     * Play sound effect
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link startPlayMusic} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void playAudioEffect(TRTCAudioEffectParam* effect) = 0;

    /**
     * Set sound effect volume
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link setMusicPublishVolume} and {@link setMusicPlayoutVolume} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void setAudioEffectVolume(int effectId, int volume) = 0;

    /**
     * Stop sound effect
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link stopPlayMusic} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void stopAudioEffect(int effectId) = 0;

    /**
     * Stop all sound effects
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link stopPlayMusic} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void stopAllAudioEffects() = 0;

    /**
     * Set the volume of all sound effects
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link setMusicPublishVolume} and {@link setMusicPlayoutVolume} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void setAllAudioEffectsVolume(int volume) = 0;

    /**
     * Pause sound effect
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link pauseAudioEffect} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void pauseAudioEffect(int effectId) = 0;

    /**
     * Pause sound effect
     *
     * @deprecated This API is not recommended after v7.3. Please use {@link resumePlayMusic} API in {@link TXAudioEffectManager} instead.
     */
    trtc_attribute_deprecated virtual void resumeAudioEffect(int effectId) = 0;

    /**
     * Enable custom video capturing mode
     *
     * @deprecated This API is not recommended after v8.5. Please use {@link enableCustomVideoCapture} instead.
     */
    trtc_attribute_deprecated virtual void enableCustomVideoCapture(bool enable) = 0;

    /**
     * Deliver captured video data to SDK
     *
     * @deprecated This API is not recommended after v8.5. Please use {@link sendCustomVideoData} instead.
     */
    trtc_attribute_deprecated virtual void sendCustomVideoData(TRTCVideoFrame* frame) = 0;

    /**
     * Pause/Resume publishing local video stream
     *
     * @deprecated This API is not recommended after v8.9. Please use {@link muteLocalVideo} (streamType, mute) instead.
     */
    trtc_attribute_deprecated virtual void muteLocalVideo(bool mute) = 0;

    /**
     * Pause/Resume subscribing to remote user's video stream
     *
     * @deprecated This API is not recommended after v8.9. Please use {@link muteRemoteVideoStream} (userId, streamType, mute) instead.
     */
    trtc_attribute_deprecated virtual void muteRemoteVideoStream(const char* userId, bool mute) = 0;

    /**
     * Start network speed test (used before room entry)
     *
     * @deprecated This API is not recommended after v9.2. Please use {@link startSpeedTest} (params) instead.
     */
    trtc_attribute_deprecated virtual void startSpeedTest(uint32_t sdkAppId, const char* userId, const char* userSig) = 0;

    /**
     * Start screen sharing
     *
     * @deprecated This API is not recommended after v7.2. Please use `startScreenCapture:streamType:encParam:` instead.
     */
    trtc_attribute_deprecated virtual void startScreenCapture(TXView rendView) = 0;

    /**
     * Set video data callback for third-party beauty filters
     *
     * @deprecated This API is not recommended after v11.4. Please use the {@link enableLocalVideoCustomProcess} and {@link setLocalVideoCustomProcessCallback} instead.
     */
    trtc_attribute_deprecated virtual int setLocalVideoProcessCallback(TRTCVideoPixelFormat pixelFormat, TRTCVideoBufferType bufferType, ITRTCVideoFrameCallback* callback) = 0;

/**
 * Get the list of cameras
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link getDevicesList} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceCollection* getCameraDevicesList() = 0;
#endif

/**
 * Set the camera to be used currently
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link setCurrentDevice} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentCameraDevice(const char* deviceId) = 0;
#endif

/**
 * Get the currently used camera
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link getCurrentDevice} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceInfo* getCurrentCameraDevice() = 0;
#endif

/**
 * Get the list of mics
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link getDevicesList} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceCollection* getMicDevicesList() = 0;
#endif

/**
 * Get the current mic device
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link getCurrentDevice} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceInfo* getCurrentMicDevice() = 0;
#endif

/**
 * Select the currently used mic
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link setCurrentDevice} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentMicDevice(const char* micId) = 0;
#endif

/**
 * Get the current mic volume
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link getCurrentDeviceVolume} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual uint32_t getCurrentMicDeviceVolume() = 0;
#endif

/**
 * Set the current mic volume
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link setCurrentDeviceVolume} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentMicDeviceVolume(uint32_t volume) = 0;
#endif

/**
 * Set the mute status of the current system mic
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link setCurrentDeviceMute} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentMicDeviceMute(bool mute) = 0;
#endif

/**
 * Get the mute status of the current system mic
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link getCurrentDeviceMute} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual bool getCurrentMicDeviceMute() = 0;
#endif

/**
 * Get the list of speakers
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link getDevicesList} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceCollection* getSpeakerDevicesList() = 0;
#endif

/**
 * Get the currently used speaker
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link getCurrentDevice} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceInfo* getCurrentSpeakerDevice() = 0;
#endif

/**
 * Set the speaker to use
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link setCurrentDevice} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentSpeakerDevice(const char* speakerId) = 0;
#endif

/**
 * Get the current speaker volume
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link getCurrentDeviceVolume} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual uint32_t getCurrentSpeakerVolume() = 0;
#endif

/**
 * Set the current speaker volume
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link setCurrentDeviceVolume} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentSpeakerVolume(uint32_t volume) = 0;
#endif

/**
 * Get the mute status of the current system speaker
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link getCurrentDeviceMute} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual bool getCurrentSpeakerDeviceMute() = 0;
#endif

/**
 * Set whether to mute the current system speaker
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link setCurrentDeviceMute} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentSpeakerDeviceMute(bool mute) = 0;
#endif

/**
 * Start camera test
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link startCameraDeviceTest} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void startCameraDeviceTest(TXView renderView) = 0;
#endif

#if _WIN32
    trtc_attribute_deprecated virtual void startCameraDeviceTest(ITRTCVideoRenderCallback* callback) = 0;
#endif

/**
 * Start camera test
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link stopCameraDeviceTest} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void stopCameraDeviceTest() = 0;
#endif

/**
 * Start mic test
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link startMicDeviceTest} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void startMicDeviceTest(uint32_t interval) = 0;
#endif

/**
 * Start mic test
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link stopMicDeviceTest} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void stopMicDeviceTest() = 0;
#endif

/**
 * Start speaker test
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link startSpeakerDeviceTest} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void startSpeakerDeviceTest(const char* testAudioFilePath) = 0;
#endif

/**
 * Stop speaker test
 *
 * @deprecated This API is not recommended after v8.0. Please use the {@link stopSpeakerDeviceTest} API in {@link TXDeviceManager} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void stopSpeakerDeviceTest() = 0;
#endif

/**
 * start in-app screen sharing (for iOS 13.0 and above only)
 *
 * @deprecated This API is not recommended after v8.6. Please use {@link startScreenCaptureInApp} instead.
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void selectScreenCaptureTarget(const TRTCScreenCaptureSourceInfo& source, const RECT& captureRect, bool captureMouse = true, bool highlightWindow = true) = 0;
#endif

    /**
     * Set the direction of image output by video encoder
     *
     * @deprecated It is deprecated starting from v11.7.
     */
    trtc_attribute_deprecated virtual void setVideoEncoderRotation(TRTCVideoRotation rotation) = 0;

    /**
     * Set the mirror mode of image output by encoder
     *
     * @deprecated It is deprecated starting from v11.7.
     */
    trtc_attribute_deprecated virtual void setVideoEncoderMirror(bool mirror) = 0;
};
}  // namespace liteav
#endif
