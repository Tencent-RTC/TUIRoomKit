//
//  AppMainViewController.swift
//  DemoApp
//
//  Created by wesley on 2021/7/20.
//

import TUICore
import TUIRoom
import UIKit

class AppMainViewController: UIViewController {
    func enterRoom(roomId: String) {
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = .naviTitleText
        navigationController?.navigationBar.barTintColor = .white
        initNavigationItemTitleView()
        let vc = TUIRoomEntranceViewController()
        // 美颜License设置 【可选】
        vc.xMagicLicenseURL = XMagicLicenseURL
        vc.xMagicLicenseKey = XMagicLicenseKey
        addChild(vc)
        view.addSubview(vc.view)
        vc.view.mm_y = 64 + kDeviceSafeTopHeight
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
    }
}

// MARK: - UI

extension AppMainViewController {
    private func initNavigationItemTitleView() {
        let titleView = UILabel()
        titleView.text = .videoInteractionText
        titleView.textColor = .black
        titleView.textAlignment = .center
        titleView.font = UIFont.boldSystemFont(ofSize: 17)
        titleView.adjustsFontSizeToFitWidth = true
        let width = titleView.sizeThatFits(CGSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)).width
        titleView.frame = CGRect(origin: CGPoint.zero, size: CGSize(width: width, height: 500))
        navigationItem.titleView = titleView

        let helpBtn = UIButton(type: .custom)
        helpBtn.setImage(UIImage(named: "help_small"), for: .normal)
        helpBtn.addTarget(self, action: #selector(connectWeb), for: .touchUpInside)
        helpBtn.sizeToFit()
        let rightItem = UIBarButtonItem(customView: helpBtn)
        rightItem.tintColor = .black
        navigationItem.rightBarButtonItems = [rightItem]

        let backBtn = UIButton(type: .custom)
        backBtn.setImage(UIImage(named: "liveroom_back"), for: .normal)
        backBtn.addTarget(self, action: #selector(backBtnClick), for: .touchUpInside)
        backBtn.sizeToFit()
        let backItem = UIBarButtonItem(customView: backBtn)
        backItem.tintColor = .black
        navigationItem.leftBarButtonItem = backItem
    }
}

// MARK: - action

extension AppMainViewController {
    @objc func backBtnClick() {
        let alertVC = UIAlertController(title: TRTCDemoLocalize("App.PortalViewController.areyousureloginout"),
                                        message: nil,
                                        preferredStyle: .alert)
        let cancelAction = UIAlertAction(title: TRTCDemoLocalize("App.PortalViewController.cancel"),
                                         style: .cancel,
                                         handler: nil)
        let sureAction = UIAlertAction(title: TRTCDemoLocalize("App.PortalViewController.determine"),
                                       style: .default) { _ in
            ProfileManager.shared.removeLoginCache()
            TUILogin.logout {
                AppUtils.shared.appDelegate.showLoginViewController()
            } fail: { errCode, errMsg in
                debugPrint("errCode = \(errCode), errMsg = \(errMsg ?? "")")
            }
        }
        alertVC.addAction(cancelAction)
        alertVC.addAction(sureAction)
        present(alertVC, animated: true, completion: nil)
    }

    @objc func connectWeb() {
        if let url = URL(string: "https://cloud.tencent.com/document/product/647/45681") {
            UIApplication.shared.openURL(url)
        }
    }
}

extension String {
    static let naviTitleText = TRTCDemoLocalize("Demo.TRTC.Karaoke.voicechatroom")
    static let videoInteractionText = TRTCDemoLocalize("Demo.TRTC.Karaoke.voicechatroom")
    static let promptText = TRTCDemoLocalize("Demo.TRTC.LiveRoom.prompt")
    static let okText = TRTCDemoLocalize("Demo.TRTC.LiveRoom.ok")
    static let roomNumberisText = TRTCDemoLocalize("Demo.TRTC.LiveRoom.roomNumberis:")
    static let roomdoesnotexistText = TRTCDemoLocalize("Demo.TRTC.LiveRoom.roomdoesnotexist")
}
