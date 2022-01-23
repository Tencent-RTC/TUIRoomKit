package com.tencent.liteav.tuiroom.model;

public class TUIRoomCoreCallback {
    public interface ActionCallback {
        void onCallback(int code, String msg);
    }

    public interface InvitationCallback {
        void onInviteeAccepted();

        void onInviteeRejected();

        void onInvitationCancelled();

        void onInvitationTimeout();

        void onError(int code, String msg);
    }

    public interface UserInfoCallback {
        void onCallback(int code, String msg, TUIRoomCoreDef.UserInfo userInfo);
    }
}
