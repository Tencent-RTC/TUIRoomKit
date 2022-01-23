package com.tencent.liteav.tuiroom.model.impl.im;

import com.tencent.liteav.tuiroom.model.impl.base.TXUserInfo;

public interface ImServiceListener {
    void onRoomDestroy(String roomId);

    void onRoomReceiveRoomTextMsg(String roomId, String message, TXUserInfo userInfo);

    void onRoomReceiveRoomCustomMsg(String roomId, String data, TXUserInfo userInfo);

    void onMemberEnter(TXUserInfo txUserInfo);

    void onMemberLeave(TXUserInfo txUserInfo);

    void onMicrophoneMuted(boolean muted);

    void onAllMicrophoneMuted(boolean muted);

    void onCameraMuted(boolean muted);

    void onAllCameraMuted(boolean muted);

    void onChatRoomMuted(boolean muted);

    void onCallingRoll(String userId, boolean isStart);

    void onSpeechApplicationForbidden(boolean isForbidden);

    void onReceiveKickedOff(String userId);

    void onReceiveSpeechApplication(String userId);

    void onReceiveSpeechInvitation(String userId);

    void onMemberReplyCallingRoll(String userId);

    void onRoomMasterChanged(String previousUserId, String currentUserId);

    void onReceiveInvitationCancelled(String userId);

    void onSpeechApplicationCancelled(String userId);

    void onOrderedToExitSpeechState(String userId);
}
