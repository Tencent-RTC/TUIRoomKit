//
//  RoomPrePareViewController.swift
//  Alamofire
//
//  Created by aby on 2022/12/26.
//  Copyright © 2022 Tencent. All rights reserved.
//

import UIKit
import TUICore

class RoomPrePareViewController: UIViewController {
    var languageID: String {
        TUIGlobalization.tk_localizableLanguageKey()
    }
    override var shouldAutorotate: Bool {
        return false
    }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .portrait
    }
    init() {
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(true, animated: false)
        UIApplication.shared.isIdleTimerDisabled = false
    }
    
    override func loadView() {
        let rootView = PrePareView()
        rootView.rootViewController = self
        self.view = rootView
    }
    
    func backAction() {
        navigationController?.dismiss(animated: true)
    }
    
    func joinRoom() {
        navigationController?.pushViewController(EnterRoomViewController(), animated: true)
    }
    
    func createRoom() {
        navigationController?.pushViewController(CreateRoomViewController(), animated: true)
    }
    
    func showDebugVC() {
        let debugVC = RoomFileBrowserViewController(bathPath: NSHomeDirectory())
        navigationController?.pushViewController(debugVC, animated: true)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
