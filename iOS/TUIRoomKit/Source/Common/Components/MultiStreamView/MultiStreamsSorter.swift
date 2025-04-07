//
//  MultiStreamsSorter.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/12/18.
//

import Foundation

class MultiStreamsSorter {
    private let currentUserId: String
    private var roomOwnerId: String = ""
    
    init(currentUserId: String) {
        self.currentUserId = currentUserId
    }
    
    func sortStreams(_ videoItems: [UserInfo]) -> [UserInfo] {
        guard needSorting(videoItems) else { return videoItems }
        var sortedItems = videoItems
          
        if let ownerIndex = sortedItems.firstIndex(where: { $0.userRole == .roomOwner }) {
          let owner = sortedItems.remove(at: ownerIndex)
          roomOwnerId = owner.userId
          sortedItems.insert(owner, at: 0)
        }
          
        if currentUserId != roomOwnerId,
             let currentUserIndex = sortedItems.firstIndex(where: { $0.userId == currentUserId }) {
              let currentUser = sortedItems.remove(at: currentUserIndex)
              sortedItems.insert(currentUser, at: 1)
          }
          
          let sortedOthers = sortedItems
              .dropFirst(currentUserId == roomOwnerId ? 1 : 2)
              .sorted { first, second in
                  let firstStatus = StreamStatus(hasAudio: first.hasAudioStream,
                                                   hasVideo: first.hasVideoStream)
                  let secondStatus = StreamStatus(hasAudio: second.hasAudioStream,
                                                    hasVideo: second.hasVideoStream)
                  return firstStatus.priority < secondStatus.priority
              }
          
          return Array(sortedItems.prefix(currentUserId == roomOwnerId ? 1 : 2)) + sortedOthers
    }
    
    private func needSorting(_ videoItems: [UserInfo]) -> Bool {
        guard videoItems.count > 1 else { return false }
        
        if let firstUser = videoItems.first,
           firstUser.userRole != .roomOwner,
           videoItems.contains(where: { $0.userRole == .roomOwner}) {
            return true
        }
        
        if currentUserId != roomOwnerId {
            let currentUserExpectedPosition = 1
            if videoItems.count > currentUserExpectedPosition,
               videoItems[currentUserExpectedPosition].userId != currentUserId,
               videoItems.contains(where: { $0.userId == currentUserId }) {
                return true
            }
        }
        
        let startIndex = currentUserId == roomOwnerId ? 1 : 2
        guard videoItems.count > startIndex + 1 else { return false }
        
        let otherStreams = Array(videoItems[startIndex...])
        for i in 0..<(otherStreams.count - 1) {
            let current = otherStreams[i]
            let next = otherStreams[i + 1]
            let currentStreamState = StreamStatus(hasAudio: current.hasAudioStream, hasVideo: current.hasVideoStream)
            let nexdtStreamState = StreamStatus(hasAudio: next.hasAudioStream, hasVideo: next.hasVideoStream)
            if currentStreamState.priority > nexdtStreamState.priority {
                return true
            }
       }
       
       return false
    }
}

enum StreamStatus {
    case videoAndAudio
    case videoOnly
    case audioOnly
    case none
    
    init(hasAudio: Bool, hasVideo: Bool) {
        switch(hasAudio, hasVideo) {
        case(true, true): self = .videoAndAudio
        case(false, true): self = .videoOnly
        case(true, false): self = .audioOnly
        case(false, false): self = .none
        }
    }
    
    var priority: Int {
        switch self {
        case .videoAndAudio: return 0
        case .videoOnly: return 1
        case .audioOnly: return 2
        case .none: return 3
        }
    }
}
