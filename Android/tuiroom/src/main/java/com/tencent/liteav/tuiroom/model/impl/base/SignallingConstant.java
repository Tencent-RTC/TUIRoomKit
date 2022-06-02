package com.tencent.liteav.tuiroom.model.impl.base;

public interface SignallingConstant {
    String KEY_VERSION     = "version";
    String KEY_PLATFORM    = "platform";
    String KEY_BUSINESS_ID = "businessID";
    String KEY_DATA        = "data";
    String KEY_CMD         = "cmd";
    String KEY_ROOM_ID     = "room_id";
    String KEY_SENDER_ID   = "sender_id";
    String KEY_RECEIVER_ID = "receiver_id";
    String KEY_AGREE       = "agree";
    String KEY_MUTE        = "mute";


    int    VALUE_VERSION      = 1;
    String VALUE_PLATFORM     = "Android";
    String VALUE_BUSINESS_ID  = "TUIRoom";
    String VALUE_FREE_SPEECH  = "FreeSpeech";
    String VALUE_APPLY_SPEECH = "ApplySpeech";


    // command 1v1
    String CMD_SEND_SPEECH_INVITATION  = "SendSpeechInvitation";
    String CMD_SEND_OFF_SPEAKER        = "SendOffSpeaker";
    String CMD_SEND_SPEECH_APPLICATION = "SendSpeechApplication";
    String CMD_MUTE_USER_MICROPHONE    = "MuteUserMicrophone";
    String CMD_MUTE_USER_CAMERA        = "MuteUserCamera";
    String CMD_REPLAY_CALLING_ROLL     = "ReplyCallingRoll";
    String CMD_KICK_OFF_USER           = "KickOffUser";

    //command 1vn
    String CMD_SEND_OFF_ALL_SPEAKERS = "SendOffAllSpeakers";

    //群简介
    String KEY_SPEECH_MODE                     = "speechMode";
    String KEY_IS_CHAT_ROOM_MUTED              = "isChatRoomMuted";
    String KEY_IS_SPEECH_APPLICATION_FORBIDDEN = "isSpeechApplicationForbidden";
    String KEY_IS_ALL_CAMERA_MUTED             = "isAllCameraMuted";
    String KEY_IS_ALL_MIC_MUTED                = "isAllMicMuted";
    String KEY_IS_CALLING_ROLL                 = "isCallingRoll";
    String KEY_START_TIME                      = "startTime";
}
