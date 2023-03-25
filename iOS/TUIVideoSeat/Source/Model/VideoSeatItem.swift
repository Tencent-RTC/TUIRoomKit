//
//  VideoSeatItem.swift
//  TUIVideoSeat
//
//  Created by jack on 2023/3/6.
//  Copyright © 2023 Tencent. All rights reserved.

import Foundation
import TUIRoomEngine

class VideoSeatItem {

    let seatInfo: TUISeatInfo
    var userInfo: TUIUserInfo = TUIUserInfo()
    var audioVolume: Int = 0
    var cellIndexPath: IndexPath? = nil
    var isAsyncUserInfo: Bool = false
    var seatIndex: Int {
        return seatInfo.index
    }
    
    var userId: String {
        return seatInfo.userId ?? ""
    }
    
    var userRole: TUIRole {
        set {
            userInfo.userRole = newValue
        }
        get {
            return userInfo.userRole
        }
    }
    
    var isRoomOwner: Bool {
        return userRole == .roomOwner
    }
    
    var userName: String {
        set {
            userInfo.userName = newValue
        }
        get {
            return userInfo.userName
        }
    }
    
    var avatarUrl: String {
        set {
            userInfo.avatarUrl = newValue
        }
        get {
            return userInfo.avatarUrl
        }
    }
    
    var hasAudioStream: Bool {
        set {
            userInfo.hasAudioStream = newValue
        }
        get {
            return userInfo.hasAudioStream
        }
    }
    
    var hasVideoStream: Bool {
        set {
            userInfo.hasVideoStream = newValue
        }
        get {
            return userInfo.hasVideoStream
        }
    }
    
    var hasScreenStream: Bool {
        set {
            userInfo.hasScreenStream = newValue
        }
        get {
            return userInfo.hasScreenStream
        }
    }
    
    init(seatInfo: TUISeatInfo) {
        self.seatInfo = seatInfo
        self.userInfo.userId = seatInfo.userId ?? ""
    }

    func updateUserInfo(_ userInfo: TUIUserInfo) {
        self.userInfo = userInfo
    }
    
    func updateSeatInfo(_ seatInfo: TUISeatInfo) {
        self.seatInfo.index = seatInfo.index
        self.seatInfo.locked = seatInfo.locked
        self.seatInfo.audioMuted = seatInfo.audioMuted
        self.seatInfo.videoMuted = seatInfo.videoMuted
    }
    
}
