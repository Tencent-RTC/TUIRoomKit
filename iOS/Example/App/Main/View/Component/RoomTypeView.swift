//
//  RoomTypeView.swift
//  TUIRoomKit
//
//  Created by janejntang on 2023/1/6.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation
import UIKit

class RoomTypeView: UIView {
    weak var rootViewController: CreateRoomViewController?
    
    let freedomButton: UIButton = {
        let button = UIButton()
        button.setTitle(.freedomSpeakText, for: .normal)
        button.setTitleColor(UIColor(0xFFFFFF), for: .normal)
        button.setBackgroundImage(UIColor.tui_color(withHex: "2A2D38").trans2Image(), for: .normal)
        button.setBackgroundImage(UIColor.tui_color(withHex: "4F515A").trans2Image(), for: .selected)
        button.backgroundColor = .clear
        return button
    }()
    
    let raiseHandButton: UIButton = {
        let button = UIButton()
        button.setTitle(.raiseHandSpeakText, for: .normal)
        button.setTitleColor(UIColor(0xFFFFFF), for: .normal)
        button.setBackgroundImage(UIColor.tui_color(withHex: "2A2D38").trans2Image(), for: .normal)
        button.setBackgroundImage(UIColor.tui_color(withHex: "4F515A").trans2Image(), for: .selected)
        button.backgroundColor = .clear
        return button
    }()
    
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        backgroundColor = UIColor(0x2A2D38)
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    func constructViewHierarchy() {
        addSubview(freedomButton)
        addSubview(raiseHandButton)
    }
    
    func activateConstraints() {
        freedomButton.snp.makeConstraints { make in
            make.top.equalToSuperview().offset(60.scale375())
            make.width.equalToSuperview()
            make.height.equalTo(46.scale375())
        }
        raiseHandButton.snp.makeConstraints { make in
            make.top.equalTo(freedomButton.snp.bottom)
            make.width.height.equalTo(freedomButton)
        }
    }
    
    func bindInteraction() {
        self.layer.cornerRadius = 12
        setupViewState()
        freedomButton.addTarget(self, action: #selector(freedomAction(sender:)), for: .touchUpInside)
        raiseHandButton.addTarget(self, action: #selector(raiseHandAction(sender:)), for: .touchUpInside)
    }
    
    func setupViewState() {
        let isSeatEnable = rootViewController?.isSeatEnable ?? false
            freedomButton.isSelected = !isSeatEnable
            raiseHandButton.isSelected = isSeatEnable
    }
    
    @objc func freedomAction(sender: UIButton) {
        rootViewController?.freedomAction(sender: sender, view: self)
    }
    
    @objc func raiseHandAction(sender: UIButton) {
        rootViewController?.raiseHandAction(sender: sender, view: self)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static var raiseHandSpeakText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.raise.speak.model")
    }
    static var freedomSpeakText: String {
        RoomDemoLocalize("Demo.TUIRoomKit.freedom.speak.model")
    }
}
