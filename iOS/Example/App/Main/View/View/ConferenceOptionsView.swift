//
//  ConferenceOptionsViewController.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/6/3.
//

import UIKit
import Combine
import Factory
import TUIRoomKit
import TUICore

class ConferenceOptionsView: UIView {
    weak var rootViewController: ConferenceOptionsViewController?
    private var listView: ConferenceListView
    
    lazy var options: [ConferenceOptionInfo] = {
        return ConferenceOptionsDataHelper().generateOptionsData()
    }()
    
    let topViewContainer: UIView = {
        let view = UIView(frame: .zero)
        return view
    }()
    
    let backButton: UIButton = {
        let button = UIButton(type: .custom)
        let image = UIImage(named: "room_back")
        button.setImage(image, for: .normal)
        return button
    }()
    
    let avatarButton: UIButton = {
        let button = UIButton(type: .custom)
        return button
    }()
    
    let userNameLabel: UILabel = {
        let label = UILabel(frame: .zero)
        label.font = UIFont.systemFont(ofSize: 16.0)
        return label
    }()
    
    let debugButton: UIButton = {
        let button = UIButton(type: .custom)
        let iconImg = UIImage(named: "debug.png")
        button.setImage(iconImg, for: .normal)
        return button
    }()
    
    let stackView: UIStackView = {
        let view = UIStackView()
        view.axis = .horizontal
        view.alignment = .center
        view.distribution = .fillEqually
        view.spacing = 20
        return view
    }()
    
    let lineView: UIView = {
        let line = UIView()
        line.backgroundColor = UIColor.tui_color(withHex: "E7ECF6")
        return line
    }()
    
    init(viewController: ConferenceOptionsViewController) {
        rootViewController = viewController
        listView = ConferenceListView(viewController: viewController, memberSelectFactory: { selectedList in
            let participants = ConferenceParticipants(selectedList: selectedList)
            return SelectMemberViewController(participants: participants)
        })
        super.init(frame: .zero)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - view layout
    private var isViewReady: Bool = false
    public override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        backgroundColor = .white
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    public override func draw(_ rect: CGRect) {
        super.draw(rect)
        avatarButton.roundedRect(rect: avatarButton.bounds,
                                 byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                                 cornerRadii: CGSize(width: avatarButton.bounds.size.width, height: avatarButton.bounds.size.height))
    }
    
    func constructViewHierarchy() {
        addSubview(topViewContainer)
        topViewContainer.addSubview(backButton)
        topViewContainer.addSubview(avatarButton)
        topViewContainer.addSubview(userNameLabel)
        topViewContainer.addSubview(debugButton)
        addSubview(stackView)
        addSubview(lineView)
        addSubview(listView)
    }
    
    func activateConstraints() {
        topViewContainer.snp.makeConstraints { make in
            make.top.equalTo(self.safeAreaLayoutGuide.snp.top).offset(20)
            make.left.right.equalToSuperview()
            make.height.equalTo(32.scale375())
        }
        backButton.snp.makeConstraints { make in
            make.height.width.equalTo(32.scale375())
            make.leading.equalToSuperview().offset(15)
            make.centerY.equalToSuperview()
        }
        avatarButton.snp.makeConstraints { make in
            make.height.width.equalTo(32.scale375())
            make.leading.equalTo(backButton.snp.trailing).offset(8)
            make.centerY.equalToSuperview()
        }
        userNameLabel.snp.makeConstraints { make in
            make.leading.equalTo(avatarButton.snp.trailing).offset(8)
            make.centerY.equalToSuperview()
        }
        debugButton.snp.makeConstraints { make in
            make.trailing.equalTo(-33)
            make.width.height.equalTo(30)
        }
        stackView.snp.makeConstraints { make in
            make.top.equalTo(topViewContainer.snp.bottom).offset(25)
            make.height.equalTo(80.scale375())
            make.leading.equalToSuperview().offset(32)
            make.trailing.equalToSuperview().offset(-33)
        }
        for (index, item) in options.enumerated() {
            let button = self.createOptionButton(index: index, info: item)
            stackView.addArrangedSubview(button)
            button.snp.makeConstraints { make in
                make.width.equalTo(90.scale375())
                make.height.equalTo(80.scale375())
            }
        }
        lineView.snp.makeConstraints { make in
            make.height.equalTo(1)
            make.leading.equalToSuperview().offset(20)
            make.trailing.equalToSuperview().offset(-20)
            make.top.equalTo(stackView.snp.bottom).offset(20)
        }
        listView.snp.makeConstraints { make in
            make.top.equalTo(lineView.snp.bottom).offset(19)
            make.leading.equalToSuperview().offset(20)
            make.trailing.equalToSuperview().offset(-20)
            make.bottom.equalTo(self.safeAreaLayoutGuide.snp.bottom)
        }
    }
    
    func bindInteraction() {
        setupViewState()
        backButton.addTarget(self, action: #selector(onBackButtonTapped(sender:)), for: .touchUpInside)
        debugButton.addTarget(self, action: #selector(debugButtonClick(sender:)), for: .touchUpInside)
    }
    

    private func createOptionButton(index: Int, info: ConferenceOptionInfo) -> UIButton {
        let button = UIButton(type: .custom)
        button.setTitle(info.normalText, for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = UIFont(name: "PingFangSC-Medium", size: 14)
        let normalIcon = UIImage(named: info.normalIcon)
        button.setImage(normalIcon, for: .normal)
        button.layer.cornerRadius = 10
        button.backgroundColor = UIColor.tui_color(withHex: info.backgroundColor)
        
        button.sizeToFit()
        let imageHeight = button.imageView?.bounds.size.height ?? 0
        let imageWidth = button.imageView?.bounds.size.width ?? 0
        let titleHeight = button.titleLabel?.bounds.size.height ?? 0
        let titleWidth = button.titleLabel?.bounds.size.width ?? 0
        let spacing: CGFloat = 9
        button.imageEdgeInsets = UIEdgeInsets(top: -(titleHeight + spacing) / 2, left: 0 , bottom: (titleHeight + spacing) / 2, right: -titleWidth)
        button.titleEdgeInsets =  UIEdgeInsets(top: (imageHeight + spacing) / 2, left: -imageWidth, bottom: -(imageHeight + spacing) / 2, right: 0)
        
        button.tag = index + 1_000
        button.addTarget(self, action: #selector(optionTapAction(sender:)), for: .touchUpInside)
        return button
    }
    
    func setupViewState() {
        let placeholderImage = UIImage(named: "room_default_avatar")
        avatarButton.sd_setImage(with: URL(string: TUILogin.getFaceUrl() ?? ""), for: .normal, placeholderImage: placeholderImage)
        userNameLabel.text = TUILogin.getNickName() ?? ""
    }
    
    @objc
    func optionTapAction(sender: UIButton) {
        let index = sender.tag - 1_000
        switch index {
        case 0:
            rootViewController?.createRoom()
        case 1:
            rootViewController?.joinRoom()
        case 2:
            rootViewController?.scheduleRoom()
        default:
            assertionFailure("undefine button index，please check")
        }
    }
    
    @objc func onBackButtonTapped(sender: UIButton) {
        self.rootViewController?.didBackButtonClicked(in: self)
    }
    
    @objc func debugButtonClick(sender: UIButton) {
        self.rootViewController?.didDebugButtonClicked()
    }
    
    func reloadConferenceList() {
        listView.reloadList()
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}



