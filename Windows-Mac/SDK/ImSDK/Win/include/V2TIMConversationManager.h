// Copyright (c) 2021 Tencent. All rights reserved.

/////////////////////////////////////////////////////////////////////
//
//                     腾讯云通信服务 IMSDK
//
//          会话接口，里面包含了会话的获取，删除，更新的逻辑
//
/////////////////////////////////////////////////////////////////////

#ifndef __V2TIM_CONVERSATION_MANAGER_H__
#define __V2TIM_CONVERSATION_MANAGER_H__

#include "V2TIMCallback.h"
#include "V2TIMConversation.h"
#include "V2TIMDefine.h"
#include "V2TIMListener.h"

class TIM_API V2TIMConversationManager {
public:
    virtual ~V2TIMConversationManager() {}

    /**
     * 1.1 添加会话监听器
     */
    virtual void AddConversationListener(V2TIMConversationListener* listener) = 0;

    /**
     * 1.2 移除会话监听器
     */
    virtual void RemoveConversationListener(V2TIMConversationListener* listener) = 0;

    /**
     * 1.3 获取会话列表
     *
     * - 一个会话对应一个聊天窗口，比如跟一个好友的 1v1 聊天，或者一个聊天群，都是一个会话。
     * -
     * 由于历史的会话数量可能很多，所以该接口希望您采用分页查询的方式进行调用，每次分页拉取的个数建议为
     * 100 个。
     * - 该接口拉取的是本地缓存的会话，如果服务器会话有更新，SDK 内部会自动同步，然后在 @ref
     * V2TIMConversationListener 回调告知客户。
     * - 如果会话全部拉取完毕，成功回调里面 V2TIMConversationResult 中的 isFinished 获取字段值为
     * true。
     *
     * @note 会话排序规则
     * - 5.5.892 及以后版本, 该接口获取的会话列表默认已经按照会话 orderKey 做了排序，orderKey
     * 值越大，代表该会话排序越靠前。
     * - 5.5.892 以前版本，该接口获取的会话列表默认已经按照会话 lastMessage -> timestamp
     * 做了排序，timestamp 越大，会话越靠前。
     *
     * @param nextSeq   分页拉取的游标，第一次默认取传 0，后续分页拉传上一次分页拉取成功回调里的
     * nextSeq
     * @param count    分页拉取的个数，一次分页拉取不宜太多，会影响拉取的速度，建议每次拉取 100
     * 个会话
     */
    virtual void GetConversationList(uint64_t nextSeq, uint32_t count,
                                     V2TIMValueCallback<V2TIMConversationResult>* callback) = 0;

    /**
     * 1.4 获取单个会话
     *
     * @param conversationID  会话唯一 ID，C2C 单聊组成方式为: "c2c_userID"：
     * 群聊组成方式为: "group_groupID")
     */
    virtual void GetConversation(const V2TIMString& conversationID,
                                 V2TIMValueCallback<V2TIMConversation>* callback) = 0;

    /**
     * 1.5 获取指定会话列表
     *
     * @param conversationIDList 会话唯一 ID，C2C 单聊组成方式为: "c2c_userID"：
     * 群聊组成方式为: "group_groupID")
     */
    virtual void GetConversationList(const V2TIMStringVector& conversationIDList,
                                     V2TIMValueCallback<V2TIMVConversationVector>* callback) = 0;

    /**
     * 1.6 删除会话
     *
     * @param conversationID 会话唯一 ID，C2C 单聊组成方式为: "c2c_userID"：
     * 群聊组成方式为: "group_groupID")
     *
     * @note 请注意:
     * - 删除会话会在本地删除的同时，在服务器也会同步删除。
     * - 会话内的消息在本地删除的同时，在服务器也会同步删除。
     */
    virtual void DeleteConversation(const V2TIMString& conversationID, V2TIMCallback* callback) = 0;

    /**
     * 1.7 设置会话草稿
     *
     * @param conversationID 会话唯一 ID，C2C 会话唯一 ID，C2C 单聊组成方式为: "c2c_userID"：
     * 群聊组成方式为: "group_groupID")
     *
     * 只在本地保存，不会存储 Server，不能多端同步，程序卸载重装会失效。
     *
     * @param draftText 草稿内容, 空字符串表示 则表示取消草稿
     */
    virtual void SetConversationDraft(const V2TIMString& conversationID,
                                      const V2TIMString& draftText, V2TIMCallback* callback) = 0;

    /**
     * 1.8 设置会话置顶（5.3.425 及以上版本支持）
     *
     * @param conversationID 会话唯一 ID，C2C 单聊组成方式为: "c2c_userID"：
     * 群聊组成方式为: "group_groupID")
     *
     * @param isPinned 是否置顶
     */
    virtual void PinConversation(const V2TIMString& conversationID, bool isPinned,
                                 V2TIMCallback* callback) = 0;

    /**
     * 1.9 获取会话未读总数（5.3.425 及以上版本支持）
     * @note
     *  - 未读总数会减去设置为免打扰的会话的未读数，即消息接收选项设置为
     *  V2TIM_NOT_RECEIVE_MESSAGE 或 V2TIM_RECEIVE_NOT_NOTIFY_MESSAGE 的会话。
     */
    virtual void GetTotalUnreadMessageCount(V2TIMValueCallback<uint64_t>* callback) = 0;
};

#endif  // __V2TIM_CONVERSATION_MANAGER_H__
