//
//  SelectMemberViewController.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/6/18.
//

import Foundation
import UIKit
import Combine
import RTCRoomEngine
import Factory

class SelectMemberViewController: UIViewController, ContactViewProtocol {
    @Injected(\.selectMemberStore) var selectMemberStore: SelectMemberStore
    weak var delegate: ContactViewSelectDelegate?
    private var cancellableSet = Set<AnyCancellable>()
    
    init(participants: ConferenceParticipants) {
        super.init(nibName: nil, bundle: nil)
        selectMemberStore.setSelectedMembers(participants.selectedList)
        selectMemberStore.setLockSelectionMembers(participants.unSelectableList)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func setDelegate(_ selector: ContactViewSelectDelegate) {
        self.delegate = selector
    }
    
    override func loadView() {
        let rootView = SelectMemberView()
        rootView.backgroundColor = .white
        rootView.delegate = self
        view = rootView
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        self.navigationController?.setNavigationBarHidden(true, animated: animated)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        bindInteraction()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        self.navigationController?.setNavigationBarHidden(false, animated: animated)
    }
    
    func bindInteraction() {
        guard let selectMembersView = view as? SelectMemberView else {
            return
        }
        selectMembersView.tableView.delegate = self
        selectMembersView.tableView.dataSource = self
        
        selectMembersView.selectedUserView.delegate = self
        selectMembersView.selectedUserView.dataSource = self
        
        selectMemberStore.subscribe(Selector(keyPath: \SelectMemberState.selectedMembers))
            .receive(on: DispatchQueue.main)
            .sink { [weak self] selectedMembers in
                self?.updateSelectedView(with: selectedMembers)
            }
            .store(in: &cancellableSet)
        
        selectMemberStore.subscribe(Selector(keyPath: \SelectMemberState.members))
            .receive(on:  DispatchQueue.main)
            .sink { _ in
                selectMembersView.tableView.reloadData()
            }
            .store(in: &cancellableSet)
    }
    
    private func updateSelectedView(with members: [User]) {
        guard let selectMembersView = view as? SelectMemberView else {
            return
        }
        selectMembersView.updateSelectedView(with: members.count)
        selectMembersView.updateConfirmButton(with: members.count)
    }
}

extension SelectMemberViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        return 52
    }
    
    func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
        let headerView = UIView()
        headerView.backgroundColor = UIColor.white

        let headerLabel = UILabel()
        headerLabel.font = UIFont(name: "PingFangSC-Regular", size: 14)
        headerLabel.textColor = UIColor.tui_color(withHex: "#22262E")
        let count = selectMemberStore.getAllMembersCount()
        headerLabel.text = .allMemberText + "(" + "\(count)" + ")"
        headerView.addSubview(headerLabel)
        
        headerLabel.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(19)
            make.top.equalToSuperview()
        }
        return headerView
    }
    
    func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
        return 38
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let member = selectMemberStore.selectMemberState.members[indexPath.row]
        if selectMemberStore.selectMemberState.selectedMembers.contains(where: { $0.userId == member.userId }) {
            selectMemberStore.deleteSelectedMember(member.userId)
        } else {
            selectMemberStore.addSelectedMember(member)
        }
        tableView.reloadRows(at: [indexPath], with: .none)
    }
}

extension SelectMemberViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return selectMemberStore.selectMemberState.members.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let cell = tableView.dequeueReusableCell(withIdentifier: ContactCell.reuseIdentifier, for: indexPath)
                as? ContactCell else {
            return UITableViewCell()
        }
        let member = selectMemberStore.selectMemberState.members[indexPath.row]
        let isSelected = selectMemberStore.selectMemberState.selectedMembers.contains(where: { $0.userId == member.userId})
        let isDisabled = selectMemberStore.isLockSelection(userId: member.userId)
        cell.setupViewState(with: member, isSelected: isSelected, isDisaled: isDisabled)
        cell.isUserInteractionEnabled = !isDisabled
        return cell
    }
}

extension SelectMemberViewController: SelectMemberViewDelegate {
    func selectView(_ selectView: SelectMemberView, didSearchWith searchText: String) {
        selectMemberStore.filterMembers(with: searchText)
    }

    func didExpandButtonClicked(in selectView: SelectMemberView) {
        let listView = SelectedMembersViewController()
        listView.selectedMember = selectMemberStore.selectMemberState.selectedMembers.map{ $0.userInfo }
        listView.didDeselectMember = { [weak self] member in
            guard let self = self else {return}
            self.selectMemberStore.deleteSelectedMember(member.userId)
            let members = self.selectMemberStore.selectMemberState.members
            if let index = members.firstIndex(where: { $0.userId == member.userId }) {
                let indexPath = IndexPath(row: index, section: 0)
                selectView.tableView.reloadRows(at: [indexPath], with: .none)
            }
        }
        listView.modalPresentationStyle = .overCurrentContext
        present(listView, animated: true, completion: nil)
    }
    
    func didConfirmButtonClicked(in selectView: SelectMemberView) {
        delegate?.onMemberSelected(self, invitees: selectMemberStore.selectMemberState.selectedMembers)
    }
    
    func didBackButtonClicked(in selectView: SelectMemberView) {
        navigationController?.popViewController(animated: true)
    }
}

extension SelectMemberViewController: UICollectionViewDelegate {
    
}

extension SelectMemberViewController: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return selectMemberStore.selectMemberState.selectedMembers.count
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let cell = collectionView.dequeueReusableCell(withReuseIdentifier: AvatarCell.reuseIdentifier, for: indexPath)
                as? AvatarCell else {
            return UICollectionViewCell()
        }
        let member = selectMemberStore.selectMemberState.selectedMembers[indexPath.item]
        cell.setupViewState(with: member)
        
        return cell
    }
}

private extension String {
    static let allMemberText = localized("All members")
}
