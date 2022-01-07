// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef __V2TIM_MESSAGE_H__
#define __V2TIM_MESSAGE_H__

#include "V2TIMCommon.h"
#include "V2TIMGroup.h"

/////////////////////////////////////////////////////////////////////////////////
//
//                    （一）枚举值定义
//
/////////////////////////////////////////////////////////////////////////////////

/// 消息优先级
enum V2TIMMessagePriority {
    /// 默认
    V2TIM_PRIORITY_DEFAULT = 0,
    /// 高优先级，一般用于礼物等重要消息
    V2TIM_PRIORITY_HIGH = 1,
    /// 常规优先级，一般用于普通消息
    V2TIM_PRIORITY_NORMAL = 2,
    /// 低优先级，一般用于点赞消息
    V2TIM_PRIORITY_LOW = 3,
};

/// 消息状态
enum V2TIMMessageStatus {
    ///< 消息发送中
    V2TIM_MSG_STATUS_SENDING = 1,
    ///< 消息发送成功
    V2TIM_MSG_STATUS_SEND_SUCC = 2,
    ///< 消息发送失败
    V2TIM_MSG_STATUS_SEND_FAIL = 3,
    ///< 消息被删除
    V2TIM_MSG_STATUS_HAS_DELETED = 4,
    ///< 导入到本地的消息
    V2TIM_MSG_STATUS_LOCAL_IMPORTED = 5,
    ///< 被撤销的消息
    V2TIM_MSG_STATUS_LOCAL_REVOKED = 6,
};

/// 消息类型
enum V2TIMElemType {
    ///< 未知消息
    V2TIM_ELEM_TYPE_NONE = 0,
    ///< 文本消息
    V2TIM_ELEM_TYPE_TEXT = 1,
    ///< 自定义消息
    V2TIM_ELEM_TYPE_CUSTOM = 2,
    ///< 图片消息
    V2TIM_ELEM_TYPE_IMAGE = 3,
    ///< 语音消息
    V2TIM_ELEM_TYPE_SOUND = 4,
    ///< 视频消息
    V2TIM_ELEM_TYPE_VIDEO = 5,
    ///< 文件消息
    V2TIM_ELEM_TYPE_FILE = 6,
    ///< 地理位置消息
    V2TIM_ELEM_TYPE_LOCATION = 7,
    ///< 表情消息
    V2TIM_ELEM_TYPE_FACE = 8,
    ///< 群 Tips 消息
    V2TIM_ELEM_TYPE_GROUP_TIPS = 9,
    ///< 合并消息
    V2TIM_ELEM_TYPE_MERGER = 10,
};

/// 推送规则
enum V2TIMOfflinePushFlag {
    ///< 按照默认规则进行推送
    V2TIM_OFFLINE_PUSH_DEFAULT = 0,
    ///< 不进行推送
    V2TIM_OFFLINE_PUSH_NO_PUSH = 1,
};

/// 图片类型
enum V2TIMImageType {
    ///< 原图
    V2TIM_IMAGE_TYPE_ORIGIN = 0x01,
    ///< 缩略图
    V2TIM_IMAGE_TYPE_THUMB = 0x02,
    ///< 大图
    V2TIM_IMAGE_TYPE_LARGE = 0x04,
};

/// 群 Tips 类型
enum V2TIMGroupTipsType {
    /// 未定义
    V2TIM_GROUP_TIPS_TYPE_NONE = 0x00,
    ///< 主动入群（memberList 加入群组，非 Work 群有效）
    V2TIM_GROUP_TIPS_TYPE_JOIN = 0x01,
    ///< 被邀请入群（opMember 邀请 memberList 入群，Work 群有效）
    V2TIM_GROUP_TIPS_TYPE_INVITE = 0x02,
    ///< 退出群 (opMember 退出群组)
    V2TIM_GROUP_TIPS_TYPE_QUIT = 0x03,
    ///< 踢出群 (opMember 把 memberList 踢出群组)
    V2TIM_GROUP_TIPS_TYPE_KICKED = 0x04,
    ///< 设置管理员 (opMember 把 memberList 设置为管理员)
    V2TIM_GROUP_TIPS_TYPE_SET_ADMIN = 0x05,
    ///< 取消管理员 (opMember 取消 memberList 管理员身份)
    V2TIM_GROUP_TIPS_TYPE_CANCEL_ADMIN = 0x06,
    ///< 群资料变更 (opMember 修改群资料： groupName & introduction & notification & faceUrl & owner
    ///< & custom)
    V2TIM_GROUP_TIPS_TYPE_GROUP_INFO_CHANGE = 0x07,
    ///< 群成员资料变更 (opMember 修改群成员资料：muteTime)
    V2TIM_GROUP_TIPS_TYPE_MEMBER_INFO_CHANGE = 0x08,
};

/// 消息拉取方式
enum V2TIMMessageGetType {
    ///< 获取云端更老的消息
    V2TIM_GET_CLOUD_OLDER_MSG = 1,
    ///< 获取云端更新的消息
    V2TIM_GET_CLOUD_NEWER_MSG = 2,
    ///< 获取本地更老的消息
    V2TIM_GET_LOCAL_OLDER_MSG = 3,
    ///< 获取本地更新的消息
    V2TIM_GET_LOCAL_NEWER_MSG = 4,
};

/// 消息搜索关键字匹配类型
enum V2TIMKeywordListMatchType {
    V2TIM_KEYWORD_LIST_MATCH_TYPE_OR = 0,
    V2TIM_KEYWORD_LIST_MATCH_TYPE_AND = 1
};

/////////////////////////////////////////////////////////////////////////////////
//
//                     （二）结构体定义
//
/////////////////////////////////////////////////////////////////////////////////

struct V2TIMElem;
struct V2TIMTextElem;
struct V2TIMCustomElem;
struct V2TIMImageElem;
struct V2TIMVideoElem;
struct V2TIMSoundElem;
struct V2TIMFileElem;
struct V2TIMFaceElem;
struct V2TIMLocationElem;
struct V2TIMMergerElem;
struct V2TIMGroupTipsElem;

DEFINE_POINT_VECTOR(V2TIMElem)
typedef TXPV2TIMElemVector V2TIMElemVector;

class V2TIMDownloadCallback;

template <class T>
class V2TIMValueCallback;

extern const char *const kImSDK_MesssageAtALL;

/// 高级消息
struct TIM_API V2TIMMessage : V2TIMBaseObject {
    /// 消息 ID（消息创建的时候为空，消息发送的时候会生成）
    V2TIMString msgID;
    /// 消息时间
    int64_t timestamp;
    /// 消息发送者
    V2TIMString sender;
    /// 消息发送者昵称
    V2TIMString nickName;
    /// 消息发送者好友备注
    V2TIMString friendRemark;
    /// 如果是群组消息，nameCard 为发送者的群名片
    V2TIMString nameCard;
    /// 消息发送者头像
    /// 在 C2C 场景下，陌生人的头像不会实时更新，如需更新陌生人的头像（如在 UI
    /// 上点击陌生人头像以展示陌生人信息时）， 请调用 V2TIMManager.h -> GetUsersInfo
    /// 接口触发信息的拉取。待拉取成功后，SDK 会更新本地头像信息，即 faceURL 字段的内容。
    /// @note 请不要在收到每条消息后都去 GetUsersInfo，会严重影响程序性能。
    V2TIMString faceURL;
    /// 如果是群组消息，groupID 为会话群组 ID，否则为空
    V2TIMString groupID;
    /// 如果是单聊消息，userID 为会话用户 ID，否则为空，
    /// 假设自己和 userA 聊天，无论是自己发给 userA 的消息还是 userA 发给自己的消息，这里的 userID
    /// 均为 userA
    V2TIMString userID;
    /// 群聊中的消息序列号云端生成，在群里是严格递增且唯一的,
    /// 单聊中的序列号是本地生成，不能保证严格递增且唯一。
    uint64_t seq;
    /// 消息随机码
    uint64_t random;
    /// 消息发送状态
    V2TIMMessageStatus status;
    /// 消息发送者是否是自己
    bool isSelf;
    /// 消息自己是否已读
    bool isRead;
    /// 消息对方是否已读（只有 C2C 消息有效）
    bool isPeerRead;
    /// 群消息中被 @ 的用户 UserID 列表（即该消息都 @ 了哪些人）
    V2TIMStringVector groupAtUserList;
    /// 消息元素列表
    ///
    /// 推荐一条消息只存放一个 elem，在收到这条消息时，调用 elemList[0] 获取这个elem，示例代码如下：
    /// if (1 == message.elemList.Size()) {
    ///     V2TIMElem *elem = message.elemList[0];
    ///     switch (elem->elemType) {
    ///         case V2TIM_ELEM_TYPE_TEXT:
    ///             V2TIMTextElem *textElem = static_cast<V2TIMTextElem *>(elem);
    ///             break;
    ///         case V2TIM_ELEM_TYPE_CUSTOM:
    ///             V2TIMCustomElem *customElem = static_cast<V2TIMCustomElem *>(elem);
    ///             break;
    ///         case V2TIM_ELEM_TYPE_FACE:
    ///             V2TIMFaceElem *faceElem = static_cast<V2TIMFaceElem *>(elem);
    ///             break;
    ///         case V2TIM_ELEM_TYPE_LOCATION:
    ///             V2TIMLocationElem *locationElem = static_cast<V2TIMLocationElem *>(elem);
    ///             break;
    ///         default:
    ///             break;
    ///     }
    /// }
    ///
    /// 如果一条消息有多个 elem，遍历 elemList 列表，获取全部 elem 元素，示例代码如下：
    /// for (size_t i = 0; i < message.elemList.Size(); ++i) {
    ///     V2TIMElem *elem = message.elemList[i];
    ///     switch (elem->elemType) {
    ///         case V2TIM_ELEM_TYPE_TEXT:
    ///             V2TIMTextElem *textElem = static_cast<V2TIMTextElem *>(elem);
    ///             break;
    ///         case V2TIM_ELEM_TYPE_CUSTOM:
    ///             V2TIMCustomElem *customElem = static_cast<V2TIMCustomElem *>(elem);
    ///             break;
    ///         case V2TIM_ELEM_TYPE_FACE:
    ///             V2TIMFaceElem *faceElem = static_cast<V2TIMFaceElem *>(elem);
    ///             break;
    ///         case V2TIM_ELEM_TYPE_LOCATION:
    ///             V2TIMLocationElem *locationElem = static_cast<V2TIMLocationElem *>(elem);
    ///             break;
    ///         default:
    ///             break;
    ///     }
    /// }
    ///
    /// 如果您的一条消息需要多个 elem，可以在创建 Message 对象后，调用 elemList.PushBack 添加新
    /// elem， 以 V2TIMTextElem 和 V2TIMCustomElem 多 elem 为例，示例代码如下： 
    /// V2TIMCustomElem *customElem = new V2TIMCustomElem(); 
    /// customElem->data = buffer; 
    /// V2TIMMessage message = messageManager.CreateTextMessage("text");
    /// message.elemList.PushBack(customElem);
    V2TIMElemVector elemList;
    /// 消息自定义数据（本地保存，不会发送到对端，程序卸载重装后失效）
    V2TIMBuffer localCustomData;
    /// 消息自定义数据,可以用来标记语音、视频消息是否已经播放（本地保存，不会发送到对端，程序卸载重装后失效）
    int localCustomInt;
    /// 消息自定义数据（云端保存，会发送到对端，程序卸载重装后还能拉取到）
    V2TIMBuffer cloudCustomData;
    /// 消息是否不计入会话未读数：默认为 false，表明需要计入会话未读数，设置为
    /// true，表明不需要计入会话未读数
    bool isExcludedFromUnreadCount;
    /// 消息是否不计入会话 lastMsg：默认为 false，表明需要计入会话 lastMsg，设置为
    /// true，表明不需要计入会话 lastMsg
    bool isExcludedFromLastMessage;
    /// 指定群消息接收成员，即发送群内定向消息（5.9及以上版本支持）
    /// 请注意：
    /// - 发送群 @ 消息时，设置该字段无效
    /// - 向社群（Community）和直播群（AVChatRoom）里发送消息时，设置该字段无效
    /// - 群内定向消息默认不计入群会话的未读计数
    V2TIMStringVector targetGroupMemberList;

    V2TIMMessage();
    V2TIMMessage(const V2TIMMessage &);
    V2TIMMessage &operator=(const V2TIMMessage &);
    ~V2TIMMessage() override;
};

DEFINE_VECTOR(V2TIMMessage)
typedef TXV2TIMMessageVector V2TIMMessageVector;

/////////////////////////////////////////////////////////////////////////////////
//
//                         消息元素基类
//
/////////////////////////////////////////////////////////////////////////////////

/// 消息元素基类
struct TIM_API V2TIMElem : V2TIMBaseObject {
    /// 元素类型
    V2TIMElemType elemType;

    V2TIMElem();
    V2TIMElem(const V2TIMElem &);
    ~V2TIMElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         文本消息 Elem
//
/////////////////////////////////////////////////////////////////////////////////

/// 文本消息 Elem
struct TIM_API V2TIMTextElem : public V2TIMElem {
    /// 消息文本
    V2TIMString text;

    V2TIMTextElem();
    V2TIMTextElem(const V2TIMTextElem &);
    V2TIMTextElem &operator=(const V2TIMTextElem &);
    ~V2TIMTextElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         自定义消息 Elem
//
/////////////////////////////////////////////////////////////////////////////////

/// 自定义消息 Elem
struct TIM_API V2TIMCustomElem : public V2TIMElem {
    /// 自定义消息二进制数据
    V2TIMBuffer data;
    /// 自定义消息描述信息
    V2TIMString desc;
    /// 自定义消息扩展字段
    V2TIMString extension;

    V2TIMCustomElem();
    V2TIMCustomElem(const V2TIMCustomElem &);
    V2TIMCustomElem &operator=(const V2TIMCustomElem &);
    ~V2TIMCustomElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         图片消息 Elem
//
/////////////////////////////////////////////////////////////////////////////////

/// 图片元素
struct TIM_API V2TIMImage {
    /// 图片 ID，内部标识，可用于外部缓存 key
    V2TIMString uuid;
    /// 图片类型
    V2TIMImageType type;
    /// 图片大小（type == V2TIM_IMAGE_TYPE_ORIGIN 有效）
    uint64_t size;
    /// 图片宽度
    uint32_t width;
    /// 图片高度
    uint32_t height;
    /// 图片 url
    V2TIMString url;

    /**
     *  下载图片
     *
     *  下载的数据需要由开发者缓存，IM SDK 每次调用 DownloadImage
     * 都会从服务端重新下载数据。建议通过图片的 uuid 作为 key 进行图片文件的存储。
     *
     *  @param path 图片保存路径，需要外部指定
     */
    void DownloadImage(const V2TIMString &path, V2TIMDownloadCallback *callback);

    V2TIMImage();
    V2TIMImage(const V2TIMImage &);
    ~V2TIMImage();
};

DEFINE_VECTOR(V2TIMImage)
typedef TXV2TIMImageVector V2TIMImageVector;

/// 图片消息Elem
struct TIM_API V2TIMImageElem : public V2TIMElem {
    /// 图片路径（只有发送方可以获取到）
    V2TIMString path;
    /// 接收图片消息的时候这个字段会保存图片的所有规格，目前最多包含三种规格：原图、大图、缩略图，每种规格保存在一个
    /// TIMImage 对象中
    V2TIMImageVector imageList;

    V2TIMImageElem();
    V2TIMImageElem(const V2TIMImageElem &);
    V2TIMImageElem &operator=(const V2TIMImageElem &);
    ~V2TIMImageElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         语音消息 Elem
//
/////////////////////////////////////////////////////////////////////////////////

/// 语音消息 Elem
struct TIM_API V2TIMSoundElem : public V2TIMElem {
    /// 语音文件路径（只有发送方才能获取到）
    V2TIMString path;
    /// 语音消息内部 ID
    V2TIMString uuid;
    /// 语音数据大小
    uint64_t dataSize;
    /// 语音长度（秒）
    uint32_t duration;

    /// 获取语音的 URL 下载地址
    void GetUrl(V2TIMValueCallback<V2TIMString> *callback);

    /**
     *  下载语音
     *
     *  DownloadSound 接口每次都会从服务端下载，如需缓存或者存储，开发者可根据 uuid 作为 key
     * 进行外部存储，ImSDK 并不会存储资源文件。
     *
     *  @param path 语音保存路径，需要外部指定
     */
    void DownloadSound(const V2TIMString &path, V2TIMDownloadCallback *callback);

    V2TIMSoundElem();
    V2TIMSoundElem(const V2TIMSoundElem &);
    V2TIMSoundElem &operator=(const V2TIMSoundElem &);
    ~V2TIMSoundElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         视频消息 Elem
//
/////////////////////////////////////////////////////////////////////////////////

/// 视频消息 Elem
struct TIM_API V2TIMVideoElem : public V2TIMElem {
    /// 视频文件路径（只有发送方才能获取到）
    V2TIMString videoPath;
    /// 截图文件路径（只有发送方才能获取到）
    V2TIMString snapshotPath;
    /// 视频 ID,内部标识，可用于外部缓存 key
    V2TIMString videoUUID;
    /// 视频大小
    uint64_t videoSize;
    /// 视频类型
    V2TIMString videoType;
    /// 视频时长
    uint32_t duration;
    /// 截图 ID,内部标识，可用于外部缓存 key
    V2TIMString snapshotUUID;
    /// 截图 size
    uint64_t snapshotSize;
    /// 截图宽
    uint32_t snapshotWidth;
    /// 截图高
    uint32_t snapshotHeight;

    /// 获取视频的 URL 下载地址
    void GetVideoUrl(V2TIMValueCallback<V2TIMString> *callback);

    /// 获取截图的 URL 下载地址
    void GetSnapshotUrl(V2TIMValueCallback<V2TIMString> *callback);

    /**
     *  下载视频
     *
     *  DownloadVideo 接口每次都会从服务端下载，如需缓存或者存储，开发者可根据 uuid 作为 key
     * 进行外部存储，ImSDK 并不会存储资源文件。
     *
     *  @param path 视频保存路径，需要外部指定
     */
    void DownloadVideo(const V2TIMString &path, V2TIMDownloadCallback *callback);

    /**
     *  下载视频截图
     *
     *  DownloadSnapshot 接口每次都会从服务端下载，如需缓存或者存储，开发者可根据 uuid 作为 key
     * 进行外部存储，ImSDK 并不会存储资源文件。
     *
     *  @param path 截图保存路径，需要外部指定
     */
    void DownloadSnapshot(const V2TIMString &path, V2TIMDownloadCallback *callback);

    V2TIMVideoElem();
    V2TIMVideoElem(const V2TIMVideoElem &);
    V2TIMVideoElem &operator=(const V2TIMVideoElem &);
    ~V2TIMVideoElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         文件消息 Elem
//
/////////////////////////////////////////////////////////////////////////////////

/// 文件消息 Elem
struct TIM_API V2TIMFileElem : public V2TIMElem {
    /// 文件路径（只有发送方才能获取到）
    V2TIMString path;
    /// 文件 ID,内部标识，可用于外部缓存 key
    V2TIMString uuid;
    /// 文件显示名称
    V2TIMString filename;
    /// 文件大小
    uint64_t fileSize;

    /// 获取文件的 URL 下载地址
    void GetUrl(V2TIMValueCallback<V2TIMString> *callback);

    /**
     *  下载文件
     *
     *  DownloadFile 接口每次都会从服务端下载，如需缓存或者存储，开发者可根据 uuid 作为 key
     * 进行外部存储，ImSDK 并不会存储资源文件。
     *
     *  @param path 文件保存路径，需要外部指定
     */
    void DownloadFile(const V2TIMString &path, V2TIMDownloadCallback *callback);

    V2TIMFileElem();
    V2TIMFileElem(const V2TIMFileElem &);
    V2TIMFileElem &operator=(const V2TIMFileElem &);
    ~V2TIMFileElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         地理位置 Elem
//
/////////////////////////////////////////////////////////////////////////////////

/// 地理位置 Elem
struct TIM_API V2TIMLocationElem : public V2TIMElem {
    /// 地理位置描述信息
    V2TIMString desc;
    /// 经度，发送消息时设置
    double longitude;
    /// 纬度，发送消息时设置
    double latitude;

    V2TIMLocationElem();
    V2TIMLocationElem(const V2TIMLocationElem &);
    V2TIMLocationElem &operator=(const V2TIMLocationElem &);
    ~V2TIMLocationElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         表情消息 Elem
//
/////////////////////////////////////////////////////////////////////////////////

/// 表情消息 Elem
struct TIM_API V2TIMFaceElem : public V2TIMElem {
    /**
     *  表情索引，用户自定义
     *  1. 表情消息由 TIMFaceElem 定义，SDK 并不提供表情包，如果开发者有表情包，可使用 index
     * 存储表情在表情包中的索引，由用户自定义，或者直接使用 data 存储表情二进制信息以及字符串
     * key，都由用户自定义，SDK 内部只做透传。
     *  2. index 和 data 只需要传入一个即可，ImSDK 只是透传这两个数据。
     */
    uint32_t index;
    /// 额外数据，用户自定义
    V2TIMBuffer data;

    V2TIMFaceElem();
    V2TIMFaceElem(const V2TIMFaceElem &);
    V2TIMFaceElem &operator=(const V2TIMFaceElem &);
    ~V2TIMFaceElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         合并消息 Elem
//
/////////////////////////////////////////////////////////////////////////////////

/// 合并消息 Elem
struct TIM_API V2TIMMergerElem : public V2TIMElem {
    /// 合并消息里面又包含合并消息我们称之为合并嵌套，合并嵌套层数不能超过 100 层，
    /// 如果超过限制，layersOverLimit 为 true，title 和 abstractList 为空，DownloadMergerMessage
    /// 会返回 ERR_MERGER_MSG_LAYERS_OVER_LIMIT 错误码。
    bool layersOverLimit;
    /// 合并消息 title
    V2TIMString title;
    /// 合并消息摘要列表
    V2TIMStringVector abstractList;

    /// 下载被合并的消息列表
    void DownloadMergerMessage(V2TIMValueCallback<V2TIMMessageVector> *callback);

    V2TIMMergerElem();
    V2TIMMergerElem(const V2TIMMergerElem &);
    V2TIMMergerElem &operator=(const V2TIMMergerElem &);
    ~V2TIMMergerElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         群 Tips 消息 Elem
//
/////////////////////////////////////////////////////////////////////////////////

/// 群 tips 消息会存消息列表，群里所有的人都会展示，比如 xxx 进群，xxx 退群，xxx 群资料被修改了等
struct TIM_API V2TIMGroupTipsElem : public V2TIMElem {
    /// 群组 ID
    V2TIMString groupID;
    /// 群Tips类型
    V2TIMGroupTipsType type;
    /// 操作者群成员资料
    V2TIMGroupMemberInfo opMember;
    /// 被操作人列表
    V2TIMGroupMemberInfoVector memberList;
    /// 群信息变更（type = V2TIM_GROUP_TIPS_TYPE_INFO_CHANGE 时有效）
    V2TIMGroupChangeInfoVector groupChangeInfoList;
    /// 成员变更（type = V2TIM_GROUP_TIPS_TYPE_MEMBER_INFO_CHANGE 时有效）
    V2TIMGroupMemberChangeInfoVector memberChangeInfoList;
    /// 当前群人数（type =
    /// V2TIM_GROUP_TIPS_TYPE_INVITE、TIM_GROUP_TIPS_TYPE_QUIT_GRP、TIM_GROUP_TIPS_TYPE_KICKED
    /// 时有效）
    uint32_t memberCount;

    V2TIMGroupTipsElem();
    V2TIMGroupTipsElem(const V2TIMGroupTipsElem &);
    V2TIMGroupTipsElem &operator=(const V2TIMGroupTipsElem &);
    ~V2TIMGroupTipsElem() override;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         C2C 已读回执
//
/////////////////////////////////////////////////////////////////////////////////

struct TIM_API V2TIMMessageReceipt {
    /// C2C 消息接收对象
    V2TIMString userID;
    /// 已读回执时间，这个时间戳之前的消息都可以认为对方已读
    int64_t timestamp;

    V2TIMMessageReceipt();
    V2TIMMessageReceipt(const V2TIMMessageReceipt &);
    ~V2TIMMessageReceipt();
};

DEFINE_VECTOR(V2TIMMessageReceipt)
typedef TXV2TIMMessageReceiptVector V2TIMMessageReceiptVector;

/////////////////////////////////////////////////////////////////////////////////
//
//                         苹果 APNS 离线推送
//
/////////////////////////////////////////////////////////////////////////////////

/// 接收时不会播放声音
extern const char *const kIOSOfflinePushNoSound;
/// 接收时播放系统声音
extern const char *const kIOSOfflinePushDefaultSound;

/// 自定义消息 push。
struct TIM_API V2TIMOfflinePushInfo {
    /// 离线推送展示的标题。
    V2TIMString title;
    /// 离线推送展示的内容。
    /// 自定义消息进行离线推送，必须设置此字段内容。
    V2TIMString desc;
    /// 离线推送扩展字段，
    /// iOS: 收到离线推送的一方可以在 UIApplicationDelegate -> didReceiveRemoteNotification ->
    /// userInfo 拿到这个字段，用这个字段可以做 UI 跳转逻辑
    V2TIMString ext;
    /// 是否关闭推送（默认开启推送）。
    bool disablePush;
    /// 离线推送声音设置（仅对 iOS 生效），
    /// 当 iOSSound = kIOSOfflinePushNoSound，表示接收时不会播放声音。
    /// 当 iOSSound = kIOSOfflinePushDefaultSound，表示接收时播放系统声音。
    /// 如果要自定义 iOSSound，需要先把语音文件链接进 Xcode 工程，然后把语音文件名（带后缀）设置给
    /// iOSSound。
    V2TIMString iOSSound;
    /// 离线推送忽略 badge 计数（仅对 iOS 生效），
    /// 如果设置为 true，在 iOS 接收端，这条消息不会使 APP 的应用图标未读计数增加。
    bool ignoreIOSBadge;
    /// 离线推送设置 OPPO 手机 8.0 系统及以上的渠道 ID（仅对 Android 生效）。
    V2TIMString AndroidOPPOChannelID;
    /// 离线推送设置 VIVO 手机 （仅对 Android 生效）。
    /// VIVO 手机离线推送消息分类，0：运营消息，1：系统消息。默认取值为 1 。
    int AndroidVIVOClassification;

    V2TIMOfflinePushInfo();
    V2TIMOfflinePushInfo(const V2TIMOfflinePushInfo &);
    ~V2TIMOfflinePushInfo();
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         用户消息接收选项
//
/////////////////////////////////////////////////////////////////////////////////

struct TIM_API V2TIMReceiveMessageOptInfo {
    /// 用户 ID
    V2TIMString userID;
    /// 消息接收选项
    V2TIMReceiveMessageOpt receiveOpt;

    V2TIMReceiveMessageOptInfo();
    V2TIMReceiveMessageOptInfo(const V2TIMReceiveMessageOptInfo &);
    ~V2TIMReceiveMessageOptInfo();
};

DEFINE_VECTOR(V2TIMReceiveMessageOptInfo)
typedef TXV2TIMReceiveMessageOptInfoVector V2TIMReceiveMessageOptInfoVector;

/////////////////////////////////////////////////////////////////////////////////
//
//                         消息搜索
//
/////////////////////////////////////////////////////////////////////////////////

DEFINE_VECTOR(V2TIMElemType)
typedef TXV2TIMElemTypeVector V2TIMElemTypeVector;

/// 消息搜索参数
struct TIM_API V2TIMMessageSearchParam {
    /**
     * 关键字列表，最多支持5个。当消息发送者以及消息类型均未指定时，关键字列表必须非空；否则，关键字列表可以为空。
     */
    V2TIMStringVector keywordList;

    /**
     * 指定关键字列表匹配类型，可设置为“或”关系搜索或者“与”关系搜索.
     * 取值分别为 V2TIM_KEYWORD_LIST_MATCH_TYPE_OR 和
     * V2TIM_KEYWORD_LIST_MATCH_TYPE_AND，默认为“或”关系搜索。
     */
    V2TIMKeywordListMatchType keywordListMatchType;

    /**
     * 指定 userID 发送的消息，最多支持5个。
     */
    V2TIMStringVector senderUserIDList;

    /// 指定搜索的消息类型集合，传 nil 表示搜索支持的全部类型消息（V2TIMFaceElem 和
    /// V2TIMGroupTipsElem 不支持）取值详见 @V2TIMElemType。
    V2TIMElemTypeVector messageTypeList;

    /**
     * 搜索“全部会话”还是搜索“指定的会话”：
     * <p> 如果设置 conversationID == nil，代表搜索全部会话。
     * <p> 如果设置 conversationID != nil，代表搜索指定会话。
     */
    V2TIMString conversationID;

    /// 搜索的起始时间点。默认为0即代表从现在开始搜索。UTC 时间戳，单位：秒
    uint32_t searchTimePosition;

    /// 从起始时间点开始的过去时间范围，单位秒。默认为0即代表不限制时间范围，传24x60x60代表过去一天。
    uint32_t searchTimePeriod;

    /**
     * 分页的页号：用于分页展示查找结果，从零开始起步。
     * 比如：您希望每页展示 10 条结果，请按照如下规则调用：
     * - 首次调用：通过参数 pageSize = 10, pageIndex = 0 调用 searchLocalMessage，从结果回调中的
     * totalCount 可以获知总共有多少条结果。
     * - 计算页数：可以获知总页数：totalPage = (totalCount % pageSize == 0) ? (totalCount /
     * pageSize) : (totalCount / pageSize + 1) 。
     * - 再次调用：可以通过指定参数 pageIndex （pageIndex < totalPage）返回后续页号的结果。
     */
    uint32_t pageIndex;

    /// 每页结果数量：用于分页展示查找结果，如不希望分页可将其设置成
    /// 0，但如果结果太多，可能会带来性能问题。
    uint32_t pageSize;

    V2TIMMessageSearchParam();
    V2TIMMessageSearchParam(const V2TIMMessageSearchParam &);
    V2TIMMessageSearchParam &operator=(const V2TIMMessageSearchParam &);
    ~V2TIMMessageSearchParam();
};

struct TIM_API V2TIMMessageSearchResultItem {
    /// 会话ID
    V2TIMString conversationID;
    /// 当前会话一共搜索到了多少条符合要求的消息
    uint32_t messageCount;

    /**
     * 满足搜索条件的消息列表
     * <p>如果您本次搜索【指定会话】，那么 messageList
     * 中装载的是本会话中所有满足搜索条件的消息列表。 <p>如果您本次搜索【全部会话】，那么
     * messageList 中装载的消息条数会有如下两种可能：
     * - 如果某个会话中匹配到的消息条数 > 1，则 messageList 为空，您可以在 UI 上显示“ messageCount
     * 条相关记录”。
     * - 如果某个会话中匹配到的消息条数 = 1，则 messageList 为匹配到的那条消息，您可以在 UI
     * 上显示之，并高亮匹配关键词。
     */
    V2TIMMessageVector messageList;

    V2TIMMessageSearchResultItem();
    V2TIMMessageSearchResultItem(const V2TIMMessageSearchResultItem &);
    ~V2TIMMessageSearchResultItem();
};

DEFINE_VECTOR(V2TIMMessageSearchResultItem)
typedef TXV2TIMMessageSearchResultItemVector V2TIMMessageSearchResultItemVector;

struct TIM_API V2TIMMessageSearchResult {
    /**
     * 如果您本次搜索【指定会话】，那么返回满足搜索条件的消息总数量；
     * 如果您本次搜索【全部会话】，那么返回满足搜索条件的消息所在的所有会话总数量。
     */
    uint32_t totalCount;

    /**
     * 如果您本次搜索【指定会话】，那么返回结果列表只包含该会话结果；
     * 如果您本次搜索【全部会话】，那么对满足搜索条件的消息根据会话 ID 分组，分页返回分组结果；
     */
    V2TIMMessageSearchResultItemVector messageSearchResultItems;

    V2TIMMessageSearchResult();
    V2TIMMessageSearchResult(const V2TIMMessageSearchResult &);
    V2TIMMessageSearchResult &operator=(const V2TIMMessageSearchResult &);
    ~V2TIMMessageSearchResult();
};

/////////////////////////////////////////////////////////////////////////////////
//
//                         消息拉取
//
/////////////////////////////////////////////////////////////////////////////////

struct TIM_API V2TIMMessageListGetOption {
    /**
     * 拉取消息类型，可以设置拉取本地、云端更老或者更新的消息
     *
     * @note 请注意
     * <p>当设置从云端拉取时，会将本地存储消息列表与云端存储消息列表合并后返回。如果无网络，则直接返回本地消息列表。
     * <p>关于 getType、拉取消息的起始消息、拉取消息的时间范围 的使用说明：
     * - getType 可以用来表示拉取的方向：往消息时间更老的方向 或者 往消息时间更新的方向；
     * - lastMsg/lastMsgSeq 用来表示拉取时的起点，第一次拉取时可以不填或者填 0；
     * - getTimeBegin/getTimePeriod
     * 用来表示拉取消息的时间范围，时间范围的起止时间点与拉取方向(getType)有关；
     * -
     * 当起始消息和时间范围都存在时，结果集可理解成：「单独按起始消息拉取的结果」与「单独按时间范围拉取的结果」
     * 取交集；
     * - 当起始消息和时间范围都不存在时，结果集可理解成：从当前会话最新的一条消息开始，按照 getType
     * 所指定的方向和拉取方式拉取。
     */
    V2TIMMessageGetType getType;

    /// 拉取单聊历史消息
    V2TIMString userID;

    /// 拉取群组历史消息
    V2TIMString groupID;

    /// 拉取消息数量
    uint32_t count;

    /**
     * 拉取消息的起始消息
     *
     * @note 请注意，
     * <p>拉取 C2C 消息，只能使用 lastMsg 作为消息的拉取起点；如果没有指定
     * lastMsg，默认使用会话的最新消息作为拉取起点。 <p>拉取 Group 消息时，除了可以使用 lastMsg
     * 作为消息的拉取起点外，也可以使用 lastMsgSeq 来指定消息的拉取起点，二者的区别在于：
     * - 使用 lastMsg 作为消息的拉取起点时，返回的消息列表里不包含当前设置的 lastMsg；
     * - 使用 lastMsgSeq 作为消息拉取起点时，返回的消息列表里包含当前设置的 lastMsgSeq
     * 所表示的消息。
     *
     * @note 在拉取 Group 消息时，
     * <p>如果同时指定了 lastMsg 和 lastMsgSeq，SDK 优先使用 lastMsg 作为消息的拉取起点。
     * <p>如果 lastMsg 和 lastMsgSeq 都未指定，消息的拉取起点分为如下两种情况：
     * -  如果设置了拉取的时间范围，SDK 会根据 @getTimeBegin 所描述的时间点作为拉取起点；
     * -  如果未设置拉取的时间范围，SDK 默认使用会话的最新消息作为拉取起点。
     */
    V2TIMMessage *lastMsg;
    uint64_t lastMsgSeq;

    /**
     * 拉取消息的时间范围
     * @getTimeBegin  表示时间范围的起点；默认为 0，表示从现在开始拉取；UTC 时间戳，单位：秒
     * @getTimePeriod 表示时间范围的长度；默认为 0，表示不限制时间范围；单位：秒
     *
     * @note
     * <p> 时间范围的方向由参数 getType 决定
     * <p> 如果 getType 取 V2TIM_GET_CLOUD_OLDER_MSG/V2TIM_GET_LOCAL_OLDER_MSG，表示从 getTimeBegin
     * 开始，过去的一段时间，时间长度由 getTimePeriod 决定 <p> 如果 getType 取
     * V2TIM_GET_CLOUD_NEWER_MSG/V2TIM_GET_LOCAL_NEWER_MSG，表示从 getTimeBegin
     * 开始，未来的一段时间，时间长度由 getTimePeriod 决定 <p>
     * 取值范围区间为闭区间，包含起止时间，二者关系如下：
     * - 如果 getType 指定了朝消息时间更老的方向拉取，则时间范围表示为 [getTimeBegin-getTimePeriod,
     * getTimeBegin]
     * - 如果 getType 指定了朝消息时间更新的方向拉取，则时间范围表示为 [getTimeBegin,
     * getTimeBegin+getTimePeriod]
     */
    int64_t getTimeBegin;
    int64_t getTimePeriod;

    V2TIMMessageListGetOption();
    V2TIMMessageListGetOption(const V2TIMMessageListGetOption &);
    V2TIMMessageListGetOption &operator=(const V2TIMMessageListGetOption &);
    ~V2TIMMessageListGetOption();
};

#endif /* __V2TIM_MESSAGE_H__ */
