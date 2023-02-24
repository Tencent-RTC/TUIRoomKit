//
//  UserModel.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/26.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine

class UserModel {
    var allowVideoTurnedOn: Bool
    var allowAudioTurnedOn: Bool
    private var userInfo: TUIUserInfo
    var isOnSeat: Bool
    var isAllowVideoTurnedOn: Bool {
        set {
            allowVideoTurnedOn = newValue
            if !allowVideoTurnedOn { // 远端禁用 本地关闭，
                hasVideoStream = allowVideoTurnedOn
            }
        }
        get {
            return allowVideoTurnedOn
        }
    }
    
    var isAllowAudioTurnedOn: Bool {
        set {
            allowAudioTurnedOn = newValue
            if !allowAudioTurnedOn { // 远端禁用 本地关闭，
                hasAudioStream = allowAudioTurnedOn
            }
        }
        get {
            return allowAudioTurnedOn
        }
    }
    
    var hasVideoStream: Bool {
        set {
            userInfo.hasVideoStream = newValue
        }
        get {
            return userInfo.hasVideoStream && isAllowVideoTurnedOn
        }
    }
    
    var hasAudioStream: Bool {
        set {
            userInfo.hasAudioStream = newValue
        }
        get {
            return userInfo.hasAudioStream && isAllowAudioTurnedOn
        }
    }
    
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
    
    var hasScreenStream: Bool {
        set {
            userInfo.hasScreenStream = newValue
        }
        get {
            return userInfo.hasScreenStream
        }
    }
    
    init() {
        allowVideoTurnedOn = true
        allowAudioTurnedOn = true
        isOnSeat = false
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
