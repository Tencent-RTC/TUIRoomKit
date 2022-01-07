// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef __V2TIM_FRIENDSHIP_H__
#define __V2TIM_FRIENDSHIP_H__

#include "V2TIMCommon.h"

/////////////////////////////////////////////////////////////////////////////////
//
//                    （一）枚举值定义
//
/////////////////////////////////////////////////////////////////////////////////

/// 性别
enum V2TIMGender {
    /// 未知性别
    V2TIM_GENDER_UNKNOWN = 0,
    /// 男性
    V2TIM_GENDER_MALE = 1,
    /// 女性
    V2TIM_GENDER_FEMALE = 2,
};

/// 好友验证方式
enum V2TIMFriendAllowType {
    /// 同意任何用户加好友
    V2TIM_FRIEND_ALLOW_ANY = 0,
    /// 需要验证
    V2TIM_FRIEND_NEED_CONFIRM = 1,
    /// 拒绝任何人加好友
    V2TIM_FRIEND_DENY_ANY = 2,
};

/// 好友申请类型
enum V2TIMFriendApplicationType {
    /// 别人发给我的
    V2TIM_FRIEND_APPLICATION_COME_IN = 1,
    /// 我发给别人的
    V2TIM_FRIEND_APPLICATION_SEND_OUT = 2,
    /// 别人发给我的 和 我发给别人的。仅拉取时有效
    V2TIM_FRIEND_APPLICATION_BOTH = 3,
};

/// 好友类型
enum V2TIMFriendType {
    /// 单向好友
    V2TIM_FRIEND_TYPE_SINGLE = 1,
    /// 双向好友
    V2TIM_FRIEND_TYPE_BOTH = 2,
};

/// 好友关系类型
enum V2TIMFriendRelationType {
    /// 不是好友
    V2TIM_FRIEND_RELATION_TYPE_NONE = 0x0,
    /// 对方在我的好友列表中
    V2TIM_FRIEND_RELATION_TYPE_IN_MY_FRIEND_LIST = 0x1,
    /// 我在对方的好友列表中
    V2TIM_FRIEND_RELATION_TYPE_IN_OTHER_FRIEND_LIST = 0x2,
    /// 互为好友
    V2TIM_FRIEND_RELATION_TYPE_BOTH_WAY = 0x3,
};

/// 好友申请接受类型
enum V2TIMFriendAcceptType {
    /// 接受加好友（建立单向好友）
    V2TIM_FRIEND_ACCEPT_AGREE = 0,
    /// 接受加好友并加对方为好友（建立双向好友）
    V2TIM_FRIEND_ACCEPT_AGREE_AND_ADD = 1,
};

// 用户资料修改标记
enum V2TIMUserInfoModifyFlag {
    // 未定义
    V2TIM_USER_INFO_MODIFY_FLAG_UNKNOWN = 0,
    // 昵称
    V2TIM_USER_INFO_MODIFY_FLAG_NICK = 1,
    // 头像
    V2TIM_USER_INFO_MODIFY_FLAG_FACE_URL = 2,
    // 性别
    V2TIM_USER_INFO_MODIFY_FLAG_GENDER = 3,
    // 生日
    V2TIM_USER_INFO_MODIFY_FLAG_BIRTHDAY = 4,
    // 修改签名
    V2TIM_USER_INFO_MODIFY_FLAG_SELF_SIGNATURE = 7,
    // 等级
    V2TIM_USER_INFO_MODIFY_FLAG_LEVEL = 8,
    // 角色
    V2TIM_USER_INFO_MODIFY_FLAG_ROLE = 9,
    // 好友验证方式
    V2TIM_USER_INFO_MODIFY_FLAG_ALLOW_TYPE = 10,
    // 自定义字段
    V2TIM_USER_INFO_MODIFY_FLAG_CUSTOM = 11,
};

// 好友资料修改标记
enum V2TIMFriendInfoModifyFlag {
    // 未定义
    V2TIM_FRIEND_INFO_MODIFY_FLAG_UNKNOWN = 0,
    // 好友备注
    V2TIM_FRIEND_INFO_MODIFY_FLAG_REMARK = 1,
    // 好友自定义字段
    V2TIM_FRIEND_INFO_MODIFY_FLAG_CUSTOM = 2,
};

/////////////////////////////////////////////////////////////////////////////////
//
//                     （二）结构体定义
//
/////////////////////////////////////////////////////////////////////////////////

/// 用户基本资料
struct TIM_API V2TIMUserInfo {
    /// 用户 ID
    V2TIMString userID;
    /// 用户昵称
    V2TIMString nickName;
    /// 用户头像
    V2TIMString faceURL;

    V2TIMUserInfo();
    V2TIMUserInfo(const V2TIMUserInfo& userInfo);
    virtual ~V2TIMUserInfo();
};

/// 用户详细资料
struct TIM_API V2TIMUserFullInfo : public V2TIMUserInfo {
    /// 用户签名
    V2TIMString selfSignature;
    /// 用户性别
    V2TIMGender gender;
    /// 用户角色
    uint32_t role;
    /// 用户等级
    uint32_t level;
    /// 出生日期
    uint32_t birthday;
    /// 用户好友验证方式
    V2TIMFriendAllowType allowType;
    /// 用户自定义字段
    /// 首先要在 [控制台](https://console.cloud.tencent.com/im) (功能配置 -> 用户自定义字段)
    /// 配置用户自定义字段，然后再调用该接口进行设置，key 值不需要加 Tag_Profile_Custom_ 前缀。
    V2TIMCustomInfo customInfo;
    // 用户资料修改标记位
    // 枚举 V2TIMUserInfoModifyFlag 列出哪些字段支持修改，如果您修改用户资料，请设置这个字段值
    // 支持同时修改多个字段，多个枚举值按位或 | 组合，例如，同时修改用户昵称和用户签名
    // info.nickName = "new nickname";
    // info.selfSignature = "new self signature";
    // info.modifyFlag = V2TIM_USER_INFO_MODIFY_FLAG_NICK | V2TIM_USER_INFO_MODIFY_FLAG_SELF_SIGNATURE;
    uint32_t modifyFlag;

    V2TIMUserFullInfo();
    V2TIMUserFullInfo(const V2TIMUserFullInfo& userFullInfo);
    ~V2TIMUserFullInfo() override;
};

DEFINE_VECTOR(V2TIMUserFullInfo)
typedef TXV2TIMUserFullInfoVector V2TIMUserFullInfoVector;

/// 好友资料
struct TIM_API V2TIMFriendInfo {
    /// 好友 ID
    V2TIMString userID;
    /// 好友备注
    /// 备注长度最长不得超过 96 个字节;
    /// 字段描述详见
    /// [控制台](https://cloud.tencent.com/document/product/269/1501#.E6.A0.87.E9.85.8D.E5.A5.BD.E5.8F.8B.E5.AD.97.E6.AE.B5)。
    V2TIMString friendRemark;
    /// 好友自定义字段
    /// 首先要在 [控制台](https://console.cloud.tencent.com/im) (功能配置 -> 好友自定义字段)
    /// 配置好友自定义字段，然后再调用该接口进行设置，key 值不需要加 Tag_SNS_Custom_ 前缀。
    V2TIMCustomInfo friendCustomInfo;
    /// 好友所在分组列表
    /// - 最多支持 32 个分组；
    /// - 不允许分组名为空；
    /// - 分组名长度不得超过 30 个字节；
    /// - 同一个好友可以有多个不同的分组。
    /// - 字段描述详见
    /// [控制台](https://cloud.tencent.com/document/product/269/1501#.E6.A0.87.E9.85.8D.E5.A5.BD.E5.8F.8B.E5.AD.97.E6.AE.B5)。
    V2TIMStringVector friendGroups;
    /// 好友个人资料
    V2TIMUserFullInfo userFullInfo;
    // 用户资料修改标记位
    // 枚举 V2TIMFriendInfoModifyFlag 列出哪些字段支持修改，如果您修改好友资料，请设置这个字段值
    // 支持同时修改多个字段，多个枚举值按位或 | 组合，例如，同时修改好友备注和好友自定义字段
    // info.friendRemark = "new friend remark";
    // info.friendCustomInfo = friendCustomInfo;
    // info.modifyFlag = V2TIM_FRIEND_INFO_MODIFY_FLAG_REMARK | V2TIM_FRIEND_INFO_MODIFY_FLAG_CUSTOM;
    uint32_t modifyFlag;

    V2TIMFriendInfo();
    V2TIMFriendInfo(const V2TIMFriendInfo& friendInfo);
    ~V2TIMFriendInfo();
};

DEFINE_VECTOR(V2TIMFriendInfo)
typedef TXV2TIMFriendInfoVector V2TIMFriendInfoVector;

/// 好友资料获取结果
struct TIM_API V2TIMFriendInfoResult {
    /// 返回码
    int resultCode;
    /// 返结果表述
    V2TIMString resultInfo;
    /// 好友类型
    V2TIMFriendRelationType relation;
    /// 好友个人资料，如果不是好友，除了 userID 字段，其他字段都为空
    V2TIMFriendInfo friendInfo;

    V2TIMFriendInfoResult();
    V2TIMFriendInfoResult(const V2TIMFriendInfoResult& friendInfoResult);
    ~V2TIMFriendInfoResult();
};

DEFINE_VECTOR(V2TIMFriendInfoResult)
typedef TXV2TIMFriendInfoResultVector V2TIMFriendInfoResultVector;

/// 加好友
struct TIM_API V2TIMFriendAddApplication {
    /// 用户 userID（必填）
    V2TIMString userID;
    /// 备注（备注最大96字节）
    V2TIMString friendRemark;
    /// 预分组名（最大96字节）
    V2TIMString friendGroup;
    /// 请求说明（最大120字节）
    V2TIMString addWording;
    /// 添加来源
    V2TIMString addSource;
    /// 加好友方式
    V2TIMFriendType addType;

    V2TIMFriendAddApplication();
    V2TIMFriendAddApplication(const V2TIMFriendAddApplication& friendAddApplication);
    ~V2TIMFriendAddApplication();
};

/// 好友申请
struct TIM_API V2TIMFriendApplication {
    /// 用户标识
    V2TIMString userID;
    /// 用户昵称
    V2TIMString nickName;
    /// 用户头像
    V2TIMString faceUrl;
    /// 添加时间
    uint64_t addTime;
    /// 来源
    V2TIMString addSource;
    /// 加好友附言
    V2TIMString addWording;
    /// 好友申请类型
    V2TIMFriendApplicationType type;

    V2TIMFriendApplication();
    V2TIMFriendApplication(const V2TIMFriendApplication& friendApplication);
    ~V2TIMFriendApplication();
};

DEFINE_VECTOR(V2TIMFriendApplication)
typedef TXV2TIMFriendApplicationVector V2TIMFriendApplicationVector;

/// 好友申请列表
struct TIM_API V2TIMFriendApplicationResult {
    /// 好友申请未读数量
    uint64_t unreadCount;
    /// 好友申请列表
    V2TIMFriendApplicationVector applicationList;

    V2TIMFriendApplicationResult();
    V2TIMFriendApplicationResult(const V2TIMFriendApplicationResult& friendApplicationResult);
    ~V2TIMFriendApplicationResult();
};

/// 好友关系链检查结果
struct TIM_API V2TIMFriendCheckResult {
    /// 用户id
    V2TIMString userID;
    /// 返回码
    int32_t resultCode;
    /// 返回信息
    V2TIMString resultInfo;
    /// 检查结果
    V2TIMFriendRelationType relationType;

    V2TIMFriendCheckResult();
    V2TIMFriendCheckResult(const V2TIMFriendCheckResult& friendCheckResult);
    ~V2TIMFriendCheckResult();
};

DEFINE_VECTOR(V2TIMFriendCheckResult)
typedef TXV2TIMFriendCheckResultVector V2TIMFriendCheckResultVector;

/// 好友操作结果（添加、删除、加黑名单、添加分组等）
struct TIM_API V2TIMFriendOperationResult {
    /// 用户Id
    V2TIMString userID;
    /// 返回码
    int32_t resultCode;
    /// 返回信息
    V2TIMString resultInfo;

    V2TIMFriendOperationResult();
    V2TIMFriendOperationResult(const V2TIMFriendOperationResult& friendOperationResult);
    ~V2TIMFriendOperationResult();
};

DEFINE_VECTOR(V2TIMFriendOperationResult)
typedef TXV2TIMFriendOperationResultVector V2TIMFriendOperationResultVector;

/// 好友分组
struct TIM_API V2TIMFriendGroup {
    /// 好友分组名称
    V2TIMString groupName;
    /// 分组成员数量
    uint64_t userCount;
    /// 分组成员列表
    V2TIMStringVector friendList;

    V2TIMFriendGroup();
    V2TIMFriendGroup(const V2TIMFriendGroup& friendGroup);
    ~V2TIMFriendGroup();
};

DEFINE_VECTOR(V2TIMFriendGroup)
typedef TXV2TIMFriendGroupVector V2TIMFriendGroupVector;

// 好友搜索
struct TIM_API V2TIMFriendSearchParam {
    /// 搜索的关键字列表，关键字列表最多支持 5 个
    V2TIMStringVector keywordList;
    /// 设置是否搜索 userID
    bool isSearchUserID;
    /// 是否设置搜索昵称
    bool isSearchNickName;
    /// 是否设置搜索备注
    bool isSearchRemark;

    V2TIMFriendSearchParam();
    V2TIMFriendSearchParam(const V2TIMFriendSearchParam& friendSearchParam);
    ~V2TIMFriendSearchParam();
};

#endif /* __V2TIM_FRIENDSHIP_H__ */
