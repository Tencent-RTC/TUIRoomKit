//
//  AppMainViewController.swift
//  DemoApp
//
//  Created by wesley on 2021/7/20.
//

import TUICore
import TUIRoomKit

class AppMainModel {
    init() {}
    func loginTUIRoomKit() {
        TUIRoomKit.sharedInstance.addListener(listener: self)
        TUIRoomKit.sharedInstance.login(sdkAppId: Int(TUILogin.getSdkAppID()), userId: TUILogin.getUserID(), userSig: TUILogin.getUserSig())
    }
}

extension AppMainModel: TUIRoomKitListener {
    func onLogin(code: Int, message: String) {
        if code == 0 {
            TUIRoomKit.sharedInstance.setSelfInfo(userName: TUILogin.getNickName(), avatarURL: TUILogin.getUserID())
            TUIRoomKit.sharedInstance.enterPrepareView(enablePreview: true)
        } else {
            debugPrint("onLogin:code:\(code),message:\(message)")
        }
    }
}
