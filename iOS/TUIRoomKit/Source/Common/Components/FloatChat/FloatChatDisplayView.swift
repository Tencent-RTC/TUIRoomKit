//
//  FloatChatDisplayView.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/5/9.
//  Copyright © 2024 Tencent. All rights reserved.
//

import UIKit
import Combine

class FloatChatDisplayView: UIView {
    @Injected private var store: FloatChatStoreProvider
    private lazy var messageListPublisher = self.store.select(FloatChatSelectors.getMessageList)
    private var messageList: [FloatChatMessage] {
        self.store.selectCurrent(FloatChatSelectors.getMessageList)
    }
    var cancellableSet = Set<AnyCancellable>()
    
    private let tableView: UITableView = {
        let tableView = UITableView(frame: .zero, style: .plain)
        tableView.showsVerticalScrollIndicator = false
        tableView.backgroundColor = .clear
        tableView.separatorStyle = .none
        tableView.contentInsetAdjustmentBehavior = .never
        tableView.register(FloatChatDefaultCell.self, forCellReuseIdentifier: FloatChatDefaultCell.identifier)
        tableView.rowHeight = UITableView.automaticDimension
        tableView.estimatedRowHeight = 50
        return tableView
    }()
    
    private var isViewReady = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }

    private func constructViewHierarchy() {
        addSubview(tableView)
    }

    private func activateConstraints() {
        tableView.snp.makeConstraints { (make) in
            make.top.left.bottom.right.equalToSuperview()
        }
    }
    
    func bindInteraction() {
        tableView.dataSource = self
        messageListPublisher
            .filter{ !$0.isEmpty }
            .receive(on: RunLoop.main)
            .sink { [weak self] floatMessages in
                guard let self = self else { return }
                let newIndexPath = IndexPath(row: floatMessages.count - 1, section: 0)
                self.tableView.beginUpdates()
                self.tableView.insertRows(at: [newIndexPath], with: .automatic)
                self.tableView.endUpdates()
                self.tableView.scrollToRow(at: newIndexPath, at: .bottom, animated: true)
            }
            .store(in: &cancellableSet)
    }
}

// MARK: - UITableViewDataSource

extension FloatChatDisplayView: UITableViewDataSource {
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: FloatChatDefaultCell.identifier, for: indexPath)
        if let cell = cell as? FloatChatDefaultCell, indexPath.row < messageList.count {
            cell.floatMessage = messageList[indexPath.row]
        }
        return cell
    }

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return messageList.count
    }
}

