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
 * The current user was invited
 *
 * @param inviteID Invitation ID
 * @param inviter Inviter
 * @param type Signaling type
 * @param mute yes: Muted; no: Unmuted
*/
- (void)onInviteNotification:(NSString *)inviteID
                     inviter:(NSString *)inviter
                        type:(TUIRoomSignalingType)type
                        mute:(BOOL)mute;
/**
 * The invitation was canceled
 *
 * @param inviteID Invitation ID
 * @param inviter Canceler
 * @param type Signaling type
*/
- (void)onCancelInviteNotification:(NSString *)inviteID
                           inviter:(NSString *)inviter
                              type:(TUIRoomSignalingType)type;

/**
 * Callback for room termination, which will be received by the audience after the anchor calls `destroyRoom`
 *
*/
- (void)onRoomDestroy;

/**
 * The host was changed.
 *
 * @param previousUserId Original host
 * @param currentUserId  New host
 */
- (void)onRoomMasterChanged:(NSString *)previousUserId
              currentUserId:(NSString *)currentUserId;

/**
 * The group announcement changed
 *
 * @param roomInfo Room information
 * @param type Type
 * @param status Status
*/
- (void)onGroupNotificationChange:(TUIRoomInfo *)roomInfo
                             type:(TUIRoomSignalingType)type
                           status:(BOOL)status;

/**
 * A group text chat message was received
 *
 * @param userId User ID
 * @param message  Text chat message
*/
- (void)onRecvGroupTextMessage:(NSString *)userId
                       message:(NSString *)message;

/**
 * A new user entered the room.
 *
 * @param userInfo New member
 */
- (void)onUserEnterIMRoom:(TUIRoomUserInfo *)userInfo;

/**
 * A user exited the room.
 *
 * @param userInfo User exiting the room
 */
- (void)onUserLeaveIMRoom:(TUIRoomUserInfo *)userInfo;

@end

/**
 IM Service Delegate
 */
@interface TUIRoomIMService : NSObject

/**
 * Set callback
 *
 */
@property(nonatomic, weak) id<TUIRoomIMServiceDelegate> delegate;

/**
 * Set the user information
 *
 * @param userName Username
 * @param avatarURL User profile photo URL
 * @param callback Event callback
 */
- (void)setSelfProfile:(NSString *)userName
             avatarURL:(NSString *)avatarURL
              callback:(TUIRoomActionCallback)callback;

/**
 * Transfer the group to another user
 *
 * @param userId ID of the target user
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)transferRoomMaster:(NSString *)userId
                  callback:(TUIRoomActionCallback)callback;

/**
 * A room was created.
 *
 * @param roomInfo Room information
 * @param callback Event callback
 */
- (void)createRoom:(TUIRoomInfo *)roomInfo
          callback:(TUIRoomActionCallback)callback;

/**
 * Enter a room
 *
 * @param roomId Room ID
 * @param callback Event callback
*/
- (void)enterRoom:(NSString *)roomId
         callback:(TUIRoomActionCallback)callback;

/**
 * Exits a room
 *
 * @param callback Event callback
*/
- (void)leaveRoom:(TUIRoomActionCallback)callback;

/**
 * Terminate the room
 *
 * @param callback Event callback
*/
- (void)destroyRoom:(TUIRoomActionCallback)callback;

/**
 * Get the member list
 *
 * @return memberList
*/
- (NSArray<TUIRoomUserInfo *> *)getMemberList;

/**
 * Get the room information
 *
 * @param callback Event callback
*/
- (void)getRoomInfo:(TUIRoomRoomInfoCallback)callback;

/**
 * Invite certain users in the group
 *
 * @param roomId     Group where the invitation was initiated
 * @param inviteeList Invitee list
 * @param param     Information
 * @param callback Event callback
*/
- (void)onInviteGroup:(NSString *)roomId
          inviteeList:(NSArray *)inviteeList
                param:(NSDictionary<NSString *,id> *)param
             callback:(TUIRoomInviteeCallback)callback;

/**
 * The host invites a user to speak
 *
 * When the host calls this API to invite a member to speak, the member will receive the `onReceiveSpeechInvitation()` callback notification.
 *
 * @param userId   User ID
 * @param param     Data
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)sendSpeechInvitation:(NSString *)userId
                       param:(NSDictionary<NSString *,id> *)param
                    callback:(TUIRoomInviteeCallback)callback;

/**
 * The host cancels the invitation to speak sent to a user
 *
 * When the host calls this API to cancel the invitation to speak, the user will receive the `onReceiveInvitationCancelled()` callback notification.
 *
 * @param userId   User ID
 * @param param     Data
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)cancelSpeechInvitation:(NSString *)userId
                         param:(NSDictionary<NSString *,id> *)param
                      callback:(TUIRoomActionCallback)callback;

/**
 * A user requested to speak.
 *
 * When a user calls this API to request to speak, the host will receive the `onReceiveSpeechApplication` callback notification.
 *
 * @param userId   User ID
 * @param param     Data
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)sendSpeechApplication:(NSString *)userId
                        param:(NSDictionary<NSString *,id> *)param
                     callback:(TUIRoomInviteeCallback)callback;

/**
 * A user canceled the request to speak.
 *
 * When a user calls this API to cancel their request to speak, the host will receive the `onSpeechApplicationCancelled` callback notification.
 * @param param     Data
 * @param callback Result callback. The `code` will be 0 if the operation succeeds.
 */
- (void)cancelSpeechApplication:(NSDictionary<NSString *,id> *)param
                       callback:(TUIRoomActionCallback)callback;
    
/**
 * Invite a user in the group
 *
 * @param userId    Invitee ID
 * @param param     Information
 * @param callback Event callback
*/
- (void)onInviteUser:(NSString *)userId
               param:(NSDictionary<NSString *,id> *)param
            callback:(TUIRoomInviteeCallback)callback;

/**
 * Broadcast a text chat message in the room. This API is generally used for text chat
 *
 * @param message  Text chat message
 * @param callback Callback for the sending result
*/
- (void)sendChatMessage:(NSString *)message
               callback:(TUIRoomActionCallback)callback;

/**
 *  Update the group announcement
 * @param notification  Group announcement
 * @param callback Callback for the sending result
 */
- (void)updateGroupNotification:(NSString *)notification
                       callback:(TUIRoomActionCallback)callback;

/**
 * Accept or reject the invitation
 * @param isAgree  Whether to accept
 * @param inviteID  Invitation ID
 * @param callback Result callback
 */
- (void)acceptInvitation:(BOOL)isAgree
                inviteID:(NSString *)inviteID
                callback:(TUIRoomActionCallback)callback;

/**
 * Specify whether to enter a room
 *
 * @return yes/no
 */
- (BOOL)isEnterRoom;

/**
 * Room information
 *
 * @return roomInfo
 */
- (nullable TUIRoomInfo *)getRoomInfo;

/**
 * Release the resource
 *
 * @note Call this method with the corresponding object during `dealloc`
 */
- (void)releaseResources;

@end

NS_ASSUME_NONNULL_END
