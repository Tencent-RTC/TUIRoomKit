//
//  QRCodeViewController.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/11.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

protocol QRCodeViewModelFactory {
    func makeQRCodeViewModel() -> QRCodeViewModel
}

class QRCodeViewController: UIViewController {
    let viewModel: QRCodeViewModel
    init(qrCodeViewModelFactory: QRCodeViewModelFactory) {
        self.viewModel = qrCodeViewModelFactory.makeQRCodeViewModel()
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        super.loadView()
        self.view = QRCodeView(viewModel: viewModel)
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
