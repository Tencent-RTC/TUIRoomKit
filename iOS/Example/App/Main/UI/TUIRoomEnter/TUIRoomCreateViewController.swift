//
//  TUIRoomCreateViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import ImSDK_Plus
import SnapKit
import TXAppBasic
import UIKit
import TUICore

class TUIRoomCreateViewController: TUIRoomViewController {
    lazy var roomId: String = {
        let userId = TUILogin.getUserID()
        let result = "\(String(describing: userId))_voice_room".hash & 0x3B9AC9FF
        return String(result)
    }()

    override func setupUI() {
        super.setupUI()
        title = .titleText
        enterButton.setTitle(.createRoomText, for: .normal)
        roomInput.text = "\(roomId)".addIntervalSpace(intervalStr: " ", interval: 3)
        roomInput.isUserInteractionEnabled = false
        TRTCLog.out("TUIRoom roomId:\(roomId)")
    }

    @objc override func enterButtonClick() {
        enterMainViewController(roomId, isCreate: true)
    }

    override func activateConstraints() {
        super.activateConstraints()
        inputPanel.snp.makeConstraints { make in
            make.top.equalTo(view.snp.topMargin).offset(12)
            make.height.equalTo(104)
            make.width.equalToSuperview()
        }
        switchBackgroundView.snp.makeConstraints { make in
            make.height.equalTo(104)
            make.width.equalToSuperview()
            make.top.equalTo(inputPanel.snp.bottom).offset(12)
            make.centerX.equalToSuperview()
        }
    }
}

private extension String {
    static let titleText = TRTCDemoLocalize("TUIRoom.create.room")
    static let createRoomText = TRTCDemoLocalize("TUIRoom.create.room")
}
