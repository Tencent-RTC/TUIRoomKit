//
//  SelectMembersViewModel.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/6/19.
//

import Foundation
import Combine
import UIKit
import RTCRoomEngine
import TUIRoomKit
import ImSDK_Plus
import TUICore

enum DataProviderType {
    case IMData
    case localData
}

struct APIError: Error {
    let code: Int32
    let message: String?
}

struct PagedUsers {
    let users: [User]
    let hasNextPage: Bool
    let nextPage: Int?
}

protocol UserDateProvider {
    func getUsers(page: Int?, pageSize: Int?, completion: @escaping (Result<PagedUsers, Error>) -> Void)
}

class ImDataProvider: UserDateProvider {
    // use relationship chain data from IM, if you want to use IM, you should import data first.
    func getUsers(page: Int?, pageSize: Int?, completion: @escaping (Result<PagedUsers, Error>) -> Void) {
        V2TIMManager.sharedInstance()?.getFriendList { list in
            let users = list?.map({ info in
                return User(userId: info.userID, userName: info.userFullInfo.nickName, avatarUrl: info.userFullInfo.faceURL ?? "")
            })
            let result = PagedUsers(users: users ?? [], hasNextPage: false, nextPage: 0)
            completion(.success(result))
        } fail: { error, message in
            completion(.failure(APIError(code: error, message: message)))
        }
    }
}

class LocalDataProvider: UserDateProvider {
    // use local mock data，you can replace with ypur own data.
    private var allUsers: [User] = []
    
    init() {
        guard let url = Bundle.main.url(forResource: "members", withExtension: "json") else {
            return
        }
        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            allUsers = try decoder.decode([User].self, from: data)
        } catch {
            print("Error decoding JSON: \(error)")
        }
    }
    
    func getUsers(page: Int? = nil, pageSize: Int? = nil, completion: @escaping (Result<PagedUsers, Error>) -> Void) {
        completion(.success(PagedUsers(users: allUsers, hasNextPage: false, nextPage: 0)))
    }
}

class DataProviderFactory {
    static func getDataProvider(_ type: DataProviderType) -> UserDateProvider {
        switch type {
        case .IMData:
            return ImDataProvider()
        case .localData:
            return LocalDataProvider()
        }
    }
}

class SelectMembersViewModel {
    private(set) var members: [User] = []
    @Published private(set) var filteredMembers: [User] = []
    @Published private(set) var selectedMembers: [User] = []
    private(set) var disabledMembers: [User] = []
    
    init() {
        loadMembers()
    }
    
    func loadMembers() {
        let dataProvider = DataProviderFactory.getDataProvider(.localData)
        dataProvider.getUsers(page: nil, pageSize: nil) { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let pagedUsers):
                let selfUserId = TUILogin.getUserID()
                var users = pagedUsers.users
                if let index = users.firstIndex(where: { $0.userId == selfUserId }) {
                    users.remove(at: index)
                }
                self.members = users
                self.filteredMembers = users
            default:
                break
            }
        }
    }
    
    func filterMember(with searchText: String) {
        if searchText.isEmpty {
            filteredMembers = members
        } else {
            let lowercaseSearchText = searchText.lowercased()
            filteredMembers = members.filter {
                $0.userName.lowercased().contains(lowercaseSearchText) ||
                $0.userId.lowercased().contains(lowercaseSearchText)
            }
        }
    }
    
    func selectMember(_ member: User) {
        if !selectedMembers.contains(where: { $0.userId == member.userId }) {
            selectedMembers.append(member)
        }
    }
    
    func selectMembers(_ members: [User]) {
        let filteredArray = members.filter { user in !selectedMembers.contains(user) }
        if !filteredArray.isEmpty {
            selectedMembers.append(contentsOf: members)
        }
    }
    
    func setDisabledMembers(_ members: [User]) {
        disabledMembers = members
    }
    
    func deSelectMember(_ member: User) {
        if let index = selectedMembers.firstIndex(where: { $0.userId == member.userId }) {
            selectedMembers.remove(at: index)
        }
    }
    
    func index(from member: User) -> Int? {
        if let index = filteredMembers.firstIndex(where: { $0.userId == member.userId }) {
            return index
        }
        return nil
    }
}
