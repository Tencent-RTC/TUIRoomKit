//
//  BottomViewModel.swift
//  Alamofire
//
//  Created by aby on 2022/12/22.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine

protocol BottomViewModelResponder: AnyObject {
    func updateStackView(item: ButtonItemData, index: Int)
    func showExitRoomAlert()
    func showDestroyRoomAlert()
    func makeToast(text: String)
}

class BottomViewModel: NSObject {
    private(set) var viewItems: [ButtonItemData] = []
    private(set) var requestList: [String: String] = [:]
    let timeoutNumber: Double = 30
    weak var viewResponder: BottomViewModelResponder?
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
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_UserOnSeatChanged, responder: self)
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
        case .roomOwner:
            muteAudioItem.isSelect = !roomInfo.isOpenMicrophone
        case .generalUser:
            switch roomInfo.speechMode {
            case .freeToSpeak:
                muteAudioItem.isSelect = !roomInfo.isOpenMicrophone || roomInfo.isMicrophoneDisableForAllUser
            case .applySpeakAfterTakingSeat:
                muteAudioItem.isSelect = !roomInfo.isOpenMicrophone || !currentUser.isOnSeat || roomInfo.isMicrophoneDisableForAllUser
            default:break
            }
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
        case .roomOwner:
            muteVideoItem.isSelect = !roomInfo.isOpenCamera
        case .generalUser:
            switch roomInfo.speechMode {
            case .freeToSpeak:
                muteVideoItem.isSelect = !roomInfo.isOpenCamera || roomInfo.isCameraDisableForAllUser
            case .applySpeakAfterTakingSeat:
                muteVideoItem.isSelect = !roomInfo.isOpenCamera || !currentUser.isOnSeat || roomInfo.isCameraDisableForAllUser
            default: break
            }
        default: break
        }
        muteVideoItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.muteVideoAction(sender: button)
        }
        viewItems.append(muteVideoItem)
        if roomInfo.speechMode == .applySpeakAfterTakingSeat {
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
        let isHomeowner: Bool = currentUser.userId == roomInfo.ownerId
        if isHomeowner {
            viewResponder?.showDestroyRoomAlert()
        } else {
            viewResponder?.showExitRoomAlert()
        }
    }
    
    func exitRoomLogic(isHomeowner: Bool) {
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
        if currentUser.hasAudioStream {
            engineManager.roomEngine.closeLocalMicrophone()
            engineManager.roomEngine.stopPushLocalAudio()
            return
        }
        //如果房主全体静音，房间成员不可打开麦克风
        if self.roomInfo.isMicrophoneDisableForAllUser && self.currentUser.userRole != .roomOwner {
            viewResponder?.makeToast(text: .muteAudioRoomReasonText)
            return
        }
        // 直接打开本地的麦克风
        let openLocalMicrophoneBlock = { [weak self] in
            guard let self = self else { return }
            self.engineManager.roomEngine.openLocalMicrophone(self.engineManager.store.audioSetting.audioQuality) { [weak self] in
                guard let self = self else { return }
                self.engineManager.roomEngine.startPushLocalAudio()
            } onError: { code, message in
                debugPrint("openLocalMicrophone,code:\(code), message:\(message)")
            }
        }
        //打开本地的麦克风需要进行申请
        let applyToAdminToOpenLocalDeviceBlock = { [weak self] in
            guard let self = self else { return }
            self.engineManager.roomEngine.applyToAdminToOpenLocalDevice(device: .microphone, timeout: self.timeoutNumber) {  [weak self] _, _ in
                guard let self = self else { return }
                self.engineManager.roomEngine.startPushLocalAudio()
            } onRejected: { _, _, _ in
                //todo
            } onCancelled: { _, _ in
                //todo
            } onTimeout: { _, _ in
                //todo
            }
        }
        switch roomInfo.speechMode {
        case .freeToSpeak:
            openLocalMicrophoneBlock()
        case .applySpeakAfterTakingSeat:
            if currentUser.isOnSeat {
                openLocalMicrophoneBlock()
            } else {
                viewResponder?.makeToast(text: .muteAudioSeatReasonText)
            }
        case .applyToSpeak:
            applyToAdminToOpenLocalDeviceBlock()
        @unknown default:
            break
        }
    }
    
    func muteVideoAction(sender: UIButton) {
        if currentUser.hasVideoStream {
            engineManager.roomEngine.closeLocalCamera()
            engineManager.roomEngine.stopPushLocalVideo()
            return
        }
        //如果房主全体禁画，房间成员不可打开摄像头
        if self.roomInfo.isCameraDisableForAllUser && self.currentUser.userRole != .roomOwner {
            viewResponder?.makeToast(text: .muteVideoRoomReasonText)
            return
        }
        // 直接打开本地的摄像头
        let openLocalCameraBlock = { [weak self] in
            guard let self = self else { return }
            // FIXME: - 打开摄像头前需要先设置一个view
            self.engineManager.roomEngine.setLocalVideoView(streamType: .cameraStream, view: UIView())
            self.engineManager.roomEngine.openLocalCamera(isFront: EngineManager.shared.store.videoSetting.isFrontCamera, quality:
                                                            EngineManager.shared.store.videoSetting.videoQuality) { [weak self] in
                guard let self = self else { return }
                self.engineManager.roomEngine.startPushLocalVideo()
            } onError: { code, message in
                debugPrint("openLocalCamera,code:\(code),message:\(message)")
            }
        }
        //打开本地的摄像头需要向房主进行申请
        let applyToAdminToOpenLocalDeviceBlock = { [weak self] in
            guard let self = self else { return }
            self.engineManager.roomEngine.applyToAdminToOpenLocalDevice(device: .camera, timeout: self.timeoutNumber) {  [weak self] _, _ in
                guard let self = self else { return }
                self.engineManager.roomEngine.startPushLocalVideo()
            } onRejected: { _, _, _ in
                //todo
            } onCancelled: { _, _ in
                //todo
            } onTimeout: { _, _ in
                //todo
            }
        }
        switch roomInfo.speechMode {
        case .freeToSpeak:
            openLocalCameraBlock()
        case .applySpeakAfterTakingSeat:
            if currentUser.isOnSeat {
                openLocalCameraBlock()
            } else {
                viewResponder?.makeToast(text: .muteVideoSeatReasonText)
            }
        case .applyToSpeak:
            applyToAdminToOpenLocalDeviceBlock()
        @unknown default:
            break
        }
    }
    
    func raiseHandAction(sender: UIButton) {
        if currentUser.userRole == .roomOwner {
            RoomRouter.shared.presentPopUpViewController(viewType: .raiseHandApplicationListViewType, height: nil)
        } else {
            sender.isSelected = !sender.isSelected
            if sender.isSelected {
                let request = engineManager.roomEngine.takeSeat(-1, timeout: timeoutNumber) { [weak self] _, _ in
                    guard let self = self else { return }
                    self.currentUser.isOnSeat = true
                } onRejected: { [weak self] _, _, _ in
                    guard let self = self else { return }
                    self.requestList.removeValue(forKey: "takeSeat")
                    self.changeItemStateForRaiseHand()
                } onCancelled: { [weak self] _, _ in
                    guard let self = self else { return }
                    self.requestList.removeValue(forKey: "takeSeat")
                    self.changeItemStateForRaiseHand()
                } onTimeout: { [weak self] _, _ in
                    guard let self = self else { return }
                    self.requestList.removeValue(forKey: "takeSeat")
                    self.changeItemStateForRaiseHand()
                } onError: { [weak self] _, _, _, _ in
                    guard let self = self else { return }
                    self.requestList.removeValue(forKey: "takeSeat")
                    self.changeItemStateForRaiseHand()
                }
                requestList["takeSeat"] = request.requestId
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
        changeItemStateForRaiseHand()
    }
    
    func memberAction(sender: UIButton) {
        RoomRouter.shared.presentPopUpViewController(viewType: .userListViewType, height: nil)
    }
    
    func moreAction(sender: UIButton) {
        RoomRouter.shared.presentPopUpViewController(viewType: .moreViewType, height: 179.scale375())
    }
    
    //举手按钮变成下台状态
    private func changeItemStateForLeaveSeat() {
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
        viewResponder?.updateStackView(item: raiseHandItem, index: ViewItemNumber.raiseHandItem.rawValue)
    }
    //举手按钮变成举手状态
    private func changeItemStateForRaiseHand() {
        guard let raiseHandItem = viewItems.first(where: { $0.buttonType == .leaveSeatItemType || $0.buttonType == .raiseHandItemType })
        else { return }
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
        viewResponder?.updateStackView(item: raiseHandItem, index: ViewItemNumber.raiseHandItem.rawValue)
    }
    
    deinit {
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_UserOnSeatChanged, responder: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserRoleChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserVideoStateChanged, observer: self)
        debugPrint("deinit \(self)")
    }
}

extension BottomViewModel: RoomKitUIEventResponder {
    func onNotifyUIEvent(key: EngineEventCenter.RoomUIEvent, Object: Any?, info: [AnyHashable : Any]?) {
        if key == .TUIRoomKitService_UserOnSeatChanged && roomInfo.speechMode == .applySpeakAfterTakingSeat {
            guard let isOnSeat = info?["isOnSeat"] as? Bool else { return }
            guard let muteAudioItem = viewItems.first(where: { $0.buttonType == .muteAudioItemType }) else { return }
            muteAudioItem.isSelect = !currentUser.hasAudioStream
            viewResponder?.updateStackView(item: muteAudioItem, index: ViewItemNumber.muteAudioItem.rawValue)
            guard let muteVideoItem = viewItems.first(where: { $0.buttonType == .muteVideoItemType }) else { return }
            muteVideoItem.isSelect = !currentUser.hasVideoStream
            viewResponder?.updateStackView(item: muteVideoItem, index: ViewItemNumber.muteVideoItem.rawValue)
            //如果自己就是房主，上麦不需要更改举手发言的button
            guard currentUser.userRole != .roomOwner else { return }
            if isOnSeat {
                changeItemStateForLeaveSeat()
            } else {
                changeItemStateForRaiseHand()
            }
            
        }
    }
}

extension BottomViewModel: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        if name == .onUserRoleChanged {
            guard let userRole = param?["userRole"] as? TUIRole else { return }
            guard let userId = param?["userId"] as? String else { return }
            guard userId == currentUser.userId else { return }
            currentUser.userRole = userRole
            // 如果转换房主的时候，用户是房主
            switch userRole {
            case .roomOwner :
                changeItemStateForRaiseHand()
            case .generalUser:
                if currentUser.isOnSeat {
                    changeItemStateForLeaveSeat()
                } else {
                    changeItemStateForRaiseHand()
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
                        viewResponder?.makeToast(text: .noticeCameraOffTitleText)
                    }
                    guard let videoItem = viewItems.first(where: { $0.buttonType == .muteVideoItemType }) else { return }
                    videoItem.isSelect = !currentUser.hasVideoStream
                    viewResponder?.updateStackView(item: videoItem, index: ViewItemNumber.muteVideoItem.rawValue)
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
                    viewResponder?.makeToast(text: .noticeMicrophoneOffTitleText)
                }
                guard let audioItem = viewItems.first(where: { $0.buttonType == .muteAudioItemType }) else { return }
                audioItem.isSelect = !currentUser.hasAudioStream
                viewResponder?.updateStackView(item: audioItem, index: ViewItemNumber.muteAudioItem.rawValue)
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
    static let destroyRoomOkTitle = localized("TUIRoom.destroy.room.ok")
    static let raiseHandText = localized("TUIRoom.raise.hand")
    static let leaveSeatText = localized("TUIRoom.leave.seat")
    static let muteAudioSeatReasonText = localized("TUIRoom.mute.audio.seat.reason")
    static let muteVideoSeatReasonText = localized("TUIRoom.mute.video.seat.reason")
    static let muteAudioRoomReasonText = localized("TUIRoom.mute.audio.room.reason")
    static let muteVideoRoomReasonText = localized("TUIRoom.mute.video.room.reason")
    static let noticeCameraOffTitleText = localized("TUIRoom.homeowners.notice.camera.turned.off")
    static let noticeMicrophoneOffTitleText = localized("TUIRoom.homeowners.notice.microphone.turned.off")
}
