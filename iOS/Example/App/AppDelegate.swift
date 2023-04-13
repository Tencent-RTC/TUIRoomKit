//
//  AppDelegate.swift
//  DemoApp
//
//  Created by wesley on 2021/6/21.
//

import ImSDK_Plus
import TUIRoomKit
import UIKit
import TUIBeauty

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var blockRotation = false
    lazy var window: UIWindow? = {
       return SceneDelegate.getCurrentWindow()
    }()
    lazy var mainModel: AppMainModel = {
        return AppMainModel()
    }()
    
    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        if blockRotation {
            return .allButUpsideDown
        }
        return .portrait
    }
    
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
        mainModel.loginTUIRoomKit()
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
