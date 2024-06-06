//
//  CreateRoomView.swift
//  TUIRoomKit
//
//  Created by janejntang on 2022/12/29.
//  Copyright © 2022 Tencent. All rights reserved.
//

import UIKit
import TUICore

class CreateRoomView: UIView {
    let loading = UIActivityIndicatorView(style: .gray)
    weak var rootViewController: CreateRoomViewController?
    private var inputViewArray: [ListCellItemView] = []
    private var switchViewArray: [ListCellItemView] = []
    
    let inputStackView: UIStackView = {
        let view = UIStackView()
        view.axis = .vertical
        view.alignment = .center
        view.distribution = .equalSpacing
        view.spacing = 0
        return view
    }()
    
    let switchStackView: UIStackView = {
        let view = UIStackView()
        view.axis = .vertical
        view.alignment = .center
        view.distribution = .equalSpacing
        view.spacing = 0
        return view
    }()
    
    let enterButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setBackgroundImage(UIColor(0x0062E3).trans2Image(), for: .normal)
        button.layer.cornerRadius = 10
        button.clipsToBounds = true
        button.titleLabel?.font = UIFont.boldSystemFont(ofSize: 19)
        button.setTitleColor(.white, for: .normal)
        button.setTitle(.createRoomText, for: .normal)
        return button
    }()
    
    lazy var switchSpeakerModelView: RoomTypeView = {
        let view = RoomTypeView()
        view.rootViewController = rootViewController
        view.isHidden = true
        return view
    }()
    
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
        inputStackView.roundedRect(rect: inputStackView.bounds,
                                   byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                                   cornerRadii: CGSize(width: 12, height: 12))
        switchStackView.roundedRect(rect: switchStackView.bounds,
                                    byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                                    cornerRadii: CGSize(width: 12, height: 12))
    }
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        switchSpeakerModelView.isHidden = true
    }
    
    func constructViewHierarchy() {
        backgroundColor = UIColor(0x17181F)
        addSubview(inputStackView)
        addSubview(switchStackView)
        addSubview(enterButton)
        addSubview(loading)
        addSubview(switchSpeakerModelView)
        guard let rootViewController = rootViewController else { return }
        for item in rootViewController.inputViewItems {
            let view = ListCellItemView(itemData: item)
            inputViewArray.append(view)
            inputStackView.addArrangedSubview(view)
            view.snp.makeConstraints { make in
                make.height.equalTo(52.scale375())
                make.width.equalToSuperview()
            }
            view.backgroundColor = item.backgroundColor ?? UIColor(0x2A2D38)
        }
        for item in rootViewController.switchViewItems {
            let view = ListCellItemView(itemData: item)
            switchViewArray.append(view)
            switchStackView.addArrangedSubview(view)
            view.snp.makeConstraints { make in
                make.height.equalTo(52.scale375())
                make.width.equalToSuperview()
            }
            view.backgroundColor = item.backgroundColor ?? UIColor(0x2A2D38)
        }
    }
    
    func activateConstraints() {
        inputStackView.snp.makeConstraints { make in
            make.top.equalTo(snp.topMargin).offset(20)
            make.leading.equalToSuperview().offset(20)
            make.trailing.equalToSuperview().offset(-20)
        }
        
        switchStackView.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(20)
            make.trailing.equalToSuperview().offset(-20)
            make.top.equalTo(inputStackView.snp.bottom).offset(12)
        }
        
        enterButton.snp.makeConstraints { make in
            make.bottom.equalToSuperview().offset(-40 - kDeviceSafeBottomHeight)
            make.centerX.equalToSuperview()
            make.width.equalToSuperview().multipliedBy(0.4)
            make.height.equalTo(50)
        }
        
        loading.snp.makeConstraints { make in
            make.width.height.equalTo(40)
            make.centerX.centerY.equalToSuperview()
        }
        
        switchSpeakerModelView.snp.makeConstraints { make in
            make.bottom.equalToSuperview()
            make.height.equalTo(191.scale375())
            make.width.equalToSuperview()
        }
    }
    
    func bindInteraction() {
        enterButton.addTarget(self, action: #selector(enterButtonClick(sender:)), for: .touchUpInside)
    }
    
    @objc func enterButtonClick(sender: UIButton) {
        rootViewController?.enterButtonClick(sender: sender)
    }
    
    func updateInputStackView(item: ListCellItemData, index: Int) {
        guard inputViewArray.count > index else { return }
        inputViewArray[index].setupViewState(item: item)
    }
    
    func showSpeechModeControlView() {
        switchSpeakerModelView.isHidden = false
    }
    
    func updateEnterButtonState(isEnabled: Bool) {
        enterButton.isEnabled = isEnabled
    }
    
    func updateLoadingState(isStarted: Bool) {
        isStarted ? loading.startAnimating() : loading.stopAnimating()
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static var createRoomText: String {
        RoomDemoLocalize("Create Room")
    }
}
