//
//  appUtil.swift
//  trtcScenesDemo
//
//  Created by xcoderliu on 12/24/19.
//  Copyright © 2019 xcoderliu. All rights reserved.
//
// 用于TRTC_SceneDemo

import ImSDK_Plus
import UIKit

class AppUtils: NSObject {
    @objc static let shared = AppUtils()
    override private init() {}

    @objc var appDelegate: AppDelegate {
        return UIApplication.shared.delegate as! AppDelegate
    }

    @objc var curUserId: String {
        return V2TIMManager.sharedInstance()?.getLoginUser() ?? ""
    }

    // MARK: - UI

    @objc func showMainController() {
        appDelegate.showMainViewController()
    }

    @objc func alertUserTips(_ vc: UIViewController) {
        // 提醒用户不要用Demo App来做违法的事情
        // 外发代码不需要提示
    }
}
