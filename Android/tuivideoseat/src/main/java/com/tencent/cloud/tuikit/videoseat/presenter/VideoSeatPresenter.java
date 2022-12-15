package com.tencent.cloud.tuikit.videoseat.presenter;

import android.content.Context;

import com.tencent.cloud.tuikit.engine.common.TUIVideoView;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.videoseat.model.UserEntity;
import com.tencent.cloud.tuikit.videoseat.model.VideoSeatModel;
import com.tencent.cloud.tuikit.videoseat.model.IVideoSeatModel;
import com.tencent.cloud.tuikit.videoseat.ui.TUIVideoSeatView;

import java.util.List;

public class VideoSeatPresenter implements IVideoSeatPresenter {

    private TUIVideoSeatView mVideoSeatView;
    private IVideoSeatModel  mVideoSeatModel;

    public VideoSeatPresenter(Context context,
                              TUIRoomEngine roomEngine,
                              TUIVideoSeatView videoSeatView,
                              String roomId) {
        mVideoSeatView = videoSeatView;
        mVideoSeatModel = new VideoSeatModel(context, roomId, roomEngine, this);
    }

    @Override
    public void destroy() {
        mVideoSeatModel.destroy();
    }

    @Override
    public boolean isScreenShare() {
        return mVideoSeatView.isShareScreen();
    }

    @Override
    public List<UserEntity> getData() {
        return mVideoSeatModel.getData();
    }

    @Override
    public void notifyItemChanged(int position, String payload) {
        mVideoSeatView.notifyItemChanged(position, payload);
    }

    @Override
    public void notifyItemChanged(int position) {
        mVideoSeatView.notifyItemChanged(position);
    }

    @Override
    public void notifyItemChanged(int position, boolean changeSort) {
        mVideoSeatView.notifyItemChanged(position, changeSort);
    }

    @Override
    public void notifyItemInserted(int position) {
        mVideoSeatView.notifyItemInserted(position);
    }

    @Override
    public void notifyItemRemoved(int position, String userId) {
        mVideoSeatView.notifyItemRemoved(position, userId);
    }

    @Override
    public void notifyScreenShare(boolean available, UserEntity entity) {
        mVideoSeatView.notifyScreenShare(available, entity);
    }

    @Override
    public void startPlayVideo(String userId, TUIVideoView videoView, boolean isSharingScreen) {
        mVideoSeatModel.startPlayVideo(userId, videoView, isSharingScreen);
    }

    @Override
    public void stopPlayVideo(String userId, boolean isSharingScreen, boolean isStreamStop) {
        mVideoSeatModel.stopPlayVideo(userId, isSharingScreen, isStreamStop);
    }
}
