//
//  AppDelegate.swift
//  DemoApp
//
//  Created by wesley on 2021/6/21.
//

import ImSDK_Plus
import TUIRoomKit
import UIKit
import TUIRoomKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    lazy var window: UIWindow? = {
        return SceneDelegate.getCurrentWindow()
    }()
    
    var orientation: UIInterfaceOrientationMask = .allButUpsideDown
    
    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return orientation
    }
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
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
        let prePareViewController = RoomPrePareViewController()
        let nav = RoomNavigationController(rootViewController: prePareViewController)
        nav.modalPresentationStyle = .fullScreen
        getCurrentWindowViewController()?.present(nav, animated: true)
    }
    
    func showLoginViewController() {
        let loginVC = TRTCLoginViewController()
        let nav = RoomNavigationController(rootViewController: loginVC)
        if let keyWindow = SceneDelegate.getCurrentWindow() {
            keyWindow.rootViewController = nav
            keyWindow.makeKeyAndVisible()
        } else {
            debugPrint("window error")
        }
    }
    
    private func getCurrentWindowViewController() -> UIViewController? {
        var keyWindow: UIWindow?
        for window in UIApplication.shared.windows {
            if window.isMember(of: UIWindow.self), window.isKeyWindow {
                keyWindow = window
                break
            }
        }
        guard let rootController = keyWindow?.rootViewController else {
            return nil
        }
        func findCurrentController(from vc: UIViewController?) -> UIViewController? {
            if let nav = vc as? UINavigationController {
                return findCurrentController(from: nav.topViewController)
            } else if let tabBar = vc as? UITabBarController {
                return findCurrentController(from: tabBar.selectedViewController)
            } else if let presented = vc?.presentedViewController {
                return findCurrentController(from: presented)
            }
            return vc
        }
        let viewController = findCurrentController(from: rootController)
        return viewController
    }
}
