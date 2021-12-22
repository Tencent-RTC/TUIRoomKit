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
using Callback = std::function<void(int error_code, const std::string& error_message)>;

/**
 * 错误码
 */
enum class TUIRoomError {
    kErrorParamInvalid                      = -999,  // 无效参数
    kErrorLoginFailed                       = -1000, // 登录失败
    kErrorLogoutFailed                      = -1001, // 登出失败
    kErrorCreateRoomFailed                  = -1002, // 创建房间失败
    kErrorDestoryRoomFailed                 = -1003, // 销毁房间失败
    kErrorEnterRoomFailed                   = -1004, // 进入房间失败
    kErrorExitRoomFailed                    = -1005, // 退出房间失败
    kErrorKickOffUserFailed                 = -1006, // 踢出用户失败
    kErrorChangeRoomInfoFailed              = -1007, // 修改群信息失败
    kErrorGetRoomInfoFailed                 = -1008, // 获取群信息失败
    kErrorGetRoomMemberFailed               = -1009, // 获取房间成员失败
    kErrorSendChatMessageFailed             = -1010, // 发送消息失败
    kErrorStartCameraFailed                 = -1011, // 开启摄像头失败
    kErrorStartMicrophoneFailed             = -1012, // 开始麦克风失败
    kErrorMuteChatRoomFailed                = -1013, // 聊天室禁言失败
    kErrorChangeSpeechModeFailed            = -1014, // 修改发言模式失败
    kErrorHasBeenRoomMaster                 = -1015, // 已经是该房间的主持人
    kErrorCurrentRoomTypeIncorrect          = -1016, // 当前房间类型不正确
    kErrorCurrentRoomFullComplement         = -1017, // 当前房间已满员
    kErrorForbidSpeechFailed                = -1018, // 禁止发言操作失败
    kErrorMuteAllUsersMicrophoneFailed      = -1019, // 禁止/打开所有人麦克风失败
    kErrorMuteAllUsersCameraFailed          = -1020, // 禁止/打开所有人摄像头失败
    kErrorMicrophoneNotAuthorized           = -1021, // 用户未授权当前应用使用麦克风
    kErrorAnotherUserIsPushingScreenStream  = -1022, // 其他用户正在上行辅路
    kErrorSetSelfProfileFailed              = -1023, // 设置个人信息失败
    kErrorTransferRoomFailed                = -1024, // 转交群失败
    kErrorRollCallFailed                    = -1025, // 主持人点名失败
    kErrorReplyRollCallFailed               = -1026, // 成员回复主持人点名失败
};

/*
 * 退出房间的类型
 */
enum class TUIExitRoomType {
    kNormal             = 0, // 正常退出
    kKickOff            = 1, // 被踢出房间
    kRoomDestoryed      = 2, // 房间销毁
    kKickOffLine        = 3, // 被挤下线
    kNetworkAnomaly     = 4, // 网络异常
    kTransferRoom       = 5, // 转让房间  
    kOtherPlatformLogin = 6, // 其他端登录
};

enum class TXSignalingStatus {
    kReceived,
    kCancel,
    kTimeOut,
};

/**
 * 角色类型
 */
enum class TUIRole {
    kMaster   = 1, // 主持人，具有房间麦控管理能力，聊天能力和音视频能力
    kManager  = 2, // 管理员，不具有音视频能力，具有群管理能力，无转交群能力。
    kAnchor   = 3, // 主播，有聊天能力和音视频能力
    kAudience = 4, // 观众，仅有聊天能力
    kOther    = 5, // 为了兼容无IM能力的老版本，此参数用于识别老版本进房的用户
};

/**
 * 发言模式
 */
enum class TUISpeechMode {
    kFreeSpeech   = 1,     // 自由发言模式，成员进入房间后以主播身份进入TRTC房间
    kApplySpeech  = 2,     // 申请发言模式，成员进入房间后以听众身份进入TRTC房间，申请发言成功后以主播身份进入TRTC房间
};

/**
 * 拉流类型
 */
enum class TUIStreamType {
    kStreamTypeCamera   = 0,    // 主画面视频流
    kStreamTypeScreen   = 1,    // 屏幕分享流
};

/**
 * 画质偏好
 * 当遇到弱网络环境时，您期望“保清晰”或“保流畅”：
 *
 * - Smooth：弱网下保流畅。
 * - Clear：弱网下保清晰。
 */
enum class TUIVideoQosPreference {
    kSmooth = 1,    ///< 弱网下保流畅
    kClear = 2,     ///< 弱网下保清晰
};

/**
 * 美颜设置
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
 * 用户信息
 */
struct TUIUserInfo {
    std::string user_id;               // 用户ID
    std::string user_name;             // 用户名
    std::string avatar_url;            // 用户头像url
    TUIRole role;                      // 用户角色
    bool has_audio_stream;             // 是否有音频流
    bool has_video_stream;             // 是否有视频流
    bool has_screen_stream;            // 是否有屏幕分享流
    bool has_subscribed_audio_stream;  // 是否订阅音频流
    bool has_subscribed_video_stream;  // 是否订阅视频流
    bool has_subscribed_screen_stream; // 是否订阅屏幕分享流

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
 * 房间信息
 */
struct TUIRoomInfo {
    std::string room_id;                    // 房间ID
    std::string owner_id;                   // 群拥有者ID
    std::string room_name;                  // 房间名
    TUISpeechMode mode;                     // 发言模式
    uint64_t start_time;                    // 开始时间
    int room_member_num;                    // 成员个数
    bool is_chat_room_muted;                // 聊天室是否可以发消息
    bool is_speech_application_forbidden;   // 是否禁止发言
    bool is_all_camera_muted;               // 是否全体禁视频
    bool is_all_microphone_muted;           // 是否全体禁麦克风
    bool is_callingroll;                    // 是否正在点名

    TUIRoomInfo()
        : mode(TUISpeechMode::kFreeSpeech)
        , is_chat_room_muted(false)
        , is_speech_application_forbidden(false)
        , is_all_camera_muted(false)
        , is_all_microphone_muted(false)
        , is_callingroll(false) {
    }
};

#endif  //  MODULE_INCLUDE_TUIROOMDEF_H_
