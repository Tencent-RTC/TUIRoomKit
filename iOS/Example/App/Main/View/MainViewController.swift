//
//  MainViewController.swift
//  DemoApp
//
//  Created by 唐佳宁 on 2023/7/24.
//

import Foundation
import UIKit
import TUIRoomKit
import TUICore

class MainViewController: UIViewController {
    private var isEnterRoom: Bool = false
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(true, animated: false)
        UIApplication.shared.isIdleTimerDisabled = true
    }
    
    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
        super.init(nibName: nil, bundle: nil)
        TUIRoomKit.sharedInstance.addListener(listener: self)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        let rootView = MainView()
        rootView.rootViewController = self
        view = rootView
    }
    
    func enterPrepareView() {
        if isEnterRoom {
            view.makeToast(.enteredRoom)
        } else {
            TUIRoomKit.sharedInstance.enterPrepareView(enablePreview: true)
        }
    }
    
    func logout() {
        TUIRoomKit.sharedInstance.logout()
        navigationController?.popToRootViewController(animated: true)
    }
}

extension MainViewController: TUIRoomKitListener {
    func onRoomEnter(code: Int, message: String) {
        isEnterRoom = code == 0
    }
    
    func onExitRoom() {
        isEnterRoom = false
    }
    
    func onDestroyRoom() {
        isEnterRoom = false
    }
}

private extension String {
    static var enteredRoom: String {
        TRTCDemoLocalize("TUIRoom.entered.room")
    }
}


