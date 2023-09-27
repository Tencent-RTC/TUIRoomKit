//
//  TRTCRegisterViewController.swift
//  TXLiteAVDemo
//
//  Created by gg on 2021/4/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Foundation
import TXAppBasic
import SnapKit
import UIKit
import ImSDK_Plus
import TUICore

class TRTCRegisterViewController: UIViewController {
    let loading = UIActivityIndicatorView(style: .large)
    
    override func viewDidLoad() {
        super.viewDidLoad()
        TUICSToastManager.setDefaultPosition(TUICSToastPositionBottom)
        title = .titleText
        view.addSubview(loading)
        loading.snp.makeConstraints { (make) in
            make.width.height.equalTo(40)
            make.centerX.centerY.equalTo(view)
        }
    }
    
    func regist(_ nickName: String) {
        loading.startAnimating()
        ProfileManager.shared.synchronizUserInfo()
        ProfileManager.shared.setNickName(name: nickName) { [weak self] in
            guard let `self` = self else { return }
            let selector = NSSelectorFromString("getSelfUserInfo")
            if TUILogin.responds(to: selector) {
                TUILogin.perform(selector)
            }
            self.registSuccess()
        } failed: { (err) in
            self.loading.stopAnimating()
            self.view.makeToast(err)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                self.navigationController?.popViewController(animated: true)
            }
        }
    }
    
    func registSuccess() {
        self.loading.stopAnimating()
        self.view.makeToast(.registSuccessText)
        ProfileManager.shared.localizeUserModel()
        ProfileManager.shared.synchronizUserInfo()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            //show main vc
            AppUtils.shared.showMainController()
        }
    }
    
    override func loadView() {
        super.loadView()
        let rootView = TRTCRegisterRootView()
        rootView.backgroundColor = UIColor.white
        rootView.rootVC = self
        view = rootView
    }
}

/// MARK: - internationalization string
fileprivate extension String {
    static let titleText = LoginLocalize(key:"Demo.TRTC.Login.regist")
    static let registSuccessText = LoginLocalize(key:"Demo.TRTC.Login.registsuccess")
}

