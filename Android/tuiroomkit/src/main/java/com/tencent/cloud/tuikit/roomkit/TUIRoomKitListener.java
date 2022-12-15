package com.tencent.cloud.tuikit.roomkit;

public interface TUIRoomKitListener {
    void onRoomEnter(int code, String message);

    void onExitRoom();
}
