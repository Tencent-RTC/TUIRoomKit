//
//  UserListManagerViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/2/10.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine

protocol UserListManagerViewEventResponder: AnyObject {
    func makeToast(text: String)
    func showKickOutAlert(title: String, sureAction: (() ->())?)
    func showAlert(message: String)
    func setUserListManagerViewHidden(isHidden: Bool)
    func dismissView()
    func updateUI(item: ButtonItemData)
    func updateStackView(items:[ButtonItemData])
}

class UserListManagerViewModel: NSObject {
    var selectUserId: String = ""
    let timeoutNumber: Double = 0
    var userListManagerItems: [ButtonItemData] = []
    weak var viewResponder: UserListManagerViewEventResponder?
    var engineManager: EngineManager {
        EngineManager.createInstance()
    }
    var roomInfo: TUIRoomInfo {
        engineManager.store.roomInfo
    }
    var currentUser: UserEntity {
        engineManager.store.currentUser
    }
    var attendeeList: [UserEntity] {
        engineManager.store.attendeeList
    }
    private var hasOpenCameraInvite = false
    private var hasOpenMicrophoneInvite = false
    var selectUserInfo: UserEntity? {
        attendeeList.first(where: { $0.userId == selectUserId } )
    }
    
    init(selectUserId: String) {
        self.selectUserId = selectUserId
        super.init()
        createUserListManagerItems()
        subscribeEngine()
    }
    
    deinit {
        unsubscribeEngine()
        debugPrint("self:\(self)")
    }
    
    private func createUserListManagerItems() {
        //如果点击的是自己
        if currentUser.userId == selectUserId {
            createSelfManagerItems()
            return
        }
        //如果点击的不是自己，并且自己是房主
        guard let selectUserInfo = selectUserInfo else { return }
        if currentUser.userRole == .roomOwner {
            createRoomOwnerManagerItems()
        } else if currentUser.userRole == .administrator, selectUserInfo.userRole == .generalUser {
            createAdministratorManagerItems()
        }
    }
    
    private func subscribeEngine() {
        EngineEventCenter.shared.subscribeEngine(event: .onUserVideoStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onSendMessageForUserDisableChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onSeatListChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserRoleChanged, observer: self)
    }
    
    private func unsubscribeEngine() {
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserVideoStateChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onSendMessageForUserDisableChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onSeatListChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserRoleChanged, observer: self)
    }
    
    private func createSelfManagerItems() {
        userListManagerItems.append(muteLocalAudioItem)
        userListManagerItems.append(muteLocalVideoItem)
    }
    
    //生成房主的操作列表
    private func createRoomOwnerManagerItems() {
        guard let selectUserInfo = selectUserInfo else { return }
        if roomInfo.isSeatEnabled { //如果房间是举手发言房间
            if selectUserInfo.isOnSeat { //如果当前点击的用户已经上麦
                userListManagerItems.append(muteAudioItem)
                userListManagerItems.append(muteVideoItem)
                userListManagerItems.append(inviteSeatItem)
            } else {
                userListManagerItems.append(inviteSeatItem)
            }
        } else {
            userListManagerItems.append(muteAudioItem)
            userListManagerItems.append(muteVideoItem)
        }
        userListManagerItems.append(changeHostItem)
        userListManagerItems.append(setAdministratorItem)
        userListManagerItems.append(muteMessageItem)
        userListManagerItems.append(kickOutItem)
    }
    
    
    //生成管理员的操作列表
    private func createAdministratorManagerItems() {
        guard let selectUserInfo = selectUserInfo else { return }
        if roomInfo.isSeatEnabled { //如果房间是举手发言房间
            if selectUserInfo.isOnSeat { //如果当前点击的用户已经上麦
                userListManagerItems.append(muteAudioItem)
                userListManagerItems.append(muteVideoItem)
                userListManagerItems.append(inviteSeatItem)
            } else {
                userListManagerItems.append(inviteSeatItem)
            }
        } else {
            userListManagerItems.append(muteAudioItem)
            userListManagerItems.append(muteVideoItem)
        }
        userListManagerItems.append(muteMessageItem)
    }
    
    //本地静音
    private lazy var muteLocalAudioItem: ButtonItemData = {
        let item = ButtonItemData()
        item.normalTitle = .muteText
        item.normalIcon = "room_unMute_audio"
        item.selectedTitle = .unmuteText
        item.selectedIcon = "room_mute_audio"
        item.resourceBundle = tuiRoomKitBundle()
        item.buttonType = .muteAudioItemType
        item.isSelect = !currentUser.hasAudioStream
        item.hasLineView = true
        item.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteLocalAudioAction(sender: button)
        }
        return item
    }()
    
    //本地禁画
    private lazy var muteLocalVideoItem: ButtonItemData =  {
        let item = ButtonItemData()
        item.normalTitle = .closeVideoText
        item.normalIcon = "room_unMute_video"
        item.selectedTitle = .openVideoText
        item.selectedIcon = "room_mute_video"
        item.resourceBundle = tuiRoomKitBundle()
        item.buttonType = .muteVideoItemType
        item.isSelect = !currentUser.hasVideoStream
        item.hasLineView = true
        item.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteLocalVideoAction(sender: button)
        }
        return item
    }()
    
    //禁音其他用户
    private lazy var muteAudioItem: ButtonItemData = {
        let item = ButtonItemData()
        item.normalTitle = .muteText
        item.normalIcon = "room_unMute_audio"
        item.selectedTitle = .requestOpenAudioText
        item.selectedIcon = "room_mute_audio"
        item.resourceBundle = tuiRoomKitBundle()
        item.buttonType = .muteAudioItemType
        item.isSelect = !(selectUserInfo?.hasAudioStream ?? true)
        item.hasLineView = true
        item.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteAudioAction(sender: button)
        }
        return item
    }()
    
    //禁画其他用户
    private lazy var muteVideoItem: ButtonItemData = {
        let item = ButtonItemData()
        item.normalTitle = .closeVideoText
        item.normalIcon = "room_unMute_video"
        item.selectedTitle = .requestOpenVideoText
        item.selectedIcon = "room_mute_video"
        item.resourceBundle = tuiRoomKitBundle()
        item.buttonType = .muteVideoItemType
        item.isSelect = !(selectUserInfo?.hasVideoStream ?? true)
        item.hasLineView = true
        item.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteVideoAction(sender: button)
        }
        return item
    }()
    
    //邀请上台
    private lazy var inviteSeatItem: ButtonItemData = {
        let item = ButtonItemData()
        item.normalTitle = .inviteSeatText
        item.normalIcon = "room_invite_seat"
        item.selectedTitle = .stepDownSeatText
        item.selectedIcon = "room_step_down_seat"
        item.resourceBundle = tuiRoomKitBundle()
        item.buttonType = .inviteSeatItemType
        item.isSelect = selectUserInfo?.isOnSeat ?? false
        item.hasLineView = true
        item.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.inviteSeatAction(sender: button)
        }
        return item
    }()
    
    //转交主持人
    private lazy var changeHostItem: ButtonItemData = {
        let item = ButtonItemData()
        item.normalTitle = .changeHostText
        item.normalIcon = "room_change_host"
        item.selectedTitle = .changeHostText
        item.selectedIcon = "room_change_host"
        item.resourceBundle = tuiRoomKitBundle()
        item.buttonType = .changeHostItemType
        item.hasLineView = true
        item.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.changeHostAction(sender: button)
        }
        return item
    }()
    
    //禁言
    private lazy var muteMessageItem: ButtonItemData = {
        let item = ButtonItemData()
        item.normalTitle = .muteMessageText
        item.normalIcon = "room_mute_message"
        item.selectedTitle = .unMuteMessageText
        item.selectedIcon = "room_unMute_message"
        item.resourceBundle = tuiRoomKitBundle()
        item.buttonType = .muteMessageItemType
        item.isSelect = selectUserInfo?.disableSendingMessage ?? false
        item.hasLineView = true
        item.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteMessageAction(sender: button)
        }
        return item
    }()
    
    //踢出房间
    private lazy var kickOutItem: ButtonItemData = {
        let item = ButtonItemData()
        item.normalTitle = .kickOutRoomText
        item.normalIcon = "room_kickOut_room"
        item.selectedTitle = .kickOutRoomText
        item.selectedIcon = "room_kickOut_room"
        item.resourceBundle = tuiRoomKitBundle()
        item.buttonType = .kickOutItemType
        item.hasLineView = true
        item.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.kickOutAction(sender: button)
        }
        return item
    }()
    
    private lazy var setAdministratorItem: ButtonItemData = {
        let item = ButtonItemData()
        item.normalTitle = .setAsAdministratorText
        item.selectedTitle = .undoAdministratorText
        item.normalIcon = "room_set_administrator"
        item.selectedIcon = "room_undo_administrator"
        item.resourceBundle = tuiRoomKitBundle()
        item.buttonType = .setAdministratorItemType
        item.isSelect = selectUserInfo?.userRole == .administrator
        item.hasLineView = true
        item.action = {  [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.setAdministratorAction(sender: button)
        }
        return item
    }()
    
    func backBlockAction(sender: UIView) {
        sender.isHidden = true
    }
}

extension UserListManagerViewModel {
    private func muteLocalAudioAction(sender: UIButton) {
        viewResponder?.dismissView()
        if currentUser.hasAudioStream {
            engineManager.muteLocalAudio()
            return
        }
        //如果房主全体静音，房间成员不可打开麦克风
        if self.roomInfo.isMicrophoneDisableForAllUser && self.currentUser.userId != roomInfo.ownerId {
            viewResponder?.makeToast(text: .muteAudioRoomReasonText)
            return
        }
        //如果是举手发言房间，并且没有上麦，不可打开麦克风
        if roomInfo.isSeatEnabled, !currentUser.isOnSeat {
            viewResponder?.makeToast(text: .muteSeatReasonText)
            return
        }
        engineManager.unmuteLocalAudio()
        guard !engineManager.store.audioSetting.isMicOpened else { return }
        engineManager.openLocalMicrophone()
    }
    
    private func muteLocalVideoAction(sender: UIButton) {
        viewResponder?.dismissView()
        if currentUser.hasVideoStream {
            engineManager.closeLocalCamera()
            return
        }
        //如果房主全体禁画，房间成员不可打开摄像头
        if self.roomInfo.isCameraDisableForAllUser && self.currentUser.userId != roomInfo.ownerId {
            viewResponder?.makeToast(text: .muteVideoRoomReasonText)
            return
        }
        //如果是举手发言房间，并且没有上麦，不可打开摄像头
        if roomInfo.isSeatEnabled, !currentUser.isOnSeat {
            viewResponder?.makeToast(text: .muteSeatReasonText)
            return
        }
        engineManager.setLocalVideoView(streamType: .cameraStream, view: nil)
        engineManager.openLocalCamera()
    }
    
    private func muteAudioAction(sender: UIButton) {
        guard let userInfo = attendeeList.first(where: { $0.userId == selectUserId }) else { return }
        let mute = userInfo.hasAudioStream
        if mute {
            engineManager.closeRemoteDeviceByAdmin(userId: selectUserId, device: .microphone) {
                sender.isSelected = !sender.isSelected
            } onError: { [weak self] _, _ in
                guard let self = self else { return }
                self.viewResponder?.makeToast(text: localizedReplace(.muteAudioErrorToastText, replace: userInfo.userName))
            }
        } else {
            viewResponder?.makeToast(text: .invitedOpenAudioText)
            guard !hasOpenMicrophoneInvite else {
                viewResponder?.dismissView()
                return
            }
            engineManager.openRemoteDeviceByAdmin(userId: selectUserId, device: .microphone, onAccepted: { [weak self] _, _ in
                guard let self = self else { return }
                sender.isSelected = !sender.isSelected
                self.hasOpenMicrophoneInvite = false
            }, onRejected: { [weak self] _, _, _ in
                guard let self = self else { return }
                self.hasOpenMicrophoneInvite = false
                self.viewResponder?.makeToast(text: userInfo.userName + localizedReplace(.muteAudioRejectToastText, replace: userInfo.userName))
            }, onCancelled: { [weak self] _, _ in
                guard let self = self else { return }
                self.hasOpenMicrophoneInvite = false
                self.viewResponder?.makeToast(text: localizedReplace(.muteAudioErrorToastText, replace: userInfo.userName))
            }, onTimeout: { [weak self] _, _ in
                guard let self = self else { return }
                self.hasOpenMicrophoneInvite = false
                self.viewResponder?.makeToast(text: .openAudioInvitationTimeoutText)
            }) { [weak self] _, _, _, _ in
                guard let self = self else { return }
                self.hasOpenMicrophoneInvite = false
                self.viewResponder?.makeToast(text: localizedReplace(.muteAudioErrorToastText, replace: userInfo.userName))
            }
            hasOpenMicrophoneInvite = true
        }
        viewResponder?.dismissView()
    }
    
    private func muteVideoAction(sender: UIButton) {
        guard let userInfo = selectUserInfo else { return }
        let mute = userInfo.hasVideoStream
        if mute {
            engineManager.closeRemoteDeviceByAdmin(userId: selectUserId, device: .camera) { [weak self] in
                guard let _ = self else { return }
                sender.isSelected = !sender.isSelected
            } onError: { [weak self] _, _ in
                guard let self = self else { return }
                self.viewResponder?.makeToast(text: localizedReplace(.muteVideoErrorToastText, replace: userInfo.userName))
            }
        } else {
            viewResponder?.makeToast(text: .invitedOpenVideoText)
            guard !hasOpenCameraInvite else {
                viewResponder?.dismissView()
                return
            }
            engineManager.openRemoteDeviceByAdmin(userId: selectUserId, device: .camera, onAccepted: { [weak self] _, _ in
                guard let self = self else { return }
                sender.isSelected = !sender.isSelected
                self.hasOpenCameraInvite = false
            }, onRejected: { [weak self] _, _, _ in
                guard let self = self else { return }
                self.hasOpenCameraInvite = false
                self.viewResponder?.makeToast(text: userInfo.userName + localizedReplace(.muteVideoRejectToastText, replace: userInfo.userName))
            }, onCancelled: { [weak self] _, _ in
                guard let self = self else { return }
                self.hasOpenCameraInvite = false
                self.viewResponder?.makeToast(text: localizedReplace(.muteVideoErrorToastText, replace: userInfo.userName))
            }, onTimeout: { [weak self] _, _ in
                guard let self = self else { return }
                self.hasOpenCameraInvite = false
                self.viewResponder?.makeToast(text: .openVideoInvitationTimeoutText)
            }) { [weak self] _, _, _, _ in
                guard let self = self else { return }
                self.hasOpenCameraInvite = false
                self.viewResponder?.makeToast(text: localizedReplace(.muteVideoErrorToastText, replace: userInfo.userName))
            }
            hasOpenCameraInvite = true
        }
        viewResponder?.dismissView()
    }
    
    func inviteSeatAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        if sender.isSelected {
            if !engineManager.store.extendedInvitationList.contains(selectUserId) {
                engineManager.takeUserOnSeatByAdmin(userId: selectUserId, timeout: timeoutNumber) { _,_ in
                } onRejected: { [weak self] requestId, userId, message in
                    guard let self = self else { return }
                    self.viewResponder?.makeToast(text: (self.selectUserInfo?.userName ?? "") + .refusedTakeSeatInvitationText)
                } onTimeout: { [weak self] _, _ in
                    guard let self = self else { return }
                    self.viewResponder?.makeToast(text: .takeSeatInvitationTimeoutText)
                } onError: { [weak self] _, _, _, message in
                    guard let self = self else { return }
                    self.viewResponder?.makeToast(text: message)
                }
            }
            viewResponder?.makeToast(text: .invitedTakeSeatText)
        } else {
            engineManager.kickUserOffSeatByAdmin(userId: selectUserId)
        }
        viewResponder?.dismissView()
    }
    
    private func changeHostAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        engineManager.changeUserRole(userId: selectUserId, role: .roomOwner) { [weak self] in
            guard let self = self else { return }
            self.viewResponder?.showAlert(message: .haveTransferredMasterText)
            debugPrint("转交主持人,success")
        } onError: { code, message in
            debugPrint("转交主持人，code,message")
        }
        viewResponder?.dismissView()
    }
    
    private func muteMessageAction(sender: UIButton) {
        guard let userInfo = attendeeList.first(where: { $0.userId == selectUserId }) else { return }
        let isDisable = !userInfo.disableSendingMessage
        userInfo.disableSendingMessage = !userInfo.disableSendingMessage
        engineManager.disableSendingMessageByAdmin(userId: selectUserId, isDisable: isDisable)
        viewResponder?.dismissView()
    }
    
    func kickOutAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let kickOutTitle = localizedReplace(.kickOutText, replace: selectUserInfo?.userName ?? "")
        viewResponder?.showKickOutAlert(title: kickOutTitle, sureAction: { [weak self] in
            guard let self = self else { return }
            self.engineManager.kickRemoteUserOutOfRoom(userId: self.selectUserId)
            self.viewResponder?.dismissView()
        })
    }
    
    private func setAdministratorAction(sender: UIButton) {
        guard let userInfo = selectUserInfo else { return }
        let role: TUIRole = userInfo.userRole == .administrator ? .generalUser : .administrator
        //设置或者撤销管理员
        engineManager.changeUserRole(userId: selectUserId, role: role) {  [weak self] in
            guard let self = self else { return }
            let message: String = role == .administrator ? .setUpAdministratorText : .removedAdministratorText
            self.viewResponder?.showAlert(message: message)
        } onError: { code, message in
            debugPrint("changeUserRole,code:\(code),message:\(message)")
        }
        viewResponder?.dismissView()
    }
}

extension UserListManagerViewModel: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        switch name {
        case .onUserAudioStateChanged:
            guard let userId = param?["userId"] as? String else { return }
            guard let hasAudio = param?["hasAudio"] as? Bool else { return }
            guard userId == selectUserId else { return }
            if selectUserId == currentUser.userId {
                muteLocalAudioItem.isSelect = !hasAudio
                viewResponder?.updateUI(item: muteLocalAudioItem)
            } else {
                muteAudioItem.isSelect = !hasAudio
                viewResponder?.updateUI(item: muteAudioItem)
            }
        case .onUserVideoStateChanged:
            guard let userId = param?["userId"] as? String else { return }
            guard let hasVideo = param?["hasVideo"] as? Bool else { return }
            guard let streamType = param?["streamType"] as? TUIVideoStreamType else { return }
            guard userId == selectUserId, streamType == .cameraStream else { return }
            if selectUserId == currentUser.userId {
                muteLocalVideoItem.isSelect = !hasVideo
                viewResponder?.updateUI(item: muteLocalVideoItem)
            } else {
                muteVideoItem.isSelect = !hasVideo
                viewResponder?.updateUI(item: muteLocalVideoItem)
            }
        case .onSendMessageForUserDisableChanged:
            guard let userId = param?["userId"] as? String else { return }
            guard let muted = param?["muted"] as? Bool else { return }
            guard userId == selectUserId else { return }
            muteMessageItem.isSelect = !muted
            viewResponder?.updateUI(item: muteMessageItem)
        case .onSeatListChanged:
            if let seated = param?["seated"] as? [TUISeatInfo], seated.first(where: { $0.userId == selectUserId }) != nil {
                inviteSeatItem.isSelect = true
                viewResponder?.updateUI(item: inviteSeatItem)
            }
            if let left = param?["left"] as? [TUISeatInfo], left.first(where: { $0.userId == selectUserId }) != nil {
                inviteSeatItem.isSelect = false
                viewResponder?.updateUI(item: inviteSeatItem)
            }
        case .onUserRoleChanged:
            guard let userId = param?["userId"] as? String else { return }
            guard let userRole = param?["userRole"] as? TUIRole else { return }
            guard userId == currentUser.userId || userId == selectUserId else { return }
            guard currentUser.userId != selectUserId else { return }
            guard let selectUserInfo = selectUserInfo else { return }
            userListManagerItems.removeAll()
            if currentUser.userRole == .roomOwner {
                createRoomOwnerManagerItems()
                viewResponder?.updateStackView(items: userListManagerItems)
            } else if currentUser.userRole == .administrator, selectUserInfo.userRole == .generalUser {
                createAdministratorManagerItems()
                viewResponder?.updateStackView(items: userListManagerItems)
            } else {
                viewResponder?.dismissView()
            }
        default: break
        }
    }
}

private extension String {
    static var muteAudioErrorToastText: String {
        localized("TUIRoom.mute.audio.error.toast")
    }
    static var muteAudioRejectToastText: String {
        localized("TUIRoom.mute.audio.reject.toast")
    }
    static var muteVideoErrorToastText: String {
        localized("TUIRoom.mute.video.error.toast")
    }
    static var muteVideoRejectToastText: String {
        localized("TUIRoom.mute.video.reject.toast")
    }
    static var muteText: String {
        localized("TUIRoom.mute")
    }
    static var unmuteText: String {
        localized("TUIRoom.unmute")
    }
    static var requestOpenVideoText: String {
        localized("TUIRoom.request.open.video")
    }
    static var openVideoText: String {
        localized("TUIRoom.open.video")
    }
    static var requestOpenAudioText: String {
        localized("TUIRoom.request.open.audio")
    }
    static var closeVideoText: String {
        localized("TUIRoom.close.video")
    }
    static var changeHostText: String {
        localized("TUIRoom.change.host")
    }
    static var muteMessageText: String {
        localized("TUIRoom.mute.message")
    }
    static var unMuteMessageText: String {
        localized("TUIRoom.unmute.message")
    }
    static var kickOutRoomText: String {
        localized("TUIRoom.kick")
    }
    static var stepDownSeatText: String {
        localized("TUIRoom.step.down.seat")
    }
    static var inviteSeatText: String {
        localized("TUIRoom.invite.seat")
    }
    static var muteSeatReasonText: String {
        localized("TUIRoom.mute.seat.reason")
    }
    static var muteAudioRoomReasonText: String {
        localized("TUIRoom.mute.audio.room.reason")
    }
    static var muteVideoRoomReasonText: String {
        localized("TUIRoom.mute.video.room.reason")
    }
    static var invitedTakeSeatText: String {
        localized("TUIRoom.invited.take.seat")
    }
    static var refusedTakeSeatInvitationText: String {
        localized("TUIRoom.refused.take.seat.invitation")
    }
    static var takeSeatInvitationTimeoutText: String {
        localized("TUIRoom.take.seat.invitation.timeout")
    }
    static var openVideoInvitationTimeoutText: String {
        localized("TUIRoom.open.video.invitation.timeout")
    }
    static var openAudioInvitationTimeoutText: String {
        localized("TUIRoom.open.audio.invitation.timeout")
    }
    static var invitedOpenAudioText: String {
        localized("TUIRoom.invited.open.audio")
    }
    static var invitedOpenVideoText: String {
        localized("TUIRoom.invited.open.video")
    }
    static var kickOutText: String {
        localized("TUIRoom.sure.kick.out")
    }
    static var setAsAdministratorText: String {
        localized("TUIRoom.set.as.administrator")
    }
    static var undoAdministratorText: String {
        localized("TUIRoom.undo.administrator")
    }
    static var haveTransferredMasterText: String {
        localized("TUIRoom.have.transferred.master")
    }
    static var setUpAdministratorText: String {
        localized("TUIRoom.have.set.up.administrator")
    }
    static var removedAdministratorText: String {
        localized("TUIRoom.have.removed.administrator")
    }
}
