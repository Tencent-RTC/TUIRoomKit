//
//  PopUpViewController.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/12.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation
import UIKit

protocol PopUpViewFactory {
    func makeRootView(viewType: PopUpViewType, height:CGFloat) -> UIView
}

class PopUpViewController: UIViewController {
    let rootView: UIView
    
    init(popUpViewFactory: PopUpViewFactory, viewType: PopUpViewType, height: CGFloat) {
        rootView = popUpViewFactory.makeRootView(viewType: viewType, height: height)
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .overFullScreen
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        view = rootView
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(true, animated: false)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
