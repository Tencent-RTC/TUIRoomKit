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
    String VALUE_PLATFORM     = "Android";     //当前平台
    String VALUE_BUSINESS_ID  = "TUIRoom";     //TUIRoom场景
    String VALUE_FREE_SPEECH  = "FreeSpeech";  //自由上麦
    String VALUE_APPLY_SPEECH = "ApplySpeech"; //需要申请才能上麦


    // 信令command 1v1
    String CMD_SEND_SPEECH_INVITATION  = "SendSpeechInvitation";  // 主持人邀请观众上麦
    String CMD_SEND_OFF_SPEAKER        = "SendOffSpeaker";        // 主持人邀请观众下麦
    String CMD_SEND_SPEECH_APPLICATION = "SendSpeechApplication"; // 观众申请上麦
    String CMD_MUTE_USER_MICROPHONE    = "MuteUserMicrophone";    // 主持人禁用观众麦克风
    String CMD_MUTE_USER_CAMERA        = "MuteUserCamera";        // 主持人禁用观众摄像头
    String CMD_REPLAY_CALLING_ROLL     = "ReplyCallingRoll";      // 观众回复点名（签到）
    String CMD_KICK_OFF_USER           = "KickOffUser";           // 主持人踢人出房间

    //信令command 1vn
    String CMD_SEND_OFF_ALL_SPEAKERS = "SendOffAllSpeakers";    // 邀请全体上麦成员停止发言

    //群简介
    String KEY_SPEECH_MODE                     = "speechMode";
    String KEY_IS_CHAT_ROOM_MUTED              = "isChatRoomMuted";
    String KEY_IS_SPEECH_APPLICATION_FORBIDDEN = "isSpeechApplicationForbidden";
    String KEY_IS_ALL_CAMERA_MUTED             = "isAllCameraMuted";
    String KEY_IS_ALL_MIC_MUTED                = "isAllMicMuted";
    String KEY_IS_CALLING_ROLL                 = "isCallingRoll";
    String KEY_START_TIME                      = "startTime";
}
