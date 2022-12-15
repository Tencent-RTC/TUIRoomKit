package com.tencent.cloud.tuikit.roomkit.presenter;

import android.view.View;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserEntity;

import java.util.List;

public interface IMeetingViewPresenter {
    void destroyPresenter();

    void enableMicrophone(boolean enable);

    void enableCamera(boolean enable);

    void enableShareButton(boolean enable);

    void enableAudioEvaluation(boolean enable);

    View getVideoSeatView();

    View getBeautyView();

    View getBarrageSendView();

    View getBarrageDisPlayView();

    RoomInfo getRoomInfo();

    List<UserEntity> getUserEntityList();

    void switchCamera();

    void switchAudioRoute(boolean isUseSpeaker);

    void report();

    void addRemoteUser(UserEntity memberEntity);

    void removeRemoteUser(String userId);

    void onCameraMuted(boolean muted);

    void onMicrophoneMuted(boolean muted);

    void disableCameraButton(boolean disable);

    void disableMicrophoneButton(boolean disable);

    void muteUserAudio(String userId, boolean mute);

    void muteUserVideo(String userId, boolean mute);

    void muteAllUserAudio(boolean mute);

    void muteAllUserVideo(boolean mute);

    void disableMuteAllVideo(boolean disable);

    void disableMuteAllAudio(boolean disable);

    void disableMuteAudio(boolean disable);

    void disableMuteVideo(boolean disable);

    void kickUser(String userId, TUIRoomDefine.ActionCallback callback);

    void updateRemoteUserVideo(String userId, boolean available);

    void updateRemoteUserInfo(String userId, String userName, String userAvatar);

    void updateRemoteUserAudio(String userId, boolean available);

    void setRoomOwner(boolean isOwner);

    void setVideoBitrate(int bitrate);

    void setVideoResolution(int resolution);

    void setVideoFps(int fps);

    void setVideoMirror(boolean enable);

    void setAudioCaptureVolume(int volume);

    void setAudioPlayVolume(int volume);

    void startScreenShare();

    void stopScreenShare();

    void startFileDumping(String filePath);

    void stopFileDumping();
}
