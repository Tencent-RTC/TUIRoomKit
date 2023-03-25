//
//  BottomViewModel.swift
//  Alamofire
//
//  Created by aby on 2022/12/22.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine

class BottomViewModel: NSObject {
    private(set) var viewItems: [ButtonItemData] = []
    private(set) var requestList: [String: String] = [:]
    let timeoutNumber: Double = 30
    weak var bottomView: BottomView?
    private enum ViewItemNumber: Int {
        case normalItem
        case muteAudioItem
        case muteVideoItem
        case raiseHandItem
        case memberItem
        case moreItem
    }
    var engineManager: EngineManager {
        EngineManager.shared
    }
    var roomInfo: RoomInfo {
        engineManager.store.roomInfo
    }
    var currentUser: UserModel {
        engineManager.store.currentUser
    }
    
    override init() {
        super.init()
        createBottomData()
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_UserOnSeat, responder: self)
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_UserDownSeat, responder: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserRoleChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserVideoStateChanged, observer: self)
    }
    
    func createBottomData() {
        //离开房间
        let exitItem = ButtonItemData()
        exitItem.normalTitle = .exitText
        exitItem.normalIcon = "room_exit"
        exitItem.backgroundColor = UIColor(0xD52E4A)
        exitItem.resourceBundle = tuiRoomKitBundle()
        exitItem.buttonType = .exitItemType
        exitItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.exitAction(sender: button)
        }
        viewItems.append(exitItem)
        // 静音
        let muteAudioItem = ButtonItemData()
        muteAudioItem.normalTitle = .muteAudioText
        muteAudioItem.normalIcon = "room_mic_on"
        muteAudioItem.selectedIcon = "room_mic_off"
        muteAudioItem.resourceBundle = tuiRoomKitBundle()
        muteAudioItem.buttonType = .muteAudioItemType
        switch currentUser.userRole {
        case .generalUser:
            muteAudioItem.isSelect = !roomInfo.isOpenMicrophone || !currentUser.isOnSeat || !roomInfo.enableAudio
        case .roomOwner:
            muteAudioItem.isSelect = !roomInfo.isOpenMicrophone
        default: break
        }
        muteAudioItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteAudioAction(sender: button)
        }
        viewItems.append(muteAudioItem)
        // 静画
        let muteVideoItem = ButtonItemData()
        muteVideoItem.normalTitle = .muteVideoText
        muteVideoItem.selectedTitle = .unMuteVideoText
        muteVideoItem.normalIcon = "room_camera_on"
        muteVideoItem.selectedIcon = "room_camera_off"
        muteVideoItem.resourceBundle = tuiRoomKitBundle()
        muteVideoItem.buttonType = .muteVideoItemType
        switch currentUser.userRole {
        case .generalUser:
            muteVideoItem.isSelect = !roomInfo.isOpenCamera || !currentUser.isOnSeat || !roomInfo.enableVideo
        case .roomOwner:
            muteVideoItem.isSelect = !roomInfo.isOpenCamera
        default: break
        }
        muteVideoItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteVideoAction(sender: button)
        }
        viewItems.append(muteVideoItem)
        
        if roomInfo.enableSeatControl {
            //举手
            let raiseHandItem = ButtonItemData()
            if currentUser.userRole == .roomOwner {
                raiseHandItem.normalTitle = .raiseHandApplyListText
            } else {
                raiseHandItem.normalTitle = .raiseHandApplyText
            }
            raiseHandItem.normalIcon = "room_hand_raise"
            raiseHandItem.selectedIcon = "room_hand_down"
            raiseHandItem.selectedTitle = .handDownText
            raiseHandItem.resourceBundle = tuiRoomKitBundle()
            raiseHandItem.buttonType = .raiseHandItemType
            raiseHandItem.action = { [weak self] sender in
                guard let self = self, let button = sender as? UIButton else { return }
                self.raiseHandAction(sender: button)
            }
            viewItems.append(raiseHandItem)
        }
        // 成员列表
        let memberItem = ButtonItemData()
        memberItem.normalTitle = .memberText
        memberItem.normalIcon = "room_member"
        memberItem.resourceBundle = tuiRoomKitBundle()
        memberItem.buttonType = .memberItemType
        memberItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.memberAction(sender: button)
        }
        viewItems.append(memberItem)
        // 更多
        let moreItem = ButtonItemData()
        moreItem.normalIcon = "room_more"
        moreItem.resourceBundle = tuiRoomKitBundle()
        moreItem.buttonType = .moreItemType
        moreItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.moreAction(sender: button)
        }
        viewItems.append(moreItem)
    }
    
    func exitAction(sender: UIButton) {
        let isHomeowner: Bool = currentUser.userId == roomInfo.owner
        if isHomeowner {
            let alertController = UIAlertController(title: .dismissMeetingTitleText, message: .appointNewHostText, preferredStyle: .actionSheet)
            let leaveRoomAction = UIAlertAction(title: .leaveMeetingText, style: .default) { _ in
                RoomRouter.shared.pushTransferMasterViewController()
            }
            let dismissRoomAction = UIAlertAction(title: .dismissMeetingText, style: .destructive) { [weak self] _ in
                guard let self = self else { return }
                self.exitRoomLogic(isHomeowner: true)
            }
            let cancelAction = UIAlertAction(title: .cancelText, style: .cancel) { _ in
            }
            alertController.addAction(leaveRoomAction)
            alertController.addAction(dismissRoomAction)
            alertController.addAction(cancelAction)
            RoomRouter.shared.presentAlert(alertController)
            
        } else {
            let alertVC = UIAlertController(title: .audienceLogoutTitle,
                                            message: nil,
                                            preferredStyle: .actionSheet)
            let cancelAction = UIAlertAction(title: .destroyRoomCancelTitle, style: .cancel, handler: nil)
            let sureAction = UIAlertAction(title: .logoutOkText, style: .default) { [weak self] _ in
                guard let self = self else { return }
                self.exitRoomLogic(isHomeowner: false)
            }
            alertVC.addAction(cancelAction)
            alertVC.addAction(sureAction)
            RoomRouter.shared.presentAlert(alertVC)
        }
    }
    
    private func exitRoomLogic(isHomeowner: Bool) {
        let roomEngine = engineManager.roomEngine
        roomEngine.stopScreenCapture()
        roomEngine.stopPushLocalVideo()
        roomEngine.stopPushLocalAudio()
        roomEngine.getTRTCCloud().setLocalVideoProcessDelegete(nil, pixelFormat: ._Texture_2D, bufferType: .texture)
        if isHomeowner {
            engineManager.destroyRoom()
        } else {
            engineManager.exitRoom()
        }
    }
    
    func muteAudioAction(sender: UIButton) {
        let roomEngine = engineManager.roomEngine
        if currentUser.hasAudioStream {
            roomEngine.closeLocalMicrophone()
            roomEngine.stopPushLocalAudio()
            return
        }
        if !roomInfo.enableAudio, currentUser.userRole != .roomOwner {
            //如果房间已经全员禁画，自己操作关闭摄像头就会使按钮处于无法点击状态，房主不会被全员禁画
            RoomRouter.makeToast(toast: .muteAudioRoomReasonText)
            return
        }
        guard currentUser.isOnSeat else {
            RoomRouter.makeToast(toast: .muteAudioSeatReasonText)
            return
        }
        roomEngine.openLocalMicrophone { [weak self] in
            guard let self = self else { return }
            self.engineManager.roomEngine.startPushLocalAudio()
        } onError: { code, message in
            debugPrint("openLocalMicrophone,code:\(code), message:\(message)")
        }
    }
    
    func muteVideoAction(sender: UIButton) {
        let roomEngine = engineManager.roomEngine
        if currentUser.hasVideoStream {
            roomEngine.closeLocalCamera()
            roomEngine.stopPushLocalVideo()
            return
        }
        if !roomInfo.enableVideo, currentUser.userRole != .roomOwner {
            //如果房间已经全员禁画，自己操作关闭摄像头就会使按钮处于无法点击状态，房主不会被全员禁画
            RoomRouter.makeToast(toast: .muteVideoRoomReasonText)
            return
        }
        guard currentUser.isOnSeat else {
            RoomRouter.makeToast(toast: .muteVideoSeatReasonText)
            return
        }
        // FIXME: - 打开摄像头前需要先设置一个view
        roomEngine.setLocalVideoView(streamType: .cameraStream, view: UIView())
        roomEngine.openLocalCamera(isFront: EngineManager.shared.store.videoSetting.isFrontCamera) { [weak self] in
            guard let self = self else { return }
            self.engineManager.roomEngine.startPushLocalVideo()
        } onError: { code, message in
            debugPrint("openLocalCamera,code:\(code),message:\(message)")
        }
    }
    
    func raiseHandAction(sender: UIButton) {
        if currentUser.userRole == .roomOwner {
            RoomRouter.shared.pushRaiseHandApplicationListViewController()
        } else {
            sender.isSelected = !sender.isSelected
            if sender.isSelected {
                let requestId = engineManager.roomEngine.takeSeat(-1, timeout: timeoutNumber) { [weak self] _, _ in
                    guard let self = self else { return }
                    self.currentUser.isOnSeat = true
                    //todo(如果上台被接受了，要变成下台)
                } onRejected: { [weak self] _, _, _ in
                    guard let self = self else { return }
                    self.requestList.removeValue(forKey: "takeSeat")
                    self.changeRaiseHandItemDownSeat()
                } onCancelled: { [weak self] _, _ in
                    guard let self = self else { return }
                    self.requestList.removeValue(forKey: "takeSeat")
                    self.changeRaiseHandItemDownSeat()
                } onTimeout: { [weak self] _, _ in
                    guard let self = self else { return }
                    self.requestList.removeValue(forKey: "takeSeat")
                    self.changeRaiseHandItemDownSeat()
                } onError: { [weak self] _, _, _, _ in
                    guard let self = self else { return }
                    self.requestList.removeValue(forKey: "takeSeat")
                    self.changeRaiseHandItemDownSeat()
                }
                requestList["takeSeat"] = requestId
            } else {
                guard let requestId = requestList["takeSeat"] else { return }
                engineManager.roomEngine.cancelRequest(requestId) {
                } onError: { code, message in
                    debugPrint("cancelRequest:code:\(code),message:\(message)")
                }
            }
        }
    }
    
    func leaveSeatAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        engineManager.roomEngine.leaveSeat {
        } onError: { code, message in
            debugPrint("leaveSeat:code:\(code),message:\(message)")
        }
        changeRaiseHandItemDownSeat()
    }
    
    func memberAction(sender: UIButton) {
        RoomRouter.shared.pushUserListViewController()
    }
    
    func moreAction(sender: UIButton) {
        RoomRouter.shared.presentPopUpViewController(viewType: .moreViewType, height: 179.scale375())
    }
    
    //用户上麦，举手发言按钮的状态更改
    private func changeRaiseHandItemOnSeat() {
        guard let raiseHandItem = viewItems.first(where: { $0.buttonType == .raiseHandItemType }) else { return }
        raiseHandItem.normalIcon = "room_leaveSeat"
        raiseHandItem.selectedIcon = "room_hand_raise"
        raiseHandItem.normalTitle = .leaveSeatText
        raiseHandItem.selectedTitle = .raiseHandText
        raiseHandItem.buttonType = .leaveSeatItemType
        raiseHandItem.resourceBundle = tuiRoomKitBundle()
        raiseHandItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.leaveSeatAction(sender: button)
        }
        bottomView?.updateStackView(item: raiseHandItem, index: ViewItemNumber.raiseHandItem.rawValue)
    }
    //用户下麦，举手发言按钮的状态更改
    private func changeRaiseHandItemDownSeat() {
        guard let raiseHandItem = viewItems.first(where: { $0.buttonType == .leaveSeatItemType }) else { return }
        raiseHandItem.normalTitle = .raiseHandApplyText
        raiseHandItem.normalIcon = "room_hand_raise"
        raiseHandItem.selectedIcon = "room_hand_down"
        raiseHandItem.selectedTitle = .handDownText
        raiseHandItem.resourceBundle = tuiRoomKitBundle()
        raiseHandItem.buttonType = .raiseHandItemType
        raiseHandItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.raiseHandAction(sender: button)
        }
        bottomView?.updateStackView(item: raiseHandItem, index: ViewItemNumber.raiseHandItem.rawValue)
    }
    //用户转成房主，举手发言按钮的状态更改
    private func changeRaiseHandItemRoomOwner() {
        guard let raiseHandItem = viewItems.first(where: { $0.buttonType == .leaveSeatItemType || $0.buttonType == .raiseHandItemType })
        else { return }
        raiseHandItem.normalTitle = .raiseHandApplyListText
        raiseHandItem.normalIcon = "room_hand_raise"
        raiseHandItem.selectedIcon = "room_hand_down"
        raiseHandItem.selectedTitle = .handDownText
        raiseHandItem.resourceBundle = tuiRoomKitBundle()
        raiseHandItem.buttonType = .raiseHandItemType
        raiseHandItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.raiseHandAction(sender: button)
        }
        bottomView?.updateStackView(item: raiseHandItem, index: ViewItemNumber.raiseHandItem.rawValue)
    }

    deinit {
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_UserOnSeat, responder: self)
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_UserDownSeat, responder: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserRoleChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserVideoStateChanged, observer: self)
        debugPrint("deinit \(self)")
    }
}

extension BottomViewModel: RoomKitUIEventResponder {
    func onNotifyUIEvent(key: EngineEventCenter.RoomUIEvent, Object: Any?, info: [AnyHashable : Any]?) {
        if key == .TUIRoomKitService_UserOnSeat && roomInfo.enableSeatControl {
            guard let muteAudioItem = viewItems.first(where: { $0.buttonType == .muteAudioItemType }) else { return }
            muteAudioItem.isSelect = true
            bottomView?.updateStackView(item: muteAudioItem, index: ViewItemNumber.muteAudioItem.rawValue)
            guard let muteVideoItem = viewItems.first(where: { $0.buttonType == .muteVideoItemType }) else { return }
            muteVideoItem.isSelect = true
            bottomView?.updateStackView(item: muteVideoItem, index: ViewItemNumber.muteVideoItem.rawValue)
            //如果自己就是房主，上麦不需要更改举手发言的button
            guard currentUser.userRole != .roomOwner else { return }
            changeRaiseHandItemOnSeat()
        }
        
        if key == .TUIRoomKitService_UserDownSeat && roomInfo.enableSeatControl {
            guard let muteAudioItem = viewItems.first(where: { $0.buttonType == .muteAudioItemType }) else { return }
            muteAudioItem.isSelect = true
            bottomView?.updateStackView(item: muteAudioItem, index: ViewItemNumber.muteAudioItem.rawValue)
            guard let muteVideoItem = viewItems.first(where: { $0.buttonType == .muteVideoItemType }) else { return }
            muteVideoItem.isSelect = true
            bottomView?.updateStackView(item: muteVideoItem, index: ViewItemNumber.muteVideoItem.rawValue)
            //如果自己就是房主，下麦不需要更改举手发言的button
            guard currentUser.userRole != .roomOwner else { return }
            changeRaiseHandItemDownSeat()
        }
    }
}

extension BottomViewModel: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        if name == .onUserRoleChanged {
            guard let userRole = param?["userRole"] as? TUIRole else { return }
            guard let userId = param?["userId"] as? String else { return }
            guard userId == currentUser.userId else { return }
            if currentUser.userRole == userRole { return }
            // 如果转换房主的时候，用户是房主
            switch userRole {
            case .roomOwner :
               changeRaiseHandItemRoomOwner()
            case .generalUser:
                if currentUser.isOnSeat {
                    changeRaiseHandItemOnSeat()
                } else {
                    changeRaiseHandItemDownSeat()
                }
            default: break
            }
        }
        if name == .onUserVideoStateChanged {
            guard let userId = param?["userId"] as? String else { return }
            guard let streamType = param?["streamType"] as? TUIVideoStreamType else { return }
            guard let hasVideo = param?["hasVideo"] as? Bool else { return }
            guard let reason = param?["reason"] as? TUIChangeReason else { return }
            switch streamType {
            case .cameraStream:
                if userId == currentUser.userId {
                    currentUser.hasVideoStream = hasVideo
                    if !hasVideo, reason == .byAdmin {
                        RoomRouter.makeToast(toast: .noticeCameraOffTitleText)
                    }
                    guard let videoItem = viewItems.first(where: { $0.buttonType == .muteVideoItemType }) else { return }
                    videoItem.isSelect = !currentUser.hasVideoStream
                    bottomView?.updateStackView(item: videoItem, index: ViewItemNumber.muteVideoItem.rawValue)
                }
            default: break
            }
        }
        if name == .onUserAudioStateChanged {
            guard let userId = param?["userId"] as? String else { return }
            guard let hasAudio = param?["hasAudio"] as? Bool else { return }
            guard let reason = param?["reason"] as? TUIChangeReason else { return }
            if userId == currentUser.userId {
                currentUser.hasAudioStream = hasAudio
                if !hasAudio, reason == .byAdmin {
                    RoomRouter.makeToast(toast: .noticeMicrophoneOffTitleText)
                }
                guard let audioItem = viewItems.first(where: { $0.buttonType == .muteAudioItemType }) else { return }
                audioItem.isSelect = !currentUser.hasAudioStream
                bottomView?.updateStackView(item: audioItem, index: ViewItemNumber.muteAudioItem.rawValue)
            }
        }
    }
}

private extension String {
    static let exitText = localized("TUIRoom.leave")
    static let muteAudioText = localized("TUIRoom.mute")
    static let muteVideoText = localized("TUIRoom.close.video")
    static let unMuteVideoText = localized("TUIRoom.open.video")
    static let memberText = localized("TUIRoom.member")
    static let raiseHandApplyText = localized("TUIRoom.raise.hand")
    static let raiseHandApplyListText = localized("TUIRoom.raise.hand.list")
    static let handDownText = localized("TUIRoom.hand.down")
    static let homeownersLogoutTitle = localized("TUIRoom.sure.destroy.room")
    static let audienceLogoutTitle = localized("TUIRoom.sure.leave.room")
    static let destroyRoomCancelTitle = localized("TUIRoom.destroy.room.cancel")
    static let destroyRoomOkTitle = localized("TUIRoom.destroy.room.ok")
    static let logoutOkText = localized("TUIRoom.ok")
    static let raiseHandText = localized("TUIRoom.raise.hand")
    static let leaveSeatText = localized("TUIRoom.leave.seat")
    static let dismissMeetingTitleText = localized("TUIRoom.dismiss.meeting.Title")
    static let appointNewHostText = localized("TUIRoom.appoint.new.host")
    static let leaveMeetingText = localized("TUIRoom.leave.meeting")
    static let dismissMeetingText = localized("TUIRoom.dismiss.meeting")
    static let cancelText = localized("TUIRoom.cancel")
    static let muteAudioSeatReasonText = localized("TUIRoom.mute.audio.seat.reason")
    static let muteVideoSeatReasonText = localized("TUIRoom.mute.video.seat.reason")
    static let muteAudioRoomReasonText = localized("TUIRoom.mute.audio.room.reason")
    static let muteVideoRoomReasonText = localized("TUIRoom.mute.video.room.reason")
    static let noticeCameraOffTitleText = localized("TUIRoom.homeowners.notice.camera.turned.off")
    static let noticeMicrophoneOffTitleText = localized("TUIRoom.homeowners.notice.microphone.turned.off")
}
