package com.tencent.liteav.tuiroom.model.impl.base;

public class GroupNotificationData {
    /**
     * speechMode : FreeSpeech
     * isChatRoomMuted : false
     * isSpeechApplicationForbidden : false
     * isAllCameraMuted : false
     * isAllMicMuted : false
     * isCallingRoll : false
     * startTime : 1637062121090
     */

    private int     version                      = SignallingConstant.VALUE_VERSION;
    private String  speechMode                   = SignallingConstant.VALUE_FREE_SPEECH;
    private Boolean isChatRoomMuted              = false;
    private Boolean isSpeechApplicationForbidden = false;
    private Boolean isAllCameraMuted             = false;
    private Boolean isAllMicMuted                = false;
    private Boolean isCallingRoll                = false;
    private Long    startTime                    = 0L;

    public String getSpeechMode() {
        return speechMode;
    }

    public void setSpeechMode(String speechMode) {
        this.speechMode = speechMode;
    }

    public Boolean isChatRoomMuted() {
        return isChatRoomMuted;
    }

    public void setChatRoomMuted(Boolean isChatRoomMuted) {
        this.isChatRoomMuted = isChatRoomMuted;
    }

    public Boolean isSpeechApplicationForbidden() {
        return isSpeechApplicationForbidden;
    }

    public void setSpeechApplicationForbidden(Boolean isSpeechApplicationForbidden) {
        this.isSpeechApplicationForbidden = isSpeechApplicationForbidden;
    }

    public Boolean isAllCameraMuted() {
        return isAllCameraMuted;
    }

    public void setAllCameraMuted(Boolean isAllCameraMuted) {
        this.isAllCameraMuted = isAllCameraMuted;
    }

    public Boolean isAllMicMuted() {
        return isAllMicMuted;
    }

    public void setAllMicMuted(Boolean isAllMicMuted) {
        this.isAllMicMuted = isAllMicMuted;
    }

    public Boolean isCallingRoll() {
        return isCallingRoll;
    }

    public void setCallingRoll(Boolean isCallingRoll) {
        this.isCallingRoll = isCallingRoll;
    }

    public Long getStartTime() {
        return startTime;
    }

    public void setStartTime(Long startTime) {
        this.startTime = startTime;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    @Override
    public String toString() {
        return "GroupNotificationData{"
                + "version=" + version
                + ", speechMode='" + speechMode + '\''
                + ", isChatRoomMuted=" + isChatRoomMuted
                + ", isSpeechApplicationForbidden=" + isSpeechApplicationForbidden
                + ", isAllCameraMuted=" + isAllCameraMuted
                + ", isAllMicMuted=" + isAllMicMuted
                + ", isCallingRoll=" + isCallingRoll
                + ", startTime=" + startTime
                + '}';
    }
}
