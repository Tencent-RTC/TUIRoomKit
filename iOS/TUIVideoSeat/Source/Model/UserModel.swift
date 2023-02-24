//
//  UserModel.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2022/9/28.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine

class UserModel {
    private var userInfo : TUIUserInfo
    var isOnSeat: Bool
    var networkQuality: TUINetworkQuality = .unknown
    var audioVolume: Int = 0
    
    var userId: String {
        set {
            userInfo.userId = newValue
        }
        get {
            return userInfo.userId
        }
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
    
    var userRole: TUIRole {
        set {
            userInfo.userRole = newValue
        }
        get {
            return userInfo.userRole
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
    
    init() {
        isOnSeat = false
        networkQuality = .unknown
        audioVolume = 0
        userInfo = TUIUserInfo()
    }
    
    func update(userInfo: TUIUserInfo) {
        self.userInfo = userInfo
    }
    
    func getUserInfo() -> TUIUserInfo {
        return userInfo
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
