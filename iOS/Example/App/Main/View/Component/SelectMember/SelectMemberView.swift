//
//  SelectMemberView.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/6/18.
//

import UIKit
import RTCRoomEngine
import TUIRoomKit

protocol SelectMemberViewDelegate: AnyObject {
    func selectView(_ selectView: SelectMemberView, didSearchWith searchText:String)
    func didBackButtonClicked(in selectView: SelectMemberView)
    func didExpandButtonClicked(in selectView: SelectMemberView)
    func didConfirmButtonClicked(in selectView: SelectMemberView )
}

class SelectMemberView: UIView {
    weak var delegate: SelectMemberViewDelegate?
    static let maxVisiableAvatars = 10
    
    private let navigationBar: UIView = {
        let view  = UIView()
        return view
    }()
    
    let backButton: UIButton = {
        let button = UIButton()
        button.setImage(UIImage(named: "room_back_black"), for: .normal)
        button.backgroundColor = .clear
        return button
    }()
    
    let titleLabel: UILabel = {
        let label = UILabel()
        label.text = .selectMemberText
        label.font = UIFont.boldSystemFont(ofSize: 18)
        label.textAlignment = .center
        return label
    }()
    
    let label: UILabel = {
        let label = UILabel()
        label.textColor = UIColor.tui_color(withHex: "2B2E38")
        label.font = UIFont(name: "PingFangSC-Regular", size: 16)
        label.text = .selectMemberText
        label.sizeToFit()
        return label
    }()
    
    let searchBar: UISearchBar = {
        let searchBar = UISearchBar()
        searchBar.placeholder = .enterUserIdText
        searchBar.setBackgroundImage(UIImage(), for: .any, barMetrics: .default)
       return searchBar
    }()
    
    let searchControl: UIControl = {
        let view = UIControl()
        view.backgroundColor = .clear
        view.isHidden = true
        return view
    }()
    
    let tableView: UITableView = {
        let tableView = UITableView(frame: .zero, style: .plain)
        tableView.register(ContactCell.self, forCellReuseIdentifier: ContactCell.reuseIdentifier)
        if #available(iOS 15.0, *) {
            tableView.sectionHeaderTopPadding = 0
        }
         return tableView
     }()
    
    let bottomView: UIView = {
        let view = UIView()
        return view
    }()
    
    let selectedUserView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .horizontal
        layout.itemSize = CGSize(width: 32, height: 32)
        layout.minimumLineSpacing = 8
  
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.showsHorizontalScrollIndicator = false
        collectionView.register(AvatarCell.self, forCellWithReuseIdentifier: AvatarCell.reuseIdentifier)
        return collectionView
    }()
    
    let expandButton: UIButton = {
        let button = UIButton(type: .custom)
        button.titleLabel?.font = UIFont(name: "PingFangSC-Regular", size: 14)
        button.setTitleColor(UIColor.tui_color(withHex: "#22262E"), for: .normal)
        button.setTitle(.selectedText, for: .normal)
        let normalIcon = UIImage(named: "room_up_black_arrow")
        button.setImage(normalIcon, for: .normal)
        button.sizeToFit()
        button.isHidden = true
        return button
    }()
    
    let confirmButton: UIButton = {
        let button = UIButton()
        button.backgroundColor = UIColor.tui_color(withHex: "1C66E5")
        button.titleLabel?.font = UIFont(name: "PingFangSC-Medium", size: 14)
        button.setTitleColor(UIColor(0xFFFFFF), for: .normal)
        button.setTitle(.confirmText, for: .normal)
        button.titleLabel?.textAlignment = .center
        button.layer.cornerRadius = 16
        button.isEnabled = false
        button.contentEdgeInsets = UIEdgeInsets(top: 5, left: 24, bottom: 5, right: 24)
        button.sizeToFit()
        return button
    }()
    
    lazy var currentLanguage: String =  {
        let locale = Locale.current
        let languageCode = locale.languageCode ?? "en"
        return languageCode
    }()
    
    override func layoutSubviews() {
        super.layoutSubviews()
        if let textField = searchBar.value(forKey: "searchField") as? UITextField {
            textField.layer.cornerRadius = textField.bounds.height / 2
            textField.clipsToBounds = true
        }
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
    
    private func constructViewHierarchy() {
        addSubview(navigationBar)
        navigationBar.addSubview(backButton)
        navigationBar.addSubview(titleLabel)
        addSubview(searchBar)
        addSubview(tableView)
        addSubview(bottomView)
        bottomView.addSubview(selectedUserView)
        bottomView.addSubview(expandButton)
        bottomView.addSubview(confirmButton)
        addSubview(searchControl)
    }
    
    private func activateConstraints() {
        navigationBar.snp.makeConstraints { make in
            make.top.equalTo(safeAreaLayoutGuide.snp.top)
            make.leading.trailing.equalToSuperview()
            make.height.equalTo(50)
        }
        backButton.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(22)
            make.centerY.equalToSuperview()
        }
        titleLabel.snp.makeConstraints { make in
            make.centerX.equalToSuperview()
            make.centerY.equalToSuperview()
        }
        searchBar.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(16)
            make.trailing.equalToSuperview().offset(-16)
            make.top.equalTo(navigationBar.snp.bottom).offset(12)
            make.height.equalTo(42)
        }
        tableView.snp.makeConstraints { make in
            make.leading.trailing.equalToSuperview()
            make.top.equalTo(searchBar.snp.bottom).offset(16)
            make.bottom.equalTo(bottomView.snp.top)
        }
        bottomView.snp.makeConstraints { make in
            make.leading.trailing.bottom.equalToSuperview()
            make.height.equalTo(84)
        }
        confirmButton.snp.makeConstraints { make in
            make.trailing.equalToSuperview().offset(-16)
            make.top.equalToSuperview().offset(10)
        }
        selectedUserView.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(32)
            make.trailing.equalTo(confirmButton.snp.leading).offset(-16)
            make.top.equalToSuperview()
            make.height.equalTo(50)
        }
        expandButton.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(19)
            make.top.equalToSuperview().offset(16)
            make.width.greaterThanOrEqualTo(103)
        }
        searchControl.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }
    
    private func bindInteraction() {
        backButton.addTarget(self, action: #selector(onBackButtonTapped(sender:)), for: .touchUpInside)
        expandButton.addTarget(self, action: #selector(onExpandButtonTapped(sender:)), for: .touchUpInside)
        confirmButton.addTarget(self, action: #selector(onConfirmButtonTapped(sender:)), for: .touchUpInside)
        searchBar.delegate = self
        let tap = UITapGestureRecognizer(target: self, action: #selector(hideSearchControl(sender:)))
        searchControl.addGestureRecognizer(tap)
    }
    
    @objc func hideSearchControl(sender: UIView) {
        if #available(iOS 13, *) {
            searchBar.searchTextField.resignFirstResponder()
        } else {
            searchBar.resignFirstResponder()
        }
        searchControl.isHidden = true
    }
    
    @objc func onBackButtonTapped(sender: UIButton) {
        delegate?.didBackButtonClicked(in: self)
    }
    
    @objc func onExpandButtonTapped(sender: UIButton) {
        delegate?.didExpandButtonClicked(in: self)
    }
    
    @objc func onConfirmButtonTapped(sender: UIButton) {
        delegate?.didConfirmButtonClicked(in: self)
    }
    
    func updateSelectedView(with count: Int) {
        if count <= SelectMemberView.maxVisiableAvatars {
            self.expandButton.isHidden = true
            self.selectedUserView.isHidden = false
            self.selectedUserView.reloadData()
        } else {
            self.expandButton.isHidden = false
            self.selectedUserView.isHidden = true
            self.updateExpandButton(with: count)
        }
    }
    
    func updateConfirmButton(with count: Int) {
        if count > 0 {
            confirmButton.isEnabled = true
        }
        
        if count <= SelectMemberView.maxVisiableAvatars && count > 0 {
            let text = .confirmText + "(" + "\(count)" + ")"
            confirmButton.setTitle(text, for: .normal)
        } else {
            confirmButton.setTitle(.confirmText, for: .normal)
        }
    }
    
    private func updateExpandButton(with count: Int) {
        var text = .selectedText + ": " + "\(count)"
        if currentLanguage == "zh" || currentLanguage == "zh-Hant" {
            text += "人"
        }
        expandButton.setTitle(text, for: .normal)
        
        let imageWidth = expandButton.imageView?.bounds.size.width ?? 0
        let titleWidth = expandButton.titleLabel?.bounds.size.width ?? 0
        let spacing: CGFloat = 4
        expandButton.titleEdgeInsets = UIEdgeInsets(top: 0,
                                              left: -imageWidth,
                                              bottom: 0,
                                              right: imageWidth + spacing);
        expandButton.imageEdgeInsets = UIEdgeInsets(top: 0,
                                              left: titleWidth + spacing,
                                              bottom: 0,
                                              right: -titleWidth)
    }
}

extension SelectMemberView: UISearchBarDelegate {
    func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
        let searchContentText = searchText.trimmingCharacters(in: .whitespaces)
        delegate?.selectView(self, didSearchWith: searchContentText)
    }
    
    func searchBarSearchButtonClicked(_ searchBar: UISearchBar) {
        hideSearchControl(sender: searchBar)
    }
    
    func searchBarShouldBeginEditing(_ searchBar: UISearchBar) -> Bool {
        searchControl.isHidden = false
        return true
    }
}

class ContactCell: UITableViewCell {
    static let reuseIdentifier = "ContactCell"
    let checkBox: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "room_check_mark_unselect"), for: .normal)
        button.setImage(UIImage(named: "room_check_mark"), for: .selected)
        button.isUserInteractionEnabled = false
        return button
    }()
    
    let avatarImageView: UIImageView = {
        let imgView = UIImageView()
        imgView.layer.cornerRadius = 2
        imgView.layer.masksToBounds = true
        return imgView
    }()
    
    let nameLabel: UILabel = {
        let label = UILabel()
        label.textColor = UIColor.tui_color(withHex: "22262E")
        label.textAlignment = .left
        label.font = UIFont(name: "PingFangSC-Regular", size: 14)
        label.numberOfLines = 1
        return label
    }()
    
    private var isViewReady = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else {
            return
        }
        isViewReady = true
        selectionStyle = .none
        constructViewHierarchy()
        activateConstraints()
        contentView.backgroundColor = .clear
    }
    
    private func constructViewHierarchy() {
        contentView.addSubview(checkBox)
        contentView.addSubview(avatarImageView)
        contentView.addSubview(nameLabel)
    }
    
    private func activateConstraints() {
        checkBox.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(20)
            make.centerY.equalToSuperview()
            make.width.height.equalTo(16)
        }
        avatarImageView.snp.makeConstraints { make in
            make.leading.equalTo(checkBox.snp.trailing).offset(6)
            make.centerY.equalToSuperview()
            make.width.height.equalTo(32)
        }
        nameLabel.snp.makeConstraints { make in
            make.leading.equalTo(avatarImageView.snp.trailing).offset(6)
            make.centerY.equalToSuperview()
        }
    }
    
    func setupViewState(with info: User, isSelected: Bool) {
        let placeholder = UIImage(named: "room_default_avatar_rect")
        if let url = URL(string: info.avatarUrl) {
            avatarImageView.sd_setImage(with: url, placeholderImage: placeholder)
        } else {
            avatarImageView.image = placeholder
        }
        
        if !info.userName.isEmpty {
            nameLabel.text = info.userName
        } else {
            nameLabel.text = info.userId
        }
        checkBox.isSelected = isSelected
    }
}

class AvatarCell: UICollectionViewCell {
    static let reuseIdentifier = "AvatarCell"
    let imageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 2
        return imageView
    }()
    
    private var isViewReady = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else {
            return
        }
        isViewReady = true
        constructViewHierarchy()
        activateConstraints()
        contentView.backgroundColor = .clear
    }
    
    private func constructViewHierarchy() {
        contentView.addSubview(imageView)
    }
    
    private func activateConstraints() {
        imageView.snp.makeConstraints { make in
            make.top.leading.bottom.trailing.equalTo(contentView)
        }
    }
    
    func setupViewState(with info: User) {
        let placeholder = UIImage(named: "room_default_avatar_rect")
        if let url = URL(string: info.avatarUrl) {
            imageView.sd_setImage(with: url, placeholderImage: placeholder)
        } else {
            imageView.image = placeholder
        }
    }
}

private extension String {
    static var selectMemberText: String {
        RoomDemoLocalize("Select Members")
    }
    static var enterUserIdText: String {
        RoomDemoLocalize("Enter userID or username")
    }
    static var confirmText: String {
        RoomDemoLocalize("OK")
    }
    static var selectedText: String {
        RoomDemoLocalize("Selected")
    }
}
