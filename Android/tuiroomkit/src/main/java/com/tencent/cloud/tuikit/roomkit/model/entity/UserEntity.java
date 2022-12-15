package com.tencent.cloud.tuikit.roomkit.model.entity;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;

public class UserEntity {
    private String  userId;
    private boolean isMaster;
    private String  userName;
    private String  userAvatar;
    private boolean isVideoAvailable;
    private boolean isAudioAvailable;

    private TUIRoomDefine.Role role;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public boolean isMaster() {
        return isMaster;
    }

    public String getUserName() {
        return userName;
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

    public TUIRoomDefine.Role getRole() {
        return role;
    }

    public void setRole(TUIRoomDefine.Role role) {
        this.role = role;
    }

    @Override
    public String toString() {
        return "UserEntity{"
                + "userId='" + userId + '\''
                + ", isMaster=" + isMaster
                + ", userName='" + userName + '\''
                + ", userAvatar='" + userAvatar + '\''
                + ", isVideoAvailable=" + isVideoAvailable
                + ", isAudioAvailable=" + isAudioAvailable
                + ", role=" + role
                + '}';
    }
}
