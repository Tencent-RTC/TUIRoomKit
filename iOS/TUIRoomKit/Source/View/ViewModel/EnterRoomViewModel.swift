//
//  EnterRoomViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/9.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

class EnterRoomViewModel: NSObject {
    private var isOpenCamera: Bool = true
    private var isOpenMicrophone: Bool = true
    private var isUseSpeaker: Bool = true
    private var fieldText: String = ""
    
    private(set) var inputViewItems: [ListCellItemData] = []
    private(set) var switchViewItems: [ListCellItemData] = []
    private var enableSeatControl: Bool = false
    
    override init() {
        super.init()
        creatEntranceViewModel()
    }
    
    func creatEntranceViewModel() {
        let enterRoomIdItem = ListCellItemData()
        enterRoomIdItem.titleText = .roomNumText
        enterRoomIdItem.fieldEnable = true
        enterRoomIdItem.hasFieldView = true
        enterRoomIdItem.fieldPlaceholderText = .placeholderTipsText
        enterRoomIdItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UITextField else { return }
            self.fieldText = view.text ?? ""
        }
        inputViewItems.append(enterRoomIdItem)
        
        let userNameItem = ListCellItemData()
        userNameItem.titleText = .userNameText
        userNameItem.messageText = EngineManager.shared.store.currentUser.userName
        inputViewItems.append(userNameItem)
        
        let openMicItem = ListCellItemData()
        openMicItem.titleText = .openMicText
        openMicItem.hasSwitch = true
        openMicItem.isSwitchOn = EngineManager.shared.store.roomInfo.isOpenMicrophone
        openMicItem.action = {[weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.isOpenMicrophone = view.isOn
        }
        switchViewItems.append(openMicItem)
        
        let openSpeakerItem = ListCellItemData()
        openSpeakerItem.titleText = .openSpeakerText
        openSpeakerItem.hasSwitch = true
        openSpeakerItem.isSwitchOn = EngineManager.shared.store.roomInfo.isUseSpeaker
        openSpeakerItem.action = {[weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.isUseSpeaker = view.isOn
        }
        switchViewItems.append(openSpeakerItem)
        
        let openCameraItem = ListCellItemData()
        openCameraItem.titleText = .openCameraText
        openCameraItem.hasSwitch = true
        openCameraItem.isSwitchOn = EngineManager.shared.store.roomInfo.isOpenCamera
        openCameraItem.action = {[weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.isOpenCamera = view.isOn
        }
        switchViewItems.append(openCameraItem)
    }
    
    func backButtonClick(sender: UIButton) {
        RoomRouter.shared.popRoomController()
    }
    
    func enterButtonClick(sender: UIButton, view: EnterRoomView) {
        let roomInfo = EngineManager.shared.store.roomInfo
        roomInfo.isOpenCamera = isOpenCamera
        roomInfo.isOpenMicrophone = isOpenMicrophone
        roomInfo.isUseSpeaker = isUseSpeaker
        TUIRoomKit.sharedInstance.addListener(listener: self)
        view.enterButton.isEnabled = false
        view.loading.startAnimating()
        DispatchQueue.main.asyncAfter(deadline: .now()+3, execute: {
            view.enterButton.isEnabled = true
            view.loading.stopAnimating()
        })
        if fieldText.count <= 0 {
            view.makeToast(.enterRoomIdErrorToast)
            return
        }
        let roomIDStr = fieldText
            .replacingOccurrences(of: " ",
                                  with: "",
                                  options: .literal,
                                  range: nil)
        if roomIDStr.count <= 0 {
            view.makeToast(.enterRoomIdErrorToast)
            return
        }
        roomInfo.roomId = roomIDStr
        TUIRoomKit.sharedInstance.enterRoom(roomInfo: roomInfo)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension EnterRoomViewModel: TUIRoomKitListener {
    func onEnterRoom(code: Int, message: String) {
        if code == 0 {
        } else {
            RoomRouter.shared.currentViewController()?.view.makeToast(message)
        }
    }

    func onExitRoom() {
    }

    func onLogin(code: Int, message: String) {
    }
}

private extension String {
    static let enterRoomIdErrorToast = localized("TUIRoom.input.error.room.num.toast")
    static let placeholderTipsText = localized("TUIRoom.input.room.num")
    static let userNameText = localized("TUIRoom.user.name")
    static let roomNumText = localized("TUIRoom.room.num")
    static let openCameraText = localized("TUIRoom.open.video")
    static let openMicText = localized("TUIRoom.open.mic")
    static let openSpeakerText = localized("TUIRoom.open.speaker")
}
