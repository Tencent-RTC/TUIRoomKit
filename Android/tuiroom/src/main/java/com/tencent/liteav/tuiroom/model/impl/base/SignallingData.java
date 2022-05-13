package com.tencent.liteav.tuiroom.model.impl.base;

import com.google.gson.annotations.SerializedName;

public class SignallingData {

    /**
     * version : 1
     * businessID : TUIRoom
     * platform : Android
     * extraInfo : 1
     * data : {}
     */

    private Integer  version;
    private String   platform;
    private String   businessID;
    private DataInfo data;

    public Integer getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getBusinessID() {
        return businessID;
    }

    public void setBusinessID(String businessID) {
        this.businessID = businessID;
    }

    public void setData(DataInfo data) {
        this.data = data;
    }

    public DataInfo getData() {
        return data;
    }

    public static class DataInfo {
        /**
         * cmd : AgreeInvitedToSpeech
         * room_id : Room_123456
         * sender_id : test_user_id
         * agree : true
         */

        private String cmd;

        @SerializedName("room_id")
        private String roomId;

        @SerializedName("sender_id")
        private String senderId;

        @SerializedName("receiver_id")
        private String  receiverId;

        private Boolean agree;

        private Boolean mute;

        public String getCmd() {
            return cmd;
        }

        public void setCmd(String cmd) {
            this.cmd = cmd;
        }

        public String getRoomId() {
            return roomId;
        }

        public void setRoomId(String roomId) {
            this.roomId = roomId;
        }

        public String getSenderId() {
            return senderId;
        }

        public void setSenderId(String senderId) {
            this.senderId = senderId;
        }

        public String getReceiverId() {
            return receiverId;
        }

        public void setReceiverId(String receiverId) {
            this.receiverId = receiverId;
        }

        public Boolean isAgree() {
            return agree;
        }

        public void setAgree(Boolean agree) {
            this.agree = agree;
        }

        public Boolean isMute() {
            return mute;
        }

        public void setMute(Boolean mute) {
            this.mute = mute;
        }
    }
}
