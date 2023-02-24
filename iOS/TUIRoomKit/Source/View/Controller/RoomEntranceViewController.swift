//
//  TUIRoomViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import SnapKit
import UIKit
import TUIRoomEngine
import TUICore

protocol RoomEntranceViewModelFactory {
    func makeRootView(isCreateRoom: Bool) -> UIView
}

class RoomEntranceViewController: UIViewController {
    
    let rootView: UIView
    init(roomMainViewModelFactory: RoomEntranceViewModelFactory, isCreateRoom: Bool) {
        rootView = roomMainViewModelFactory.makeRootView(isCreateRoom: isCreateRoom)
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        view = rootView
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
