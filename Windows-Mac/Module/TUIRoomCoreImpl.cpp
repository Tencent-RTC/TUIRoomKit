// Copyright (c) 2021 Tencent. All rights reserved.
#include <regex>
#include <algorithm>
#include <cstdlib>
#include <sstream>
#include "TUIRoomCoreImpl.h"
#include "ITRTCCloud.h"
#ifdef _WIN32
#include "TXLiteAVBase.h"
#endif
#include "ITXDeviceManager.h"
#include "ScreenShareManager.h"
#include "log.h"

static TUIRoomCore* room_core_ = nullptr;
static std::mutex room_core_mutex_;
TUIRoomCore* TUIRoomCore::GetInstance() {
    if (room_core_ == nullptr) {
        std::lock_guard<std::mutex> lock(room_core_mutex_);
        if (room_core_ == nullptr) {
            room_core_ = new (std::nothrow)TUIRoomCoreImpl;
        }
    }

    return room_core_;
}
void TUIRoomCore::DestroyInstance() {
    std::lock_guard<std::mutex> lock(room_core_mutex_);
    if (room_core_ != nullptr) {
        delete room_core_;
        room_core_ = nullptr;
    }
}

TUIRoomCoreImpl::TUIRoomCoreImpl() {
    if (im_core_ == nullptr) {
        im_core_ = new(std::nothrow) IMCore();
        if (im_core_ != nullptr) {
            im_core_->SetCallback(this);
        }
    }
#ifdef _WIN32
    sdk_version_ = getLiteAvSDKVersion();
    LINFO("create TUIRoomCore,SDK Version : %s", sdk_version_.c_str());
#endif
}

TUIRoomCoreImpl::~TUIRoomCoreImpl() {
    LINFO("destory TUIRoomCore");
    room_core_callback_ = nullptr;

    if (im_core_ != nullptr) {
        delete im_core_;
        im_core_ = nullptr;
    }
    ClearRoomInfo();
}

void TUIRoomCoreImpl::SetCallback(TUIRoomCoreCallback* callback) {
    LINFO("---SetCallback----");
    room_core_callback_ = callback;
}

void TUIRoomCoreImpl::ClearRoomInfo() {
    local_user_info_.role = TUIRole::kAudience;
    local_user_info_.has_audio_stream = false;
    local_user_info_.has_video_stream = false;
    local_user_info_.has_screen_stream = false;

    room_user_map_.clear();
    enter_room_success_ = false;
    if (trtc_cloud_ != nullptr) {
        trtc_cloud_->exitRoom();
        trtc_cloud_->removeCallback(this);
        destroyTRTCShareInstance();
        trtc_cloud_ = nullptr;
        device_manager_ = nullptr;
        screen_share_manager_ = nullptr;
    }
    LINFO("ClearRoomInfo");
}

int TUIRoomCoreImpl::Login(int sdk_appid, const std::string& user_id, const std::string& user_sig) {
    local_user_info_.user_id = user_id;
    sdk_app_id_ = sdk_appid;
    user_sig_ = user_sig;
    room_user_map_[user_id] = local_user_info_;
    LINFO("User Login,sdk_app_id : %d , user_id : %s , user_sig : %s", sdk_appid, user_id.c_str(), user_sig.c_str());
    if (trtc_cloud_ == nullptr) {
        trtc_cloud_ = getTRTCShareInstance();
        if (trtc_cloud_ != nullptr) {
            device_manager_ = trtc_cloud_->getDeviceManager();
            screen_share_manager_ = new (std::nothrow)ScreenShareManager(trtc_cloud_);
            trtc_cloud_->addCallback(this);
            trtc_cloud_->enableAudioVolumeEvaluation(100);
            std::string json_api ="{\"api\": \"setFramework\", \"params\": {\"framework\": 1, \"component\": 5}}";
            trtc_cloud_->callExperimentalAPI(json_api.c_str());
            // 登录IM
            if (im_core_ != nullptr) {
                im_core_->Login(sdk_appid, user_id, user_sig);
                return 0;
            }
        } else {
            LINFO("getTRTCShareInstance error,trtc_cloud is null");
            return -1;
        }
    }
    return -1;
}

int TUIRoomCoreImpl::Logout() {
    LINFO("User Logout, user_id : %s", local_user_info_.user_id.c_str());
    local_user_info_.user_id = "";                    // 用户ID
    local_user_info_.role = TUIRole::kMaster;         // 用户角色
    local_user_info_.user_name = "";                  // 用户名
    local_user_info_.has_audio_stream = false;        // 是否有音频流
    local_user_info_.has_video_stream = false;        // 是否有视频主流
    local_user_info_.has_screen_stream = false;       // 是否有屏幕分享流
    // 登出IM
    if (im_core_ != nullptr) {
        im_core_->Logout();
    }
    ClearRoomInfo();
    return 0;
}
const char* TUIRoomCoreImpl::GetSDKVersion() {
    return sdk_version_.c_str();
}
int TUIRoomCoreImpl::CreateRoom(const std::string& room_id, TUISpeechMode speech_mode) {
    // 创建房间者为房主角色
    local_user_info_.role = TUIRole::kMaster;
    room_info_.room_id = room_id;
    room_info_.room_name = room_id;
    room_info_.mode = speech_mode;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    LINFO("User CreateRoom, user_id : %s,room_id :%s,speech_mode : %d",
        local_user_info_.user_id.c_str(), room_id.c_str(), speech_mode);
    // 调用【IM创建群】信令，成功后进入TRTC房间
    if (im_core_ != nullptr) {
        im_core_->CreateRoom(room_id, speech_mode);
    }
    return 0;
}
int TUIRoomCoreImpl::DestroyRoom() {
    // IM信令销毁房间
    LINFO("User DestroyRoom, user_id : %s,room_id :%s", local_user_info_.user_id.c_str(), room_info_.room_id.c_str());
    if (im_core_ != nullptr) {
        im_core_->DestroyRoom(room_info_.room_id);
    }
    ClearRoomInfo();
    return 0;
}

int TUIRoomCoreImpl::EnterRoom(const std::string& room_id) {
    // 进入房间者为成员角色
    if (local_user_info_.role == TUIRole::kMaster) {
        LINFO("User EnterRoom(Master), user_id : %s,room_id :%s", local_user_info_.user_id.c_str(), room_id.c_str());
        EnterTRTCRoom();
    } else {
        LINFO("User EnterRoom(kAudience), user_id : %s,room_id :%s", local_user_info_.user_id.c_str(), room_id.c_str());
        room_info_.room_id = room_id;
        room_info_.room_name = room_id;
        if (room_info_.mode == TUISpeechMode::kApplySpeech)
            local_user_info_.role = TUIRole::kAudience;
        else
            local_user_info_.role = TUIRole::kAnchor;
        room_user_map_[local_user_info_.user_id] = local_user_info_;
        // 调用【IM入群】信令，成功后进入TRTC房间
        if (im_core_ != nullptr) {
            LINFO("User EnterRoom(kAudience), user_id : %s,room_id :%s", local_user_info_.user_id.c_str(), room_id.c_str());
            im_core_->EnterRoom(room_id, local_user_info_.user_id);
        }
    }
    return 0;
}
int TUIRoomCoreImpl::LeaveRoom() {
    // 调用IM退群
    LINFO("User LeaveRoom, user_id : %s,room_id :%s", local_user_info_.user_id.c_str(), room_info_.room_id.c_str());
    if (im_core_ != nullptr) {
        im_core_->LeaveRoom(room_info_.room_id);
    }
    ClearRoomInfo();
    return 0;
}
TUIRoomInfo TUIRoomCoreImpl::GetRoomInfo() {
    return room_info_;
}

std::vector<TUIUserInfo> TUIRoomCoreImpl::GetRoomUsers() {
    std::vector<TUIUserInfo> users;
    for (auto user : room_user_map_) {
        users.push_back(user.second);
    }
    return users;
}

const TUIUserInfo* TUIRoomCoreImpl::GetUserInfo(const std::string& user_id) {
    auto iter = room_user_map_.find(user_id);
    if (iter != room_user_map_.end()) {
        return &iter->second;
    }
    return nullptr;
}

int TUIRoomCoreImpl::SetSelfProfile(const std::string& user_name, const std::string& avatar_url) {
    local_user_info_.user_name = user_name;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    LINFO("User SetSelfProfile, user_name : %s, avatar_url", user_name.c_str(), avatar_url.c_str());
    if (im_core_ != nullptr) {
        im_core_->SetSelfProfile(user_name, avatar_url);
    }
    return 0;
}

int TUIRoomCoreImpl::TransferRoomMaster(const std::string& user_id) {
    LINFO("TransferRoomMasterToOther, user_id : %s", user_id.c_str());
    auto iter = room_user_map_.find(user_id);
    if (im_core_) {
        if (iter != room_user_map_.end() && iter->second.role == TUIRole::kAnchor) {
            im_core_->TransferRoomMaster(room_info_.room_id, iter->second.user_id);
        }
    }
    return 0;
}

int TUIRoomCoreImpl::StartCameraPreview(const liteav::TXView& view) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    if (local_user_info_.role != TUIRole::kMaster) {
        local_user_info_.role = TUIRole::kAnchor;
        trtc_cloud_->switchRole(liteav::TRTCRoleAnchor);
    }
    LINFO("StartCameraPreview");
    liteav::TXView local_view = (liteav::TXView)(view);
    trtc_cloud_->startLocalPreview(local_view);

    liteav::TRTCRenderParams param;
    param.rotation = TRTCVideoRotation0;
    param.fillMode = TRTCVideoFillMode_Fill;
    param.mirrorType = camera_mirror_ ? liteav::TRTCVideoMirrorType_Enable : liteav::TRTCVideoMirrorType_Disable;
    trtc_cloud_->setLocalRenderParams(param);
    trtc_cloud_->setVideoEncoderMirror(camera_mirror_);

    local_user_info_.has_video_stream = true;
    local_user_info_.has_subscribed_video_stream = true;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    return 0;
}
int TUIRoomCoreImpl::StopCameraPreview() {
    if (trtc_cloud_ == nullptr) {
        return -1; 
    }
    trtc_cloud_->stopLocalPreview();
    LINFO("StopCameraPreview");
    local_user_info_.has_video_stream = false;
    local_user_info_.has_subscribed_video_stream = false;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    return 0;
}
int TUIRoomCoreImpl::UpdateCameraPreview(const liteav::TXView& view) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    trtc_cloud_->updateLocalView((liteav::TXView)(view));
    return 0;
}

int TUIRoomCoreImpl::StartLocalAudio(const liteav::TRTCAudioQuality& quality) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    LINFO("StartLocalAudio");
    trtc_cloud_->startLocalAudio(quality);
    audio_quality_ = quality;
    local_user_info_.has_audio_stream = true;
    local_user_info_.has_subscribed_audio_stream = true;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    return 0;
}
int TUIRoomCoreImpl::StopLocalAudio() {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    LINFO("StopLocalAudio");
    trtc_cloud_->stopLocalAudio();
    local_user_info_.has_audio_stream = false;
    local_user_info_.has_subscribed_audio_stream = false;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    return 0;
}

int TUIRoomCoreImpl::StartSystemAudioLoopback() {
    if (trtc_cloud_ != nullptr) {
        LINFO("StartSystemAudioLoopback");
        trtc_cloud_->startSystemAudioLoopback();
        return 0;
    }
    return -1;
}

int TUIRoomCoreImpl::StopSystemAudioLoopback() {
    if (trtc_cloud_ != nullptr) {
        LINFO("StopSystemAudioLoopback");
        trtc_cloud_->stopSystemAudioLoopback();
        return 0;
    }
    return -1;
}

int TUIRoomCoreImpl::StartRemoteView(const std::string& user_id, const liteav::TXView& view, TUIStreamType type) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return -1;
    }
    LINFO("StartRemoteView , user_id : %s, user_name : %s, stream_type : %d", user_id.c_str(),iter->second.user_name.c_str(), type);
    liteav::TRTCVideoStreamType stream_type;
    switch (type) {
    case TUIStreamType::kStreamTypeCamera:
        stream_type = liteav::TRTCVideoStreamTypeBig;
        iter->second.has_subscribed_video_stream = true;
        break;
    case TUIStreamType::kStreamTypeScreen:
        stream_type = liteav::TRTCVideoStreamTypeSub;
        iter->second.has_subscribed_screen_stream = true;
        break;
    default:
        break;
    }
    trtc_cloud_->startRemoteView(user_id.c_str(), stream_type, (liteav::TXView)(view));
    return 0;
}
int TUIRoomCoreImpl::StopRemoteView(const std::string& user_id, TUIStreamType type) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return -1;
    }
    LINFO("StopRemoteView , user_id : %s, user_name : %s, stream_type : %d", user_id.c_str(), iter->second.user_name.c_str(), type);
    if (type == TUIStreamType::kStreamTypeCamera) {
        trtc_cloud_->stopRemoteView(user_id.c_str(), liteav::TRTCVideoStreamTypeBig);
        iter->second.has_subscribed_video_stream = false;
    } else if (type == TUIStreamType::kStreamTypeScreen) {
        trtc_cloud_->stopRemoteView(user_id.c_str(), liteav::TRTCVideoStreamTypeSub);
        iter->second.has_subscribed_screen_stream = false;
    }
    return 0;
}

int TUIRoomCoreImpl::UpdateRemoteView(const std::string& user_id, TUIStreamType type, const liteav::TXView& view) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    liteav::TRTCVideoStreamType stream_type;
    switch (type) {
    case TUIStreamType::kStreamTypeCamera:
        stream_type = liteav::TRTCVideoStreamTypeBig;
        break;
    case TUIStreamType::kStreamTypeScreen:
        stream_type = liteav::TRTCVideoStreamTypeSub;
        break;
    default:
        break;
    }
    trtc_cloud_->updateRemoteView(user_id.c_str(), stream_type, view);
    return 0;
}

int TUIRoomCoreImpl::SendChatMessage(const std::string& message) {
    // 调用【IM发送消息】
    if (im_core_ != nullptr) {
        LINFO("SendChatMessage , message : %s", message.c_str());
        im_core_->SendChatMessage(room_info_.room_id, local_user_info_.user_id, message);
    }
    return 0;
}

int TUIRoomCoreImpl::SendCustomMessage(const std::string& message) {
    // 调用【IM发送消息】
    if (im_core_ != nullptr) {
        LINFO("SendChatMessage , message : %s", message.c_str());
        im_core_->SendChatMessage(room_info_.room_id, local_user_info_.user_id, message);
    }
    return 0;
}

int TUIRoomCoreImpl::MuteUserMicrophone(const std::string& user_id, bool mute, Callback callback) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    LINFO("MuteUserMicrophone , user_id : %s, mute : %d", user_id.c_str(), mute);
    if (im_core_ != nullptr) {
        // 调用【IM的禁止/启用某人麦克风】信令给user_id用户，使其关闭上行自己的音频
        im_core_->MuteUserMicrophone(room_info_.room_id, local_user_info_.user_id, user_id, mute, callback);
    }
    return 0;
}

int TUIRoomCoreImpl::MuteAllUsersMicrophone(bool mute) {
    if (im_core_ == nullptr) {
        return -1;
    }
    LINFO("MuteAllUsersMicrophone");
    im_core_->MuteAllUsersMicrophone(room_info_.room_id, mute);
    room_info_.is_all_microphone_muted = mute;
    return 0;
}

int TUIRoomCoreImpl::MuteUserCamera(const std::string& user_id, bool mute, Callback callback) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    LINFO("MuteUserCamera , user_id : %s, mute : %d", user_id.c_str(), mute);
    if (im_core_ != nullptr) {
        // 调用【IM的禁止/启用某人摄像头】信令给user_id用户，使其关闭上行自己的视频
        im_core_->MuteUserCamera(room_info_.room_id, local_user_info_.user_id, user_id, mute, callback);
    }
    return 0;
}

int TUIRoomCoreImpl::MuteAllUsersCamera(bool mute) {
    if (im_core_ == nullptr) {
        return -1;
    }
    LINFO("MuteAllUsersCamera");
    im_core_->MuteAllUsersCamera(room_info_.room_id, mute);
    room_info_.is_all_camera_muted = mute;
    return 0;
}

int TUIRoomCoreImpl::MuteChatRoom(bool mute) {
    room_info_.is_chat_room_muted = mute;
    LINFO("MuteChatRoom, mute : %d", mute);
    if (local_user_info_.role == TUIRole::kMaster && im_core_ != nullptr) {
        // 调用【IM禁言】信令
        im_core_->MuteRoomChat(room_info_.room_id, mute);
    }
    return 0;
}

int TUIRoomCoreImpl::KickOffUser(const std::string& user_id, Callback callback) {
    // 发送【IM踢人】群信令
    if (im_core_ != nullptr) {
        LINFO("KickOffUser user_id : %s", user_id.c_str());
        im_core_->KickOffUser(room_info_.room_id, user_id, callback);
    }
    return 0;
}

// 主持人点名相关
int TUIRoomCoreImpl::StartCallingRoll() {
    LINFO("StartCallingRoll");
    if (im_core_ != nullptr) {
        im_core_->StartCallingRoll(room_info_.room_id);
    }
    return 0;
}

int TUIRoomCoreImpl::StopCallingRoll() {
    LINFO("StopCallingRoll");
    if (im_core_ != nullptr) {
        im_core_->StopCallingRoll(room_info_.room_id);
    }
    return 0;
}

int TUIRoomCoreImpl::ReplyCallingRoll(Callback callback) {
    LINFO("ReplyCallingRoll");
    if (im_core_ != nullptr) {
        auto iter = find_if(room_user_map_.begin(), room_user_map_.end(), [](std::unordered_map<std::string, TUIUserInfo>::value_type info) {
            return info.second.role == TUIRole::kMaster;
        });
        if (iter != room_user_map_.end()) {
            im_core_->ReplyCallingRoll(room_info_.room_id, local_user_info_.user_id, iter->second.user_id, callback);
        }
    }
    return 0;
}

// 邀请发言相关
int TUIRoomCoreImpl::SendSpeechInvitation(const std::string& user_id, Callback callback) {
    LINFO("SendSpeechInvitation user_id : %s", user_id.c_str());
    // 发送【IM邀请发言】信令给user_id用户，使其上行自己的音视频。
    if (im_core_ != nullptr) {
        im_core_->SendSpeechInvitation(room_info_.room_id, local_user_info_.user_id, user_id, callback);
    }
    return 0;
}

int TUIRoomCoreImpl::CancelSpeechInvitation(const std::string& user_id, Callback callback) {
    LINFO("CancelSpeechInvitation user_id : %s", user_id.c_str());
    if (im_core_ != nullptr) {
        im_core_->CancelSpeechInvitation(room_info_.room_id, local_user_info_.user_id, user_id, callback);
    }
    return 0;
}

// 成员同意/拒绝房主的发言邀请
int TUIRoomCoreImpl::ReplySpeechInvitation(bool agree, Callback callback) {
    LINFO("User ReplySpeechInvitation agree : %d", agree);
    if (im_core_ != nullptr) {
        auto iter = find_if(room_user_map_.begin(), room_user_map_.end(), [](std::unordered_map<std::string,TUIUserInfo>::value_type info) {
            return info.second.role == TUIRole::kMaster;
        });
        if (agree && local_user_info_.role != TUIRole::kMaster) {
            local_user_info_.role = TUIRole::kAnchor;
            room_user_map_[local_user_info_.user_id] = local_user_info_;
            trtc_cloud_->switchRole(liteav::TRTCRoleAnchor);
        }
        if (iter != room_user_map_.end()) {
            im_core_->ReplySpeechInvitation(room_info_.room_id, local_user_info_.user_id, iter->second.user_id, agree, callback);
        }
    }
    return 0;
}

// 申请发言相关
int TUIRoomCoreImpl::SendSpeechApplication(Callback callback) {
    // 发送【IM申请发言】信令给房主
    LINFO("User SendSpeechApplication");
    if (im_core_ != nullptr) {
        auto iter = find_if(room_user_map_.begin(), room_user_map_.end(), [](std::unordered_map<std::string, TUIUserInfo>::value_type info) {
            return info.second.role == TUIRole::kMaster;
        });
        if (iter != room_user_map_.end()) {
            im_core_->SendSpeechApplication(room_info_.room_id, local_user_info_.user_id, iter->second.user_id, callback);
        }
    }
    return 0;
}

int TUIRoomCoreImpl::CancelSpeechApplication(Callback callback) {
    LINFO("User CancelSpeechApplication");
    if (im_core_ != nullptr) {
        auto iter = find_if(room_user_map_.begin(), room_user_map_.end(), [](std::unordered_map<std::string, TUIUserInfo>::value_type info) {
            return info.second.role == TUIRole::kMaster;
            });
        if (iter != room_user_map_.end()) {
            im_core_->CancelSpeechApplication(room_info_.room_id, local_user_info_.user_id, iter->second.user_id, callback);
        }
    }
    return 0;
}

int TUIRoomCoreImpl::ReplySpeechApplication(const std::string& user_id, bool agree, Callback callback) {
    // 房主同意/拒绝成员发言，拉取/停止该成员的音视频流
    LINFO("Master ReplySpeechApplication user_id :%s,agree : %d", user_id.c_str(), agree);
    // 房主同意或拒绝发言，发送【IM同意/拒绝发言】信令user_id成员使其发言
    if (im_core_ != nullptr) {
        im_core_->ReplySpeechApplication(room_info_.room_id, local_user_info_.user_id, user_id, agree, callback);
    }
    return 0;
}

int TUIRoomCoreImpl::ForbidSpeechApplication(bool forbid) {
    if (im_core_ == nullptr) {
        return -1;
    }
    im_core_->ForbidSpeechApplication(room_info_.room_id, forbid);
    return 0;
}

int TUIRoomCoreImpl::SendOffSpeaker(const std::string& user_id, Callback callback) {
    LINFO("SendOffSpeaker user_id : %s", user_id.c_str());
    // 发送【IM邀请停止发言】信令给user_id用户，使其关闭上行自己的音视频。
    if (im_core_ != nullptr) {
        im_core_->SendOffSpeaker(room_info_.room_id, local_user_info_.user_id, user_id, callback);
    }
    return 0;
}

int TUIRoomCoreImpl::SendOffAllSpeakers(Callback callback) {
    LINFO("SendOffAllSpeakers");
    if (im_core_ != nullptr) {
        std::vector<std::string> users;
        for (auto user : room_user_map_) {
            if (user.second.user_id != local_user_info_.user_id) {
                users.push_back(user.second.user_id);
            }
        }
        im_core_->SendOffAllSpeakers(room_info_.room_id, local_user_info_.user_id, users, callback);
    }
    return 0;
}

int TUIRoomCoreImpl::ExitSpeechState() {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    LINFO("User StopSpeaking");
    // 成员停止发言，关闭本地视音频，其他成员收到trtc的onUserVideoAvailable()回调后做关闭处理
    trtc_cloud_->stopLocalPreview();
    trtc_cloud_->stopLocalAudio();

    if (local_user_info_.role != TUIRole::kMaster &&  local_user_info_.role != TUIRole::kAudience) {
        trtc_cloud_->switchRole(liteav::TRTCRoleAudience);
        local_user_info_.role = TUIRole::kAudience;
    }
    local_user_info_.has_screen_stream = false;
    local_user_info_.has_subscribed_screen_stream = false;
    local_user_info_.has_audio_stream = false;
    local_user_info_.has_subscribed_audio_stream = false;
    local_user_info_.has_video_stream = false;
    local_user_info_.has_subscribed_video_stream = false;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    return 0;
}

liteav::ITXDeviceManager* TUIRoomCoreImpl::GetDeviceManager() {
    if (device_manager_ == nullptr) {
        device_manager_ = trtc_cloud_->getDeviceManager();
    }
    return device_manager_;
}
IScreenShareManager* TUIRoomCoreImpl::GetScreenShareManager() {
    if (screen_share_manager_ == nullptr) {
        screen_share_manager_ = new (std::nothrow)ScreenShareManager(trtc_cloud_);
    }
    return screen_share_manager_;
}

int TUIRoomCoreImpl::StartCloudRecord() {
    // TODO
    return 0;
}
int TUIRoomCoreImpl::StopCloudRecord() {
    // TODO
    return 0;
}

int TUIRoomCoreImpl::SetBeautyStyle(liteav::TRTCBeautyStyle style, uint32_t beauty_level,
    uint32_t whiteness_level, uint32_t ruddiness_level) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    trtc_cloud_->setBeautyStyle(style, beauty_level, whiteness_level, ruddiness_level);
    return 0;
}

int TUIRoomCoreImpl::SetVideoQosPreference(TUIVideoQosPreference preference) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }

    liteav::TRTCNetworkQosParam param;
    switch (preference) {
    case TUIVideoQosPreference::kSmooth:
        param.preference = liteav::TRTCVideoQosPreferenceSmooth;
        break;
    case TUIVideoQosPreference::kClear:
        param.preference = liteav::TRTCVideoQosPreferenceClear;
        break;
    }
    trtc_cloud_->setNetworkQosParam(param);
    return 0;
}

int TUIRoomCoreImpl::SetVideoMirror(bool mirror) {
    liteav::TRTCRenderParams render_params;
    render_params.mirrorType = mirror ? liteav::TRTCVideoMirrorType_Enable : liteav::TRTCVideoMirrorType_Disable;
    render_params.rotation = TRTCVideoRotation0;
    render_params.fillMode = TRTCVideoFillMode_Fill;

    trtc_cloud_->setLocalRenderParams(render_params);
    trtc_cloud_->setVideoEncoderMirror(mirror);
    camera_mirror_ = mirror;
    return 0;
}

int TUIRoomCoreImpl::OpenAINoiseReduction() {
    std::stringstream ans_level;
    ans_level << "{\"api\":\"enableAudioANS\",\"params\":{\"enable\":1,\"level\":120}}";
    if (trtc_cloud_ != nullptr) {
        trtc_cloud_->callExperimentalAPI(ans_level.str().c_str());
    }
    return 0;
}

int TUIRoomCoreImpl::CloseAINoiseReduction() {
    std::stringstream ans_level;
    int level = 120;
    if (audio_quality_ == TRTCAudioQualitySpeech) {
        level = 120;
    } else if(audio_quality_ == TRTCAudioQualityDefault) {
        level = 60;
    } else {
        level = 20;
    }
    ans_level << "{\"api\":\"enableAudioANS\",\"params\":{\"enable\":1,\"level\":" << level <<"}}";
    if (trtc_cloud_ != nullptr) {
        trtc_cloud_->callExperimentalAPI(ans_level.str().c_str());
    }
    return 0;
}

int TUIRoomCoreImpl::ShowDebugView(int showType) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }

    trtc_cloud_->showDebugView(showType);
    return 0;
}

//////////////////////////////////////////////////////////////////////////
//                        TRTC回调函数
//////////////////////////////////////////////////////////////////////////
void TUIRoomCoreImpl::onEnterRoom(int result) {
    if (result > 0) {
        LINFO("User onEnterRoom,cost time :%d,current role : %d", result, local_user_info_.role);
        enter_room_success_ = true;
        LINFO("User onEnterRoom after cost time :%d,current role : %d", result, local_user_info_.role);
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnEnterRoom(result, room_info_.room_id);
    }
}
void TUIRoomCoreImpl::onExitRoom(int reason) {
    LINFO("User onExitRoom,data :%d", reason);
    enter_room_success_ = false;
}
void TUIRoomCoreImpl::onUserVideoAvailable(const char* user_id, bool available) {
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return;
    }
    iter->second.has_video_stream = available;
    LINFO("onUserVideoAvailable,user_id :%s,user_name : %s,available :%d", user_id, iter->second.user_name.c_str(), available);
    liteav::TRTCRenderParams param;
    param.rotation = TRTCVideoRotation0;
    param.fillMode = TRTCVideoFillMode_Fill;
    param.mirrorType = TRTCVideoMirrorType_Disable;
    trtc_cloud_->setRemoteRenderParams(user_id, TRTCVideoStreamTypeBig, param);

    std::string remote_user_id = user_id;
    if (room_core_callback_ != nullptr) {
        // 通知上层，让上层拉取user_id用户的视频流并显示
        room_core_callback_->OnRemoteUserCameraAvailable(remote_user_id, available);
    }
}
void TUIRoomCoreImpl::onUserSubStreamAvailable(const char* user_id, bool available) {
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return;
    }
    iter->second.has_screen_stream = available;
    LINFO("onUserSubStreamAvailable,user_id :%s,user_name: %s,available :%d", user_id, iter->second.user_name.c_str(), available);
    liteav::TRTCRenderParams param;
    param.rotation = TRTCVideoRotation0;
    param.fillMode = TRTCVideoFillMode_Fit;
    param.mirrorType = TRTCVideoMirrorType_Disable;
    trtc_cloud_->setRemoteRenderParams(user_id, TRTCVideoStreamTypeSub, param);

    std::string remote_user_id = user_id;
    if (room_core_callback_ != nullptr) {
        // 通知上层，让上层拉取user_id用户的音视频流并显示
        room_core_callback_->OnRemoteUserScreenAvailable(remote_user_id, available);
    }
}
void TUIRoomCoreImpl::onScreenCaptureStoped(int reason) {
    if (room_core_callback_ != nullptr) {
		// 屏幕分享意外终止，通知上层停止屏幕分享
        room_core_callback_->OnScreenCaptureStopped(reason);
	}
    local_user_info_.has_screen_stream = false;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
}
void TUIRoomCoreImpl::onScreenCaptureStarted() {
    LINFO("onScreenCaptureStarted");
    local_user_info_.has_screen_stream = true;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
}
void TUIRoomCoreImpl::onUserAudioAvailable(const char* user_id, bool available) {
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return;
    }
    iter->second.has_audio_stream = available;
    iter->second.has_subscribed_audio_stream = available;
    LINFO("onUserAudioAvailable,user_id :%s, user_name:%s, available :%d", user_id, iter->second.user_name.c_str(), available);
    std::string remote_user_id = user_id;
    if (room_core_callback_ != nullptr) {
        // 通知上层，让上层拉取user_id用户的音频流并播放
        room_core_callback_->OnRemoteUserAudioAvailable(remote_user_id, available);
    }
}
void TUIRoomCoreImpl::onFirstVideoFrame(const char* user_id, const liteav::TRTCVideoStreamType stream_type,
    const int width, const int height) {
    TUIStreamType type;
    switch (stream_type) {
    case liteav::TRTCVideoStreamType::TRTCVideoStreamTypeBig:
        type = TUIStreamType::kStreamTypeCamera;
        break;
    case liteav::TRTCVideoStreamType::TRTCVideoStreamTypeSub:
        type = TUIStreamType::kStreamTypeScreen;
        break;
    }
    LINFO("onFirstVideoFrame,user_id :%s,stream_type :%d, width:%d, height:%d", user_id, stream_type, width, height);

    std::string str_user_id(user_id);
    if (str_user_id.empty()) {
        if (stream_type == TRTCVideoStreamTypeBig) {
            local_user_info_.has_video_stream = true;
            local_user_info_.has_subscribed_video_stream = true;
        } else if (stream_type == TRTCVideoStreamTypeSub) {
            local_user_info_.has_screen_stream = true;
            local_user_info_.has_subscribed_screen_stream = true;
        }
        room_user_map_[local_user_info_.user_id] = local_user_info_;
    } else {
        if (room_user_map_.find(str_user_id) != room_user_map_.end()) {
            if (stream_type == TRTCVideoStreamTypeBig) {
                room_user_map_[str_user_id].has_video_stream = true;
                room_user_map_[str_user_id].has_subscribed_video_stream = true;
            } else if (stream_type == TRTCVideoStreamTypeSub) {
                room_user_map_[str_user_id].has_screen_stream = true;
                room_user_map_[str_user_id].has_subscribed_screen_stream = true;
            }
        }
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnFirstVideoFrame(str_user_id, type);
    }
}

void TUIRoomCoreImpl::onRemoteUserEnterRoom(const char* user_id) {
    std::string remote_user_id(user_id);
    auto iter = room_user_map_.find(user_id);
    LINFO("onRemoteUserEnterRoom,user_id :%s", user_id);
    // 已经进入im房间的成员转换为kAnchor角色
    if (iter != room_user_map_.end()) {
        LINFO("User Enter IM before TRTC,user_id :%s user_name:%s ,role: %d", user_id, iter->second.user_name.c_str(), iter->second.role);
        if (iter->second.role == TUIRole::kAudience) {
            iter->second.role = TUIRole::kAnchor;
        }
        LINFO("User Enter IM,user_id :%s ,role: %d", user_id, iter->second.role);
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnRemoteUserEnterSpeechState(remote_user_id);
        }
        return;
    }

    // TRTC用户 或 成员先进入了TRTC房间，才进入IM群聊，先认为是其他用户
    LINFO("User Enter TRTC before IM or Other Member,user_id :%s", user_id);
    TUIUserInfo user;
    user.user_id = remote_user_id;
    user.role = TUIRole::kOther;    // 其他用户
    room_user_map_[remote_user_id] = user;
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnRemoteUserEnter(remote_user_id);
    }
}

void TUIRoomCoreImpl::onRemoteUserLeaveRoom(const char* user_id, int reason) {
    std::string remote_user_id(user_id);
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return;
    }
    LINFO("onRemoteUserLeaveRoom,user_id :%s, role: %d, reason :%d", user_id, iter->second.role, reason);
    // TRTC用户退房
    if (iter->second.role == TUIRole::kOther) {
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnRemoteUserLeave(remote_user_id);
        }
        room_user_map_.erase(remote_user_id);
    } else if (iter->second.role == TUIRole::kAnchor) {
        LINFO("User Leave Room,user_id :%s user_name:%s ,role: %d", user_id, iter->second.user_name.c_str(), iter->second.role);
        if (iter->second.role == TUIRole::kAnchor) {
            iter->second.role = TUIRole::kAudience;
        }
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnRemoteUserExitSpeechState(remote_user_id);
        }
    }
}

void TUIRoomCoreImpl::onUserVoiceVolume(liteav::TRTCVolumeInfo* user_volumes, uint32_t user_volumes_count, uint32_t total_volume) {
    // 当没有人说话时，userVolumes 为空，totalVolume 为 0。
    if (user_volumes == NULL)
        return;

    for (int i = 0; i < user_volumes_count; i++) {
        liteav::TRTCVolumeInfo volume = user_volumes[i];
        std::string user_id(volume.userId);
        int user_voice_volume = volume.volume;

        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnUserVoiceVolume(user_id, user_voice_volume);
        }
    }
}

void TUIRoomCoreImpl::onError(TXLiteAVError error_code, const char* error_message, void* extra_info) {
    int trtc_error_code;

    switch (error_code) {
    case ERR_CAMERA_START_FAIL:
    case ERR_CAMERA_NOT_AUTHORIZED:
    case ERR_CAMERA_SET_PARAM_FAIL:
    case ERR_CAMERA_OCCUPY: {
        trtc_error_code = static_cast<int>(TUIRoomError::kErrorStartCameraFailed);
        local_user_info_.has_video_stream = false;
        room_user_map_[local_user_info_.user_id] = local_user_info_;
        break;
    }
    case ERR_MIC_START_FAIL:
    case ERR_MIC_NOT_AUTHORIZED:
    case ERR_MIC_SET_PARAM_FAIL:
    case ERR_MIC_OCCUPY: {
        trtc_error_code = static_cast<int>(TUIRoomError::kErrorStartMicrophoneFailed);
        local_user_info_.has_audio_stream = false;
        room_user_map_[local_user_info_.user_id] = local_user_info_;
        break;
    }
    default:
        break;
    }
    LINFO("trtc error, error : %d, error_message: %s", error_code, error_message);
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnError(trtc_error_code, error_message);
    }
}
void TUIRoomCoreImpl::onWarning(TXLiteAVWarning warning_code, const char* warning_message, void* extra_info) {
    //关闭了那个麦克风后 SDK 会回调  WARNING_AUDIO_DEVICE_CAPTURE_STOP_FAILED WARNING_MICROPHONE_NOT_AUTHORIZED 这两个事件
    LINFO("onWarning, warning : %d, warning_message: %s", warning_code, warning_message);
    if (warning_code == WARNING_MICROPHONE_NOT_AUTHORIZED) {
        static bool is_first = true;
        if (!is_first)
            return;
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnError(static_cast<int>(TUIRoomError::kErrorMicrophoneNotAuthorized), warning_message);
        }
        is_first = false;
    }
}
void TUIRoomCoreImpl::onLog(const char* log, liteav::TRTCLogLevel level, const char* module) {
}

void TUIRoomCoreImpl::onTestSpeakerVolume(uint32_t volume) {
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnTestSpeakerVolume(volume);
    }
}

void TUIRoomCoreImpl::onTestMicVolume(uint32_t volume) {
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnTestMicrophoneVolume(volume);
    }
}
void TUIRoomCoreImpl::onAudioDeviceCaptureVolumeChanged(uint32_t volume, bool muted) {
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnAudioDeviceCaptureVolumeChanged(volume, muted);
    }
}
void TUIRoomCoreImpl::onAudioDevicePlayoutVolumeChanged(uint32_t volume, bool muted) {
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnAudioDevicePlayoutVolumeChanged(volume, muted);
    }
}

void TUIRoomCoreImpl::onNetworkQuality(liteav::TRTCQualityInfo local_quality,
    liteav::TRTCQualityInfo* remote_quality, uint32_t remote_quality_count) {
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnNetworkQuality(local_quality, remote_quality, remote_quality_count);
    }
}

void TUIRoomCoreImpl::onStatistics(const liteav::TRTCStatistics& statistics) {
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnStatistics(statistics);
    }
}

void TUIRoomCoreImpl::EnterTRTCRoom() {
    // 创建群成功(角色是房主) 或 进入群成功（角色是成员）
    // 进入TRTC房间
    if (trtc_cloud_ == nullptr) {
        return;
    }
    liteav::TRTCParams params;
    if (local_user_info_.role == TUIRole::kMaster || room_info_.mode == TUISpeechMode::kFreeSpeech) {
        params.role = liteav::TRTCRoleAnchor;
    } else {
        params.role = liteav::TRTCRoleAudience;
    }
    params.sdkAppId = sdk_app_id_;
    params.userId = local_user_info_.user_id.c_str();
    std::string room_id(room_info_.room_id);
    room_id = room_id.substr(room_id.find_last_of('_')+1);
    if (room_id.length() == 0) {
        return;
    }

    std::regex reg("[0-9]+");
    if (std::regex_match(room_id, reg)) {
        params.roomId = atoi(room_id.c_str());
    } else {
        params.roomId = 0;
        params.strRoomId = room_id.c_str();
    }
    params.userSig = user_sig_.c_str();
    LINFO("User EnterTRTCRoom, sdk_app_id : %d, user_id: %s, user_name : %s, role: %d room_id: %s",
        sdk_app_id_, local_user_info_.user_id.c_str(), local_user_info_.user_name.c_str(),
        local_user_info_.role, room_id.c_str());
    trtc_cloud_->enterRoom(params, liteav::TRTCAppSceneLIVE);
}

//////////////////////////////////////////////////////////////////////////
//                        IM回调函数
//////////////////////////////////////////////////////////////////////////
void TUIRoomCoreImpl::OnIMError(int code, const std::string& message) {
    LINFO("OnIMError error :%d, message %s", code, message.c_str());
	TUIRoomError error = static_cast<TUIRoomError>(code);
    if (error == TUIRoomError::kErrorCreateRoomFailed) {
        // 创建房间失败
        LINFO("User Create Room Failed");
        local_user_info_.role = TUIRole::kAudience;
        room_user_map_[local_user_info_.user_id] = local_user_info_;
    }
    if (error == TUIRoomError::kErrorTransferRoomFailed) {
        // 转让房间失败,解散房间
        LINFO("User Transfer Room Failed");
        im_core_->DestroyRoom(room_info_.room_id);
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnError(code, message);
    }
}
void TUIRoomCoreImpl::OnIMLogin(int code, const std::string& message) {
    // 登录成功，立即调用【IM获取成员列表】信令
    LINFO("OnIMLogin code :%d, message %s", code, message.c_str());
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnLogin(code, message);
    }
}
void TUIRoomCoreImpl::OnIMLogout(int code, const std::string& message) {
    LINFO("OnIMLogout code :%d, message %s", code, message.c_str());
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnLogout(code, message);
    }
}
void TUIRoomCoreImpl::OnIMCreateRoom(int code, const std::string& message) {
    // 群已经存在，当房主被异地登出后，重新登录需要获取房间成员列表
    LINFO("OnIMCreateRoom code :%d, message %s", code, message.c_str());
    if (code != 0 && im_core_ != nullptr) {
        im_core_->GetRoomInfo(room_info_.room_id);
        im_core_->GetRoomMemberInfoList(room_info_.room_id);
    } else if (code == 0) { // 成功建群
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnCreateRoom(code, message);
            std::chrono::milliseconds ms = std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch());
            room_info_.start_time = ms.count();
        }
    }
}
void TUIRoomCoreImpl::OnIMDestroyRoom(int code, const std::string& message) {
    LINFO("OnIMDestroyRoom code :%d, message %s", code, message.c_str());
    if (!enter_room_success_ || local_user_info_.role != TUIRole::kMaster) {
        return;
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnDestroyRoom(code, message);
    }
    ClearRoomInfo();
}
void TUIRoomCoreImpl::OnIMEnterRoom(int code, const std::string& message) {
    // IM进群的回调
    // 登录成功，立即调用【IM获取成员列表】信令
    // 如果是成员，需要先获取群列表和群信息，才能进房间
    LINFO("OnIMEnterRoom code :%d, message %s,role: %d", code, message.c_str(), local_user_info_.role);
    if (im_core_ != nullptr && local_user_info_.role != TUIRole::kMaster) {
        im_core_->GetRoomInfo(room_info_.room_id);
        im_core_->GetRoomMemberInfoList(room_info_.room_id);
    } else {
        this->EnterTRTCRoom();
    }
}
void TUIRoomCoreImpl::OnIMExitRoom(TUIExitRoomType code, const std::string& message) {
    // 自己收到该回调，调用TRTC的退出房间接口
    LINFO("OnIMExitRoom code :%d, message %s,role: %d", code, message.c_str(), local_user_info_.role);
    if (!enter_room_success_ && code != TUIExitRoomType::kKickOffLine) {
        return;
    }
    // 主持人不响应房间销毁和被踢出房间消息
    if (local_user_info_.role == TUIRole::kMaster && 
        (code == TUIExitRoomType::kRoomDestoryed || code == TUIExitRoomType::kKickOff)) {
        return;
    }
    enter_room_success_ = false;
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnExitRoom(code, message);
    }
}
void TUIRoomCoreImpl::OnIMUserExitRoom(int code, const std::string& user_id) {
    LINFO("OnIMUserExitRoom code :%d, user_id %s", code, user_id.c_str());
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnRemoteUserLeave(user_id);
    }
    room_user_map_.erase(user_id);
}

void TUIRoomCoreImpl::OnIMRoomMasterChanged(const std::string& user_id){
    LINFO("OnIMRoomMasterChanged user_id %s", user_id.c_str());
    if (user_id == room_info_.owner_id) {
        LINFO("Current master is %s,don't need change", user_id.c_str());
        return;
    }
    auto iter = room_user_map_.begin();
    for (; iter != room_user_map_.end(); iter++) {
        if (iter->second.role == TUIRole::kMaster) {
            iter->second.role = TUIRole::kAnchor;
        } else if (iter->second.user_id == user_id) {
            iter->second.role = TUIRole::kMaster;
        }
    }

    room_info_.owner_id = user_id;
    if (local_user_info_.user_id == user_id) {
        local_user_info_.role = TUIRole::kMaster;
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnRoomMasterChanged(user_id);
    }
}

void TUIRoomCoreImpl::OnIMUserEnterRoom(int code, const std::string& user_id, const std::string& user_name) {
    LINFO("OnIMUserEnterRoom user_id %s ,user_name : %s", user_id.c_str(), user_name.c_str());
    if (user_id == local_user_info_.user_id) {
        return;
    }
    auto iter = room_user_map_.find(user_id);
    if (iter != room_user_map_.end()) {
        // 说明成员先进入的trtc房间才进入的im房间，更改身份
        LINFO("User Enter TRTC before IM, user_id %s ,user_name : %s,role : %d",
            user_id.c_str(), user_name.c_str(), iter->second.role);
        if (iter->second.role == TUIRole::kOther) {
            iter->second.role = TUIRole::kAnchor;
        }
        LINFO("User Enter IM, user_id %s ,user_name : %s,role : %d",
            user_id.c_str(), user_name.c_str(), iter->second.role);
        iter->second.user_name = user_name;
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnRemoteUserEnterSpeechState(user_id);
        }
    } else {
        // 说明成员先进入的im房间
        LINFO("User Enter IM before TRTC, user_id %s ,user_name : %s",
            user_id.c_str(), user_name.c_str());
        TUIUserInfo user;
        user.user_id = user_id;
		user.user_name = user_name;
        user.role = TUIRole::kAudience;
        room_user_map_[user_id] = user;
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnRemoteUserEnter(user_id);
        }
    }
}

void TUIRoomCoreImpl::OnIMGetRoomMemberInfoList(const std::vector<TUIUserInfo>& member_array) {
    LINFO("OnIMGetRoomMemberInfoList member size = %d", member_array.size());
    for (int i = 0; i < member_array.size(); i++) {
        TUIUserInfo member_info = member_array.at(i);
        if (member_info.user_id == local_user_info_.user_id) {
            continue;
        }
        TUIUserInfo user;
        user.user_id = member_info.user_id;
        user.role = member_info.role;
        user.user_name = member_info.user_name;
        room_user_map_[user.user_id] = user;
    }
    if (local_user_info_.role != TUIRole::kMaster) {
        EnterTRTCRoom();
    } else { //房主创房时房间已存在，主要是房主异常情况退出
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnCreateRoom(0, "");
        }
    }
}
void TUIRoomCoreImpl::OnIMGetRoomInfo(const TUIRoomInfo& info) {
    room_info_.is_all_camera_muted = info.is_all_camera_muted;
    room_info_.is_all_microphone_muted = info.is_all_microphone_muted;
    room_info_.is_chat_room_muted = info.is_chat_room_muted;
    room_info_.is_speech_application_forbidden = info.is_speech_application_forbidden;
    room_info_.is_callingroll = info.is_callingroll;
    room_info_.mode = info.mode;
    room_info_.start_time = info.start_time;
    room_info_.owner_id = info.owner_id;
    LINFO("OnIMGetRoomInfo,is_all_camera_muted:%d,is_all_microphone_muted:%d,is_chat_room_muted:%d,"
        "stage_forbidden:%d,mode:%d,is_callingroll:%d",
        info.is_all_camera_muted, info.is_all_microphone_muted, info.is_chat_room_muted,
        info.is_speech_application_forbidden, info.mode,info.is_callingroll);
    // 用户为房主的情况，房主创房时房间已存在，房主异常情况退出才会出现
    if (info.owner_id == local_user_info_.user_id) {
        // 房主错误以成员身份登录
        if (local_user_info_.role != TUIRole::kMaster) {
            local_user_info_.role = TUIRole::kMaster;
            room_user_map_[local_user_info_.user_id] = local_user_info_;
            if (room_core_callback_ != nullptr) {
                room_core_callback_->OnError(static_cast<int>(TUIRoomError::kErrorHasBeenRoomMaster), "");
            }
        }
    }
}

void TUIRoomCoreImpl::OnIMReceiveChatMessage(const std::string& user_id, const std::string& message) {
    LINFO("OnIMReceiveChatMessage, user_id %s ,messgae : %s", user_id.c_str(), message.c_str());
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return;
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnReceiveChatMessage(user_id, message);
    }
}
void TUIRoomCoreImpl::OnIMReceiveCustomMessage(const std::string& user_id, const std::string& message) {
    LINFO("OnIMReceiveCustomMessage, user_id %s ,messgae : %s", user_id.c_str(), message.c_str());
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return;
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnReceiveCustomMessage(user_id, message);
    }
}
void TUIRoomCoreImpl::OnIMChatRoomMuted(bool muted) {
    LINFO("OnIMChatRoomMuted, mute : %d", muted);
    room_info_.is_chat_room_muted = muted;
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnChatRoomMuted(muted);
    }
}

void TUIRoomCoreImpl::OnIMReceiveSpeechInvitation() {
    LINFO("OnIMReceiveSpeechInvitation");
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnReceiveSpeechInvitation();
    }
}
void TUIRoomCoreImpl::OnIMReceiveInvitationCancelled() {
    LINFO("OnIMReceiveInvitationCancelled");
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnReceiveInvitationCancelled();
    }
}
void TUIRoomCoreImpl::OnIMOrderedToExitSpeechkState() {
    LINFO("OnIMOrderedToExitSpeechkState");
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnOrderedToExitSpeechState();
    }
    // 被房主请停止发言，成员需要转换自己的身份为观众
    if (trtc_cloud_ != nullptr && local_user_info_.role != TUIRole::kMaster && local_user_info_.role != TUIRole::kAudience) {
        trtc_cloud_->switchRole(liteav::TRTCRoleAudience);
        local_user_info_.role = TUIRole::kAudience;
        room_user_map_[local_user_info_.user_id] = local_user_info_;
    }
}
void TUIRoomCoreImpl::OnIMCallingRollStarted() {
    LINFO("OnIMCallingRollStarted");
    room_info_.is_callingroll = true;
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnCallingRollStarted();
    }
}
void TUIRoomCoreImpl::OnIMCallingRollStopped() {
    LINFO("OnIMCallingRollStopped");
    room_info_.is_callingroll = false;
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnCallingRollStopped();
    }
}
void TUIRoomCoreImpl::OnIMMemberReplyCallingRoll(const std::string& user_id) {
    LINFO("OnIMCallingRollStopped, user_di : %s",user_id.c_str());
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnMemberReplyCallingRoll(user_id);
    }
}
void TUIRoomCoreImpl::OnIMReceiveSpeechApplication(const std::string& user_id) {
    LINFO("OnIMReceiveSpeechApplication, user_id :%s", user_id.c_str());

    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnReceiveSpeechApplication(user_id);
    }
}

void TUIRoomCoreImpl::OnIMSpeechApplicationCancelled(const std::string& user_id) {
    LINFO("OnIMSpeechApplicationCancelled, user_id :%s", user_id.c_str());

    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnSpeechApplicationCancelled(user_id);
    }
}

void TUIRoomCoreImpl::OnIMReceiveReplyToSpeechApplication(bool agree) {
    LINFO("OnIMAgreeSpeechApplication, agree :%d", agree);
    if (agree && trtc_cloud_ != nullptr && local_user_info_.role != TUIRole::kMaster) {
        // 房主同意了发言请求，成员需要转换自己的身份为主播
        trtc_cloud_->switchRole(liteav::TRTCRoleAnchor);
        local_user_info_.role = TUIRole::kAnchor;
        room_user_map_[local_user_info_.user_id] = local_user_info_;
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnReceiveReplyToSpeechApplication(agree);
    }
}

// 房主端收到成员同意/拒绝邀请的回调
void TUIRoomCoreImpl::OnIMReceiveReplyToSpeechInvitation(const std::string& user_id, bool agree) {
    LINFO("OnIMReceiveReplyToSpeechInvitation, user_id :%s,agree :%d", user_id.c_str(), agree);
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return;
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnReceiveReplyToSpeechInvitation(user_id, agree);
    }
}

void TUIRoomCoreImpl::OnIMMicrophoneMuted(bool muted) {
    LINFO("OnIMMicrophoneMuted mute :%d", muted);
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnMicrophoneMuted(muted);
    }
}
void TUIRoomCoreImpl::OnIMAllUsersMicrophoneMuted(bool muted) {
    LINFO("OnIMMuteAllUsersMic, mute :%d", muted);
    room_info_.is_all_microphone_muted = muted;
    if (local_user_info_.role == TUIRole::kMaster) {
        return;
    }
    if (room_core_callback_ != nullptr && muted) {
        room_core_callback_->OnMicrophoneMuted(muted);
    }
}

void TUIRoomCoreImpl::OnIMCameraMuted(bool muted) {
    LINFO("OnIMMuteCamera mute :%d", muted);
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnCameraMuted(muted);
    }
}
void TUIRoomCoreImpl::OnIMAllUsersCameraMuted(bool muted) {
    LINFO("OnIMMuteAllUsersCamera, mute :%d", muted);
    if (local_user_info_.role == TUIRole::kMaster) {
        return;
    }
    room_info_.is_all_camera_muted = muted;
    if (room_core_callback_ != nullptr && muted) {
        room_core_callback_->OnCameraMuted(muted);
    }
}

void TUIRoomCoreImpl::OnIMSpeechApplicationForbidden(bool forbidden) {
    LINFO("OnIMSpeechApplicationForbidden, forbidden :%d", forbidden);
    room_info_.is_speech_application_forbidden = forbidden;
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnSpeechApplicationForbidden(forbidden);
    }
}
