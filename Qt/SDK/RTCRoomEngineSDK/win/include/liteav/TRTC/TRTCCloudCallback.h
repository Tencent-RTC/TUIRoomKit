/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   ITRTCCloudCallback @ TXLiteAVSDK
 * Function: event callback APIs for TRTC’s video call feature
 */
#ifndef __TRTCCLOUDCALLBACK_H__
#define __TRTCCLOUDCALLBACK_H__

#include "TRTCTypeDef.h"
#include "ITXDeviceManager.h"
#include "TXLiteAVCode.h"
#include "ITRTCStatistics.h"

namespace liteav {

class ITRTCCloudCallback {
   public:
    virtual ~ITRTCCloudCallback() {
    }

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Error and warning events
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 1.1 Error event callback
     *
     * Error event, which indicates that the SDK threw an irrecoverable error such as room entry failure or failure to start device
     * For more information, see [Error Codes](https://intl.cloud.tencent.com/document/product/647/35135).
     * @param errCode Error code
     * @param errMsg Error message
     * @param extInfo Extended field. Certain error codes may carry extra information for troubleshooting.
     */
    virtual void onError(TXLiteAVError errCode, const char* errMsg, void* extraInfo) = 0;

    /**
     * 1.2 Warning event callback
     *
     * Warning event, which indicates that the SDK threw an error requiring attention, such as video lag or high CPU usage
     * For more information, see [Error Codes](https://intl.cloud.tencent.com/document/product/647/35135).
     * @param warningCode Warning code
     * @param warningMsg Warning message
     * @param extInfo Extended field. Certain warning codes may carry extra information for troubleshooting.
     */
    virtual void onWarning(TXLiteAVWarning warningCode, const char* warningMsg, void* extraInfo) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Room event callback
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 2.1 Whether room entry is successful
     *
     * After calling the `enterRoom()` API in `TRTCCloud` to enter a room, you will receive the `onEnterRoom(result)` callback from `TRTCCloudDelegate`.
     *  - If room entry succeeded, `result` will be a positive number (`result` > 0), indicating the time in milliseconds (ms) the room entry takes.
     *  - If room entry failed, `result` will be a negative number (result < 0), indicating the error code for the failure.
     *  For more information on the error codes for room entry failure, see [Error Codes](https://intl.cloud.tencent.com/document/product/647/35135).
     * @note
     * 1. In TRTC versions below 6.6, the `onEnterRoom(result)` callback is returned only if room entry succeeds, and the `onError()` callback is returned if room entry fails.
     * 2. In TRTC 6.6 and above, the `onEnterRoom(result)` callback is returned regardless of whether room entry succeeds or fails, and the `onError()` callback is also returned if room entry fails.
     * @param result If `result` is greater than 0, it indicates the time (in ms) the room entry takes; if `result` is less than 0, it represents the error code for room entry.
     */
    virtual void onEnterRoom(int result) = 0;

    /**
     * 2.2 Room exit
     *
     * Calling the `exitRoom()` API in `TRTCCloud` will trigger the execution of room exit-related logic, such as releasing resources of audio/video devices and codecs.
     * After all resources occupied by the SDK are released, the SDK will return the `onExitRoom()` callback.
     * If you need to call `enterRoom()` again or switch to another audio/video SDK, please wait until you receive the `onExitRoom()` callback.
     * Otherwise, you may encounter problems such as the camera or mic being occupied.
     * @param reason Reason for room exit. `0`: the user called `exitRoom` to exit the room; `1`: the user was removed from the room by the server; `2`: the room was dismissed.
     */
    virtual void onExitRoom(int reason) = 0;

    /**
     * 2.3 Role switching
     *
     * You can call the `switchRole()` API in `TRTCCloud` to switch between the anchor and audience roles. This is accompanied by a line switching process.
     * After the switching, the SDK will return the `onSwitchRole()` event callback.
     * @param errCode Error code. `ERR_NULL` indicates a successful switch. For more information, please see [Error Codes](https://intl.cloud.tencent.com/document/product/647/35135).
     * @param errMsg  Error message
     */
    virtual void onSwitchRole(TXLiteAVError errCode, const char* errMsg) {
    }

    /**
     * 2.4 Result of room switching
     *
     * You can call the `switchRoom()` API in `TRTCCloud` to switch from one room to another.
     * After the switching, the SDK will return the `onSwitchRoom()` event callback.
     * @param errCode Error code. `ERR_NULL` indicates a successful switch. For more information, please see [Error Codes](https://intl.cloud.tencent.com/document/product/647/35124).
     * @param errMsg  Error message
     */
    virtual void onSwitchRoom(TXLiteAVError errCode, const char* errMsg) {
    }

    /**
     * 2.5 Result of requesting cross-room call
     *
     * You can call the `connectOtherRoom()` API in `TRTCCloud` to establish a video call with the anchor of another room. This is the “anchor competition” feature.
     * The caller will receive the `onConnectOtherRoom()` callback, which can be used to determine whether the cross-room call is successful.
     * If it is successful, all users in either room will receive the `onUserVideoAvailable()` callback from the anchor of the other room.
     * @param userId  The user ID of the anchor (in another room) to be called
     * @param errCode Error code. `ERR_NULL` indicates that cross-room connection is established successfully. For more information, please see [Error Codes](https://intl.cloud.tencent.com/document/product/647/35135).
     * @param errMsg  Error message
     */
    virtual void onConnectOtherRoom(const char* userId, TXLiteAVError errCode, const char* errMsg) {
    }

    /**
     * 2.6 Result of ending cross-room call
     */
    virtual void onDisconnectOtherRoom(TXLiteAVError errCode, const char* errMsg) {
    }

    /**
     * 2.7 Result of changing the upstream capability of the cross-room anchor
     */
    virtual void onUpdateOtherRoomForwardMode(TXLiteAVError errCode, const char* errMsg) {
    }

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    User event callback
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 3.1 A user entered the room
     *
     * Due to performance concerns, this callback works differently in different scenarios (i.e., `AppScene`, which you can specify by setting the second parameter when calling `enterRoom`).
     *  - Live streaming scenarios (`TRTCAppSceneLIVE` or `TRTCAppSceneVoiceChatRoom`): in live streaming scenarios, a user is either in the role of an anchor or audience. The callback is returned only when an anchor enters the room.
     *  - Call scenarios (`TRTCAppSceneVideoCall` or `TRTCAppSceneAudioCall`): in call scenarios, the concept of roles does not apply (all users can be considered as anchors), and the callback is returned when any user enters the room.
     * @param userId User ID of the remote user
     * @note
     * 1. The `onRemoteUserEnterRoom` callback indicates that a user entered the room, but it does not necessarily mean that the user enabled audio or video.
     * 2. If you want to know whether a user enabled video, we recommend you use the `onUserVideoAvailable()` callback.
     */
    virtual void onRemoteUserEnterRoom(const char* userId) {
    }

    /**
     * 3.2 A user exited the room
     *
     * As with `onRemoteUserEnterRoom`, this callback works differently in different scenarios (i.e., `AppScene`, which you can specify by setting the second parameter when calling `enterRoom`).
     *  - Live streaming scenarios (`TRTCAppSceneLIVE` or `TRTCAppSceneVoiceChatRoom`): the callback is triggered only when an anchor exits the room.
     *  - Call scenarios (`TRTCAppSceneVideoCall` or `TRTCAppSceneAudioCall`): in call scenarios, the concept of roles does not apply, and the callback is returned when any user exits the room.
     * @param userId User ID of the remote user
     * @param reason Reason for room exit. `0`: the user exited the room voluntarily; `1`: the user exited the room due to timeout; `2`: the user was removed from the room; `3`: the anchor user exited the room due to switch to audience.
     */
    virtual void onRemoteUserLeaveRoom(const char* userId, int reason) {
    }

    /**
     * 3.3 A remote user published/unpublished primary stream video
     *
     * The primary stream is usually used for camera images. If you receive the `onUserVideoAvailable(userId, true)` callback, it indicates that the user has available primary stream video.
     * You can then call {@link startRemoteView} to subscribe to the remote user’s video. If the subscription is successful, you will receive the `onFirstVideoFrame(userid)` callback, which indicates that the first video frame of the user is
     * rendered. If you receive the `onUserVideoAvailable(userId, false)` callback, it indicates that the video of the remote user is disabled, which may be because the user called {@link muteLocalVideo} or {@link stopLocalPreview}.
     * @param userId User ID of the remote user
     * @param available Whether the user published (or unpublished) primary stream video. `true`: published; `false`: unpublished
     */
    virtual void onUserVideoAvailable(const char* userId, bool available) {
    }

    /**
     * 3.4 A remote user published/unpublished substream video
     *
     * The substream is usually used for screen sharing images. If you receive the `onUserSubStreamAvailable(userId, true)` callback, it indicates that the user has available substream video.
     * You can then call {@link startRemoteView} to subscribe to the remote user’s video. If the subscription is successful, you will receive the `onFirstVideoFrame(userid)` callback, which indicates that the first frame of the user is rendered.
     * @param userId User ID of the remote user
     * @param available Whether the user published (or unpublished) substream video. `true`: published; `false`: unpublished
     * @note The API used to display substream images is {@link startRemoteView}, not {@link startRemoteSubStreamView}, startRemoteSubStreamView is deprecated.
     */
    virtual void onUserSubStreamAvailable(const char* userId, bool available) {
    }

    /**
     * 3.5 A remote user published/unpublished audio
     *
     * If you receive the `onUserAudioAvailable(userId, true)` callback, it indicates that the user published audio.
     * - In auto-subscription mode, the SDK will play the user’s audio automatically.
     * - In manual subscription mode, you can call {@link muteRemoteAudio}(userid, false) to play the user’s audio.
     * @param userId User ID of the remote user
     * @param available Whether the user published (or unpublished) audio. `true`: published; `false`: unpublished
     * @note The auto-subscription mode is used by default. You can switch to the manual subscription mode by calling {@link setDefaultStreamRecvMode}, but it must be called before room entry for the switch to take effect.
     */
    virtual void onUserAudioAvailable(const char* userId, bool available) {
    }

    /**
     * 3.6 The SDK started rendering the first video frame of the local or a remote user
     *
     * The SDK returns this event callback when it starts rendering your first video frame or that of a remote user. The `userId` in the callback can help you determine whether the frame is yours or a remote user’s.
     * - If `userId` is empty, it indicates that the SDK has started rendering your first video frame. The precondition is that you have called {@link startLocalPreview} or {@link startScreenCapture}.
     * - If `userId` is not empty, it indicates that the SDK has started rendering the first video frame of a remote user. The precondition is that you have called {@link startRemoteView} to subscribe to the user’s video.
     * @param userId The user ID of the local or a remote user. If it is empty, it indicates that the first local video frame is available; if it is not empty, it indicates that the first video frame of a remote user is available.
     * @param streamType Video stream type. The primary stream (`Main`) is usually used for camera images, and the substream (`Sub`) for screen sharing images.
     * @param width  Video width
     * @param height Video height
     * @note
     * 1. The callback of the first local video frame being rendered is triggered only after you call {@link startLocalPreview} or {@link startScreenCapture}.
     * 2. The callback of the first video frame of a remote user being rendered is triggered only after you call {@link startRemoteView} or {@link startRemoteSubStreamView}.
     */
    virtual void onFirstVideoFrame(const char* userId, const TRTCVideoStreamType streamType, const int width, const int height) {
    }

    /**
     * 3.7 The SDK started playing the first audio frame of a remote user
     *
     * The SDK returns this callback when it plays the first audio frame of a remote user. The callback is not returned for the playing of the first audio frame of the local user.
     * @param userId User ID of the remote user
     */
    virtual void onFirstAudioFrame(const char* userId) {
    }

    /**
     * 3.8 The first local video frame was published
     *
     * After you enter a room and call {@link startLocalPreview} or {@link startScreenCapture} to enable local video capturing (whichever happens first),
     * the SDK will start video encoding and publish the local video data via its network module to the cloud.
     * It returns the `onSendFirstLocalVideoFrame` callback after publishing the first local video frame.
     * @param streamType Video stream type. The primary stream (`Main`) is usually used for camera images, and the substream (`Sub`) for screen sharing images.
     */
    virtual void onSendFirstLocalVideoFrame(const TRTCVideoStreamType streamType) {
    }

    /**
     * 3.9 The first local audio frame was published
     *
     * After you enter a room and call {@link startLocalAudio} to enable audio capturing (whichever happens first),
     * the SDK will start audio encoding and publish the local audio data via its network module to the cloud.
     * The SDK returns the `onSendFirstLocalAudioFrame` callback after sending the first local audio frame.
     */
    virtual void onSendFirstLocalAudioFrame() {
    }

    /**
     * 3.10 Change of remote video status
     *
     * You can use this callback to get the status (`Playing`, `Loading`, or `Stopped`) of the video of each remote user and display it on the UI.
     * @param userId User ID
     * @param streamType Video stream type. The primary stream (`Main`) is usually used for camera images, and the substream (`Sub`) for screen sharing images.
     * @param status Video status, which may be `Playing`, `Loading`, or `Stopped`
     * @param reason Reason for the change of status
     * @param extraInfo Extra information
     */
    virtual void onRemoteVideoStatusUpdated(const char* userId, TRTCVideoStreamType streamType, TRTCAVStatusType status, TRTCAVStatusChangeReason reason, void* extrainfo) {
    }

    /**
     * 3.11 Change of remote audio status
     *
     * You can use this callback to get the status (`Playing`, `Loading`, or `Stopped`) of the audio of each remote user and display it on the UI.
     * @param userId User ID
     * @param status Audio status, which may be `Playing`, `Loading`, or `Stopped`
     * @param reason Reason for the change of status
     * @param extraInfo Extra information
     */
    virtual void onRemoteAudioStatusUpdated(const char* userId, TRTCAVStatusType status, TRTCAVStatusChangeReason reason, void* extrainfo) {
    }

    /**
     * 3.12 Change of remote video size
     *
     * If you receive the `onUserVideoSizeChanged(userId, streamtype, newWidth, newHeight)` callback, it indicates that the user changed the video size. It may be triggered by `setVideoEncoderParam` or `setSubStreamEncoderParam`.
     * @param userId User ID
     * @param streamType Video stream type. The primary stream (`Main`) is usually used for camera images, and the substream (`Sub`) for screen sharing images.
     * @param newWidth Video width
     * @param newHeight Video height
     */
    virtual void onUserVideoSizeChanged(const char* userId, TRTCVideoStreamType streamType, int newWidth, int newHeight) {
    }

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Callback of statistics on network and technical metrics
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 4.1 Real-time network quality statistics
     *
     * This callback is returned every 2 seconds and notifies you of the upstream and downstream network quality detected by the SDK.
     * The SDK uses a built-in proprietary algorithm to assess the current latency, bandwidth, and stability of the network and returns a result.
     * If the result is `1` (excellent), it means that the current network conditions are excellent; if it is `6` (down), it means that the current network conditions are too bad to support TRTC calls.
     * @param localQuality Upstream network quality
     * @param remoteQuality Downstream network quality, it refers to the data quality finally measured on the local side after the data flow passes through a complete transmission link of "remote ->cloud ->local". Therefore, the downlink network
     * quality here represents the joint impact of the remote uplink and the local downlink.
     * @note The uplink quality of remote users cannot be determined independently through this interface.
     */
    virtual void onNetworkQuality(TRTCQualityInfo localQuality, TRTCQualityInfo* remoteQuality, uint32_t remoteQualityCount) {
    }

    /**
     * 4.2 Real-time statistics on technical metrics
     *
     * This callback is returned every 2 seconds and notifies you of the statistics on technical metrics related to video, audio, and network. The metrics are listed in {@link TRTCStatistics}:
     * - Video statistics: video resolution (`resolution`), frame rate (`FPS`), bitrate (`bitrate`), etc.
     * - Audio statistics: audio sample rate (`samplerate`), number of audio channels (`channel`), bitrate (`bitrate`), etc.
     * - Network statistics: the round trip time (`rtt`) between the SDK and the cloud (SDK -> Cloud -> SDK), package loss rate (`loss`), upstream traffic (`sentBytes`), downstream traffic (`receivedBytes`), etc.
     * @param statistics Statistics, including local statistics and the statistics of remote users. For details, please see {@link TRTCStatistics}.
     * @note If you want to learn about only the current network quality and do not want to spend much time analyzing the statistics returned by this callback, we recommend you use {@link onNetworkQuality}.
     */
    virtual void onStatistics(const TRTCStatistics& statistics) {
    }

    /**
     * 4.3 Callback of network speed test
     *
     * The callback is triggered by {@link startSpeedTest:}.
     * @param result Speed test data, including loss rates, rtt and bandwidth rates, please refer to {@link TRTCSpeedTestResult} for details.
     */
    virtual void onSpeedTestResult(const TRTCSpeedTestResult& result) {
    }

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Callback of connection to the cloud
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 5.1 The SDK was disconnected from the cloud
     *
     * The SDK returns this callback when it is disconnected from the cloud, which may be caused by network unavailability or change of network, for example, when the user walks into an elevator.
     * After returning this callback, the SDK will attempt to reconnect to the cloud, and will return the {@link onTryToReconnect} callback. When it is reconnected, it will return the {@link onConnectionRecovery} callback.
     * In other words, the SDK proceeds from one event to the next in the following order:
     * ![](https://qcloudimg.tencent-cloud.cn/raw/fb3c40a4fca55b0010d385cf3b2472cd.png)
     */
    virtual void onConnectionLost() {
    }

    /**
     * 5.2 The SDK is reconnecting to the cloud
     *
     * When the SDK is disconnected from the cloud, it returns the {@link onConnectionLost} callback. It then attempts to reconnect and returns this callback ({@link onTryToReconnect}). After it is reconnected, it returns the {@link
     * onConnectionRecovery} callback.
     */
    virtual void onTryToReconnect() {
    }

    /**
     * 5.3 The SDK is reconnected to the cloud
     *
     * When the SDK is disconnected from the cloud, it returns the {@link onConnectionLost} callback. It then attempts to reconnect and returns the {@link onTryToReconnect} callback. After it is reconnected, it returns this callback ({@link
     * onConnectionRecovery}).
     */
    virtual void onConnectionRecovery() {
    }

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Callback of hardware events
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 6.1 The camera is ready
     *
     * After you call {@link startLocalPreivew}, the SDK will try to start the camera and return this callback if the camera is started.
     * If it fails to start the camera, it’s probably because the application does not have access to the camera or the camera is being used.
     * You can capture the {@link onError} callback to learn about the exception and let users know via UI messages.
     */
    virtual void onCameraDidReady() {
    }

    /**
     * 6.2 The mic is ready
     *
     * After you call {@link startLocalAudio}, the SDK will try to start the mic and return this callback if the mic is started.
     * If it fails to start the mic, it’s probably because the application does not have access to the mic or the mic is being used.
     * You can capture the {@link onError} callback to learn about the exception and let users know via UI messages.
     */
    virtual void onMicDidReady() {
    }

    /**
     * 6.4 Volume
     *
     * The SDK can assess the volume of each channel and return this callback on a regular basis. You can display, for example, a waveform or volume bar on the UI based on the statistics returned.
     * You need to first call {@link enableAudioVolumeEvaluation} to enable the feature and set the interval for the callback.
     * Note that the SDK returns this callback at the specified interval regardless of whether someone is speaking in the room.
     * @param userVolumes An array that represents the volume of all users who are speaking in the room. Value range: 0-100
     * @param totalVolume The total volume of all remote users. Value range: 0-100
     * @note `userVolumes` is an array. If `userId` is empty, the elements in the array represent the volume of the local user’s audio. Otherwise, they represent the volume of a remote user’s audio.
     */
    virtual void onUserVoiceVolume(TRTCVolumeInfo* userVolumes, uint32_t userVolumesCount, uint32_t totalVolume) {
    }

/**
 * 6.5 The status of a local device changed (for desktop OS only)
 *
 * The SDK returns this callback when a local device (camera, mic, or speaker) is connected or disconnected.
 * @param deviceId Device ID
 * @param deviceType Device type
 * @param state Device status. `0`: connected; `1`: disconnected; `2`: started
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void onDeviceChange(const char* deviceId, TRTCDeviceType type, TRTCDeviceState state) {
    }
#endif

/**
 * 6.6 The capturing volume of the mic changed
 *
 * On desktop OS such as macOS and Windows, users can set the capturing volume of the mic in the audio control panel.
 * The higher volume a user sets, the higher the volume of raw audio captured by the mic.
 * On some keyboards and laptops, users can also mute the mic by pressing a key (whose icon is a crossed out mic).
 * When users set the mic capturing volume via the UI or a keyboard shortcut, the SDK will return this callback.
 * @param volume System audio capturing volume, which users can set in the audio control panel. Value range: 0-100
 * @param muted Whether the mic is muted. `true`: muted; `false`: unmuted
 * @note You need to call {@link enableAudioVolumeEvaluation} and set the callback interval (`interval` > 0) to enable the callback. To disable the callback, set `interval` to `0`.
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void onAudioDeviceCaptureVolumeChanged(uint32_t volume, bool muted) {
    }
#endif

/**
 * 6.7 The playback volume changed
 *
 * On desktop OS such as macOS and Windows, users can set the system’s playback volume in the audio control panel.
 * On some keyboards and laptops, users can also mute the speaker by pressing a key (whose icon is a crossed out speaker).
 * When users set the system’s playback volume via the UI or a keyboard shortcut, the SDK will return this callback.
 * @param volume The system playback volume, which users can set in the audio control panel. Value range: 0-100
 * @param muted Whether the speaker is muted. `true`: muted; `false`: unmuted
 * @note You need to call {@link enableAudioVolumeEvaluation} and set the callback interval (`interval` > 0) to enable the callback. To disable the callback, set `interval` to `0`.
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void onAudioDevicePlayoutVolumeChanged(uint32_t volume, bool muted) {
    }
#endif

/**
 * 6.8 Whether system audio capturing is enabled successfully (for macOS only)
 *
 * On macOS, you can call {@link startSystemAudioLoopback} to install an audio driver and have the SDK capture the audio played back by the system.
 * In use cases such as video teaching and music live streaming, the teacher can use this feature to let the SDK capture the sound of the video played by his or her computer, so that students in the room can hear the sound too.
 * The SDK returns this callback after trying to enable system audio capturing. To determine whether it is actually enabled, pay attention to the error parameter in the callback.
 * @param err If it is `ERR_NULL`, system audio capturing is enabled successfully. Otherwise, it is not.
 */
#if TARGET_PLATFORM_MAC
    virtual void onSystemAudioLoopbackError(TXLiteAVError errCode) {
    }
#endif

/**
 * 6.9 Volume during mic test
 *
 * When you call {@link startMicDeviceTest} to test the mic, the SDK will keep returning this callback. The `volume` parameter represents the volume of the audio captured by the mic.
 * If the value of the `volume` parameter fluctuates, the mic works properly. If it is `0` throughout the test, it indicates that there is a problem with the mic, and users should be prompted to switch to a different mic.
 * @param volume Captured mic volume. Value range: 0-100
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void onTestMicVolume(uint32_t volume) {
    }
#endif

/**
 * 6.10 Volume during speaker test
 *
 * When you call {@link startSpeakerDeviceTest} to test the speaker, the SDK will keep returning this callback.
 * The `volume` parameter in the callback represents the volume of audio sent by the SDK to the speaker for playback. If its value fluctuates but users cannot hear any sound, the speaker is not working properly.
 * @param volume The volume of audio sent by the SDK to the speaker for playback. Value range: 0-100
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void onTestSpeakerVolume(uint32_t volume) {
    }
#endif

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Callback of the receipt of a custom message
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 7.1 Receipt of custom message
     *
     * When a user in a room uses {@link sendCustomCmdMsg} to send a custom message, other users in the room can receive the message through the `onRecvCustomCmdMsg` callback.
     *
     * @param userId User ID
     * @param cmdID Command ID
     * @param seq   Message serial number
     * @param message Message data
     */
    virtual void onRecvCustomCmdMsg(const char* userId, int32_t cmdID, uint32_t seq, const uint8_t* message, uint32_t messageSize) {
    }

    /**
     * 7.2 Loss of custom message
     *
     * When you use {@link sendCustomCmdMsg} to send a custom UDP message, even if you enable reliable transfer (by setting `reliable` to `true`), there is still a chance of message loss. Reliable transfer only helps maintain a low probability of
     * message loss, which meets the reliability requirements in most cases. If the sender sets `reliable` to `true`, the SDK will use this callback to notify the recipient of the number of custom messages lost during a specified time period (usually
     * 5s) in the past.
     * @param userId User ID
     * @param cmdID Command ID
     * @param errCode Error code
     * @param missed Number of lost messages
     * @note The recipient receives this callback only if the sender sets `reliable` to `true`.
     */
    virtual void onMissCustomCmdMsg(const char* userId, int32_t cmdID, int32_t errCode, int32_t missed) {
    }

    /**
     * 7.3 Receipt of SEI message
     *
     * If a user in the room uses {@link sendSEIMsg} to send an SEI message via video frames, other users in the room can receive the message through the `onRecvSEIMsg` callback.
     *
     * @param userId User ID
     * @param message  Data
     */
    virtual void onRecvSEIMsg(const char* userId, const uint8_t* message, uint32_t messageSize) {
    }

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    CDN event callback
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 8.1 Started publishing to Tencent Cloud CSS CDN
     *
     * When you call {@link startPublishing} to publish streams to Tencent Cloud CSS CDN, the SDK will sync the command to the CVM immediately.
     * The SDK will then receive the execution result from the CVM and return the result to you via this callback.
     *
     * @param err `0`: successful; other values: failed
     * @param errMsg Error message
     */
    virtual void onStartPublishing(int err, const char* errMsg) {
    }

    /**
     * 8.2 Stopped publishing to Tencent Cloud CSS CDN
     *
     * When you call {@link stopPublishing} to stop publishing streams to Tencent Cloud CSS CDN, the SDK will sync the command to the CVM immediately.
     * The SDK will then receive the execution result from the CVM and return the result to you via this callback.
     * @param err `0`: successful; other values: failed
     * @param errMsg Error message
     */
    virtual void onStopPublishing(int err, const char* errMsg) {
    }

    /**
     * 8.3 Started publishing to non-Tencent Cloud’s live streaming CDN
     *
     * When you call {@link startPublishCDNStream} to start publishing streams to a non-Tencent Cloud’s live streaming CDN, the SDK will sync the command to the CVM immediately.
     * The SDK will then receive the execution result from the CVM and return the result to you via this callback.
     * @param err `0`: successful; other values: failed
     * @param errMsg Error message
     * @note If you receive a callback that the command is executed successfully, it only means that your command was sent to Tencent Cloud’s backend server. If the CDN vendor does not accept your streams, the publishing will still fail.
     */
    virtual void onStartPublishCDNStream(int errCode, const char* errMsg) {
    }

    /**
     * 8.4 Stopped publishing to non-Tencent Cloud’s live streaming CDN
     *
     * When you call {@link stopPublishCDNStream} to stop publishing to a non-Tencent Cloud’s live streaming CDN, the SDK will sync the command to the CVM immediately.
     * The SDK will then receive the execution result from the CVM and return the result to you via this callback.
     * @param err `0`: successful; other values: failed
     * @param errMsg Error message
     */
    virtual void onStopPublishCDNStream(int errCode, const char* errMsg) {
    }

    /**
     * 8.5 Set the layout and transcoding parameters for On-Cloud MixTranscoding
     *
     * When you call {@link setMixTranscodingConfig} to modify the layout and transcoding parameters for On-Cloud MixTranscoding, the SDK will sync the command to the CVM immediately.
     * The SDK will then receive the execution result from the CVM and return the result to you via this callback.
     * @param err `0`: successful; other values: failed
     * @param errMsg Error message
     */
    virtual void onSetMixTranscodingConfig(int err, const char* errMsg) {
    }

    /**
     * 8.6 Callback for starting to publish
     *
     * When you call {@link startPublishMediaStream} to publish a stream to the TRTC backend, the SDK will immediately update the command to the cloud server.
     * The SDK will then receive the publishing result from the cloud server and will send the result to you via this callback.
     * @param taskId: If a request is successful, a task ID will be returned via the callback. You need to provide this task ID when you call {@link updatePublishMediaStream} to modify publishing parameters or {@link stopPublishMediaStream} to stop
     * publishing.
     * @param code: `0`: Successful; other values: Failed.
     * @param message: The callback information.
     * @param extraInfo: Additional information. For some error codes, there may be additional information to help you troubleshoot the issues.
     */
    virtual void onStartPublishMediaStream(const char* taskId, int code, const char* message, void* extraInfo) {
    }

    /**
     * 8.7 Callback for modifying publishing parameters
     *
     * When you call {@link updatePublishMediaStream} to modify publishing parameters, the SDK will immediately update the command to the cloud server.
     * The SDK will then receive the modification result from the cloud server and will send the result to you via this callback.
     * @param taskId: The task ID you pass in when calling {@link updatePublishMediaStream}, which is used to identify a request.
     * @param code: `0`: Successful; other values: Failed.
     * @param message: The callback information.
     * @param extraInfo: Additional information. For some error codes, there may be additional information to help you troubleshoot the issues.
     */
    virtual void onUpdatePublishMediaStream(const char* taskId, int code, const char* message, void* extraInfo) {
    }

    /**
     * 8.8 Callback for stopping publishing
     *
     * When you call {@link stopPublishMediaStream} to stop publishing, the SDK will immediately update the command to the cloud server.
     * The SDK will then receive the modification result from the cloud server and will send the result to you via this callback.
     * @param taskId: The task ID you pass in when calling {@link stopPublishMediaStream}, which is used to identify a request.
     * @param code: `0`: Successful; other values: Failed.
     * @param message: The callback information.
     * @param extraInfo: Additional information. For some error codes, there may be additional information to help you troubleshoot the issues.
     */
    virtual void onStopPublishMediaStream(const char* taskId, int code, const char* message, void* extraInfo) {
    }

    /**
     * 8.9 Callback for change of RTMP/RTMPS publishing status
     *
     * When you call {@link startPublishMediaStream} to publish a stream to the TRTC backend, the SDK will immediately update the command to the cloud server.
     * If you set the publishing destination ({@link TRTCPublishTarget}) to the URL of Tencent Cloud or a third-party CDN, you will be notified of the RTMP/RTMPS publishing status via this callback.
     * @param cdnUrl: The URL you specify in {@link TRTCPublishTarget} when you call {@link startPublishMediaStream}.
     * @param status: The publishing status.
     *  - 0: The publishing has not started yet or has ended. This value will be returned after you call {@link stopPublishMediaStream}.
     *  - 1: The TRTC server is connecting to the CDN server. If the first attempt fails, the TRTC backend will retry multiple times and will return this value via the callback (every five seconds). After publishing succeeds, the value `2` will be
     * returned. If a server error occurs or publishing is still unsuccessful after 60 seconds, the value `4` will be returned.
     *  - 2: The TRTC server is publishing to the CDN. This value will be returned if the publishing succeeds.
     *  - 3: The TRTC server is disconnected from the CDN server and is reconnecting. If a CDN error occurs or publishing is interrupted, the TRTC backend will try to reconnect and resume publishing and will return this value via the callback (every
     * five seconds). After publishing resumes, the value `2` will be returned. If a server error occurs or the attempt to resume publishing is still unsuccessful after 60 seconds, the value `4` will be returned.
     *  - 4: The TRTC server is disconnected from the CDN server and failed to reconnect within the timeout period. In this case, the publishing is deemed to have failed. You can call {@link updatePublishMediaStream} to try again.
     *  - 5: The TRTC server is disconnecting from the CDN server. After you call {@link stopPublishMediaStream}, the SDK will return this value first and then the value `0`.
     * @param code: The publishing result. `0`: Successful; other values: Failed.
     * @param message: The publishing information.
     * @param extraInfo: Additional information. For some error codes, there may be additional information to help you troubleshoot the issues.
     */
    virtual void onCdnStreamStateChanged(const char* cdnUrl, int status, int code, const char* msg, void* extraInfo) {
    }

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Screen sharing event callback
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 9.1 Screen sharing started
     *
     * The SDK returns this callback when you call {@link startScreenCapture} and other APIs to start screen sharing.
     */
    virtual void onScreenCaptureStarted() {
    }

    /**
     * 9.2 Screen sharing was paused
     *
     * The SDK returns this callback when you call {@link pauseScreenCapture} to pause screen sharing.
     * @param reason Reason.
     * - `0`: the user paused screen sharing.
     * - `1`: screen sharing was paused because the shared window became invisible(Mac). screen sharing was paused because setting parameters(Windows).
     * - `2`: screen sharing was paused because the shared window became minimum(only for Windows).
     * - `3`: screen sharing was paused because the shared window became invisible(only for Windows).
     */
    virtual void onScreenCapturePaused(int reason) {
    }

    /**
     * 9.3 Screen sharing was resumed
     *
     * The SDK returns this callback when you call {@link resumeScreenCapture} to resume screen sharing.
     * @param reason Reason.
     * - `0`: the user resumed screen sharing.
     * - `1`: screen sharing was resumed automatically after the shared window became visible again(Mac). screen sharing was resumed automatically after setting parameters(Windows).
     * - `2`: screen sharing was resumed automatically after the shared window became minimize recovery(only for Windows).
     * - `3`: screen sharing was resumed automatically after the shared window became visible again(only for Windows).
     */
    virtual void onScreenCaptureResumed(int reason) {
    }

    /**
     * 9.4 Screen sharing stopped
     *
     * The SDK returns this callback when you call {@link stopScreenCapture} to stop screen sharing.
     * @param reason Reason. `0`: the user stopped screen sharing; `1`: screen sharing stopped because the shared window was closed.
     */
    virtual void onScreenCaptureStoped(int reason) {
    }

/**
 * 9.5 The shared window was covered (for Windows only)
 *
 * The SDK returns this callback when the shared window is covered and cannot be captured. Upon receiving this callback, you can prompt users via the UI to move and expose the window.
 */
#ifdef _WIN32
    virtual void onScreenCaptureCovered() {
    }
#endif

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Callback of local recording and screenshot events
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 10.1 Local recording started
     *
     * When you call {@link startLocalRecording} to start local recording, the SDK returns this callback to notify you whether recording is started successfully.
     * @param errCode status.
     *               -  0: successful.
     *               - -1: failed.
     *               - -2: unsupported format.
     *               - -6: recording has been started. Stop recording first.
     *               - -7: recording file already exists and needs to be deleted.
     *               - -8: recording directory does not have the write permission. Please check the directory permission.
     * @param storagePath Storage path of recording file
     */
    virtual void onLocalRecordBegin(int errCode, const char* storagePath) {
    }

    /**
     * 10.2 Local media is being recorded
     *
     * The SDK returns this callback regularly after local recording is started successfully via the calling of {@link startLocalRecording}.
     * You can capture this callback to stay up to date with the status of the recording task.
     * You can set the callback interval when calling {@link startLocalRecording}.
     *
     * @param duration Cumulative duration of recording, in milliseconds
     * @param storagePath Storage path of recording file
     */
    virtual void onLocalRecording(long duration, const char* storagePath) {
    }

    /**
     * 10.3 Record fragment finished.
     *
     * When fragment recording is enabled, this callback will be invoked when each fragment file is finished.
     * @param storagePath Storage path of the fragment.
     */
    virtual void onLocalRecordFragment(const char* storagePath) {
    }

    /**
     * 10.4 Local recording stopped
     *
     * When you call {@link stopLocalRecording} to stop local recording, the SDK returns this callback to notify you of the recording result.
     * @param errCode status
     *               -  0: successful.
     *               - -1: failed.
     *               - -2: Switching resolution or horizontal and vertical screen causes the recording to stop.
     *               - -3: recording duration is too short or no video or audio data is received. Check the recording duration or whether audio or video capture is enabled.
     * @param storagePath Storage path of recording file
     */
    virtual void onLocalRecordComplete(int errCode, const char* storagePath) {
    }

    /**
     * 10.5 Finished taking a local screenshot
     *
     * @param userId User ID. If it is empty, the screenshot is a local image.
     * @param type   Video stream type
     * @param data   Screenshot data. If it is `nullptr`, it indicates that the SDK failed to take the screenshot.
     * @param length Screenshot data length. In BGRA32 format, length = width * height * 4.
     * @param width  Screenshot width
     * @param height Screenshot height
     * @param format Screenshot data format. Only `TRTCVideoPixelFormat_BGRA32` is supported now.
     * @param bmp Screenshot result. If it is `null`, the screenshot failed to be taken.
     * @note The parameters of the full-platform C++ interface and the Java interface are different. The C++ interface uses 7 parameters to describe a screenshot, while the Java interface uses only one Bitmap to describe a screenshot.
     */
    virtual void onSnapshotComplete(const char* userId, TRTCVideoStreamType type, char* data, uint32_t length, uint32_t width, uint32_t height, TRTCVideoPixelFormat format) {
    }

    /// @}
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    Disused callbacks (please use the new ones)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name  Disused callbacks (please use the new ones)
    /// @{

    /**
     * An anchor entered the room (disused)
     *
     * @deprecated This callback is not recommended in the new version. Please use {@link onRemoteUserEnterRoom} instead.
     */
    trtc_attribute_deprecated virtual void onUserEnter(const char* userId) {
    }

    /**
     * An anchor left the room (disused)
     *
     * @deprecated This callback is not recommended in the new version. Please use {@link onRemoteUserLeaveRoom} instead.
     */
    trtc_attribute_deprecated virtual void onUserExit(const char* userId, int reason) {
    }

    /**
     * Audio effects ended (disused)
     *
     * @deprecated This callback is not recommended in the new version. Please use {@link ITXAudioEffectManager} instead.
     * Audio effects and background music can be started using the same API ({@link startPlayMusic}) now instead of separate ones.
     */
    trtc_attribute_deprecated virtual void onAudioEffectFinished(int effectId, int code) {
    }

/**
 * Started playing background music (disused)
 *
 * @deprecated This callback is not recommended in the new version. Please use {@link ITXMusicPlayObserver} instead.
 * Audio effects and background music can be started using the same API ({@link startPlayMusic}) now instead of separate ones.
 */
#ifdef _WIN32
    trtc_attribute_deprecated virtual void onPlayBGMBegin(TXLiteAVError errCode) {
    }
#endif

/**
 * Playback progress of background music (disused)
 *
 * @deprecated This callback is not recommended in the new version. Please use {@link ITXMusicPlayObserver} instead.
 * Audio effects and background music can be started using the same API ({@link startPlayMusic}) now instead of separate ones.
 */
#ifdef _WIN32
    trtc_attribute_deprecated virtual void onPlayBGMProgress(uint32_t progressMS, uint32_t durationMS) {
    }
#endif

/**
 * Background music stopped (disused)
 *
 * @deprecated This callback is not recommended in the new version. Please use {@link ITXMusicPlayObserver} instead.
 * Audio effects and background music can be started using the same API ({@link startPlayMusic}) now instead of separate ones.
 */
#ifdef _WIN32
    trtc_attribute_deprecated virtual void onPlayBGMComplete(TXLiteAVError errCode) {
    }
#endif

    /**
     * Result of server speed testing (disused)
     *
     * @deprecated This callback is not recommended in the new version. Please use {@link onSpeedTestResult:} instead.
     */
    trtc_attribute_deprecated virtual void onSpeedTest(const TRTCSpeedTestResult& currentResult, uint32_t finishedCount, uint32_t totalCount) {
    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//                    Callback of custom video processing
//
/////////////////////////////////////////////////////////////////////////////////

class ITRTCVideoRenderCallback {
   public:
    virtual ~ITRTCVideoRenderCallback() {
    }

    /**
     * Custom video rendering
     *
     * If you have configured the callback of custom rendering for local or remote video, the SDK will return to you via this callback video frames that are otherwise sent to the rendering control, so that you can customize rendering.
     * @param frame Video frames to be rendered
     * @param userId `userId` of the video source. This parameter can be ignored if the callback is for local video (`setLocalVideoRenderDelegate`).
     * @param streamType Stream type. The primary stream (`Main`) is usually used for camera images, and the substream (`Sub`) for screen sharing images.
     */
    virtual void onRenderVideoFrame(const char* userId, TRTCVideoStreamType streamType, TRTCVideoFrame* frame) {
    }
};

class ITRTCVideoFrameCallback {
   public:
    virtual ~ITRTCVideoFrameCallback() {
    }

    /**
     * An OpenGL context was created in the SDK.
     */
    virtual void onGLContextCreated() {
    }

    /**
     * Video processing by third-party beauty filters
     *
     * If you use a third-party beauty filter component, you need to configure this callback in `TRTCCloud` to have the SDK return to you video frames that are otherwise pre-processed by TRTC.
     * You can then send the video frames to the third-party beauty filter component for processing. As the data returned can be read and modified, the result of processing can be synced to TRTC for subsequent encoding and publishing.
     * Case 1: the beauty filter component generates new textures
     * If the beauty filter component you use generates a frame of new texture (for the processed image) during image processing, please set `dstFrame.textureId` to the ID of the new texture in the callback function.
     * <pre>
     * int onProcessVideoFrame(TRTCVideoFrame * srcFrame, TRTCVideoFrame *dstFrame) {
     *     dstFrame->textureId = mFURenderer.onDrawFrameSingleInput(srcFrame->textureId);
     *     return 0;
     * }
     * </pre>
     *
     * Case 2: you need to provide target textures to the beauty filter component
     * If the third-party beauty filter component you use does not generate new textures and you need to manually set an input texture and an output texture for the component, you can consider the following scheme:
     * <pre>
     * int onProcessVideoFrame(TRTCVideoFrame *srcFrame, TRTCVideoFrame *dstFrame) {
     *     thirdparty_process(srcFrame->textureId, srcFrame->width, srcFrame->height, dstFrame->textureId);
     *     return 0;
     * }
     * </pre>
     *
     * @param srcFrame Used to carry images captured by TRTC via the camera
     * @param dstFrame Used to receive video images processed by third-party beauty filters
     * @note Currently, only the OpenGL texture scheme is supported(PC supports TRTCVideoBufferType_Buffer format Only)
     */
    virtual int onProcessVideoFrame(TRTCVideoFrame* srcFrame, TRTCVideoFrame* dstFrame) {
        return 0;
    }

    /**
     * The OpenGL context in the SDK was destroyed
     */
    virtual void onGLContextDestroy() {
    }
};

/// @}
/////////////////////////////////////////////////////////////////////////////////
//
//                    Callback of custom audio processing
//
/////////////////////////////////////////////////////////////////////////////////
/// @name Callback of custom audio processing
/// @{

class ITRTCAudioFrameCallback {
   public:
    virtual ~ITRTCAudioFrameCallback() {
    }

    /**
     * Audio data captured by the local mic and pre-processed by the audio module
     *
     * After you configure the callback of custom audio processing, the SDK will return via this callback the data captured and pre-processed (ANS, AEC, and AGC) in PCM format.
     * - The audio returned is in PCM format and has a fixed frame length (time) of 0.02s.
     * - The formula to convert a frame length in seconds to one in bytes is **sample rate * frame length in seconds * number of sound channels * audio bit depth**.
     * - Assume that the audio is recorded on a single channel with a sample rate of 48,000 Hz and audio bit depth of 16 bits, which are the default settings of TRTC. The frame length in bytes will be **48000 * 0.02s * 1 * 16 bits = 15360 bits = 1920
     * bytes**.
     * @param frame Audio frames in PCM format
     * @note
     * 1. Please avoid time-consuming operations in this callback function. The SDK processes an audio frame every 20 ms, so if your operation takes more than 20 ms, it will cause audio exceptions.
     * 2. The audio data returned via this callback can be read and modified, but please keep the duration of your operation short.
     * 3. The audio data is returned via this callback after ANS, AEC and AGC, but it **does not include** pre-processing effects like background music, audio effects, or reverb, and therefore has a short delay.
     */
    virtual void onCapturedAudioFrame(TRTCAudioFrame* frame) {
    }

    /**
     * Audio data captured by the local mic, pre-processed by the audio module, effect-processed and BGM-mixed
     *
     * After you configure the callback of custom audio processing, the SDK will return via this callback the data captured, pre-processed (ANS, AEC, and AGC), effect-processed and BGM-mixed in PCM format, before it is submitted to the network module
     * for encoding.
     * - The audio data returned via this callback is in PCM format and has a fixed frame length (time) of 0.02s.
     * - The formula to convert a frame length in seconds to one in bytes is **sample rate * frame length in seconds * number of sound channels * audio bit depth**.
     * - Assume that the audio is recorded on a single channel with a sample rate of 48,000 Hz and audio bit depth of 16 bits, which are the default settings of TRTC. The frame length in bytes will be **48000 * 0.02s * 1 * 16 bits = 15360 bits = 1920
     * bytes**. Instructions: You could write data to the `TRTCAudioFrame.extraData` filed, in order to achieve the purpose of transmitting signaling. Because the data block of the audio frame header cannot be too large, we recommend you limit the
     * size of the signaling data to only a few bytes when using this API. If extra data more than 100 bytes, it won't be sent. Other users in the room can receive the message through the `TRTCAudioFrame.extraData` in `onRemoteUserAudioFrame`
     * callback in {@link TRTCAudioFrameDelegate}.
     * @param frame Audio frames in PCM format
     * @note
     * 1. Please avoid time-consuming operations in this callback function. The SDK processes an audio frame every 20 ms, so if your operation takes more than 20 ms, it will cause audio exceptions.
     * 2. The audio data returned via this callback can be read and modified, but please keep the duration of your operation short.
     * 3. Audio data is returned via this callback after ANS, AEC, AGC, effect-processing and BGM-mixing, and therefore the delay is longer than that with {@link onCapturedAudioFrame}.
     */
    virtual void onLocalProcessedAudioFrame(TRTCAudioFrame* frame) {
    }

    /**
     * Audio data of each remote user before audio mixing
     *
     * After you configure the callback of custom audio processing, the SDK will return via this callback the raw audio data (PCM format) of each remote user before mixing.
     * - The audio data returned via this callback is in PCM format and has a fixed frame length (time) of 0.02s.
     * - The formula to convert a frame length in seconds to one in bytes is **sample rate * frame length in seconds * number of sound channels * audio bit depth**.
     * - Assume that the audio is recorded on a single channel with a sample rate of 48,000 Hz and audio bit depth of 16 bits, which are the default settings of TRTC. The frame length in bytes will be **48000 * 0.02s * 1 * 16 bits = 15360 bits = 1920
     * bytes**.
     * @param frame Audio frames in PCM format
     * @param userId User ID
     * @note The audio data returned via this callback can be read but not modified.
     */
    virtual void onPlayAudioFrame(TRTCAudioFrame* frame, const char* userId) {
    }

    /**
     * Data mixed from each channel before being submitted to the system for playback
     *
     * After you configure the callback of custom audio processing, the SDK will return to you via this callback the data (PCM format) mixed from each channel before it is submitted to the system for playback.
     * - The audio data returned via this callback is in PCM format and has a fixed frame length (time) of 0.02s.
     * - The formula to convert a frame length in seconds to one in bytes is **sample rate * frame length in seconds * number of sound channels * audio bit depth**.
     * - Assume that the audio is recorded on a single channel with a sample rate of 48,000 Hz and audio bit depth of 16 bits, which are the default settings of TRTC. The frame length in bytes will be **48000 * 0.02s * 1 * 16 bits = 15360 bits = 1920
     * bytes**.
     * @param frame Audio frames in PCM format
     * @note
     * 1. Please avoid time-consuming operations in this callback function. The SDK processes an audio frame every 20 ms, so if your operation takes more than 20 ms, it will cause audio exceptions.
     * 2. The audio data returned via this callback can be read and modified, but please keep the duration of your operation short.
     * 3. The audio data returned via this callback is the audio data mixed from each channel before it is played. It does not include the in-ear monitoring data.
     */
    virtual void onMixedPlayAudioFrame(TRTCAudioFrame* frame) {
    }

    /**
     * Data mixed from all the captured and to-be-played audio in the SDK
     *
     * After you configure the callback of custom audio processing, the SDK will return via this callback the data (PCM format) mixed from all captured and to-be-played audio in the SDK, so that you can customize recording.
     * - The audio data returned via this callback is in PCM format and has a fixed frame length (time) of 0.02s.
     * - The formula to convert a frame length in seconds to one in bytes is **sample rate * frame length in seconds * number of sound channels * audio bit depth**.
     * - Assume that the audio is recorded on a single channel with a sample rate of 48,000 Hz and audio bit depth of 16 bits, which are the default settings of TRTC. The frame length in bytes will be **48000 * 0.02s * 1 * 16 bits = 15360 bits = 1920
     * bytes**.
     * @param frame Audio frames in PCM format
     * @note
     * 1. This data returned via this callback is mixed from all audio in the SDK, including local audio after pre-processing (ANS, AEC, and AGC), special effects application, and music mixing, as well as all remote audio, but it does not include the
     * in-ear monitoring data.
     * 2. The audio data returned via this callback cannot be modified.
     */
    virtual void onMixedAllAudioFrame(TRTCAudioFrame* frame) {
    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//                    Other event callbacks
//
/////////////////////////////////////////////////////////////////////////////////

class ITRTCLogCallback {
   public:
    virtual ~ITRTCLogCallback() {
    }

    /**
     * Printing of local log
     *
     * If you want to capture the local log printing event, you can configure the log callback to have the SDK return to you via this callback all logs that are to be printed.
     * @param log Log content
     * @param level Log level. For more information, please see `TRTC_LOG_LEVEL`.
     * @param module Reserved field, which is not defined at the moment and has a fixed value of `TXLiteAVSDK`.
     */
    virtual void onLog(const char* log, TRTCLogLevel level, const char* module) {
    }
};

}  // namespace liteav
#endif
