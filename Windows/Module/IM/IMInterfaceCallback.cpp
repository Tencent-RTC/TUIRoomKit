// Copyright (c) 2021 Tencent. All rights reserved.
#include "IMInterfaceCallback.h"
#include "IMCore.h"

IMInterfaceCallback::IMInterfaceCallback(CallBackType type, IMCore* im_core, Callback callback)
    : type_(type)
    , im_core_(im_core)
    , callback_(callback) {
}

void IMInterfaceCallback::OnSuccess() {
    if (im_core_ != nullptr) {
        im_core_->OnIMInterfaceCallback(type_, 0);
    }
    if (callback_) {
        callback_(0, "Success");
    }
    delete this;
}
void IMInterfaceCallback::OnError(int error_code, const V2TIMString& error_message) {
    if (im_core_ != nullptr) {
        im_core_->OnIMInterfaceCallback(type_, error_code, error_message.CString());
    }
    if (callback_) {
        callback_(error_code, error_message.CString());
    }
    delete this;
}
