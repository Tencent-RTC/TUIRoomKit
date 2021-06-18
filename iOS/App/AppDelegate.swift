//
//  AppDelegate.swift
//  TRTCMeeting
//
//  Created by abyyxwang on 2021/5/6.
//

import UIKit
import TUIMeeting
import ImSDK_Plus

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    let LICENCEURL = ""
    let LICENCEKEY = ""

    func setLicence() {
        TXLiveBase.setLicenceURL(LICENCEURL, key: LICENCEKEY)
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        setLicence()
        
        return true
    }

    // MARK: UISceneSession Lifecycle

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Called when a new scene session is being created.
        // Use this method to select a configuration to create the new scene with.
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // Called when the user discards a scene session.
        // If any sessions were discarded while the application was not running, this will be called shortly after application:didFinishLaunchingWithOptions.
        // Use this method to release any resources that were specific to the discarded scenes, as they will not return.
    }

    func showMainViewController() {
        TRTCMeeting.sharedInstance().login(UInt32(SDKAPPID), userId: ProfileManager.shared.curUserID() ?? "", userSig: ProfileManager.shared.curUserSig()) { (code, msg) in
            debugPrint("Login \(code == 0 ? "success" : "failed")")
        }
        let vc = TRTCMeetingNewViewController()
        vc.title = TRTCMeetingLocalize("Video Conferencing")
        vc.navigationToPopCallback = { [weak self, weak vc] in
            guard let `self` = self, let `meetingVC` = vc else { return }
            let alertVC = UIAlertController.init(title: TRTCMeetingLocalize("App.PortalViewController.areyousureloginout"), message: nil, preferredStyle: .alert)
            let cancelAction = UIAlertAction.init(title: TRTCMeetingLocalize("App.PortalViewController.cancel"), style: .cancel, handler: nil)
            let sureAction = UIAlertAction.init(title: TRTCMeetingLocalize("App.PortalViewController.determine"), style: .default) { [weak self] (action) in
                guard let `self` = self else { return }
                ProfileManager.shared.removeLoginCache()
                self.showLoginViewController()
                V2TIMManager.sharedInstance()?.logout({
                    
                }, fail: { (errCode, errMsg) in
                    
                })
            }
            alertVC.addAction(cancelAction)
            alertVC.addAction(sureAction)
            meetingVC.present(alertVC, animated: true, completion: nil)
        }
        
        let nav = UINavigationController(rootViewController: vc)
        nav.navigationBar.barTintColor = .white
        vc.navigationController?.navigationBar.titleTextAttributes = [.foregroundColor : UIColor.black]
        if let keyWindow = SceneDelegate.getCurrentWindow() {
            keyWindow.rootViewController = nav
            keyWindow.makeKeyAndVisible()
        }
    }
    
    
    func showLoginViewController() {
        let loginVC = TRTCLoginViewController.init()
        let nav = UINavigationController(rootViewController: loginVC)
        if let keyWindow = SceneDelegate.getCurrentWindow() {
            keyWindow.rootViewController = nav
            keyWindow.makeKeyAndVisible()
        }
        else {
            debugPrint("window error")
        }
    }

}

