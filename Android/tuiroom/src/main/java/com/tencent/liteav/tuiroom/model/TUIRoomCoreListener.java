package com.tencent.liteav.tuiroom.model;

import com.tencent.trtc.TRTCCloudDef;
import com.tencent.trtc.TRTCStatistics;

import java.util.List;

public interface TUIRoomCoreListener {
    /**
     * Callback for component error event
     *
     * @param code    Error code
     * @param message Error content
     */
    void onError(int code, String message);

    /**
     * Callback for room termination. When the host leaves the room, all users in the room will receive this callback
     */
    void onDestroyRoom();

    /**
     * Callback for user volume level
     *
     * @param userId Local or remote user ID
     * @param volume User volume level. Value range: 0–100
     */
    void onUserVoiceVolume(String userId, int volume);

    /**
     * The host was changed.
     *
     * @param previousUserId Original host
     * @param currentUserId  New host
     */
    void onRoomMasterChanged(String previousUserId, String currentUserId);

    /**
     * A remote user entered the room.
     *
     * @param userId User ID of new member
     */
    void onRemoteUserEnter(String userId);

    /**
     * A remote user exited the room.
     *
     * @param userId User ID of exiting member
     */
    void onRemoteUserLeave(String userId);

    /**
     * Whether a remote user is sending video data.
     *
     * @param userId    User ID
     * @param available Whether video data is available
     */
    void onRemoteUserCameraAvailable(String userId, boolean available);

    /**
     * A user enabled/disabled screen sharing.
     *
     * @param userId    User ID
     * @param available Whether screen sharing data is available
     */
    void onRemoteUserScreenVideoAvailable(String userId, boolean available);

    /**
     * Whether a remote user is sending audio.
     *
     * @param userId    User ID
     * @param available Whether audio data is available
     */
    void onRemoteUserAudioAvailable(String userId, boolean available);

    /**
     * A remote user started speaking.
     * This notification will be received if a user speaks.
     *
     * @param userId User ID
     */
    void onRemoteUserEnterSpeechState(String userId);

    /**
     * A remote user stopped speaking.
     * This notification will be received after a user stops speaking.
     *
     * @param userId User ID
     */
    void onRemoteUserExitSpeechState(String userId);

    /**
     * A text chat message was received.
     *
     * @param userId  User ID
     * @param message Text chat message
     */
    void onReceiveChatMessage(String userId, String message);

    /**
     * A custom message was received.
     *
     * @param userId User ID
     * @param data   Custom message content
     */
    void onReceiveRoomCustomMsg(String userId, String data);

    /**
     * A user received an invitation to speak from the host.
     * The host called the `sendSpeechInvitation` API to invite the user to speak.
     *
     * @param userId User ID of host
     */
    void onReceiveSpeechInvitation(String userId);

    /**
     * The host canceled the mic-on invitation.
     * The host called the `cancelSpeechInvitation` API to cancel the mic-on invitation sent to the user.
     *
     * @param userId User ID of host
     */
    void onReceiveInvitationCancelled(String userId);

    /**
     * The host received a request to speak from a member.
     * A user called the `sendSpeechApplication` API to request to speak in `TUIRoomCoreDef.SpeechMode.APPLY_SPEECH` 
     * mode.
     * The host needs to process the request and call the `agreeSpeechApplication` API to respond to the request.
     *
     * @param userId User ID
     */
    void onReceiveSpeechApplication(String userId);

    /**
     * A user canceled a request to speak.
     * A user called the `cancelApplication` API to cancel their request to speak in `TUIRoomCoreDef.SpeechMode
     * .APPLY_SPEECH` mode.
     *
     * @param userId User ID
     */
    void onSpeechApplicationCancelled(String userId);

    /**
     * The host disabled requests to speak.
     *
     * @param isForbidden true: Users cannot request to speak; false: Requests to speak are enabled.
     */
    void onSpeechApplicationForbidden(boolean isForbidden);

    /**
     * A member was asked to stop speaking.
     * The host called the `sendOffSpeaker` API to request the user to stop speaking.
     *
     * @param userId User ID of host
     */
    void onOrderedToExitSpeechState(String userId);

    /**
     * The host started a roll call.
     *
     * @param userId User ID of host
     */
    void onCallingRollStarted(String userId);

    /**
     * The anchor ended a roll call.
     *
     * @param userId User ID of host
     */
    void onCallingRollStopped(String userId);

    /**
     * A user replied to a roll call.
     *
     * @param userId User ID
     */
    void onMemberReplyCallingRoll(String userId);

    /**
     * The host muted/unmuted the room
     *
     * @param muted true: No messages can be sent in the chat room; false: Messages can be sent in the chat room
     */
    void onChatRoomMuted(boolean muted);

    /**
     * The host disabled the mic
     *
     * @param muted true: The user's mic is disabled; false: The user's mic is enabled
     */
    void onMicrophoneMuted(boolean muted);

    /**
     * The host disabled the camera
     *
     * @param muted true: The user's camera is disabled; false: The user's camera is enabled
     */
    void onCameraMuted(boolean muted);

    /**
     * Callback for user removed by host. The user will receive this callback after the host/admin calls `kickOffUser`.
     *
     * @param userId Host/Admin user ID
     */
    void onReceiveKickedOff(String userId);

    /**
     * Callback for technical metric statistics
     * 
     * If you are familiar with audio/video terms, you can use this callback to get all technical metrics of the SDK.
     * If you are developing an audio/video project for the first time, you can focus only on the `onNetworkQuality` 
     * callback, which is triggered once every two seconds.
     *
     * @param statistics Statistics of local and remote users
     */
    void onStatistics(TRTCStatistics statistics);

    /**
     * Callback for network quality
     *
     * @param localQuality  Upstream network quality
     * @param remoteQuality Downstream network quality
     */

    void onNetworkQuality(TRTCCloudDef.TRTCQuality localQuality, List<TRTCCloudDef.TRTCQuality> remoteQuality);

    /**
     * Screen sharing started
     */
    void onScreenCaptureStarted();

    /**
     * Screen sharing stopped
     *
     * @param reason Reason for stop. 0: The user stopped screen sharing; 1: Screen sharing stopped due to preemption
     *              by another application
     */
    void onScreenCaptureStopped(int reason);
}