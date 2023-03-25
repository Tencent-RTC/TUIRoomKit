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
    
    let backButton: UIButton = {
        let button = UIButton(type: .custom)
        let normalIcon = UIImage(named: "room_back_white", in: tuiRoomKitBundle(), compatibleWith: nil)
        button.setImage(normalIcon, for: .normal)
        return button
    }()
    
    init(qrCodeViewModelFactory: QRCodeViewModelFactory) {
        self.viewModel = qrCodeViewModelFactory.makeQRCodeViewModel()
        super.init(nibName: nil, bundle: nil)
        backButton.addTarget(self, action: #selector(backAction(sender:)), for: .touchUpInside)
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
        navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
    }
    
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
    }
    
    @objc
    func backAction(sender: UIButton) {
        RoomRouter.shared.pop()
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
