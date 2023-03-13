//
//  CreateRoomViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2022/12/29.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation

class CreateRoomViewModel: NSObject {
    private(set) var inputViewItems: [ListCellItemData] = []
    private(set) var switchViewItems: [ListCellItemData] = []
    private var enableSeatControl: Bool = false
    lazy var engineManager: EngineManager = {
        return EngineManager.shared
    }()
    lazy var currentUser: UserModel = {
        return engineManager.store.currentLoginUser
    }()
    lazy var roomInfo: RoomInfo = {
        return engineManager.store.roomInfo
    }()
    lazy var roomId: String = {
        let userId = currentUser.userId
        let result = "\(String(describing: userId))_room_kit".hash & 0x3B9AC9FF
        return String(result)
    }()
    
    override init() {
        super.init()
        initialState()
        creatEntranceViewModel()
    }
    
    func initialState() {
        roomInfo.roomId = roomId
    }
    
    func creatEntranceViewModel() {
        let roomTypeItem = ListCellItemData()
        roomTypeItem.titleText = .roomTypeText
        roomTypeItem.messageText = .freedomSpeakText
        roomTypeItem.hasButton = true
        roomTypeItem.hasOverAllAction = true
        roomTypeItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UIView else { return }
            self.switchRoomTypeClick(sender: view)
        }
        inputViewItems.append(roomTypeItem)
        
        let createRoomIdItem = ListCellItemData()
        createRoomIdItem.titleText = .roomNumText
        createRoomIdItem.messageText = roomInfo.roomId
        inputViewItems.append(createRoomIdItem)
        
        let userNameItem = ListCellItemData()
        userNameItem.titleText = .userNameText
        userNameItem.messageText = currentUser.userName
        inputViewItems.append(userNameItem)
        
        let openMicItem = ListCellItemData()
        openMicItem.titleText = .openMicText
        openMicItem.hasSwitch = true
        openMicItem.isSwitchOn = roomInfo.isOpenMicrophone
        openMicItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.roomInfo.isOpenMicrophone = view.isOn
        }
        switchViewItems.append(openMicItem)
        
        let openSpeakerItem = ListCellItemData()
        openSpeakerItem.titleText = .openSpeakerText
        openSpeakerItem.hasSwitch = true
        openSpeakerItem.isSwitchOn = roomInfo.isUseSpeaker
        openSpeakerItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.roomInfo.isUseSpeaker = view.isOn
        }
        switchViewItems.append(openSpeakerItem)
        
        let openCameraItem = ListCellItemData()
        openCameraItem.titleText = .openCameraText
        openCameraItem.hasSwitch = true
        openCameraItem.isSwitchOn = roomInfo.isOpenCamera
        openCameraItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.roomInfo.isOpenCamera = view.isOn
        }
        switchViewItems.append(openCameraItem)
    }
    
    func reductRoomType() {
        guard let itemData = inputViewItems.first(where: { $0.titleText == .roomTypeText }) else { return }
        if roomInfo.enableSeatControl {
            itemData.messageText = .raiseHandSpeakText
        } else {
            itemData.messageText = .freedomSpeakText
        }
        guard let view = RoomRouter.shared.currentViewController()?.view as? CreateRoomView else { return }
        view.updateInputStackView(item: itemData, index: 0)
    }
    
    func backButtonClick(sender: UIButton) {
        RoomRouter.shared.popRoomController()
    }
    
    func enterButtonClick(sender: UIButton, view: CreateRoomView) {
        view.enterButton.isEnabled = false
        view.loading.startAnimating()
        DispatchQueue.main.asyncAfter(deadline: .now()+3, execute: {
            view.enterButton.isEnabled = true
            view.loading.stopAnimating()
        })
        roomInfo.roomId = roomId
        roomInfo.name = currentUser.userName + .videoConferenceText
        TUIRoomKit.sharedInstance.createRoom(roomInfo: roomInfo, type: .meeting)
    }
    
    func switchRoomTypeClick(sender: UIView) {
        guard let view = RoomRouter.shared.currentViewController()?.view as? CreateRoomView else { return }
        view.switchSpeakerModelView.isHidden = false
    }
    
    func cancelAction(sender: UIButton, view: RoomTypeView) {
        sender.isSelected = !sender.isSelected
        enableSeatControl = roomInfo.enableSeatControl
        view.raiseHandButton.isSelected = false
        view.freedomButton.isSelected = false
        view.isHidden = true
    }
    
    func sureAction(sender: UIButton, view: RoomTypeView) {
        sender.isSelected = !sender.isSelected
        roomInfo.enableSeatControl = enableSeatControl
        view.isHidden = true
        guard let itemData = inputViewItems.first(where: { $0.titleText == .roomTypeText }) else { return }
        if enableSeatControl {
            itemData.messageText = .raiseHandSpeakText
        } else {
            itemData.messageText = .freedomSpeakText
        }
        guard let view = RoomRouter.shared.currentViewController()?.view as? CreateRoomView else { return }
        view.updateInputStackView(item: itemData, index: 0)
    }
    
    func freedomAction(sender: UIButton, view: RoomTypeView) {
        sender.isSelected = !sender.isSelected
        view.raiseHandButton.isSelected = false
        enableSeatControl = false
    }
    
    func raiseHandAction(sender: UIButton, view: RoomTypeView) {
        sender.isSelected = !sender.isSelected
        view.freedomButton.isSelected = false
        enableSeatControl = true
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let userNameText = localized("TUIRoom.user.name")
    static let roomTypeText = localized("TUIRoom.room.type")
    static let roomNumText = localized("TUIRoom.room.num")
    static let openCameraText = localized("TUIRoom.open.video")
    static let openMicText = localized("TUIRoom.open.mic")
    static let openSpeakerText = localized("TUIRoom.open.speaker")
    static let freedomSpeakText = localized("TUIRoom.freedom.speaker")
    static let raiseHandSpeakText = localized("TUIRoom.raise.speaker")
    static let videoConferenceText = localized("TUIRoom.video.conference")
}
