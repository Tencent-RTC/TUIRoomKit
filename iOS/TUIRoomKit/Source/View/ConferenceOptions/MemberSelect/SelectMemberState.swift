//
//  SelectMemberState.swift
//  Pods
//
//  Created by janejntang on 2024/12/31.
//

import Foundation
import Combine
import TUICore

struct SelectMemberState {
    var members: [User] = []
    var selectedMembers: [User] = []
}

protocol SelectMemberStore {
    var selectMemberState: SelectMemberState { get }
    func subscribe<Value>(_ selector: Selector<SelectMemberState, Value>) -> AnyPublisher<Value, Never>
    func setSelectedMembers(_ members: [User])
    func setLockSelectionMembers(_ members: [User])
    func addSelectedMember(_ member: User)
    func deleteSelectedMember(_ userId: String)
    func filterMembers(with searchText: String)
    func getAllMembersCount() -> Int
    func isLockSelection(userId: String) -> Bool
}

class SelectMemberProvider: NSObject {
    var initialMembers: [User] = []
    var lockSelectionMembers: [User] = []
    private lazy var store: Store<SelectMemberState, Void> = {
        let store = Store(initialState: SelectMemberState(), reducers: [SelectMemberStateUpdater])
        return store
    }()
    private var cancellables = Set<AnyCancellable>()
    
    override init() {
        super.init()
        initMembers()
    }
    
    private func initMembers() {
        let users = ConferenceSession.sharedInstance.implementation.participants
        if !users.isEmpty {
            setMembers(users)
        } else {
            loadIMMembers()
        }
    }
    
    private func loadIMMembers() {
        V2TIMManager.sharedInstance()?.getFriendList { [weak self] list in
            guard let self = self else { return }
            let users = list?.map({ info in
                return User(userId: info.userID, userName: info.userFullInfo.nickName, avatarUrl: info.userFullInfo.faceURL ?? "")
            })
            self.setMembers(users ?? [])
        } fail: { _, _ in
            debugPrint("getFriendList falied")
        }
    }
    
    private func setMembers(_ users: [User]) {
        initialMembers = users
        store.dispatch(action: SelectMemberActions.updateMembers(payload: users))
    }
    
    deinit {
        store.unregister(reducer: SelectMemberStateUpdater)
    }
}

extension SelectMemberProvider: SelectMemberStore {
    var selectMemberState: SelectMemberState {
        return store.state
    }
    
    func subscribe<Value>(_ selector: Selector<SelectMemberState, Value>) -> AnyPublisher<Value, Never> {
        return store.select(selector)
    }
    
    func setSelectedMembers(_ members: [User]) {
        store.dispatch(action: SelectMemberActions.updateSelectedMembers(payload: members))
    }
    
    func setLockSelectionMembers(_ members: [User]) {
        lockSelectionMembers = members
    }
    
    func addSelectedMember(_ member: User) {
        var selectedMembers = store.state.selectedMembers
        guard !selectedMembers.contains(where: { $0.userId == member.userId }) else { return }
        selectedMembers.append(member)
        store.dispatch(action: SelectMemberActions.updateSelectedMembers(payload: selectedMembers))
    }
    
    func deleteSelectedMember(_ userId: String) {
        var selectedMembers = store.state.selectedMembers
        guard let index = selectedMembers.firstIndex(where: { $0.userId == userId }) else { return }
        selectedMembers.remove(at: index)
        store.dispatch(action: SelectMemberActions.updateSelectedMembers(payload: selectedMembers))
    }
    
    func filterMembers(with searchText: String) {
        if searchText.isEmpty {
            store.dispatch(action: SelectMemberActions.updateMembers(payload: initialMembers))
        } else {
            let lowercaseSearchText = searchText.lowercased()
            let members = initialMembers.filter {
                $0.userName.lowercased().contains(lowercaseSearchText) ||
                $0.userId.lowercased().contains(lowercaseSearchText)
            }
            store.dispatch(action: SelectMemberActions.updateMembers(payload: members))
        }
    }
    
    func isLockSelection(userId: String) -> Bool {
        return lockSelectionMembers.contains(where: { $0.userId == userId })
    }
    
    func getAllMembersCount() -> Int {
        return initialMembers.count
    }
}

enum SelectMemberActions {
    static let key = "select.member.action"
    
    static let updateMembers = ActionTemplate(id: key.appending(".updateMembers"), payloadType: [User].self)
    static let updateSelectedMembers = ActionTemplate(id: key.appending(".updateSelectedMembers"), payloadType: [User].self)
}

let SelectMemberStateUpdater = Reducer<SelectMemberState> (
    ReduceOn(SelectMemberActions.updateMembers, reduce: { state, action in
        state.members = action.payload
    }),
    ReduceOn(SelectMemberActions.updateSelectedMembers, reduce: { state, action in
        state.selectedMembers = action.payload
    })
)
