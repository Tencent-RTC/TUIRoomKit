package com.tencent.liteav.tuiroom;

public interface TUIRoomListener {
    /**
     * Callback for room created
     *
     * @param code    The `code` will be 0 if the operation succeeds
     * @param message description of result
     */
    void onRoomCreate(int code, String message);

    /**
     * Callback for room enter
     *
     * @param code    The `code` will be 0 if the operation succeeds
     * @param message description of result
     */
    void onRoomEnter(int code, String message);
}
