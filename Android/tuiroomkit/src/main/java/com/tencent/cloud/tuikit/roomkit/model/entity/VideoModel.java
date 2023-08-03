package com.tencent.cloud.tuikit.roomkit.model.entity;

import com.tencent.cloud.tuikit.roomkit.model.RoomConstant;

public class VideoModel {
    public int     fps;
    public int     bitrate;
    public int     resolution;
    public boolean isLocalMirror;
    public boolean isFrontCamera;

    public VideoModel() {
        fps = RoomConstant.DEFAULT_VIDEO_FPS;
        bitrate = RoomConstant.DEFAULT_VIDEO_BITRATE;
        isLocalMirror = RoomConstant.DEFAULT_VIDEO_LOCAL_MIRROR;
        resolution = RoomConstant.DEFAULT_VIDEO_RESOLUTION;
        isFrontCamera = RoomConstant.DEFAULT_CAMERA_FRONT;
    }

}
