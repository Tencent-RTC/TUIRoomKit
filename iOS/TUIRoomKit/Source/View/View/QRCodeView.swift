//
//  QRCodeView.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/11.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

class QRCodeView: UIView {
    let viewModel: QRCodeViewModel
    
    let backButton: UIButton = {
        let button = UIButton(type: .custom)
        let normalIcon = UIImage(named: "room_back_white", in: tuiRoomKitBundle(), compatibleWith: nil)
        button.setImage(normalIcon, for: .normal)
        button.setTitleColor(UIColor(0xD1D9EC), for: .normal)
        button.setTitle(.codeText, for: .normal)
        return button
    }()
    
    let middleView: UIView = {
        let view = UIView()
        view.backgroundColor = UIColor(0x2A2D38)
        return view
    }()
    
    let titleLabel: UILabel = {
        let label = UILabel()
        label.textColor = UIColor(0xD1D9EC)
        label.font = UIFont(name: "PingFangSC-Regular", size: 28)
        label.textAlignment = .center
        label.backgroundColor = .clear
        label.text = EngineManager.shared.store.roomInfo.name
        label.adjustsFontSizeToFitWidth = true
        return label
    }()
    
    let roomIdView: UIView = {
        let view = UIView()
        view.backgroundColor = .clear
        return view
    }()
    
    let roomIdLabel: UILabel = {
        let label = UILabel()
        label.textColor = UIColor(0xD1D9EC)
        label.font = UIFont(name: "PingFangSC-Regular", size: 20)
        label.adjustsFontSizeToFitWidth = true
        label.textAlignment = .center
        label.text = EngineManager.shared.store.roomInfo.roomId
        return label
    }()
    
    let copyButton: UIButton = {
        let button = UIButton()
        let normalIcon = UIImage(named: "room_copy", in: tuiRoomKitBundle(), compatibleWith: nil)
        button.setImage(normalIcon, for: .normal)
        return button
    }()
    
    let qrCodeView: UIView = {
        let view = UIView()
        view.backgroundColor = .white
        return view
    }()
    
    let qrCodeImageView: UIImageView = {
        let imageView = UIImageView()
        return imageView
    }()
    
    let qrCodeLabel: UILabel = {
        let label = UILabel()
        label.textColor = .black
        label.text = .scanCodeText
        label.textAlignment = .center
        return label
    }()
    
    let tencentImageView: UIImageView = {
        let image = UIImage(named: "room_tencent", in: tuiRoomKitBundle(), compatibleWith: nil)
        let imageView = UIImageView(image: image)
        return imageView
    }()
    
    let bottomButton: UIButton = {
        let button = UIButton()
        button.backgroundColor = UIColor(0x006CFF)
        button.setTitle(.saveIntoAlbumText, for: .normal)
        button.backgroundColor = UIColor(0x006CFF)
        button.setTitleColor(.white, for: .normal)
        return button
    }()
    
    init(viewModel: QRCodeViewModel) {
        self.viewModel = viewModel
        super.init(frame: .zero)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    override func draw(_ rect: CGRect) {
        super.draw(rect)
        middleView.roundedRect(rect: middleView.bounds,
                               byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                               cornerRadii: CGSize(width: 12, height: 12))
        qrCodeView.roundedRect(rect: qrCodeView.bounds,
                               byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                               cornerRadii: CGSize(width: 12, height: 12))
        bottomButton.roundedRect(rect: bottomButton.bounds,
                                 byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                                 cornerRadii: CGSize(width: 12, height: 12))
    }
    
    func constructViewHierarchy() {
        addSubview(middleView)
        addSubview(bottomButton)
        middleView.addSubview(titleLabel)
        middleView.addSubview(roomIdView)
        middleView.addSubview(qrCodeView)
        middleView.addSubview(tencentImageView)
        roomIdView.addSubview(roomIdLabel)
        roomIdView.addSubview(copyButton)
        qrCodeView.addSubview(qrCodeImageView)
        qrCodeView.addSubview(qrCodeLabel)
    }
    
    func activateConstraints() {
        middleView.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(12.scale375())
            make.trailing.equalToSuperview().offset(-12.scale375())
            make.height.equalTo(399.scale375())
            make.centerY.equalToSuperview()
        }
        titleLabel.snp.makeConstraints { make in
            make.top.equalToSuperview().offset(24.scale375())
            make.height.equalTo(30.scale375())
            make.width.equalToSuperview()
        }
        roomIdView.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(4.scale375())
            make.width.equalTo(120.scale375())
            make.centerX.equalToSuperview()
            make.height.equalTo(22.scale375())
        }
        roomIdLabel.snp.makeConstraints { make in
            make.leading.equalToSuperview()
            make.height.equalToSuperview()
            make.width.equalTo(80.scale375())
        }
        copyButton.snp.makeConstraints { make in
            make.left.equalTo(roomIdLabel.snp.right).offset(3)
            make.centerY.equalToSuperview()
            make.width.height.equalTo(22.scale375())
        }
        qrCodeView.snp.makeConstraints { make in
            make.top.equalTo(roomIdView.snp.bottom).offset(10)
            make.centerX.equalToSuperview()
            make.width.equalTo(210.scale375())
            make.height.equalTo(242.scale375())
        }
        qrCodeImageView.snp.makeConstraints { make in
            make.width.height.equalTo(162.scale375())
            make.top.equalToSuperview().offset(24.scale375())
            make.centerX.equalToSuperview()
        }
        qrCodeLabel.snp.makeConstraints { make in
            make.width.equalToSuperview()
            make.height.equalTo(20.scale375())
            make.top.equalTo(qrCodeImageView.snp.bottom).offset(24.scale375())
        }
        tencentImageView.snp.makeConstraints { make in
            make.top.equalTo(qrCodeView.snp.bottom).offset(20.scale375())
            make.centerX.equalToSuperview()
            make.width.equalTo(86.scale375())
            make.height.equalTo(23.scale375())
        }
        bottomButton.snp.makeConstraints { make in
            make.width.equalTo(200.scale375())
            make.height.equalTo(52.scale375())
            make.centerX.equalToSuperview()
            make.bottom.equalToSuperview().offset(-30.scale375())
        }
        
    }
    
    func bindInteraction() {
        setupViewState()
        copyButton.addTarget(self, action: #selector(copyAction(sender:)), for: .touchUpInside)
        backButton.addTarget(self, action: #selector(backAction(sender:)), for: .touchUpInside)
        bottomButton.addTarget(self, action: #selector(saveIntoAlbumAction(sender:)), for: .touchUpInside)
    }
    
    func setupViewState() {
        RoomRouter.shared.currentViewController()?.navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        backgroundColor = UIColor(0x17181F)
        viewModel.createQRCodeImageView(url: viewModel.urlString, imageView: qrCodeImageView)
    }
    
    @objc func backAction(sender: UIButton) {
        viewModel.backAction(sender: sender)
    }
    
    @objc func copyAction(sender: UIButton) {
        viewModel.copyAction(sender: sender, text: roomIdLabel.text ?? "")
    }
    
    @objc func saveIntoAlbumAction(sender: UIButton) {
        guard let image = qrCodeImageView.image else { return }
        viewModel.saveIntoAlbumAction(sender: sender, image: image)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let codeText = localized("TUIRoom.code")
    static let scanCodeText = localized("TUIRoom.scan.code")
    static let saveIntoAlbumText = localized("TUIRoom.save.into.album")
}
