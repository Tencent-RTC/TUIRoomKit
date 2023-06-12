// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_INCLUDE_TUIROOMDEF_H_
#define MODULE_INCLUDE_TUIROOMDEF_H_
#include <string>
#include <functional>
#include "TRTCTypeDef.h"

#include "ITUIRoomDefine.h"

/**
 * Error codes
 */
enum class TUIRoomError {
    kErrorParamInvalid                      = -999,  // 无效参数 (Invalid parameter)
    kErrorLoginFailed                       = -1000, // 登录失败 (Login failed)
    kErrorLogoutFailed                      = -1001, // 登出失败 (Logout failed)
    kErrorCreateRoomFailed                  = -1002, // 创建房间失败 (Failed to create the room)
    kErrorDestoryRoomFailed                 = -1003, // 销毁房间失败 (Failed to terminate the room)
    kErrorEnterRoomFailed                   = -1004, // 进入房间失败 (Failed to enter the room)
    kErrorExitRoomFailed                    = -1005, // 退出房间失败 (Failed to exit the room)
    kErrorChangeRoomInfoFailed              = -1007, // 修改群信息失败 (Failed to modify the group information)
    kErrorGetRoomInfoFailed                 = -1008, // 获取群信息失败 (Failed to get the group information)
    kErrorGetRoomMemberFailed               = -1009, // 获取房间成员失败 (Failed to get room members)
    kErrorSendChatMessageFailed             = -1010, // 发送消息失败 (Failed to send a message)
    kErrorStartCameraFailed                 = -1011, // 开启摄像头失败 (Failed to turn on the camera)
    kErrorStartMicrophoneFailed             = -1012, // 开始麦克风失败 (Failed to turn on the microphone)
    kErrorMuteChatRoomFailed                = -1013, // 聊天室禁言失败 (Failed to mute the chat room)
    kErrorChangeSpeechModeFailed            = -1014, // 修改发言模式失败 (Failed to modify the speech mode)
    kErrorHasBeenRoomMaster                 = -1015, // 已经是该房间的主持人 (The user is already the host of the room)
    kErrorCurrentRoomTypeIncorrect          = -1016, // 当前房间类型不正确 (The current room type is incorrect)
    kErrorCurrentRoomFullComplement         = -1017, // 当前房间已满员 (The current room is full)
    kErrorForbidSpeechFailed                = -1018, // 禁止发言操作失败 (Failed to disable speech)
    kErrorMuteAllUsersMicrophoneFailed      = -1019, // 禁止/打开所有人麦克风失败 (Failed to enable/disable the microphone of all users)
    kErrorMuteAllUsersCameraFailed          = -1020, // 禁止/打开所有人摄像头失败 (Failed to enable/disable the camera of all users)
    kErrorMicrophoneNotAuthorized           = -1021, // 用户未授权当前应用使用麦克风 (The current application is not authorized to use the microphone)
    kErrorAnotherUserIsPushingScreenStream  = -1022, // 其他用户正在上行辅路 (Other users are sending substream data)
    kErrorSetSelfProfileFailed              = -1023, // 设置个人信息失败 (Failed to set the personal information)
    kErrorTransferRoomFailed                = -1024, // 转交群失败 (Failed to transfer the group ownership)
    kErrorRollCallFailed                    = -1025, // 主持人点名失败 (The host failed to start a roll call)
    kErrorReplyRollCallFailed               = -1026, // 成员回复主持人点名失败 (The member failed to reply to the host's roll call)
    kErrorScreenCaptrueNotAuthoized         = -1027, // 用户未授权当前应用使用屏幕录制 (The user does not authorize the current application to use screen recording)
};

/*
 * Room exit types
 */
enum class TUIExitRoomType {
    kNormal             = 0, // 正常退出 (Normal exit)
    kKickOff            = 1, // 被踢出房间 (Removed from the room)
    kRoomDestoryed      = 2, // 房间销毁 (Room termination)
    kKickOffLine        = 3, // 被挤下线 (Kicked offline)
    kNetworkAnomaly     = 4, // 网络异常 (Network exception)
    kTransferRoom       = 5, // 转让房间 (Room transfer)
    kOtherPlatformLogin = 6, // 其他端登录 (Login on another client)
    kUserSigExpired     = 7, // 用户凭证过期 (user signature expired)
};

enum class TUIMutedReason {
    kInitMute,
    kMutedByAdmin,
    kAdminMuteAllUsers
};

enum class TXSignalingStatus {
    kReceived,
    kCancel,
    kTimeOut,
};

/**
 * Stream pull type
 */
enum class TUIStreamType {
    kStreamTypeCamera   = 0,    // 主画面视频流 (Primary video stream)
    kStreamTypeScreen   = 1,    // 屏幕分享流 (Screen sharing stream)
};

/**
 * 画质偏好
 * 当遇到弱网络环境时，您期望“保清晰”或“保流畅”：
 *
 * - Smooth：弱网下保流畅。
 * - Clear：弱网下保清晰。
 */

 /**
  * Image quality preference
  * Whether to prioritize clarity or smoothness under poor network conditions
  *
  * - Smooth: Prioritize smoothness
  * - Clear: Prioritize clarity
  */
enum class TUIVideoQosPreference {
    kSmooth = 1,    ///< 弱网下保流畅 (Prioritize smoothness on a weak network)
    kClear = 2,     ///< 弱网下保清晰 (Prioritize clarity on a weak network)
};

/**
 * Beauty filter settings
 */
struct TUIBeautyConfig {
    bool open_beauty;
    liteav::TRTCBeautyStyle beauty_style;
    uint32_t beauty_value;
    uint32_t white_value;
    uint32_t ruddiness_value;

    TUIBeautyConfig()
        : open_beauty(true)
        , beauty_style(liteav::TRTCBeautyStyle::TRTCBeautyStyleSmooth)
        , beauty_value(5) 
        , white_value(5)
        , ruddiness_value(0) {
    }
};


/**
 * User information
 */
struct TUIUserInfo {
    std::string user_id;               // 用户ID (User ID)
    std::string user_name;             // 用户名 (Username)
    std::string avatar_url;            // 用户头像url (User profile photo URL)
    tuikit::TUIRole role;              // 用户角色 (User role)
    bool has_audio_stream;             // 是否有音频流 (Whether there is an audio stream)
    bool has_video_stream;             // 是否有视频流 (Whether there is a video stream)
    bool has_screen_stream;            // 是否有屏幕分享流 (Whether there is a screen sharing stream)
    bool has_subscribed_audio_stream;  // 是否订阅音频流 (Whether the audio stream is subscribed)
    bool has_subscribed_video_stream;  // 是否订阅视频流 (Whether the video stream is subscribed)
    bool has_subscribed_screen_stream; // 是否订阅屏幕分享流 (Whether the screen sharing stream is subscribed)

    TUIUserInfo()
        : role(tuikit::TUIRole::kGeneralUser)
        , user_id("")
        , user_name("")
        , has_audio_stream(false)
        , has_video_stream(false)
        , has_screen_stream(false)
        , has_subscribed_audio_stream(false)
        , has_subscribed_video_stream(false)
        , has_subscribed_screen_stream(false) {
    }
};

/**
 * Room information
 */
struct TUIRoomInfo {
    std::string room_id;                    // 房间ID (Room ID)
    std::string owner_id;                   // 群拥有者ID (Group owner ID)
    std::string room_name;                  // 房间名 (Room name)
    tuikit::TUISpeechMode mode;             // 发言模式 (Speech mode)
    uint64_t start_time;                    // 开始时间 (Start time)
    int room_member_num;                    // 成员个数 (Number of members)
    bool is_chat_room_muted;                // 聊天室是否可以发消息 (Whether messages can be sent in the chat room)
    bool is_speech_application_forbidden;   // 是否禁止发言 (Whether speech is disabled)
    bool is_all_camera_muted;               // 是否全体禁视频 (Whether the video of all members is disabled)
    bool is_all_microphone_muted;           // 是否全体禁麦克风 (Whether the microphone of all members is disabled)
    bool is_callingroll;                    // 是否正在点名 (Whether a roll call is ongoing)

    TUIRoomInfo()
        : mode(tuikit::TUISpeechMode::kFreeToSpeak)
        , is_chat_room_muted(false)
        , is_speech_application_forbidden(false)
        , is_all_camera_muted(false)
        , is_all_microphone_muted(false)
        , is_callingroll(false)
        , start_time(0) {
    }
};

using RoomEngineSuccessCallback = std::function<void()>;
using RoomEngineErrorCallback = std::function<void(const tuikit::TUIError code, const std::string& message)>;
using RoomEngineRoomInfoCallback = std::function<void(const tuikit::TUIRoomInfo* room_info)>;
using RoomEngineUserListCallback = std::function<void(tuikit::TUIUserListResult* user_list)>;
using RoomEngineShareTargetListCallback = std::function<void(tuikit::TUIList<tuikit::TUIShareTarget>* target)>;
using RoomEngineUserInfoCallback = std::function<void(tuikit::TUIUserInfo* user_info)>;
using RoomEngineSeatListCallback = std::function<void(tuikit::TUIList<tuikit::TUISeatInfo>* list)>;

enum class RequestCallbackType {
    kRequestAccepted = 0,
    kRequestRejected = 1,
    kRequestTimeout = 2,
    kRequestError = 3,
    kRequestCancelled = 4,
};
using RoomEngineRequestCallback = std::function<void(RequestCallbackType type, tuikit::TUIError code, const std::string& request_id,
    const std::string& user_id,
    const std::string& message)>;

#define TOSTRING(str) (nullptr == str ? "" : std::string(str))

/**
 * 信令接口回调定义
 *
 * @param  error_code 错误码。 0为无错误，1为超时，负数为错误码
 * @param  error_message 错误信息描述，可以根据错误描述排查问题
 */

 /**
  * Signaling API callback definitions
  *
  * @param  type Request callback type.
  * @param  error_message Error message, which can be used for troubleshooting
  */
using Callback = std::function<void(RequestCallbackType type, const std::string& error_message)>;
using SuccessCallback = std::function<void()>;
using ErrorCallback = std::function<void(int code, const std::string& message)>;

class TUIRoomEngineCallback : public tuikit::TUICallback {
public:
    TUIRoomEngineCallback() = default;
    ~TUIRoomEngineCallback() override = default;

    void SetCallback(RoomEngineSuccessCallback success_callback,
        RoomEngineErrorCallback error_callback) {
        success_callback_ = success_callback;
        error_callback_ = error_callback;
    }

    void onSuccess() override {
        if (success_callback_ != nullptr) {
            success_callback_();
        }
    }
    void onError(const tuikit::TUIError code, const char* message) override {
        if (error_callback_ != nullptr) {
            error_callback_(code, TOSTRING(message));
        }
    }

private:
    RoomEngineSuccessCallback success_callback_;
    RoomEngineErrorCallback error_callback_;
};

class TUIRoomEngineRoomInfoCallback : public tuikit::TUIValueCallback<tuikit::TUIRoomInfo> {
public:
    TUIRoomEngineRoomInfoCallback() = default;
    ~TUIRoomEngineRoomInfoCallback() override = default;

    void SetCallback(RoomEngineRoomInfoCallback success_callback,
        RoomEngineErrorCallback error_callback) {
        success_callback_ = success_callback;
        error_callback_ = error_callback;
    }
    void onSuccess(tuikit::TUIRoomInfo* value) override {
        if (success_callback_ != nullptr) {
            success_callback_(value);
        }
    }
    void onError(const tuikit::TUIError code, const char* message) override {
        if (error_callback_ != nullptr) {
            error_callback_(code, TOSTRING(message));
        }
    }

private:
    RoomEngineRoomInfoCallback success_callback_;
    RoomEngineErrorCallback error_callback_;
};

class TUIRoomEngineUserInfoCallback : public tuikit::TUIValueCallback<tuikit::TUIUserInfo> {
public:
    TUIRoomEngineUserInfoCallback() = default;
    ~TUIRoomEngineUserInfoCallback() override = default;

    void SetCallback(RoomEngineUserInfoCallback success_callback,
        RoomEngineErrorCallback error_callback) {
        success_callback_ = success_callback;
        error_callback_ = error_callback;
    }
    void onSuccess(tuikit::TUIUserInfo* value) override {
        if (success_callback_ != nullptr) {
            success_callback_(value);
        }
    }
    void onError(const tuikit::TUIError code, const char* message) override {
        if (error_callback_ != nullptr) {
            error_callback_(code, TOSTRING(message));
        }
    }

private:
    RoomEngineUserInfoCallback success_callback_;
    RoomEngineErrorCallback error_callback_;
};

class TUIRoomEngineUserListCallback : public tuikit::TUIValueCallback<tuikit::TUIUserListResult> {
public:
    TUIRoomEngineUserListCallback() = default;
    ~TUIRoomEngineUserListCallback() override = default;

    void SetCallback(RoomEngineUserListCallback success_callback,
        RoomEngineErrorCallback error_callback) {
        success_callback_ = success_callback;
        error_callback_ = error_callback;
    }
    void onSuccess(tuikit::TUIUserListResult* value) override {
        if (success_callback_ != nullptr) {
            success_callback_(value);
        }
    }
    void onError(const tuikit::TUIError code, const char* message) override {
        if (error_callback_ != nullptr) {
            error_callback_(code, TOSTRING(message));
        }
    }

private:
    RoomEngineUserListCallback success_callback_;
    RoomEngineErrorCallback error_callback_;
};


class TUIRoomEngineSeatListCallback : public tuikit::TUIListCallback<tuikit::TUISeatInfo> {
public:
    TUIRoomEngineSeatListCallback() = default;
    ~TUIRoomEngineSeatListCallback() override = default;

    void SetCallback(RoomEngineSeatListCallback success_callback,
        RoomEngineErrorCallback error_callback) {
        success_callback_ = success_callback;
        error_callback_ = error_callback;
    }
    void onSuccess(tuikit::TUIList<tuikit::TUISeatInfo>* list) override {
        if (success_callback_ != nullptr) {
            success_callback_(list);
        }
    }
    void onError(const tuikit::TUIError code, const char* message) override {
        if (error_callback_ != nullptr) {
            error_callback_(code, TOSTRING(message));
        }
    }

private:
    RoomEngineSeatListCallback success_callback_;
    RoomEngineErrorCallback error_callback_;
};


class TUIRoomEngineGetShareTargetListCallback : public tuikit::TUIListCallback<tuikit::TUIShareTarget> {
public:
    TUIRoomEngineGetShareTargetListCallback() = default;
    ~TUIRoomEngineGetShareTargetListCallback() override = default;

    void SetCallback(RoomEngineShareTargetListCallback success_callback,
        RoomEngineErrorCallback error_callback) {
        success_callback_ = success_callback;
        error_callback_ = error_callback;
    }
    void onSuccess(tuikit::TUIList<tuikit::TUIShareTarget>* value) override {
        if (success_callback_ != nullptr) {
            success_callback_(value);
        }
    }
    void onError(const tuikit::TUIError code, const char* message) override {
        if (error_callback_ != nullptr) {
            error_callback_(code, TOSTRING(message));
        }
    }
private:
    RoomEngineShareTargetListCallback success_callback_;
    RoomEngineErrorCallback error_callback_;
};


using OnPlayingCallback = std::function<void(const std::string& user_id)>;
using OnLoadingCallback = std::function<void(const std::string& user_id)>;
using OnPlayErrorCallback = std::function<void(const std::string& user_id, tuikit::TUIError code, const std::string& message)>;
class TUIRoomEnginePlayCallback : public tuikit::TUIPlayCallback {
public:
    TUIRoomEnginePlayCallback() = default;
    ~TUIRoomEnginePlayCallback() override = default;

    void SetCallback(OnPlayingCallback playing,
        OnLoadingCallback loading, OnPlayErrorCallback error) {
        playing_ = playing;
        loading_ = loading;
        error_ = error;
    }

    void onPlaying(const char* userId) override {
        playing_(TOSTRING(userId));
    }
    void onLoading(const char* userId)override {
        loading_(TOSTRING(userId));
    }
    void onError(const char* userId,
        const tuikit::TUIError code,
        const char* message) override {
        error_(TOSTRING(userId), code, TOSTRING(message));
    }
private:
    OnPlayingCallback playing_;
    OnLoadingCallback loading_;
    OnPlayErrorCallback error_;
};

class TUIRoomEngineRequestCallback : public tuikit::TUIRequestCallback {
public:
    TUIRoomEngineRequestCallback() = default;
    ~TUIRoomEngineRequestCallback() override = default;

    void SetCallback(RoomEngineRequestCallback callback) {
        callback_ = callback;
    }

    void onAccepted(const char* requestId, const char* userId) override {
        callback_(RequestCallbackType::kRequestAccepted, tuikit::TUIError::ERR_SUCC, requestId, TOSTRING(userId), "");
    }
    void onRejected(const char* requestId,
        const char* userId,
        const char* message) override {
        callback_(RequestCallbackType::kRequestRejected, tuikit::TUIError::ERR_SUCC, requestId, TOSTRING(userId), TOSTRING(message));
    }
    void onTimeout(const char* requestId, const char* userId) override {
        callback_(RequestCallbackType::kRequestTimeout, tuikit::TUIError::ERR_SUCC, requestId, TOSTRING(userId), "");
    }
    void onError(const char* requestId,
        const char* userId,
        const tuikit::TUIError code,
        const char* message) override {
        callback_(RequestCallbackType::kRequestError, tuikit::TUIError::ERR_FAILED, requestId, TOSTRING(userId), TOSTRING(message));
    }
    void onCancelled(const char* requestId, const char* userId) override {
      callback_(RequestCallbackType::kRequestCancelled,
                tuikit::TUIError::ERR_SUCC, requestId, TOSTRING(userId), "");
    }

private:
    RoomEngineRequestCallback callback_;
};

#endif  //  MODULE_INCLUDE_TUIROOMDEF_H_
