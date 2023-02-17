/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   TUICommonDefine @ TUIKitEngine
 * Function: TUIKitEngine 复用型定义
 */
#ifndef TUICOMMONDEFINE_H_
#define TUICOMMONDEFINE_H_

#include <cstdint>

namespace tuikit {

/**
 * [TUIVideoView] 用于渲染视频画面的渲染控件
 * TUIKitEngine 中有很多需要操控视频画面的接口，这些接口都需要您指定视频渲染控件。
 */
typedef void* TUIVideoView;

/**
 * 1.1 错误码枚举定义
 */
enum class TUIError {

    ///操作成功
    ERR_SUCC = 0,

    ///暂未归类的通用错误
    ERR_FAILED = -1,

    ///调用 API 时，传入的参数不合法
    ERR_INVALID_PARAMETER = -1001,

    /// SDK未初始化
    ERR_SDK_NOT_INITIALIZED = -1002,

    ///无操作权限
    ERR_PERMISSION_DENIED = -1003,

    ///该功能需要开通额外的套餐
    ERR_REQUIRE_PAYMENT = -1004,

    ///打开摄像头失败
    ERR_CAMERA_START_FAILED = -1100,

    ///摄像头未授权
    ERR_CAMERA_NOT_AUTHORIZED = -1101,

    ///摄像头被占用
    ERR_CAMERA_OCCUPY = -1102,

    ///当前无摄像头设备
    ERR_CAMERA_DEVICE_EMPTY = -1103,

    ///麦克风打开失败
    ERR_MICROPHONE_START_FAILED = -1104,

    ///麦克风未授权
    ERR_MICROPHONE_NOT_AUTHORIZED = -1105,

    ///麦克风被占用
    ERR_MICROPHONE_OCCUPY = -1106,

    ///当前无麦克风设备
    ERR_MICROPHONE_DEVICE_EMPTY = -1107,

    ///获取屏幕分享对象失败
    ERR_GET_SCREEN_SHARING_TARGET_FAILED = -1108,

    ///开启屏幕分享失败
    ERR_START_SCREEN_SHARING_FAILED = -1109,

};

/**
 * 1.2 网络质量
 */
enum class TUINetworkQuality {

    ///未定义
    kQualityUnknown = 0,

    ///当前网络非常好
    kQualityExcellent = 1,

    ///当前网络比较好
    kQualityGood = 2,

    ///当前网络一般
    kQualityPoor = 3,

    ///当前网络较差
    kQualityBad = 4,

    ///当前网络很差
    kQualityVeryBad = 5,

    ///当前网络不满足 TRTC 的最低要求
    kQualityDown = 6,

};

/**
 * 1.3 网络质量信息
 */
struct TUINetwork {
    ///用户ID
    const char* userId;

    ///网络质量
    TUINetworkQuality quality;

    ///上行丢包率，单位 (%) 该数值越小越好
    ///如果 upLoss 为0%，则意味着上行链路的网络质量很好，上传到云端的数据包基本不发生丢失
    ///如果upLoss 为 30%，则意味着 SDK 向云端发送的音视频数据包中，会有 30%丢失在传输链路中
    int upLoss;

    ///下行丢包率，单位 (%) 该数值越小越好
    ///如果downLoss 为0%，则意味着下行链路的网络质量很好，从云端接收的数据包基本不发生丢失
    ///如果downLoss 为 30%，则意味着云端向 SDK 传输的音视频数据包中，会有 30%丢失在传输链路中
    int downLoss;

    ///网络延迟，单位 ms
    int delay;

    TUINetwork() : userId(nullptr), quality(TUINetworkQuality::kQualityUnknown), upLoss(0), downLoss(0), delay(0) {
    }
};

/**
 * 1.4 消息
 */
struct TUIMessage {
    ///消息 ID
    const char* messageId;

    ///消息文本
    const char* message;

    ///消息时间
    int64_t timestamp;

    ///消息发送者
    const char* userId;

    ///消息发送者昵称
    const char* userName;

    ///消息发送者头像
    const char* avatarUrl;

    TUIMessage() : messageId(nullptr), message(nullptr), timestamp(0), userId(nullptr), userName(nullptr), avatarUrl(nullptr) {
    }
};

/**
 * 1.5 TUIImageBuffer定义
 */
struct TUIImageBuffer {
    ///图片数据缓存地址
    const char* buffer;

    ///长度
    uint32_t length;

    ///宽度
    uint32_t width;

    ///高度
    uint32_t height;

    TUIImageBuffer() : buffer(nullptr), length(0), width(0), height(0) {
    }
};

};  // namespace tuikit

#endif  // TUICOMMONDEFINE_H_
