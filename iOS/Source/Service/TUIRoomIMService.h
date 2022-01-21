//
//  TUIRoomIMService.h
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIRoomDefine.h"
#import "TUIRoomIMProtocol.h"

NS_ASSUME_NONNULL_BEGIN
/**
 IM Service Delegate
 */
@protocol TUIRoomIMServiceDelegate <NSObject>

/**
 * 被邀请回调
 *
 * @param inviteID 邀请ID
 * @param inviter 邀请者
 * @param type 信令类型
 * @param mute 是否禁用yes/no
*/
- (void)onInviteNotification:(NSString *)inviteID
                     inviter:(NSString *)inviter
                        type:(TUIRoomSignalingType)type
                        mute:(BOOL)mute;
/**
 * 邀请取消回调
 *
 * @param inviteID 邀请ID
 * @param inviter 取消者
 * @param type 信令类型
*/
- (void)onCancelInviteNotification:(NSString *)inviteID
                           inviter:(NSString *)inviter
                              type:(TUIRoomSignalingType)type;

/**
 * 房间被销毁，当主播调用destroyRoom后，观众会收到该回调
 *
*/
- (void)onRoomDestroy;

/**
 * 主持人更改回调
 *
 * @param previousUserId 更改前的主持人
 * @param currentUserId  更改后的主持人
 */
- (void)onRoomMasterChanged:(NSString *)previousUserId
              currentUserId:(NSString *)currentUserId;

/**
 * 群公告变更
 *
 * @param roomInfo 房间信息
 * @param type type
 * @param status status
*/
- (void)onGroupNotificationChange:(TUIRoomInfo *)roomInfo
                             type:(TUIRoomSignalingType)type
                           status:(BOOL)status;

/**
 * 收到群文本消息
 *
 * @param userId 用户ID
 * @param message  文本消息
*/
- (void)onRecvGroupTextMessage:(NSString *)userId
                       message:(NSString *)message;

/**
* 新成员进房回调
*
* @param userInfo 新进房成员
*/
- (void)onUserEnterIMRoom:(TUIRoomUserInfo *)userInfo;

/**
* 成员离开房间回调
*
* @param userInfo 离开房间成员
*/
- (void)onUserLeaveIMRoom:(TUIRoomUserInfo *)userInfo;

@end

/**
 IM Service Delegate
 */
@interface TUIRoomIMService : NSObject

/**
 * 设置回调
 *
 */
@property(nonatomic, weak) id<TUIRoomIMServiceDelegate> delegate;

/**
 * 设置用户信息
 *
 * @param userName userName
 * @param avatarURL avatarURL
 * @param callback 事件回调
 */
- (void)setSelfProfile:(NSString *)userName
             avatarURL:(NSString *)avatarURL
              callback:(TUIRoomActionCallback)callback;

/**
 * 将群转交给其他用户
 *
 * @param userId 转交的用户id
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)transferRoomMaster:(NSString *)userId
                  callback:(TUIRoomActionCallback)callback;

/**
 * 创建房间
 *
 * @param roomInfo roomInfo
 * @param callback 事件回调
 */
- (void)createRoom:(TUIRoomInfo *)roomInfo
          callback:(TUIRoomActionCallback)callback;

/**
 * 进入房间
 *
 * @param roomId roomId
 * @param callback 事件回调
*/
- (void)enterRoom:(NSString *)roomId
         callback:(TUIRoomActionCallback)callback;

/**
 * 退出房间
 *
 * @param callback 事件回调
*/
- (void)leaveRoom:(TUIRoomActionCallback)callback;

/**
 * 销毁房间
 *
 * @param callback 事件回调
*/
- (void)destroyRoom:(TUIRoomActionCallback)callback;

/**
 * 获取成员列表
 *
 * @return memberList
*/
- (NSArray<TUIRoomUserInfo *> *)getMemberList;

/**
 * 获取房间信息
 *
 * @param callback 事件回调
*/
- (void)getRoomInfo:(TUIRoomRoomInfoCallback)callback;

/**
 * 邀请群内的某些人
 *
 * @param roomId     发起邀请所在群组
 * @param inviteeList 被邀请人列表
 * @param param     信息
 * @param callback 事件回调
*/
- (void)onInviteGroup:(NSString *)roomId
          inviteeList:(NSArray *)inviteeList
                param:(NSDictionary<NSString *,id> *)param
             callback:(TUIRoomInviteeCallback)callback;

/**
 * 主持人邀请成员发言
 *
 * 调用该接口，主持人邀请成员发言，成员端会收到onReceiveSpeechInvitation()回调通知
 *
 * @param userId   用户ID
 * @param param     数据
 * @param callback 结果回调，成功时 code 为0
 */
- (void)sendSpeechInvitation:(NSString *)userId
                       param:(NSDictionary<NSString *,id> *)param
                    callback:(TUIRoomInviteeCallback)callback;

/**
 * 主持人取消邀请成员发言
 *
 * 调用该接口，主持人取消邀请成员发言，成员端会收到onReceiveInvitationCancelled()回调通知
 *
 * @param userId   用户ID
 * @param param     数据
 * @param callback 结果回调，成功时 code 为0
 */
- (void)cancelSpeechInvitation:(NSString *)userId
                         param:(NSDictionary<NSString *,id> *)param
                      callback:(TUIRoomActionCallback)callback;

/**
 * 成员申请发言
 *
 * 调用该接口，主持人邀请成员发言，成员端会收到onReceiveSpeechInvitation()回调通知
 *
 * @param userId   用户ID
 * @param param     数据
 * @param callback 结果回调，成功时 code 为0
 */
- (void)sendSpeechApplication:(NSString *)userId
                        param:(NSDictionary<NSString *,id> *)param
                     callback:(TUIRoomInviteeCallback)callback;

/**
 * 成员取消申请发言
 *
 * 调用该接口，成员取消申请发言，主持人端会收到onSpeechApplicationCancelled回调通知
 * @param param     数据
 * @param callback 结果回调，成功时 code 为0
 */
- (void)cancelSpeechApplication:(NSDictionary<NSString *,id> *)param
                       callback:(TUIRoomActionCallback)callback;
    
/**
 * 邀请群内的某个人
 *
 * @param userId    邀请人ID
 * @param param     信息
 * @param callback 事件回调
*/
- (void)onInviteUser:(NSString *)userId
               param:(NSDictionary<NSString *,id> *)param
            callback:(TUIRoomInviteeCallback)callback;

/**
 * 在房间中广播文本消息，一般用于文本聊天
 *
 * @param message  文本消息
 * @param callback 发送结果回调
*/
- (void)sendChatMessage:(NSString *)message
               callback:(TUIRoomActionCallback)callback;

/**
 *  更新群公告
 * @param notification  群公告
 * @param callback 发送结果回调
 */
- (void)updateGroupNotification:(NSString *)notification
                       callback:(TUIRoomActionCallback)callback;

/**
 * 同意/拒绝邀请
 * @param isAgree  是否同意
 * @param inviteID  inviteID
 * @param callback 结果回调
 */
- (void)acceptInvitation:(BOOL)isAgree
                inviteID:(NSString *)inviteID
                callback:(TUIRoomActionCallback)callback;
/**
 * 是否进入房间
 *
 * @return yes/no
 */
- (BOOL)isEnterRoom;

/**
 * 房间信息
 *
 * @return roomInfo
 */
- (nullable TUIRoomInfo *)getRoomInfo;

/**
 * 资源释放
 *
 * @note 持有此对象，在dealloc时候调用此方法
 */
- (void)releaseResources;

@end

NS_ASSUME_NONNULL_END
