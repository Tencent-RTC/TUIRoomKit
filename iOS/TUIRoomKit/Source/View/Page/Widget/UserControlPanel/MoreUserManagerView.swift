//
//  MoreUserManagerView.swift
//  TUIRoomKit
//
//  Created by janejntang on 2024/10/15.
//

import Foundation
import Factory
import Combine

class MoreUserManagerView: UIView {
    private var currentLandscape: Bool = isLandscape
    var cancellableSet = Set<AnyCancellable>()
    private lazy var selfRolePublisher = {
        operation.select(UserSelectors.getSelfRole)
    }()
    
    private lazy var menus = {
        MoreUserManagerDataCreator.generateMoreUserManagerItems(operation: operation)
    }()
    
    let contentView: UIView = {
        let view = UIView(frame: .zero)
        view.backgroundColor = UIColor(0x22262E)
        view.layer.cornerRadius = 12
        return view
    }()
    
    let dropArrowButton: UIButton = {
        let button = UIButton()
        button.setImage(UIImage(named: "room_drop_arrow", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.contentEdgeInsets = UIEdgeInsets(top: 12.scale375Height(), left: 20.scale375(), bottom: 12.scale375Height(), right: 20.scale375())
        return button
    }()
    
    let rightArrowButton: UIButton = {
        let button = UIButton()
        button.setImage(UIImage(named: "room_right_arrow", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.contentEdgeInsets = UIEdgeInsets(top: 20.scale375Height(), left: 12.scale375(), bottom: 20.scale375Height(), right: 12.scale375())
        return button
    }()
    
    let stackView: UIStackView = {
        let view = UIStackView()
        view.axis = .vertical
        view.alignment = .top
        view.spacing = 10
        return view
    }()
    
    let backBlockView: UIView = {
        let view = UIView()
        view.backgroundColor = UIColor(0x17181F)
        view.alpha = 0.9
        return view
    }()
    
    init() {
        super.init(frame: .zero)
        contentView.transform = CGAffineTransform(translationX: 0, y: kScreenHeight)
        alpha = 0
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
    
    override func layoutSubviews() {
        super.layoutSubviews()
        guard currentLandscape != isLandscape else { return }
        setupViewOrientation(isLandscape: isLandscape)
        currentLandscape = isLandscape
    }
    
    private func constructViewHierarchy() {
        addSubview(backBlockView)
        addSubview(contentView)
        contentView.addSubview(dropArrowButton)
        contentView.addSubview(rightArrowButton)
        contentView.addSubview(stackView)
        setupStackView()
    }
    
    private func activateConstraints() {
        setupViewOrientation(isLandscape: isLandscape)
        backBlockView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }
    
    private func bindInteraction() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(dismiss))
        backBlockView.addGestureRecognizer(tap)
        dropArrowButton.addTarget(self, action: #selector(dismiss), for: .touchUpInside)
        rightArrowButton.addTarget(self, action: #selector(dismiss), for: .touchUpInside)
        subscribeSubject()
    }
    
    private func setupViewOrientation(isLandscape: Bool) {
        contentView.snp.remakeConstraints { make in
            if isLandscape {
                make.height.equalToSuperview()
            }
            make.bottom.leading.trailing.equalToSuperview()
        }
        dropArrowButton.snp.remakeConstraints { make in
            make.height.equalTo(isLandscape ? 0 : 43.scale375())
            make.top.centerX.equalToSuperview()
        }
        rightArrowButton.snp.remakeConstraints { make in
            make.width.equalTo(isLandscape ? 27.scale375() : 0)
            make.leading.centerY.equalToSuperview()
        }
        stackView.snp.remakeConstraints { make in
            make.top.equalTo(dropArrowButton.snp.bottom).offset(15.scale375Height())
            make.leading.equalTo(rightArrowButton.snp.trailing).offset(16.scale375())
            make.trailing.equalToSuperview()
            if !isLandscape {
                make.bottom.equalToSuperview().offset(-34.scale375Height())
            }
        }
    }
    
    private func setupStackView() {
        for item in menus {
            let view = ButtonItemView(itemData: item)
            stackView.addArrangedSubview(view)
            view.snp.makeConstraints { make in
                make.height.equalTo(53)
                make.width.equalToSuperview()
            }
            item.bindStateClosure?(view, &view.cancellableSet)
        }
    }
    
    func show(rootView: UIView) {
        rootView.addSubview(self)
        self.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        setupViewOrientation(isLandscape: isLandscape)
        UIView.animate(withDuration: 0.3) { [weak self] in
            guard let self = self else { return }
            self.alpha = 1
            self.contentView.transform = .identity
        }
    }
    
    @objc func dismiss() {
        UIView.animate(withDuration: 0.3) { [weak self] in
            guard let self = self else { return }
            self.alpha = 0
            self.contentView.transform = CGAffineTransform(translationX: 0, y: kScreenHeight)
        } completion: { [weak self] _ in
            guard let self = self else { return }
            self.removeFromSuperview()
        }
    }
    
    private func subscribeSubject() {
        selfRolePublisher
            .receive(on: DispatchQueue.mainQueue)
            .sink { [weak self] userRole in
                guard let self = self else { return }
                guard userRole == .generalUser else { return }
                self.dismiss()
            }
            .store(in: &cancellableSet)
    }
    
    deinit {
        debugPrint("deinit:\(self)")
    }
    
    // MARK: - private property.
    @Injected(\.conferenceStore) private var operation
}
 
