package com.tencent.qcloud.tuikit.tuibarrage.view;


import com.tencent.qcloud.tuikit.tuibarrage.model.TUIBarrageModel;

public interface ITUIBarrageSendView {
    /**
     * 发送弹幕
     *
     * @param model 弹幕信息
     */
    void sendBarrage(TUIBarrageModel model);
}
