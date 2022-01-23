package com.tencent.liteav.tuiroom.model;

public class TUIRoomCoreDef {
    /**
     * 发言模式
     */
    public enum SpeechMode {
        FREE_SPEECH, // 自由发言模式，成员进入房间后以主播身份进入TRTC房间
        APPLY_SPEECH // 申请发言模式，成员进入房间后以听众身份进入TRTC房间，申请发言成功后以主播身份进入TRTC房间
    }

    /**
     * 角色类型
     */
    public enum Role {
        MASTER,  // 主持人，具有房间麦控管理能力，聊天能力和音视频能力
        MANAGER, // 管理员，不具有音视频能力，具有群管理能力，无转交群能力。
        ANCHOR,  // 主播，有聊天能力和音视频能力
        AUDIENCE // 观众，仅有聊天能力
    }

    /**
     * 发言模式
     */
    public enum SteamType {
        CAMERA, // 主画面视频流
        SCREE   // 屏幕分享流
    }

    public static class RoomInfo {
        public String     roomId;       //房间ID
        public String     ownerId;     // 群拥有者ID
        public String     roomName;    // 房间名
        public SpeechMode speechMode;  // 发言模式
        public long       startTime;   // 开始时间
        public int        roomMemberNum;     // 成员个数
        public boolean    isChatRoomMuted;   // 聊天室是否可以发消息
        public boolean    isSpeechForbidden; // 是否禁止发言
        public boolean    isAllCameraMuted;  // 是否全体禁视频
        public boolean    isAllMicMuted;     // 是否全体禁麦克风
        public boolean    isCallingRoll;     // 是否正在点名

        @Override
        public String toString() {
            return "RoomInfo{"
                    + "roomId='" + roomId + '\''
                    + ", ownerId='" + ownerId + '\''
                    + ", roomName='" + roomName + '\''
                    + ", speechMode=" + speechMode
                    + ", startTime=" + startTime
                    + ", roomMemberNum=" + roomMemberNum
                    + ", isChatRoomMuted=" + isChatRoomMuted
                    + ", isSpeechForbidden=" + isSpeechForbidden
                    + ", isAllCameraMuted=" + isAllCameraMuted
                    + ", isAllMicMuted=" + isAllMicMuted
                    + ", isCallingRoll=" + isCallingRoll
                    + '}';
        }
    }

    public static class UserInfo {
        public String  userId;               // 用户ID
        public String  userName;             // 用户名
        public String  userAvatar;           // 用户头像url
        public Role    role = Role.AUDIENCE; // 用户角色
        public boolean isVideoAvailable;     // 用户是否打开了视频
        public boolean isAudioAvailable;     // 用户是否打开音频
        public boolean isSharingScreen;      // 是否在分享屏幕

        @Override
        public String toString() {
            return "UserInfo{"
                    + "userId='" + userId
                    + '\'' + ", userName='" + userName + '\''
                    + ", userAvatar='" + userAvatar + '\''
                    + ", role=" + role
                    + ", isVideoAvailable=" + isVideoAvailable
                    + ", isAudioAvailable=" + isAudioAvailable
                    + ", isSharingScreen=" + isSharingScreen
                    + '}';
        }
    }
}
