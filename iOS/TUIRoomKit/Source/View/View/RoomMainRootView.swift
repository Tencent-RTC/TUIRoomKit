//
//  RoomMainRootView.swift
//  TUIRoomKit
//
//  Created by aby on 2022/12/27.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation

protocol RoomMainViewFactory {
    func makeBottomView() -> UIView
    func makeTopView() -> UIView
    func makeMiddleView() -> UIView
    func makeBeautyView() -> UIView?
}

class RoomMainRootView: UIView {
    let viewModel: RoomMainViewModel
    let viewFactory: RoomMainViewFactory
    init(viewModel: RoomMainViewModel,
         viewFactory: RoomMainViewFactory) {
        self.viewModel = viewModel
        self.viewFactory = viewFactory
        super.init(frame: .zero)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    lazy var topView: UIView = {
        return viewFactory.makeTopView()
    }()
    
    lazy var videoSeatView: UIView = {
        return viewFactory.makeMiddleView()
    }()
    
    lazy var bottomView: UIView = {
        return viewFactory.makeBottomView()
    }()
    
    lazy var beautyView: UIView? = {
        return viewFactory.makeBeautyView()
    }()
    
    // MARK: - view layout
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        backgroundColor = UIColor(0x1B1E26)
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    func constructViewHierarchy() {
        addSubview(videoSeatView)
        addSubview(topView)
        addSubview(bottomView)
        guard let beautyView = beautyView else { return }
        addSubview(beautyView)
    }
    
    func activateConstraints() {
        topView.snp.makeConstraints { make in
            make.top.equalTo(safeAreaLayoutGuide.snp.top)
            make.width.equalToSuperview()
            make.height.equalTo(53.scale375())
            make.centerX.equalToSuperview()
        }
        bottomView.snp.makeConstraints { make in
            make.width.equalToSuperview()
            make.height.equalTo(52.scale375())
            make.bottom.equalTo(safeAreaLayoutGuide.snp.bottom)
        }
        videoSeatView.snp.makeConstraints { make in
            make.width.equalToSuperview()
            make.top.equalTo(topView.snp.bottom)
            make.bottom.equalTo(bottomView.snp.top).offset(-5)
        }
        guard let beautyView = beautyView else { return }
        beautyView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }
    
    private func bindInteraction() {
        viewModel.viewResponder = self
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension RoomMainRootView: RoomMainViewResponder {
    func showSelfBecomeRoomOwnerAlert() {
        let alertVC = UIAlertController(title: .haveBecomeMasterText,
                                        message: .haveTransferredMaster,
                                        preferredStyle: .alert)
        let sureAction = UIAlertAction(title: .agreeText, style: .default) { _ in
        }
        alertVC.addAction(sureAction)
        RoomRouter.shared.presentAlert(alertVC)
    }
    func showBeautyView() {
        beautyView?.isHidden = false
    }
    func makeToast(text: String) {
        RoomRouter.makeToast(toast: text)
    }
}

private extension String {
    static let agreeText = localized("TUIRoom.agree")
    static let haveBecomeMasterText = localized("TUIRoom.have.become.master")
    static let haveTransferredMaster = localized("TUIRoom.have.transferred.master.to.you")
}
