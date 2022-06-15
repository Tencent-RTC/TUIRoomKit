//
//  TUIRoomCoreDelegate.h
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIRoomDefine.h"

NS_ASSUME_NONNULL_BEGIN

@protocol TUIRoomCoreDelegate <NSObject>

/**
 * Error callback
 *
 * This callback indicates that the SDK encountered an unrecoverable error. Such errors must be listened for, and UI reminders should be sent to users if necessary.
 *
 * @param code     Error code
 * @param message     Error message
 */
- (void)onError:(NSInteger)code
        message:(NSString *)message;

/**
 * Callback for closing a room
 *
 * The host called the `DestroyRoom` API to close the room.
 */
- (void)onDestroyRoom;

/**
 * Callback for user volume level
 *
 * This callback indicates the user volume level, which is used to update the volume level displayed on the UI.
 *
 * @param userId Local or remote user ID
 * @param volume User volume level. Value range: 0–100
 */
- (void)onUserVoiceVolume:(NSString *)userId
                   volume:(NSInteger)volume;

/**
 * Callback for host change
 *
 * @param previousUserId old
 * @param currentUserId  New
 */
- (void)onRoomMasterChanged:(NSString *)previousUserId
              currentUserId:(NSString *)currentUserId;

/**
 * Callback for room entry of remote user
 *
 * A remote user entered a room.
 *
 * @param userId User ID
 */
- (void)onRemoteUserEnter:(NSString *)userId;

/**
 * Callback for room exit of remote user
 *
 * A remote user exited a room.
 *
 * @param userId User ID
 */
- (void)onRemoteUserLeave:(NSString *)userId;

/**
 * Callback for whether a remote user is sending video data
 *
 * When the `OnRemoteUserCameraAvailable(user_id, true)` notification is received, it indicates that video data is available from a user.
 *
 * @param userId User ID
 * @param available  Whether video data is available
 */
- (void)onRemoteUserCameraAvailable:(NSString *)userId
                          available:(BOOL)available;

/**
 * A user enabled/disabled screen sharing.
 *
 * @param userId    User ID
 * @param available Whether screen sharing data is available
 */
- (void)onRemoteUserScreenVideoAvailable:(NSString *)userId
                               available:(BOOL)available;

/**
 * Whether a remote user is sending audio.
 *
 * @param userId    User ID
 * @param available Whether audio data is available
 */
- (void)onRemoteUserAudioAvailable:(NSString *)userId
                         available:(BOOL)available;

/**
 * A remote user started speaking.
 * This notification will be received if a user speaks.
 *
 * @param userId User ID
 */
- (void)onRemoteUserEnterSpeechState:(NSString *)userId;

/**
 * A remote user stopped speaking.
 * This notification will be received after a user stops speaking.
 *
 * @param userId User ID
 */
- (void)onRemoteUserExitSpeechState:(NSString *)userId;

/**
 * A text chat message was received.
 *
 * @param userId User ID
 * @param message   Custom message content
 */
- (void)onReceiveChatMessage:(NSString *)userId
                     message:(NSString *)message;

/**
 * A user received an invitation to speak from the host.
 * The host called the `sendSpeechInvitation` API to invite the user to speak.
 *
 * @param userId User ID of host
 */
- (void)onReceiveSpeechInvitation:(NSString *)userId;

/**
 * The host canceled the mic-on invitation.
 * The host called the `cancelSpeechInvitation` API to cancel the mic-on invitation sent to the user.
 *
 * @param userId User ID of host
 */
- (void)onReceiveInvitationCancelled:(NSString *)userId;

/**
 * The host received a request to speak from a user.
 * A user called the `sendSpeechApplication` API to send a request to speak in `TUIRoomCoreDef.SpeechMode.APPLY_SPEECH` mode.
 * The host needs to process the request and call the `agreeSpeechApplication` API to respond to the request.
 *
 * @param userId User ID
 */
- (void)onReceiveSpeechApplication:(NSString *)userId;

/**
 * A user canceled a request to speak.
 * A user called the `cancelApplication` API to cancel their request to speak in `TUIRoomCoreDef.SpeechMode.APPLY_SPEECH` mode.
 *
 * @param userId User ID
 */
- (void)onSpeechApplicationCancelled:(NSString *)userId;

/**
 * The host disabled requests to speak.
 *
 * @param isForbidden YES: Users cannot request to speak; NO: Requests to speak are allowed
 */
- (void)onSpeechApplicationForbidden:(BOOL)isForbidden
                              userId:(NSString *)userId;

/**
 * A member was asked to stop speaking.
 * The host called the `sendOffSpeaker` API to request the user to stop speaking.
 *
 * @param userId User ID of host
 */
- (void)onOrderedToExitSpeechState:(NSString *)userId;

/**
 * The host started a roll call.
 *
 * @param userId User ID of host
 */
- (void)onCallingRollStarted:(NSString *)userId;

/**
 * The anchor ended a roll call.
 *
 * @param userId User ID of host
 */
- (void)onCallingRollStopped:(NSString *)userId;

/**
 * A user replied to a roll call.
 *
 * @param userId User ID
 */
- (void)onMemberReplyCallingRoll:(NSString *)userId;

/**
 * The host muted/unmuted the room
 *
 * @param muted  true: No messages can be sent in the chat room; false: Messages can be sent in the chat room
 *
 * @param userId User ID of host
 */
- (void)onChatRoomMuted:(BOOL)muted
                 userId:(NSString *)userId;

/**
 * The host disabled the mic
 *
 * @param muted  true: The user's mic is disabled; false: The user's mic is enabled
 *
 * @param userId User ID of host
 */
- (void)onMicrophoneMuted:(BOOL)muted
                   userId:(NSString *)userId;


/**
 * The host disabled the camera
 *
 * @param muted  true: The user's camera is disabled; false: The user's camera is enabled
 *
 * @param userId User ID of host
 */
- (void)onCameraMuted:(BOOL)muted
               userId:(NSString *)userId;

/**
 * Callback for user removed by host. The user will receive this callback after the host/admin calls `kickOffUser`.
 *
 * @param userId Host/Admin user ID
 */
- (void)onReceiveKickedOff:(NSString *)userId;

/**
 * Callback for technical metric statistics
 *
 * If you are familiar with audio/video terms, you can use this callback to get all technical metrics of the SDK.
 * If you are developing an audio/video project for the first time, you can focus only on the `onNetworkQuality` callback, which is triggered once every two seconds.
 *
 * @param statistics Statistics of local and remote users
 */
- (void)onStatistics:(TRTCStatistics *)statistics;

/**
 * Callback for network quality
 *
 * @param localQuality  Upstream network quality
 * @param remoteQuality Downstream network quality
 */
- (void)onNetworkQuality:(TRTCQualityInfo *)localQuality
           remoteQuality:(NSArray<TRTCQualityInfo *> *)remoteQuality;

/**
 * Screen sharing started
 */
- (void)onScreenCaptureStarted;

/**
 * Screen sharing stopped
 *
 * @param reason Reason for stop. 0: The user stopped screen sharing; 1: Screen sharing stopped due to preemption by another application
 */
- (void)onScreenCaptureStopped:(NSInteger)reason;

@end

NS_ASSUME_NONNULL_END
