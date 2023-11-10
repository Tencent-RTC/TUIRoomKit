/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   TUICommonDefine @ TUIKitEngine
 * Function: TUIKitEngine 复用型定义
 */
#ifndef TUICOMMONDEFINE_H_
#define TUICOMMONDEFINE_H_

#include <cstdint>

namespace tuikit {

typedef void* TUIVideoView;

/**
 * 1.1 错误码枚举定义
 */
enum class TUIError {

    /// 操作成功
    ERR_SUCC = 0,

    /// 暂未归类的通用错误
    ERR_FAILED = -1,

    /// 请求被限频，请稍后重试
    ERR_FREQ_LIMIT = -2,

    /// 重复操作
    ERR_REPEAT_OPERATION = -3,

    /// 未找到SDKAppID，请在腾讯云视立方SDK[控制台](https://console.cloud.tencent.com/vcube/project/manage)确认应用信息。
    ERR_SDKAPPID_NOT_FOUND = -1000,

    /// 调用 API 时，传入的参数不合法，检查入参是否合法
    ERR_INVALID_PARAMETER = -1001,

    /// 未登录,请调用Login接口
    ERR_SDK_NOT_INITIALIZED = -1002,

    /// 获取权限失败，当前未授权音/视频权限，请查看是否开启设备权限。Room场景下请使用以下错误码来处理:
    ///摄像头没有系统授权: ERR_CAMERA_NOT_AUTHORIZED
    ///麦克风没有系统授权: ERR_MICROPHONE_NOT_AUTHORIZED
    ERR_PERMISSION_DENIED = -1003,

    /// 该功能需要开通额外的套餐，请在腾讯云视立方SDK按需开通对应套餐: https://console.cloud.tencent.com/vcube/project/manage
    ERR_REQUIRE_PAYMENT = -1004,

    /// 系统问题，打开摄像头失败。检查摄像头设备是否正常
    ERR_CAMERA_START_FAILED = -1100,

    /// 摄像头没有系统授权, 检查系统授权
    ERR_CAMERA_NOT_AUTHORIZED = -1101,

    /// 摄像头被占用，检查是否有其他进程使用摄像头
    ERR_CAMERA_OCCUPIED = -1102,

    /// 当前无摄像头设备，请插入摄像头设备解决该问题
    ERR_CAMERA_DEVICE_EMPTY = -1103,

    /// 系统问题，打开麦克风失败。检查麦克风设备是否正常
    ERR_MICROPHONE_START_FAILED = -1104,

    /// 麦克风没有系统授权，检查系统授权
    ERR_MICROPHONE_NOT_AUTHORIZED = -1105,

    /// 麦克风被占用
    ERR_MICROPHONE_OCCUPIED = -1106,

    /// 当前无麦克风设备
    ERR_MICROPHONE_DEVICE_EMPTY = -1107,

    /// 获取屏幕分享源（屏幕和窗口）失败，检查屏幕录制权限
    ERR_GET_SCREEN_SHARING_TARGET_FAILED = -1108,

    /// 开启屏幕分享失败，检查房间内是否有人正在屏幕分享
    ERR_START_SCREEN_SHARING_FAILED = -1109,

    /// 进房时房间不存在，或许已被解散
    ERR_ROOM_ID_NOT_EXIST = -2100,

    /// 需要进房后才可使用此功能
    ERR_OPERATION_INVALID_BEFORE_ENTER_ROOM = -2101,

    /// 房主不支持退房操作，Conference(会议)房间类型: 可以先转让房主，再退房。LivingRoom(直播)房间类型: 房主只能解散房间
    ERR_EXIT_NOT_SUPPORTED_FOR_ROOM_OWNER = -2102,

    /// 当前房间类型下不支持该操作
    ERR_OPERATION_NOT_SUPPORTED_IN_CURRENT_ROOM_TYPE = -2103,

    /// 当前发言模式下不支持该操作
    ERR_OPERATION_NOT_SUPPORTED_IN_CURRENT_SPEECH_MODE = -2104,

    /// 创建房间ID 非法，自定义 ID 必须为可打印 ASCII 字符（0x20-0x7e），最长48个字节
    ERR_ROOM_ID_INVALID = -2105,

    /// 房间ID 已被使用，请选择别的房间ID
    ERR_ROOM_ID_OCCUPIED = -2106,

    /// 房间名称非法，名称最长30字节，字符编码必须是 UTF-8 ，如果包含中文
    ERR_ROOM_NAME_INVALID = -2107,

    /// 当前用户已在别的房间内，需要先退房才能加入新的房间:
    ///单个roomEngine实例只支持用户进入一个房间，如果要进入不同的房间请先退房或者使用新的roomEngine实例。
    ERR_ALREADY_IN_OTHER_ROOM = -2108,

    /// 用户不存在
    ERR_USER_NOT_EXIST = -2200,

    /// 用户不在当前房间内
    ERR_USER_NOT_ENTERED = -2201,

    /// 需要房主权限才能操作
    ERR_NEED_OWNER_PERMISSION = -2300,

    /// 需要房主或者管理员权限才能操作
    ERR_NEED_ADMIN_PERMISSION = -2301,

    /// 信令请求无权限，比如取消非自己发起的邀请。
    ERR_REQUEST_NO_PERMISSION = -2310,

    /// 信令请求ID 无效或已经被处理过。
    ERR_REQUEST_ID_INVALID = -2311,

    /// 信令请求重复
    ERR_REQUEST_ID_REPEAT = -2312,

    /// 信令请求冲突
    ERR_REQUEST_ID_CONFLICT = -2313,

    /// 最大麦位超出套餐包数量限制
    ERR_MAX_SEAT_COUNT_LIMIT = -2340,

    /// 当前用户已经在麦位上
    ERR_ALREADY_IN_SEAT = -2341,

    /// 当前麦位已经有人了
    ERR_SEAT_OCCUPIED = -2342,

    /// 当前麦位被锁
    ERR_SEAT_LOCKED = -2343,

    /// 麦位编号不存在
    ERR_SEAT_INDEX_NOT_EXIST = -2344,

    /// 当前用户没有在麦上
    ERR_USER_NOT_IN_SEAT = -2345,

    /// 上麦人数已满
    ERR_ALL_SEAT_OCCUPIED = -2346,

    /// 不支持连麦
    ERR_SEAT_NOT_SUPPORT_LINK_MIC = -2347,

    /// 当前麦位音频被锁
    ERR_OPEN_MICROPHONE_NEED_SEAT_UNLOCK = -2360,

    /// 需要向房主或管理员申请后打开麦克风
    ERR_OPEN_MICROPHONE_NEED_PERMISSION_FROM_ADMIN = -2361,

    /// 当前麦位视频被锁, 需要由房主解锁麦位后，才能打开摄像头
    ERR_OPEN_CAMERA_NEED_SEAT_UNLOCK = -2370,

    /// 需要向房主或管理员申请后打开摄像头
    ERR_OPEN_CAMERA_NEED_PERMISSION_FROM_ADMIN = -2371,

    /// 当前房间已开启全员禁言
    ERR_SEND_MESSAGE_DISABLED_FOR_ALL = -2380,

    /// 当前房间内，你已被已禁言
    ERR_SEND_MESSAGE_DISABLED_FOR_CURRENT = -2381,

};

/**
 * 1.2 网络质量
 */
enum class TUINetworkQuality {

    /// 未定义
    kQualityUnknown = 0,

    /// 当前网络非常好
    kQualityExcellent = 1,

    /// 当前网络比较好
    kQualityGood = 2,

    /// 当前网络一般
    kQualityPoor = 3,

    /// 当前网络较差
    kQualityBad = 4,

    /// 当前网络很差
    kQualityVeryBad = 5,

    /// 当前网络不满足 TRTC 的最低要求
    kQualityDown = 6,

};

/**
 * 1.3 插件类型
 */
enum class TUIExtensionType {

    /// 设备管理插件
    kDeviceManager = 1,

};

/**
 * 1.3 网络质量信息
 */
struct TUINetwork {
    /// 用户ID
    const char* userId;

    /// 网络质量
    TUINetworkQuality quality;

    /// 上行丢包率，单位 (%) 该数值越小越好
    ///如果 upLoss 为 0%，则意味着上行链路的网络质量很好，上传到云端的数据包基本不发生丢失
    ///如果 upLoss 为 30%，则意味着 SDK 向云端发送的音视频数据包中，会有 30%丢失在传输链路中
    int upLoss;

    /// 下行丢包率，单位 (%) 该数值越小越好
    ///如果 downLoss 为 0%，则意味着下行链路的网络质量很好，从云端接收的数据包基本不发生丢失
    ///如果 downLoss 为 30%，则意味着云端向 SDK 传输的音视频数据包中，会有 30%丢失在传输链路中
    int downLoss;

    /// 网络延迟，单位 ms
    int delay;

    TUINetwork() : userId(nullptr), quality(TUINetworkQuality::kQualityUnknown), upLoss(0), downLoss(0), delay(0) {
    }
};

/**
 * 1.4 消息
 */
struct TUIMessage {
    /// 消息 ID
    const char* messageId;

    /// 消息文本
    const char* message;

    /// 消息时间
    int64_t timestamp;

    /// 消息发送者
    const char* userId;

    /// 消息发送者昵称
    const char* userName;

    /// 消息发送者头像
    const char* avatarUrl;

    TUIMessage() : messageId(nullptr), message(nullptr), timestamp(0), userId(nullptr), userName(nullptr), avatarUrl(nullptr) {
    }
};

/**
 * 1.5 TUIImageBuffer定义
 */
struct TUIImageBuffer {
    /// 图片数据缓存地址
    const char* buffer;

    /// 长度
    uint32_t length;

    /// 宽度
    uint32_t width;

    /// 高度
    uint32_t height;

    TUIImageBuffer() : buffer(nullptr), length(0), width(0), height(0) {
    }
};

};  // namespace tuikit

#endif
