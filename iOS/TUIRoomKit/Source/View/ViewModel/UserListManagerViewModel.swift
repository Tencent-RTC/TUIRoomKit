//
//  UserListManagerViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/2/10.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

class UserListManagerViewModel: NSObject {
    var userId: String = ""
    var userListManagerView: UserListManagerView?
    let timeoutNumber: Double = 30
    private(set) var otherUserItems: [ButtonItemData] = []//其他用户viewItem
    private(set) var currentUserItems: [ButtonItemData] = []
    private(set) var seatInviteSeatItems: [ButtonItemData] = []//已经上麦的用户viewItem
    private(set) var seatNoneInviteSeatItems: [ButtonItemData] = []//没有上麦的用户viewItem
    
    override init() {
        super.init()
        self.createUserItem()
        EngineEventCenter.shared.subscribeEngine(event: .onUserVideoStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserAudioStateChanged, observer: self)
    }
    
    deinit {
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserVideoStateChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserAudioStateChanged, observer: self)
    }
    
    func createUserItem() {
        //静音（本地静音）
        let muteLocalAudioItem = ButtonItemData()
        muteLocalAudioItem.normalTitle = .muteText
        muteLocalAudioItem.normalIcon = "room_mute_audio"
        muteLocalAudioItem.selectedTitle = .unmuteText
        muteLocalAudioItem.selectedIcon = "room_unMute_audio"
        muteLocalAudioItem.resourceBundle = tuiRoomKitBundle()
        muteLocalAudioItem.buttonType = .muteAudioItemType
        muteLocalAudioItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteLocalAudioAction(sender: button)
        }
        currentUserItems.append(muteLocalAudioItem)
        //禁画（本地禁画）
        let muteLocalVideoItem = ButtonItemData()
        muteLocalVideoItem.normalTitle = .closeVideoText
        muteLocalVideoItem.normalIcon = "room_mute_video"
        muteLocalVideoItem.selectedTitle = .openVideoText
        muteLocalVideoItem.selectedIcon = "room_unMute_video"
        muteLocalVideoItem.resourceBundle = tuiRoomKitBundle()
        muteLocalVideoItem.buttonType = .muteVideoItemType
        muteLocalVideoItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteLocalVideoAction(sender: button)
        }
        currentUserItems.append(muteLocalVideoItem)
        //静音（禁音其他用户）
        let muteAudioItem = ButtonItemData()
        muteAudioItem.normalTitle = .muteText
        muteAudioItem.normalIcon = "room_mute_audio"
        muteAudioItem.selectedTitle = .unmuteText
        muteAudioItem.selectedIcon = "room_unMute_audio"
        muteAudioItem.resourceBundle = tuiRoomKitBundle()
        muteAudioItem.buttonType = .muteAudioItemType
        muteAudioItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteAudioAction(sender: button)
        }
        otherUserItems.append(muteAudioItem)
        seatInviteSeatItems.append(muteAudioItem)
        //禁画（禁画其他用户）
        let muteVideoItem = ButtonItemData()
        muteVideoItem.normalTitle = .closeVideoText
        muteVideoItem.normalIcon = "room_mute_video"
        muteVideoItem.selectedTitle = .openVideoText
        muteVideoItem.selectedIcon = "room_unMute_video"
        muteVideoItem.resourceBundle = tuiRoomKitBundle()
        muteVideoItem.buttonType = .muteVideoItemType
        muteVideoItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteVideoAction(sender: button)
        }
        otherUserItems.append(muteVideoItem)
        seatInviteSeatItems.append(muteVideoItem)
        //邀请上台
        let inviteSeatItem = ButtonItemData()
        inviteSeatItem.normalTitle = .inviteSeatText
        inviteSeatItem.normalIcon = "room_mute_message"
        inviteSeatItem.selectedTitle = .inviteSeatText
        inviteSeatItem.selectedIcon = "room_mute_message"
        inviteSeatItem.resourceBundle = tuiRoomKitBundle()
        inviteSeatItem.buttonType = .inviteSeatItemType
        inviteSeatItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.inviteSeatAction(sender: button)
        }
        seatNoneInviteSeatItems.append(inviteSeatItem)
        //转交主持人
        let changeHostItem = ButtonItemData()
        changeHostItem.normalTitle = .changeHostText
        changeHostItem.normalIcon = "room_change_host"
        changeHostItem.selectedTitle = .changeHostText
        changeHostItem.selectedIcon = "room_change_host"
        changeHostItem.resourceBundle = tuiRoomKitBundle()
        changeHostItem.buttonType = .changeHostItemType
        changeHostItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.changeHostAction(sender: button)
        }
        otherUserItems.append(changeHostItem)
        seatInviteSeatItems.append(changeHostItem)
        seatNoneInviteSeatItems.append(changeHostItem)
        //禁言
        let muteMessageItem = ButtonItemData()
        muteMessageItem.normalTitle = .muteMessageText
        muteMessageItem.normalIcon = "room_mute_message"
        muteMessageItem.selectedTitle = .unMuteMessageText
        muteMessageItem.selectedIcon = "room_unMute_message"
        muteMessageItem.resourceBundle = tuiRoomKitBundle()
        muteMessageItem.buttonType = .muteMessageItemType
        muteMessageItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteMessageAction(sender: button)
        }
        otherUserItems.append(muteMessageItem)
        seatNoneInviteSeatItems.append(muteMessageItem)
        //请下台
        let stepDownSeatItem = ButtonItemData()
        stepDownSeatItem.normalTitle = .stepDownSeatText
        stepDownSeatItem.normalIcon = "room_mute_message"
        stepDownSeatItem.selectedTitle = .stepDownSeatText
        stepDownSeatItem.selectedIcon = "room_mute_message"
        stepDownSeatItem.resourceBundle = tuiRoomKitBundle()
        stepDownSeatItem.buttonType = .stepDownSeatItemType
        stepDownSeatItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.kickRemoteUserOffSeat(sender: button)
        }
        seatInviteSeatItems.append(stepDownSeatItem)
        //踢出房间
        let kickOutItem = ButtonItemData()
        kickOutItem.normalTitle = .kickOutRoomText
        kickOutItem.normalIcon = "room_kickOut_room"
        kickOutItem.selectedTitle = .kickOutRoomText
        kickOutItem.selectedIcon = "room_kickOut_room"
        kickOutItem.resourceBundle = tuiRoomKitBundle()
        kickOutItem.buttonType = .kickOutItemType
        kickOutItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.kickOutAction(sender: button)
        }
        otherUserItems.append(kickOutItem)
        seatInviteSeatItems.append(kickOutItem)
        seatNoneInviteSeatItems.append(kickOutItem)
    }
    
    func muteLocalAudioAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let roomEngine = EngineManager.shared.roomEngine
        if !sender.isSelected {
            roomEngine.openLocalMicrophone {
                roomEngine.startPushLocalAudio()
            } onError: { code, message in
                debugPrint("openLocalMicrophone,code:\(code),message:\(message)")
            }
        } else {
            roomEngine.closeLocalMicrophone()
            roomEngine.stopPushLocalAudio()
        }
    }
    
    func muteLocalVideoAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let roomEngine = EngineManager.shared.roomEngine
        if !sender.isSelected {
            roomEngine.openLocalCamera(isFront: true) {
                roomEngine.startPushLocalVideo()
            } onError: { code, message in
                debugPrint("openLocalCamera,code:\(code),message:\(message)")
            }
        } else {
            roomEngine.closeLocalCamera()
            roomEngine.stopPushLocalVideo()
        }
    }
    
    func muteAudioAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        guard let userInfo = EngineManager.shared.store.attendeeList.first(where: { $0.userId == userId }) else { return }
        let roomEngine = EngineManager.shared.roomEngine
        let mute = userInfo.hasAudioStream
        let view = RoomRouter.shared.currentViewController()?.view
        if mute {
            roomEngine.closeRemoteMicrophone(userId: userId) {
                userInfo.hasAudioStream = !mute
            } onError: { _, _ in
                view?.makeToast(localizedReplace(.muteAudioErrorToastText, replace: userInfo.userName))
            }
        } else {
            roomEngine.requestToOpenRemoteMicrophone(userId: userId, timeout: 30) { _, _ in
                view?.makeToast(.muteAudioSuccessToastText)
            } onRejected: { _, _, _ in
                view?.makeToast(localizedReplace(.muteAudioErrorToastText, replace: userInfo.userName))
            } onCancelled: { _, _ in
                view?.makeToast(localizedReplace(.muteAudioErrorToastText, replace: userInfo.userName))
            } onTimeout: { _, _ in
                view?.makeToast(localizedReplace(.muteAudioErrorToastText, replace: userInfo.userName))
            } onError: { _, _, _, _ in
                view?.makeToast(localizedReplace(.muteAudioErrorToastText, replace: userInfo.userName))
            }
        }
    }
    
    func muteVideoAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        guard let userInfo = EngineManager.shared.store.attendeeList.first(where: { $0.userId == userId }) else { return }
        let roomEngine = EngineManager.shared.roomEngine
        let mute = userInfo.hasVideoStream
        let view = RoomRouter.shared.currentViewController()?.view
        if mute {
            roomEngine.closeRemoteCamera(userId: userId) {
                userInfo.hasVideoStream = !mute
            } onError: { _, _ in
                view?.makeToast(localizedReplace(.muteVideoErrorToastText, replace: userInfo.userName))
            }
        } else {
            roomEngine.requestToOpenRemoteCamera(userId: userId, timeout: 30) { _, _ in
                view?.makeToast(.muteVideoSuccessToastText)
            } onRejected: { _, _, _ in
                view?.makeToast(localizedReplace(.muteVideoErrorToastText, replace: userInfo.userName))
            } onCancelled: { _, _ in
                view?.makeToast(localizedReplace(.muteVideoErrorToastText, replace: userInfo.userName))
            } onTimeout: { _, _ in
                view?.makeToast(localizedReplace(.muteVideoErrorToastText, replace: userInfo.userName))
            } onError: { _, _, _, _ in
                view?.makeToast(localizedReplace(.muteVideoErrorToastText, replace: userInfo.userName))
            }
        }
    }
    
    func inviteSeatAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        EngineManager.shared.roomEngine.requestRemoteUserOnSeat(0, userId: userId, timeout: timeoutNumber) { _, _ in
            //todo
        } onRejected: { _, _, _ in
            //todo
        } onCancelled: { _, _ in
            //todo
        } onTimeout: { _, _ in
            //todo
        } onError: { _, _, _, _ in
            //todo
        }
    }
    
    func changeHostAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let roomEngine = EngineManager.shared.roomEngine
        roomEngine.changeUserRole(userId: userId, role: .roomOwner) {
            if EngineManager.shared.store.roomInfo.enableSeatControl {
                //把主持人转交出去后，如果是举手发言房间，要下麦并且关闭摄像头和麦克风
                EngineManager.shared.roomEngine.leaveSeat {
                    EngineManager.shared.roomEngine.closeLocalCamera()
                    EngineManager.shared.roomEngine.stopPushLocalVideo()
                    EngineManager.shared.roomEngine.closeLocalMicrophone()
                    EngineManager.shared.roomEngine.stopPushLocalAudio()
                } onError: { code, message in
                    debugPrint("leaveSeat,success")
                }
            }
            debugPrint("转交主持人,success")
        } onError: { code, message in
            debugPrint("转交主持人，code,message")
        }
    }
    
    func muteMessageAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let roomEngine = EngineManager.shared.roomEngine
        if !sender.isSelected {
            roomEngine.unMuteRemoteUser(userId) {
                debugPrint("unMuteRemoteUser,success")
            } onError: { code, message in
                debugPrint("unMuteRemoteUser，code:\(code),message:\(message)")
            }
        } else {
            roomEngine.muteRemoteUser(userId, duration: 30) {
            } onError: { code, message in
                debugPrint("openLocalCamera,code:\(code),message:\(message)")
            }
        }
    }
    
    func kickRemoteUserOffSeat(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        EngineManager.shared.roomEngine.kickRemoteUserOffSeat(0, userId: userId) {
            //todo
        } onError: { code, message in
            //todo
        }
    }
    
    func kickOutAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let roomEngine = EngineManager.shared.roomEngine
        roomEngine.kickOutRemoteUser(userId) {
            //todo
        } onError: { code, message in
            //todo
        }
    }
    
    //根据用户的状态更新item数组
    func updateUserItem() {
        guard let userInfo = EngineManager.shared.store.attendeeList.first(where: { $0.userId == userId }) else { return }
        let audioItem = currentUserItems.first(where: { $0.buttonType == .muteAudioItemType})
        audioItem?.isSelect = !userInfo.hasAudioStream
        let videoItem = currentUserItems.first(where: { $0.buttonType == .muteVideoItemType})
        videoItem?.isSelect = !userInfo.hasVideoStream
        let otherAudioItem = otherUserItems.first(where: { $0.buttonType == .muteAudioItemType})
        otherAudioItem?.isSelect = !userInfo.hasAudioStream
        let otherVideoItem = otherUserItems.first(where: { $0.buttonType == .muteVideoItemType})
        otherVideoItem?.isSelect = !userInfo.hasVideoStream
        let seatInviteAudioItem = seatInviteSeatItems.first(where: { $0.buttonType == .muteAudioItemType})
        seatInviteAudioItem?.isSelect = !userInfo.hasAudioStream
        let seatInviteVideoItem = seatInviteSeatItems.first(where: { $0.buttonType == .muteVideoItemType})
        seatInviteVideoItem?.isSelect = !userInfo.hasVideoStream
        userListManagerView?.updateUI(item: self)
    }
    
    func backBlockAction(sender: UIView) {
        sender.isHidden = true
    }
}

extension UserListManagerViewModel: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        if name == .onUserAudioStateChanged {
            guard let userId = param?["userId"] as? String else { return }
            if userId == self.userId {
                updateUserItem()
            }
        }
        if name == .onUserVideoStateChanged {
            guard let userId = param?["userId"] as? String else { return }
            if userId == userId {
                updateUserItem()
            }
        }
    }
}

private extension String {
    static let muteAudioErrorToastText = localized("TUIRoom.mute.audio.error.toast")
    static let muteAudioSuccessToastText = localized("TUIRoom.mute.audio.success.toast")
    static let muteVideoErrorToastText = localized("TUIRoom.mute.video.error.toast")
    static let muteVideoSuccessToastText = localized("TUIRoom.mute.video.success.toast")
    static let muteText = localized("TUIRoom.mute")
    static let unmuteText = localized("TUIRoom.unmute")
    static let openVideoText = localized("TUIRoom.open.video")
    static let closeVideoText = localized("TUIRoom.close.video")
    static let changeHostText = localized("TUIRoom.change.host")
    static let muteMessageText = localized("TUIRoom.mute.message")
    static let unMuteMessageText = localized("TUIRoom.unmute.message")
    static let kickOutRoomText = localized("TUIRoom.kick")
    static let stepDownSeatText = localized("TUIRoom.step.down.seat")
    static let inviteSeatText = localized("TUIRoom.invite.seat")
}
