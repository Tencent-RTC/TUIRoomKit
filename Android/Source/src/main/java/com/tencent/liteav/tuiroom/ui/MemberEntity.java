package com.tencent.liteav.tuiroom.ui;

import android.text.TextUtils;

import com.tencent.liteav.tuiroom.model.TUIRoomCoreDef;

public class MemberEntity {
    public static final int QUALITY_GOOD   = 3;
    public static final int QUALITY_NORMAL = 2;
    public static final int QUALITY_BAD    = 1;


    private String  userId;
    private String  userName;
    private String  userAvatar;
    private int     quality;
    private int     audioVolume;
    private boolean isShowAudioEvaluation;
    private boolean isShowOutSide;
    private boolean isVideoAvailable;
    //是否打开了屏幕共享
    private boolean isScreenAvailable;
    // 用户是否打开了视频
    private boolean isCameraAvailable;

    // 用户是否打开音频
    private boolean isAudioAvailable;

    //是否在分享屏幕
    private boolean isSharingScreen;

    private RoomVideoView mRoomVideoView;
    private boolean       needFresh;
    //是否在说话
    private boolean       isTalk;

    public boolean isSelf() {
        return isSelf;
    }

    public void setSelf(boolean self) {
        isSelf = self;
    }

    private boolean             isSelf;
    private TUIRoomCoreDef.Role role;


    public boolean isSharingScreen() {
        return isSharingScreen;
    }

    public void setSharingScreen(boolean sharingScreen) {
        isSharingScreen = sharingScreen;
    }

    public TUIRoomCoreDef.Role getRole() {
        return role;
    }

    public void setRole(TUIRoomCoreDef.Role role) {
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

    public RoomVideoView getRoomVideoView() {
        return mRoomVideoView;
    }

    public void setRoomVideoView(RoomVideoView roomVideoView) {
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

    public boolean isScreenAvailable() {
        return isScreenAvailable;
    }

    public void setScreenAvailable(boolean screenAvailable) {
        isScreenAvailable = screenAvailable;
    }

    public boolean isCameraAvailable() {
        return isCameraAvailable;
    }

    public void setCameraAvailable(boolean cameraAvailable) {
        isCameraAvailable = cameraAvailable;
    }
}
