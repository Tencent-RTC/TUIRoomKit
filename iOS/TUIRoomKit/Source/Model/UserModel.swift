//
//  UserModel.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/26.
//

import Foundation
import TUICore
import TUIRoomEngine

class UserModel {
    var allowVideoTurnedOn: Bool = true
    var userInfo: TUIUserInfo = TUIUserInfo()
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

    var allowAudioTurnedOn: Bool = true
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
}
