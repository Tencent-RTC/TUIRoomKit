//
//  RoomMainViewController.swift
//  TUIRoomKit
//
//  Created by aby on 2022/12/27.
//  Copyright © 2022 Tencent. All rights reserved.
//

import UIKit

protocol RoomMainViewModelFactory {
    func makeRoomMainViewModel() -> RoomMainViewModel
}

class RoomMainViewController: UIViewController {
    
    let viewModel: RoomMainViewModel
    init(roomMainViewModelFactory: RoomMainViewModelFactory) {
        self.viewModel = roomMainViewModelFactory.makeRoomMainViewModel()
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        self.view = RoomMainRootView(viewModel: viewModel, viewFactory: viewModel)
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(true, animated: false)
        UIApplication.shared.isIdleTimerDisabled = true
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
        UIApplication.shared.isIdleTimerDisabled = false
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
