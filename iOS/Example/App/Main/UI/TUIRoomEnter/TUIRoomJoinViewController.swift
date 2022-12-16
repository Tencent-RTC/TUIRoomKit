//
//  TUIRoomJoinViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import SnapKit
import TXAppBasic
import UIKit

class TUIRoomJoinViewController: TUIRoomViewController {
    var roomId: String = ""

    override func setupUI() {
        super.setupUI()
        title = .titleText
        enterButton.setTitle(.enterRoomText, for: .normal)
        guard let color = UIColor(hex: "BBBBBB") else {
            return
        }
        roomInput.attributedPlaceholder = NSAttributedString(
            string: .placeholderTipsText,
            attributes: [NSAttributedString.Key.foregroundColor:color])
        roomInput.becomeFirstResponder()
        copyButton.isHidden = true
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if roomInput.isFirstResponder {
            roomInput.resignFirstResponder()
        }
    }

    @objc override func enterButtonClick() {
        if roomInput.isFirstResponder {
            roomInput.resignFirstResponder()
        }

        if (roomInput.text?.count ?? 0) <= 0 {
            view.makeToast(.enterRoomIdErrorToast)
            return
        }
        guard let roomIDStr = roomInput.text?
            .replacingOccurrences(of: " ",
                                  with: "",
                                  options: .literal,
                                  range: nil) else {
            view.makeToast(.enterRoomIdErrorToast)
            return
        }

        if roomIDStr.count <= 0 {
            view.makeToast(.enterRoomIdErrorToast)
            return
        }
        roomId = roomIDStr
        enterMainViewController(roomIDStr, isCreate: false)
    }

    override func activateConstraints() {
        super.activateConstraints()
        switchBackgroundView.snp.makeConstraints { make in
            make.top.equalTo(view.snp.topMargin).offset(12)
            make.height.equalTo(104)
            make.width.equalToSuperview()
        }
        inputPanel.snp.makeConstraints { make in
            make.height.equalTo(104)
            make.width.equalToSuperview()
            make.top.equalTo(switchBackgroundView.snp.bottom).offset(12)
            make.centerX.equalToSuperview()
        }
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        if roomInput.isFirstResponder {
            roomInput.resignFirstResponder()
        }
    }
}

private extension String {
    static let titleText = TRTCDemoLocalize("TUIRoom.quick.join")
    static let placeholderTipsText = TRTCDemoLocalize("TUIRoom.input.room.num")
    static let enterRoomText = TRTCDemoLocalize("TUIRoom.quick.join")
    static let enterRoomIdErrorToast = TRTCDemoLocalize("TUIRoom.input.error.room.num.toast")
}
