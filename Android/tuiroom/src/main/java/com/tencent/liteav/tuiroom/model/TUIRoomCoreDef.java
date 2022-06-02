package com.tencent.liteav.tuiroom.model;

public class TUIRoomCoreDef {
    /**
     * Speech mode
     */
    public enum SpeechMode {
        FREE_SPEECH, // Free speech mode: Members enter a TRTC room as an anchor
        APPLY_SPEECH // Mic-on request mode: Members enter a TRTC room as listeners and can become anchors after
        // requesting to speak
    }

    /**
     * Role type
     */
    public enum Role {
        MASTER,  // Host: Has room mic control, chat, and audio/video capabilities
        MANAGER, // Admin: Has audio/video and group management capabilities but has no group ownership transfer
        // capabilities
        ANCHOR,  // Anchor: Has chat and audio/video capabilities
        AUDIENCE // Audience: Has only chat capabilities
    }

    /**
     * Speech mode
     */
    public enum SteamType {
        CAMERA, // Primary video stream
        SCREE   // Screen sharing stream
    }

    public static class RoomInfo {
        public String     roomId;       // Room ID
        public String     ownerId;     // Group owner ID
        public String     roomName;    // Room name
        public SpeechMode speechMode;  // Speech mode
        public long       startTime;   // Start time
        public int        roomMemberNum;     // Number of members
        public boolean    isChatRoomMuted;   // Whether messages can be sent in the chat room
        public boolean    isSpeechForbidden; // Whether speech is disabled
        public boolean    isAllCameraMuted;  // Whether the video of all members is disabled
        public boolean    isAllMicMuted;     // Whether the mic of all members is disabled
        public boolean    isCallingRoll;     // Whether a roll call is ongoing

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
        public String  userId;               // User ID
        public String  userName;             // Username
        public String  userAvatar;           // User profile photo URL
        public Role    role = Role.AUDIENCE; // User role
        public boolean isVideoAvailable;     // Whether the user's video is enabled
        public boolean isAudioAvailable;     // Whether the user's audio is enabled
        public boolean isSharingScreen;      // Whether the screen is being shared

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