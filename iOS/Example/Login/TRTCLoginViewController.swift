//
//  TRTCLoginViewController.swift
//  TXLiteAVDemo
//
//  Created by gg on 2021/4/7.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Foundation
import WebKit
import TUICore
import TUIRoomEngine
import TUIRoomKit

class TRTCLoginViewController: UIViewController {
    
    let loading = UIActivityIndicatorView()
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        view.bringSubviewToFront(loading)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        navigationController?.navigationBar.barTintColor = .white
        TUICSToastManager.setDefaultPosition(TUICSToastPositionBottom)
        view.addSubview(loading)
        loading.snp.makeConstraints { (make) in
            make.width.height.equalTo(40)
            make.centerX.centerY.equalTo(view)
        }
        
        /// auto login
        if ProfileManager.shared.autoLogin(success: { [weak self] in
            guard let self = self else {return}
            self.roomKitLogin()
        }, failed: { [weak self] (err) in
            guard let self = self else {return}
            self.loading.stopAnimating()
            self.view.makeToast(err)
        }) {
            loading.startAnimating()
            if let rootView = view as? TRTCLoginRootView {
                rootView.phoneNumTextField.text = ProfileManager.shared.curUserModel?.phone ?? ""
                rootView.nickNameTextField.text = ProfileManager.shared.curUserModel?.name ?? ""
            }
        }
    }
    
    func login(phone: String, code: String) {
        loading.startAnimating()
        ProfileManager.shared.login(phone: phone, code: code) { [weak self] in
            guard let `self` = self else { return }
            self.loading.stopAnimating()
            self.loginIM { [weak self] (success) in
                guard let `self` = self else { return }
                if success {
                    self.loginSucc()
                }
            }
        }
    }
    
    func login(phone: String, nickName: String) {
        loading.startAnimating()
        ProfileManager.shared.login(phone: phone, name: nickName) { [weak self] in
            guard let self = self else { return }
            self.roomKitLogin()
        }
    }
    
    #if DEBUG
    let SdkBusiId: Int32 = 18_069
    #else
    let SdkBusiId: Int32 = 18_070
    #endif
    
    func loginIM(complete: @escaping (_ success: Bool)->Void) {
        guard let userID = ProfileManager.shared.curUserID() else { return }
        let userSig = ProfileManager.shared.curUserSig()
        if TUILogin.getUserID() != userID {
            ProfileManager.shared.IMLogin(userSig: userSig) {
                debugPrint("IM login success.")
                complete(true)
            } failed: { [weak self] (error) in
                guard let `self` = self else { return }
                self.view.makeToast(LoginLocalize(key: "App.PortalViewController.loginimfailed"))
                complete(false)
            }
        }
    }
    
    func roomKitLogin() {
        guard let userID = ProfileManager.shared.curUserID() else { return }
        TUIRoomKit.sharedInstance.addListener(listener: self)
        let userSig = ProfileManager.shared.curUserSig()
        TUIRoomKit.sharedInstance.login(sdkAppId: Int(SDKAPPID), userId:userID, userSig: userSig)
    }
    
    func loginSucc() {
        if ProfileManager.shared.curUserModel?.name.count == 0 {
            showRegisterVC()
        } else {
            self.view.makeToast(LoginLocalize(key:"V2.Live.LinkMicNew.loginsuccess"))
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                AppUtils.shared.showMainController()
            }
        }
    }
    
    func showRegisterVC() {
        let vc = TRTCRegisterViewController()
        navigationController?.pushViewController(vc, animated: true)
    }
    
    func showDebugVC() {
        let debugVC = RoomFileBrowserViewController(bathPath: NSHomeDirectory())
        navigationController?.pushViewController(debugVC, animated: true)
    }
    
    override func loadView() {
        super.loadView()
        let rootView = TRTCLoginRootView()
        rootView.rootVC = self
        view = rootView
    }
}

extension String {
    static let verifySuccessStr = "verifySuccess"
    static let verifyCancelStr = "verifyCancel"
    static let verifyErrorStr = "verifyError"
}

extension TRTCLoginViewController: TUIRoomKitListener {
    func onLogin(code: Int, message: String) {
        self.loading.stopAnimating()
        if code == 0 {
            self.view.makeToast(LoginLocalize(key:"V2.Live.LinkMicNew.loginsuccess"))
            let userInfo = TUIRoomEngine.getSelfInfo()
            ProfileManager.shared.refreshAvatar(faceURL: userInfo.avatarUrl)
            
            if userInfo.userName != ProfileManager.shared.curNickName() {
                ProfileManager.shared.setNickName(name: ProfileManager.shared.curNickName()) {
                    debugPrint("set nickName success")
                    let userInfo = TUIRoomEngine.getSelfInfo()
                    TUIRoomKit.sharedInstance.setSelfInfo(userName: userInfo.userName, avatarURL: userInfo.avatarUrl)
                    TUIRoomKit.sharedInstance.enterPrepareView(enablePreview: true)
                } failed: { [weak self] (err) in
                    guard let self = self else { return }
                    self.view.makeToast(err)
                }
            } else {
                TUIRoomKit.sharedInstance.setSelfInfo(userName: userInfo.userName, avatarURL: userInfo.avatarUrl)
                TUIRoomKit.sharedInstance.enterPrepareView(enablePreview: true)
            }
        } else {
            debugPrint("onLogin:code:\(code),message:\(message)")
            self.view.makeToast(LoginLocalize(key: "App.PortalViewController.loginimfailed"))
        }
    }
}
