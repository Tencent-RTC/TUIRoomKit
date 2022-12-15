package com.tencent.cloud.tuikit.videoseat.presenter;

import com.tencent.cloud.tuikit.engine.common.TUIVideoView;
import com.tencent.cloud.tuikit.videoseat.model.UserEntity;

import java.util.List;

public interface IVideoSeatPresenter {
    void destroy();

    boolean isScreenShare();

    List<UserEntity> getData();

    void notifyItemChanged(int position, String payload);

    void notifyItemChanged(int position);

    void notifyItemChanged(int position, boolean changeSort);

    void notifyItemInserted(int position);

    void notifyItemRemoved(int position, String userId);

    void notifyScreenShare(boolean available, UserEntity entity);

    void startPlayVideo(String userId, TUIVideoView videoView, boolean isSharingScreen);

    void stopPlayVideo(String userId, boolean isSharingScreen, boolean isStreamStop);
}
