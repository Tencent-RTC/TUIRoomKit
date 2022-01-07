// Copyright (c) 2021 Tencent. All rights reserved.

/////////////////////////////////////////////////////////////////////
//
//                     腾讯云通信服务 IMSDK
//
//          消息高级接口，里面包含了所有高级消息的创建、收发逻辑
//
/////////////////////////////////////////////////////////////////////

#ifndef __V2TIM_MESSAGE_MANAGER_H__
#define __V2TIM_MESSAGE_MANAGER_H__

#include "V2TIMCallback.h"
#include "V2TIMDefine.h"
#include "V2TIMListener.h"
#include "V2TIMMessage.h"

class V2TIMMessageManager {
public:
    virtual ~V2TIMMessageManager() {}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                         监听 - 高级（图片、语音、视频等）消息
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 1.1 添加高级消息的事件监听器
     */
    virtual void AddAdvancedMsgListener(V2TIMAdvancedMsgListener *listener) = 0;

    /**
     * 1.2 移除高级消息监听器
     */
    virtual void RemoveAdvancedMsgListener(V2TIMAdvancedMsgListener *listener) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                         创建 - 高级（图片、语音、视频等）消息
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 2.1 创建文本消息
     */
    virtual V2TIMMessage CreateTextMessage(const V2TIMString &text) = 0;

    /**
     * 2.2 创建文本消息，并且可以附带 @ 提醒功能
     *
     *  提醒消息仅适用于在群组中发送的消息
     *
     *  @param  atUserList 需要 @ 的用户列表，如果需要 @ALL，请传入 AT_ALL_TAG 常量字符串。
     *  举个例子，假设该条文本消息希望@提醒 denny 和 lucy 两个用户，同时又希望 @所有人，atUserList
     * 传 {"denny","lucy",AT_ALL_TAG}
     *
     *  @note atUserList 使用注意事项
     *  - 默认情况下，最多支持 @ 30个用户，超过限制后，消息会发送失败。
     *  - atUserList 的总数不能超过默认最大数，包括 @ALL。
     */
    virtual V2TIMMessage CreateTextAtMessage(const V2TIMString &text,
                                             const V2TIMStringVector &atUserList) = 0;

    /**
     * 2.3 创建自定义消息
     */
    virtual V2TIMMessage CreateCustomMessage(const V2TIMBuffer &data) = 0;

    /**
     * 2.4 创建自定义消息
     *
     * @param description 自定义消息描述信息，做离线Push时文本展示。
     * @param extension 离线 Push 时扩展字段信息。
     */
    virtual V2TIMMessage CreateCustomMessage(const V2TIMBuffer &data,
                                             const V2TIMString &description,
                                             const V2TIMString &extension) = 0;

    /**
     * 2.5 创建图片消息（图片最大支持 28 MB）
     */
    virtual V2TIMMessage CreateImageMessage(const V2TIMString &imagePath) = 0;

    /**
     * 2.6 创建语音消息（语音最大支持 28 MB）
     *
     * @param duration  语音时长，单位 s
     */
    virtual V2TIMMessage CreateSoundMessage(const V2TIMString &soundPath, uint32_t duration) = 0;

    /**
     * 2.7 创建视频消息（视频最大支持 100 MB）
     *
     * @param type             视频类型，如 mp4 mov 等
     * @param duration         视频时长，单位 s
     * @param snapshotPath     视频封面图片路径
     */
    virtual V2TIMMessage CreateVideoMessage(const V2TIMString &videoFilePath,
                                            const V2TIMString &type, uint32_t duration,
                                            const V2TIMString &snapshotPath) = 0;

    /**
     * 2.8 创建文件消息（文件最大支持 100 MB）
     */
    virtual V2TIMMessage CreateFileMessage(const V2TIMString &filePath,
                                           const V2TIMString &fileName) = 0;

    /**
     * 2.9 创建地理位置消息
     */
    virtual V2TIMMessage CreateLocationMessage(const V2TIMString &desc, double longitude,
                                               double latitude) = 0;

    /**
     * 2.10 创建表情消息
     *
     * SDK 并不提供表情包，如果开发者有表情包，可使用 index 存储表情在表情包中的索引，
     * 或者直接使用 data 存储表情二进制信息以及字符串 key，都由用户自定义，SDK 内部只做透传。
     *
     * @param index 表情索引
     * @param data  自定义数据
     */
    virtual V2TIMMessage CreateFaceMessage(uint32_t index, const V2TIMBuffer &data) = 0;

    /**
     * 2.11 创建合并消息（5.2.210 及以上版本支持）
     *
     * <p> 我们在收到一条合并消息的时候，通常会在聊天界面这样显示：
     * <p> |vinson 和 lynx 的聊天记录                         |        -- title         （标题）
     * <p> |vinson：新版本 SDK 计划什么时候上线呢？             |        -- abstract1 （摘要信息1）
     * <p> |lynx：计划下周一，具体时间要看下这两天的系统测试情况..|        -- abstract2 （摘要信息2）
     * <p> |vinson：好的.                                     |        -- abstract3 （摘要信息3）
     * <p> 聊天界面通常只会展示合并消息的标题和摘要信息，完整的转发消息列表，需要用户主动点击转发消息 UI  后再获取。
     *
     * <p> 多条被转发的消息可以被创建成一条合并消息 V2TIMMessage，然后调用 SendMessage 接口发送，实现步骤如下： 
     * <p> 1. 调用 CreateMergerMessage 创建一条合并消息 V2TIMMessage。
     * <p> 2. 调用 SendMessage 发送转发消息 V2TIMMessage。
     *
     * <p> 收到合并消息解析步骤：
     * <p> 1. 通过 V2TIMMessage 获取 mergerElem。
     * <p> 2. 通过 mergerElem 获取 title 和 abstractList UI 展示。
     * <p> 3. 当用户点击摘要信息 UI 的时候，调用 DownloadMessageList 接口获取转发消息列表。
     *
     *
     * @param messageList 消息列表（最大支持 300 条，消息对象必须是 V2TIM_MSG_STATUS_SEND_SUCC 状态，消息类型不能为 V2TIMGroupTipsElem）
     * @param title 合并消息的来源，比如 "vinson 和 lynx 的聊天记录"、"xxx 群聊的聊天记录"。
     * @param abstractList 合并消息的摘要列表(最大支持 5 条摘要，每条摘要的最大长度不超过 100 个字符),不同的消息类型可以设置不同的摘要信息，比如:
     * 文本消息可以设置为：sender：text，图片消息可以设置为：sender：[图片]，文件消息可以设置为：sender：[文件]。
     * @param compatibleText 合并消息兼容文本，低版本 SDK 如果不支持合并消息，默认会收到一条文本消息，文本消息的内容为 compatibleText， 
     * 该参数不能为空字符串。
     */
    virtual V2TIMMessage CreateMergerMessage(const V2TIMMessageVector &messageList,
                                             const V2TIMString &title,
                                             const V2TIMStringVector &abstractList,
                                             const V2TIMString &compatibleText) = 0;

    /**
     * 2.12 创建转发消息（5.2.210 及以上版本支持）
     *
     * 如果需要转发一条消息，不能直接调用 SendMessage 接口发送原消息，需要先 CreateForwardMessage
     * 创建一条转发消息再发送。
     *
     * @param message 待转发的消息对象，消息状态必须为 V2TIM_MSG_STATUS_SEND_SUCC，消息类型不能为
     * V2TIMGroupTipsElem。
     * @return 转发消息对象，elem 内容和原消息完全一致。
     */
    virtual V2TIMMessage CreateForwardMessage(const V2TIMMessage &message) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                         发送 - 高级（图片、语音、视频等）消息
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 3.1 发送高级消息（高级版本：可以指定优先级，推送信息等特性）
     *
     * @param message           待发送的消息对象，需要通过对应的 CreateXXXMessage 接口进行创建。
     * @param receiver          消息接收者的 userID, 如果是发送 C2C 单聊消息，只需要指定 receiver
     * 即可。
     * @param groupID           目标群组 ID，如果是发送群聊消息，只需要指定 groupID 即可。
     * @param priority
     * 消息优先级，仅针对群聊消息有效。请把重要消息设置为高优先级（比如红包、礼物消息），高频且不重要的消息设置为低优先级（比如点赞消息）。
     * @param onlineUserOnly    是否只有在线用户才能收到，如果设置为 true
     * ，接收方历史消息拉取不到，常被用于实现“对方正在输入”或群组里的非重要提示等弱提示功能，该字段不支持
     * AVChatRoom。
     * @param offlinePushInfo   离线推送时携带的标题和内容。
     * @return                  消息唯一标识
     * @note
     *  - 设置 offlinePushInfo 字段，需要先在 V2TIMOfflinePushManager
     * 开启推送，推送开启后，除了自定义消息，其他消息默认都会推送。
     *  - 如果自定义消息也需要推送，请设置 offlinePushInfo 的 desc
     * 字段，设置成功后，推送的时候会默认展示 desc 信息。
     *  - AVChatRoom 群聊不支持 onlineUserOnly 字段，如果是 AVChatRoom 请将该字段设置为 false。
     *  - 如果设置 onlineUserOnly 为 true 时，该消息为在线消息且不会被计入未读计数。
     */
    virtual V2TIMString SendMessage(V2TIMMessage &message, const V2TIMString &receiver,
                                    const V2TIMString &groupID, V2TIMMessagePriority priority,
                                    bool onlineUserOnly,
                                    const V2TIMOfflinePushInfo &offlinePushInfo,
                                    V2TIMSendCallback *callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                         接收 - 设置消息的接口选项（接收|接收但不提醒|不接收）
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     *  4.1 设置针对某个用户的 C2C 消息接收选项（支持批量设置）
     * <p>5.3.425 及以上版本支持
     *
     *  @note 请注意:
     *  - 该接口支持批量设置，您可以通过参数 userIDList 设置一批用户，但一次最大允许设置 30 个用户。
     *  - 该接口调用频率被限制为1秒内最多调用5次。
     *
     *
     *  @param opt    三种类型的消息接收选项：
     *                V2TIMMessage.V2TIM_RECEIVE_MESSAGE：在线正常接收消息，离线时会有厂商的离线推送通知
     *                V2TIMMessage.V2TIM_NOT_RECEIVE_MESSAGE：不会接收到消息
     *                V2TIMMessage.V2TIM_RECEIVE_NOT_NOTIFY_MESSAGE：在线正常接收消息，离线不会有推送通知
     *
     */
    virtual void SetC2CReceiveMessageOpt(const V2TIMStringVector &userIDList,
                                         V2TIMReceiveMessageOpt opt, V2TIMCallback *callback) = 0;

    /**
     *  4.2 查询针对某个用户的 C2C 消息接收选项
     *  <p>5.3.425 及以上版本支持
     */
    virtual void GetC2CReceiveMessageOpt(
        const V2TIMStringVector &userIDList,
        V2TIMValueCallback<V2TIMReceiveMessageOptInfoVector> *callback) = 0;

    /**
     *  4.3 设置群消息的接收选项
     *
     * @param opt      三种类型的消息接收选项：
     *                 V2TIMMessage.V2TIM_RECEIVE_MESSAGE：在线正常接收消息，离线时会有厂商的离线推送通知
     *                 V2TIMMessage.V2TIM_NOT_RECEIVE_MESSAGE：不会接收到群消息
     *                 V2TIMMessage.V2TIM_RECEIVE_NOT_NOTIFY_MESSAGE：在线正常接收消息，离线不会有推送通知
     */
    virtual void SetGroupReceiveMessageOpt(const V2TIMString &groupID, V2TIMReceiveMessageOpt opt,
                                           V2TIMCallback *callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                         获取历史消息、撤回、删除、标记已读等高级接口
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 5.1 获取历史消息高级接口
     *
     * @param option 拉取消息选项设置，可以设置从云端、本地拉取更老或更新的消息
     *
     * @note 请注意：
     * - 如果设置为拉取云端消息，当 SDK 检测到没有网络，默认会直接返回本地数据
     * -
     * 只有会议群（Meeting）才能拉取到进群前的历史消息，直播群（AVChatRoom）消息不存漫游和本地数据库，调用这个接口无效
     */
    virtual void GetHistoryMessageList(const V2TIMMessageListGetOption &option,
                                       V2TIMValueCallback<V2TIMMessageVector> *callback) = 0;

    /**
     * 5.2 撤回消息
     *
     * @note 请注意：
     *  - 撤回消息的时间限制默认 2 minutes，超过 2 minutes 的消息不能撤回，您也可以在 [控制台](https://console.cloud.tencent.com/im)（功能配置 -> 登录与消息 ->
     * 消息撤回设置）自定义撤回时间限制。
     *  - 仅支持单聊和群组中发送的普通消息，无法撤销 onlineUserOnly 为 true 即仅在线用户才能收到的消息，也无法撤销直播群（AVChatRoom）中的消息。
     *  - 如果发送方撤回消息，已经收到消息的一方会收到 V2TIMAdvancedMsgListener::OnRecvMessageRevoked 回调。
     */
    virtual void RevokeMessage(const V2TIMMessage &message, V2TIMCallback *callback) = 0;

    /**
     * 5.3 设置单聊消息已读
     * @note 从5.8版本开始，当 userID 为空字符串时，标记所有单聊消息为已读状态
     */
    virtual void MarkC2CMessageAsRead(const V2TIMString &userID, V2TIMCallback *callback) = 0;

    /**
     * 5.4 设置群组消息已读
     * @note 从5.8版本开始，当 groupID 为空字符串时，标记所有群组消息为已读状态
     */
    virtual void MarkGroupMessageAsRead(const V2TIMString &groupID, V2TIMCallback *callback) = 0;

    /**
     * 5.5 标记所有消息为已读（5.8及其以上版本支持）
     */
    virtual void MarkAllMessageAsRead(V2TIMCallback *callback) = 0;

    /**
     * 5.6 删除本地及云端的消息
     *
     *  @note 该接口删除本地及云端的消息，且无法恢复。需要注意的是：
     *  - 一次最多只能删除 30 条消息
     *  - 要删除的消息必须属于同一会话
     *  - 一秒钟最多只能调用一次该接口
     *  -
     * 如果该账号在其他设备上拉取过这些消息，那么调用该接口删除后，这些消息仍然会保存在那些设备上，即删除消息不支持多端同步。
     */
    virtual void DeleteMessages(const V2TIMMessageVector &messages, V2TIMCallback *callback) = 0;

    /**
     * 5.7 清空单聊本地及云端的消息（不删除会话）
     * <p> 5.4.666 及以上版本支持
     *
     * @note 请注意：
     * - 会话内的消息在本地删除的同时，在服务器也会同步删除。
     *
     */
    virtual void ClearC2CHistoryMessage(const V2TIMString &userID, V2TIMCallback *callback) = 0;

    /**
     * 5.8 清空群聊本地及云端的消息（不删除会话）
     * <p> 5.4.666 及以上版本支持
     *
     * @note 请注意：
     * - 会话内的消息在本地删除的同时，在服务器也会同步删除。
     */
    virtual void ClearGroupHistoryMessage(const V2TIMString &groupID, V2TIMCallback *callback) = 0;

    /**
     * 5.9 向群组消息列表中添加一条消息
     *
     * 该接口主要用于满足向群组聊天会话中插入一些提示性消息的需求，比如“您已经退出该群”，这类消息有展示
     * 在聊天消息区的需求，但并没有发送给其他人的必要。
     * 所以 InsertGroupMessageToLocalStorage() 相当于一个被禁用了网络发送能力的 SendMessage() 接口。
     *
     * @return msgID 消息唯一标识
     *
     * @note 通过该接口 save 的消息只存本地，程序卸载后会丢失。
     */
    virtual V2TIMString InsertGroupMessageToLocalStorage(
        V2TIMMessage &message, const V2TIMString &groupID, const V2TIMString &sender,
        V2TIMValueCallback<V2TIMMessage> *callback) = 0;

    /**
     *  5.10 向C2C消息列表中添加一条消息
     *
     *  该接口主要用于满足向C2C聊天会话中插入一些提示性消息的需求，比如“您已成功发送消息”，这类消息有展示
     *  在聊天消息去的需求，但并没有发送给对方的必要。
     *  所以 InsertC2CMessageToLocalStorage()相当于一个被禁用了网络发送能力的 SendMessage() 接口。
     *
     *  @return msgID 消息唯一表示
     *  @note 通过该接口 save 的消息只存本地，程序卸载后会丢失。
     */
    virtual V2TIMString InsertC2CMessageToLocalStorage(
        V2TIMMessage &message, const V2TIMString &userID, const V2TIMString &sender,
        V2TIMValueCallback<V2TIMMessage> *callback) = 0;

    /**
     * 5.11 根据 messageID 查询指定会话中的本地消息
     * @param messageIDList 消息 ID 列表
     */
    virtual void FindMessages(const V2TIMStringVector &messageIDList,
                              V2TIMValueCallback<V2TIMMessageVector> *callback) = 0;

    /**
     * 5.12 搜索本地消息（5.4.666 及以上版本支持，需要您购买旗舰版套餐）
     * @param searchParam 消息搜索参数，详见 V2TIMMessageSearchParam 的定义
     */
    virtual void SearchLocalMessages(const V2TIMMessageSearchParam &searchParam,
                                     V2TIMValueCallback<V2TIMMessageSearchResult> *callback) = 0;
};

#endif  // __V2TIM_MESSAGE_MANAGER_H__
