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
import TIMPush

#if DEBUG
let offlinePushBusinessID: Int32 = 0
#else
let offlinePushBusinessID: Int32 = 0
#endif

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    
    var orientation: UIInterfaceOrientationMask = .allButUpsideDown
    
    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return orientation
    }
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        if #available(iOS 13, *) {
        } else {
            window = UIWindow(frame: UIScreen.main.bounds)
            window?.backgroundColor = UIColor.white

            let loginVC = TRTCLoginViewController()
            let nav = RoomNavigationController(rootViewController: loginVC)
            window?.rootViewController = nav
            window?.makeKeyAndVisible()
        }
        return true
    }
    
    // MARK: UISceneSession Lifecycle
    
    @available(iOS 13.0, *)
    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Called when a new scene session is being created.
        // Use this method to select a configuration to create the new scene with.
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
    
    @available(iOS 13.0, *)
    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
    }
    
}

extension AppDelegate: TIMPushDelegate {
    func offlinePushCertificateID() -> Int32 {
        return offlinePushBusinessID
    }
    
    func onRemoteNotificationReceived(_ notice: String?) -> Bool {
        guard let notice = notice else { return false }
        guard let dict = notice.convertToDic() else { return false }
        guard let roomId = dict["RoomId"] as? String else { return false }
        if V2TIMManager.sharedInstance().getLoginStatus() == .STATUS_LOGINED {
            AppUtils.shared.showConferenceMainViewController(roomId: roomId)
        }
        return true
    }
}
