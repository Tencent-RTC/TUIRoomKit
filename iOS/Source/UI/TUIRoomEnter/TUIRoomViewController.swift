//
//  TUIRoomViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//
import SnapKit
import TXAppBasic
import UIKit

class TUIRoomViewController: UIViewController {
    // XMagic License 【Optional】
    var xMagicLicenseURL: String = ""
    var xMagicLicenseKey: String = ""
    
    let loading = UIActivityIndicatorView(style: .gray)
    let screenHeight = UIScreen.main.bounds.size.height

    lazy var backButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_back", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        return button
    }()

    lazy var inputPanel: UIView = {
        let view = UIView()
        view.backgroundColor = .white
        let line = UIView()
        view.addSubview(line)
        line.backgroundColor = UIColor(hex: "F7F8FB")
        line.snp.makeConstraints { make in
            make.left.equalToSuperview()
            make.right.equalToSuperview()
            make.top.equalToSuperview().offset(51.5)
            make.height.equalTo(1)
        }
        return view
    }()

    lazy var switchBackgroundView: UIView = {
        let view = UIView()
        view.backgroundColor = .white
        let line = UIView()
        view.addSubview(line)
        line.backgroundColor = UIColor(hex: "F7F8FB")
        line.snp.makeConstraints { make in
            make.left.equalToSuperview()
            make.right.equalToSuperview()
            make.top.equalToSuperview().offset(51.5)
            make.height.equalTo(1)
        }
        return view
    }()

    lazy var userNameTip: UILabel = {
        let view = UILabel()
        view.backgroundColor = .clear
        view.textColor = UIColor(hex: "333333")
        view.font = UIFont(name: "PingFangSC-Medium", size: 14)
        view.text = .userNameText
        view.adjustsFontSizeToFitWidth = true
        view.minimumScaleFactor = 0.5
        return view
    }()

    lazy var userNameLabel: UILabel = {
        let view = UILabel()
        view.backgroundColor = .clear
        view.textColor = UIColor(hex: "333333")
        view.font = UIFont(name: "PingFangSC-Regular", size: 14)
        view.text = TUIRoomUserManage.currentNickName()
        view.adjustsFontSizeToFitWidth = true
        view.minimumScaleFactor = 0.5
        view.sizeToFit()
        return view
    }()

    lazy var roomTip: UILabel = {
        let view = UILabel()
        view.backgroundColor = .clear
        view.textColor = UIColor(hex: "333333")
        view.font = UIFont(name: "PingFangSC-Medium", size: 14)
        view.text = .roomNumText
        view.adjustsFontSizeToFitWidth = true
        view.minimumScaleFactor = 0.5
        return view
    }()

    lazy var roomInput: UITextField = {
        let view = UITextField()
        view.backgroundColor = .clear
        view.textColor = UIColor(hex: "333333")
        view.font = UIFont(name: "PingFangSC-Regular", size: 14)
        guard let color = UIColor(hex: "BBBBBB") else {
            return view
        }
        view.attributedPlaceholder = NSAttributedString(
            string: .placeholderTipsText,
            attributes: [NSAttributedString.Key.foregroundColor:color])
        view.keyboardType = .numberPad
        view.delegate = self
        return view
    }()

    lazy var copyButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_copy_icon", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        return button
    }()

    lazy var openCameraTip: UILabel = {
        let view = UILabel()
        view.backgroundColor = .clear
        view.textColor = UIColor(hex: "333333")
        view.font = UIFont(name: "PingFangSC-Medium", size: 14)
        view.text = .openCameraText
        return view
    }()

    lazy var openCameraSwitch: UISwitch = {
        let view = UISwitch()
        view.isOn = true
        view.onTintColor = UIColor.buttonBackColor
        return view
    }()

    lazy var openMicTip: UILabel = {
        let view = UILabel()
        view.backgroundColor = .clear
        view.textColor = UIColor(hex: "333333")
        view.font = UIFont(name: "PingFangSC-Medium", size: 14)
        view.text = .openMicText
        return view
    }()

    lazy var openMicSwitch: UISwitch = {
        let view = UISwitch()
        view.isOn = true
        view.onTintColor = UIColor.buttonBackColor
        return view
    }()

    lazy var enterButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setBackgroundImage(UIColor.buttonBackColor.trans2Image(), for: .normal)
        button.layer.cornerRadius = 25
        button.clipsToBounds = true
        button.titleLabel?.font = UIFont.boldSystemFont(ofSize: 19)
        button.setTitleColor(.white, for: .normal)
        return button
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        extendedLayoutIncludesOpaqueBars = true
        setupUI()
        activateConstraints()
        bindInteraction()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: true)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        view.bringSubviewToFront(loading)
    }

    func setupUI() {
        title = .titleText
        navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        navigationItem.leftBarButtonItem?.tintColor = .black
        view.backgroundColor = UIColor(hex: "F7F8FB")
        view.addSubview(inputPanel)
        view.addSubview(switchBackgroundView)
        inputPanel.addSubview(userNameTip)
        inputPanel.addSubview(userNameLabel)
        inputPanel.addSubview(roomTip)
        inputPanel.addSubview(roomInput)
        inputPanel.addSubview(copyButton)

        switchBackgroundView.addSubview(openCameraTip)
        switchBackgroundView.addSubview(openCameraSwitch)
        switchBackgroundView.addSubview(openMicTip)
        switchBackgroundView.addSubview(openMicSwitch)
        view.addSubview(enterButton)
        view.addSubview(loading)
    }

    func activateConstraints() {
        userNameTip.sizeToFit()
        var width = max(userNameTip.mm_w, 50)
        userNameTip.snp.makeConstraints { make in
            make.left.equalToSuperview().offset(12)
            make.top.equalToSuperview()
            make.width.equalTo(width)
            make.height.equalTo(52)
        }

        let userNameWidth = userNameLabel.frame.width
        userNameLabel.snp.makeConstraints { make in
            make.centerY.equalTo(userNameTip)
            make.left.equalTo(userNameTip.snp.right).offset(15)
            make.width.equalTo(userNameWidth + 4)
            make.height.equalTo(52)
        }

        roomTip.sizeToFit()
        width = max(roomTip.mm_w, 50)

        roomTip.snp.makeConstraints { make in
            make.left.equalToSuperview().offset(12)
            make.top.equalToSuperview().offset(52)
            make.width.equalTo(width)
            make.height.equalTo(52)
        }

        roomInput.snp.makeConstraints { make in
            make.left.equalTo(roomTip.snp.right).offset(15)
            make.centerY.equalTo(roomTip)
            make.height.equalTo(roomTip)
            make.width.equalTo(150)
        }

        copyButton.snp.makeConstraints { make in
            make.left.equalToSuperview().offset(160)
            make.centerY.equalTo(roomTip)
            make.height.equalTo(40)
            make.width.equalTo(40)
        }

        openCameraTip.snp.makeConstraints { make in
            make.left.equalToSuperview().offset(12)
            make.top.equalToSuperview()
            make.width.equalTo(150)
            make.height.equalTo(52)
        }
        openCameraSwitch.snp.makeConstraints { make in
            make.centerY.equalTo(openCameraTip)
            make.right.equalToSuperview().offset(-12)
            make.width.equalTo(48)
            make.height.equalTo(28)
        }

        openMicTip.snp.makeConstraints { make in
            make.left.equalToSuperview().offset(12)
            make.top.equalToSuperview().offset(52)
            make.width.equalTo(150)
            make.height.equalTo(52)
        }
        openMicSwitch.snp.makeConstraints { make in
            make.centerY.equalTo(openMicTip)
            make.right.equalToSuperview().offset(-12)
            make.width.equalTo(48)
            make.height.equalTo(28)
        }

        enterButton.snp.makeConstraints { make in
            make.bottom.equalToSuperview().offset(-40 - kDeviceSafeBottomHeight)
            make.centerX.equalToSuperview()
            make.width.equalToSuperview().multipliedBy(0.4)
            make.height.equalTo(50)
        }

        loading.snp.makeConstraints { make in
            make.width.height.equalTo(40)
            make.centerX.centerY.equalTo(view)
        }
    }

    func bindInteraction() {
        backButton.addTarget(self, action: #selector(backButtonClick), for: .touchUpInside)
        enterButton.addTarget(self, action: #selector(enterButtonClick), for: .touchUpInside)
        copyButton.addTarget(self, action: #selector(copyButtonClick), for: .touchUpInside)
    }

    func enterMainViewController(_ roomId: Int32, isCreate: Bool) {
        if isCreate {
            TUIRoom.sharedInstance.createRoom(roomId: Int(roomId),
                                              speechMode: .freeSpeech,
                                              isOpenCamera: openCameraSwitch.isOn,
                                              isOpenMicrophone: openMicSwitch.isOn)
        } else {
            TUIRoom.sharedInstance.enterRoom(roomId: Int(roomId),
                                             isOpenCamera: openCameraSwitch.isOn,
                                             isOpenMicrophone: openMicSwitch.isOn)
        }
    }

    @objc func backButtonClick() {
        navigationController?.popViewController(animated: true)
    }

    @objc func enterButtonClick() {
    }

    @objc func copyButtonClick() {
        let pas = UIPasteboard.general
        pas.string = roomInput.text
        view.makeToast(.copySuccessText)
    }

    deinit {
        debugPrint("deinit \(self)")
    }
}

extension TUIRoomViewController: UITextFieldDelegate {
    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        let maxCount = 11
        DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + 0.05) {
            textField.text = textField.text?
                .replacingOccurrences(of: " ",
                                      with: "",
                                      options: .literal,
                                      range: nil)
                .addIntervalSpace(intervalStr: " ", interval: 3)
        }

        guard let textFieldText = textField.text,
              let rangeOfTextToReplace = Range(range, in: textFieldText) else {
            return false
        }
        let substringToReplace = textFieldText[rangeOfTextToReplace]
        if substringToReplace.count > 0 && string.count == 0 {
            return true
        }
        let count = textFieldText.count - substringToReplace.count + string.count

        let res = count <= maxCount
        return res
    }
}

private extension String {
    static let titleText = "TUIRoom"
    static let userNameText = tuiRoomLocalize("TUIRoom.user.name")
    static let roomNumText = tuiRoomLocalize("TUIRoom.room.num")
    static let placeholderTipsText = tuiRoomLocalize("TUIRoom.input.room.num")
    static let openCameraText = tuiRoomLocalize("TUIRoom.open.camera")
    static let openMicText = tuiRoomLocalize("TUIRoom.open.mic")
    static let copySuccessText = tuiRoomLocalize("TUIRoom.copy.success")
}

extension String {
    func addIntervalSpace(intervalStr: String, interval: Int) -> String {
        var output = ""
        enumerated().forEach { index, c in
            if (index % interval == 0) && index > 0 {
                output += intervalStr
            }
            output.append(c)
        }
        return output
    }
}
