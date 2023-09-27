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

protocol EnterRoomResponder :NSObjectProtocol {
    func updateEnterButtonBottomConstraint(offset: CGFloat)
}

class EnterRoomViewController: UIViewController {
    private var fieldText: String = ""
    private(set) var inputViewItems: [ListCellItemData] = []
    private(set) var switchViewItems: [ListCellItemData] = []
    private let currentUserName: String = TUILogin.getNickName() ?? ""
    private let currentUserId: String = TUILogin.getUserID() ?? ""
    private var roomId: String = ""
    private var enableMic: Bool = true
    private var enableCamera: Bool = true
    private var isSoundOnSpeaker: Bool = true
    weak var viewResponder: EnterRoomResponder?
    
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
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(keyboardWillShow),
                                               name: UIResponder.keyboardWillShowNotification,
                                               object:nil)
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(keyboardWillHide),
                                               name: UIResponder.keyboardWillHideNotification,
                                               object:nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        let rootView = EnterRoomView()
        rootView.rootViewController = self
        view = rootView
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
        navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        UIApplication.shared.isIdleTimerDisabled = false
        UIDevice.current.setValue(UIDeviceOrientation.portrait.rawValue, forKey: "orientation")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    @objc func backButtonClick(sender: UIButton) {
        navigationController?.popViewController(animated: true)
    }
    
    @objc func keyboardWillShow(notification:Notification) {
        guard let userInfo = notification.userInfo else{
            return
        }
        let keyboardRect = userInfo[EnterRoomViewController.keyboardFrameEndUserInfoKey] as! CGRect
        let animationDuration = userInfo[EnterRoomViewController.keyboardAnimationDurationUserInfoKey] as! Double
        let animationCurve = userInfo[UIResponder.keyboardAnimationCurveUserInfoKey] as! NSNumber
        guard let curve = UIView.AnimationCurve(rawValue: animationCurve.intValue) else
        {
            return
        }
        UIView.setAnimationCurve(curve)
        UIView.animate(withDuration: animationDuration){ [weak self]  in
            guard let self = self else { return }
            self.viewResponder?.updateEnterButtonBottomConstraint(offset: keyboardRect.size.height-51)
            
        }
    }
    
    @objc func keyboardWillHide(notification:Notification) {
        guard let userInfo = notification.userInfo else{
            return
        }
        let animationCurve = userInfo[UIResponder.keyboardAnimationCurveUserInfoKey] as! NSNumber
        guard let curve = UIView.AnimationCurve(rawValue: animationCurve.intValue) else
        {
            return
        }
        UIView.setAnimationCurve(curve)
        UIView.animate(withDuration: 0.3){ [weak self] in
            guard let self = self else { return }
            self.viewResponder?.updateEnterButtonBottomConstraint(offset: 0)
        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillHideNotification, object: nil)
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
        inputViewItems.append(userNameItem)
        
        let openMicItem = ListCellItemData()
        openMicItem.titleText = .openMicText
        openMicItem.hasSwitch = true
        openMicItem.isSwitchOn = true
        openMicItem.action = {[weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.enableMic = view.isOn
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
        openCameraItem.isSwitchOn = true
        openCameraItem.action = {[weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.enableCamera = view.isOn
        }
        switchViewItems.append(openCameraItem)
    }
    
    func enterButtonClick(sender: UIButton, view: EnterRoomView) {
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
        roomId = roomIDStr
        TUIRoomKit.createInstance().enterRoom(roomId: roomId, enableMic: enableMic, enableCamera: enableCamera, isSoundOnSpeaker: isSoundOnSpeaker) {
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.view.makeToast(message)
        }
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
