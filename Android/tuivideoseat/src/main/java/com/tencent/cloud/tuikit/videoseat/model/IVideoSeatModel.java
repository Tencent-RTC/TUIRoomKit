package com.tencent.cloud.tuikit.videoseat.model;


import com.tencent.cloud.tuikit.engine.common.TUIVideoView;

import java.util.List;

public interface IVideoSeatModel {
    List<UserEntity> getData();

    void destroy();

    void startPlayVideo(String userId, TUIVideoView videoView, boolean isSharingScreen);

    void stopPlayVideo(String userId, boolean isSharingScreen, boolean isStreamStop);
}
