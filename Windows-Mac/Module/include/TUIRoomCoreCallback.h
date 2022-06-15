// Copyright (c) 2021 Tencent. All rights reserved.
/*
* Module:   TUIRoomCoreCallback @
*
* Function: 腾讯云教育场景视频通话功能的回调接口类，若想从C++代码中获取到SDK的回调，
* 请继承此类并调用 AddCallback(const TUIRoomCoreCallback& callback)设置观察者
*
*/

/*
* Module:   TUIRoomCoreCallback @
*
* Description: Tencent Cloud video call feature callback API class for education scenarios. If you want to get the SDK callbacks from C++ code,
* inherit this class and call `AddCallback(const TUIRoomCoreCallback& callback)` to set an observer.
*
*/

#ifndef MODULE_INCLUDE_TUIROOMCORECALLBACK_H_
#define MODULE_INCLUDE_TUIROOMCORECALLBACK_H_

#include "TUIRoomDef.h"
#ifdef _WIN32
#include "ITXLiteAVLocalRecord.h"
#endif
#include "ITRTCStatistics.h"

/**
* 腾讯云TUIRoomCoreCallback回调接口类
*/

/**
* Tencent Cloud `TUIRoomCoreCallback` callback API class
*/
class TUIRoomCoreCallback {
public:
    virtual ~TUIRoomCoreCallback() {}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                （一）错误事件回调 (Error Event Callbacks)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 错误事件回调 (Error event callback)
    /// @{
    /**
     * 1.1 错误回调
     *
     * SDK 不可恢复的错误，一定要监听，并分情况给用户适当的界面提示。
     *
     * @param code 	错误码
     * @param message 	错误信息
     */

    /**
     * 1.1 Error callback
     *
     * This callback indicates that the SDK encountered an unrecoverable error. Such errors must be listened for, and UI reminders should be sent to users if necessary.
     *
     * @param code 	Error code
     * @param message 	Error message
     */
    virtual void OnError(int code, const std::string& message) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                 （二）基础事件回调 (Basic Event Callbacks)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 基础事件回调 (Basic event callbacks)
    /// @{
    /**
     * 2.1 登录回调
     *
     * 用户调用Login接口，登录后返回的登录结果以及登录的信息。
     *
     * @param code 	错误码
     * @param message 	登录信息或登录失败的错误信息
     */

    /**
     * 2.1 Login callback
     *
     * This callback indicates the login result and message returned after a user calls the `Login` API to log in.
     *
     * @param code 	Error code
     * @param message 	Login message or error message of login failure
     */
    virtual void OnLogin(int code, const std::string& message) = 0;

    /**
     * 2.2 登出回调
     *
     * 用户调用Logout接口,登出后返回的登出结果以及登出的信息。
     *
     * @param code 	错误码
     * @param message 	登出信息或登出失败的错误信息
     */

    /**
     * 2.2 Logout callback
     *
     * This callback indicates the logout result and message returned after a user calls the `Logout` API to log out.
     *
     * @param code 	Error code
     * @param message 	Logout message or error message of logout failure
     */
    virtual void OnLogout(int code, const std::string& message) = 0;

    /**
     * 2.3 创建房间回调
     *
     * 用户调用CreateRoom接口,创建房间的接口回调信息。
     *
     * @param code 	错误码
     * @param message 	创建房间的信息或创建失败的错误信息
     */

    /**
     * 2.3 Callback for room creation
     *
     * A user called the `CreateRoom` API to create a room.
     *
     * @param code 	Error code
     * @param message 	Room creation message or error message of creation failure
     */
    virtual void OnCreateRoom(int code, const std::string& message) = 0;

    /**
     * 2.4 房间解散回调
     *
     * 主持人调用DestroyRoom接口,解散房间的接口回调信息。
     *
     * @param code 	错误码
     * @param message 	解散房间的信息或解散失败的错误信息
     */

    /**
     * 2.4 Callback for closing a room
     *
     * The host called the `DestroyRoom` API to close the room.
     *
     * @param code 	Error code
     * @param message Room closed message or error message indicating the room failed to close
     */
    virtual void OnDestroyRoom(int code, const std::string& message) = 0;

    /**
     * 2.5 进入房间回调
     *
     * 用户调用EnterRoom接口,进入房间的接口回调信息。
     *
     * @param code 	错误码
     * @param message 	进入房间的信息或进入房间的错误信息
     */

    /**
     * 2.5 Callback for room entry
     *
     * A user called the `EnterRoom` API to enter a room.
     *
     * @param code 	Error code
     * @param message Room entry message or error message indicating failure to enter the room
     */
    virtual void OnEnterRoom(int code, const std::string& message) = 0;

    /**
     * 2.6 退出房间回调
     *
     * 用户调用ExitRoom接口，主持人解散房间，主持人踢出房间，网络异常等情况下退出房间的接口回调信息。
     *
     * @param type 	  退出类型参考TUIExitRoomType定义
     * @param message 退出房间的描述
     */

    /**
     * 2.6 Callback for room exit
     *
     * A user exits the room in the following cases: the user calls the `ExitRoom` API, the host closes the room or removes the user from the room, or a network exception occurs.
     *
     * @param type 	  Exit type. For more information, see the definition of `TUIExitRoomType`.
     * @param message Room exit description
     */
    virtual void OnExitRoom(TUIExitRoomType type, const std::string& message) = 0;

    /**
     * 2.7 开始渲染自己本地或远端用户的首帧画面
     *
     * SDK 会在渲染自己本地或远端用户的首帧画面时抛出该事件，您可以通过回调事件中的 user_id 参数
     * 来判断事件来自于“本地”还是来自于“远端”。
     *
     * @param  user_id 本地或远端的用户标识，如果 user_id 为空值代表自己，user_id 不为空则代表远端用户。
     * @param  stream_type 视频流类型：主路（Main）一般用于承载摄像头画面，辅路（Sub）一般用于承载屏幕分享画面。
     */

    /**
     * 2.7 Callback for starting rendering first video frame of local or a remote user
     *
     * The SDK returns this event callback when it starts rendering your first video frame or that of a remote user. The `user_id` in the callback
     * can help you determine whether the frame is yours or a remote user's.
     *
     * @param  user_id User ID of the local or a remote user. If it is empty, it indicates the local user; if it is not empty, it indicates a remote user
     * @param  stream_type Video stream type. The primary stream (`Main`) is usually used for camera images, and the substream (`Sub`) for screen sharing images
     */
    virtual void OnFirstVideoFrame(const std::string& user_id, const TUIStreamType stream_type) = 0;

    /**
     * 2.8 用户音量大小回调通知
     *
     * 对用户的音量大小进行回调通知，更新界面的显示
     *
     * @param user_id 本地或远端的用户标识。
     * @param volume 用户的音量大小，取值范围 0 - 100。
     */

    /**
     * 2.8 * Callback for user volume level
     *
     * This callback indicates the user volume level, which is used to update the volume level displayed on the UI.
     *
     * @param user_id Local or remote user ID
     * @param volume User volume level. Value range: 0–100
     */
    virtual void OnUserVoiceVolume(const std::string& user_id, int volume) {}

    /**
     * 2.9 主持人更改回调
     *
     * 主持人更改回调
     *
     * @param user_id 更改后的主持人。
     */

    /**
     * 2.9 Callback for host change
     *
     * The host was changed.
     *
     * @param user_id New host
     */
    virtual void OnRoomMasterChanged(const std::string& user_id) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //              （三）远端用户事件回调 (Remote User Event Callbacks)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 远端用户事件回调 (Remote user event callbacks)
    /// @{
    /**
     * 3.1 远端用户进入房间回调
     *
     * 远端用户进入房间的回调信息。
     *
     * @param user_id 	用户ID
     */

    /**
     * 3.1 Callback for room entry of remote user
     *
     * A remote user entered a room.
     *
     * @param user_id User ID
     */
    virtual void OnRemoteUserEnter(const std::string& user_id) = 0;

    /**
     * 3.2 远端用户离开房间回调
     *
     * 远端用户离开房间的回调信息。
     *
     * @param user_id 	用户ID
     */

    /**
     * 3.2 Callback for room exit of remote user
     *
     * A remote user exited a room.
     *
     * @param user_id User ID
     */
    virtual void OnRemoteUserLeave(const std::string& user_id) = 0;

    /**
     * 3.3 远端用户是否开启摄像头视频
     *
     * 当您收到 OnRemoteUserCameraAvailable(user_id, true) 通知时，表示该路画面已经有可用的视频数据帧到达。
     *
     * @param user_id 	用户ID
     * @param available  是否有视频数据
     */

    /**
     * 3.3 Callback for whether a remote user is sending video data
     *
     * When the `OnRemoteUserCameraAvailable(user_id, true)` notification is received, it indicates that video data is available from a user.
     *
     * @param user_id User ID
     * @param available  Whether video data is available
     */
    virtual void OnRemoteUserCameraAvailable(const std::string& user_id, bool available) = 0;

    /**
     * 3.4 远端用户是否开启屏幕分享
     *
     * 当您收到 OnRemoteUserScreenAvailable(user_id, true) 通知时，表示该用户开启了屏幕分享，有可用的屏幕分享流数据帧到达。
     *
     * @param user_id 	用户ID
     * @param available  是否有屏幕分享流数据
     */

    /**
     * 3.4 Callback for enabling screen sharing by remote user
     *
     * When the `OnRemoteUserScreenAvailable(user_id, true)` notification is received, it indicates that a user has enabled screen sharing and screen sharing data is available.
     *
     * @param user_id User ID
     * @param available  Whether screen sharing data is available
     */
    virtual void OnRemoteUserScreenAvailable(const std::string& user_id, bool available) = 0;

    /**
     * 3.5 远端用户是否开启音频上行
     *
     * 当您收到 OnRemoteUserAudioAvailable(user_id, true) 通知时，表示该用户开启了麦克风。
     *
     * @param user_id 	用户ID
     * @param available  是否有音频数据
     */

    /**
     * 3.5 Callback for whether a remote user is sending audio data
     *
     * When the `OnRemoteUserAudioAvailable(user_id, true)` notification is received, it indicates that a user turned on their microphone.
     *
     * @param user_id User ID
     * @param available  Whether audio data is available
     */
    virtual void OnRemoteUserAudioAvailable(const std::string& user_id, bool available) = 0;

    /**
     * 3.6 远端用户开始发言
     *
     * 当您收到 OnRemoteUserEnterSpeechState(user_id) 通知时，表示该用户发言成功。
     *
     * @param user_id 用户ID
     */

    /**
     * 3.6 Callback for microphone-on of remote user
     *
     * When the `OnRemoteUserEnterSpeechState(user_id)` notification is received, it indicates that a user is speaking.
     *
     * @param user_id User ID
     */
    virtual void OnRemoteUserEnterSpeechState(const std::string& user_id) = 0;

    /**
     * 3.7 远端用户结束发言
     *
     * 当您收到 OnRemoteUserExitSpeechState(user_id) 通知时，表示该用户已经停止发言。
     *
     * @param user_id 用户ID
     */

    /**
     * 3.7 Callback for speech stop of remote user
     *
     * When the `OnRemoteUserExitSpeechState(user_id)` notification is received, it indicates that a user stopped speaking.
     *
     * @param user_id User ID
     */
    virtual void OnRemoteUserExitSpeechState(const std::string& user_id) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //          （四）聊天室消息事件回调 (Chat Room Message Event Callbacks)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 聊天室消息事件回调 (Chat room message event callbacks)
    /// @{
    /**
     * 4.1 接收消息回调
     *
     * 聊天室收到消息回调信息。
     *
     * @param user_id  用户ID
     * @param message  聊天消息内容
     */

    /**
     * 4.1 Callback for receiving a message
     *
     * The chat room received a message.
     *
     * @param user_id  User ID
     * @param message  Chat message content
     */
    virtual void OnReceiveChatMessage(const std::string& user_id, const std::string& message) = 0;

    /**
     * 4.2 接收自定义消息回调
     *
     * 聊天室收到消息回调信息。
     *
     * @param user_id  用户ID
     * @param message  聊天消息内容
     */

    /**
     * 4.2 Callback for receiving a custom message
     *
     * The chat room received a message.
     *
     * @param user_id  User ID
     * @param message  Chat message content
     */
    virtual void OnReceiveCustomMessage(const std::string& user_id, const std::string& message) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //             （五）场控相关事件回调 (Room Control Event Callbacks)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 场控相关事件回调 (Room control event callbacks)
    /// @{
    /**
     * 5.1 用户收到主持人发言邀请回调
     *
     * 主持人调用SendSpeechInvitation接口邀请用户发言后，用户收到的回调，用户需要进行回复。
     */

    /**
     * 5.1 Callback for host sending an invitation to speak
     *
     * The host called the `SendSpeechInvitation` API to invite the user to speak. The user needs to reply to the invitation.
     */
    virtual void OnReceiveSpeechInvitation() = 0;

    /**
     * 5.2 用户收到主持人取消发言邀请回调
     *
     * 主持人调用CancelSpeechInvitation接口取消邀请用户发言后，用户收到的回调。
     */

    /**
     * 5.2 Callback for host canceling an invitation to speak
     *
     * The host called the `CancelSpeechInvitation` API to cancel the invitation to speak sent to the user.
     */
    virtual void OnReceiveInvitationCancelled() = 0;

    /**
     * 5.3 主持人收到用户同意邀请发言的回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，用户调用ReplySpeechInvitation接口回应主持人发言邀请时，
     * 主持人收到的回调
     *
     * @param user_id  用户ID
     * @param agree    是否同意发言 true为同意， false为不同意
     */

    /**
     * 5.3 Callback for user accepting an invitation to speak
     *
     * The user called the `ReplySpeechInvitation` API
     * to respond to the microphone-on invitation sent by the host in `TUISpeechMode::kApplySpeech` mode.
     *
     * @param user_id  User ID
     * @param agree    Whether the user agrees to speak. Valid values: true: Yes; false: No
     */
    virtual void OnReceiveReplyToSpeechInvitation(const std::string& user_id, bool agree) = 0;

    /**
     * 5.4 主持人收到用户发言申请的回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，用户调用SendSpeechApplication接口向主持人申请发言时，
     * 主持人收到的回调，主持人需要操作并调用ReplySpeechApplication接口对申请进行回应。
     *
     * @param user_id  用户ID
     */

    /**
     * 5.4 Callback for receiving a request to speak
     *
     * A user called the `SendSpeechApplication` API to send a microphone-on request to the host in `TUISpeechMode::kApplySpeech` mode.
     * The host needs to process the request and call the `ReplySpeechApplication` API to reply to the request.
     *
     * @param user_id  User ID
     */
    virtual void OnReceiveSpeechApplication(const std::string& user_id) = 0;

    /**
     * 5.5 用户取消申请发言回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，用户调用CancelSpeechApplication接口取消申请发言时，主持人收到的回调。
     *
     * @param user_id  用户ID
     */

    /**
     * 5.5 Callback for user canceling their request to speak
     *
     * A user called the `CancelSpeechApplication` API to cancel their request to speak in `TUISpeechMode::kApplySpeech` mode.
     *
     * @param user_id  User ID
     */
    virtual void OnSpeechApplicationCancelled(const std::string& user_id) = 0;

    /**
     * 5.6 主持人同意发言申请回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，主持人调用ReplySpeechApplication接口回应用户申请发言时，
     * 用户收到的回调，用户根据主持人是否同意决定是否可以发言。
     *
     * @param agree  是否同意发言 true为同意， false为不同意
     */

    /**
     * 5.6 Callback for host approving a request to speak
     *
     * The host called the `ReplySpeechApplication` API to reply to the user's microphone-on request in `TUISpeechMode::kApplySpeech` mode.
     * The user determines whether to speak based on the host's decision.
     *
     * @param agree   Whether the host allows the user to speak. Valid values: true: Yes; false: No
     */
    virtual void OnReceiveReplyToSpeechApplication(bool agree) = 0;

    /**
     * 5.7 主持人禁止申请发言回调
     *
     * 主持人禁止申请发言回调。
     *
     * @param forbidden true,发言申请被禁用, false 可以申请发言
     */

    /**
     * 5.7 Callback for host disabling requests to speak
     *
     * The host disabled requests to speak.
     *
     * @param forbidden true: Requests to speak are disabled; false: Requests are allowed
     */
    virtual void OnSpeechApplicationForbidden(bool forbidden) = 0;

    /**
     * 5.8 成员被请求停止发言的回调
     *
     * 主持人调用SendOffSpeaker接口请求用户停止发言后，用户收到的回调，用户需要停止发言。
     */

    /**
     * 5.8 Callback for host requesting a user to stop speaking
     *
     * The host called the `SendOffSpeaker` API to request the user to stop speaking. 
     */
    virtual void OnOrderedToExitSpeechState() = 0;

    /**
     * 5.9 主持人开始点名，成员收到的回调
     *
     * 主持人开始点名，成员收到的回调。
     */

    /**
     * 5.9 Callback for starting a roll call
     *
     * The host started a roll call.
     */
    virtual void OnCallingRollStarted() = 0;

    /**
     * 5.10 主持人结束点名，成员收到的回调
     *
     * 主持人结束点名，成员收到的回调。
     */

    /**
     * 5.10 Callback for ending a roll call
     *
     * The host ended a roll call.
     */
    virtual void OnCallingRollStopped() = 0;

    /**
     * 5.11 成员回复点名，主持人收到的回调
     *
     * 成员回复点名，主持人收到的回调。
     *
     * @param user_id 用户id
     */

    /**
     * 5.11 Callback for replying to roll call
     *
     * A user replied to a roll call.
     *
     * @param user_id User ID
     */
    virtual void OnMemberReplyCallingRoll(const std::string& user_id) = 0;

    /**
     * 5.12 主持人更改聊天室是否禁言回调
     *
     * 主持人设置聊天室是否禁言的回调。
     *
     * @param mute  true,聊天室不可以发消息  false聊天室可以发消息
     */

    /**
     * 5.12 Callback for muting/unmuting a chat room 
     *
     * The host set whether to mute or unmute the chat room.
     *
     * @param mute  true: No messages can be sent in the chat room; false: Messages can be sent in the chat room
     */
    virtual void OnChatRoomMuted(bool muted) = 0;

    /**
     * 5.13 主持人设置禁用麦克风回调
     *
     * 主持人禁用用户麦克风的回调。
     *
     * @param mute  true,用户麦克风被禁用  false用户麦克风打开
     */

    /**
     * 5.13 Callback for disabling microphone
     *
     * The host disabled a user's microphone.
     *
     * @param mute  true: The user's microphone is disabled; false: The user's microphone is enabled
     */
    virtual void OnMicrophoneMuted(bool muted) = 0;

    /**
     * 5.14 主持人设置禁用摄像头回调
     *
     * 主持人禁用用户摄像头的回调。
     *
     * @param mute  true,用户摄像头被禁用  false用户摄像头打开
     */

    /**
     * 5.14 Callback for disabling camera
     *
     * The host disabled a user's camera.
     *
     * @param mute  true: The user's camera is disabled; false: The user's camera is enabled
     */
    virtual void OnCameraMuted(bool muted) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    // （六）统计和质量回调 (Callbacks for Statistics on Quality and Technical Metrics)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 统计和质量回调 (Callbacks of statistics on quality and technical metrics)
    /// @{
    /**
     * 6.1 技术指标统计回调
     *
     * 如果您是熟悉音视频领域相关术语，可以通过这个回调获取 SDK 的所有技术指标。
     * 如果您是首次开发音视频相关项目，可以只关注 onNetworkQuality 回调，每2秒回调一次。
     *
     * @param statis 统计数据，包括本地和远程的
     */

    /**
     * 6.1. Callback of technical metric statistics
     *
     * If you are familiar with audio/video terms, you can use this callback to get all technical metrics of the SDK.
     * If you are developing an audio/video project for the first time, you can focus only on the `onNetworkQuality` callback, which is triggered once every two seconds.
     *
     * @param statis Statistics of local and remote users
     */
    virtual void OnStatistics(const liteav::TRTCStatistics& statis) {}

    /**
     *
     * 6.2 网络质量：
     *
     * 该回调每2秒触发一次，统计当前网络的上行和下行质量
     * user_id == null 代表自己当前的视频质量
     *
     * @param local_quality 上行网络质量
     * @param remote_quality 下行网络质量
     * @param remote_quality_count 下行网络质量的数组大小
     */

    /**
     *
     * 6.2. Callback for network quality
     *
     * This callback is triggered once every two seconds to collect statistics of the current upstream and downstream network quality.
     * user_id == null` indicates the current local video quality
     *
     * @param local_quality Upstream network quality
     * @param remote_quality Downstream network quality
     * @param remote_quality_count Number of elements in the downstream network quality array
     */
    virtual void OnNetworkQuality(const liteav::TRTCQualityInfo& local_quality, liteav::TRTCQualityInfo* remote_quality,
        uint32_t remote_quality_count) {}
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                （七）屏幕分享相关回调 (Screen Sharing Callbacks)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 屏幕分享相关回调 (Screen sharing callbacks)
    /// @{
    /**
     * 7.1 开始屏幕分享回调
     *
     * 用户调用StartScreenCapture开始屏幕分享后的回调。
     */

    /**
     * 7.1 Callback for starting screen sharing
     *
     * A user called `StartScreenCapture` to start screen sharing.
     */
    virtual void OnScreenCaptureStarted() {}

    /**
     * 7.2 停止屏幕分享回调
     *
     * 用户调用StopScreenCapture停止屏幕分享后的回调。
     *
     * @param reason 停止原因，0：用户主动停止；1：屏幕窗口关闭导致停止；2：表示屏幕分享的显示屏状态变更（如接口被拔出、投影模式变更等）。
     */

    /**
     * 7.2 Callback for stopping screen sharing
     *
     * A user called `StopScreenCapture` to stop screen sharing.
     *
     * @param reason Reason for stop. 0: The user stopped screen sharing; 1: Screen sharing stopped because the shared window was closed; 2: The screen sharing monitor status changed (for example, the interface was disconnected or the screen projection mode changed)
     */
    virtual void OnScreenCaptureStopped(int reason) {}
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                 （八）视频录制回调 (Video Recording Callbacks)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 视频录制回调 (Video recording callbacks)
    /// @{
#ifdef _WIN32
    /**
     * 8.1 录制错误回调
     *
     * 用户调用StartCloudRecord录制视频错误回调。
     *
     * @param error   错误码，错误码详情查看 TXLiteAVLocalRecordError 的定义
     * @param messgae 错误信息
     */

    /**
     * 8.1 Callback for recording error
     *
     * An error occurred when a user called `StartCloudRecord` to record video.
     *
     * @param error   Error code. For more information on error codes, see the definition of `TXLiteAVLocalRecordError`.
     * @param messgae Error message
     */
    virtual void OnRecordError(TXLiteAVLocalRecordError error, const std::string& messgae) {}

    /**
     * 8.2 录制完成回调
     *
     * 用户调用StopCloudRecord结束录制视频，录制完成回调。
     *
     * @param path 录制视频文件存放的路径
     */

    /**
     * 8.2 Callback for recording stop
     *
     * A user called `StopCloudRecord` to stop video recording.
     *
     * @param path Path of recorded video file
     */
    virtual void OnRecordComplete(const std::string& path) {}

    /**
     * 8.3 录制进度回调
     *
     * 用户调用StartCloudRecord录制视频，视频录制进度回调。
     *
     * @param duration  当前录制文件的时长，单位( MS )。
     * @param file_size 当前录制文件的大小，单位( Byte )。
     */

    /**
     * 8.3 Callback for recording progress
     *
     * This callback indicates the video recording progress when a user calls `StartCloudRecord` to record video.
     *
     * @param duration  Recording file duration in milliseconds
     * @param file_size Recording file size in bytes
     */
    virtual void OnRecordProgress(int duration, int file_size) {}
#endif
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //             （九）本地设备测试回调 (Local Device Testing Callbacks)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 用户音量回调 (User volume callbacks)
    /// @{
    /**
     * 9.1 扬声器音量大小回调
     *
     * 用户扬声器音量大小的回调。
     *
     * @param volume   音量大小
     */

    /**
     * 9.1 Callback for speaker volume
     *
     * This callback returns the speaker volume of a user.
     *
     * @param volume   Volume
     */
    virtual void OnTestSpeakerVolume(uint32_t volume) {}

    /**
     * 9.2 麦克风音量大小回调
     *
     * 用户麦克风音量大小的回调。
     *
     * @param volume   音量大小
     */

    /**
     * 9.2 Callback for microphone volume
     *
     * This callback returns the microphone volume of a user.
     *
     * @param volume   Volume
     */
    virtual void OnTestMicrophoneVolume(uint32_t volume) {}

    /**
     * 9.3 调节系统采集音量回调。
     *
     * 用户从系统里修改了采集音量，通过此回调通知上层。
     *
     * @param volume   表示大小
     * @param muted    麦克风是否被用户禁用了：true 被禁用，false 被启用。
     */

    /**
     * 9.3 Callback for adjusting volume of system capturing
     *
     * This callback is used to notify the upper layer when a user modifies the system capturing volume.
     *
     * @param volume   Volume
     * @param muted    Whether the microphone is muted. Valid values: true: Muted; false: Unmuted
     */
    virtual void OnAudioDeviceCaptureVolumeChanged(uint32_t volume, bool muted) {}

    /**
     * 9.4 调节系统播放音量回调。
     *
     * 用户从系统里修改了播放音量，通过此回调通知上层。
     *
     * @param volume   表示大小
     * @param muted    系统是否被用户静音了：true 被静音，false 已恢复。
     */

    /**
     * 9.4 Callback for adjusting system playback volume
     *
     * This callback is used to notify the upper layer when a user modifies the system playback volume.
     *
     * @param volume   Volume
     * @param muted    Whether the system is muted. Valid values: true: Muted; false: Unmuted
     */
    virtual void OnAudioDevicePlayoutVolumeChanged(uint32_t volume, bool muted) {}
    /// @}
};

#endif  //  MODULE_INCLUDE_TUIROOMCORECALLBACK_H_
