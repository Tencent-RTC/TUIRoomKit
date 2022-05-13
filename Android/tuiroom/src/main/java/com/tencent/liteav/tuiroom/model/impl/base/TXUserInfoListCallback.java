package com.tencent.liteav.tuiroom.model.impl.base;

import java.util.List;

public interface TXUserInfoListCallback {
    void onCallback(int code, String msg, List<TXUserInfo> userInfoList);
}
