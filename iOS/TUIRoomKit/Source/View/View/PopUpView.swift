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
    
    lazy var beautyView: UIView? = {
        let roomEngine = EngineManager.shared.roomEngine
        let beautyManager = roomEngine.getTRTCCloud().getBeautyManager()
        let beautyInfo = TUICore.getExtensionInfo(TUICore_TUIBeautyExtension_BeautyView,
                                                  param: [
                                                    TUICore_TUIBeautyExtension_BeautyView_BeautyManager: beautyManager,])
        if let view = beautyInfo[TUICore_TUIBeautyExtension_BeautyView_View] as? UIView {
            view.isHidden = false
            return view
        }
        return nil
    }()
    
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
        case .beautyViewType:
           rootView = beautyView
        case .setUpViewType:
            let model = SetUpViewModel(videoModel: EngineManager.shared.store.videoSetting, audioModel: EngineManager.shared.store.audioSetting)
            rootView = SetUpView(viewModel: model)
        }
    }
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        if let controller = RoomRouter.shared.currentViewController() as? PopUpViewController {
            controller.dismiss(animated: true)
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
