package com.tencent.cloud.tuikit.roomkit.presenter;

import android.content.Context;
import android.view.View;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomObserver;
import com.tencent.cloud.tuikit.roomkit.model.MeetingModel;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserEntity;
import com.tencent.cloud.tuikit.roomkit.view.IMeetingView;

import java.util.List;

public class MeetingViewPresenter extends TUIRoomObserver implements IMeetingViewPresenter {

    private MeetingModel mMeetingModel;
    private IMeetingView mIMeetingView;

    public MeetingViewPresenter(Context context, String roomId, IMeetingView meetingView) {
        mIMeetingView = meetingView;
        mMeetingModel = new MeetingModel(context, this, roomId);
    }

    @Override
    public void destroyPresenter() {
        mMeetingModel.destroy();
    }

    @Override
    public void enableMicrophone(boolean enable) {
        mMeetingModel.enableMicrophone(enable);
    }

    @Override
    public void enableCamera(boolean enable) {
        mMeetingModel.enableCamera(enable);
    }

    @Override
    public void enableShareButton(boolean enable) {
        mIMeetingView.enableShareButton(enable);
    }

    @Override
    public View getVideoSeatView() {
        return mMeetingModel.getVideoSeatView();
    }

    @Override
    public View getBeautyView() {
        return mMeetingModel.getBeautyView();
    }

    @Override
    public View getBarrageSendView() {
        return mMeetingModel.getBarrageSendView();
    }

    @Override
    public View getBarrageDisPlayView() {
        return mMeetingModel.getBarrageDisplayView();
    }

    @Override
    public List<UserEntity> getUserEntityList() {
        return mMeetingModel.getUserEntityList();
    }

    @Override
    public void switchCamera() {
        mMeetingModel.switchCamera();
    }

    @Override
    public void switchAudioRoute(boolean isUseSpeaker) {
        mMeetingModel.setAudioRoute(isUseSpeaker);
    }

    @Override
    public void report() {
        mMeetingModel.report();
    }

    @Override
    public void onCameraMuted(boolean muted) {
        mIMeetingView.onCameraMuted(muted);
    }

    @Override
    public void onMicrophoneMuted(boolean muted) {
        mIMeetingView.onMicrophoneMuted(muted);
    }

    @Override
    public void disableCameraButton(boolean disable) {
        mIMeetingView.disableCameraButton(disable);
    }

    @Override
    public void disableMicrophoneButton(boolean disable) {
        mIMeetingView.disableMicrophoneButton(disable);
    }

    @Override
    public RoomInfo getRoomInfo() {
        return mMeetingModel.getRoomInfo();
    }

    @Override
    public void setRoomOwner(boolean isOwner) {
        mIMeetingView.setRoomOwner(isOwner);
    }

    @Override
    public void muteUserAudio(String userId, boolean mute) {
        if (mute) {
            mMeetingModel.muteUserAudio(userId);
        } else {
            mMeetingModel.unMuteUserAudio(userId);
        }
    }

    @Override
    public void muteUserVideo(String userId, boolean mute) {
        if (mute) {
            mMeetingModel.muteUserVideo(userId);
        } else {
            mMeetingModel.unMuteUserVideo(userId);
        }
    }

    @Override
    public void muteAllUserAudio(boolean mute) {
        if (mute) {
            mMeetingModel.muteAllUserAudio();
        } else {
            mMeetingModel.unMuteAllUserAudio();
        }
    }

    @Override
    public void muteAllUserVideo(boolean mute) {
        if (mute) {
            mMeetingModel.muteAllUserVideo();
        } else {
            mMeetingModel.unMuteAllUserVideo();
        }
    }

    @Override
    public void kickUser(String userId, TUIRoomDefine.ActionCallback callback) {
        mMeetingModel.kickUser(userId, callback);
    }

    @Override
    public void disableMuteAllVideo(boolean disable) {
        mIMeetingView.disableMuteAllVideo(disable);
    }

    @Override
    public void disableMuteAllAudio(boolean disable) {
        mIMeetingView.disableMuteAllAudio(disable);
    }

    @Override
    public void disableMuteAudio(boolean disable) {
        mIMeetingView.disableMuteAudio(disable);
    }

    @Override
    public void disableMuteVideo(boolean disable) {
        mIMeetingView.disableMuteVideo(disable);
    }

    @Override
    public void addRemoteUser(UserEntity memberEntity) {
        mIMeetingView.addRemoteUser(memberEntity);
    }

    @Override
    public void removeRemoteUser(String userId) {
        mIMeetingView.removeRemoteUser(userId);
    }

    @Override
    public void updateRemoteUserVideo(String userId, boolean available) {
        mIMeetingView.updateRemoteUserVideo(userId, available);
    }

    @Override
    public void updateRemoteUserInfo(String userId, String userName, String userAvatar) {
        mIMeetingView.updateRemoteUserInfo(userId, userName, userAvatar);
    }

    @Override
    public void updateRemoteUserAudio(String userId, boolean available) {
        mIMeetingView.updateRemoteUserAudio(userId, available);
    }

    @Override
    public void setVideoBitrate(int bitrate) {
        mMeetingModel.setVideoBitrate(bitrate);
    }

    @Override
    public void setVideoResolution(int resolution) {
        mMeetingModel.setVideoResolution(resolution);
    }

    @Override
    public void setVideoFps(int fps) {
        mMeetingModel.setVideoFps(fps);
    }

    @Override
    public void setVideoMirror(boolean enable) {
        mMeetingModel.setVideoMirror(enable);
    }

    @Override
    public void setAudioCaptureVolume(int volume) {
        mMeetingModel.setAudioCaptureVolume(volume);
    }

    @Override
    public void setAudioPlayVolume(int volume) {
        mMeetingModel.setAudioPlayVolume(volume);
    }

    @Override
    public void enableAudioEvaluation(boolean enable) {
        mMeetingModel.enableAudioEvaluation(enable);
    }

    @Override
    public void startFileDumping(String filePath) {
        mMeetingModel.startFileDumping(filePath);
    }

    @Override
    public void stopFileDumping() {
        mMeetingModel.stopFileDumping();
    }

    @Override
    public void startScreenShare() {
        mMeetingModel.startScreenShare();
    }

    @Override
    public void stopScreenShare() {
        mMeetingModel.stopScreenShare();
    }
}
