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
    private(set) var isSeatEnable: Bool = false
    private let currentUserName: String = TUILogin.getNickName() ?? ""
    private let currentUserId: String = TUILogin.getUserID() ?? ""
    private let roomInfo: TUIRoomInfo = TUIRoomInfo()
    private let roomKit: TUIRoomKit = TUIRoomKit.createInstance()
    private var enableLocalAudio: Bool = true
    private var enableLocalVideo: Bool = true
    private var isSoundOnSpeaker: Bool = true
    let roomHashNumber: Int = 0x3B9AC9FF
    private var conferenceViewController: ConferenceMainViewController?
    var roomId: String?
    
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
        renewRootViewState()
        setupRoomId()
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
        roomTypeItem.hasOverAllAction = true
        roomTypeItem.hasButton = true
        roomTypeItem.action = { [weak self] sender in
            guard let self = self else { return }
            self.switchRoomTypeClick()
        }
        inputViewItems.append(roomTypeItem)
        
        let userNameItem = ListCellItemData()
        userNameItem.titleText = .userNameText
        userNameItem.messageText = currentUserName
        userNameItem.hasDownLineView = false
        inputViewItems.append(userNameItem)
        
        let openMicItem = ListCellItemData()
        openMicItem.titleText = .openMicText
        openMicItem.hasSwitch = true
        openMicItem.isSwitchOn = enableLocalAudio
        openMicItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.enableLocalAudio = view.isOn
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
        openCameraItem.isSwitchOn = enableLocalVideo
        openCameraItem.hasDownLineView = false
        openCameraItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.enableLocalVideo = view.isOn
        }
        switchViewItems.append(openCameraItem)
    }
    
    func enterButtonClick(sender: UIButton) {
        rootView?.updateEnterButtonState(isEnabled: false)
        rootView?.updateLoadingState(isStarted: true)
        guard let roomId = self.roomId else {
            self.view.makeToast(.generatingRoomIdText)
            self.renewRootViewState()
            return
        }
        quickStartConference(roomId: roomId)
    }
    
    private func quickStartConference(roomId: String) {
        conferenceViewController = ConferenceMainViewController()
        let params = ConferenceParams()
        params.name = currentUserName.truncateUtf8String(maxByteLength: 30)
        params.enableSeatControl = isSeatEnable
        params.isMuteMicrophone = !enableLocalAudio
        params.isOpenCamera = enableLocalVideo
        params.isSoundOnSpeaker = isSoundOnSpeaker
        conferenceViewController?.setConferenceParams(params: params)
        conferenceViewController?.quickStartConference(conferenceId: roomId)
        conferenceViewController?.setConferenceObserver(observer: self)
    }
    
    private func createRoom(roomId: String) {
        roomInfo.roomId = roomId
        roomInfo.name = currentUserName.truncateUtf8String(maxByteLength: 30)
        roomInfo.isSeatEnabled = isSeatEnable
        roomInfo.seatMode = .applyToTake
        roomInfo.roomType = .conference
        roomKit.createRoom(roomInfo: roomInfo) { [weak self] in
            guard let self = self else { return }
            self.roomKit.enterRoom(roomId: self.roomInfo.roomId, enableAudio: self.enableLocalAudio, enableVideo:
                                    self.enableLocalVideo, isSoundOnSpeaker: self.isSoundOnSpeaker) { [weak self] in
                guard let self = self else { return }
                self.renewRootViewState()
            } onError: { [weak self] code, message in
                guard let self = self else { return }
                self.renewRootViewState()
                self.rootView?.makeToast(message)
            }
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.renewRootViewState()
            self.rootView?.makeToast(message)
        }
    }
    
    private func renewRootViewState() {
        rootView?.updateEnterButtonState(isEnabled: true)
        rootView?.updateLoadingState(isStarted: false)
    }
    
    func switchRoomTypeClick() {
        rootView?.showSpeechModeControlView()
    }
    
    func freedomAction(sender: UIButton, view: RoomTypeView) {
        sender.isSelected = !sender.isSelected
        view.raiseHandButton.isSelected = false
        isSeatEnable = false
        view.isHidden = true
        guard let itemData = inputViewItems.first(where: { $0.titleText == .roomTypeText }) else { return }
        itemData.messageText = isSeatEnable ? .raiseHandSpeakText : .freedomSpeakText
        rootView?.updateInputStackView(item: itemData, index: 0)
    }
    
    func raiseHandAction(sender: UIButton, view: RoomTypeView) {
        sender.isSelected = !sender.isSelected
        view.freedomButton.isSelected = false
        isSeatEnable = true
        view.isHidden = true
        guard let itemData = inputViewItems.first(where: { $0.titleText == .roomTypeText }) else { return }
        itemData.messageText = isSeatEnable ? .raiseHandSpeakText : .freedomSpeakText
        rootView?.updateInputStackView(item: itemData, index: 0)
    }
    
    private func setupRoomId() {
        let roomId = getRandomRoomId(numberOfDigits: 6)
        checkIfRoomIdExists(roomId: roomId) { [weak self] in
            guard let self = self else { return }
            self.setupRoomId()
        } onNotExist: { [weak self] in
            guard let self = self else { return }
            self.roomId = roomId
        }
    }
    
    //获取随机数roomId，numberOfDigits为位数
    private func getRandomRoomId(numberOfDigits: Int) -> String {
        var numberOfDigit = numberOfDigits > 0 ? numberOfDigits : 1
        numberOfDigit = numberOfDigit < 10 ? numberOfDigit : 9
        let minNumber = Int(truncating: NSDecimalNumber(decimal: pow(10, numberOfDigit - 1)))
        let maxNumber = Int(truncating: NSDecimalNumber(decimal: pow(10, numberOfDigit))) - 1
        let randomNumber = arc4random_uniform(UInt32(maxNumber - minNumber)) + UInt32(minNumber)
        return String(randomNumber)
    }
    
    private func checkIfRoomIdExists(roomId: String, onExist: @escaping () -> (), onNotExist: @escaping () -> ()) {
        V2TIMManager.sharedInstance().getGroupsInfo([roomId]) { infoResult in
            if infoResult?.first?.resultCode == 0 {
                onExist()
            } else {
                onNotExist()
            }
        } fail: { code, message in
            onNotExist()
        }
    }
}

extension CreateRoomViewController: ConferenceObserver {
    func onConferenceStarted(conferenceId: String, error: ConferenceError) {
        guard error == .success else { return }
        guard let vc = conferenceViewController else { return }
        navigationController?.pushViewController(vc, animated: true)
        conferenceViewController = nil
        renewRootViewState()
    }
    
    func onConferenceFinished(conferenceId: String) {
        debugPrint("onConferenceFinished,conferenceId:\(conferenceId)")
    }
    
    func onConferenceExited(conferenceId: String) {
        debugPrint("onConferenceExited,conferenceId:\(conferenceId)")
    }
}

private extension String {
    static var userNameText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.user.name")
    }
    static var roomTypeText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.room.type")
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
    static var generatingRoomIdText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.generating.roomId")
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

