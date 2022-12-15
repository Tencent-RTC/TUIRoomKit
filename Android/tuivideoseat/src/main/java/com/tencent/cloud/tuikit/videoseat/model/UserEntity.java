package com.tencent.cloud.tuikit.videoseat.model;

import android.text.TextUtils;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.videoseat.ui.view.VideoView;

public class UserEntity {
    public static final int QUALITY_GOOD   = 3;
    public static final int QUALITY_NORMAL = 2;
    public static final int QUALITY_BAD    = 1;

    private int     quality;
    private int     audioVolume;
    private String  userId;
    private String  userName;
    private String  userAvatar;
    private boolean isSelf;
    private boolean isTalk;
    private boolean needFresh;
    private boolean isShowOutSide;
    private boolean isVideoAvailable;
    private boolean isAudioAvailable;
    private boolean isCameraAvailable;
    private boolean isShowAudioEvaluation;
    private boolean isScreenShareAvailable;

    private VideoView          mRoomVideoView;
    private TUIRoomDefine.Role role;

    public boolean isSelf() {
        return isSelf;
    }

    public void setSelf(boolean self) {
        isSelf = self;
    }

    public TUIRoomDefine.Role getRole() {
        return role;
    }

    public void setRole(TUIRoomDefine.Role role) {
        this.role = role;
    }

    public boolean isNeedFresh() {
        return needFresh;
    }

    public void setNeedFresh(boolean needFresh) {
        this.needFresh = needFresh;
    }

    public int getAudioVolume() {
        return audioVolume;
    }

    public void setAudioVolume(int audioVolume) {
        this.audioVolume = audioVolume;
    }

    public boolean isShowOutSide() {
        return isShowOutSide;
    }

    public void setShowOutSide(boolean showOutSide) {
        isShowOutSide = showOutSide;
    }

    public boolean isShowAudioEvaluation() {
        return isShowAudioEvaluation;
    }

    public void setShowAudioEvaluation(boolean showAudioEvaluation) {
        isShowAudioEvaluation = showAudioEvaluation;
    }

    public VideoView getRoomVideoView() {
        return mRoomVideoView;
    }

    public void setRoomVideoView(VideoView roomVideoView) {
        mRoomVideoView = roomVideoView;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return TextUtils.isEmpty(userName) ? userId : userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserAvatar() {
        return userAvatar;
    }

    public void setUserAvatar(String userAvatar) {
        this.userAvatar = userAvatar;
    }

    public int getQuality() {
        return quality;
    }

    public void setQuality(int quality) {
        this.quality = quality;
    }

    public boolean isVideoAvailable() {
        return isVideoAvailable;
    }

    public void setVideoAvailable(boolean videoAvailable) {
        isVideoAvailable = videoAvailable;
    }

    public boolean isAudioAvailable() {
        return isAudioAvailable;
    }

    public void setAudioAvailable(boolean audioAvailable) {
        isAudioAvailable = audioAvailable;
    }

    public void setTalk(boolean talk) {
        isTalk = talk;
    }

    public boolean isTalk() {
        return isTalk;
    }

    public boolean isScreenShareAvailable() {
        return isScreenShareAvailable;
    }

    public void setScreenShareAvailable(boolean available) {
        this.isScreenShareAvailable = available;
    }

    public boolean isCameraAvailable() {
        return isCameraAvailable;
    }

    public void setCameraAvailable(boolean cameraAvailable) {
        isCameraAvailable = cameraAvailable;
    }
}
