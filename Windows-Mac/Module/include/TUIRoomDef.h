// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_INCLUDE_TUIROOMDEF_H_
#define MODULE_INCLUDE_TUIROOMDEF_H_
#include <string>
#include <functional>
#include "TRTCTypeDef.h"

/**
 * 信令接口回调定义
 * 
 * @param  error_code 错误码。 0为无错误，1为超时，负数为错误码
 * @param  error_message 错误信息描述，可以根据错误描述排查问题
 */

 /**
  * Signaling API callback definitions
  *
  * @param  error_code Error code. Valid values: 0: No error; 1: timeout; negative value: Error code
  * @param  error_message Error message, which can be used for troubleshooting
  */
using Callback = std::function<void(int error_code, const std::string& error_message)>;

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
    kErrorKickOffUserFailed                 = -1006, // 踢出用户失败 (Failed to remove a user)
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
};

enum class TXSignalingStatus {
    kReceived,
    kCancel,
    kTimeOut,
};

/**
 * Role type
 */
enum class TUIRole {
    // 主持人，具有房间麦控管理能力，聊天能力和音视频能力。
    // Host: Has room microphone control, chat, and audio/video capabilities.
    kMaster   = 1,

    // 管理员，不具有音视频能力，具有群管理能力，无转交群能力。
    // Admin: Has audio/video and group management capabilities but has no group transfer capabilities.
    kManager  = 2,

    // 主播，有聊天能力和音视频能力
    // Anchor: Has has chat and audio/video capabilities
    kAnchor   = 3,

    // 观众，仅有聊天能力
    // Audience: Has only chat capabilities
    kAudience = 4,

    // 为了兼容无IM能力的老版本，此参数用于识别老版本进房的用户
    // To be compatible with early versions without IM capabilities, this parameter is added to identify users entering the room on an early version
    kOther    = 5,
};

/**
 * Speech mode
 */
enum class TUISpeechMode {
    // 自由发言模式，成员进入房间后以主播身份进入TRTC房间
    // Free speech mode, where members enter a TRTC room as an anchor
    kFreeSpeech   = 1,

    // 申请发言模式，成员进入房间后以听众身份进入TRTC房间，申请发言成功后以主播身份进入TRTC房间
    // Apply speech mode: Users enter a TRTC room as listeners and can become anchors after request for permission to speak
    kApplySpeech  = 2,
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
    TUIRole role;                      // 用户角色 (User role)
    bool has_audio_stream;             // 是否有音频流 (Whether there is an audio stream)
    bool has_video_stream;             // 是否有视频流 (Whether there is a video stream)
    bool has_screen_stream;            // 是否有屏幕分享流 (Whether there is a screen sharing stream)
    bool has_subscribed_audio_stream;  // 是否订阅音频流 (Whether the audio stream is subscribed)
    bool has_subscribed_video_stream;  // 是否订阅视频流 (Whether the video stream is subscribed)
    bool has_subscribed_screen_stream; // 是否订阅屏幕分享流 (Whether the screen sharing stream is subscribed)

    TUIUserInfo()
        : role(TUIRole::kAudience)
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
    TUISpeechMode mode;                     // 发言模式 (Speech mode)
    uint64_t start_time;                    // 开始时间 (Start time)
    int room_member_num;                    // 成员个数 (Number of members)
    bool is_chat_room_muted;                // 聊天室是否可以发消息 (Whether messages can be sent in the chat room)
    bool is_speech_application_forbidden;   // 是否禁止发言 (Whether speech is disabled)
    bool is_all_camera_muted;               // 是否全体禁视频 (Whether the video of all members is disabled)
    bool is_all_microphone_muted;           // 是否全体禁麦克风 (Whether the microphone of all members is disabled)
    bool is_callingroll;                    // 是否正在点名 (Whether a roll call is ongoing)

    TUIRoomInfo()
        : mode(TUISpeechMode::kFreeSpeech)
        , is_chat_room_muted(false)
        , is_speech_application_forbidden(false)
        , is_all_camera_muted(false)
        , is_all_microphone_muted(false)
        , is_callingroll(false)
        , start_time(0) {
    }
};

#endif  //  MODULE_INCLUDE_TUIROOMDEF_H_
