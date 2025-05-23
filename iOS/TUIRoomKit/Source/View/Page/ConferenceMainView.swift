//
//  ConferenceMainView.swift
//  TUIRoomKit
//
//  Created by aby on 2022/12/27.
//  Copyright © 2022 Tencent. All rights reserved.
//  The main conference interface is responsible for arranging and managing the top bar, bottom bar, video interface, etc.
//

import Foundation
import RTCRoomEngine
import Factory
import Combine

protocol ConferenceMainViewFactory {
    func makeBottomView() -> BottomView
    func makeTopView() -> TopView
    func makeVideoSeatView() -> UIView
    func makeRaiseHandNoticeView() -> UIView
    func makeLocalAudioView() -> LocalAudioView
    func makeWaterMarkLayer() -> WaterMarkLayer
    func makeFloatChatButton() -> FloatChatButton
    func makeFloatChatDisplayView() -> FloatChatDisplayView
    func makeRaiseHandApplicationNotificationView() -> RaiseHandApplicationNotificationView
    func makeConferencePasswordView() -> ConferencePasswordView
}

struct ConferenceMainViewLayout { //Layout changes when switching between horizontal and vertical screens
    let bottomViewLandscapeSpace: Float = 0
    let bottomViewPortraitSpace: Float = 34.0
    let topViewLandscapeHight: Float = 75.0
    let topViewPortraitHight: Float = 105.0
    let videoSeatViewPortraitSpace: Float = 73.0
    let videoSeatViewLandscapeSpace: Float = 82.0
}

class ConferenceMainView: UIView {
    let viewModel: ConferenceMainViewModel
    let viewFactory: ConferenceMainViewFactory
    let layout: ConferenceMainViewLayout = ConferenceMainViewLayout()
    init(viewModel: ConferenceMainViewModel,
         viewFactory: ConferenceMainViewFactory) {
        self.viewModel = viewModel
        self.viewFactory = viewFactory
        super.init(frame: .zero)
        viewModel.viewResponder = self
        subscribeUIEvent()
    }
    private var currentLandscape: Bool = isLandscape
    private let firstDelayDisappearanceTime = 6.0
    private let delayDisappearanceTime = 3.0
    private lazy var disableMessageUsersPublisher = {
        operation.select(UserSelectors.getDisableMessageUsers)
    }()
    private var cancellableSet = Set<AnyCancellable>()
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    lazy var topView: TopView = {
        return viewFactory.makeTopView()
    }()
    
    lazy var videoSeatView: UIView = {
        return viewFactory.makeVideoSeatView()
    }()
    
    lazy var bottomView: BottomView = {
        return viewFactory.makeBottomView()
    }()
    
    lazy var raiseHandNoticeView: UIView = {
        return viewFactory.makeRaiseHandNoticeView()
    }()
    
    lazy var localAudioView: LocalAudioView = {
        return viewFactory.makeLocalAudioView()
    }()
    
    lazy var waterMarkLayer: WaterMarkLayer = {
        return viewFactory.makeWaterMarkLayer()
    }()
    
    lazy var floatChatDisplayView: FloatChatDisplayView = {
        return viewFactory.makeFloatChatDisplayView()
    }()
    
    lazy var floatChatButton: FloatChatButton = {
        return viewFactory.makeFloatChatButton()
    }()
    
    lazy var raiseHandApplicationNotificationView: RaiseHandApplicationNotificationView = {
        let applicationNotificationView = viewFactory.makeRaiseHandApplicationNotificationView()
        return applicationNotificationView
    }()
    
    lazy var conferencePasswordView: ConferencePasswordView = {
        return viewFactory.makeConferencePasswordView()
    }()
    
    // MARK: - view layout
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        backgroundColor = UIColor(0x0F1014)
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        guard currentLandscape != isLandscape else { return }
        setupRootViewOrientation(isLandscape: isLandscape)
        viewModel.setVideoResolutionMode(isLandscape: isLandscape)
        currentLandscape = isLandscape
    }
    
    func constructViewHierarchy() {
        addSubview(videoSeatView)
        if viewModel.isShownWaterMark {
            layer.addSublayer(waterMarkLayer)
        }
        addSubview(topView)
        addSubview(floatChatDisplayView)
        addSubview(floatChatButton)
        addSubview(bottomView)
        addSubview(localAudioView)
        addSubview(raiseHandNoticeView)
        addSubview(raiseHandApplicationNotificationView)
        addSubview(conferencePasswordView)
    }
    
    func activateConstraints() {
        setupRootViewOrientation(isLandscape: isLandscape)
        raiseHandNoticeView.snp.makeConstraints { make in
            make.bottom.equalTo(bottomView.snp.top).offset(-15)
            make.centerX.equalToSuperview()
            make.height.equalTo(40)
            make.width.equalTo(300)
        }
        localAudioView.snp.makeConstraints { make in
            make.centerX.equalToSuperview()
            make.width.height.equalTo(40.scale375())
            make.bottom.equalToSuperview().offset(-40.scale375Height())
        }
        floatChatButton.snp.makeConstraints { make in
            make.bottom.equalTo(localAudioView.snp.top).offset(-18)
            make.height.equalTo(30)
            make.leading.equalTo(videoSeatView.snp.leading)
        }
        floatChatDisplayView.snp.makeConstraints { make in
            make.bottom.equalTo(floatChatButton.snp.top).offset(-8)
            make.height.equalTo(128)
            make.leading.equalToSuperview().offset(5)
            make.width.equalTo(313)
        }
        raiseHandApplicationNotificationView.snp.makeConstraints { make in
            make.top.equalTo(topView.snp.bottom)
            make.width.equalTo(359.scale375())
            make.centerX.equalToSuperview()
            make.height.equalTo(40.scale375Height())
        }
        conferencePasswordView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }
    
    private func bindInteraction() {
        perform(#selector(hideToolBar),with: nil,afterDelay: firstDelayDisappearanceTime)
        subscribeSubject()
    }
    
    func setupRootViewOrientation(isLandscape: Bool) {
        videoSeatView.snp.remakeConstraints { make in
            if isLandscape {
                make.leading.equalTo(layout.videoSeatViewLandscapeSpace)
                make.trailing.equalTo(-layout.videoSeatViewLandscapeSpace)
                make.top.bottom.equalToSuperview()
            } else {
                make.leading.trailing.equalToSuperview()
                make.top.equalTo(layout.videoSeatViewPortraitSpace)
                make.bottom.equalTo(-layout.videoSeatViewPortraitSpace)
            }
        }
        topView.snp.remakeConstraints() { make in
            make.top.equalToSuperview()
            make.leading.equalTo(safeAreaLayoutGuide.snp.leading)
            make.trailing.equalTo(safeAreaLayoutGuide.snp.trailing)
            if isLandscape {
                make.height.equalTo(layout.topViewLandscapeHight)
            } else {
                make.height.equalTo(layout.topViewPortraitHight)
            }
        }
        bottomView.snp.remakeConstraints { make in
            make.leading.equalTo(safeAreaLayoutGuide.snp.leading)
            make.trailing.equalTo(safeAreaLayoutGuide.snp.trailing)
            make.height.equalTo(bottomView.isUnfold ? bottomView.unfoldHeight : bottomView.packUpHeight)
            if isLandscape {
                make.bottom.equalToSuperview().offset(-layout.bottomViewLandscapeSpace)
            } else {
                make.bottom.equalToSuperview().offset(-layout.bottomViewPortraitSpace)
            }
        }
        topView.updateRootViewOrientation(isLandscape: isLandscape)
        setupWaterMarkLayerOrientation(isLandscape: isLandscape)
    }
    
    private func setupWaterMarkLayerOrientation(isLandscape: Bool) {
        guard viewModel.isShownWaterMark else { return }
        let widthSpace = isLandscape ? CGFloat(layout.videoSeatViewLandscapeSpace) : 0
        let heightSpace = isLandscape ? 0 : CGFloat(layout.videoSeatViewPortraitSpace)
        waterMarkLayer.frame = CGRect(x: widthSpace, y: heightSpace, width: kScreenWidth - widthSpace * 2, height: kScreenHeight - heightSpace * 2)
        waterMarkLayer.setNeedsDisplay()
    }
    
    private func subscribeUIEvent() {
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_ShowFloatChatView, responder: self)
    }
    
    private func unsubscribeEvent() {
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_ShowFloatChatView, responder: self)
    }
    
    deinit {
        NSObject.cancelPreviousPerformRequests(withTarget: self)
        unsubscribeEvent()
        debugPrint("deinit \(self)")
    }
    
    // MARK: - private property.
    @Injected(\.conferenceStore) private var operation
    @Injected(\.navigation) private var route
}

extension ConferenceMainView: ConferenceMainViewResponder {
    func updateWaterMarkLayer(text: String) {
        waterMarkLayer.updateWaterMarkImage(text: text)
    }
    
    func hidePasswordView() {
        conferencePasswordView.hide()
    }
    
    func showPasswordView(roomId: String) {
        conferencePasswordView.show(roomId: roomId)
    }
    
    func showExitRoomView() {
        let view = ExitRoomView(viewModel: ExitRoomViewModel())
        view.show(rootView: self)
    }
    
    func showAlert(title: String?, message: String?, sureTitle:String?, declineTitle: String?, sureBlock: (() -> ())?, declineBlock: (() -> ())?) {
        RoomRouter.presentAlert(title: title, message: message, sureTitle: sureTitle, declineTitle: declineTitle, sureBlock: sureBlock, declineBlock: declineBlock)
    }
    
    func showAlertWithAutoConfirm(title: String?, message: String?, sureTitle:String?, declineTitle: String?, sureBlock: (() -> ())?, declineBlock: (() -> ())?, autoConfirmSeconds: Int?) {
        RoomRouter.presentAlert(title: title, message: message, sureTitle: sureTitle, declineTitle: declineTitle, sureBlock: sureBlock, declineBlock: declineBlock, autoConfirmSeconds: autoConfirmSeconds)
    }
    
    func makeToast(text: String) {
        RoomRouter.makeToastInCenter(toast: text, duration: 1)
    }
    
    func showRaiseHandNoticeView() {
        raiseHandNoticeView.isHidden = false
    }
    
    func updateRoomInfo(roomInfo: TUIRoomInfo) {
        floatChatButton.updateRoomId(roomId: roomInfo.roomId)
    }
    
    private func showToolBar() {
        topView.alpha = 1
        bottomView.alpha = 1
        topView.isHidden = false
        bottomView.isHidden = false
        localAudioView.hide()
    }
    
    
    @objc private func hideToolBar() {
        topView.alpha = 0
        bottomView.alpha = 0
        topView.isHidden = true
        bottomView.isHidden = true
        localAudioView.show()
    }
    
    func changeToolBarHiddenState() {
        NSObject.cancelPreviousPerformRequests(withTarget: self, selector: #selector(hideToolBar), object: nil)
        if topView.isHidden {
            showToolBar()
            perform(#selector(hideToolBar),with: nil,afterDelay: delayDisappearanceTime)
        } else if !bottomView.isUnfold {
            hideToolBar()
        }
    }
    
    func setToolBarDelayHidden(isDelay: Bool) {
        NSObject.cancelPreviousPerformRequests(withTarget: self, selector: #selector(hideToolBar), object: nil)
        guard !bottomView.isUnfold, isDelay else { return }
        perform(#selector(hideToolBar),with: nil,afterDelay: delayDisappearanceTime)
    }
    
    func showRepeatJoinRoomAlert() {
        let sureAction = UIAlertAction(title: .repeatJoinRoomSureText, style: .default) { _ in
        }
        let alertState = AlertState(title: .repeatJoinRoomTitle, message: .repeatJoinRoomMessage, sureAction: sureAction, declineAction: nil)
        route.present(route: .alert(state: alertState))
    }
}

extension ConferenceMainView: RoomKitUIEventResponder {
    func onNotifyUIEvent(key: EngineEventCenter.RoomUIEvent, Object: Any?, info: [AnyHashable : Any]?) {
        switch key {
        case .TUIRoomKitService_ShowFloatChatView:
            guard let shouldShow = info?["shouldShow"] as? Bool else { return }
            floatChatButton.isHidden = !shouldShow
            floatChatDisplayView.isHidden = !shouldShow
        default: break
        }
    }
}

extension ConferenceMainView {
    private func subscribeSubject() {
        disableMessageUsersPublisher
            .receive(on: DispatchQueue.mainQueue)
            .sink(receiveValue: { [weak self] users in
                guard let self = self else { return }
                let isSelfDisableMessage = users.contains(self.viewModel.currentUser.userId)
                guard isSelfDisableMessage != self.viewModel.isSelfDisableMessage else { return }
                let text: String = isSelfDisableMessage ? .beenBannedFromTextChat : .allowedToTextChat
                self.operation.dispatch(action: ViewActions.showToast(payload: ToastInfo(message: text)))
                self.viewModel.isSelfDisableMessage = isSelfDisableMessage
            })
            .store(in: &cancellableSet)
    }
}

private extension String {
    static let repeatJoinRoomTitle = localized("Currently in the room")
    static let repeatJoinRoomMessage = localized("Please exit before joining a new room")
    static let repeatJoinRoomSureText = localized("I see")
    static let beenBannedFromTextChat = localized("You have been banned from text chat")
    static let allowedToTextChat = localized("You are allowed to text chat")
}
