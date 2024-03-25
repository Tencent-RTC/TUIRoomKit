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
    private var conferenceViewController: ConferenceMainViewController?
    
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
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
        navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        UIApplication.shared.isIdleTimerDisabled = false
        renewRootViewState()
    }
    
    @objc func backButtonClick(sender: UIButton) {
        navigationController?.popViewController(animated: true)
    }
    
    deinit {
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
        rootView?.updateEnterButtonState(isEnabled: false)
        rootView?.updateLoadingState(isStarted: true)
        joinConference(roomId: roomId)
    }
    
    private func joinConference(roomId: String) {
        conferenceViewController = ConferenceMainViewController()
        let params = ConferenceParams()
        params.isMuteMicrophone = !enableLocalAudio
        params.isOpenCamera = enableLocalVideo
        params.isSoundOnSpeaker = isSoundOnSpeaker
        conferenceViewController?.setConferenceParams(params: params)
        conferenceViewController?.setConferenceObserver(observer: self)
        conferenceViewController?.joinConference(conferenceId: roomId)
    }
    
    private func enterRoom(roomId: String) {
        TUIRoomKit.createInstance().enterRoom(roomId: roomId, enableAudio: enableLocalAudio, enableVideo: enableLocalVideo,
                                              isSoundOnSpeaker: isSoundOnSpeaker) { [weak self] in
            guard let self = self else { return }
            self.renewRootViewState()
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
}

extension EnterRoomViewController: ConferenceObserver {
    func onConferenceJoined(conferenceId: String, error: ConferenceError) {
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
    static var enterRoomIdErrorToast: String {
        RoomDemoLocalize("Demo.TUIRoomKit.input.error.room.num.toast")
    }
    static var placeholderTipsText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.input.room.num")
    }
    static var userNameText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.user.name")
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
}
