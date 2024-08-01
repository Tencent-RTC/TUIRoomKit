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

class SelectMembersViewModel {
    private(set) var members: [User] = []
    @Published private(set) var filteredMembers: [User] = []
    @Published private(set) var selectedMembers: [User] = []
    
    init() {
        loadMembers()
    }
    
    func loadMembers() {
        //load mock data, you should replace with your real data
        guard let url = Bundle.main.url(forResource: "members", withExtension: "json") else {
            return
        }
        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            let users = try decoder.decode([User].self, from: data)
            members = users
            filteredMembers = members
        } catch {
            print("Error decoding JSON: \(error)")
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
