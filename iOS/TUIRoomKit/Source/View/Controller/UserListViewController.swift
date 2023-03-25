//
//  UserListViewController.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/4.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

protocol UserListViewModelFactory {
    func makeUserListViewModel() -> UserListViewModel
}

class UserListViewController: UIViewController {
    let viewModel: UserListViewModel
    let rootView: UserListView
    init(userListViewModelFactory: UserListViewModelFactory) {
        self.viewModel = userListViewModelFactory.makeUserListViewModel()
        self.rootView = UserListView(viewModel: viewModel)
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        self.view = self.rootView
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        rootView.searchController.isActive = false
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
