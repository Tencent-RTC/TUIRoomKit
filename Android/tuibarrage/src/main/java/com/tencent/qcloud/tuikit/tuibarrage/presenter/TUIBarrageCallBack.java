package com.tencent.qcloud.tuikit.tuibarrage.presenter;

import com.tencent.qcloud.tuikit.tuibarrage.model.TUIBarrageModel;

public class TUIBarrageCallBack {

    /**
     * 通用回调
     */
    public interface ActionCallback {
        void onCallback(int code, String msg);
    }

    /**
     * 弹幕发送的回调
     */
    public interface BarrageSendCallBack {
        void onSuccess(int code, String msg, TUIBarrageModel model);

        void onFailed(int code, String msg);
    }
}
