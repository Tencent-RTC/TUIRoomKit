package com.tencent.qcloud.tuikit.tuibarrage.model;

import com.google.gson.annotations.SerializedName;

public class TUIBarrageJson {

    @SerializedName("data")
    private Data   data;
    @SerializedName("platform")
    private String platform;
    @SerializedName("version")
    private String version;
    @SerializedName("businessID")
    private String businessID;

    public Data getData() {
        return data;
    }

    public void setData(Data data) {
        this.data = data;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getBusinessID() {
        return businessID;
    }

    public void setBusinessID(String businessID) {
        this.businessID = businessID;
    }

    public static class Data {
        @SerializedName("extInfo")
        private ExtInfo extInfo;
        @SerializedName("message")
        private String  message;

        public ExtInfo getExtInfo() {
            return extInfo;
        }

        public void setExtInfo(ExtInfo extInfo) {
            this.extInfo = extInfo;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public static class ExtInfo {
            @SerializedName("userID")
            private String userID;
            @SerializedName("avatarUrl")
            private String avatarUrl;
            @SerializedName("nickName")
            private String nickName;

            public String getUserID() {
                return userID;
            }

            public void setUserID(String userID) {
                this.userID = userID;
            }

            public String getAvatarUrl() {
                return avatarUrl;
            }

            public void setAvatarUrl(String avatarUrl) {
                this.avatarUrl = avatarUrl;
            }

            public String getNickName() {
                return nickName;
            }

            public void setNickName(String nickName) {
                this.nickName = nickName;
            }

            @Override
            public String toString() {
                return "ExtInfo{"
                        + "userID=" + userID
                        + ", avatarUrl=" + avatarUrl
                        + ", nickName=" + nickName
                        + '}';
            }
        }

        @Override
        public String toString() {
            return "Data{"
                    + "extInfo=" + extInfo
                    + ", message=" + message
                    + '}';
        }
    }

    @Override
    public String toString() {
        return "TUIBarrageJson{"
                + "data=" + data
                + ", platform=" + platform
                + ", version=" + version
                + ", businessID=" + businessID
                + '}';
    }
}
