//
//  TUIRoomSetSegmentView.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import TXAppBasic
import UIKit

class TUIRoomSetSegmentView: UIView {
    typealias PageBlock = (_ selectedIndex: Int) -> Void
    var pageBlock: PageBlock?

    // 选中的index
    var selectedIndex: Int = 0

    // 分页标题数组
    var nameArray: [String] = []

    // 标题按钮高度
    var segmentScrollVHeight: CGFloat = 41

    // 标题正常颜色
    var titleNormalColor: UIColor = .gray

    // 标题选中颜色
    var titleSelectColor: UIColor = UIColor(hex: "006EFF") ?? .blue

    // 选中字体大小
    var selectFont = UIFont.systemFont(ofSize: 18)

    // 未选中字体大小
    var normalFont = UIFont.systemFont(ofSize: 17)

    // 选中线背景颜色
    var lineSelectedColor = UIColor(hex: "006EFF") ?? .blue

    // 分割线颜色
    var downColor = UIColor(hex: "EEEEEE")

    // 底部滑块高度
    var lineHeight: CGFloat = 1

    // 分页标题view
    lazy var segmentView: UIScrollView = {
        let view = UIScrollView(frame: CGRect.zero)
        view.showsVerticalScrollIndicator = false
        view.showsHorizontalScrollIndicator = false
        return view
    }()

    //
    lazy var segmentScrollView: UIScrollView = {
        let view = UIScrollView()
        view.isScrollEnabled = false
        return view
    }()

    // 选中下划线
    lazy var line: UILabel = {
        let label = UILabel(frame: CGRect.zero)
        return label
    }()

    // 选中的按钮
    lazy var selectButton: UIButton = {
        let btn = UIButton(frame: CGRect.zero)
        return btn
    }()

    // 分割线
    lazy var down: UILabel = {
        let label = UILabel(frame: CGRect.zero)
        label.backgroundColor = UIColor.gray
        return label
    }()

    // 子控件数组
    var controllers: [UIViewController] = []

    convenience init(frame: CGRect, controllers: [UIViewController], titleArray: [String], selectIndex: Int, lineHeight: CGFloat) {
        self.init(frame: frame)
        self.controllers = controllers
        nameArray = titleArray
        self.lineHeight = lineHeight
        initData()
    }

    let width: CGFloat = (ScreenWidth - 50 * 2 - 30 * 2) / 3

    func initData() {
        if nameArray.count == 0 && controllers.count == 0 {
            return
        }

        // 宽度
        let avgWidth: CGFloat = 16
        segmentView.frame = CGRect(x: 0, y: 0, width: frame.size.width, height: segmentScrollVHeight)
        segmentView.tag = 50
        addSubview(segmentView)

        segmentScrollView.frame = CGRect(x: 0, y: segmentScrollVHeight, width: frame.size.width, height: frame.size.height - segmentScrollVHeight)
        segmentScrollView.contentSize = CGSize(width: frame.size.width * CGFloat(controllers.count), height: 0)
        segmentScrollView.delegate = self
        segmentScrollView.showsHorizontalScrollIndicator = false

        // 是否开启平移，每次平移就是scrollView的宽度
        segmentScrollView.isPagingEnabled = true
        segmentScrollView.bounces = false

        addSubview(segmentScrollView)

        for (index, controller) in controllers.enumerated() {
            segmentScrollView.addSubview(controller.view)
            controller.view.frame = CGRect(x: CGFloat(index) * frame.size.width, y: 0, width: frame.size.width, height: frame.size.height)
            let btn = UIButton(type: UIButton.ButtonType.custom)
            btn.frame = CGRect(x: 50 + CGFloat(index) * (width + 30), y: 0, width: width, height: segmentScrollVHeight)
            btn.backgroundColor = .clear
            btn.tag = index
            btn.setTitle(nameArray[index], for: .normal)
            btn.setTitleColor(titleNormalColor, for: .normal)
            btn.setTitleColor(titleSelectColor, for: .selected)
            btn.addTarget(self, action: #selector(segmentClick(sender:)), for: .touchUpInside)

            if selectedIndex == index {
                btn.isSelected = true
                selectButton = btn
                btn.titleLabel?.font = selectFont
                // 初始化选中的控制器CGPoint(,0)
                segmentScrollView.setContentOffset(CGPoint(x: CGFloat(btn.tag) * frame.size.width, y: 0), animated: true)
                NotificationCenter.default.post(name: NSNotification.Name(rawValue: "SelectVC"), object: btn, userInfo: nil)
            } else {
                btn.isSelected = false
                btn.titleLabel?.font = normalFont
            }
            segmentView.addSubview(btn)
        }

        // 分割线
        let downFrame = CGRect(x: 0, y: segmentScrollVHeight - 0.5, width: frame.size.width, height: 0.5)
        down = UILabel(frame: downFrame)
        down.backgroundColor = downColor
        segmentView.addSubview(down)

        let lineFrame = CGRect(x: avgWidth * CGFloat(selectedIndex), y: segmentScrollVHeight - lineHeight, width: avgWidth, height: lineHeight)
        line = UILabel(frame: lineFrame)
        line.backgroundColor = lineSelectedColor
        line.tag = 100
        line.clipsToBounds = true
        line.layer.cornerRadius = lineHeight * 0.5
        // 初始化位置
        var lineCeter = line.center
        lineCeter.x = 50 + width / 2
        line.center = lineCeter
        segmentView.addSubview(line)
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    @objc func segmentClick(sender: UIButton) {
        selectButton.titleLabel?.font = normalFont
        selectButton.isSelected = false
        selectButton = sender
        pageBlock?(sender.tag)
        selectButton.titleLabel?.font = selectFont
        selectButton.isSelected = true
        if sender.tag != 0 {
            controllers.first?.view.endEditing(true)
        }
        segmentScrollView.setContentOffset(CGPoint(x: CGFloat(sender.tag) * frame.size.width, y: 0), animated: true)
        NotificationCenter.default.post(name: NSNotification.Name(rawValue: "SelectVC"), object: sender, userInfo: nil)
    }

    deinit {
        debugPrint("deinit \(self)")
    }
}

extension TUIRoomSetSegmentView: UIScrollViewDelegate {
    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        let tag = Int(segmentScrollView.contentOffset.x / frame.size.width)
        if tag != 0 {
            controllers.first?.view.endEditing(true)
        }
        let btn = segmentView.viewWithTag(tag)
        selectButton.isSelected = false
        selectButton.titleLabel?.font = normalFont
        if let button = btn {
            selectButton = button as! UIButton
            selectButton.isSelected = true
            selectButton.titleLabel?.font = selectFont
            pageBlock?(button.tag)
        }
    }

    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let itemWidth = width + 30
        let offsetX = (itemWidth / scrollView.bounds.width) * scrollView.contentOffset.x
        let xoffset = offsetX - (CGFloat(selectedIndex) * itemWidth)
        line.transform = CGAffineTransform(translationX: xoffset, y: 0)
    }
}
