//
//  TUIRoomEntranceViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Foundation
import SnapKit
import Toast_Swift
import TUICore
import TXAppBasic
import UIKit

public class TUIRoomEntranceViewController: UIViewController {
    // XMagic License 【Optional】
    public var xMagicLicenseURL: String = ""
    public var xMagicLicenseKey: String = ""
    
    let loading = UIActivityIndicatorView(style: .gray)
    lazy var backButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_back", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    lazy var helpButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_help_icon", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    lazy var createButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setTitle(.createText, for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14)
        button.backgroundColor = .clear
        button.clipsToBounds = true
        button.layer.cornerRadius = 10
        button.sizeToFit()
        let btnWidth: CGFloat = 289
        button.titleEdgeInsets = UIEdgeInsets(top: 0, left: 58, bottom: 0, right: btnWidth - button.frame.size.width)
        let imageLeftView = UIImageView(image: UIImage(named: "tuiroom_create_room_icon", in: tuiRoomBundle(), compatibleWith: nil))
        button.addSubview(imageLeftView)
        imageLeftView.snp.makeConstraints { make in
            make.width.height.equalTo(32)
            make.left.equalToSuperview().offset(19)
            make.centerY.equalToSuperview()
        }
        let imageRightView = UIImageView(image: UIImage(named: "tuiroom_guide_icon", in: tuiRoomBundle(), compatibleWith: nil))
        button.addSubview(imageRightView)
        imageRightView.snp.makeConstraints { make in
            make.width.height.equalTo(32)
            make.centerY.equalToSuperview()
            make.right.equalToSuperview().offset(-8)
        }

        button.setBackgroundImage(UIImage(named: "tuiroom_entrance_btn_bg_icon", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.adjustsImageWhenHighlighted = false
        return button
    }()

    lazy var quickJoinButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setTitle(.quickJoinText, for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14)
        button.backgroundColor = .clear
        button.clipsToBounds = true
        button.layer.cornerRadius = 10
        button.sizeToFit()
        let btnWidth: CGFloat = 289
        button.titleEdgeInsets = UIEdgeInsets(top: 0, left: 58, bottom: 0, right: btnWidth - button.frame.size.width)
        let imageLeftView = UIImageView(image: UIImage(named: "tuiroom_join_room_icon", in: tuiRoomBundle(), compatibleWith: nil))
        button.addSubview(imageLeftView)
        imageLeftView.snp.makeConstraints { make in
            make.width.height.equalTo(32)
            make.left.equalToSuperview().offset(19)
            make.centerY.equalToSuperview()
        }
        let imageRightView = UIImageView(image: UIImage(named: "tuiroom_guide_icon", in: tuiRoomBundle(), compatibleWith: nil))
        button.addSubview(imageRightView)
        imageRightView.snp.makeConstraints { make in
            make.width.height.equalTo(32)
            make.centerY.equalToSuperview()
            make.right.equalToSuperview().offset(-8)
        }
        button.setBackgroundImage(UIImage(named: "tuiroom_entrance_btn_bg_icon", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.adjustsImageWhenHighlighted = false
        return button
    }()

    override public func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        activateConstraints()
        bindInteraction()
        TUICSToastManager.setDefaultPosition(TUICSToastPositionCenter)
        TUIRoomUserManage.updateSelfUserInfo()
        tuiRestore()
        registerSignalHandler()
    }

    override public func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
    }

    func setupUI() {
        title = .titleText
        navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        navigationItem.leftBarButtonItem?.tintColor = .black
        navigationItem.rightBarButtonItem = UIBarButtonItem(customView: helpButton)
        navigationItem.rightBarButtonItem?.tintColor = .black
        view.backgroundColor = .white
        view.addSubview(createButton)
        view.addSubview(quickJoinButton)
        view.addSubview(loading)
        ToastManager.shared.position = .center
    }

    func activateConstraints() {
        createButton.snp.makeConstraints { make in
            make.height.equalTo(96)
            make.width.equalTo(347)
            make.top.equalToSuperview()
            make.centerX.equalToSuperview()
        }

        quickJoinButton.snp.makeConstraints { make in
            make.height.equalTo(96)
            make.width.equalTo(347)
            make.top.equalTo(createButton.snp.bottom)
            make.centerX.equalToSuperview()
        }
        
        loading.snp.makeConstraints { make in
            make.width.height.equalTo(40)
            make.centerX.centerY.equalTo(view)
        }
    }

    func bindInteraction() {
        backButton.addTarget(self, action: #selector(backButtonClick), for: .touchUpInside)
        helpButton.addTarget(self, action: #selector(helpButtonClick), for: .touchUpInside)
        createButton.addTarget(self, action: #selector(createButtonClick), for: .touchUpInside)
        quickJoinButton.addTarget(self, action: #selector(quickJoinButtonClick), for: .touchUpInside)
    }

    public override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        view.bringSubviewToFront(loading)
    }
    
    @objc func backButtonClick() {
        navigationController?.popViewController(animated: true)
    }

    /// 连接官方文档 // TUIRoom TODO:
    @objc private func helpButtonClick() {
        if let url = URL(string: "https://cloud.tencent.com/document/product/647/45681") {
            UIApplication.shared.openURL(url)
        }
    }

    @objc private func createButtonClick() {
        if TUIRoomUserManage.currentUserId().byteLength() == 0 {
            view.makeToast(.noLoginToast)
            return
        }

        let vc = TUIRoomCreateViewController()
        vc.xMagicLicenseURL = xMagicLicenseURL
        vc.xMagicLicenseKey = xMagicLicenseKey
        navigationController?.pushViewController(vc, animated: true)
    }

    @objc private func quickJoinButtonClick() {
        if TUIRoomUserManage.currentUserId().byteLength() == 0 {
            view.makeToast(.noLoginToast)
            return
        }

        let vc = TUIRoomJoinViewController()
        vc.xMagicLicenseURL = xMagicLicenseURL
        vc.xMagicLicenseKey = xMagicLicenseKey
        navigationController?.pushViewController(vc, animated: true)
    }

    deinit {
        unregisterSignalHandler()
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let titleText = tuiRoomLocalize("TUIRoom.create.title")
    static let createText = tuiRoomLocalize("TUIRoom.create.room")
    static let quickJoinText = tuiRoomLocalize("TUIRoom.quick.join")
    static let noLoginToast = tuiRoomLocalize("TUIRoom.not.login.toast")
}
