//
//  MediaSettingView.swift
//  TUIRoomKit
//
//  Created by janejntang on 2023/1/16.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

class MediaSettingView: UIView {
    let viewModel: MediaSettingViewModel
    lazy var setUpTableView: UITableView = {
        let tableView = UITableView(frame: .zero, style: .grouped)
        tableView.delegate = self
        tableView.dataSource = self
        tableView.backgroundColor = UIColor(0x1B1E26)
        tableView.register(UserListCell.self, forCellReuseIdentifier: "MediaSettingViewCell")
        tableView.sectionHeaderHeight = 48.scale375()
        return tableView
    }()
    
    init(viewModel: MediaSettingViewModel) {
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
        isViewReady = true
        backgroundColor = UIColor(0x1B1E26)
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        reportViewShow()
    }
    
    private func constructViewHierarchy() {
        addSubview(setUpTableView)
    }
    
    private func activateConstraints() {
        setUpTableView.snp.makeConstraints { make in
            make.top.bottom.equalToSuperview()
            make.leading.equalToSuperview().offset(13.scale375())
            make.trailing.equalToSuperview().offset(-13.scale375())
        }
    }
    
    private func bindInteraction() {
        viewModel.viewResponder = self
    }
    
    private func reportViewShow() {
        viewModel.reportSettingsPanelShow()
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension MediaSettingView: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if section == 0 {
            return viewModel.videoItems.count
        } else if section == 1 {
            return viewModel.audioItems.count
        } else if section == 2 {
            return viewModel.otherItems.count
        } else {
            return 0
        }
    }
    
    func numberOfSections(in tableView: UITableView) -> Int {
        return viewModel.topItems.count
    }
}

extension MediaSettingView: UITableViewDelegate {
    func tableView(_ tableView: UITableView,
                   cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        var itemData = ListCellItemData()
        if indexPath.section == 0, indexPath.row < viewModel.videoItems.count {
            itemData = viewModel.videoItems[indexPath.row]
        } else if indexPath.section == 1 {
            itemData = viewModel.audioItems[indexPath.row]
        } else if indexPath.section == 2 {
            itemData = viewModel.otherItems[indexPath.row]
        }
        let cell = MediaSettingViewCell(itemData: itemData)
        cell.selectionStyle = .none
        return cell
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        return 55.scale375()
    }
    
    func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
        let headerLabel = UILabel()
        headerLabel.font = UIFont.systemFont(ofSize: 14, weight: .regular)
        headerLabel.textColor = UIColor(0xD8D8D8)
        headerLabel.textAlignment = isRTL ? .right : .left
        headerLabel.text = viewModel.topItems[safe: section]
        return headerLabel
    }
    
    func tableView(_ tableView: UITableView, willDisplay cell: UITableViewCell, forRowAt indexPath: IndexPath) {
        let rows = tableView.numberOfRows(inSection: indexPath.section)
        if indexPath.row == 0 || indexPath.row == rows - 1 {
            var corner = UIRectCorner()
            if rows == 1 {
                corner = .allCorners
            } else if indexPath.row == 0 {
                corner = [.topLeft, .topRight]
            } else if indexPath.row == rows - 1 {
                corner = [.bottomLeft, .bottomRight]
            }
            cell.roundedRect(rect: cell.bounds,
                             byRoundingCorners: corner,
                             cornerRadii: CGSize(width: 12, height: 12))
        }
    }
}

extension MediaSettingView: MediaSettingViewEventResponder {
    func showFrameRateAlert() {
        let frameRateAlert = VideoChoicePanel()
        frameRateAlert.titleText = .frameRateText
        frameRateAlert.dataSource = viewModel.frameRateArray
        frameRateAlert.selectIndex = viewModel.getCurrentFrameRateIndex()
        frameRateAlert.didSelectItem = { [weak self] index in
            guard let `self` = self else { return }
            self.viewModel.changeFrameRateAction(index: index)
        }
        frameRateAlert.show(rootView: self)
    }
    
    func showResolutionAlert() {
        let resolutionAlert = VideoChoicePanel()
        resolutionAlert.titleText = .resolutionText
        resolutionAlert.dataSource = viewModel.resolutionNameItems
        resolutionAlert.selectIndex = viewModel.getCurrentResolutionIndex()
        resolutionAlert.didSelectItem = { [weak self] index in
            guard let `self` = self else { return }
            self.viewModel.changeResolutionAction(index: index)
        }
        resolutionAlert.show(rootView: self)
    }
    
    func showQualityView() {
       let qualityInfoPanel = QualityInfoPanel()
        qualityInfoPanel.show(rootView: self)
    }
    
    func updateStackView(item: ListCellItemData) {
        for view in setUpTableView.visibleCells where view is MediaSettingViewCell {
            guard let cell = view as? MediaSettingViewCell else { continue }
            guard cell.itemData.type == item.type else { continue }
            cell.updateStackView(item: item)
        }
    }
    func makeToast(text: String) {
        RoomRouter.makeToastInCenter(toast: text, duration: 1)
    }
}

class MediaSettingViewCell: UITableViewCell {
    var itemData: ListCellItemData
    lazy var listCell: ListCellItemView = {
        let view = ListCellItemView(itemData: itemData)
        return view
    }()
    init(itemData: ListCellItemData) {
        self.itemData = itemData
        super.init(style: .default, reuseIdentifier: "UserListCell")
    }
    
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        isViewReady = true
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func constructViewHierarchy() {
        contentView.addSubview(listCell)
    }
    
    private func activateConstraints() {
        listCell.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(13.scale375())
            make.trailing.equalToSuperview().offset(-13.scale375())
            make.top.bottom.equalToSuperview()
        }
    }
    
    private func bindInteraction() {
        backgroundColor = UIColor(0x242934)
    }
    
    func updateStackView(item: ListCellItemData) {
        listCell.setupViewState(item: item)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static var resolutionText: String {
        localized("Resolution")
    }
    static var frameRateText: String {
        localized("Frame Rate")
    }
}



