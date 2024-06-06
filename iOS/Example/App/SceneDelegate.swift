//
//  SceneDelegate.swift
//  DemoApp
//
//  Created by wesley on 2021/6/21.
//

import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    @available(iOS 13.0, *)
    func scene(_ scene: UIScene,
               willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = UIColor.white

        let loginVC = TRTCLoginViewController()
        let nav = RoomNavigationController(rootViewController: loginVC)
        window?.rootViewController = nav
        window?.makeKeyAndVisible()
    }

    static func getCurrentWindow() -> UIWindow? {
        if #available(iOS 13, *) {
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
                if let keyWindow = windowScene.windows.first {
                    return keyWindow
                }
            }
        } else {
            for window in UIApplication.shared.windows {
                if window.isMember(of: UIWindow.self), window.isKeyWindow {
                    return window
                }
            }
        }
        return nil
    }
}
