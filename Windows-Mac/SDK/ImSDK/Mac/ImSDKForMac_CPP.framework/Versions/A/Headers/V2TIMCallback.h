// Copyright (c) 2021 Tencent. All rights reserved.

/////////////////////////////////////////////////////////////////////////////////
//
//                          IMSDK API 回调类
//
/////////////////////////////////////////////////////////////////////////////////

#ifndef __V2TIM_CALLBACK_H__
#define __V2TIM_CALLBACK_H__

#include "V2TIMDefine.h"
#include "V2TIMString.h"
#include "V2TIMMessage.h"

/////////////////////////////////////////////////////////////////////////////////
//
//                         回调基类
//
/////////////////////////////////////////////////////////////////////////////////

class TIM_API V2TIMBaseCallback {
public:
    V2TIMBaseCallback();
    virtual ~V2TIMBaseCallback();
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         普通回调类
//
/////////////////////////////////////////////////////////////////////////////////

class V2TIMCallback : public V2TIMBaseCallback {
public:
    ~V2TIMCallback() override {}

    /**
     * 成功时回调，不带参数
     */
    virtual void OnSuccess() = 0;

    /**
     * 出错时回调
     *
     * @param error_code 错误码，详细描述请参见错误码表
     * @param error_message 错误描述
     */
    virtual void OnError(int error_code, const V2TIMString &error_message) = 0;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         模版回调类
//
/////////////////////////////////////////////////////////////////////////////////

template <class T>
class V2TIMValueCallback : public V2TIMBaseCallback {
public:
    ~V2TIMValueCallback() override {}

    /**
     * 成功时回调，带上 T 类型的参数
     */
    virtual void OnSuccess(const T &value) = 0;

        /**
     * 出错时回调
     *
     * @param error_code 错误码，详细描述请参见错误码表
     * @param error_message 错误描述
     */
    virtual void OnError(int error_code, const V2TIMString &error_message) = 0;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         下载回调类 - 继承自 V2TIMCallback 类
//
/////////////////////////////////////////////////////////////////////////////////

class V2TIMDownloadCallback : public V2TIMCallback {
public:
    ~V2TIMDownloadCallback() override {}

    /**
     * 文件下载进度回调
     * 
     * @note 在下载结束时，触发 OnSuccess 或者 OnError 函数
     */
    virtual void OnDownLoadProgress(uint64_t currentSize, uint64_t totalSize) = 0;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         发送消息的回调类
//
/////////////////////////////////////////////////////////////////////////////////

class V2TIMSendCallback : public V2TIMValueCallback<V2TIMMessage> {
public:
    ~V2TIMSendCallback() override {}

    /**
     * 文件上传进度回调，取值 0 -100
     * 
     * @note 在发送结束时，触发 OnSuccess 或者 OnError 函数
     */
    virtual void OnProgress(uint32_t progress) = 0;
};



#endif /* __V2TIM_CALLBACK_H__ */
