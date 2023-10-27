//
//  ExitRoomView.swift
//  TUIRoomKit
//
//  Created by krabyu on 2023/8/23.
//

import Foundation
import TUIRoomEngine

class ExitRoomView: UIView {
    let viewModel: ExitRoomViewModel
    private var isViewReady: Bool = false
    var viewArray: [UIView] = []
    var currentUser: UserEntity {
        EngineManager.createInstance().store.currentUser
    }
    var roomInfo: TUIRoomInfo {
        EngineManager.createInstance().store.roomInfo
    }
    
    let titleLabel: UILabel = {
        let label = UILabel()
        label.text = .leaveRoomTipText
        label.textColor = UIColor(0x7C85A6)
        label.font = UIFont(name: "PingFangSC-Regular", size: 12)
        label.textAlignment = .center
        label.numberOfLines = 0
        label.lineBreakMode = .byWordWrapping
        return label
    }()
    
    let boundary1View: UIView = {
        let view = UIView()
        view.backgroundColor = UIColor(0x4F586B,alpha: 0.3)
        return view
    }()
    
    let leaveRoomButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setTitle(.leaveRoomText, for: .normal)
        button.titleLabel?.font = UIFont(name: "PingFangSC-Regular", size: 18)
        button.setTitleColor(UIColor(0x006CFF), for: .normal)
        button.backgroundColor = UIColor(0x17181F)
        button.isEnabled = true
        button.addTarget(self, action: #selector(leaveRoomAction), for: .touchUpInside)
        return button
    }()
    
    let boundary2View: UIView = {
        let view = UIView()
        view.backgroundColor = UIColor(0x4F586B,alpha: 0.3)
        return view
    }()
    
    let exitRoomButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setTitle(.exitRoomText, for: .normal)
        button.titleLabel?.font = UIFont(name: "PingFangSC-Regular", size: 18)
        button.setTitleColor(UIColor(0xE5395C), for: .normal)
        button.backgroundColor = UIColor(0x17181F)
        button.isEnabled = true
        button.addTarget(self, action: #selector(exitRoomAction), for: .touchUpInside)
        return button
    }()
    
    init(viewModel: ExitRoomViewModel) {
        self.viewModel = viewModel
        super.init(frame: .zero)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
        exitRoomButton.isHidden = currentUser.userId != roomInfo.ownerId
        leaveRoomButton.isHidden = !viewModel.isShowLeaveRoomButton()
        boundary2View.isHidden = currentUser.userId != roomInfo.ownerId || !viewModel.isShowLeaveRoomButton()
    }
    
    func constructViewHierarchy() {
        addSubview(titleLabel)
        addSubview(boundary1View)
        addSubview(leaveRoomButton)
        addSubview(boundary2View)
        addSubview(exitRoomButton)
    }
    
    func activateConstraints() {
        titleLabel.snp.makeConstraints { make in
            make.top.leading.trailing.equalToSuperview()
            make.height.equalTo(67.scale375Height())
        }
        boundary1View.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom)
            make.height.equalTo(1.scale375Height())
            make.leading.trailing.equalToSuperview()
        }
        let height = viewModel.isShowLeaveRoomButton() ? 57.scale375Height() : 0
        leaveRoomButton.snp.makeConstraints { make in
            make.top.equalTo(boundary1View.snp.bottom)
            make.height.equalTo(height)
            make.leading.trailing.equalToSuperview()
        }
        boundary2View.snp.makeConstraints { make in
            make.top.equalTo(leaveRoomButton.snp.bottom)
            make.height.equalTo(1.scale375Height())
            make.leading.trailing.equalToSuperview()
        }
        exitRoomButton.snp.makeConstraints { make in
            make.top.equalTo(leaveRoomButton.snp.bottom).offset(1.scale375Height())
            make.height.equalTo(57.scale375Height())
            make.leading.trailing.equalToSuperview()
        }
    }
    
    func bindInteraction() {
        backgroundColor = UIColor(0x17181F)
    }
    
    @objc func leaveRoomAction(sender: UIView) {
        viewModel.leaveRoomAction(sender: sender)
    }
    
    @objc func exitRoomAction(sender: UIView) {
        viewModel.exitRoomAction(sender: sender)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static var leaveRoomTipText: String {
        localized("TUIRoom.leave.room.tip" )
    }
    static var leaveRoomText: String {
        localized("TUIRoom.leave.room")
    }
    static var exitRoomText: String {
        localized("TUIRoom.dismiss.room")
    }
}
