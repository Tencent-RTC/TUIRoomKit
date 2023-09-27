//
//  TUIRoomViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import SnapKit
import UIKit
import TUIRoomEngine
import TUIRoomKit
import TUICore

class CreateRoomViewController: UIViewController {
    weak var rootView: CreateRoomView?
    private(set) var inputViewItems: [ListCellItemData] = []
    private(set) var switchViewItems: [ListCellItemData] = []
    private var chooseSpeechMode: TUISpeechMode = .freeToSpeak
    var roomSpeechMode: TUISpeechMode = .freeToSpeak
    private let currentUserName: String = TUILogin.getNickName() ?? ""
    private let currentUserId: String = TUILogin.getUserID() ?? ""
    private let roomInfo: TUIRoomInfo = TUIRoomInfo()
    private let roomKit: TUIRoomKit = TUIRoomKit.createInstance()
    private var enableMic: Bool = true
    private var enableCamera: Bool = true
    private var isSoundOnSpeaker: Bool = true
    let roomHashNumber: Int = 0x3B9AC9FF
    lazy var roomId: String = {
        let userId = currentUserId
        let result = "\(String(describing: userId))_room_kit".hash & roomHashNumber
        return String(result)
    }()
    
    let backButton: UIButton = {
        let button = UIButton(type: .custom)
        let normalIcon = UIImage(named: "room_back_white")
        button.setImage(normalIcon, for: .normal)
        button.setTitleColor(UIColor(0xD1D9EC), for: .normal)
        return button
    }()
    override var shouldAutorotate: Bool {
        return false
    }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .portrait
    }
    
    init() {
        super.init(nibName: nil, bundle: nil)
        createItems()
        backButton.addTarget(self, action: #selector(backButtonClick(sender:)), for: .touchUpInside)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        let rootView = CreateRoomView()
        rootView.rootViewController = self
        view = rootView
        self.rootView = rootView
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
        navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        UIApplication.shared.isIdleTimerDisabled = false
        UIDevice.current.setValue(UIDeviceOrientation.portrait.rawValue, forKey: "orientation")
    }
    
    @objc
    func backButtonClick(sender: UIButton) {
        navigationController?.popViewController(animated: true)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension CreateRoomViewController {
   private func createItems() {
        let roomTypeItem = ListCellItemData()
        roomTypeItem.titleText = .roomTypeText
        roomTypeItem.messageText = .freedomSpeakText
        roomTypeItem.hasButton = true
        roomTypeItem.hasOverAllAction = true
        roomTypeItem.action = { [weak self] sender in
            guard let self = self else { return }
            self.switchRoomTypeClick()
        }
        inputViewItems.append(roomTypeItem)
        
        let createRoomIdItem = ListCellItemData()
        createRoomIdItem.titleText = .roomNumText
        createRoomIdItem.messageText = roomId
        inputViewItems.append(createRoomIdItem)
        
        let userNameItem = ListCellItemData()
        userNameItem.titleText = .userNameText
        userNameItem.messageText = currentUserName
        inputViewItems.append(userNameItem)
        
        let openMicItem = ListCellItemData()
        openMicItem.titleText = .openMicText
        openMicItem.hasSwitch = true
        openMicItem.isSwitchOn = true
        openMicItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.enableMic = view.isOn
        }
        switchViewItems.append(openMicItem)
        
        let openSpeakerItem = ListCellItemData()
        openSpeakerItem.titleText = .openSpeakerText
        openSpeakerItem.hasSwitch = true
        openSpeakerItem.isSwitchOn = isSoundOnSpeaker
        openSpeakerItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.isSoundOnSpeaker = view.isOn
        }
        switchViewItems.append(openSpeakerItem)
        
        let openCameraItem = ListCellItemData()
        openCameraItem.titleText = .openCameraText
        openCameraItem.hasSwitch = true
        openCameraItem.isSwitchOn = enableMic
        openCameraItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.enableCamera = view.isOn
        }
        switchViewItems.append(openCameraItem)
    }
        
    func enterButtonClick(sender: UIButton, view: CreateRoomView) {
        view.enterButton.isEnabled = false
        view.loading.startAnimating()
        DispatchQueue.main.asyncAfter(deadline: .now()+3, execute: {
            view.enterButton.isEnabled = true
            view.loading.stopAnimating()
        })
        roomInfo.roomId = roomId
        roomInfo.name = currentUserName.truncateUtf8String(maxByteLength: 30)
        roomInfo.speechMode = roomSpeechMode
        roomInfo.roomType = .conference
        roomKit.createRoom(roomInfo: roomInfo) { [weak self] in
            guard let self = self else { return }
            self.roomKit.enterRoom(roomId: self.roomInfo.roomId, enableMic: self.enableMic, enableCamera: self.enableCamera,
                                   isSoundOnSpeaker: self.isSoundOnSpeaker) {
            } onError: { [weak self] code, message in
                guard let self = self else { return }
                self.view.makeToast(message)
            }
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.view.makeToast(message)
        }
    }
    
    func switchRoomTypeClick() {
        rootView?.showSpeechModeControlView()
    }
    
    func cancelAction(sender: UIButton, view: RoomTypeView) {
        sender.isSelected = !sender.isSelected
        chooseSpeechMode = roomSpeechMode
        view.raiseHandButton.isSelected = false
        view.freedomButton.isSelected = false
        view.isHidden = true
    }
    
    func sureAction(sender: UIButton, view: RoomTypeView) {
        sender.isSelected = !sender.isSelected
        roomSpeechMode = chooseSpeechMode
        view.isHidden = true
        guard let itemData = inputViewItems.first(where: { $0.titleText == .roomTypeText }) else { return }
        switch roomSpeechMode {
        case .freeToSpeak:
            itemData.messageText = .freedomSpeakText
        case .applySpeakAfterTakingSeat:
            itemData.messageText = .raiseHandSpeakText
        default: break
        }
        rootView?.updateInputStackView(item: itemData, index: 0)
    }
    
    func freedomAction(sender: UIButton, view: RoomTypeView) {
        sender.isSelected = !sender.isSelected
        view.raiseHandButton.isSelected = false
        chooseSpeechMode = .freeToSpeak
    }
    
    func raiseHandAction(sender: UIButton, view: RoomTypeView) {
        sender.isSelected = !sender.isSelected
        view.freedomButton.isSelected = false
        chooseSpeechMode = .applySpeakAfterTakingSeat
    }
}

private extension String {
    static var userNameText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.user.name")
    }
    static var roomTypeText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.room.type")
    }
    static var roomNumText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.room.num")
    }
    static var openCameraText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.open.video")
    }
    static var openMicText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.open.mic")
    }
    static var openSpeakerText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.open.speaker")
    }
    static var freedomSpeakText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.freedom.speaker")
    }
    static var raiseHandSpeakText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.raise.speaker")
    }
    static var videoConferenceText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.video.conference")
    }
    func truncateUtf8String(maxByteLength: Int) -> String {
        let length = self.utf8.count
        if length <= maxByteLength {
            return self
        } else {
            var byteLen = 0
            var result = ""
            for c in self {
                byteLen += String(c).utf8.count
                if byteLen > maxByteLength {
                    break
                }
                result.append(c)
            }
            return result
        }
    }
}

