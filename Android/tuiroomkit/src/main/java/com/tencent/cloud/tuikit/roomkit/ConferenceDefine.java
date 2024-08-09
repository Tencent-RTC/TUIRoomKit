package com.tencent.cloud.tuikit.roomkit;

import androidx.annotation.NonNull;

import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;

import java.io.Serializable;

public class ConferenceDefine {
    public static final String KEY_START_CONFERENCE_PARAMS = "KEY_START_CONFERENCE_PARAMS";
    public static final String KEY_JOIN_CONFERENCE_PARAMS  = "KEY_JOIN_CONFERENCE_PARAMS";

    public static class StartConferenceParams implements Serializable {
        public final String roomId;

        public boolean isOpenMicrophone = true;
        public boolean isOpenCamera     = false;
        public boolean isOpenSpeaker    = true;

        public boolean isMicrophoneDisableForAllUser = false;
        public boolean isCameraDisableForAllUser     = false;

        public boolean isSeatEnabled = false;
        public String  name          = "";

        public StartConferenceParams(String roomId) {
            this.roomId = roomId;
        }

        @NonNull
        @Override
        public String toString() {
            StringBuilder builder = new StringBuilder();
            builder.append("roomId=").append(roomId);
            builder.append("; isOpenMicrophone=").append(isOpenMicrophone);
            builder.append("; isOpenCamera=").append(isOpenCamera);
            builder.append("; isOpenSpeaker=").append(isOpenSpeaker);
            builder.append("; isMicrophoneDisableForAllUser=").append(isMicrophoneDisableForAllUser);
            builder.append("; isCameraDisableForAllUser=").append(isCameraDisableForAllUser);
            builder.append("; isSeatEnabled=").append(isSeatEnabled);
            builder.append("; name=").append(name);
            return builder.toString();
        }
    }

    public static class JoinConferenceParams implements Serializable {
        public final String roomId;

        public boolean isOpenMicrophone = true;
        public boolean isOpenCamera     = false;
        public boolean isOpenSpeaker    = true;

        public JoinConferenceParams(String roomId) {
            this.roomId = roomId;
        }

        @NonNull
        @Override
        public String toString() {
            StringBuilder builder = new StringBuilder();
            builder.append("roomId=").append(roomId);
            builder.append("; isOpenMicrophone=").append(isOpenMicrophone);
            builder.append("; isOpenCamera=").append(isOpenCamera);
            builder.append("; isOpenSpeaker=").append(isOpenSpeaker);
            return builder.toString();
        }
    }

    public static abstract class ConferenceObserver {
        public void onConferenceStarted(TUIRoomDefine.RoomInfo roomInfo, TUICommonDefine.Error error, String message) {}

        public void onConferenceJoined(TUIRoomDefine.RoomInfo roomInfo, TUICommonDefine.Error error, String message) {}

        public  void onConferenceExisted(String roomId) {}

        public void onConferenceFinished(String roomId) {}
    }
}
