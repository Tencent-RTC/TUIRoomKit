// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_INCLUDE_TUIROOMCORE_H_
#define MODULE_INCLUDE_TUIROOMCORE_H_

#include <vector>
#include <mutex>
#include "TUIRoomDef.h"
#include "TUIRoomCoreCallback.h"
#include "IScreenShareManager.h"

class TUIRoomCore {
 public:
    /**
     * 用于获取 TUIRoomCore 对象指针。
     *
     * @return 返回 TUIRoomCore 单例对象的指针，需要调用 DestroyInstance 释放单例指针对象。
     */

    /**
     * Get the object pointer of `TUIRoomCore`.
     *
     * @return Return the pointer of the `TUIRoomCore` singleton object. You need to call `DestroyInstance` to release the singleton pointer object.
     */
    static TUIRoomCore* GetInstance();

    /**
     * 释放 TUIRoomCore 单例对象。
     */

    /**
     * Release a `TUIRoomCore` singleton object
     */
    static void DestroyInstance();

    /**
     * 设置回调接口 TUIRoomCoreCallback
     *
     * 您可以通过 TUIRoomCoreCallback 获得各种状态通知，详见 TUIRoomCoreCallback.h 中的定义。
     *
     * @param callback 事件回调指针。
     */

    /**
     * Set the `TUIRoomCoreCallback` callback API
     *
     * You can use `TUIRoomCoreCallback` to get various status notifications. For more information, see the definition in `TUIRoomCoreCallback.h`.
     *
     * @param callback Event callback pointer
     */
    virtual void SetCallback(TUIRoomCoreCallback* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                          （一）基础接口 (Basic APIs)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 1.1 登录
     *
     * 调用登录接口后，会收到来自TUIRoomCoreCallback中的OnLogin()回调通知，表面是否登录成功。
     *
     * @param  sdk_appid ：它是腾讯云用于区分客户的唯一标识
     *                    进入腾讯云实时音视频[控制台](https://console.cloud.tencent.com/rav ) 创建应用，即可看到 SDKAppId,
     * @param  user_id ：用户ID，用于区分不同用户。
     * @param  user_sig ：用户签名，用于腾讯云流量的认证。
     */

    /**
     * 1.1 Login
     *
     * After calling the login API, you will receive the `OnLogin()` callback notification in `TUIRoomCoreCallback`, indicating whether login succeeds.
     *
     * @param  sdk_appid: Unique ID of a Tencent Cloud account
     *                    You can view your `SDKAppId` after creating an application in the [TRTC console](https://console.cloud.tencent.com/rav).
     * @param  user_id: User ID used to distinguish between different users
     * @param  user_sig: User signature for Tencent Cloud traffic authentication
     */
    virtual int Login(int sdk_appid, const std::string& user_id, const std::string& user_sig) = 0;

    /**
     * 1.2 退出
     *
     * 调用退出接口后，会收到来自TUIRoomCoreCallback中的OnLogout()回调通知，用于退出后的资源释放处理。
     */

    /**
     * 1.2 Logout
     *
     * After calling the logout API, you will receive the `OnLogout()` callback notification in `TUIRoomCoreCallback` for resource release after the logout.
     */
    virtual int Logout() = 0;

    /**
     * 1.3 创建房间
     *
     * 根据room_id创建一个房间，创建成功后即为主持人，成员只能进入房间，不能创建。
     * 调用创建房间接口后，会收到来自TUIRoomCoreCallback中的OnCreateRoom()回调通知。
     */

    /**
     * 1.3 Room creation
     *
     * This API is used to create a room by `room_id`. After the creation succeeds, you will become the host. A member can only enter a room but not create one.
     * After calling the room creation API, you will receive the `OnCreateRoom()` callback notification in `TUIRoomCoreCallback`.
     */
    virtual int CreateRoom(const std::string& room_id, TUISpeechMode speech_mode) = 0;

    /**
     * 1.4 销毁房间
     *
     * 调用 DestroyRoom() 接口会解散房间，该接口只能是主持人调用。
     * 调用销毁房间接口后，会收到来自TUIRoomCoreCallback中的OnDestroyRoom()回调通知。
     */

    /**
     * 1.4 Room termination
     *
     * You can call the `DestroyRoom()` API to terminate a room. This API can be called only by the host.
     * After calling the room termination API, you will receive the `OnDestroyRoom()` callback notification in `TUIRoomCoreCallback`.
     */
    virtual int DestroyRoom() = 0;

    /**
     * 1.5 进入房间
     *
     * 调用该接口后，会收到来自TUIRoomCoreCallback中的OnEnterRoom()回调通知来确认是否进房成功。
     */

    /**
     * 1.5. Enter room
     *
     * After calling this API, you will receive the `OnEnterRoom()` notification in `TUIRoomCoreCallback` to confirm whether the room entry succeeded.
     */
    virtual int EnterRoom(const std::string& room_id) = 0;

    /**
     * 1.6 离开房间
     *
     * 调用离开房间接口后，会收到来自TUIRoomCoreCallback中的OnExitRoom()回调通知，可根据返回code确认离开房间的具体原因。
     */

    /**
     * 1.6. Exit room
     *
     * After calling the room exit API, you will receive the `OnExitRoom()` callback notification in `TUIRoomCoreCallback`. You can confirm the specific reason for room exit based on the returned code.
     */
    virtual int LeaveRoom() = 0;

    /**
     * 1.7 获取房间信息
     *
     * 该接口用于获取房间的ID、房间名称、场控模式以及是否禁言等信息。
     */

    /**
     * 1.7 Getting room information
     *
     * This API is used to get information such as room ID, room name, room control mode, and whether members are muted.
     */
    virtual TUIRoomInfo GetRoomInfo() = 0;

    /**
     * 1.8 获取房间内的用户信息列表
     *
     * 调用该接口可以获取房间内的成员列表信息。
     */

    /**
     * 1.8 Getting room user information list
     *
     * This API is used to get the list of information of members in the room.
     */
    virtual std::vector<TUIUserInfo> GetRoomUsers() = 0;

    /**
     * 1.9 获取房间内指定用户的信息
     *
     * 调用该接口可以获取房间内指定user_id的用户信息
     * @ param user_id 要获取用户信息的用户ID。
     */

    /**
     * 1.9 Getting information of specified user in room
     *
     * This API is used to get the information of the user with the specified `user_id` in the room.
     * @ param user_id ID of the user whose information is to be obtained
     */
    virtual const TUIUserInfo* GetUserInfo(const std::string& user_id) = 0;

    /**
     * 1.10 设置用户属性
     *
     * @param  user_name  :用户姓名，用于设置用户的名称。
     * @param  avatar_url :用户头像url，用于设置用户的头像。
     */

    /**
     * 1.10 Setting user attributes
     *
     * @param  user_name: User name
     * @param  avatar_url: User profile photo URL for setting the user profile photo
     */
    virtual int SetSelfProfile(const std::string& user_name, const std::string& avatar_url) = 0;

    /**
     * 1.11 将群转交给其他用户
     *
     * @param  user_id : 用户id
     */

    /**
     * 1.11 Transferring group ownership to another user
     *
     * @param  user_id: User ID
     */
    virtual int TransferRoomMaster(const std::string& user_id) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                  （二）本地推流接口 (Local Push APIs)
    //
    /////////////////////////////////////////////////////////////////////////////////
        /**
     * 2.0 开始本地摄像头测试
     *
     * 该接口用于打开本地摄像头进行视频预览测试。
     *
     * @param start 开始测试或关闭测试。
     * @param view 承载预览画面的控件。
     */

     /**
      * 2.1 Starting local camera test
      *
      * This API is used to turn on the local camera for video test.
      *
      * @param start Control whether to start test
      * @param view Control that carries the preview image
      */
    virtual int StartCameraDeviceTest(bool start, const liteav::TXView& view = nullptr) = 0;

    /**
     * 2.1 开始本地摄像头预览
     *
     * 该接口用于打开本地摄像头进行视频预览。
     *
     * @param view 承载预览画面的控件。
     */

    /**
     * 2.1 Starting local camera preview
     *
     * This API is used to turn on the local camera for video preview.
     *
     * @param view Control that carries the preview image
     */
    virtual int StartCameraPreview(const liteav::TXView& view) = 0;

    /**
     * 2.2 停止本地摄像头预览
     *
     * 该接口用于停止本地摄像头的视频预览。
     */

    /**
     * 2.2 Stopping local camera preview
     *
     *This API is used to stop the video preview of the local camera.
     */
    virtual int StopCameraPreview() = 0;

    /**
     * 2.3 更新本地视频预览画面的窗口
     *
     * @param view 承载预览画面的控件。
     */

    /**
     * 2.3. Update the preview image of local video
     *
     * @param view Control that carries the preview image
     */
    virtual int UpdateCameraPreview(const liteav::TXView& view) = 0;

    /**
     * 2.4 打开本地音频设备
     *
     * @param quality 声音音质。
     */

    /**
     * 2.4 Turning on local audio device
     *
     * @param quality Sound quality
     */
    virtual int StartLocalAudio(const liteav::TRTCAudioQuality& quality) = 0;

    /**
     * 2.5 关闭本地音频设备
     *
     */

    /**
     * 2.5 Turning off local audio device
     *
     */
    virtual int StopLocalAudio() = 0;

    /**
     * 2.6 开启系统声音的采集
     *
     * 调用该接口后会开启或关闭系统声音采集的上行。
     */

    /**
     * 2.6 Enabling system audio capturing
     *
     * This API is used to enable or disable upstreaming system audio capturing.
     */
    virtual int StartSystemAudioLoopback() = 0;

    /**
     * 2.7 关闭系统声音的采集
     *
     * 调用该接口后会开启或关闭系统声音采集的上行。
     */

    /**
     * 2.7 Disable system audio capturing
     *
     * This API is used to enable or disable upstreaming system audio capturing.
     */
    virtual int StopSystemAudioLoopback() = 0;

    /**
     * 2.8 镜像设置
     *
     * 该设置视频是否进行镜像翻转
     *
     * @param mirror   true开启镜像, false 关闭镜像。
     */

    /**
     * 2.8 Setting mirroring
     *
     * This API is used to set whether to mirror the video image.
     *
     * @param mirror   true: Enable mirroring; false: Disable mirroring.
     */
    virtual int SetVideoMirror(bool mirror) = 0;

    /**
     * 2.9 开启AI降噪
     * 
     * 开启AI降噪
     */

    /**
     * 2.9 Enabling AI noise reduction
     *
     * This API is used to enable AI noise reduction.
     */
    virtual int OpenAINoiseReduction() = 0;

    /**
     * 2.10 关闭AI降噪
     *
     * 关闭AI降噪
     */

    /**
     * 2.10 Disabling AI noise reduction
     *
     * This API is used to disable AI noise reduction.
     */
    virtual int CloseAINoiseReduction() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （三）远端用户接口 (Remote User APIs)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 3.1 订阅远端用户的视频流
     *
     * 调用该接口订阅指定用户的视频流。
     *
     * @ param user_id 要获取用户信息的用户ID。
     * @ param view 承载预览画面的控件。
     * @ param type 流类型
     */

    /**
     * 3.1 Subscribing to video stream of remote user
     *
     * This API is used to subscribe to the specified user's video stream.
     *
     * @ param user_id ID of the user whose information is to be obtained
     * @ param view Control that carries the preview image
     * @ param type Stream type
     */
    virtual int StartRemoteView(const std::string& user_id, const liteav::TXView& view,
        TUIStreamType type = TUIStreamType::kStreamTypeCamera) = 0;

    /**
     * 3.2 取消订阅远端用户的视频流
     *
     * 调用该接口取消订阅指定用户的视频流。
     *
     * @ param user_id 要获取用户信息的用户ID。
     * @ param type 流类型
     */

    /**
     * 3.2 Unsubscribing from video stream of remote user
     *
     * This API is used to unsubscribe from the specified user's video stream.
     *
     * @ param user_id ID of the user whose information is to be obtained
     * @ param type Stream type
     */
    virtual int StopRemoteView(const std::string& user_id,
        TUIStreamType type = TUIStreamType::kStreamTypeCamera) = 0;

    /**
     * 3.3 更新远端视频预览画面的窗口
     *
     * @ param user_id 要获取用户信息的用户ID。
     * @ param view 承载预览画面的控件。
     * @ param view 承载预览画面的控件。
     */

    /**
     * 3.3 Updating window of remote video preview image
     *
     * @ param user_id ID of the user whose information is to be obtained
     * @ param view Control that carries the preview image
     * @ param view Control that carries the preview image
     */
    virtual int UpdateRemoteView(const std::string& user_id, TUIStreamType type, const liteav::TXView& view) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （四）发送消息 (Message Sending APIs)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 4.1 发送文本消息
     *
     * 调用该接口，会发送一条群文本消息。
     *
     * @param  message 消息内容。
     */

    /**
     * 4.1 Sending text message
     *
     * This API is used to send a group text message.
     *
     * @param  message Message content
     */
    virtual int SendChatMessage(const std::string& message) = 0;

    /**
     * 4.2 发送自定义消息
     *
     * 调用该接口，会发送一条IM群消息,消息为自定义消息。
     *
     * @param  message 消息内容。
     */

    /**
     * 4.2 Sending custom message
     *
     * This API is used to send a custom IM group message.
     *
     * @param  message Message content
     */
    virtual int SendCustomMessage(const std::string& message) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （五）场控相关 (Room Control APIs)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 5.1 主持人邀请成员关闭/打开麦克风。
     *
     *
     * @param  user_id 用户ID。
     * @param  mute true：禁用用户ID为user_id的用户麦克风；false：恢复用户ID为user_id的用户麦克风。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */

    /**
     * 5.1 Close / Open user microphone
     *
     * When the host calls this API to invite a member to close / open the mic.
     *
     * @param  user_id User ID
     * @param  mute true: disable the microphone of the user whose ID is `user_id`; false: enable the microphone of the user whose ID is `user_id`
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     */
    virtual int MuteUserMicrophone(const std::string& user_id, bool mute, Callback callback) = 0;

    /**
     * 5.2 禁用/恢复所有用户的麦克风，并且状态会同步到房间信息中
     *
     * 调用该接口，主持人禁用/恢复所有成员麦克风，成员端回收到OnMicrophoneMuted()回调。
     *
     * @param  mute true：禁用所有用户麦克风；false：恢复所有用户麦克风。
     */

    /**
     * 5.2 Disabling/Enabling microphone of all users and syncing status to room information
     *
     * When the host calls this API to disable/enable the microphone of all members, the members will receive the `OnMicrophoneMuted()` callback.
     *
     * @param  mute true: disable the microphone of all users; false: enable the microphone of all users
     */
    virtual int MuteAllUsersMicrophone(bool mute) = 0;

    /**
     * 5.3 禁用/恢复某用户的摄像头
     *
     * 调用该接口，主持人禁用/恢复成员摄像头，成员端回收到OnCameraMuted回调。
     *
     * @param  user_id 用户ID。
     * @param  mute true：禁用用户ID为user_id的用户摄像头；false：恢复用户ID为user_id的用户摄像头。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */

    /**
     * 5.3 Disabling/Enabling user camera
     *
     * When the host calls this API to disable/enable the camera of a member, the member will receive the `OnCameraMuted` callback.
     *
     * @param  user_id User ID
     * @param  mute true: disable the camera of the user whose ID is `user_id`; false: enable the camera of the user whose ID is `user_id`
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     */
    virtual int MuteUserCamera(const std::string& user_id, bool mute, Callback callback) = 0;

    /**
     * 5.4 禁用/恢复所有用户的摄像头，并且状态会同步到房间信息中
     *
     * 调用该接口，主持人禁用/恢复所有成员摄像头，成员端回收到OnCameraMuted回调。
     *
     * @param  mute true：禁用所有用户摄像头；false：恢复所有用户摄像头。
     */

    /**
     * 5.4 Disabling/Enabling camera of all users and syncing status to room information
     *
     * When the host calls this API to disable/enable the camera of all members, the members will receive the `OnCameraMuted` callback.
     *
     * @param  mute true: disable the camera of all users; false: enable the camera of all users
     */
    virtual int MuteAllUsersCamera(bool mute) = 0;

    /**
     * 5.5 开启/停止聊天室禁言
     *
     * 调用该接口，主持人可以禁言/恢复房间内IM聊天，成员端会收到OnChatRoomMuted()回调。
     *
     * @param  mute true：禁言；false：恢复禁言。
     */

    /**
     * 5.5 Disabling/Enabling chat in chat room
     *
     * When the host calls this API to disable/enable IM chat in the room, the members will receive the `OnChatRoomMuted()` callback.
     *
     * @param  mute true: disable chat; false: enable chat
     */
    virtual int MuteChatRoom(bool mute) = 0;

    /**
     * 5.6 主持人踢人
     *
     * 调用该接口，主持人踢人，成员端会收到OnExitRoom(1, "")回调。
     *
     * @param  user_id 用户ID。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */

    /**
     * 5.6 Removing user by host
     *
     * When the host calls this API to remove a member, the member will receive the `OnExitRoom(1, "")` callback.
     *
     * @param  user_id User ID
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     */
    virtual int KickOffUser(const std::string& user_id, Callback callback) = 0;

    /**
     * 5.7 主持人开始点名
     *
     * 主持人开始点名，成员端会收到OnCallingRollStarted()回调。
     */

    /**
     * 5.7 Starting roll call by host
     *
     * When the host calls this API to start a roll call, the members will receive the `OnCallingRollStarted()` callback.
     */
    virtual int StartCallingRoll() = 0;

    /**
     * 5.8 主持人结束点名
     *
     * 主持人结束点名，成员端会收到OnCallingRollStopped()回调。
     */

    /**
     * 5.8 Ending roll call by host
     *
     * When the host calls this API to end a roll call, the members will receive the `OnCallingRollStopped()` callback.
     */
    virtual int StopCallingRoll() = 0;

    /**
     * 5.9 成员回复主持人点名
     *
     * 成员回复主持人点名，主持人会收到OnMemberReplyCallingRoll()回调。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */

    /**
     * 5.9 Replying to roll call
     *
     * When a member replies to the roll call started by the host, the host will receive the `OnMemberReplyCallingRoll()` callback.
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     */
    virtual int ReplyCallingRoll(Callback callback) = 0;

    /**
     * 5.11 主持人取消邀请成员发言
     *
     * 调用该接口，主持人取消邀请成员发言，成员端会收到OnReceiveInvitationCancelled()回调通知。
     *
     * @param  user_id 用户ID。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */

    /**
     * 5.11 Canceling microphone-on invitation by host
     *
     * The host needs to call this API to cancel the microphone-on invitation to a member, who will receive the `OnReceiveInvitationCancelled()` callback notification.
     *
     * @param  user_id User ID
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     */
    virtual int CancelSpeechInvitation(const std::string& user_id, Callback callback) = 0;

    /**
     * 5.12 成员同意/拒绝主持人的发言邀请
     *
     * 在TUISpeechMode::kApplySpeech模式下，成员同意/拒绝主持人邀请发言需要调用此接口。
     * 主持人会收到OnReceiveReplyToSpeechInvitation回调通知
     *
     * @param  agree true：同意；false：拒绝。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     *
     */

    /**
     * 5.12 Accepting/Rejecting microphone-on invitation from host
     *
     * A member needs to call this API to accept/reject the microphone-on invitation from the host in `TUISpeechMode::kApplySpeech` mode.
     * The host will receive the `OnReceiveReplyToSpeechInvitation` callback notification.
     *
     * @param  agree true: accept; false: reject
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     *
     */
    virtual int ReplySpeechInvitation(const std::string& request_id, bool agree, Callback callback) = 0;

    /**
     * 5.13 成员申请发言
     *
     * 调用该接口，成员申请发言，主持人端会收到OnReceiveSpeechApplication回调通知。
     * 
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */

    /**
     * 5.13 Applying to speak by member
     *
     * When a member calls this API to request to speak, the host will receive the `OnReceiveSpeechApplication` callback notification.
     * 
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     */
    virtual int SendSpeechApplication(Callback callback) = 0;

    /**
     * 5.14 成员取消申请发言
     *
     * 调用该接口，成员取消申请发言，主持人端会收到OnSpeechApplicationCancelled回调通知。
     * 
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */

    /**
     * 5.14 Canceling a request to speak by member
     *
     * When a member calls this API to cancel their request to speak, the host will receive the `OnSpeechApplicationCancelled` callback notification.
     * 
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     */
    virtual int CancelSpeechApplication(Callback callback) = 0;

    /**
     * 5.15 主持人同意/拒绝成员的申请发言
     *
     * 在TUISpeechMode::kApplySpeech模式下，主持人同意/拒绝成员的申请需要调用此接口。
     * 成员端会收到OnReceiveReplyToSpeechApplication回调通知
     * 
     * @param  user_id 用户ID。
     * @param  agree true：同意；false：拒绝。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */

    /**
     * 5.15 Approving/Rejecting a request to speak
     *
     * The host needs to call this API to approve/reject a member's request to speak in `TUISpeechMode::kApplySpeech` mode.
     * The member will receive the `OnReceiveReplyToSpeechApplication` callback notification.
     * 
     * @param  user_id User ID
     * @param  agree true: accept; false: reject
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     */
    virtual int ReplySpeechApplication(const std::string& user_id, bool agree, Callback callback) = 0;

    /*
     * 5.16 主持人禁止申请发言
     *
     * 主持人禁止申请发言，成员端会收到OnSpeechApplicationForbidden回调
     *
     * @param  forbid true：禁止申请；false：取消禁止。
     */

    /*
     * 5.16 Disabling requests to speak
     *
     * When the host calls this API, the members will receive the `OnSpeechApplicationForbidden` callback.
     *
     * @param  forbid true: Disable requests; false: Enable requests
     */
    virtual int ForbidSpeechApplication(bool forbid) = 0;

    /**
     * 5.17 主持人令成员停止发言
     *
     * 调用该接口，主持人邀请成员停止发言，成员端会收到OnOrderedToExitSpeechState()回调通知。
     *
     * @param  user_id 用户ID。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */

    /**
     * 5.17 Requesting a member to stop speaking
     *
     * When the host calls this API, the member will receive the `OnOrderedToExitSpeechState()` callback notification.
     *
     * @param  user_id User ID
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     */
    virtual int SendOffSpeaker(const std::string& user_id, Callback callback) = 0;

    /*
     * 5.18 主持人令全体停止发言
     * 
     * 主持人令所有在发言的成员停止发言，所有成员都会收到OnOrderedToExitSpeechState回调
     * 
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */

    /*
     * 5.18 Stopping speech of all members
     * 
     * When the host calls this API to stop the speech of all members, the members will receive the `OnOrderedToExitSpeechState` callback.
     * 
     * @param  callback Signaling callback, based on which you can know whether the signaling is sent successfully
     */
    virtual int SendOffAllSpeakers(Callback callback) = 0;

    /**
     * 5.19 成员停止发言,转变为观众
     *
     * 如果成员在发言，调用该接口，则停止发言，转变为观众。
     */

    /**
     * 5.19 Stopping speaking and becoming audience member 
     *
     * This API is used for a member to stop speaking and change their role to audience.
     */
    virtual int ExitSpeechState() = 0;

    virtual int EnterSpeechState(SuccessCallback success_callback, ErrorCallback error_callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    （六）基础组件接口 (Basic Component APIs)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 6.1 获取设备管理的对象指针
     *
     * 调用该接口，获取到设备管理对象的指针，用于设备的获取和设置。
     */

    /**
     * 6.1 Getting device management object pointer
     *
     * This API is used to get the pointer of a device management object for device acquisition and settings.
     */
    virtual liteav::ITXDeviceManager* GetDeviceManager() = 0;

    /**
     * 6.2 获取屏幕分享管理的对象指针
     *
     * 调用该接口，获取屏幕分享管理对象的指针，用于操作和设置屏幕分享。
     */

    /**
     * 6.2 Getting screen sharing management object pointer
     *
     * This API is used to get the pointer of a screen sharing management object for operation and settings of screen sharing.
     */
    virtual IScreenShareManager* GetScreenShareManager() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   （七）云录制接口 (Cloud Recording APIs)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 7.1 开始云录制
     *
     * 调用该接口，开始启动云录制。
     *
     */

    /**
     * 7.1 Starting on-cloud recording
     *
     * This API is used to start on-cloud recording.
     *
     */
    virtual int StartCloudRecord() = 0;

    /**
     * 7.2 停止云录制
     *
     * 调用该接口，停止云录制。
     */

    /**
     * 7.2 Stopping on-cloud recording
     *
     * This API is used to stop on-cloud recording.
     */
    virtual int StopCloudRecord() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    （八）美颜功能接口 (Beauty Filter APIs)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 8.1 设置美颜、美白、红润效果级别
     *
     * SDK 内部集成了两套风格不同的磨皮算法
     * 一套叫“光滑”，适用于美女秀场，效果比较明显
     * 另一套叫“自然”，磨皮算法更多地保留了面部细节，主观感受上会更加自然
     *
     * @param style     美颜风格，光滑或者自然，光滑风格磨皮更加明显，适合娱乐场景。
     * @param beauty_level    美颜级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显
     * @param whiteness_level 美白级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显
     * @param ruddiness_level 红润级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显，该参数暂未生效
     */

    /**
     * 8.1 Setting strength of beauty, skin brightening, and rosy skin effects
     *
     * The SDK is integrated with two skin smoothing algorithms of different styles:
     * Smooth, which features a more obvious skin smoothing effect and is suitable for showrooms
     * Natural, which retains more facial details and is more natural
     *
     * @param style     Style, which may be smooth or natural. The smooth style features a more obvious skin smoothing effect
     * and is suitable for entertainment scenarios
     * @param beauty_level    Strength of the skin smoothing filter. Value range: 0–9.
     * `0` indicates that the filter is disabled. The larger the value, the more obvious the effect
     * @param whiteness_level Strength of the skin brightening filter. Value range: 0–9.
     * `0` indicates that the filter is disabled. The larger the value, the more obvious the effect
     * @param ruddiness_level Strength of the rosy skin filter. Value range: 0–9. 
     * `0` indicates that the filter is disabled. The larger the value, the more obvious the effect. This parameter is unavailable currently.
     */
    virtual int SetBeautyStyle(liteav::TRTCBeautyStyle style, uint32_t beauty_level,
        uint32_t whiteness_level, uint32_t ruddiness_level) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                     （九）相关设置接口 (Settings APIs)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 9.1 设置网络流控相关参数
     *
     * 该设置决定了 SDK 在各种网络环境下的调控策略（例如弱网下是“保清晰”还是“保流畅”）
     *
     * @param preference    “保清晰”还是“保流畅”，参见TUIVideoQosPreference。
     */

    /**
     * 9.1. Set network bandwidth limit parameters
     *
     * The parameters determine the SDK's QoS policy under different network conditions (e.g., whether to
     * prioritize clarity or smoothness under poor network conditions).
     *
     * @param preference    To prioritize clarity or smoothness. For more information, see `TUIVideoQosPreference`.
     */
    virtual int SetVideoQosPreference(TUIVideoQosPreference preference) = 0;

    /**
     * 9.2 设置显示仪表盘
     *
     * “仪表盘”是位于视频渲染控件之上的一个半透明的调试信息浮层，用于展示音视频信息和事件信息，便于对接和调试。
     * @param show_type 0：不显示；1：显示精简版（仅显示音视频信息）；2：显示完整版（包含音视频信息和事件信息）。
     *
     */

    /**
     * 9.2 Setting dashboard display
     *
     * "Dashboard" is a semi-transparent floating layer for debugging information on top of the video rendering control.
     * It is used to display audio/video information and event information to facilitate integration and debugging.
     * @param show_type 0: does not display; 1: displays lite edition (only with audio/video information);
     * 2: displays full edition (with audio/video information and event information).
     *
     */
    virtual int ShowDebugView(int show_type) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //              （十）获取SDK版本接口 (SDK Version Acquisition APIs)
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 10.1 获取SDK版本信息
     */

    /**
     * 10.1 Getting SDK version information
     */
    virtual const char* GetSDKVersion() = 0;

 protected:
     virtual ~TUIRoomCore() {}

};

#endif  //  MODULE_INCLUDE_TUIROOMCORE_H_
