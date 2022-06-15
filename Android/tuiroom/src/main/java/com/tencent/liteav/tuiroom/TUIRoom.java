package com.tencent.liteav.tuiroom;

import android.content.Context;

import com.tencent.liteav.tuiroom.model.TUIRoomCoreDef;

public abstract class TUIRoom {
    /**
     * Get a `TUIRoom` singleton object
     *
     * @return Return the `TUIRoom` singleton object.
     */
    public static TUIRoom sharedInstance(Context context) {
        return TUIRoomImpl.sharedInstance(context);
    }

    /**
     * Create a room
     *
     * @param roomId           Room ID. You need to assign and manage the IDs in a centralized manner
     * @param speechMode       Speech mode. Valid values:
     *                         TUIRoomCoreDef.SpeechMode.FREE_SPEECH: Users can speak freely;
     *                         TUIRoomDef.SpeechMode.APPLY_SPEECH: Users need permission to speak.
     * @param isOpenCamera     whether to open the camera
     * @param isOpenMicrophone whether to open the microphone
     */
    public abstract void createRoom(int roomId, TUIRoomCoreDef.SpeechMode speechMode, boolean isOpenCamera,
                                    boolean isOpenMicrophone);

    /**
     * Enter a room
     *
     * @param roomId           Room ID. You need to assign and manage the IDs in a centralized manner
     * @param isOpenCamera     whether to open the camera
     * @param isOpenMicrophone whether to open the microphone
     */
    public abstract void enterRoom(int roomId, boolean isOpenCamera, boolean isOpenMicrophone);

    /**
     * @param listener Set the event callbacks of the component
     */
    public abstract void setListener(TUIRoomListener listener);
}
