//
//  SetUpView.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/16.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

class SetUpView: UIView {
    let viewModel: SetUpViewModel
    var selectedIndex: Int = 0
    let width: CGFloat = (kScreenWidth - 30 * 2 - 20 * 2) / 3
    private var viewArray: [SetUpItemView] = []
    
    lazy var segmentView: UIScrollView = {
        let view = UIScrollView(frame: CGRect.zero)
        view.showsVerticalScrollIndicator = false
        view.showsHorizontalScrollIndicator = false
        view.delegate = self
        view.backgroundColor = UIColor(0x1B1E26)
        return view
    }()
    
    lazy var segmentScrollView: UIScrollView = {
        let view = UIScrollView()
        view.isScrollEnabled = false
        view.delegate = self
        view.contentSize = CGSize(width: frame.size.width * CGFloat(viewArray.count), height: 0)
        view.showsHorizontalScrollIndicator = false
        view.isPagingEnabled = true
        view.bounces = false
        view.backgroundColor = UIColor(0x1B1E26)
        return view
    }()
    
    let downView: UIView = {
        let view = UIView(frame: .zero)
        view.backgroundColor = UIColor.red
        return view
    }()
    
    lazy var lineView: UIView = {
        let view = UIView()
        view.backgroundColor = .blue
        view.clipsToBounds = true
        var lineCeter = view.center
        lineCeter.x = 50 + width / 2
        view.center = lineCeter
        return view
    }()
    
    init(viewModel: SetUpViewModel) {
        self.viewModel = viewModel
        super.init(frame: .zero)
        initItemView()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func initItemView() {
        let videoItemView = SetUpItemView(viewModel: viewModel, viewType: .videoType)
        let audioItemView = SetUpItemView(viewModel: viewModel, viewType: .audioType)
        let shareItemView = SetUpItemView(viewModel: viewModel, viewType: .shareType)
        viewArray.append(videoItemView)
        viewArray.append(audioItemView)
        viewArray.append(shareItemView)
    }
    
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        isViewReady = true
    }
    
    func constructViewHierarchy() {
        addSubview(segmentView)
        addSubview(segmentScrollView)
        segmentView.addSubview(lineView)
        segmentView.addSubview(downView)
        for (index, item) in viewModel.topItems.enumerated() {
            let button = ButtonItemView(itemData: item)
            button.controlButton.titleLabel?.font = UIFont(name: "PingFangSC-Regular", size: 15)
            if selectedIndex == index {
                button.controlButton.isSelected = true
            } else {
                button.controlButton.isSelected = false
            }
            segmentView.addSubview(button)
            button.snp.makeConstraints { make in
                make.left.equalToSuperview().offset(30 + CGFloat(index) * (width + 20))
                make.height.equalToSuperview()
                make.width.equalTo(width)
            }
        }
        
        for(index, item) in viewArray.enumerated() {
            segmentScrollView.addSubview(item)
            item.snp.makeConstraints { make in
                make.left.equalToSuperview().offset(CGFloat(index) * (UIScreen.main.bounds.width))
                make.top.equalToSuperview()
                make.width.equalToSuperview()
                make.height.equalToSuperview()
            }
        }
    }
    
    func activateConstraints() {
        segmentView.snp.makeConstraints { make in
            make.leading.trailing.top.equalToSuperview()
            make.height.equalTo(41.scale375())
        }
        
        segmentScrollView.snp.makeConstraints { make in
            make.leading.trailing.equalToSuperview()
            make.top.equalTo(segmentView.snp.bottom)
            make.bottom.equalToSuperview()
        }
        
        lineView.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(16 * CGFloat(selectedIndex))
            make.bottom.equalToSuperview().offset(-1)
            make.height.equalTo(1)
            make.width.equalTo(16)
        }
        downView.snp.makeConstraints { make in
            make.leading.trailing.equalToSuperview()
            make.bottom.equalToSuperview().offset(-0.5)
            make.height.equalTo(0.5)
        }
    }
    
    func updateSegmentScrollView(selectedIndex: Int) {
        segmentScrollView.setContentOffset(CGPoint(x: CGFloat(selectedIndex) * UIScreen.main.bounds.width, y: 0), animated: true)
    }
}

extension SetUpView: UIScrollViewDelegate {
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let itemWidth = width + 30
        let offsetX = (itemWidth / scrollView.bounds.width) * scrollView.contentOffset.x
        let xoffset = offsetX - (CGFloat(selectedIndex) * itemWidth)
        lineView.transform = CGAffineTransform(translationX: xoffset, y: 0)
    }
}

private extension String {
    static let shareText = localized("TUIRoom.share")
}


