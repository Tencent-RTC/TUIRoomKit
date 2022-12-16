//
//  TUIVideoSeatAttendeeModel.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2022/9/28.
//

import Foundation
import TUIRoomEngine

class TUIVideoSeatAttendeeModel {
    var userInfo = TUIUserInfo()
    var networkQuality: TUINetworkQuality = .unknown
    var audioVolume: Int = 0
    var volumeState: Bool = false

    func userId() -> String {
        return userInfo.userId
    }
}
