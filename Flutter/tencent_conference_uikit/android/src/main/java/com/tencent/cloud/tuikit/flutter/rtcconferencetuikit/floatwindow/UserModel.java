package com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.floatwindow;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;

public class UserModel {
    public String             userId;
    public String             userName;
    public String             userAvatarURL;
    public TUIRoomDefine.Role userRole;
    public boolean            hasAudioStream;
    public boolean            hasVideoStream;
    public boolean            hasScreenStream;
    public int                volume;
}
