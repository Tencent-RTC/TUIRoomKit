package com.tencent.liteav.tuiroom.model;

import android.content.Context;

import com.tencent.liteav.beauty.TXBeautyManager;
import com.tencent.liteav.tuiroom.model.impl.TUIRoomCoreImpl;
import com.tencent.rtmp.ui.TXCloudVideoView;
import com.tencent.trtc.TRTCCloudDef;

import java.util.List;

public abstract class TUIRoomCore {
    /**
     * Get a `TUIRoomCore` singleton object
     *
     * @return Return the `TUIRoomCore` singleton object. You need to call `destroyInstance` to release the singleton
     * object.
     */
    public static TUIRoomCore getInstance(Context context) {
        return TUIRoomCoreImpl.getInstance(context);
    }

    /**
     * Terminate a `TUIRoomCore` singleton object
     */
    public abstract void destroyInstance();

    /**
     * Set the event callbacks of the component
     * You can use `TUIRoomCoreListener` to get different status notifications.
     *
     * @param listener Callback API
     * @note Callbacks in `TUIRoomCore` are sent to you in the main thread by default.
     */
    public abstract void setListener(TUIRoomCoreListener listener);

    /**
     * Create a room (called by host)
     *
     * @param roomId     Room ID. You need to assign and manage the IDs in a centralized manner
     * @param speechMode Speech mode. Valid values:
     *                   TUIRoomCoreDef.SpeechMode.FREE_SPEECH: Users can speak freely;
     *                   TUIRoomDef.SpeechMode.APPLY_SPEECH: Users need permission to speak.
     * @param callback   Callback for room creation result. The `code` will be 0 if the operation succeeds.
     */
    public abstract void createRoom(int roomId, TUIRoomCoreDef.SpeechMode speechMode,
                                    TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Terminate a room (called by host)
     * 
     * After creating a room, the host can call this API to terminate it.
     * 
     * After calling the room termination API, other members will receive the `onDestroyRoom()` callback from
     * `TUIRoomCoreListener`.
     *
     * @param callback Callback for room termination result. The `code` will be 0 if the operation succeeds.
     */
    public abstract void destroyRoom(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Enter a room (called by member)
     *
     * @param roomId   Room ID. You need to assign and manage the IDs in a centralized manner
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void enterRoom(int roomId, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Exit a room (called by member)
     *
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void leaveRoom(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Get the room information
     * This API is used to get information such as room ID, name, speech mode, and start time.
     *
     * @return Room information
     */
    public abstract TUIRoomCoreDef.RoomInfo getRoomInfo();

    /**
     * Get the information of all members in the room
     * 
     * This API is used to get the list of information of members in the room.
     *
     * @return Room member information list
     */
    public abstract List<TUIRoomCoreDef.UserInfo> getRoomUsers();

    /**
     * Get the information of a room member
     * 
     * This API is used to get the user information of the specified `userId` in the room.
     *
     * @param userId   User ID
     * @param callback Callback for room member details
     */
    public abstract void getUserInfo(String userId, TUIRoomCoreCallback.UserInfoCallback callback);

    /**
     * Transfer the group to another user
     *
     * @param userId   ID of the target user
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void transferRoomMaster(String userId, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Set user information. The user information you set will be stored in Tencent Cloud IM.
     *
     * @param userName  Username
     * @param avatarURL User profile photo
     * @param callback  Result callback for whether the setting succeeds
     */
    public abstract void setSelfProfile(String userName, String avatarURL, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Enables local video preview
     *
     * @param isFront true: Front camera; false: Rear camera
     * @param view    The control that carries the video image
     */
    public abstract void startCameraPreview(boolean isFront, TXCloudVideoView view);

    /**
     * Stops local video capturing and preview
     */
    public abstract void stopCameraPreview();

    /**
     * Starts mic capturing
     *
     * @param quality Captured audio quality. Valid values: TRTC_AUDIO_QUALITY_MUSIC, TRTC_AUDIO_QUALITY_DEFAULT, and
     *                TRTC_AUDIO_QUALITY_SPEECH
     */
    public abstract void startLocalAudio(int quality);

    /**
     * Stops mic capturing
     */
    public abstract void stopLocalAudio();

    /**
     * Set the mirror mode for the local preview
     *
     * @param type Mirror type. Valid values: TRTCCloudDef.TRTC_VIDEO_MIRROR_TYPE_AUTO, TRTC_VIDEO_MIRROR_TYPE_ENABLE,
     *             and TRTC_VIDEO_MIRROR_TYPE_DISABLE
     */
    public abstract void setVideoMirror(int type);

    /**
     * Sets whether to use the device’s speaker or receiver
     *
     * @param isUseSpeaker true: Speaker; false: Receiver
     */
    public abstract void setSpeaker(boolean isUseSpeaker);

    /**
     * Subscribe to the video stream of a remote user
     *
     * @param userId     ID of the user whose video is to be played
     * @param view       The control that carries the video image
     * @param streamType Stream type
     * @param callback   Result callback
     */
    public abstract void startRemoteView(String userId, TXCloudVideoView view, TUIRoomCoreDef.SteamType streamType,
                                         TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Unsubscribe from the video stream of a remote user
     *
     * @param userId     ID of the user whose video playback needs to be stopped
     * @param streamType Stream type
     * @param callback   Result callback
     */
    public abstract void stopRemoteView(String userId, TUIRoomCoreDef.SteamType streamType,
                                        TUIRoomCoreCallback.ActionCallback callback);


    /**
     * Switches between the front and rear cameras
     *
     * @param isFront true: front camera; false: rear camera
     */
    public abstract void switchCamera(boolean isFront);

    /**
     * Broadcast a text chat message in the room. This API is generally used for text chat
     *
     * @param message  Message content
     * @param callback Callback for the sending result
     */
    public abstract void sendChatMessage(String message, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Send a custom message
     * 
     * This API is used to send a custom IM group message.
     *
     * @param data     Message content
     * @param callback Callback for sending result
     */
    public abstract void sendCustomMessage(String data, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Enable/Disable the mic of the specified user
     * When the host calls this API to disable/enable the mic of a member, the member will receive the
     * `onMicrophoneMuted()` callback.
     *
     * @param userId   User ID
     * @param mute     true: Disable the mic of a user; false: Enable the mic of a user
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void muteUserMicrophone(String userId, boolean mute, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Disable/Enable the mic of all users and sync the status to room information
     * When the host calls this API to disable/enable the mic of all members, the members will receive the
     * `onMicrophoneMuted()` callback.
     *
     * @param mute     true: Disable the mic of all users; false: Enable the mic of all users
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void muteAllUsersMicrophone(boolean mute, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Enable/Disable the camera of the specified user
     * 
     * When the host calls this API to disable/enable the camera of a member, the member will receive the
     * `onCameraMuted` callback.
     *
     * @param userId   User ID
     * @param mute     true: Disable the user camera; false: Enable the camera of the user whose ID is `user_id`
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void muteUserCamera(String userId, boolean mute, TUIRoomCoreCallback.ActionCallback callback);


    /**
     * Disable/Enable the camera of all users and sync the status to room information
     * When the host calls this API to disable/enable the camera of all members, the members will receive the
     * `onCameraMuted` callback.
     *
     * @param mute     true: Disable the camera of all users; false: Enable the camera of all users
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void muteAllUsersCamera(boolean mute, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Disable/Enable text chat
     * When the host calls this API to disable/enable IM chat in the room, the members will receive the
     * `onChatRoomMuted()` callback.
     *
     * @param mute     mute true: Disable chat; false: Enable chat
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void muteChatRoom(boolean mute, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Remove a user by the host
     * When the host calls this API to remove a member, the member will receive the `onReceiveKickedOff()` callback.
     *
     * @param userId   User ID
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void kickOffUser(String userId, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * The host starts roll call
     * 
     * When the host calls this API to start a roll call, the members will receive the `onCallingRollStarted()`
     * callback.
     *
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void startCallingRoll(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * The host stops roll call
     * 
     * When the host calls this API to end a roll call, the members will receive the `onCallingRollStopped()` callback.
     *
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void stopCallingRoll(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * A member replied to a roll call.
     * 
     * When a member replies to the roll call started by the host, the host will receive the
     * `onMemberReplyCallingRoll()` callback.
     *
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void replyCallingRoll(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * The host invites a user to speak
     * 
     * When the host calls this API to invite a user to speak, the user will receive the `onReceiveSpeechInvitation()
     * ` callback.
     *
     * @param userId   User ID
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void sendSpeechInvitation(String userId, TUIRoomCoreCallback.InvitationCallback callback);

    /**
     * The host cancels the invitation to speak sent to a user
     * 
     * When the host calls this API to cancel the mic-on invitation to a user, the user will receive the
     * `onReceiveInvitationCancelled()` callback.
     *
     * @param userId   User ID
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void cancelSpeechInvitation(String userId, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * A user accepts/rejects the host's mic-on invitation
     * 
     * A user needs to call this API to accept/reject the mic-on invitation from the host in `TUIRoomCoreDef
     * .SpeechMode.APPLY_SPEECH` mode.
     * The host will receive the `onReceiveReplyToSpeechInvitation` callback.
     *
     * @param agree    true: Accept; false: Reject
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void replySpeechInvitation(boolean agree, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * A user requests to speak.
     * 
     * When a member calls this API to request to speak, the host will receive the `onReceiveSpeechApplication`
     * callback.
     *
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void sendSpeechApplication(TUIRoomCoreCallback.InvitationCallback callback);

    /**
     * A member cancels the request to speak.
     * 
     * When a member calls this API to cancel their request to speak, the host will receive the
     * `onSpeechApplicationCancelled` callback.
     *
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void cancelSpeechApplication(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * The host approves/rejects a user’s request to speak
     * 
     * The host needs to call this API to approve/reject a user’s request in `TUIRoomCoreDef.SpeechMode.APPLY_SPEECH`
     * mode.
     * The user will receive the `onReceiveReplyToSpeechApplication` callback.
     *
     * @param agree    true: Accept; false: Reject
     * @param userId   User ID
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void replySpeechApplication(boolean agree, String userId,
                                                TUIRoomCoreCallback.ActionCallback callback);

    /**
     * The host disables requests to speak
     * 
     * When the host calls this API, the members will receive the `onSpeechApplicationForbidden` callback.
     *
     * @param forbid   true: Disable requests; false: Enable requests
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void forbidSpeechApplication(boolean forbid, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * The host notifies a user to stop speaking
     * 
     * When the host calls this API to stop the speech of a user, the user will receive the
     * `onOrderedToExitSpeechState()` callback notification.
     *
     * @param userId   User ID
     * @param callback Result callback. The `code` will be 0 if the operation succeeds.
     */
    public abstract void sendOffSpeaker(String userId, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * The host requests all users to stop speaking
     *
     * @param callback Result callback
     */
    public abstract void sendOffAllSpeakers(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * A user stops speaking and becomes an audience member
     * This API is used by a member to stop speaking and change their role to audience.
     *
     * @param callback Result callback
     */
    public abstract void exitSpeechState(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * Start screen sharing
     * 
     * Recommended configuration parameters for screen sharing on Android phones:
     * - Resolution (videoResolution): 1280x720
     * - Frame rate (videoFps): 10 fps
     * - Bitrate (videoBitrate): 1200 Kbps
     * - Resolution adaption (enableAdjustRes): false
     *
     * @param encParams         Screen sharing encoding parameters. We recommend you use the above configuration. If
     *                          you set `encParams` to `null`, the encoding parameter settings before
     *                          `startScreenCapture` is called will be used
     * @param screenShareParams Special screen sharing configuration. We recommend you set `floatingView` which can
     *                          prevent the application from being killed by the system and help protect user privacy
     */
    public abstract void startScreenCapture(TRTCCloudDef.TRTCVideoEncParam encParams,
                                            TRTCCloudDef.TRTCScreenShareParams screenShareParams);

    /**
     * Stop screen sharing
     */
    public abstract void stopScreenCapture();

    /**
     * Get the beauty filter management object
     * 
     * You can do the following using TXBeautyManager:
     * - Set the beauty filter style and apply effects including skin brightening, rosy skin, eye enlarging, face
     * slimming, chin slimming, chin lengthening/shortening, face shortening, nose narrowing, eye brightening, teeth
     * whitening, eye bag removal, wrinkle removal, and smile line removal.
     * - Adjust the hairline, eye spacing, eye corners, lip shape, nose wings, nose position, lip thickness, and face
     * shape.
     * - Apply animated effects such as face widgets (materials).
     * - Add makeup effects.
     * - Recognize gestures.
     *
     * @return
     */
    public abstract TXBeautyManager getBeautyManager();

    /**
     * Set the network QoS parameter
     *
     * @param preference The QoS control policy
     */
    public abstract void setVideoQosPreference(TRTCCloudDef.TRTCNetworkQosParam preference);

    /**
     * Sets the audio quality
     *
     * @param quality TRTC_AUDIO_QUALITY_MUSIC/TRTC_AUDIO_QUALITY_DEFAULT/TRTC_AUDIO_QUALITY_SPEECH
     */
    public abstract void setAudioQuality(int quality);

    /**
     * Sets the resolution
     *
     * @param resolution For the specific settings, see `TRTCCloudDef.TRTC_VIDEO_RESOLUTION_xx`.
     */
    public abstract void setVideoResolution(int resolution);

    /**
     * Sets the frame rate
     *
     * @param fps
     */
    public abstract void setVideoFps(int fps);

    /**
     * Sets the bitrate
     *
     * @param bitrate Bitrate
     */
    public abstract void setVideoBitrate(int bitrate);

    /**
     * Enable the volume level reminder
     * After this feature is enabled, the evaluation result of the volume level by the SDK will be obtained in
     * `onUserVolumeUpdate`.
     *
     * @param enable true: Enable; false: Disable
     */
    public abstract void enableAudioEvaluation(boolean enable);

    /**
     * Sets the playback volume
     *
     * @param volume Playback volume. Value range: 0-100
     */
    public abstract void setAudioPlayVolume(int volume);

    /**
     * Sets the mic capturing volume
     *
     * @param volume Capturing volume. Value range: 0-100
     */
    public abstract void setAudioCaptureVolume(int volume);

    /**
     * Start audio recording
     * After this API is called, the SDK will record all audios (such as local audio, remote audio, and background
     * music) in the current call to a file.
     * No matter whether room entry is performed, this API will take effect once called.
     * When `leaveRoom` is called, audio recording will stop automatically.
     *
     * @param params
     */
    public abstract void startFileDumping(TRTCCloudDef.TRTCAudioRecordingParams params);

    /**
     * Stop audio recording
     * When `leaveRoom` is called, audio recording will stop automatically.
     */
    public abstract void stopFileDumping();

    /**
     * Get the SDK version
     *
     * @return SDK version number
     */
    public abstract int getSdkVersion();
}