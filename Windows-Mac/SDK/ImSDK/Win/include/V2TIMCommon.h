// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef __V2TIM_COMMON_H__
#define __V2TIM_COMMON_H__

#include "V2TIMBuffer.h"
#include "V2TIMDefine.h"
#include "V2TIMString.h"

/////////////////////////////////////////////////////////////////////////////////
//
//                    （一）枚举值定义
//
/////////////////////////////////////////////////////////////////////////////////

/// 登录状态
enum V2TIMLoginStatus {
    /// 已登录
    V2TIM_STATUS_LOGINED = 1,
    /// 登录中
    V2TIM_STATUS_LOGINING = 2,
    /// 无登录
    V2TIM_STATUS_LOGOUT = 3,
};

/// 日志级别
enum V2TIMLogLevel {
    /// 不输出任何 sdk log
    V2TIM_LOG_NONE = 0,
    /// 输出 DEBUG，INFO，WARNING，ERROR 级别的 log
    V2TIM_LOG_DEBUG = 3,
    /// 输出 INFO，WARNING，ERROR 级别的 log
    V2TIM_LOG_INFO = 4,
    /// 输出 WARNING，ERROR 级别的 log
    V2TIM_LOG_WARN = 5,
    /// 输出 ERROR 级别的 log
    V2TIM_LOG_ERROR = 6,
};

/// 消息接收选项
enum V2TIMReceiveMessageOpt {
    ///< 在线正常接收消息，离线时会进行 APNs 推送
    V2TIM_RECEIVE_MESSAGE = 0,
    ///< 不会接收到消息，离线不会有推送通知
    V2TIM_NOT_RECEIVE_MESSAGE = 1,
    ///< 在线正常接收消息，离线不会有推送通知
    V2TIM_RECEIVE_NOT_NOTIFY_MESSAGE = 2,
};

/////////////////////////////////////////////////////////////////////////////////
//
//                      （二）对象类型定义
//
/////////////////////////////////////////////////////////////////////////////////

DEFINE_VECTOR(V2TIMString)
typedef TXV2TIMStringVector V2TIMStringVector;

DEFINE_MAP(V2TIMString, V2TIMBuffer)
typedef TXV2TIMStringToV2TIMBufferMap V2TIMCustomInfo;

DEFINE_MAP(V2TIMString, V2TIMString)
typedef TXV2TIMStringToV2TIMStringMap V2TIMGroupAttributeMap;

class V2TIMLogListener;

struct TIM_API V2TIMBaseObject {
    void *obj_ptr;

    V2TIMBaseObject();
    V2TIMBaseObject(const V2TIMBaseObject &);
    virtual ~V2TIMBaseObject();
};

/// SDK 配置
struct TIM_API V2TIMSDKConfig {
    /// 存储消息、会话、资料等信息的文件路径，Android 平台必须填写，其他平台可选
    V2TIMString initPath;

    /// 存储 log 的文件路径，Android 平台必须填写，其他平台可选
    V2TIMString logPath;

    /// 本地写 log 文件的等级，默认 DEBUG 等级， IMSDK 的日志默认存储于程序文件的运行目录下
    V2TIMLogLevel logLevel;

    /// log 监听回调（回调在主线程，日志回调可能比较频繁，请注意不要在回调里面同步处理太多耗时任务，可能会堵塞主线程）
    V2TIMLogListener *logListener;

    V2TIMSDKConfig();
    V2TIMSDKConfig(const V2TIMSDKConfig &);
    ~V2TIMSDKConfig();
};

#endif /* __V2TIM_COMMON_H__ */
