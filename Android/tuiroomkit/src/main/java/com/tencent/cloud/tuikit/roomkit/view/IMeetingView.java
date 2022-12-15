package com.tencent.cloud.tuikit.roomkit.view;

import com.tencent.cloud.tuikit.roomkit.model.entity.UserEntity;

public interface IMeetingView {
    void enableCamera(boolean enable);

    void enableShareButton(boolean enable);

    void enableMicrophone(boolean enable);

    void onCameraMuted(boolean muted);

    void onMicrophoneMuted(boolean muted);

    void disableCameraButton(boolean disable);

    void disableMicrophoneButton(boolean disable);

    void setRoomOwner(boolean isOwner);

    void disableMuteAllVideo(boolean disable);

    void disableMuteAllAudio(boolean disable);

    void disableMuteAudio(boolean disable);

    void disableMuteVideo(boolean disable);

    void addRemoteUser(UserEntity memberEntity);

    void removeRemoteUser(String userId);

    void updateRemoteUserVideo(String userId, boolean available);

    void updateRemoteUserInfo(String userId, String userName, String userAvatar);

    void updateRemoteUserAudio(String userId, boolean available);
}
