// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_IM_CORE_H_
#define MODULE_IM_CORE_H_

#include <string>
#include <vector>
#include <map>
#include <mutex>
#include "../CommonDef.h"
#include "../include/TUIRoomDef.h"
#include "IMCoreCallback.h"
#include "V2TIMManager.h"
#include "V2TIMCallback.h"
#include "V2TIMGroup.h"
#include "V2TIMGroupManager.h"
#include "V2TIMConversation.h"
#include "V2TIMListener.h"
#include "V2TIMSignalingManager.h"
#include "V2TIMMessageManager.h"

enum CallBackType {
    kUnkown,
    kLogin,
    kLoginOut,
    kCreateGroup,
    kDestoryGroup,
    kJoinGroup,
    kQuitGroup,
    kTransferGroup,
    kSetSelfProfile,
    kGetGroupMemberList,
    kGetGroupInfo,
    kKickOffUser,
    kMuteChatRoom,
    kMuteUserMicrophone,
    kMuteAllUserMicrophone,
    kMuteUserCamera,
    kMuteAllUserCamera,
    kStartCallingRoll,
    kStopCallingRoll,
    kReplyCallingRoll,
    kSendMessage,
    kSendSpeechInvitation,
    kCancelSpeechInvitation,
    kReplySpeechInvitation,
    kSendOffSpeaker,
    kSendOffAllSpeakers,
    kSendSpeechApplication,
    kCancelSpeechApplication,
    kReplySpeechApplication,
    kForbidSpeechApplication,
};

struct SignalingInfo;
class IMCore final: public V2TIMSDKListener, public V2TIMGroupListener, public V2TIMSignalingListener, public V2TIMAdvancedMsgListener {
public:
    explicit IMCore();
    ~IMCore();
    void SetCallback(IMCoreCallback* callback);

    void Login(int sdk_appid, const std::string& user_id, const std::string& user_sig);
    void Logout();
    void CreateRoom(const std::string& room_id, TUISpeechMode speech_mode);
    void DestroyRoom(const std::string& room_id);
    void EnterRoom(const std::string& room_id, const std::string& user_id);
    void LeaveRoom(const std::string& room_id);
    void TransferRoomMaster(const std::string& room_id, const std::string& user_id);
    void SetSelfProfile(const std::string& user_name, const std::string& avatar_url);
    /**
    * 获取群成员列表
    * 该获取群成员的接口只支持单线程访问，通过OnIMGetRoomMemberInfoList回调接口返回成员列表。
    * 注意：如果返回false,则说明上次的获取还没完成，请稍后再获取。
    */

    /**
    * Gets the group member list
    * This API can be accessed only through a single thread, and the member list will then be returned by the `OnIMGetRoomMemberInfoList` callback API.
    * Note: If `false` is returned, the previous acquisition hasn't been completed, and you should try again later.
    */
    bool GetRoomMemberInfoList(const std::string& room_id);
    void GetRoomInfo(const std::string& room_id);
    void SendChatMessage(const std::string& room_id, const std::string& user_id, const std::string& content);
    void SendCustomMessage(const std::string& room_id, const std::string& user_id, const std::string& content);

    // 信令
    // Signaling
    // 将用户请出房间
    // Removes a user from the room
    void KickOffUser(const std::string& room_id, const std::string& user_id, Callback callback);
    // 1V1 信令
    // One-to-one signaling
    // 邀请发言
    // Invites a member to speak
    void SendSpeechInvitation(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback);
    // 取消邀请
    // Cancels an invitation
    void CancelSpeechInvitation(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback);
    // 成员回复主持人发言邀请
    // Member replies to an invitation to speak
    void ReplySpeechInvitation(const std::string& room_id, const std::string& sender_id,const std::string& user_id,
        bool agree, Callback callback);

    // 成员申请发言
    // Member requests to speak
    void SendSpeechApplication(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback);
    // 成员取消发言申请
    // Member cancels their request to speak
    void CancelSpeechApplication(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback);
    // 主持人回复成员的发言申请
    // Host replies to a member's request to speak
    void ReplySpeechApplication(const std::string& room_id, const std::string& sender_id, const std::string& user_id,
        bool agree, Callback callback);
    // 禁用用户麦克风
    // Disables a user's microphone
    void MuteUserMicrophone(const std::string& room_id, const std::string& sender_id, const std::string& user_id, bool mute, Callback callback);
    // 禁用用户摄像头
    // Disables a user's camera
    void MuteUserCamera(const std::string& room_id, const std::string& sender_id, const std::string& user_id, bool mute, Callback callback);
    // 回复主持人点名
    // Replies to a roll call
    void ReplyCallingRoll(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback);

    // 命令停止发言
    // Notifies a member to stop speaking
    void SendOffSpeaker(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback);
    // 命令所有学生停止发言
    // Notifies all members to stop speaking
    void SendOffAllSpeakers(const std::string& room_id, const std::string& sender_id, const std::vector<std::string>& user_id_array, Callback callback);

    // 群信令
    // Group signaling
    // 禁用IM聊天
    // Disables IM chat
    void MuteRoomChat(const std::string& room_id, bool mute);
    // 禁用所有用户麦克风
    // Disables the microphone of all users
    void MuteAllUsersMicrophone(const std::string& room_id, bool mute);
    // 禁用所有用户摄像头
    // Disables the camera of all users
    void MuteAllUsersCamera(const std::string& room_id, bool mute);
    // 主持人开始点名
    // Host starts a roll call
    void StartCallingRoll(const std::string& room_id);
    // 主持人结束点名
    // Host stops a roll call
    void StopCallingRoll(const std::string& room_id);
    // 禁止发言申请
    // Disables requesting to speak
    void ForbidSpeechApplication(const std::string& room_id, bool forbid);

    // 调用IM接口的返回：code为0表示成功，其他表示失败，对应的失败信息为message
    // Response to an IM API call: If `code` is `0`, the API was called successfully; otherwise,
    // the API failed to be called, and `message` indicates the failure message.
    void OnIMInterfaceCallback(CallBackType type, int code, const std::string& message = "", const V2TIMString& result = "");
    void OnIMInterfaceCallback(CallBackType type, int code, const std::string& message, const V2TIMGroupMemberInfoResult& result);
    void OnIMInterfaceCallback(CallBackType type, int code, const std::string& message, const V2TIMGroupInfoResultVector& result);
    void OnIMInterfaceCallback(CallBackType type, int code, const std::string& message, const V2TIMMessage& result);

    // 信令操作的回调
    // Callbacks for signaling operations
    void OnInviteeAccepted(const V2TIMString &inviteID, const V2TIMString &invitee, const V2TIMString &data) override;
    void OnInviteeRejected(const V2TIMString &inviteID, const V2TIMString &invitee, const V2TIMString &data) override;
    void OnInvitationCancelled(const V2TIMString &inviteID, const V2TIMString &inviter, const V2TIMString &data) override;
    void OnInvitationTimeout(const V2TIMString &inviteID, const V2TIMStringVector &inviteeList) override;

    void OnConnectSuccess() override;
    void OnConnectFailed(int error_code, const V2TIMString &error_message) override;
    void OnKickedOffline() override;

    // 有用户离开群（全员能够收到）
    // A user leaves the group (received by all users)
    void OnMemberLeave(const V2TIMString &groupID, const V2TIMGroupMemberInfo &member) override;
    // 有用户加入群（全员能够收到）
    // A user joins the group (received by all users)
    void OnMemberEnter(const V2TIMString &groupID, const V2TIMGroupMemberInfoVector &memberList) override;
    // 群被解散了（全员能收到）
    // The group is deleted (received by all users)
    void OnGroupDismissed(const V2TIMString &groupID, const V2TIMGroupMemberInfo &opUser) override;
    // 群信息被修改（全员能收到）
    // The group information is modified (received by all users)
    void OnGroupInfoChanged(const V2TIMString &groupID, const V2TIMGroupChangeInfoVector &changeInfos) override;
    // 接收信令消息
    // Receives a signaling message
    void OnReceiveNewInvitation(const V2TIMString &inviteID, const V2TIMString &inviter,
        const V2TIMString &groupID,
        const V2TIMStringVector &inviteeList,
        const V2TIMString &data) override;
    // 接收新消息
    // Receives a new message
    void OnRecvNewMessage(const V2TIMMessage &message);
private:
    void IMInit(int sdkappid);
    void IMUnInit();
    void AddSignalingInfo(const std::string& user_id, const std::string& invite_id, CallBackType type);
    void RemoveSignalingInfo(const std::string& user_id, const std::string& invite_id);
    void RemoveSignalingInfoByInviteId(const std::string& invite_id);
    void AddSignalingCallback(const std::string& invite_id, Callback callback);
    void RemoveSignalingCallback(const std::string& invite_id);
    void NotifySignalingTimeOut(const std::string& invite_id);
private:
    IMCoreCallback* callback_ = nullptr;
    bool init_sdk_success_ = false;

    std::vector<TUIUserInfo> member_array_;
    bool member_list_request_done_ = true;
    std::string user_sig_ = "";
    std::string user_id_ = "";
    TUIRoomInfo   room_info_;

    std::mutex mutex_;    
    std::map<std::string, std::vector<SignalingInfo>> map_signaling_;
    std::map<std::string, Callback> map_callback_;
};

struct SignalingInfo {
    std::string user_id;
    std::string invite_id;
    CallBackType type;
};

#define NOTIFY_CALLBACK(callback,error_code,error_message) {\
    if (callback != nullptr) {\
        callback(error_code, error_message);\
    }\
}

#endif  //  MODULE_IM_CORE_H_
