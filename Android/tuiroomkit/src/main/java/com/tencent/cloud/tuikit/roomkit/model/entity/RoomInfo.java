package com.tencent.cloud.tuikit.roomkit.model.entity;


public class RoomInfo {
    public String  name;
    public String  owner;
    public String  roomId;
    public boolean isOpenCamera;
    public boolean isOpenMicrophone;
    public boolean enableVideo   = true;
    public boolean enableAudio   = true;
    public boolean enableMessage = true;

    @Override
    public String toString() {
        return "RoomInfo{"
                + "name='" + name + '\''
                + ", owner='" + owner + '\''
                + ", roomId='" + roomId + '\''
                + ", isOpenCamera=" + isOpenCamera
                + ", isOpenMicrophone=" + isOpenMicrophone
                + ", enableVideo=" + enableVideo
                + ", enableAudio=" + enableAudio
                + ", enableMessage=" + enableMessage
                + '}';
    }
}
