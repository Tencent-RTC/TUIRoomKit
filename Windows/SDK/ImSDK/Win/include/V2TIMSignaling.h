// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef __V2TIM_SIGNALING_H__
#define __V2TIM_SIGNALING_H__

#include "V2TIMCommon.h"
#include "V2TIMDefine.h"
#include "V2TIMMessage.h"

/////////////////////////////////////////////////////////////////////////////////
//
//                    （一）枚举值定义
//
/////////////////////////////////////////////////////////////////////////////////

// 操作类型
enum V2TIMSignalingActionType {
    // 邀请方发起邀请
    SignalingActionType_Invite = 1,
    // 邀请方取消邀请
    SignalingActionType_Cancel_Invite = 2,
    // 被邀请方接受邀请
    SignalingActionType_Accept_Invite = 3,
    // 被邀请方拒绝邀请
    SignalingActionType_Reject_Invite = 4,
    // 邀请超时
    SignalingActionType_Invite_Timeout = 5,
};

/////////////////////////////////////////////////////////////////////////////////
//
//                     （二）结构体定义
//
/////////////////////////////////////////////////////////////////////////////////

struct TIM_API V2TIMSignalingInfo {
    // 信令ID
    V2TIMString inviteID;
    // 如果是群组信令，groupID 为会话群组ID，否则为空
    V2TIMString groupID;
    // 邀请方的ID
    V2TIMString inviter;
    // 被邀请方列表
    V2TIMStringVector inviteeList;
    // 信令内容
    V2TIMString data;
    // 信令操作类型
    V2TIMSignalingActionType actionType;
    // 信令超时时间
    int timeout;

    V2TIMSignalingInfo();
    V2TIMSignalingInfo(const V2TIMSignalingInfo& signalingInfo);
    ~V2TIMSignalingInfo();
};

#endif /* __V2TIM_SIGNALING_H__ */
