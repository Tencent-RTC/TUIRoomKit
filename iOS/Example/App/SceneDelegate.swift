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
        processOfflinePush(connectionOptions: connectionOptions)
        let loginVC = TRTCLoginViewController()
        let nav = RoomNavigationController(rootViewController: loginVC)
        window?.rootViewController = nav
        window?.makeKeyAndVisible()
    }
    
    private func processOfflinePush(connectionOptions: UIScene.ConnectionOptions) {
        guard let pushNotification = connectionOptions.notificationResponse?.notification.request.content.userInfo else { return }
        guard let extString = pushNotification["ext"] as? String else { return }
        guard let dict = extString.convertToDic() else { return }
        guard let roomId = dict["RoomId"] as? String else { return }
        guard let notificationType = dict["NotificationType"] as? String else { return }
        AppUtils.shared.roomId = roomId
        AppUtils.shared.notificationType = notificationType
        AppUtils.shared.extString = extString
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
