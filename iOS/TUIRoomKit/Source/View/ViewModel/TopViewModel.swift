//
//  TopViewModel.swift
//  TUIRoomKit
//
//  Created by janejntang on 2022/12/30.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import RTCRoomEngine

protocol TopViewModelResponder: AnyObject {
    func updateTimerLabel(text: String)
    func updateStackView(item: ButtonItemData)
    func updateMeetingNameLabel(_ text: String)
    func addStackSubview(item: ButtonItemData)
#if RTCube_APPSTORE
    func showReportView()
#endif
}

class TopViewModel: NSObject {
    private var topMenuTimer: DispatchSourceTimer?
    private(set) var viewItems: [ButtonItemData] = []
    var engineManager: EngineManager {
        return EngineManager.shared
    }
    var store: RoomStore {
        return engineManager.store
    }
    weak var viewResponder: TopViewModelResponder?
    
    var roomInfo: TUIRoomInfo {
        engineManager.store.roomInfo
    }
    var currentUser: UserEntity {
        engineManager.store.currentUser
    }
    
    override init() {
        super.init()
        createBottomData()
        initialStatus()
        subscribeUIEvent()
        updateTimerLabelText()
    }
    
    private func createBottomData() {
        let micItem = ButtonItemData()
        micItem.normalIcon = "room_earpiece"
        micItem.selectedIcon = "room_speakerphone"
        micItem.backgroundColor = UIColor(0xA3AEC7)
        micItem.resourceBundle = tuiRoomKitBundle()
        micItem.isSelect = engineManager.store.audioSetting.isSoundOnSpeaker
        micItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.switchMicItemAction(sender: button)
        }
        viewItems.append(micItem)
        let cameraItem = ButtonItemData()
        cameraItem.normalIcon = "room_switch_camera"
        cameraItem.backgroundColor = UIColor(0xA3AEC7)
        cameraItem.resourceBundle = tuiRoomKitBundle()
        cameraItem.buttonType = .switchCamaraItemType
        cameraItem.isHidden = !currentUser.hasVideoStream
        cameraItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.switchCameraItemAction(sender: button)
        }
        viewItems.append(cameraItem)
#if RTCube_APPSTORE
        injectReport()
#endif
    }
    
    private func initialStatus() {
        if engineManager.store.audioSetting.isSoundOnSpeaker {
            engineManager.setAudioRoute(isSoundOnSpeaker: true)
        } else {
            engineManager.setAudioRoute(isSoundOnSpeaker: false)
        }
    }
    
    private func subscribeUIEvent() {
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_CurrentUserHasVideoStream, responder: self)
        EngineEventCenter.shared.subscribeEngine(event: .onConferenceInfoChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onStartedRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onJoinedRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onInitialRoomInfo, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserInfoChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onInitialSelfUserInfo, observer: self)
    }
    
    private func unsubscribeUIEvent() {
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_CurrentUserHasVideoStream, responder: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onConferenceInfoChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onStartedRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onJoinedRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onInitialRoomInfo, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserInfoChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onInitialSelfUserInfo, observer: self)
    }
    
    private func switchMicItemAction(sender: UIButton) {
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_SetToolBarDelayHidden, param: ["isDelay": true])
        sender.isSelected = !sender.isSelected
        if sender.isSelected {
            engineManager.setAudioRoute(isSoundOnSpeaker: true)
        } else {
            engineManager.setAudioRoute(isSoundOnSpeaker: false)
        }
    }
    
    private func switchCameraItemAction(sender: UIButton) {
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_SetToolBarDelayHidden, param: ["isDelay": true])
        engineManager.switchCamera()
    }
    
    private func updateTimer(totalSeconds: UInt) {
        let second: UInt = totalSeconds % 60
        let minute: UInt = (totalSeconds / 60) % 60
        let hour: UInt = totalSeconds / 3_600
        var timerText: String
        if hour > 0 {
            timerText = String(format: "%.2d:%.2d:%.2d", hour, minute, second)
        } else {
            timerText = String(format: "%.2d:%.2d", minute, second)
        }
        self.viewResponder?.updateTimerLabel(text: timerText)
    }
    
    func dropDownAction(sender: UIView) {
        RoomRouter.shared.presentPopUpViewController(viewType: .roomInfoViewType, height: 290.scale375Height())
    }
    
    func exitAction(sender: UIView) {
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_ShowExitRoomView, param: [:])
    }
    
    func updateTimerLabelText() {
        let timeInterval: TimeInterval = Date().timeIntervalSince1970
        let timeStamp = Int(timeInterval)
        var totalSeconds: UInt = UInt(labs(timeStamp - store.timeStampOnEnterRoom))
        guard topMenuTimer == nil, store.isEnteredRoom else { return }
        updateTimer(totalSeconds: totalSeconds)
        topMenuTimer = DispatchSource.makeTimerSource(queue: DispatchQueue.main)
        topMenuTimer?.schedule(deadline: .now(), repeating: .seconds(1))
        topMenuTimer?.setEventHandler { [weak self] in
            guard let self = self else { return }
            totalSeconds += 1
            self.updateTimer(totalSeconds: totalSeconds)
        }
        topMenuTimer?.resume()
    }
    
    deinit {
        unsubscribeUIEvent()
        topMenuTimer?.cancel()
        topMenuTimer = nil
        debugPrint("deinit \(self)")
    }
}

extension TopViewModel: RoomKitUIEventResponder {
    func onNotifyUIEvent(key: EngineEventCenter.RoomUIEvent, Object: Any?, info: [AnyHashable : Any]?) {
        switch key {
        case .TUIRoomKitService_CurrentUserHasVideoStream:
            guard let hasVideo = info?["hasVideo"] as? Bool else { return }
            guard let item = viewItems.first(where: { $0.buttonType == .switchCamaraItemType }) else { return }
            item.isHidden = !hasVideo
            viewResponder?.updateStackView(item: item)
        default: break
        }
    }
}

extension TopViewModel: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        switch name {
        case .onConferenceInfoChanged:
            guard let conferenceInfo = param?["conferenceInfo"] as? TUIConferenceInfo else { return }
            guard let modifyFlag = param?["modifyFlag"] as? TUIConferenceModifyFlag else { return }
            guard modifyFlag.contains(.roomName) else { return }
            viewResponder?.updateMeetingNameLabel(conferenceInfo.basicRoomInfo.name)
        case .onStartedRoom, .onJoinedRoom:
            updateTimerLabelText()
        case .onInitialRoomInfo:
            guard let roomInfo = param?["roomInfo"] as? TUIRoomInfo else { return }
            viewResponder?.updateMeetingNameLabel(roomInfo.name)
        case .onUserInfoChanged:
#if RTCube_APPSTORE
            guard let modifyFlag = param?["modifyFlag"] as? TUIUserInfoModifyFlag, modifyFlag.contains(.userRole) else { return }
            guard let userInfo = param?["userInfo"] as? TUIUserInfo else { return }
            handleUserRoleChanged(userId: userInfo.userId, userRole: userInfo.userRole)
#endif
            break
        case .onInitialSelfUserInfo:
            #if RTCube_APPSTORE
            handleUserRoleChanged(userId: currentUser.userId, userRole: currentUser.userRole)
            #endif
            break
        default: break
        }
    }
}

#if RTCube_APPSTORE
extension TopViewModel {
    private func injectReport() {
        guard store.isEnteredRoom, currentUser.userRole == .generalUser else { return }
        viewItems.append(createReportItem())
    }
    
    private func createReportItem() -> ButtonItemData {
        let reportItem = ButtonItemData()
        reportItem.normalIcon = "room_report"
        reportItem.buttonType = .reportItemType
        reportItem.backgroundColor = UIColor(0xA3AEC7)
        reportItem.resourceBundle = tuiRoomKitBundle()
        reportItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.reportItemAction(sender: button)
        }
        return reportItem
    }
    
    private func reportItemAction(sender: UIButton) {
        viewResponder?.showReportView()
    }
    
    private func handleUserRoleChanged(userId: String, userRole: TUIRole) {
        guard userId == currentUser.userId else { return }
        if let item = viewItems.first(where: { $0.buttonType == .reportItemType }) {
            item.isHidden = userRole != .generalUser
            viewResponder?.updateStackView(item: item)
        } else if userRole == .generalUser {
            let reportItem = createReportItem()
            viewItems.append(reportItem)
            viewResponder?.addStackSubview(item: reportItem)
        }
    }
}
#endif

