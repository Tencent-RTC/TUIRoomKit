package com.tencent.liteav.tuiroom;

import android.content.Context;

import com.tencent.liteav.tuiroom.model.TUIRoomCoreDef;

public abstract class TUIRoom {
    /**
     * 获取 TUIRoom 单例对象
     *
     * @return 返回 TUIRoom 单例对象
     */
    public static TUIRoom sharedInstance(Context context) {
        return TUIRoomImpl.sharedInstance(context);
    }

    /**
     * 创建房间
     *
     * @param roomId           字符串房间id
     * @param speechMode       发言模式：自由发言，申请发言
     * @param isOpenCamera     是否打开摄像头
     * @param isOpenMicrophone 是否打开麦克风
     */
    public abstract void createRoom(int roomId, TUIRoomCoreDef.SpeechMode speechMode, boolean isOpenCamera,
                                    boolean isOpenMicrophone);

    /**
     * 进入已创建的房间
     *
     * @param roomId           字符串房间id
     * @param isOpenCamera     是否打开摄像头
     * @param isOpenMicrophone 是否打开麦克风
     */
    public abstract void enterRoom(int roomId, boolean isOpenCamera, boolean isOpenMicrophone);

    /**
     * @param listener 事件监听
     */
    public abstract void setListener(TUIRoomListener listener);
}
