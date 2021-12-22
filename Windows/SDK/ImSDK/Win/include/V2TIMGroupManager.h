// Copyright (c) 2021 Tencent. All rights reserved.

/////////////////////////////////////////////////////////////////////
//
//                     腾讯云通信服务 IMSDK
//
//   群组高级接口，里面包含了群组的高级功能，比如群成员邀请、非群成员申请进群等操作接口。
//
/////////////////////////////////////////////////////////////////////

#ifndef __V2TIM_GROUP_MANAGER_H__
#define __V2TIM_GROUP_MANAGER_H__

#include "V2TIMCallback.h"
#include "V2TIMDefine.h"
#include "V2TIMGroup.h"
#include "V2TIMListener.h"

/**
 * ## 群组高级接口，包含了群组的高级功能，例如群成员邀请、非群成员申请进群等操作接口。
 */
class TIM_API V2TIMGroupManager {
public:
    virtual ~V2TIMGroupManager() {}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                         群相关的高级接口
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 1.1 创建自定义群组（高级版本：可以指定初始的群成员）
     *
     * @param info       自定义群组信息，可以设置 groupID | groupType | groupName | notification |
     * introduction | faceURL 字段
     * @param memberList 指定初始的群成员（直播群 AVChatRoom 不支持指定初始群成员，memberList
     * 请传一个大小为 0 的 V2TIMCreateGroupMemberInfoVector）
     *
     * @note 其他限制请参考 @ref V2TIMManager.h -> CreateGroup 注释
     */
    virtual void CreateGroup(const V2TIMGroupInfo& info,
                             const V2TIMCreateGroupMemberInfoVector& memberList,
                             V2TIMValueCallback<V2TIMString>* callback) = 0;

    /**
     * 1.2 获取当前用户已经加入的群列表
     *
     * @note
     * - 直播群(AVChatRoom) 不支持该 API。
     * - 该接口有频限检测，SDK 限制调用频率为1 秒 10 次，超过限制后会报
     * ERR_SDK_COMM_API_CALL_FREQUENCY_LIMIT （7008）错误
     */
    virtual void GetJoinedGroupList(V2TIMValueCallback<V2TIMGroupInfoVector>* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //                         群资料和高级设置项
    /////////////////////////////////////////////////////////////////////////////////

    /**
     *  2.1 拉取群资料
     *
     *  @param groupIDList 群组 ID 列表
     */
    virtual void GetGroupsInfo(const V2TIMStringVector& groupIDList,
                               V2TIMValueCallback<V2TIMGroupInfoResultVector>* callback) = 0;

    /**
     * 2.2 搜索群资料（5.4.666 及以上版本支持，需要您购买旗舰版套餐）
     *
     * @param searchParam 搜索参数
     */
    virtual void SearchGroups(const V2TIMGroupSearchParam& searchParam,
                              V2TIMValueCallback<V2TIMGroupInfoVector>* callback) = 0;

    /**
     * 2.3 修改群资料
     */
    virtual void SetGroupInfo(const V2TIMGroupInfo& info, V2TIMCallback* callback) = 0;

    /**
     * 2.4 初始化群属性，会清空原有的群属性列表
     *
     * @note
     * attributes 的使用限制如下：
     *  - 目前只支持 AVChatRoom
     *  - key 最多支持16个，长度限制为32字节
     *  - value 长度限制为4k
     *  - 总的 attributes（包括 key 和 value）限制为16k
     *  - InitGroupAttributes、SetGroupAttributes、DeleteGroupAttributes 接口合并计算， SDK
     * 限制为5秒10次，超过后回调8511错误码；后台限制1秒5次，超过后返回10049错误码
     *  - GetGroupAttributes 接口 SDK 限制5秒20次
     */
    virtual void InitGroupAttributes(const V2TIMString& groupID,
                                     const V2TIMGroupAttributeMap& attributes,
                                     V2TIMCallback* callback) = 0;

    /**
     * 2.5 设置群属性。已S有该群属性则更新其 value 值，没有该群属性则添加该属性。
     * @note
     *  - 目前只支持 AVChatRoom；
     */
    virtual void SetGroupAttributes(const V2TIMString& groupID,
                                    const V2TIMGroupAttributeMap& attributes,
                                    V2TIMCallback* callback) = 0;

    /**
     * 2.6 删除指定群属性，keys 传大小为 0 的 V2TIMStringVector 则清空所有群属性。
     * @note
     *  - 目前只支持 AVChatRoom；
     */
    virtual void DeleteGroupAttributes(const V2TIMString& groupID, const V2TIMStringVector& keys,
                                       V2TIMCallback* callback) = 0;

    /**
     * 2.7 获取指定群属性，keys 传 keys 传大小为 0 的 V2TIMStringVector 则获取所有群属性。
     * @note
     *  - 目前只支持 AVChatRoom；
     */
    virtual void GetGroupAttributes(const V2TIMString& groupID, const V2TIMStringVector& keys,
                                    V2TIMValueCallback<V2TIMGroupAttributeMap>* callback) = 0;

    /**
     * 2.8 获取指定群在线人数
     *
     * @note 请注意：
     *   - 目前只支持：直播群（AVChatRoom）。
     *   - 该接口有频限检测，SDK 限制调用频率为60秒1次。
     */
    virtual void GetGroupOnlineMemberCount(const V2TIMString& groupID,
                                           V2TIMValueCallback<uint32_t>* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //                         群成员管理
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 3.1 获取群成员列表
     *
     * @param filter   指定群成员类型
     * @param nextSeq  分页拉取标志，第一次拉取填0，回调成功如果 nextSeq
     * 不为零，需要分页，传入再次拉取，直至为0。
     *
     * @note 直播群（AVChatRoom）的特殊限制：
     *  - 不支持管理员角色的拉取，群成员个数最大只支持 31
     * 个（新进来的成员会排前面），程序重启后，请重新加入群组，否则拉取群成员会报 10007 错误码。
     *  - 群成员资料信息仅支持 userID | nickName | faceURL | role 字段。
     *  - filter 字段不支持管理员角色，如果您的业务逻辑依赖于管理员角色，可以使用群自定义字段
     * groupAttributes 管理该角色。
     */
    virtual void GetGroupMemberList(const V2TIMString& groupID, uint32_t filter,
                                    long nextSeq,
                                    V2TIMValueCallback<V2TIMGroupMemberInfoResult>* callback) = 0;

    /**
     * 3.2 获取指定的群成员资料
     */
    virtual void GetGroupMembersInfo(
        const V2TIMString& groupID, V2TIMStringVector memberList,
        V2TIMValueCallback<V2TIMGroupMemberFullInfoVector>* callback) = 0;

    /**
     * 3.3 搜索群成员（5.4.666 及以上版本支持，需要您购买旗舰版套餐）
     *
     * @param param 搜索参数
     */
    virtual void SearchGroupMembers(
        const V2TIMGroupMemberSearchParam& param,
        V2TIMValueCallback<V2TIMGroupSearchGroupMembersMap>* callback) = 0;

    /**
     * 3.4 修改指定的群成员资料
     */
    virtual void SetGroupMemberInfo(const V2TIMString& groupID,
                                    const V2TIMGroupMemberFullInfo& info,
                                    V2TIMCallback* callback) = 0;

    /**
     * 3.5 禁言（只有管理员或群主能够调用）
     */
    virtual void MuteGroupMember(const V2TIMString& groupID, const V2TIMString& userID,
                                 uint32_t seconds,
                                 V2TIMCallback* callback) = 0;

    /**
     * 3.6 邀请他人入群
     *
     * @note 请注意不同类型的群有如下限制：
     * - 工作群（Work）：群里的任何人都可以邀请其他人进群。
     * - 会议群（Meeting）和公开群（Public）：只有通过rest api 使用 App
     * 管理员身份才可以邀请其他人进群。
     * - 直播群（AVChatRoom）：不支持此功能。
     */
    virtual void InviteUserToGroup(
        const V2TIMString& groupID, const V2TIMStringVector& userList,
        V2TIMValueCallback<V2TIMGroupMemberOperationResultVector>* callback) = 0;

    /**
     * 3.7 踢人
     *
     * @note 请注意不同类型的群有如下限制：
     * - 工作群（Work）：只有群主或 APP 管理员可以踢人。
     * - 公开群（Public）、会议群（Meeting）：群主、管理员和 APP 管理员可以踢人
     * - 直播群（AVChatRoom）：只支持禁言（MuteGroupMember），不支持踢人。
     */
    virtual void KickGroupMember(
        const V2TIMString& groupID, const V2TIMStringVector& memberList, const V2TIMString& reason,
        V2TIMValueCallback<V2TIMGroupMemberOperationResultVector>* callback) = 0;

    /**
     * 3.8 切换群成员的角色。
     *
     * @note 请注意不同类型的群有如下限制：
     *  -
     * 公开群（Public）和会议群（Meeting）：只有群主才能对群成员进行普通成员和管理员之间的角色切换。
     *  - 其他群不支持设置群成员角色。
     *  - 转让群组请调用 @ref TransferGroupOwner 接口。
     *  - 会议群（Meeting）切换群成员角色之后，不会有 OnGrantAdministrator 和 OnRevokeAdministrator
     * 通知回调
     *  -
     * 切换的角色支持普通群成员（V2TIM_GROUP_MEMBER_ROLE_MEMBER）和管理员（V2TIM_GROUP_MEMBER_ROLE_ADMIN）
     */
    virtual void SetGroupMemberRole(const V2TIMString& groupID, const V2TIMString& userID,
        uint32_t role, V2TIMCallback* callback) = 0;

    /**
     * 3.9 转让群主
     *
     * @note 请注意不同类型的群有如下限制：
     *  - 普通类型的群（Work、Public、Meeting）：只有群主才有权限进行群转让操作。
     *  - 直播群（AVChatRoom）：不支持转让群主。
     */
    virtual void TransferGroupOwner(const V2TIMString& groupID, const V2TIMString& userID,
                                    V2TIMCallback* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //                         加群申请
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 4.1 获取加群申请列表
     */
    virtual void GetGroupApplicationList(
        V2TIMValueCallback<V2TIMGroupApplicationResult>* callback) = 0;

    /**
     * 4.2 同意某一条加群申请
     */
    virtual void AcceptGroupApplication(const V2TIMGroupApplication& application,
                                        const V2TIMString& reason, V2TIMCallback* callback) = 0;

    /**
     * 4.3 拒绝某一条加群申请
     */
    virtual void RefuseGroupApplication(const V2TIMGroupApplication& application,
                                        const V2TIMString& reason, V2TIMCallback* callback) = 0;

    /**
     * 4.4 标记申请列表为已读
     */
    virtual void SetGroupApplicationRead(V2TIMCallback* callback) = 0;
};

#endif  // __V2TIM_GROUP_MANAGER_H__
