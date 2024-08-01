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
import TUIRoomKit

class SelectMemberViewController: UIViewController, SelectMemberControllerProtocol {
    weak var delegate: MemberSelectionDelegate?
    private var viewModel = SelectMembersViewModel()
    private var cancellableSet = Set<AnyCancellable>()
    
    init(selectedUsers: [User]) {
        super.init(nibName: nil, bundle: nil)
        viewModel.selectMembers(selectedUsers)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func setDelegate(_ selector: MemberSelectionDelegate) {
        self.delegate = selector
    }
    
    override func loadView() {
        let rootView = SelectMemberView()
        rootView.backgroundColor = .white
        rootView.delegate = self
        view = rootView
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        bindInteraction()
    }
    
    func bindInteraction() {
        guard let selectMembersView = view as? SelectMemberView else {
            return
        }
 
        selectMembersView.tableView.delegate = self
        selectMembersView.tableView.dataSource = self
        
        selectMembersView.selectedUserView.delegate = self
        selectMembersView.selectedUserView.dataSource = self
        
        viewModel.$selectedMembers
            .receive(on: DispatchQueue.main)
            .sink { [weak self] selectedMembers in
                self?.updateSelectedView(with: selectedMembers)
            }
            .store(in: &cancellableSet)
        
        viewModel.$filteredMembers
            .receive(on:  DispatchQueue.main)
            .sink { [selectMembersView] _ in
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
        headerLabel.text = .allMemberText + "(" + "\(viewModel.members.count)" + ")"
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
        let member = viewModel.filteredMembers[indexPath.row]
        if viewModel.selectedMembers.contains(where: { $0.userId == member.userId }) {
            viewModel.deSelectMember(member)
        } else {
            viewModel.selectMember(member)
        }
        tableView.reloadRows(at: [indexPath], with: .none)
    }
}

extension SelectMemberViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return viewModel.filteredMembers.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let cell = tableView.dequeueReusableCell(withIdentifier: ContactCell.reuseIdentifier, for: indexPath)
                as? ContactCell else {
            return UITableViewCell()
        }
        let member = viewModel.filteredMembers[indexPath.row]
        let isSelected = viewModel.selectedMembers.contains(where: { $0.userId == member.userId})
        cell.setupViewState(with: member, isSelected: isSelected)
        return cell
    }
}

extension SelectMemberViewController: SelectMemberViewDelegate {
    func selectView(_ selectView: SelectMemberView, didSearchWith searchText: String) {
        viewModel.filterMember(with: searchText)
    }

    func didExpandButtonClicked(in selectView: SelectMemberView) {
        let listView = SelectedMembersViewController()
        listView.selectedMember = viewModel.selectedMembers
        listView.didDeselectMember = { [weak self] member in
            guard let self = self else {return}
            self.viewModel.deSelectMember(member)
            if let index = self.viewModel.index(from: member) {
                let indexPath = IndexPath(row: index, section: 0)
                selectView.tableView.reloadRows(at: [indexPath], with: .none)
            }
        }
        listView.modalPresentationStyle = .overCurrentContext
        present(listView, animated: true, completion: nil)
    }
    
    func didConfirmButtonClicked(in selectView: SelectMemberView) {
        delegate?.onMemberSelected(self, invitees: viewModel.selectedMembers)
    }
    
    func didBackButtonClicked(in selectView: SelectMemberView) {
        navigationController?.popViewController(animated: true)
    }
}

extension SelectMemberViewController: UICollectionViewDelegate {
    
}

extension SelectMemberViewController: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return viewModel.selectedMembers.count
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let cell = collectionView.dequeueReusableCell(withReuseIdentifier: AvatarCell.reuseIdentifier, for: indexPath)
                as? AvatarCell else {
            return UICollectionViewCell()
        }
        let member = viewModel.selectedMembers[indexPath.item]
        cell.setupViewState(with: member)
        
        return cell
    }
}

private extension String {
    static var allMemberText: String {
        RoomDemoLocalize("All members")
    }
}
