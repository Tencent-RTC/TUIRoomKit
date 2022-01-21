//
//  TUIRoomIMProtocol.m
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/10.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "TUIRoomIMProtocol.h"
#import "MJExtension.h"

@implementation TUIRoomIMProtocol

+ (NSMutableDictionary *)getMsgDict {
    NSMutableDictionary *result = [[NSMutableDictionary alloc] initWithCapacity:4];
    result[TUIROOM_SIGNALING_KEY_VERSION] = TUIROOM_DATA_VERSION;
    result[TUIROOM_SIGNALING_KEY_PLATFORM] = TUIROOM_DATA_PLATFORM;
    result[TUIROOM_SIGNALING_KEY_BUSINESS_ID] = TUIROOM_DATA_BUSINESS_ID;
    return result;
}

#pragma mark 1->1

//主持人邀请观众发言
//{
//"cmd": "SendSpeechInvitation",
//"room_id": "Room_123456",
//"receiver_id":"test_user_id"
//}
+ (NSMutableDictionary *)inviteSpeaker:(NSString *)roomId
                            receiverId:(NSString *)receiverId {
    NSMutableDictionary *msgDict = [self getMsgDict];
    NSMutableDictionary *data = [[NSMutableDictionary alloc] initWithCapacity:3];
    msgDict[TUIROOM_SIGNALING_KEY_DATA] = data;
    if (roomId.length && receiverId.length) {
        data[TUIROOM_SIGNALING_KEY_CMD] = TUIROOM_SIGNALING_KEY_CMD_INVITE_SPEAKER;
        data[TUIROOM_SIGNALING_KEY_ROOM_ID] = roomId;
        data[TUIROOM_SIGNALING_KEY_RECEIVER_ID] = receiverId;
    }
    return msgDict;
}

//主持人邀请观众下台
//{
//"cmd": "SendOffSpeaker",
//"room_id": "Room_123456",
//"receiver_id":"test_user_id"
//}
+ (NSMutableDictionary *)sendOffSpeaker:(NSString *)roomId
                             receiverId:(NSString *)receiverId {
    NSMutableDictionary *msgDict = [self getMsgDict];
    NSMutableDictionary *data = [[NSMutableDictionary alloc] initWithCapacity:3];
    msgDict[TUIROOM_SIGNALING_KEY_DATA] = data;
    if (roomId.length && receiverId.length) {
        data[TUIROOM_SIGNALING_KEY_CMD] = TUIROOM_SIGNALING_KEY_CMD_SEND_OFF_SPEAKER;
        data[TUIROOM_SIGNALING_KEY_ROOM_ID] = roomId;
        data[TUIROOM_SIGNALING_KEY_RECEIVER_ID] = receiverId;
    }
    return msgDict;
}

//观众申请发言
//{
//"cmd": "SendSpeechApplication",
//"room_id": "Room_123456",
//"sender_id":"test_user_id"
//}
+ (NSMutableDictionary *)applyForSpeech:(NSString *)roomId
                             receiverId:(NSString *)receiverId {
    NSMutableDictionary *msgDict = [self getMsgDict];
    NSMutableDictionary *data = [[NSMutableDictionary alloc] initWithCapacity:3];
    msgDict[TUIROOM_SIGNALING_KEY_DATA] = data;
    if (roomId.length && receiverId.length) {
        data[TUIROOM_SIGNALING_KEY_CMD] = TUIROOM_SIGNALING_KEY_CMD_APPLY_FOR_SPEECH;
        data[TUIROOM_SIGNALING_KEY_ROOM_ID] = roomId;
        data[TUIROOM_SIGNALING_KEY_RECEIVER_ID] = receiverId;
    }
    return msgDict;
}

//主持人禁用观众麦克风，不可拒绝，只能接受
//{
//"cmd": "MuteUserMicrophone",
//"room_id": "Room_123456",
//"receiver_id":"test_user_id",
//"mute": true/false
//}
+ (NSMutableDictionary *)muteMicrophone:(NSString *)roomId
                      receiverId:(NSString *)receiverId
                            mute:(Boolean)mute {
    NSMutableDictionary *msgDict = [self getMsgDict];
    NSMutableDictionary *data = [[NSMutableDictionary alloc] initWithCapacity:3];
    msgDict[TUIROOM_SIGNALING_KEY_DATA] = data;
    if (roomId.length && receiverId.length) {
        data[TUIROOM_SIGNALING_KEY_CMD] = TUIROOM_SIGNALING_KEY_CMD_MUTE_MICROPHONE;
        data[TUIROOM_SIGNALING_KEY_ROOM_ID] = roomId;
        data[TUIROOM_SIGNALING_KEY_RECEIVER_ID] = receiverId;
        data[TUIROOM_SIGNALING_KEY_MUTE] = [NSNumber numberWithBool:mute];
    }
    return msgDict;
}

//主持人禁用观众摄像头，不可拒绝，只能接受
//{
//"cmd": "MuteUserCamera",
//"room_id": "Room_123456",
//"receiver_id":"test_user_id",
//"mute": true/false
//}
+ (NSMutableDictionary *)muteCamera:(NSString *)roomId
                         receiverId:(NSString *)receiverId
                               mute:(Boolean)mute {
    NSMutableDictionary *msgDict = [self getMsgDict];
    NSMutableDictionary *data = [[NSMutableDictionary alloc] initWithCapacity:3];
    msgDict[TUIROOM_SIGNALING_KEY_DATA] = data;
    if (roomId.length && receiverId.length) {
        data[TUIROOM_SIGNALING_KEY_CMD] = TUIROOM_SIGNALING_KEY_CMD_MUTE_CAMERA;
        data[TUIROOM_SIGNALING_KEY_ROOM_ID] = roomId;
        data[TUIROOM_SIGNALING_KEY_RECEIVER_ID] = receiverId;
        data[TUIROOM_SIGNALING_KEY_MUTE] = [NSNumber numberWithBool:mute];
    }
    return msgDict;
}

//观众回复点名（签到）
//{
//"cmd": "ReplyCallingRoll",
//"room_id": "Room_123456",
//"sender_id":"test_user_id",
//}
+ (NSMutableDictionary *)replyCallingRoll:(NSString *)roomId
                                senderId:(NSString *)senderId {
    NSMutableDictionary *msgDict = [self getMsgDict];
    NSMutableDictionary *data = [[NSMutableDictionary alloc] initWithCapacity:3];
    msgDict[TUIROOM_SIGNALING_KEY_DATA] = data;
    if (roomId.length && senderId.length) {
        data[TUIROOM_SIGNALING_KEY_CMD] = TUIROOM_SIGNALING_KEY_CMD_REPLY_CALLING_ROLL;
        data[TUIROOM_SIGNALING_KEY_ROOM_ID] = roomId;
        data[TUIROOM_SIGNALING_KEY_SENDER_ID] = senderId;
    }
    return msgDict;
}

//主持人踢人出房间，不可拒绝，只能接受
//{
//"cmd": "KickOffUser",
//"room_id": "Room_123456",
//"receiver_id":"test_user_id",
//}
+ (NSMutableDictionary *)kickOffUser:(NSString *)roomId
                          receiverId:(NSString *)receiverId {
    NSMutableDictionary *msgDict = [self getMsgDict];
    NSMutableDictionary *data = [[NSMutableDictionary alloc] initWithCapacity:3];
    msgDict[TUIROOM_SIGNALING_KEY_DATA] = data;
    if (roomId.length && receiverId.length) {
        data[TUIROOM_SIGNALING_KEY_CMD] = TUIROOM_SIGNALING_KEY_CMD_KICK_OFF_USER;
        data[TUIROOM_SIGNALING_KEY_ROOM_ID] = roomId;
        data[TUIROOM_SIGNALING_KEY_RECEIVER_ID] = receiverId;
    }
    return msgDict;
}

#pragma mark 1->n

//邀请全体麦上成员下麦，麦上所有成员下麦，不可拒绝，只能接受
//{
//"cmd": "SendOffAllSpeakers",
//"room_id": "Room_123456",
//}
+ (NSMutableDictionary *)sendOffAllSpeaker:(NSString *)roomId {
    NSMutableDictionary *msgDict = [self getMsgDict];
    NSMutableDictionary *data = [[NSMutableDictionary alloc] initWithCapacity:3];
    msgDict[TUIROOM_SIGNALING_KEY_DATA] = data;
    if (roomId.length) {
        data[TUIROOM_SIGNALING_KEY_CMD] = TUIROOM_SIGNALING_KEY_CMD_SEND_OFF_ALL_SPEAKER;
        data[TUIROOM_SIGNALING_KEY_ROOM_ID] = roomId;
    }
    return msgDict;
}

@end
