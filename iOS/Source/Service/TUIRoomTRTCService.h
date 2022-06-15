//
//  TUIRoomTRTCService.h
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIRoomDefine.h"

NS_ASSUME_NONNULL_BEGIN
FOUNDATION_EXPORT void tuiRoomLog(NSString *format, ...);
/// If `TRTCCloud apiLog` is used, logs will be written locally
#define TRTCLog(fmt, ...) tuiRoomLog((@"TUIRoom:%s [Line %d] " fmt), __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__)

/**
 TRTC Service Delegate
 */
@protocol TUIRoomTRTCServiceDelegate <NSObject>

/**
 * Callback for error
 *
 * @param code Error code
 * @param message Error message
 */
- (void)onTRTCError:(int)code
            message:(NSString*)message;

/**
 * A new user entered the room.
 *
 * @param userId User ID
 */
- (void)onUserEnterTRTCRoom:(NSString *)userId;

/**
 * A user exited the room.
 *
 * @param userInfo User exiting the room
 */
- (void)onUserLeaveTRTCRoom:(TUIRoomUserInfo *)userInfo;


/**
 * A remote user published/unpublished the primary stream video
 *
 * @param userInfo Remote user
 * @param available Whether the user published (or unpublished) primary stream video. Valid values: YES: Published; NO: Unpublished
 */
- (void)onUserVideoAvailable:(TUIRoomUserInfo *)userInfo
                   available:(BOOL)available;

/**
 * A remote user published/unpublished the audio
 *
 * @param userId Remote user ID
 * @param available Whether the user published (or unpublished) audio. Valid values: YES: Published; NO: Unpublished
 */
- (void)onUserAudioAvailable:(NSString *)userId
                   available:(BOOL)available;

/**
 * Callback for real-time network quality
 *
 * @param localQuality Upstream network quality
 * @param remoteQuality Downstream network quality
 */
- (void)onNetworkQuality:(TRTCQualityInfo *)localQuality
           remoteQuality:(NSArray<TRTCQualityInfo *> *)remoteQuality;

/**
 * Callback for volume level
 *
 * @param userId Remote user ID
 * @param totalVolume Total volume of all remote users. Value range: 0–100
 */
- (void)onUserVoiceVolume:(NSString *)userId
              totalVolume:(NSInteger)totalVolume;

/**
 * Screen sharing started
 */
- (void)onScreenCaptureStarted;

/**
 * Screen sharing stoppped
 *
 * @param reason Reason for stop. 0: The user stopped screen sharing; 1: Screen sharing stopped due to preemption by another application
 */
- (void)onScreenCaptureStopped:(NSInteger)reason;

/**
 * A user enabled/disabled screen sharing.
 *
 * @param userId    User ID
 * @param available Whether screen sharing data is available
 */
- (void)onRemoteUserScreenVideoAvailable:(NSString *)userId
                               available:(BOOL)available;

/**
 * Callback for technical metric statistics
 *
 * If you are familiar with audio/video terms, you can use this callback to get all technical metrics of the SDK.
 * If you are developing an audio/video project for the first time, you can focus only on the `onNetworkQuality` callback, which is triggered once every two seconds.
 *
 * @param statistics Statistics of local and remote users
 */
- (void)onStatistics:(TRTCStatistics *)statistics;

@end

/**
 TRTC Service
 */
@interface TUIRoomTRTCService : NSObject

/**
 * Set callback
 *
 */
@property(nonatomic, weak) id<TUIRoomTRTCServiceDelegate> delegate;


/**
 * Enter a meeting (called by other participants)
 *
 * @param roomInfo Room information
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)enterRTCRoom:(TUIRoomInfo *)roomInfo
            callback:(TUIRoomActionCallback)callback;


/**
 * Exits a room
 *
 * @param callback Event callback
 */
- (void)leaveRoom:(nullable TUIRoomActionCallback)callback;


/**
 * Switch the role to anchor
 *
 * @param callback Event callback
 */
- (void)switchToAnchor:(nullable TUIRoomActionCallback)callback;

/**
 * Switch the role to audience
 *
 * @param callback Event callback
 */
- (void)switchToAudience:(nullable TUIRoomActionCallback)callback;

/**
 * Play the video of a remote user
 *
 * @param userId ID of the user whose video is to be played
 * @param view `view` control that carries the video image
 * @param type Stream type
 * @param callback Callback for the operation
 * @note Call this API if `true` is returned in the `onUserVideoAvailable` callback.
 */
- (void)startRemoteView:(NSString *)userId
                   view:(UIView *)view
                   type:(TUIRoomStreamType)type
               callback:(TUIRoomActionCallback)callback;


/**
 * Unsubscribe from the video stream of a remote user
 *
 * @param userId Remote user ID
 * @param type Stream type
 * @param callback Callback for the operation
 *
 */
- (void)stopRemoteView:(NSString *)userId
                  type:(TUIRoomStreamType)type 
              callback:(TUIRoomActionCallback)callback;

/**
 * Pause/Resume subscribing to a remote user's video stream
 *
 * @param userId User ID
 * @param mute true: Pause it; false: Resume it
 */
- (void)muteRemoteVideoStream:(NSString *)userId
                         type:(TUIRoomStreamType)type
                         mute:(BOOL)mute;

/**
 * Switches between the front and rear cameras
 *
 * @param isFront true:Front camera; false: Rear camera
 */
- (void)switchCamera:(BOOL)isFront;

/**
 * Query whether the current camera is the front camera
 * @return yes/no
 */
- (BOOL)isFrontCamera;

/**
 * Sets the resolution
 *
 * @param resolution Video resolution
 */
- (void)setVideoResolution:(TRTCVideoResolution)resolution;

/**
 * Sets the frame rate
 *
 * @param fps Frame rate in FPS
 */
- (void)setVideoFps:(int)fps;

/**
 * Sets the bitrate
 *
 * @param bitrate Bitrate in Kbps
 */
- (void)setVideoBitrate:(int)bitrate;

/**
 * Set the mirror mode of the local preview
 *
 * @param type Mirror mode of the local video preview
 */
- (void)setLocalViewMirror:(TRTCVideoMirrorType)type;

/**
 * Set the network QoS parameter
 *
 * @param preference The QoS control policy
 */
- (void)setVideoQosPreference:(TRTCNetworkQosParam *)preference;
    
/**
 * Starts mic capturing
 */
- (void)startMicrophone;

/**
 * Stops mic capturing
 */
- (void)stopMicrophone;

/**
 * Sets the audio quality
 *
 * @param quality Audio quality
 */
- (void)setAudioQuality:(TRTCAudioQuality)quality;

/**
 * Mute local audio
 *
 * @param mute Whether to mute
 */
- (void)muteLocalAudio:(BOOL)mute;

/**
 * Sets whether to use the device’s speaker or receiver
 *
 * @param useSpeaker true: Speaker; false: Receiver
 */
- (void)setSpeaker:(BOOL)useSpeaker;

/**
 * Sets the mic capturing volume level
 *
 * @param volume Capturing volume level. Value range: 0–100
 */
- (void)setAudioCaptureVolume:(NSInteger)volume;

/**
 * Sets the playback volume level
 *
 * @param volume Playback volume level. Value range: 0–100
 */
- (void)setAudioPlayoutVolume:(NSInteger)volume;

/**
 * Start audio recording
 *
 * After this API is called, the SDK will record all audios (such as local audio, remote audio, and background music) in the current call to a file.
 * No matter whether room entry is performed, this API will take effect once called.
 * When `exitMeeting` is called, audio recording will stop automatically.
 * @param params Audio recording parameters
 */
- (void)startFileDumping:(TRTCAudioRecordingParams *)params;

/**
 * Stop audio recording
 *
 * When `exitMeeting` is called, audio recording will stop automatically.
 */
- (void)stopFileDumping;

/**
 * Enable the volume level reminder
 *
 * After this feature is enabled, the evaluation result of the volume level by the SDK will be obtained in `onUserVolumeUpdate`.
 * @param enable true: Enable;  false: Disable
 */
- (void)enableAudioEvaluation:(BOOL)enable;

/**
 * Release the resource
 *
 * @note Call this method with the corresponding object during `dealloc`
 */
- (void)releaseResources;

/**
 * Get `getStreamId`
 *
 */
- (NSString *)getStreamId;

@end

NS_ASSUME_NONNULL_END
