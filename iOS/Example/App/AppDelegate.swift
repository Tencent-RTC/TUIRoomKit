//
//  AppDelegate.swift
//  DemoApp
//
//  Created by wesley on 2021/6/21.
//

import ImSDK_Plus
import TUIRoom
import UIKit
import TUIBeauty

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        TUIBeautyView.getBeautyService().setLicenseUrl(XMagicLicenseURL, key: XMagicLicenseKey) { code, msg in
            debugPrint("auth result code:\(code) msg:\(msg)")
        }
        return true
    }

    // MARK: UISceneSession Lifecycle

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Called when a new scene session is being created.
        // Use this method to select a configuration to create the new scene with.
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
    }

    func showMainViewController() {
        guard ProfileManager.shared.curUserID() != nil else {
            debugPrint("not login")
            return
        }
        let listVC = AppMainViewController()
        let rootVC = UINavigationController(rootViewController: listVC)
        if let keyWindow = SceneDelegate.getCurrentWindow() {
            keyWindow.rootViewController = rootVC
            keyWindow.makeKeyAndVisible()
        }
    }

    func showLoginViewController() {
        let loginVC = TRTCLoginViewController()
        let nav = UINavigationController(rootViewController: loginVC)
        if let keyWindow = SceneDelegate.getCurrentWindow() {
            keyWindow.rootViewController = nav
            keyWindow.makeKeyAndVisible()
        } else {
            debugPrint("window error")
        }
    }
}
