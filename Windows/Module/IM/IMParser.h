// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_IM_IMPARSER_H_
#define MODULE_IM_IMPARSER_H_

#include <vector>
#include <string>
#include "json.h"
#include "IMInterfaceCallback.h"
#include "TUIRoomDef.h"

class IMParser{
 private:
    IMParser() = default;
    ~IMParser() = default;
 public:
    static std::string GenerateGroupNotification(bool mute_chat, bool mute_all_camera, \
         bool mute_all_mic, bool forbid_speech,const std::string& speech_mode, bool call_roll);
    static std::string GenerateModifyGroupNotification(const TUIRoomInfo& room_info);
    static std::string GenerateMuteUserMicrophoneJson(const std::string& room_id, const std::string& user_id, bool mute);
    static std::string GenerateMuteUserCameraJson(const std::string& room_id, const std::string& user_id, bool mute);
    static std::string GenerateSendSpeechInvitationJson(const std::string& room_id, const std::string& user_id);
    static std::string GenerateSendOffSpeakerJson(const std::string& room_id, const std::string& user_id);
    static std::string GenerateSendSpeechApplicationJson(const std::string& room_id, const std::string& user_id);
    static std::string GenerateKickOffUserJson(const std::string& room_id, const std::string& user_id);

    static bool ParserNotificationToMuteAllCamera(const std::string& notification);
    static bool ParserNotificationToMuteAllMic(const std::string& notification);
    static bool ParserNotificationToMuteChat(const std::string& notification);
    static bool ParserNotificationToSpeechForbidden(const std::string& notification);
    static bool ParserNotificationToSpeechMode(const std::string& notification, std::string& speech_mode);

    static bool ParserDataToMute(const std::string& data);
    static bool ParserDataToUserId(const std::string& data, std::string& user_id);
    static bool ParserDataToSenderId(const std::string& data, std::string& sender_id);
    static bool ParserDataCmdToType(const std::string& data, CallBackType& type);

private:
    static std::string GenerateCmdJson(Json::Value json_data);
};

#endif  //  MODULE_IM_IMPARSER_H_
