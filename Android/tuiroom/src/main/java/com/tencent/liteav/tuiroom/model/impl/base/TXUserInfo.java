package com.tencent.liteav.tuiroom.model.impl.base;

public class TXUserInfo {
    public String  userId;
    public String  userName;
    public String  avatarURL;
    public boolean isOwner;

    @Override
    public String toString() {
        return "TXUserInfo{"
                + "userId='"
                + userId
                + '\''
                + ", userName='"
                + userName
                + '\''
                + ", avatarURL='"
                + avatarURL
                + '\''
                + ", isOwner='"
                + isOwner
                + '\''
                + '}';
    }
}
