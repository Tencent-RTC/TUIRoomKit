//
//  PopUpViewController.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/12.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation
import TUICore

class PopUpView: UIView {
    let viewModel: PopUpViewModel
    var rootView: UIView?
    
    init(viewModel: PopUpViewModel) {
        self.viewModel = viewModel
        super.init(frame: .zero)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        backgroundColor = .clear
        constructViewHierarchy()
        activateConstraints()
    }
    
    func constructViewHierarchy() {
        setupViewState()
        guard let rootView = rootView else { return }
        addSubview(rootView)
    }
    
    func activateConstraints() {
        if viewModel.height > 0 {
            rootView?.snp.makeConstraints { make in
                make.width.equalToSuperview()
                make.bottom.equalToSuperview()
                make.height.equalTo(viewModel.height)
            }
        } else {
            rootView?.snp.makeConstraints { make in
                make.edges.equalToSuperview()
            }
        }
    }
    
    func setupViewState() {
        switch viewModel.viewType {
            case .roomInfoViewType:
                let model = RoomInfoViewModel()
                rootView = RoomInfoView(viewModel: model)
            case .moreViewType:
                let model = MoreFunctionViewModel()
                rootView = MoreFunctionView(viewModel: model)
            case .setUpViewType:
                let model = SetUpViewModel()
                let view = SetUpView(viewModel: model)
                rootView = view
        }
    }
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        RoomRouter.shared.dismissPopupViewController()
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
