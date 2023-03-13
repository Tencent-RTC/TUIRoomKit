//
//  TransferMasterView.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/2/20.
//

import Foundation

class TransferMasterView: UIView {
    let viewModel: TransferMasterViewModel
    var attendeeList: [UserModel]
    var searchArray: [UserModel] = []
    
    let searchController: UISearchController = {
        let controller = UISearchController(searchResultsController: nil)
        controller.obscuresBackgroundDuringPresentation = false
        controller.searchBar.placeholder = .searchMemberText
        controller.searchBar.setBackgroundImage(UIColor(0x1B1E26).trans2Image(), for: .top, barMetrics: .default)
        controller.obscuresBackgroundDuringPresentation = false
        controller.hidesNavigationBarDuringPresentation = false
        return controller
    }()
    
    let appointMasterButton: UIButton = {
        let button = UIButton(type: .custom)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14)
        button.setTitle(.appointAndLeaveRoomText, for: .normal)
        button.setTitleColor(UIColor(0xFFFFFF), for: .normal)
        button.backgroundColor = UIColor(0x006EFF)
        button.layer.cornerRadius = 12
        button.clipsToBounds = true
        button.titleLabel?.adjustsFontSizeToFitWidth = true
        button.adjustsImageWhenHighlighted = false
        return button
    }()
    
    let backButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "room_back_white", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.setTitleColor(UIColor(0xD1D9EC), for: .normal)
        button.setTitle(.transferMasterText, for: .normal)
        return button
    }()
    
    lazy var transferMasterTableView: UITableView = {
        let tableView = UITableView(frame: .zero, style: .plain)
        tableView.separatorStyle = .none
        tableView.delegate = self
        tableView.dataSource = self
        tableView.backgroundColor = UIColor(0x1B1E26)
        tableView.register(UserListCell.self, forCellReuseIdentifier: "RaiseHandCell")
        tableView.tableHeaderView = searchController.searchBar
        return tableView
    }()
    
    init(viewModel: TransferMasterViewModel) {
        self.viewModel = viewModel
        self.attendeeList = viewModel.attendeeList
        super.init(frame: .zero)
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_RenewSeatList, responder: self)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        backgroundColor = UIColor(0x1B1E26)
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    func setNavigationLeftBarButton() {
        RoomRouter.shared.currentViewController()?.navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        RoomRouter.shared.currentViewController()?.navigationItem.hidesSearchBarWhenScrolling = true
        RoomRouter.shared.currentViewController()?.navigationController?.navigationBar.isTranslucent = false
        RoomRouter.shared.currentViewController()?.navigationController?.navigationBar.backgroundColor = UIColor(0x1B1E26)
    }
    
    func constructViewHierarchy() {
        addSubview(transferMasterTableView)
        addSubview(appointMasterButton)
    }
    
    func activateConstraints() {
        transferMasterTableView.snp.makeConstraints { make in
            make.leading.trailing.equalToSuperview()
            make.top.equalTo(safeAreaLayoutGuide.snp.top)
            make.bottom.equalToSuperview()
        }
        appointMasterButton.snp.makeConstraints { make in
            make.trailing.equalToSuperview().offset(-20)
            make.bottom.equalToSuperview().offset(-40 - kDeviceSafeBottomHeight)
            make.height.equalTo(50)
            make.leading.equalToSuperview().offset(20)
        }
    }
    
    func bindInteraction() {
        searchController.delegate = self
        searchController.searchResultsUpdater = self
        backButton.addTarget(self, action: #selector(backAction(sender:)), for: .touchUpInside)
        appointMasterButton.addTarget(self, action: #selector(appointMasterAction(sender:)), for: .touchUpInside)
    }
    
    @objc func backAction(sender: UIButton) {
        viewModel.backAction(sender: sender)
    }
    
    @objc func appointMasterAction(sender: UIButton) {
        viewModel.appointMasterAction(sender: sender)
    }
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        searchController.searchBar.endEditing(true)
        attendeeList = viewModel.attendeeList
        transferMasterTableView.reloadData()
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension TransferMasterView: UISearchControllerDelegate, UISearchResultsUpdating {
    func updateSearchResults(for searchController: UISearchController) {
        searchArray = viewModel.attendeeList.filter({ model -> Bool in
            if let searchText = searchController.searchBar.text {
                return (model.userName == searchText)
            } else {
                return false
            }
        })
        attendeeList = searchArray
        transferMasterTableView.reloadData()
    }
    
    func didDismissSearchController(_ searchController: UISearchController) {
        attendeeList = viewModel.attendeeList
        transferMasterTableView.reloadData()
    }
}

extension TransferMasterView: UITableViewDataSource {
    internal func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return attendeeList.count
    }
}

extension TransferMasterView: UITableViewDelegate {
    internal func tableView(_ tableView: UITableView,
                            cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let attendeeModel = attendeeList[indexPath.row]
        let cell = TransferMasterTableCell(attendeeModel: attendeeModel, viewModel: viewModel)
        cell.selectionStyle = .none
        return cell
    }
    
    internal func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        searchController.searchBar.endEditing(true)
        viewModel.userId = attendeeList[indexPath.row].userId
        transferMasterTableView.reloadData()
    }
    internal func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        return 68.scale375()
    }
}

extension TransferMasterView: RoomKitUIEventResponder {
    func onNotifyUIEvent(key: EngineEventCenter.RoomUIEvent, Object: Any?, info: [AnyHashable : Any]?) {
        if key == .TUIRoomKitService_RenewSeatList {
            attendeeList = viewModel.attendeeList
            transferMasterTableView.reloadData()
        }
    }
}

class TransferMasterTableCell: UITableViewCell {
    let attendeeModel: UserModel
    let viewModel: TransferMasterViewModel
    
    let avatarImageView: UIImageView = {
        let img = UIImageView()
        img.layer.cornerRadius = 20
        img.layer.masksToBounds = true
        return img
    }()
    
    let userLabel: UILabel = {
        let label = UILabel()
        label.textColor = UIColor(0xD1D9EC)
        label.backgroundColor = UIColor.clear
        label.textAlignment = .left
        label.font = UIFont.systemFont(ofSize: 16)
        label.numberOfLines = 1
        return label
    }()
    
    let checkMarkButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "room_check_mark", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.isHidden = true
        return button
    }()
    
    let downLineView : UIView = {
        let view = UIView()
        view.backgroundColor = UIColor(0x2A2D38)
        return view
    }()
    
    init(attendeeModel: UserModel ,viewModel: TransferMasterViewModel) {
        self.attendeeModel = attendeeModel
        self.viewModel = viewModel
        super.init(style: .default, reuseIdentifier: "TransferMasterTableCell")
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
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func constructViewHierarchy() {
        contentView.addSubview(avatarImageView)
        contentView.addSubview(userLabel)
        contentView.addSubview(checkMarkButton)
        contentView.addSubview(downLineView)
    }
    
    func activateConstraints() {
        avatarImageView.snp.makeConstraints { make in
            make.width.height.equalTo(48)
            make.leading.equalToSuperview().offset(20)
            make.centerY.equalToSuperview()
        }
        checkMarkButton.snp.makeConstraints { make in
            make.width.height.equalTo(36)
            make.right.equalToSuperview().offset(-12)
            make.centerY.equalTo(self.avatarImageView)
        }
        userLabel.snp.makeConstraints { make in
            make.centerY.equalToSuperview()
            make.left.equalTo(avatarImageView.snp.right).offset(12)
            make.width.equalTo(150.scale375())
            make.height.equalTo(48)
        }
        downLineView.snp.makeConstraints { make in
            make.left.equalTo(userLabel)
            make.right.equalToSuperview().offset(-12)
            make.bottom.equalToSuperview()
            make.height.equalTo(0.3)
        }
    }
    
    func bindInteraction() {
        backgroundColor = UIColor(0x1B1E26)
        setupViewState(item: attendeeModel)
    }
    
    func setupViewState(item: UserModel) {
        let placeholder = UIImage(named: "room_default_user", in: tuiRoomKitBundle(), compatibleWith: nil)
        if let url = URL(string: item.avatarUrl) {
            avatarImageView.sd_setImage(with: url, placeholderImage: placeholder)
        } else {
            avatarImageView.image = placeholder
        }
        userLabel.text = item.userName
        if viewModel.userId == attendeeModel.userId {
            checkMarkButton.isHidden = false
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let transferMasterText = localized("TUIRoom.trans.master")
    static let searchMemberText = localized("TUIRoom.search.meeting.member")
    static let appointAndLeaveRoomText = localized("TUIRoom.appoint.master.and.leave.room")
}
