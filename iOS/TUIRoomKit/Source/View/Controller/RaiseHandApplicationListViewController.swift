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
    let rootView: RaiseHandApplicationListView
    
    let backButton: UIButton = {
        let button = UIButton(type: .custom)
        let normalIcon = UIImage(named: "room_back_white", in: tuiRoomKitBundle(), compatibleWith: nil)
        button.setImage(normalIcon, for: .normal)
        return button
    }()
    
    init(raiseHandApplicationListViewModelFactory: RaiseHandApplicationListViewModelFactory) {
        self.viewModel = raiseHandApplicationListViewModelFactory.makeRaiseHandApplicationListViewModel()
        self.rootView = RaiseHandApplicationListView(viewModel: viewModel)
        super.init(nibName: nil, bundle: nil)
        backButton.addTarget(self, action: #selector(backAction(sender:)), for: .touchUpInside)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        view = self.rootView
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
        navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        navigationItem.hidesSearchBarWhenScrolling = false
    }
    
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        rootView.searchController.isActive = false
    }
    
    @objc func backAction(sender: UIButton) {
        RoomRouter.shared.pop()
    }
    
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
