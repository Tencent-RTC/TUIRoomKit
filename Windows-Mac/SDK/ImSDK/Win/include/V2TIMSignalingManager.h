// Copyright (c) 2021 Tencent. All rights reserved.

/////////////////////////////////////////////////////////////////////
//
//                     腾讯云通信服务 IMSDK
//
//           消息高级接口，里面包含了所有高级消息的创建、收发逻辑
//
/////////////////////////////////////////////////////////////////////

#ifndef __V2TIM_SIGNALING_MANAGER_H__
#define __V2TIM_SIGNALING_MANAGER_H__

#include "V2TIMCallback.h"
#include "V2TIMDefine.h"
#include "V2TIMListener.h"
#include "V2TIMSignaling.h"

class TIM_API V2TIMSignalingManager {
public:
    virtual ~V2TIMSignalingManager() {}

    /**
     * 添加信令监听
     */
    virtual void AddSignalingListener(V2TIMSignalingListener* listener) = 0;

    /**
     * 移除信令监听
     */
    virtual void RemoveSignalingListener(V2TIMSignalingListener* listener) = 0;

    /**
     * 邀请某个人
     *
     * @param invitee 被邀请人用户 ID
     * @param data 自定义数据
     * @param onlineUserOnly 是否只有在线用户才能收到邀请，如果设置为 true，只有在线用户才能收到，
     *                       并且 Invite 操作也不会产生历史消息（针对该次 Invite 的后续
     * Cancel、Accept、Reject、Timeout 操作也同样不会产生历史消息）。
     * @param offlinePushInfo 离线推送信息，其中 desc 为必填字段，推送的时候会默认展示 desc 信息。
     * @param timeout 超时时间，单位秒，如果设置为 0，SDK 不会做超时检测，也不会触发
     * onInvitationTimeout 回调
     * @return inviteID 邀请 ID，如果邀请失败，返回空字符串
     */
    virtual V2TIMString Invite(const V2TIMString& invitee, const V2TIMString& data,
                               bool onlineUserOnly,
                               const V2TIMOfflinePushInfo& offlinePushInfo, int timeout,
                               V2TIMCallback* callback) = 0;

    /**
     * 邀请群内的某些人
     *
     * @param groupID   发起邀请所在群组
     * @param inviteeList 被邀请人列表，inviteeList 必须已经在 groupID 群里，否则邀请无效
     * @param onlineUserOnly 是否只有在线用户才能收到邀请，如果设置为 true，只有在线用户才能收到，
     *                       并且 Invite 操作也不会产生历史消息（针对该次 Invite 的后续
     * Cancel、Accept、Reject、Timeout 操作也同样不会产生历史消息）。
     * @param timeout 超时时间，单位秒，如果设置为 0，SDK 不会做超时检测，也不会触发
     * onInvitationTimeout 回调
     * @return inviteID 邀请 ID，如果邀请失败，返回空字符串
     *
     * @note
     * 群邀请暂不支持离线推送，如果您需要离线推送，可以针对被邀请的用户单独发离线推送自定义消息，
     * 详细代码请参考 TRTCAVCallImpl -> sendOnlineMessageWithOfflinePushInfo 函数。
     */
    virtual V2TIMString InviteInGroup(const V2TIMString& groupID,
                                      const V2TIMStringVector& inviteeList, const V2TIMString& data,
                                      bool onlineUserOnly, int timeout,
                                      V2TIMCallback* callback) = 0;

    /**
     * 邀请方取消邀请
     *
     * @param inviteID 邀请 ID
     *
     * @note 如果所有被邀请人都已经处理了当前邀请（包含超时），不能再取消当前邀请。
     */
    virtual void Cancel(const V2TIMString& inviteID, const V2TIMString& data,
                        V2TIMCallback* callback) = 0;

    /**
     * 接收方接收邀请
     *
     * @note 不能接受不是针对自己的邀请，请在收到 OnReceiveNewInvitation 回调的时候先判断
     * inviteeList 有没有自己，如果没有自己，不能 Accept 邀请。
     */
    virtual void Accept(const V2TIMString& inviteID, const V2TIMString& data,
                        V2TIMCallback* callback) = 0;

    /**
     * 接收方拒绝邀请
     *
     * @note 不能拒绝不是针对自己的邀请，请在收到 OnReceiveNewInvitation 回调的时候先判断
     * inviteeList 有没有自己，如果没有自己，不能 Reject 邀请。
     */
    virtual void Reject(const V2TIMString& inviteID, const V2TIMString& data,
                        V2TIMCallback* callback) = 0;

    /**
     * 获取信令信息
     *
     * 如果 Invite 设置 onlineUserOnly 为 false，每次信令操作（包括
     * Invite、Cancel、Accept、Reject、Timeout）都会产生一条自定义消息， 该消息会通过
     * V2TIMAdvancedMsgListener -> onRecvNewMessage
     * 抛给用户，用户也可以通过历史消息拉取，如果需要根据信令信息做自定义化文本展示，可以调用下面接口获取信令信息。
     *
     * @param msg 消息对象
     * @return V2TIMSignalingInfo 信令信息，如果 V2TIMSignalingInfo::inviteID 为空字符串，则 msg 不是一条信令消息。
     */
    virtual V2TIMSignalingInfo GetSignalingInfo(const V2TIMMessage& msg) = 0;

    /**
     *  添加邀请信令（可以用于群离线推送消息触发的邀请信令）
     *
     *  在离线推送的场景下：
     *  - 1V1邀请，被邀请者 APP 如果被 Kill，当 APP
     * 收到离线推送再次启动后，如果邀请还没超时，用户会收到 OnReceiveNewInvitation
     * 回调，如果邀请已经超时，用户会收到 OnInvitationTimeout 回调。
     *  - 群邀请，被邀请者 APP 如果被 Kill，当 APP 收到离线推送再次启动后，SDK
     * 无法自动同步到邀请信令信息，如果您想要在该场景下处理邀请，请在发送推送消息时携带信令信息（代码参考
     * TRTCAVCallImpl -> sendOnlineMessageWithOfflinePushInfo），收到推送时候解析信令信息（代码参考
     * OfflineMessageDispatcher -> Redirect），然后调用 AddInvitedSignaling 主动添加信令信息。
     *
     *  TUIKit
     * 音视频通话离线推送功能基于这个接口实现，详细实现方法请参考文档：[集成音视频通话](https://cloud.tencent.com/document/product/269/46141)
     *
     *  @note 如果添加的信令信息已存在，callback 会抛 ERR_SDK_SIGNALING_ALREADY_EXISTS 错误码。
     */
    virtual void AddInvitedSignaling(const V2TIMSignalingInfo& info, V2TIMCallback* callback) = 0;
};

#endif  // __V2TIM_SIGNALING_MANAGER_H__
