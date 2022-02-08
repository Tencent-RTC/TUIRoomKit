// Copyright (c) 2021 Tencent. All rights reserved.
#include <chrono>
#include <algorithm>
#include "IMParser.h"

const static int kProtocolVersion = 1;
std::string IMParser::GenerateCmdJson(Json::Value json_data) {
    // 公共头字段
    /*
    version	业务协议版本号	int
    businessID	业务模块标识	string
    platform	所属软件平台	string
    extraInfo	扩展字段，备用	string
    data	场景业务字段，如下	jsonString
    */
    Json::Value json_common_param;

    json_common_param["version"] = kProtocolVersion;
    json_common_param["businessID"] = "TUIRoom";
#ifdef _WIN32
    json_common_param["platform"] = "windows";
#else
    json_common_param["platform"] = "mac";
#endif
    json_common_param["extraInfo"] = "";
    json_common_param["data"] = json_data;

    return std::move(json_common_param.toStyledString());
}
std::string IMParser::GenerateGroupNotification(bool mute_chat, bool mute_all_camera,\
    bool mute_all_mic, bool forbid_speech, const std::string& speech_mode, bool call_roll) {
    /*
    {
        "speechMode" : "FreeSpeech",            //  发言模式: "ApplySpeech" 和 "FreeSpeech"
        "isChatRoomMuted" : false,              //  是否禁止聊天，用于控制IM聊天室
        "isSpeechApplicationForbidden" : false, //  是否禁止上台，禁止上台后，所有在麦上列表的成员全部下台，并且之后成员不能上台
        "isAllCameraMuted" : false,             //  全员开/关视频，此控制用于自由发言模式
        "isAllMicMuted" : false,                //  全员开/禁麦
        "isCallingRoll": true/false,            //  主持人点名
        "startTime: 1637062121090
    }
    */
    Json::Value json_value_param;
    json_value_param["version"] = kProtocolVersion;
    json_value_param["speechMode"] = speech_mode.c_str();
    json_value_param["isChatRoomMuted"] = mute_chat;
    json_value_param["isSpeechApplicationForbidden"] = forbid_speech;
    json_value_param["isAllCameraMuted"] = mute_all_camera;
    json_value_param["isAllMicMuted"] = mute_all_mic;
    json_value_param["isCallingRoll"] = call_roll;
    // millseconds
    std::chrono::milliseconds ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch());
    // seconds
    // std::time_t current_time = std::time(0);
    json_value_param["startTime"] = ms.count();
    std::string cmd_json = json_value_param.toStyledString();

    return std::move(cmd_json);
}
std::string IMParser::GenerateModifyGroupNotification(const TUIRoomInfo& room_info) {
    Json::Value json_value_param;
    std::string speechMode = (room_info.mode == TUISpeechMode::kFreeSpeech ? "FreeSpeech" : "ApplySpeech");
    json_value_param["version"] = kProtocolVersion;
    json_value_param["speechMode"] = speechMode.c_str();
    json_value_param["isChatRoomMuted"] = room_info.is_chat_room_muted;
    json_value_param["isSpeechApplicationForbidden"] = room_info.is_speech_application_forbidden;
    json_value_param["isAllCameraMuted"] = room_info.is_all_camera_muted;
    json_value_param["isAllMicMuted"] = room_info.is_all_microphone_muted;
    json_value_param["isCallingRoll"] = room_info.is_callingroll;
    json_value_param["startTime"] = room_info.start_time;

    std::string cmd_json = json_value_param.toStyledString();
    
    return std::move(cmd_json);
}

std::string IMParser::GenerateMuteUserMicrophoneJson(const std::string& room_id, const std::string& user_id, bool mute) {
    /*
    {
        "cmd": "MuteUserMicrophone",
        "room_id": "Room_123456",
        "receiver_id":"test_user_id",
        "mute": true/false
    }
    */
    Json::Value json_value_param;
    json_value_param["cmd"] = "MuteUserMicrophone";
    json_value_param["room_id"] = room_id.c_str();
    json_value_param["receiver_id"] = user_id.c_str();
    json_value_param["mute"] = mute;

    std::string cmd_json = GenerateCmdJson(json_value_param);

    return std::move(cmd_json);
}
std::string IMParser::GenerateMuteUserCameraJson(const std::string& room_id, const std::string& user_id, bool mute) {
    /*
    {
        "cmd": "MuteUserCamera",
        "room_id": "Room_123456",
        "receiver_id":"test_user_id",
        "mute": true/false
    }
    */
    Json::Value json_value_param;
    json_value_param["cmd"] = "MuteUserCamera";
    json_value_param["room_id"] = room_id.c_str();
    json_value_param["receiver_id"] = user_id.c_str();
    json_value_param["mute"] = mute;

    std::string cmd_json = GenerateCmdJson(json_value_param);

    return std::move(cmd_json);
}
std::string IMParser::GenerateSendSpeechInvitationJson(const std::string& room_id, const std::string& user_id) {
    /*
    {
        "cmd": "SendSpeechInvitation",
        "room_id": "Room_123456",
        "receiver_id":"test_user_id"
    }
    */
    Json::Value json_value_param;
    json_value_param["cmd"] = "SendSpeechInvitation";
    json_value_param["room_id"] = room_id.c_str();
    json_value_param["receiver_id"] = user_id.c_str();

    std::string cmd_json = GenerateCmdJson(json_value_param);

    return std::move(cmd_json);
}
std::string IMParser::GenerateSendOffSpeakerJson(const std::string& room_id, const std::string& user_id) {
    /*
    {
        "cmd": "SendOffSpeaker",
        "room_id": "Room_123456",
        "receiver_id":"test_user_id"
    }
    */
    Json::Value json_value_param;
    json_value_param["cmd"] = "SendOffSpeaker";
    json_value_param["room_id"] = room_id.c_str();
    json_value_param["receiver_id"] = user_id.c_str();

    std::string cmd_json = GenerateCmdJson(json_value_param);

    return std::move(cmd_json);
}
std::string IMParser::GenerateSendOffAllSpeakerJson(const std::string& room_id, const std::vector<std::string>& user_id_array) {
    /*
    {
        "cmd": "SendOffAllSpeakers",
        "room_id": "Room_123456",
    }
    */
    Json::Value json_value_param;
    json_value_param["cmd"] = "SendOffAllSpeakers";
    json_value_param["room_id"] = room_id.c_str();

    std::string cmd_json = GenerateCmdJson(json_value_param);

    return std::move(cmd_json);
}
std::string IMParser::GenerateSendSpeechApplicationJson(const std::string& room_id, const std::string& user_id) {
    /*
    {
        "cmd": "SendSpeechApplication",
        "room_id": "Room_123456",
        "sender_id":"test_user_id"
    }
    */
    Json::Value json_value_param;
    json_value_param["cmd"] = "SendSpeechApplication";
    json_value_param["room_id"] = room_id.c_str();
    json_value_param["sender_id"] = user_id.c_str();

    std::string cmd_json = GenerateCmdJson(json_value_param);

    return std::move(cmd_json);
}

std::string IMParser::GenerateKickOffUserJson(const std::string& room_id, const std::string& user_id) {
    /*
    {
        "cmd": "KickOffUser",
        "room_id": "Room_123456",
        "receiver_id":"test_user_id"
    }
    */
    Json::Value json_value_param;
    json_value_param["cmd"] = "KickOffUser";
    json_value_param["room_id"] = room_id.c_str();
    json_value_param["receiver_id"] = user_id.c_str();

    std::string cmd_json = GenerateCmdJson(json_value_param);

    return std::move(cmd_json);
}
std::string IMParser::GenerateReplyCallingRollJson(const std::string& room_id, const std::string& sender_id) {
    /*
    {
        "cmd": "ReplyCallingRoll",
        "room_id": "Room_123456",
        "sender_id":"test_user_id",
    }
    */
    Json::Value json_value_param;
    json_value_param["cmd"] = "ReplyCallingRoll";
    json_value_param["room_id"] = room_id.c_str();
    json_value_param["sender_id"] = sender_id.c_str();

    std::string cmd_json = GenerateCmdJson(json_value_param);

    return std::move(cmd_json);
}

bool IMParser::ParserNotificationToMuteAllCamera(const std::string& notification) {
    /*
    {
        "version" : 1                      //  协议版本号
        "speechMode" : "FreeSpeech",       //  发言模式: "ApplySpeech" 和 "FreeSpeech"
        "isChatRoomMuted" : false,           //  是否禁止聊天，用于控制IM聊天室
        "isSpeechApplicationForbidden" : false, //  是否禁止上台，禁止上台后，所有在麦上列表的成员全部下台，并且之后成员不能上台
        "isAllCameraMuted" : false,        //  全员开/关视频，此控制用于自由发言模式
        "isAllMicMuted" : false,           //  全员开/禁麦
        "isCallingRoll": true/false,       //  主持人点名
        "startTime: 1637062121090
    }
    */
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(notification, json_value)) {
        return false;
    }
    bool uute_all_camera = json_value["isAllCameraMuted"].asBool();

    return uute_all_camera;
}
bool IMParser::ParserNotificationToSpeechForbidden(const std::string& notification) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(notification, json_value)) {
        return false;
    }
    bool forbidden = json_value["isSpeechApplicationForbidden"].asBool();

    return forbidden;
}
bool IMParser::ParserNotificationToMuteAllMic(const std::string& notification) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(notification, json_value)) {
        return false;
    }
    bool mute_all_mic = json_value["isAllMicMuted"].asBool();

    return mute_all_mic;
}
bool IMParser::ParserNotificationToMuteChat(const std::string& notification) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(notification, json_value)) {
        return false;
    }
    bool mute_char_room = json_value["isChatRoomMuted"].asBool();

    return mute_char_room;
}
bool IMParser::ParserNotificationToSpeechMode(const std::string& notification, std::string& speech_mode) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(notification, json_value)) {
        return false;
    }
    speech_mode = json_value["speechMode"].asCString();

    return true;
}
bool IMParser::ParserNotificationToStartTime(const std::string& notification, long long& start_time) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(notification, json_value)) {
        return false;
    }
    start_time = json_value["startTime"].asInt64();

    return true;
}
bool IMParser::ParserNotificationToIsCallingRoll(const std::string& notification) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(notification, json_value)) {
        return false;
    }
    bool is_calling_roll = json_value["isCallingRoll"].asBool();

    return is_calling_roll;
}

bool IMParser::ParserDataToMute(const std::string& data) {
    /*
    {
    "version":1, // 协议版本信息
    "businessID":"RoomApp", // 会议场景
    "platform":"Windows", // platform
    "extraInfo":"", // 扩展字段，暂不使用
    "data":"{
            "cmd":"MuteMic", //  信令协议
            "room_id":"Room_123456",
            "receiver_id":"test_user_id",
            "mute":true
        }"
    }
    */

    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(data, json_value)) {
        return false;
    }

    std::string strdata = json_value["data"].toStyledString();
    Json::Value data_json_value;
    if (!reader.parse(strdata, data_json_value)) {
        return false;
    }

    bool mute_mic = data_json_value["mute"].asBool();
    return mute_mic;
}
bool IMParser::ParserDataCmdToType(const std::string& data, CallBackType& type) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(data, json_value)) {
        return false;
    }

    std::string strdata = json_value["data"].toStyledString();
    Json::Value data_json_value;
    if (!reader.parse(strdata, data_json_value)) {
        return false;
    }

    std::string cmd = data_json_value["cmd"].asString();
    if ("MuteUserMicrophone" == cmd) {
        type = kMuteUserMicrophone;
    } else if ("MuteUserCamera" == cmd) {
        type = kMuteUserCamera;
    } else if ("SendSpeechApplication" == cmd) {
        type = kSendSpeechApplication;
    } else if ("SendSpeechInvitation" == cmd) {
        type = kSendSpeechInvitation;
    } else if ("KickOffUser" == cmd) {
        type = kKickOffUser;
    } else if ("SendOffSpeaker" == cmd) {
        type = kSendOffSpeaker;
    } else if ("SendOffAllSpeakers" == cmd) {
        type = kSendOffAllSpeakers;
    }

    return true;
}
bool IMParser::ParserDataToUserId(const std::string& data, std::string& user_id) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(data, json_value)) {
        return false;
    }

    std::string strdata = json_value["data"].toStyledString();
    Json::Value data_json_value;
    if (!reader.parse(strdata, data_json_value)) {
        return false;
    }

    user_id = data_json_value["receiver_id"].asString();
    return true;
}
bool IMParser::ParserDataToSenderId(const std::string& data, std::string& sender_id) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(data, json_value)) {
        return false;
    }

    std::string strdata = json_value["data"].toStyledString();
    Json::Value data_json_value;
    if (!reader.parse(strdata, data_json_value)) {
        return false;
    }

    sender_id = data_json_value["sender_id"].asString();
    return true;
}
bool IMParser::ParserDataToReveiverId(const std::string& data, std::string& receiver_id) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(data, json_value)) {
        return false;
    }

    std::string strdata = json_value["data"].toStyledString();
    Json::Value data_json_value;
    if (!reader.parse(strdata, data_json_value)) {
        return false;
    }

    receiver_id = data_json_value["receiver_id"].asString();
    return true;
}
bool IMParser::ParserDataToAgree(const std::string& data, bool& agree) {
    Json::Value json_value;
    Json::Reader reader;
    if (!reader.parse(data, json_value)) {
        return false;
    }

    std::string strdata = json_value["data"].toStyledString();
    Json::Value data_json_value;
    if (!reader.parse(strdata, data_json_value)) {
        return false;
    }

    agree = data_json_value["agree"].asBool();
    return true;
}