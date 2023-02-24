package com.tencent.cloud.tuikit.roomkit.model.entity;


public class RoomInfo {
    public String  name;
    public String  owner;
    public String  roomId;
    public boolean isOpenCamera;
    public boolean isUseSpeaker;
    public boolean isOpenMicrophone;
    public boolean enableVideo       = true;
    public boolean enableAudio       = true;
    public boolean enableMessage     = true;
    public boolean enableSeatControl = false;

    @Override
    public String toString() {
        return "RoomInfo{"
                + "name='" + name + '\''
                + ", owner='" + owner + '\''
                + ", roomId='" + roomId + '\''
                + ", isOpenCamera=" + isOpenCamera
                + ", isOpenMicrophone=" + isOpenMicrophone
                + ", isUseSpeaker=" + isUseSpeaker
                + ", enableVideo=" + enableVideo
                + ", enableAudio=" + enableAudio
                + ", enableMessage=" + enableMessage
                + ", enableSeatControl=" + enableSeatControl
                + '}';
    }
}
