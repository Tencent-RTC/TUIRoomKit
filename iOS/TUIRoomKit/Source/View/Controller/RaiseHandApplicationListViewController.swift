//
//  RaiseHandApplicationListViewController.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/13.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

protocol RaiseHandApplicationListViewModelFactory {
    func makeRaiseHandApplicationListViewModel() -> RaiseHandApplicationListViewModel
}

class RaiseHandApplicationListViewController: UIViewController {
    let viewModel: RaiseHandApplicationListViewModel
    init(raiseHandApplicationListViewModelFactory: RaiseHandApplicationListViewModelFactory) {
        self.viewModel = raiseHandApplicationListViewModelFactory.makeRaiseHandApplicationListViewModel()
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        view = RaiseHandApplicationListView(viewModel: viewModel)
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
