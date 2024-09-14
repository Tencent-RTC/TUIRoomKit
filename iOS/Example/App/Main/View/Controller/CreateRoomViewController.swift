//
//  TUIRoomViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import SnapKit
import UIKit
import RTCRoomEngine
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
    private var enableLocalAudio: Bool = true
    private var enableLocalVideo: Bool = true
    private var isSoundOnSpeaker: Bool = true
    let roomHashNumber: Int = 0x3B9AC9FF
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
    
    override func viewDidLoad() {
        super.viewDidLoad()
        ConferenceSession.sharedInstance.addObserver(observer: self)
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
        navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        UIApplication.shared.isIdleTimerDisabled = false
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
        guard let roomId = self.roomId else {
            self.view.makeToast(.generatingRoomIdText)
            return
        }
        quickStartConference(roomId: roomId)
    }
    
    private func quickStartConference(roomId: String) {
        let vc = ConferenceMainViewController()
        let params = StartConferenceParams(roomId: roomId)
        params.isSeatEnabled = isSeatEnable
        params.isOpenMicrophone = enableLocalAudio
        params.isOpenCamera = enableLocalVideo
        params.isOpenSpeaker = isSoundOnSpeaker
        vc.setStartConferenceParams(params: params)
        navigationController?.pushViewController(vc, animated: true)
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
    func onConferenceStarted(roomInfo: TUIRoomInfo, error: TUIError, message: String) {
        if error != .success {
            let errorText = "Error: " + String(describing: error) + ", Message: " + message
            SceneDelegate.getCurrentWindow()?.makeToast(errorText, duration: 1, position:TUICSToastPositionCenter)
            navigationController?.popViewController(animated: true)
        }
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
        RoomDemoLocalize("Your Name")
    }
    static var roomTypeText: String {
        RoomDemoLocalize("Conference Type")
    }
    static var openCameraText: String {
        RoomDemoLocalize("Video")
    }
    static var openMicText: String {
        RoomDemoLocalize("Mic")
    }
    static var openSpeakerText: String {
        RoomDemoLocalize("Speaker")
    }
    static var freedomSpeakText: String {
        RoomDemoLocalize("Free Speech Conference")
    }
    static var raiseHandSpeakText: String {
        RoomDemoLocalize("On-stage Speech Conference")
    }
    static var videoConferenceText: String {
        RoomDemoLocalize("`s quick meeting")
    }
    static var generatingRoomIdText: String {
        RoomDemoLocalize("Generating room number, please try again later")
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

