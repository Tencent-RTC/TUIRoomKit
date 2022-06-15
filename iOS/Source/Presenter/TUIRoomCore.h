//
//  TUIRoom.h
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIRoomDefine.h"
#import "TUIRoomCoreDelegate.h"
#import "TUIRoomInfo.h"
#import "TUIRoomUserInfo.h"
#import "TUIRoomUserManage.h"

NS_ASSUME_NONNULL_BEGIN
/**
 TUIRoomCore
 */
@interface TUIRoomCore : NSObject
/**
 * Get the object pointer of `TUIRoomCore`.
 *
 * @return Return the pointer of the `TUIRoomCore` singleton object. You need to call `DestroyInstance` to release the singleton pointer object.
 */
+ (instancetype)shareInstance;
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 * Release a `TUIRoomCore` singleton object
 */
+ (void)destroyInstance;

/**
 * Set the `TUIRoomCoreDelegate` API
 *
 * You can use `TUIRoomCoreDelegate` to get various status notifications. For more information, see the definition in `TUIRoomCoreDelegate.h`.
 *
 * @param delegate TUIRoomCoreDelegate
 *
 */
- (void)setDelegate:(id<TUIRoomCoreDelegate>)delegate;

/**
 * Create a room (called by host)
 *
 * @param roomId     Room ID. You need to assign and manage the IDs in a centralized manner
 * @param speechMode Speech mode. Valid values:
 *                    - TUIRoomFreeSpeech Users can speak freely;
 *                    - TUIRoomApplySpeech: Users need permission to speak.
 * @param callback   Callback for room creation result. The `code` will be 0 if the operation succeeds.
 */
- (void)createRoom:(NSString *)roomId
        speechMode:(TUIRoomSpeechMode)speechMode
        callback:(TUIRoomActionCallback)callback;

/**
 * Terminate a room (called by host)
 *
 * After creating a room, the host can call this API to terminate it.
 *
 * After calling the room termination API, other members will receive the `onDestroyRoom()` callback from `TUIRoomCoreDelegate`.
 *
 * @param callback Callback for room termination result. The `code` will be 0 if the operation succeeds.
 */
- (void)destroyRoom:(TUIRoomActionCallback)callback;

/**
 * Enter a room (called by member)
 *
 * @param roomId   Room ID. You need to assign and manage the IDs in a centralized manner
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)enterRoom:(NSString *)roomId
        callback:(TUIRoomActionCallback)callback;

/**
 * Exit a room (called by member)
 *
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)leaveRoom:(TUIRoomActionCallback)callback;

/**
 * Get the room information
 * This API is used to get information such as room ID, name, speech mode, and start time.
 *
 * @return Return Room information
 */
- (nullable TUIRoomInfo *)getRoomInfo;

/**
 * Get the information of all members in the room
 * This API is used to get the list of information of members in the room.
 *
 * @return Return Room member information list
 */
- (nullable NSArray<TUIRoomUserInfo *> *)getRoomUsers;

/**
 * Get the information of a room member
 *
 * This API is used to get the user information of the specified `userId` in the room.
 *
 * @param userId  User ID
 * @param callback  Callback for room member details
 */
- (void)getUserInfo:(NSString *)userId
           callback:(TUIRoomUserInfoCallback)callback;

/**
 * Transfer the group to another user
 *
 * @param userId   ID of the target user
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)transferRoomMaster:(NSString *)userId
                  callback:(TUIRoomActionCallback)callback;

/**
 * Set user information. The user information you set will be stored in Tencent Cloud IM.
 *
 * @param userName  Username
 * @param avatarURL User profile photo
 * @param callback  Result callback for whether the setting succeeds
*/
- (void)setSelfProfile:(NSString *)userName
             avatarURL:(NSString *)avatarURL
              callback:(TUIRoomActionCallback)callback;

/**
 * Enables local video preview
 *
 * @param isFront true: Front camera; false: Rear camera
 * @param view    The control that carries the video image
 */
- (void)startCameraPreview:(BOOL)isFront
                      view:(UIView *)view;

/**
 * Stops local video capturing and preview
 */
- (void)stopCameraPreview;

/**
 * Starts mic capturing
 *
 * @param quality Captured audio quality. Valid values: TRTC_AUDIO_QUALITY_MUSIC, TRTC_AUDIO_QUALITY_DEFAULT, and TRTC_AUDIO_QUALITY_SPEECH
 */
- (void)startLocalAudio:(TRTCAudioQuality)quality;

/**
 * Stops mic capturing
 */
- (void)stopLocalAudio;

/**
 * Set the mirror mode for the local preview
 *
 * @param type Mirror type. Valid values: TRTCVideoMirrorTypeAuto, TRTCVideoMirrorTypeEnable,
 *             and TRTCVideoMirrorTypeDisable.
*/
- (void)setVideoMirror:(TRTCVideoMirrorType)type;

/**
 * Sets whether to use the device’s speaker or receiver
 *
 * @param isUseSpeaker YES: Speaker; NO: Receiver
 */
- (void)setSpeaker:(BOOL)isUseSpeaker;

/**
 * Subscribe to the video stream of a remote user
 *
 * @param userId     ID of the user whose video is to be played
 * @param view      The control that carries the video image
 * @param streamType Stream type
 * @param callback   Result callback
 */
- (void)startRemoteView:(NSString *)userId
                   view:(UIView *)view
             streamType:(TUIRoomStreamType)streamType
               callback:(TUIRoomActionCallback)callback;

/**
 * Unsubscribe from the video stream of a remote user
 *
 * @param userId   ID of the user whose video playback needs to be stopped
 * @param streamType Stream type
 * @param callback Result callback
 */
- (void)stopRemoteView:(NSString *)userId
            streamType:(TUIRoomStreamType)streamType
              callback:(TUIRoomActionCallback)callback;

/**
 * Switches between the front and rear cameras
 *
 * @param isFront YES: front camera; NO: rear camera
 */
- (void)switchCamera:(BOOL)isFront;

/**
 * Broadcast a text chat message in the room. This API is generally used for text chat
 *
 * @param message  Message content
 * @param callback Callback for the sending result
 */
- (void)sendChatMessage:(NSString *)message
               callback:(TUIRoomActionCallback)callback;

/**
 * Enable/Disable the mic of the specified user
 * When the host calls this API to disable/enable the mic of a member, the member will receive the `onMicrophoneMuted()` callback.
 *
 * @param userId   User ID
 * @param mute     true: Disable the mic of a user; false: Enable the mic of a user
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)muteUserMicrophone:(NSString *)userId
                      mute:(BOOL)mute
                  callback:(TUIRoomActionCallback)callback;

/**
 * Disable/Enable the mic of all users and sync the status to room information
 * When the host calls this API to disable/enable the mic of all members, the members will receive the `onMicrophoneMuted()` callback.
 *
 * @param mute     true: Disable the mic of all users; false: Enable the mic of all users
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)muteAllUsersMicrophone:(BOOL)mute
                      callback:(TUIRoomActionCallback)callback;

/**
 * Enable/Disable the camera of the specified user
 *
 * When the host calls this API to disable/enable the camera of a member, the member will receive the `onCameraMuted` callback.
 *
 * @param userId   User ID
 * @param mute     true: Disable the user camera; false: Enable the camera of the user whose ID is `user_id`
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)muteUserCamera:(NSString *)userId
                  mute:(BOOL)mute
              callback:(TUIRoomActionCallback)callback;

/**
 * Disable/Enable the camera of all users and sync the status to room information
 * When the host calls this API to disable/enable the camera of all members, the members will receive the `onCameraMuted` callback.
 *
 * @param mute     true: Disable the camera of all users; false: Enable the camera of all users
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)muteAllUsersCamera:(BOOL)mute
                  callback:(TUIRoomActionCallback)callback;

/**
 * Disable/Enable text chat
 * When the host calls this API to disable/enable IM chat in the room, the members will receive the `onChatRoomMuted()` callback.
 *
 * @param mute     mute true: Disable chat; false: Enable chat
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)muteChatRoom:(BOOL)mute
            callback:(TUIRoomActionCallback)callback;

/**
 * Remove a user by the host
 * When the host calls this API to remove a member, the member will receive the `onReceiveKickedOff()` callback.
 *
 * @param userId   User ID
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)kickOffUser:(NSString *)userId
           callback:(TUIRoomActionCallback)callback;

/**
 * The host starts roll call
 *
 * When the host calls this API to start a roll call, the members will receive the `onCallingRollStarted()` callback.
 *
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)startCallingRoll:(TUIRoomActionCallback)callback;

/**
 * The host stops roll call
 *
 * When the host calls this API to end a roll call, the members will receive the `onCallingRollStopped()` callback.
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)stopCallingRoll:(TUIRoomActionCallback)callback;

/**
 * A member replied to a roll call.
 *
 * When a member replies to the roll call started by the host, the host will receive the `onMemberReplyCallingRoll()` callback.
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)replyCallingRoll:(TUIRoomActionCallback)callback;


/**
 * The host invites a user to speak
 *
 * When the host calls this API to invite a user to speak, the user will receive the `onReceiveSpeechInvitation()` callback.
 *
 * @param userId   User ID
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)sendSpeechInvitation:(NSString *)userId
                    callback:(TUIRoomInviteeCallback)callback;

/**
 * The host cancels the invitation to speak sent to a user
 *
 * When the host calls this API to cancel the mic-on invitation to a user, the user will receive the `onReceiveInvitationCancelled()` callback.
 *
 * @param userId   User ID
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)cancelSpeechInvitation:(NSString *)userId
                      callback:(TUIRoomActionCallback)callback;

/**
 * A user accepts/rejects the host's mic-on invitation
 *
 * A user needs to call this API to accept/reject the mic-on invitation from the host in `TUIRoomApplySpeech` mode.
 * The host will receive the `onReceiveReplyToSpeechInvitation` callback.
 *
 * @param agree    YES: Accept; NO: Reject
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)replySpeechInvitation:(BOOL)agree
                     callback:(TUIRoomActionCallback)callback;

/**
 * A user requests to speak.
 *
 * When a member calls this API to request to speak, the host will receive the `onReceiveSpeechApplication` callback.
 *
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)sendSpeechApplication:(TUIRoomInviteeCallback)callback;

/**
 * A member cancels the request to speak.
 *
 * When a member calls this API to cancel their request to speak, the host will receive the `onSpeechApplicationCancelled` callback.
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)cancelSpeechApplication:(TUIRoomActionCallback)callback;

/**
 * The host approves/rejects a user’s request to speak
 *
 * The host needs to call this API to approve/reject a user’s request in `TUIRoomCoreDef.SpeechMode.APPLY_SPEECH` mode.
 * The user will receive the `onReceiveReplyToSpeechApplication` callback.
 *
 * @param agree    YES: Accept; NO: Reject
 * @param userId   User ID
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)replySpeechApplication:(BOOL)agree
                        userId:(NSString *)userId
                      callback:(TUIRoomActionCallback)callback;

/**
 * The host disables requests to speak
 *
 * When the host calls this API, the members will receive the `onSpeechApplicationForbidden` callback.
 *
 * @param forbid YES: Disable requests; NO: Enable requests
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)forbidSpeechApplication:(BOOL)forbid
                       callback:(TUIRoomActionCallback)callback;

/**
 * The host notifies a user to stop speaking
 *
 * When the host calls this API to stop the speech of a user, the user will receive the `onOrderedToExitSpeechState()` callback notification.
 *
 * @param  userId User ID
 * @param  callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)sendOffSpeaker:(NSString *)userId
              callback:(TUIRoomInviteeCallback)callback;

/**
 * The host requests all users to stop speaking
 *
 * @param callback Result callback
 */
- (void)sendOffAllSpeakers:(TUIRoomInviteeCallback)callback;

/**
 * A user stops speaking and becomes an audience member
 * This API is used by a member to stop speaking and change their role to audience.
 *
 * @param callback Result callback
 */
- (void)exitSpeechState:(TUIRoomActionCallback)callback;

/**
 * Start screen sharing
 *
 * Recommended configuration parameters for screen sharing on Android phones:
 * - Resolution (videoResolution): 1280x720
 * - Frame rate (videoFps): 10 fps
 * - Bitrate (videoBitrate): 1200 Kbps
 * - Resolution adaption (enableAdjustRes): false
 *
 * @param encParam         Screen sharing encoding parameters. We recommend you use the above configuration. If you set `encParams` to `null`, the encoding parameter settings before `startScreenCapture` is called will be used
 */
- (void)startScreenCapture:(TRTCVideoEncParam *)encParam API_AVAILABLE(ios(11.0));

/**
 * Stop screen sharing
 */
- (void)stopScreenCapture API_AVAILABLE(ios(11.0));

/**
 * Get the beauty filter management object
 *
 * You can do the following using TXBeautyManager:
 * - Set the beauty filter style and apply effects including skin brightening, rosy skin, eye enlarging, face slimming, chin slimming, chin lengthening/shortening, face shortening, nose narrowing, eye brightening, teeth whitening, eye bag removal, wrinkle removal, and smile line removal.
 * - Adjust the hairline, eye spacing, eye corners, lip shape, nose wings, nose position, lip thickness, and face shape.
 * - Apply animated effects such as face widgets (materials).
 * - Add makeup effects.
 * - Recognize gestures.
 *
 * @return TXBeautyManager
 */
- (TXBeautyManager *)getBeautyManager;

/**
 * Set the network QoS parameter
 *
 * @param preference The QoS control policy
 */
- (void)setVideoQosPreference:(TRTCNetworkQosParam *)preference;

/**
 * Sets the audio quality
 *
 * @param quality TRTCAudioQualitySpeech/TRTCAudioQualityDefault/TRTCAudioQualityMusic
 */
- (void)setAudioQuality:(TRTCAudioQuality)quality;

/**
 * Sets the resolution
 *
 * @param resolution For the specific settings, see `TRTCVideoResolution_xx_xx`.
 */
- (void)setVideoResolution:(TRTCVideoResolution)resolution;

/**
 * Sets the frame rate
 *
 * @param fps int
 */
- (void)setVideoFps:(int)fps;

/**
 * Sets the bitrate
 *
 * @param bitrate Bitrate
 */
- (void)setVideoBitrate:(int)bitrate;

/**
 * Enable the volume level reminder
 * After this feature is enabled, the evaluation result of the volume level by the SDK will be obtained in `onUserVolumeUpdate`.
 *
 * @param enable YES: Enable; NO: Disable
 */
- (void)enableAudioEvaluation:(BOOL)enable;

/**
 * Sets the playback volume
 *
 * @param volume Playback volume. Value range: 0-100
 */
- (void)setAudioPlayVolume:(NSInteger)volume;

/**
 * Sets the mic capturing volume
 *
 * @param volume Capturing volume. Value range: 0-100
 */
- (void)setAudioCaptureVolume:(NSInteger)volume;

/**
 * Start audio recording
 * After this API is called, the SDK will record all audios (such as local audio, remote audio, and background music) in the current call to a file.
 * No matter whether room entry is performed, this API will take effect once called.
 * When `leaveRoom` is called, audio recording will stop automatically.
 *
 * @param params `TRTCAudioRecordingParams`
 */
- (void)startFileDumping:(TRTCAudioRecordingParams *)params;

/**
 * Stop audio recording
 * When `leaveRoom` is called, audio recording will stop automatically.
 */
- (void)stopFileDumping;

/**
 * Get the SDK version
 * @return SDK version number
 */
- (NSInteger)getSdkVersion;

@end

NS_ASSUME_NONNULL_END
