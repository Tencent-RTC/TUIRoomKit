//
//  TUIRoomViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import SnapKit
import UIKit
import TUIRoomKit
import TUICore
import RTCRoomEngine

class EnterRoomViewController: UIViewController {
    weak var rootView: EnterRoomView?
    private var fieldText: String = ""
    private(set) var inputViewItems: [ListCellItemData] = []
    private(set) var switchViewItems: [ListCellItemData] = []
    private let currentUserName: String = TUILogin.getNickName() ?? ""
    private let currentUserId: String = TUILogin.getUserID() ?? ""
    private var roomId: String = ""
    private var enableLocalAudio: Bool = true
    private var enableLocalVideo: Bool = true
    private var isSoundOnSpeaker: Bool = true
    
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
        let rootView = EnterRoomView()
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
    }
    
    @objc func backButtonClick(sender: UIButton) {
        navigationController?.popViewController(animated: true)
    }
    
    deinit {
        ConferenceSession.sharedInstance.removeObserver(observer: self)
        debugPrint("deinit \(self)")
    }
}

extension EnterRoomViewController {
    private func createItems() {
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
        userNameItem.messageText = currentUserName
        userNameItem.hasDownLineView = false
        inputViewItems.append(userNameItem)
        
        let openMicItem = ListCellItemData()
        openMicItem.titleText = .openMicText
        openMicItem.hasSwitch = true
        openMicItem.isSwitchOn = enableLocalAudio
        openMicItem.action = {[weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.enableLocalAudio = view.isOn
        }
        switchViewItems.append(openMicItem)
        
        let openSpeakerItem = ListCellItemData()
        openSpeakerItem.titleText = .openSpeakerText
        openSpeakerItem.hasSwitch = true
        openSpeakerItem.isSwitchOn = true
        openSpeakerItem.action = {[weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.isSoundOnSpeaker = view.isOn
        }
        switchViewItems.append(openSpeakerItem)
        
        let openCameraItem = ListCellItemData()
        openCameraItem.titleText = .openCameraText
        openCameraItem.hasSwitch = true
        openCameraItem.isSwitchOn = enableLocalVideo
        openCameraItem.hasDownLineView = false
        openCameraItem.action = {[weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.enableLocalVideo = view.isOn
        }
        switchViewItems.append(openCameraItem)
    }
    
    func enterButtonClick(sender: UIButton) {
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
        roomId = roomIDStr
        joinConference(roomId: roomId)
    }
    
    private func joinConference(roomId: String) {
        let vc =  ConferenceMainViewController()
        let params = JoinConferenceParams(roomId: roomId)
        params.isOpenMicrophone = enableLocalAudio
        params.isOpenCamera = enableLocalVideo
        params.isOpenSpeaker = isSoundOnSpeaker
        vc.setJoinConferenceParams(params: params)
        navigationController?.pushViewController(vc, animated: true)
    }
    
}

extension EnterRoomViewController: ConferenceObserver {
    func onConferenceJoined(roomInfo: TUIRoomInfo, error: TUIError, message: String) {
        guard error != .success else { return }
        navigationController?.popViewController(animated: true)
        let toastText = error == .roomIdNotExist ? .roomDoesNotExit : message
        guard !toastText.isEmpty else { return }
        SceneDelegate.getCurrentWindow()?.makeToast(toastText, duration: 1, position:TUICSToastPositionCenter)
    }
    
    func onConferenceFinished(roomInfo: TUIRoomInfo, reason: ConferenceFinishedReason) {
        debugPrint("onConferenceFinished")
    }
    
    func onConferenceExited(roomInfo: TUIRoomInfo, reason: ConferenceExitedReason) {
        debugPrint("onConferenceExited")
    }
}

private extension String {
    static var enterRoomIdErrorToast: String {
        RoomDemoLocalize("Enter a valid room ID.")
    }
    static var placeholderTipsText: String {
        RoomDemoLocalize("Enter a room ID")
    }
    static var userNameText: String {
        RoomDemoLocalize("Your Name")
    }
    static var roomNumText: String {
        RoomDemoLocalize("Room ID")
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
    static let roomDoesNotExit = RoomDemoLocalize("The room does not exit, please confirm the room number or create a room!")
}
