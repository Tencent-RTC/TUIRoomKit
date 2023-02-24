//
//  TransferMasterViewController.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/2/20.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

protocol TransferMasterViewModelFactory {
    func makeTransferMasterViewModel() -> TransferMasterViewModel
}

class TransferMasterViewController: UIViewController {
    let viewModel: TransferMasterViewModel
    init(transferMasterViewModelFactory: TransferMasterViewModelFactory) {
        self.viewModel = transferMasterViewModelFactory.makeTransferMasterViewModel()
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        view = TransferMasterView(viewModel: viewModel)
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
