// Copyright (c) 2021 Tencent. All rights reserved.
#include "IMCore.h"
#include "IMCoreCallback.h"
#include "V2TIMErrorCode.h"
#include "IMParser.h"
#include "utils/UserDirectory.h"
#include "log.h"
#include "IMInterfaceCallback.h"

const int kInviteTimeout = 15;
const char* kIMFilePath = "/im";

IMCore::IMCore() {
}
IMCore::~IMCore() {
}

void IMCore::IMInit(int sdkappid) {
    V2TIMManager::GetInstance()->AddSDKListener(this);
    V2TIMManager::GetInstance()->AddGroupListener(this);
    V2TIMManager::GetInstance()->GetSignalingManager()->AddSignalingListener(this);
    V2TIMManager::GetInstance()->GetMessageManager()->AddAdvancedMsgListener(this);

    std::string im_file_path = UserDirectory::GetUserLogFilePath();
    im_file_path += kIMFilePath;

    V2TIMSDKConfig config;
    config.initPath = im_file_path.c_str();
    config.logPath = im_file_path.c_str();
    config.logLevel = V2TIM_LOG_DEBUG;
    V2TIMManager::GetInstance()->InitSDK(sdkappid, config);
}
void IMCore::IMUnInit() {
    V2TIMManager::GetInstance()->RemoveSDKListener(this);
    V2TIMManager::GetInstance()->RemoveGroupListener(this);
    V2TIMManager::GetInstance()->GetSignalingManager()->RemoveSignalingListener(this);
    V2TIMManager::GetInstance()->GetMessageManager()->RemoveAdvancedMsgListener(this);
    V2TIMManager::GetInstance()->UnInitSDK();
}
void IMCore::OnConnectSuccess() {
    {
        std::lock_guard<std::mutex> lock(mutex_);
        map_signaling_.clear();
        map_callback_.clear();
    }
    if (!init_sdk_success_) {
        init_sdk_success_ = true;
        if (!user_sig_.empty() && !user_id_.empty()) {
            IMInterfaceCallback* login_callback = new(std::nothrow) IMInterfaceCallback(kLogin, this, nullptr);
            if (login_callback != nullptr) {
                V2TIMManager::GetInstance()->Login(V2TIMString(user_id_.c_str()), V2TIMString(user_sig_.c_str()), login_callback);
            }
        }
    }
}
void IMCore::OnConnectFailed(int error_code, const V2TIMString &error_message) {
    init_sdk_success_ = false;
    if (callback_ != nullptr) {
        callback_->OnIMError(static_cast<int>(TUIRoomError::kErrorLoginFailed), error_message.CString());
    }
}
void IMCore::OnKickedOffline() {
    LINFO("IMCore::OnKickedOffline");
    if (callback_ != nullptr) {
        callback_->OnIMExitRoom(TUIExitRoomType::kKickOffLine, "");
    }
}

void IMCore::SetCallback(IMCoreCallback* callback){
    callback_ = callback;
}
void IMCore::OnIMInterfaceCallback(CallBackType type, int code, const std::string& message, const V2TIMString& result) {
    if (callback_ == nullptr)
        return;
    LINFO("OnIMInterfaceCallback type = %d, code = %d, message = %s", (int)type, code, message.c_str());
    switch (type) {
    case kLogin:
        callback_->OnIMLogin(code, message);
        break;
    case kLoginOut:
        callback_->OnIMLogout(code, message);
        break;
    case kCreateGroup:
        // ERR_SVR_GROUP_GROUPID_IN_USED 10021
        if (ERR_SVR_GROUP_GROUPID_IN_USED != code)
            callback_->OnIMCreateRoom(code, message);
        else
            callback_->OnIMError(static_cast<int>(TUIRoomError::kErrorCreateRoomFailed), message);
        break;
    case kDestoryGroup:
        callback_->OnIMDestroyRoom(code, message);
        break;
    case kJoinGroup:
        callback_->OnIMEnterRoom(code, message);
        break;
    case kQuitGroup:
        if (ERR_SUCC == code) {
            callback_->OnIMExitRoom(TUIExitRoomType::kNormal, message);
        } else {
            callback_->OnIMError(static_cast<int>(TUIRoomError::kErrorExitRoomFailed), message);
        }
        break;
    case kTransferGroup:
        if (ERR_SUCC == code) {
            callback_->OnIMExitRoom(TUIExitRoomType::kTransferRoom, message);
        } else if (callback_ != nullptr) {
            callback_->OnIMError(static_cast<int>(TUIRoomError::kErrorTransferRoomFailed), message);
        }
        break;
    default:
        break;
    }
}
void IMCore::Login(int sdk_appid, const std::string& user_id, const std::string& user_sig){
    user_id_ = user_id;
    user_sig_ = user_sig;
    if (!init_sdk_success_) {
        IMInit(sdk_appid);
    } else {
        if (!user_sig_.empty() && !user_id_.empty()) {
            IMInterfaceCallback* login_callback = new(std::nothrow) IMInterfaceCallback(kLogin, this, nullptr);
            if (login_callback != nullptr) {
                V2TIMManager::GetInstance()->Login(V2TIMString(user_id_.c_str()), V2TIMString(user_sig_.c_str()), login_callback);
            }
        }
    }
}
void IMCore::Logout(){
    IMInterfaceCallback* logout_callback = new(std::nothrow) IMInterfaceCallback(kLoginOut, this, nullptr);
    if (logout_callback != nullptr) {
        V2TIMManager::GetInstance()->Logout(logout_callback);
    }
}
void IMCore::CreateRoom(const std::string& room_id, TUISpeechMode speech_mode){
    V2TIMString groupType = "Public";
    V2TIMString groupID = room_id.c_str();
    V2TIMString groupName = room_id.c_str();
    
    IMValueInterfaceCallback<V2TIMString>* create_group_callback = new(std::nothrow) IMValueInterfaceCallback<V2TIMString>("CreateGroup", kCreateGroup, this);
    if (create_group_callback != nullptr) {
        V2TIMGroupInfo info;
        info.allMuted = false;
        info.groupAddOpt = V2TIM_GROUP_ADD_ANY;
        info.groupID = groupID;
        info.groupName = groupName;
        info.groupType = groupType;
        std::string speechMode = "FreeSpeech";
        switch (speech_mode) {
        case TUISpeechMode::kFreeSpeech:
            speechMode = "FreeSpeech";
            break;
        case TUISpeechMode::kApplySpeech:
            speechMode = "ApplySpeech";
            break;
        }
        info.notification = IMParser::GenerateGroupNotification(false, false, false, false, speechMode, false).c_str();
        room_info_.is_all_camera_muted = false;
        room_info_.is_chat_room_muted = false;
        room_info_.is_all_microphone_muted = false;
        room_info_.mode = speech_mode;
        room_info_.is_speech_application_forbidden = false;
        room_info_.is_callingroll = false;
        room_info_.owner_id = user_id_;
        V2TIMCreateGroupMemberInfoVector memberList;
        V2TIMManager::GetInstance()->GetGroupManager()->CreateGroup(info, memberList, create_group_callback);
    }
}
void IMCore::DestroyRoom(const std::string& room_id){
    V2TIMString groupID = room_id.c_str();
    IMInterfaceCallback* dismiss_group_callback = new(std::nothrow) IMInterfaceCallback(kDestoryGroup, this, nullptr);
    if (dismiss_group_callback != nullptr) {
        V2TIMManager::GetInstance()->DismissGroup(groupID, dismiss_group_callback);
    }
}
void IMCore::EnterRoom(const std::string& room_id, const std::string& user_id){
    V2TIMString groupID = room_id.c_str();
    IMInterfaceCallback* join_group_callback = new(std::nothrow) IMInterfaceCallback(kJoinGroup, this, nullptr);
    if (join_group_callback != nullptr) {
        V2TIMManager::GetInstance()->JoinGroup(groupID, "JoinGroup", join_group_callback);
    }
}
void IMCore::LeaveRoom(const std::string& room_id){
    V2TIMString groupID = room_id.c_str();
    IMInterfaceCallback* quit_group_callback = new(std::nothrow) IMInterfaceCallback(kQuitGroup, this, nullptr);
    if (quit_group_callback != nullptr) {
        V2TIMManager::GetInstance()->QuitGroup(groupID, quit_group_callback);
    }
}
void IMCore::TransferRoomMaster(const std::string& room_id, const std::string& user_id){
    V2TIMString groupID = room_id.c_str();
    V2TIMString userID = user_id.c_str();
    IMInterfaceCallback* transfer_group_callback = new(std::nothrow) IMInterfaceCallback(kTransferGroup, this, nullptr);
    if (transfer_group_callback != nullptr) {
        V2TIMManager::GetInstance()->GetGroupManager()->TransferGroupOwner(groupID, userID, transfer_group_callback);
    }
}
void IMCore::SetSelfProfile(const std::string& user_name, const std::string& avatar_url) {
    IMInterfaceCallback* modify_name_callback = new(std::nothrow) IMInterfaceCallback(kSetSelfProfile, this, nullptr);
    if (modify_name_callback != nullptr) {
        V2TIMUserFullInfo user_info;
        user_info.nickName = user_name.c_str();
        user_info.modifyFlag = V2TIM_USER_INFO_MODIFY_FLAG_NICK;
        V2TIMManager::GetInstance()->SetSelfInfo(user_info, modify_name_callback);
    }
}
bool IMCore::GetRoomMemberInfoList(const std::string& room_id){
    if (!member_list_request_done_) {
        return false;
    }
    member_array_.clear();
    V2TIMString groupID = room_id.c_str();
    IMValueInterfaceCallback<V2TIMGroupMemberInfoResult>* get_members_callback = \
        new(std::nothrow) IMValueInterfaceCallback<V2TIMGroupMemberInfoResult>(room_id.c_str(), kGetGroupMemberList, this);
    if (get_members_callback != nullptr) {
        V2TIMManager::GetInstance()->GetGroupManager()->GetGroupMemberList(groupID, V2TIM_GROUP_MEMBER_FILTER_ALL, 0, get_members_callback);
        member_list_request_done_ = false;
    }
    return true;
}
void IMCore::OnIMInterfaceCallback(CallBackType type, int code, const std::string& message, const V2TIMGroupMemberInfoResult& result) {
    LINFO("IMCore::OnIMInterfaceCallback GetGroupMemberList");
    std::string groupID = message.c_str();
    if (result.nextSequence != 0) {
        for (int i = 0; i < result.memberInfoList.Size(); i++) {
            TUIUserInfo info;
            info.user_id = result.memberInfoList[i].userID.CString();
            info.user_name = result.memberInfoList[i].nickName.CString();
            info.role = result.memberInfoList[i].role == V2TIM_GROUP_MEMBER_ROLE_SUPER ? TUIRole::kMaster : TUIRole::kAnchor;
            member_array_.push_back(info);
        }
        IMValueInterfaceCallback<V2TIMGroupMemberInfoResult>* get_members_callback = \
            new(std::nothrow) IMValueInterfaceCallback<V2TIMGroupMemberInfoResult>(groupID.c_str(), kGetGroupMemberList, this);
        if (get_members_callback != nullptr) {
            V2TIMManager::GetInstance()->GetGroupManager()->GetGroupMemberList(groupID.c_str(), V2TIM_GROUP_MEMBER_FILTER_ALL, result.nextSequence, get_members_callback);
        }
    } else {
        for (int i = 0; i < result.memberInfoList.Size(); i++) {
            TUIUserInfo info;
            info.user_id = result.memberInfoList[i].userID.CString();
            info.user_name = result.memberInfoList[i].nickName.CString();
            info.role = result.memberInfoList[i].role == V2TIM_GROUP_MEMBER_ROLE_SUPER ? TUIRole::kMaster : TUIRole::kAnchor;
            member_array_.push_back(info);
        }
        LINFO("IMCore::OnIMInterfaceCallback GetGroupMemberList Size = %d", member_array_.size());
        if (callback_ == nullptr)
            return;
        callback_->OnIMGetRoomMemberInfoList(member_array_);
        member_list_request_done_ = true;
    }
}
void IMCore::GetRoomInfo(const std::string& room_id){
    V2TIMStringVector groupIds;
    groupIds.PushBack(room_id.c_str());
    IMValueInterfaceCallback<V2TIMGroupInfoResultVector>* get_group_info_callback = \
        new(std::nothrow) IMValueInterfaceCallback<V2TIMGroupInfoResultVector>(room_id.c_str(), kGetGroupInfo, this);
    V2TIMManager::GetInstance()->GetGroupManager()->GetGroupsInfo(groupIds, get_group_info_callback);
}
void IMCore::OnIMInterfaceCallback(CallBackType type, int code, const std::string& message, const V2TIMGroupInfoResultVector& result) {
    if (callback_ == nullptr || result.Size() <= 0)
        return;

    TUIRoomInfo room_info;
    room_info.owner_id = result[0].info.owner.CString();
    room_info.is_chat_room_muted = result[0].info.allMuted;
    room_info.room_id = result[0].info.groupID.CString();
    room_info.room_member_num = result[0].info.memberCount;
    std::string notification = result[0].info.notification.CString();
    if (notification.find("isChatRoomMuted") != std::string::npos) {
        room_info.is_chat_room_muted = IMParser::ParserNotificationToMuteChat(notification);
    }
    if (notification.find("isAllCameraMuted") != std::string::npos) {
        room_info.is_all_camera_muted = IMParser::ParserNotificationToMuteAllCamera(notification);
    }
    if (notification.find("isAllMicMuted") != std::string::npos) {
        room_info.is_all_microphone_muted = IMParser::ParserNotificationToMuteAllMic(result[0].info.notification.CString());
    }
    if (notification.find("isSpeechApplicationForbidden") != std::string::npos) {
        room_info.is_speech_application_forbidden = IMParser::ParserNotificationToSpeechForbidden(result[0].info.notification.CString());
    }
    if (notification.find("speechMode") != std::string::npos) {
        std::string speechMode;
        IMParser::ParserNotificationToSpeechMode(result[0].info.notification.CString(), speechMode);
          TUISpeechMode speech_mode = (speechMode == "FreeSpeech" ? TUISpeechMode::kFreeSpeech : TUISpeechMode::kApplySpeech);
          room_info.mode = speech_mode;
    }

    callback_->OnIMGetRoomInfo(room_info);
}
void IMCore::KickOffUser(const std::string& room_id, const std::string& user_id, Callback callback){
    std::string signaling = IMParser::GenerateKickOffUserJson(room_id, user_id);
    V2TIMString userID = user_id.c_str();
    V2TIMString data = signaling.c_str();
    V2TIMOfflinePushInfo offlinePushInfo;
    IMInterfaceCallback* kick_off_user_callback = new(std::nothrow) IMInterfaceCallback(kKickOffUser, this, callback);
    if (kick_off_user_callback != nullptr) {
        // 发送信令
        V2TIMString inviteID = V2TIMManager::GetInstance()->GetSignalingManager()->Invite(userID, data, true, offlinePushInfo, kInviteTimeout, kick_off_user_callback);
        if (!inviteID.Empty()) {
            std::string invite_id(inviteID.CString());
            AddSignalingInfo(user_id, invite_id, kKickOffUser);
            AddSignalingCallback(inviteID.CString(), callback);
        } else {
            LINFO("kKickOffUser failed, user_id : %s", user_id.c_str());
            NOTIFY_CALLBACK(callback, -1, "KickOffUser failed");
        }
    } else {
        LINFO("SendSpeechInvitation failed,user_id : %s", user_id.c_str());
        NOTIFY_CALLBACK(callback, -2, "SendSpeechInvitation failed, alloc failed");
    }
}

void IMCore::MuteRoomChat(const std::string& room_id, bool mute){
    V2TIMGroupInfo info;
    info.modifyFlag = V2TIM_GROUP_INFO_MODIFY_FLAG_SHUTUP_ALL | V2TIM_GROUP_INFO_MODIFY_FLAG_NOTIFICATION;
    info.allMuted = mute;
    room_info_.is_chat_room_muted = mute;
    info.notification = IMParser::GenerateModifyGroupNotification(room_info_).c_str();
    info.groupID = room_id.c_str();
    IMInterfaceCallback* modify_group_info_callback = new(std::nothrow) IMInterfaceCallback(kMuteChatRoom, this, nullptr);
    if (modify_group_info_callback != nullptr) {
        V2TIMManager::GetInstance()->GetGroupManager()->SetGroupInfo(info, modify_group_info_callback);
    }
}
void IMCore::SendChatMessage(const std::string& room_id, const std::string& user_id, const std::string& content) {
    V2TIMString text = content.c_str();
    V2TIMString groupID = room_id.c_str();
    V2TIMMessagePriority priority = V2TIM_PRIORITY_DEFAULT;
    IMSendMessageCallback<V2TIMMessage>* send_message_callback = new(std::nothrow) IMSendMessageCallback<V2TIMMessage>("sendMessage", kSendMessage, this);
    if (send_message_callback != nullptr) {
        V2TIMManager::GetInstance()->SendGroupTextMessage(text, groupID, priority, send_message_callback);
    }
}
void IMCore::SendCustomMessage(const std::string& room_id, const std::string& user_id, const std::string& content) {
    //TODO
}
void IMCore::OnIMInterfaceCallback(CallBackType type, int code, const std::string& message, const V2TIMMessage& result) {
    if (callback_ != nullptr && code != ERR_SUCC) {
        callback_->OnIMError(static_cast<int>(TUIRoomError::kErrorSendChatMessageFailed), message);
    }
}
void IMCore::OnRecvNewMessage(const V2TIMMessage &message) {
    if (callback_ == nullptr)
        return;

    std::string user_id = message.sender.CString();
    if (1 == message.elemList.Size()) {
        V2TIMElem *elem = message.elemList[0];
        if (V2TIM_ELEM_TYPE_TEXT == elem->elemType) {
            V2TIMTextElem *textElem = static_cast<V2TIMTextElem *>(elem);
            std::string message = textElem->text.CString();
            callback_->OnIMReceiveChatMessage(user_id, message);
        }
    }
}
void IMCore::MuteUserMicrophone(const std::string& room_id, const std::string& sender_id, const std::string& user_id,
    bool mute, Callback callback) {
    std::string signaling = IMParser::GenerateMuteUserMicrophoneJson(room_id, user_id, mute);
    V2TIMString userID = user_id.c_str();
    V2TIMString data = signaling.c_str();
    V2TIMOfflinePushInfo offlinePushInfo;
    IMInterfaceCallback* mute_user_microphone_callback = new(std::nothrow) IMInterfaceCallback(kMuteUserMicrophone, this, callback);
    if (mute_user_microphone_callback != nullptr) {
        V2TIMString inviteID = V2TIMManager::GetInstance()->GetSignalingManager()->Invite(userID, data, true, offlinePushInfo, kInviteTimeout, mute_user_microphone_callback);
        if (!inviteID.Empty()) {
            std::string invite_id(inviteID.CString());
            AddSignalingInfo(user_id, invite_id, kMuteUserMicrophone);
            AddSignalingCallback(inviteID.CString(), callback);
        } else {
            LINFO("MuteUserMicrophone failed, user_id : %s", user_id.c_str());
            NOTIFY_CALLBACK(callback, -1, "MuteUserMicrophone failed");
        }
    } else {
        LINFO("MuteUserMicrophone failed,user_id : %s", user_id.c_str());
        NOTIFY_CALLBACK(callback, -2, "MuteUserMicrophone failed, alloc failed");
    }
}
void IMCore::MuteAllUsersMicrophone(const std::string& room_id, bool mute){
    V2TIMGroupInfo info;
    info.modifyFlag = V2TIM_GROUP_INFO_MODIFY_FLAG_NOTIFICATION;
    info.groupID = room_id.c_str();
    room_info_.is_all_microphone_muted = mute;
    info.notification = IMParser::GenerateModifyGroupNotification(room_info_).c_str();
    IMInterfaceCallback* modify_group_info_callback = new(std::nothrow) IMInterfaceCallback(kMuteAllUserMicrophone, this, nullptr);
    V2TIMManager::GetInstance()->GetGroupManager()->SetGroupInfo(info, modify_group_info_callback);
}
void IMCore::MuteUserCamera(const std::string& room_id, const std::string& sender_id, const std::string& user_id,
    bool mute, Callback callback){
    std::string muteUserCamera = IMParser::GenerateMuteUserCameraJson(room_id, user_id, mute);
    V2TIMBuffer customData((uint8_t*)muteUserCamera.c_str(), muteUserCamera.size());
    V2TIMString userID = user_id.c_str();

    V2TIMString data = muteUserCamera.c_str();
    V2TIMOfflinePushInfo offlinePushInfo;
    IMInterfaceCallback* mute_user_camera_callback = new(std::nothrow) IMInterfaceCallback(kMuteUserCamera, this, callback);
    if (mute_user_camera_callback != nullptr) {
        V2TIMString inviteID = V2TIMManager::GetInstance()->GetSignalingManager()->Invite(userID, data, true, offlinePushInfo, kInviteTimeout, mute_user_camera_callback);
        if (!inviteID.Empty()) {
            std::string invite_id(inviteID.CString());
            AddSignalingInfo(user_id, invite_id, kMuteUserCamera);
            AddSignalingCallback(inviteID.CString(), callback);
        } else {
            LINFO("MuteUserCamera failed, user_id : %s", user_id.c_str());
            NOTIFY_CALLBACK(callback, -1, "MuteUserCamera failed");
        }
    } else {
        LINFO("MuteUserCamera failed,user_id : %s", user_id.c_str());
        NOTIFY_CALLBACK(callback, -2, "MuteUserCamera failed, alloc failed");
    }
}
void IMCore::MuteAllUsersCamera(const std::string& room_id, bool mute){
    V2TIMGroupInfo info;
    info.modifyFlag = V2TIM_GROUP_INFO_MODIFY_FLAG_NOTIFICATION;
    info.groupID = room_id.c_str();
    room_info_.is_all_camera_muted = mute;
    info.notification = IMParser::GenerateModifyGroupNotification(room_info_).c_str();
    IMInterfaceCallback* modify_group_info_callback = new(std::nothrow) IMInterfaceCallback(kMuteAllUserCamera, this, nullptr);
    V2TIMManager::GetInstance()->GetGroupManager()->SetGroupInfo(info, modify_group_info_callback);
}

void IMCore::SendSpeechInvitation(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback){
    std::string signaling = IMParser::GenerateSendSpeechInvitationJson(room_id, user_id);
    V2TIMString userID = user_id.c_str();
    V2TIMString data = signaling.c_str();
    V2TIMOfflinePushInfo offlinePushInfo;
    IMInterfaceCallback* send_speech_invitation_callback = new(std::nothrow) IMInterfaceCallback(kSendSpeechInvitation, this, callback);
    if (send_speech_invitation_callback != nullptr) {
        // 发送邀请信令
        V2TIMString inviteID = V2TIMManager::GetInstance()->GetSignalingManager()->Invite(userID, data, true, offlinePushInfo, kInviteTimeout, send_speech_invitation_callback);
        if (!inviteID.Empty()) {
            std::string invite_id(inviteID.CString());
            AddSignalingInfo(user_id, invite_id, kSendSpeechInvitation);
            AddSignalingCallback(inviteID.CString(), callback);
        } else {
            LINFO("SendSpeechInvitation failed,user_id : %s", user_id.c_str());
            NOTIFY_CALLBACK(callback, -1, "SendSpeechInvitation failed");
        }
    } else {
        LINFO("SendSpeechInvitation failed,user_id : %s", user_id.c_str());
        NOTIFY_CALLBACK(callback, -2, "SendSpeechInvitation failed, alloc failed");
    }
}

void IMCore::CancelSpeechInvitation(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback) {
    // TODO
}

void IMCore::ReplySpeechInvitation(const std::string& room_id, const std::string& sender_id, const std::string& user_id,
    bool agree, Callback callback) {
    // TODO
}

void IMCore::SendOffSpeaker(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback) {
    std::string signaling = IMParser::GenerateSendOffSpeakerJson(room_id, user_id);
    V2TIMString userID = user_id.c_str();
    V2TIMString data = signaling.c_str();
    V2TIMOfflinePushInfo offlinePushInfo;
    IMInterfaceCallback* send_off_speaker_callback = new(std::nothrow) IMInterfaceCallback(kSendOffSpeaker, this, callback);
    if (send_off_speaker_callback != nullptr) {
        V2TIMString inviteID = V2TIMManager::GetInstance()->GetSignalingManager()->Invite(userID, data, true, offlinePushInfo, kInviteTimeout, send_off_speaker_callback);
        if (!inviteID.Empty()) {
            std::string invite_id(inviteID.CString());
            AddSignalingInfo(user_id, invite_id, kSendOffSpeaker);
            AddSignalingCallback(inviteID.CString(), callback);
        } else {
            LINFO("SendOffSpeaker failed,user_id : %s", user_id.c_str());
            NOTIFY_CALLBACK(callback, -1, "SendOffSpeaker failed");
        }
    } else {
        LINFO("SendOffSpeaker failed,user_id : %s", user_id.c_str());
        NOTIFY_CALLBACK(callback, -2, "SendOffSpeaker failed, alloc failed");
    }
}
void IMCore::SendOffAllSpeakers(const std::string& room_id, const std::string& sender_id, const std::vector<std::string>& user_id_array, Callback callback) {
    // TODO
}
void IMCore::SendSpeechApplication(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback){
    std::string signaling = IMParser::GenerateSendSpeechApplicationJson(room_id, sender_id);
    V2TIMString userID = user_id.c_str();
    V2TIMString data = signaling.c_str();
    V2TIMOfflinePushInfo offlinePushInfo;
    IMInterfaceCallback* send_speech_application_callback = new(std::nothrow) IMInterfaceCallback(kSendSpeechApplication, this, callback);
    if (send_speech_application_callback != nullptr) {
        V2TIMString inviteID = V2TIMManager::GetInstance()->GetSignalingManager()->Invite(userID, data, true, offlinePushInfo, kInviteTimeout, send_speech_application_callback);
        if (!inviteID.Empty()) {
            std::string invite_id(inviteID.CString());
            AddSignalingInfo(user_id, invite_id, kSendSpeechApplication);
            AddSignalingCallback(inviteID.CString(), callback);
        } else {
            LINFO("SendSpeechApplication failed,user_id : %s", user_id.c_str());
            NOTIFY_CALLBACK(callback, -1, "SendSpeechApplication failed");
        }
    } else {
        LINFO("SendSpeechApplication failed,user_id : %s", user_id.c_str());
        NOTIFY_CALLBACK(callback, -2, "SendSpeechApplication failed, alloc failed");
    }
}
void IMCore::CancelSpeechApplication(const std::string& room_id, const std::string& sender_id, const std::string& user_id, Callback callback) {
    // TODO
}
void IMCore::ReplySpeechApplication(const std::string& room_id, const std::string& sender_id, const std::string& user_id,
    bool agree, Callback callback) {
    // TODO
}

void IMCore::ForbidSpeechApplication(const std::string& room_id, bool forbidden) {
    V2TIMGroupInfo info;
    info.modifyFlag = V2TIM_GROUP_INFO_MODIFY_FLAG_NOTIFICATION;
    info.groupID = room_id.c_str();
    room_info_.is_speech_application_forbidden = forbidden;
    info.notification = IMParser::GenerateModifyGroupNotification(room_info_).c_str();
    IMInterfaceCallback* modify_group_info_callback = new(std::nothrow) IMInterfaceCallback(kForbidSpeechApplication, this, nullptr);
    V2TIMManager::GetInstance()->GetGroupManager()->SetGroupInfo(info, modify_group_info_callback);
}

void IMCore::StartCallingRoll(const std::string& room_id) {
    // TODO
}
void IMCore::StopCallingRoll(const std::string& room_id) {
    // TODO
}
void IMCore::ReplyCallingRoll(const std::string& room_id, const std::string& sender_id, Callback callback) {
    // TODO
}
void IMCore::OnReceiveNewInvitation(const V2TIMString &inviteID, const V2TIMString &inviter,
    const V2TIMString &groupID,
    const V2TIMStringVector &inviteeList,
    const V2TIMString &data) {
    LINFO("OnReceiveNewInvitation, invite_id :%s, inviter :%s, groupId :%s, data :%s",
        inviteID.CString(), inviter.CString(), groupID.CString(), data.CString());
    std::string str_data = data.CString();
    CallBackType type;
    bool bSuccess = IMParser::ParserDataCmdToType(str_data, type);
    if (bSuccess) {
        switch (type)
        {
        case kKickOffUser: {
            V2TIMManager::GetInstance()->GetSignalingManager()->Accept(inviteID, "", nullptr);
            std::string user_id;
            IMParser::ParserDataToUserId(str_data, user_id);
            if (callback_ != nullptr && user_id == user_id_)
                callback_->OnIMExitRoom(TUIExitRoomType::kKickOff, user_id);
        }
            break;
        case kMuteUserMicrophone: {
            V2TIMManager::GetInstance()->GetSignalingManager()->Accept(inviteID, "", nullptr);
            std::string user_id;
            IMParser::ParserDataToUserId(str_data, user_id);
            bool mute = IMParser::ParserDataToMute(str_data);
            if (callback_ != nullptr && user_id == user_id_)
                callback_->OnIMMicrophoneMuted(mute);
        }
            break;
        case kMuteUserCamera: {
            V2TIMManager::GetInstance()->GetSignalingManager()->Accept(inviteID, "", nullptr);
            std::string user_id;
            IMParser::ParserDataToUserId(str_data, user_id);
            bool mute = IMParser::ParserDataToMute(str_data);
            if (callback_ != nullptr && user_id == user_id_)
                callback_->OnIMCameraMuted(mute);
        }
            break;
        default:
            break;
        }
    }
}

void IMCore::OnInviteeAccepted(const V2TIMString &inviteID, const V2TIMString &invitee, const V2TIMString &data) {
    std::string str_data = data.CString();
    CallBackType type;
    if (IMParser::ParserDataCmdToType(str_data, type)) {
        // TODO
        RemoveSignalingInfo(invitee.CString(), inviteID.CString());
        RemoveSignalingCallback(inviteID.CString());
    }
}
void IMCore::OnInviteeRejected(const V2TIMString &inviteID, const V2TIMString &invitee, const V2TIMString &data) {
    std::string str_data = data.CString();
    CallBackType type;
    if (IMParser::ParserDataCmdToType(str_data, type)) {
        // TODO
        RemoveSignalingInfo(invitee.CString(), inviteID.CString());
        RemoveSignalingCallback(inviteID.CString());
    }
}
void IMCore::OnInvitationCancelled(const V2TIMString &inviteID, const V2TIMString &inviter, const V2TIMString &data) {
    std::string str_data = data.CString();
    CallBackType type;
    if (IMParser::ParserDataCmdToType(str_data, type)) {
        // TODO
        RemoveSignalingInfo(inviter.CString(), inviteID.CString());
        RemoveSignalingCallback(inviteID.CString());
    }
}
void IMCore::OnInvitationTimeout(const V2TIMString &inviteID, const V2TIMStringVector &inviteeList) {
    if (inviteID.Empty() || inviteeList.Size() <= 0 || callback_ == nullptr)
        return;

    // 发送方超时，inviteeList包含对方ID
    // 接收方超时没响应，自己会收到超时，inviteeList包含自己
    NotifySignalingTimeOut(inviteID.CString());
    RemoveSignalingCallback(inviteID.CString());
    RemoveSignalingInfoByInviteId(inviteID.CString());
}

void IMCore::OnMemberLeave(const V2TIMString &groupID, const V2TIMGroupMemberInfo &member) {
    LINFO("IMCore::OnMemberLeave user_id = %s", member.userID.CString());
    if (callback_ != nullptr) {
        std::string group_id = groupID.CString();
        std::string user_id = member.userID.CString();
        callback_->OnIMUserExitRoom(0, user_id);
    }
}
void IMCore::OnMemberEnter(const V2TIMString &groupID, const V2TIMGroupMemberInfoVector &memberList) {
    LINFO("IMCore::OnMemberEnter");
    if (callback_ != nullptr) {
        std::string group_id = groupID.CString();
        for (int i = 0; i < memberList.Size(); i++) {
            std::string user_id = memberList[i].userID.CString();
            std::string user_name = memberList[i].nickName.CString();
            callback_->OnIMUserEnterRoom(0, user_id, user_name);
        }
    }
}
void IMCore::OnGroupDismissed(const V2TIMString &groupID, const V2TIMGroupMemberInfo &opUser) {
    LINFO("IMCore::OnGroupDismissed");
    if (callback_ != nullptr) {
        std::string group_id = groupID.CString();
        callback_->OnIMExitRoom(TUIExitRoomType::kRoomDestoryed, "");
    }
}
void IMCore::OnGroupInfoChanged(const V2TIMString &groupID, const V2TIMGroupChangeInfoVector &changeInfos) {
    LINFO("IMCore::OnGroupInfoChanged");
    if (callback_ != nullptr) {
        for (int i = 0; i < changeInfos.Size(); i++) {
            if (changeInfos[i].type == V2TIM_GROUP_INFO_CHANGE_TYPE_NOTIFICATION) {
                //群公共变更
                std::string group_notification = changeInfos[i].value.CString();
                LINFO("IMCore::OnGroupInfoChanged: notification = %s", group_notification.c_str());
                if (group_notification.find("isAllCameraMuted") != std::string::npos) {
                    bool muteCamera = IMParser::ParserNotificationToMuteAllCamera(group_notification);
                    callback_->OnIMAllUsersCameraMuted(muteCamera);
                }

                if (group_notification.find("isAllMicMuted") != std::string::npos) {
                    bool muteMic = IMParser::ParserNotificationToMuteAllMic(group_notification);
                    callback_->OnIMAllUsersMicrophoneMuted(muteMic);
                }

                if (group_notification.find("isChatRoomMuted") != std::string::npos) {
                    bool muteChat = IMParser::ParserNotificationToMuteChat(group_notification);
                    callback_->OnIMChatRoomMuted(muteChat);
                }
                break;
            } else if (changeInfos[i].type == V2TIM_GROUP_INFO_CHANGE_TYPE_OWNER) {
                std::string user_id = changeInfos[i].value.CString();
                callback_->OnIMRoomMasterChanged(user_id);
            }
        }
    }
}

void IMCore::AddSignalingInfo(const std::string& user_id, const std::string& invite_id, CallBackType type) {
    SignalingInfo info;
    info.invite_id = invite_id;
    info.user_id = user_id;
    info.type = type;
    std::lock_guard<std::mutex> lock(mutex_);
    auto signaling_array = map_signaling_[user_id_];
    signaling_array.push_back(info);
    map_signaling_[user_id] = signaling_array;
}

void IMCore::RemoveSignalingInfo(const std::string& user_id, const std::string& invite_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto signaling_array = map_signaling_[user_id_];
    for (auto iter = signaling_array.begin(); iter != signaling_array.end(); ++iter) {
        if (iter->invite_id == invite_id) {
            signaling_array.erase(iter);
            break;
        }
    }
    map_signaling_[user_id] = signaling_array;
}

void IMCore::RemoveSignalingInfoByInviteId(const std::string& invite_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto iter_map_signaling = map_signaling_.begin();
    for (; iter_map_signaling != map_signaling_.end(); ++iter_map_signaling) {
        auto signaling_array = iter_map_signaling->second;
        for (auto iter = signaling_array.begin(); iter != signaling_array.end(); ++iter) {
            if (iter->invite_id == invite_id) {
                signaling_array.erase(iter);
                break;
            }
        }
        map_signaling_[iter_map_signaling->first] = signaling_array;
    }
}

void IMCore::AddSignalingCallback(const std::string& invite_id, Callback callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    map_callback_[invite_id] = callback;
}

void IMCore::RemoveSignalingCallback(const std::string& invite_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    map_callback_.erase(invite_id);
}

void IMCore::NotifySignalingTimeOut(const std::string& invite_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto iter = map_callback_.find(invite_id);
    if (iter != map_callback_.end()) {
        NOTIFY_CALLBACK(iter->second, 1, "Signaling TimeOut");
    }
}
