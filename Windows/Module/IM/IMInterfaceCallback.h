// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_IM_IMINTERFACECALLBACK_H_
#define MODULE_IM_IMINTERFACECALLBACK_H_
#include <string>
#include "../CommonDef.h"
#include "V2TIMCallback.h"
#include "TUIRoomDef.h"
#include "IMCore.h"

class IMInterfaceCallback : public V2TIMCallback {
public:
    IMInterfaceCallback(CallBackType type, IMCore* im_core, Callback callback);
    virtual ~IMInterfaceCallback() {}

    void OnSuccess() override;
    void OnError(int error_code, const V2TIMString& error_message) override;

protected:
    CallBackType type_;
    IMCore* im_core_ = nullptr;
    Callback callback_ = nullptr;
};

template <class T>
class IMValueInterfaceCallback : public V2TIMValueCallback<T> {
public:
    IMValueInterfaceCallback(std::string tag, CallBackType type, IMCore* im_core)
        : V2TIMValueCallback<T>()
        , tag_(tag)
        , type_(type)
        , im_core_(im_core) {
    }
    virtual ~IMValueInterfaceCallback() {}

    void OnSuccess(const T& value) override {
        if (im_core_ != nullptr) {
            im_core_->OnIMInterfaceCallback(type_, 0, tag_, value);
        }
        delete this;
    }
    void OnError(int error_code, const V2TIMString& error_message) override {
        if (im_core_ != nullptr) {
            im_core_->OnIMInterfaceCallback(type_, error_code, error_message.CString());
        }
        delete this;
    }

private:
    CallBackType type_;
    IMCore* im_core_ = nullptr;
    std::string tag_;
};

template <class T>
class IMSendMessageCallback : public V2TIMSendCallback {
public:
    IMSendMessageCallback(std::string tag, CallBackType type, IMCore* im_core)
        : tag_(tag)
        , type_(type)
        , im_core_(im_core) {
    }
    ~IMSendMessageCallback() override {}

    void OnSuccess(const T& value) override  {
        if (im_core_ != nullptr) {
            im_core_->OnIMInterfaceCallback(type_, 0, tag_, value);
        }
        delete this;
    };
    void OnError(int error_code, const V2TIMString &error_message) override {
        if (im_core_ != nullptr) {
            im_core_->OnIMInterfaceCallback(type_, error_code, error_message.CString());
        }
        delete this;
    }
    void OnProgress(uint32_t progress) override {}
private:
    CallBackType type_;
    IMCore* im_core_ = nullptr;
    std::string tag_;
};
#endif  //  MODULE_IM_IMINTERFACECALLBACK_H_
