//
//  BottomView.swift
//  TUIRoomKit
//
//  Created by aby on 2022/12/21.
//  Copyright © 2022 Tencent. All rights reserved.
//

import UIKit

class BottomView: UIView {
    // MARK: - store property
    let viewModel: BottomViewModel
    private var viewArray: [BottomItemView] = []
    
    let stackView: UIStackView = {
        let view = UIStackView()
        view.axis = .horizontal
        view.alignment = .center
        view.distribution = .equalSpacing
        return view
    }()
    
    // MARK: - initialized function
    init(viewModel: BottomViewModel) {
        self.viewModel = viewModel
        super.init(frame: .zero)
        viewModel.bottomView = self
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - view layout
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        isViewReady = true
    }
    
    func constructViewHierarchy() {
        addSubview(stackView)
        for item in viewModel.viewItems {
            let view = BottomItemView(itemData: item)
            viewArray.append(view)
            stackView.addArrangedSubview(view)
            let size = item.size ?? CGSize(width: 52.scale375(), height: 52.scale375())
            view.snp.makeConstraints { make in
                make.height.equalTo(size.height)
                make.width.equalTo(size.width)
            }
            view.backgroundColor = item.backgroundColor ?? UIColor(0x2A2D38)
        }
    }
    
    func activateConstraints() {
        stackView.snp.makeConstraints { make in
            make.top.bottom.equalToSuperview()
            make.leading.equalToSuperview().offset(15)
            make.trailing.equalToSuperview().offset(-15)
        }
    }
    
    func updateStackView(item: ButtonItemData, index: Int) {
        guard viewArray.count > index else { return }
        viewArray[index].removeFromSuperview()
        let view = BottomItemView(itemData: item)
        viewArray[index] = view
        stackView.insertArrangedSubview(view, at: index)
        view.snp.makeConstraints { make in
            make.height.equalTo(52.scale375())
            make.width.equalTo(52.scale375())
        }
        view.backgroundColor = item.backgroundColor ?? UIColor(0x2A2D38)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
