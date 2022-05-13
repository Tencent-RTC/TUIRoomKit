package com.tencent.liteav.tuiroom;

public interface TUIRoomListener {
    /**
     * 创建房间结果回调
     * @param code 0 为创建成功， 其它为失败
     * @param message 结果信息
     */
    void onRoomCreate(int code, String message);

    /**
     * 进入房间结果回调
     * @param code 0 为创建成功， 其它为失败
     * @param message 结果信息
     */
    void onRoomEnter(int code, String message);
}
