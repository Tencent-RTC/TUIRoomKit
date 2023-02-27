//
//  UserListMuteView.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/9.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

class UserListMuteView: UIView {
    let viewModel: UserListViewModel
    private var isViewReady: Bool = false
    
    let titleLabel: UILabel = {
        let label = UILabel()
        label.textAlignment = .center
        label.font = UIFont(name: "PingFangSC-Regular", size: 16)
        return label
    }()
    
    let messageLabel: UILabel = {
        let label = UILabel()
        label.textAlignment = .left
        label.font = UIFont(name: "PingFangSC-Regular", size: 14)
        return label
    }()
    
    let messageView: UIView = {
        let view = UIView()
        return view
    }()
    
    let cancelButton: UIButton = {
        let button = UIButton()
        button.setTitle(.cancelText, for: .normal)
        button.setTitleColor(.black, for: .normal)
        button.layer.borderColor = UIColor(0xE1E1E1).cgColor
        button.layer.borderWidth = 0.5
        return button
    }()
    
    let muteButton: UIButton = {
        let button = UIButton()
        button.setTitleColor(.blue, for: .normal)
        button.layer.borderColor = UIColor(0xE1E1E1).cgColor
        button.layer.borderWidth = 0.5
        return button
    }()
    
    let switchButton: UIButton = {
        let button = UIButton()
        let selectIcon = UIImage(named: "check_mark", in: tuiRoomKitBundle(), compatibleWith: nil)
        button.setImage(selectIcon, for: .selected)
        button.layer.borderColor = UIColor(0xE1E1E1).cgColor
        button.layer.borderWidth = 0.3
        return button
    }()
    
    init(viewModel: UserListViewModel) {
        self.viewModel = viewModel
        super.init(frame: .zero)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        backgroundColor = .white
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    override func draw(_ rect: CGRect) {
        super.draw(rect)
        roundedRect(rect: bounds,
                    byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                    cornerRadii: CGSize(width: 12, height: 12))
    }
    
    func constructViewHierarchy() {
        addSubview(titleLabel)
        addSubview(messageView)
        messageView.addSubview(messageLabel)
        messageView.addSubview(switchButton)
        addSubview(cancelButton)
        addSubview(muteButton)
    }
    
    func activateConstraints() {
        titleLabel.snp.makeConstraints { make in
            make.top.equalToSuperview().offset(10)
            make.leading.equalToSuperview().offset(12)
            make.trailing.equalToSuperview().offset(-12)
            make.height.equalTo(22.scale375())
        }
        messageView.snp.makeConstraints { make in
            make.centerX.equalToSuperview()
            make.top.equalTo(titleLabel.snp.bottom).offset(10.scale375())
            make.height.equalTo(30.scale375())
        }
        switchButton.snp.makeConstraints { make in
            make.leading.equalToSuperview()
            make.centerY.equalToSuperview()
            make.width.height.equalTo(22.scale375())
        }
        messageLabel.snp.makeConstraints { make in
            make.centerY.equalToSuperview()
            make.left.equalTo(switchButton.snp.right).offset(5)
            make.trailing.equalToSuperview()
        }
        cancelButton.snp.makeConstraints { make in
            make.leading.equalToSuperview()
            make.bottom.equalToSuperview()
            make.width.equalTo(139.scale375())
            make.top.equalTo(messageLabel.snp.bottom).offset(10)
        }
        muteButton.snp.makeConstraints { make in
            make.trailing.equalToSuperview()
            make.left.equalTo(cancelButton.snp.right)
            make.height.top.equalTo(cancelButton)
        }
    }
    
    func bindInteraction() {
        setupViewState(item: viewModel)
        switchButton.addTarget(self, action: #selector(switchAction(sender:)), for: .touchUpInside)
        cancelButton.addTarget(self, action: #selector(cancelAction(sender:)), for: .touchUpInside)
        muteButton.addTarget(self, action: #selector(muteAction(sender:)), for: .touchUpInside)
    }
    
    func setupViewState(item: UserListViewModel) {
        becomeFirstResponder()
        if item.muteAllUserType == .muteAllAudio {
            titleLabel.text = .muteAllAudioTitleText
            messageLabel.text = .muteAllAudioMessageText
            muteButton.setTitle(.muteAllAudioText, for: .normal)
        } else {
            titleLabel.text = .muteAllVideoTitleText
            messageLabel.text = .muteAllVideoMessageText
            muteButton.setTitle(.muteAllVideoText, for: .normal)
        }
    }
    
    @objc func switchAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
    }
    
    @objc func cancelAction(sender: UIButton) {
        self.isHidden = true
    }
    
    @objc func muteAction(sender: UIButton) {
        viewModel.muteAction(sender: sender)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let muteAllAudioTitleText = localized("TUIRoom.mute.audio.title")
    static let muteAllAudioMessageText = localized("TUIRoom.mute.audio.message")
    static let muteAllVideoTitleText = localized("TUIRoom.mute.video.title")
    static let muteAllVideoMessageText = localized("TUIRoom.mute.video.message")
    static let muteAllAudioText = localized("TUIRoom.all.mute")
    static let muteAllVideoText = localized("TUIRoom.all.mute.video")
    static let cancelText = localized("TUIRoom.cancel")
}
