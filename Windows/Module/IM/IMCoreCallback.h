#pragma once


#include <string>
#include <vector>
#include "../include/TUIRoomDef.h"

class IMCoreCallback {
public:
    virtual ~IMCoreCallback() {}

    /************************************************************************/
    /*                         （一）错误事件回调                           */
    /************************************************************************/
    /// @name 错误事件回调
    /// @{
    /**
    * 1.1 错误回调
    *
    * SDK 不可恢复的错误，一定要监听，并分情况给用户适当的界面提示。
    *
    * @param code 	    错误码
    * @param message 	错误信息
    */
    virtual void OnIMError(int code, const std::string& message) = 0;
    /// @}


    /************************************************************************/
    /*                         （二）基础事件回调                           */
    /************************************************************************/
    /// @name 基础事件回调
    /// @{
    /**
    * 2.1 登录回调
    *
    * 用户调用Login接口，登录后返回的登录结果以及登录的信息。
    *
    * @param code 	    错误码
    * @param message 	登录信息或登录失败的错误信息
    */
    virtual void OnIMLogin(int code, const std::string& message) = 0;

    /**
    * 2.2 登出回调
    *
    * 用户调用Logout接口,登出后返回的登出结果以及登出的信息。
    *
    * @param code 	    错误码
    * @param message 	登出信息或登出失败的错误信息
    */
    virtual void OnIMLogout(int code, const std::string& message) = 0;

    /**
    * 2.3 创建房间回调
    *
    * 用户调用CreateRoom接口,创建房间的接口回调信息。
    *
    * @param code 	    错误码
    * @param message 	创建房间的信息或创建失败的错误信息
    */
    virtual void OnIMCreateRoom(int code, const std::string& message) = 0;

    /**
    * 2.4 房间解散回调
    *
    * 主持人调用DestroyRoom接口,解散房间的接口回调信息。
    *
    * @param code 	    错误码
    * @param message 	解散房间的信息或解散失败的错误信息
    */
    virtual void OnIMDestroyRoom(int code, const std::string& message) = 0;

    /**
    * 2.5 进入房间回调
    *
    * 用户调用EnterRoom接口,进入房间的接口回调信息。
    *
    * @param code 	    错误码
    * @param message 	进入房间的信息或进入房间的错误信息
    */
    virtual void OnIMEnterRoom(int code, const std::string& message) = 0;

    /**
    * 2.6 退出房间回调
    *
    * 用户调用ExitRoom接口，主持人解散房间，主持人踢出房间，网络异常等情况下退出房间的接口回调信息。
    *
    * @param type 	    退出类型参考TUIExitRoomType定义
    * @param message 	退出房间的描述
    */
    virtual void OnIMExitRoom(TUIExitRoomType type, const std::string& message) = 0;

    /**
    * 2.7 其他用户进入房间回调
    *
    * 其他用户退出房间回调。
    *
    * @param code 	    错误码
    * @param user_id 	用户ID
    * @param user_name 	用户名
    */
    virtual void OnIMUserEnterRoom(int code, const std::string& user_id, const std::string& user_name) = 0;

    /**
    * 2.8 其他用户退出房间回调
    *
    * 其他用户退出房间回调。
    *
    * @param code 	    错误码
    * @param user_id 	用户ID
    */
    virtual void OnIMUserExitRoom(int code, const std::string& user_id) = 0;

    /**
    * 2.9 主持人更改回调
    *
    * 主持人更改回调
    *
    * @param code 	    错误码
    * @param user_id 	用户ID
    */
    virtual void OnIMRoomMasterChanged(const std::string& user_id) = 0;
    /// @}

    /************************************************************************/
    /*                         （三）获取群信息事件回调                     */
    /************************************************************************/
    /// @name  获取群信息事件回调
    /// @{
    /**
    * 3.1 获取群成员列表回调
    *
    * 获取群成员列表回调信息。
    *
    * @param room_id      房间ID
    * @param member_list  群成员列表
    */
    virtual void OnIMGetRoomMemberInfoList(const std::vector<TUIUserInfo>& member_array) = 0;

    /**
    * 3.2 获取群信息回调
    *
    * 获取群信息回调信息。
    *
    * @param info      房间信息
    */
    virtual void OnIMGetRoomInfo(const TUIRoomInfo& info) = 0;
    /// @}

    /************************************************************************/
    /*                         （四）聊天室消息事件回调                     */
    /************************************************************************/
    /// @name 聊天室消息事件回调
    /// @{
    /**
    * 4.1 接收消息回调
    *
    * 聊天室收到消息回调信息。
    *
    * @param user_id  用户ID
    * @param message  聊天消息内容
    */
    virtual void OnIMReceiveChatMessage(const std::string& user_id, const std::string& message) = 0;

    /**
    * 4.2 接收自定义消息回调
    *
    * 接收自定义消息回调。
    *
    * @param user_id  用户ID
    * @param message  聊天消息内容
    */
    virtual void OnIMReceiveCustomMessage(const std::string& user_id, const std::string& message) = 0;
    /// @}

    /************************************************************************/
    /*                         （五）场控相关事件回调                       */
    /************************************************************************/
    /// @name 场控相关事件回调
    /**
    * 5.1 被邀请发言回调
    *
    * 主持人调用SendSpeechInvitation接口邀请用户发言后，用户收到的回调，用户需要进行发言。
    */
    virtual void OnIMReceiveSpeechInvitation() = 0;

    /**
     * 5.2 用户收到主持人取消发言邀请回调
     *
     * 主持人调用CancelSpeechInvitation接口取消邀请用户发言后，用户收到的回调。
     */
    virtual void OnIMReceiveInvitationCancelled() = 0;

    /**
     * 5.3 主持人收到用户同意邀请发言的回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，用户调用ReplySpeechInvitation接口回应主持人发言邀请时，
     * 主持人收到的回调
     *
     * @param user_id  用户ID
     * @param agree    是否同意发言 true为同意， false为不同意
     */
    virtual void OnIMReceiveReplyToSpeechInvitation(const std::string& user_id, bool agree) = 0;

    /**
     * 5.4 主持人收到用户发言申请的回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，用户调用SendSpeechApplication接口向主持人申请发言时，
     * 主持人收到的回调，主持人需要操作并调用ReplySpeechApplication接口对申请进行回应。
     *
     * @param user_id  用户ID
     */
    virtual void OnIMReceiveSpeechApplication(const std::string& user_id) = 0;

    /**
     * 5.5 用户取消申请发言回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，用户调用CancelSpeechApplication接口取消申请发言时，主持人收到的回调。
     *
     * @param user_id  用户ID
     */
    virtual void OnIMSpeechApplicationCancelled(const std::string& user_id) = 0;

    /**
     * 5.6 主持人同意发言申请回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，主持人调用ReplySpeechApplication接口回应用户申请发言时，
     * 用户收到的回调，用户根据主持人是否同意决定是否可以发言。
     *
     * @param agree  是否同意发言 true为同意， false为不同意
     */
    virtual void OnIMReceiveReplyToSpeechApplication(bool agree) = 0;

    /**
     * 5.7 主持人禁止申请发言回调
     *
     * 主持人禁止申请发言回调。
     *
     * @param forbidden true,发言申请被禁用, false 可以申请发言
     */
    virtual void OnIMSpeechApplicationForbidden(bool forbidden) = 0;

    /**
     * 5.8 成员被请求停止发言的回调
     *
     * 主持人调用SendOffSpeaker接口请求用户停止发言后，用户收到的回调，用户需要停止发言。
     */
    virtual void OnIMOrderedToExitSpeechkState() = 0;

    /**
     * 5.9 主持人开始点名，成员收到的回调
     *
     * 主持人开始点名，成员收到的回调。
     */
    virtual void OnIMCallingRollStarted() = 0;

    /**
     * 5.10 主持人结束点名，成员收到的回调
     *
     * 主持人结束点名，成员收到的回调。
     */
    virtual void OnIMCallingRollStopped() = 0;

    /**
     * 5.11 成员回复点名，主持人收到的回调
     *
     * 成员回复点名，主持人收到的回调。
     *
     * @param user_id 用户id
     */
    virtual void OnIMMemberReplyCallingRoll(const std::string& user_id) = 0;

    /**
     * 5.12 主持人更改聊天室是否禁言回调
     *
     * 主持人设置聊天室是否禁言的回调。
     *
     * @param mute  true,聊天室不可以发消息  false聊天室可以发消息
     */
    virtual void OnIMChatRoomMuted(bool muted) = 0;

    /**
     * 5.13 主持人设置禁用麦克风回调
     *
     * 主持人禁用用户麦克风的回调。
     *
     * @param mute  true,用户麦克风被禁用  false用户麦克风打开
     */
    virtual void OnIMMicrophoneMuted(bool muted) = 0;

    /**
     * 5.14 主持人设置禁用摄像头回调
     *
     * 主持人禁用用户摄像头的回调。
     *
     * @param mute  true,用户摄像头被禁用  false用户摄像头打开
     */
    virtual void OnIMCameraMuted(bool muted) = 0;

    //////////   群信令回调
    /// 全体禁止打开麦克风
    virtual void OnIMAllUsersMicrophoneMuted(bool mute) = 0;
    /// 全体禁止打开摄像头
    virtual void OnIMAllUsersCameraMuted(bool mute) = 0;
};