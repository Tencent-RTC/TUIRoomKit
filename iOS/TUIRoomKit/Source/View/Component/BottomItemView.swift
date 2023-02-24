//
//  BottomItemView.swift
//  Alamofire
//
//  Created by aby on 2022/12/23.
//  Copyright © 2023 Tencent. All rights reserved.
//

import UIKit

class BottomItemView: UIView {
    
    let itemData: ButtonItemData
    
    let button: UIButton = {
        let button = UIButton(type: .custom)
        return button
    }()
    
    let titleLabel: UILabel = {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 10.0)
        label.textColor = UIColor(0xD1D9EC)
        return label
    }()
    
    // MARK: - initialized function
    init(itemData: ButtonItemData) {
        self.itemData = itemData
        super.init(frame: .zero)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - view layout
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        self.layer.cornerRadius = 10
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    func constructViewHierarchy() {
        addSubview(button)
        addSubview(titleLabel)
    }
    
    func activateConstraints() {
        button.snp.makeConstraints { make in
            make.centerX.equalToSuperview()
            make.bottom.equalTo(titleLabel.snp.top).offset(-2)
            make.width.height.equalTo(24)
        }
        titleLabel.snp.makeConstraints { make in
            make.centerX.equalToSuperview()
            make.bottom.equalToSuperview().offset(-5)
        }
    }
    
    func bindInteraction() {
        setupViewState(item: itemData)
        button.addTarget(self, action: #selector(clickMenuButton(sender:)), for: .touchUpInside)
    }
    
    func setupViewState(item: ButtonItemData) {
        button.isSelected = item.isSelect
        button.isEnabled = item.isEnabled
        if let normalImage = item.normalImage {
            button.setImage(normalImage, for: .normal)
        }
        if let selectedImage = item.selectedImage {
            button.setImage(selectedImage, for: .selected)
        }
        if let disabledImage = item.disabledImage {
            button.setImage(disabledImage, for: .disabled)
        }
        if !item.normalTitle.isEmpty {
            titleLabel.text = item.normalTitle
        }
    }
    
    @objc
    func clickMenuButton(sender: UIButton) {
        itemData.action?(sender)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
