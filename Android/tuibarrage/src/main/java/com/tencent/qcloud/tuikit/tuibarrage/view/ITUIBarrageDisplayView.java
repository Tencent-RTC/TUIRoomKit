package com.tencent.qcloud.tuikit.tuibarrage.view;


import com.tencent.qcloud.tuikit.tuibarrage.model.TUIBarrageModel;

public interface ITUIBarrageDisplayView {

    /**
     * 接收弹幕
     *
     * @param model 弹幕信息
     */
    void receiveBarrage(TUIBarrageModel model);
}
