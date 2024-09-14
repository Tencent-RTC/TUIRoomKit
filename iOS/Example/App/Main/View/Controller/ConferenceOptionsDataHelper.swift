//
//  ConferenceOptionsDataHelper.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/6/4.
//

import Foundation
import Factory

typealias ConferenceItemTapClosure = (UIButton) -> Void

struct ConferenceOptionInfo {
    let normalText: String
    let normalIcon: String
    let backgroundColor: String
    var tapAction: ConferenceItemTapClosure?
    init(normalText: String, normalIcon: String, backgroundColor: String, tapAction: ConferenceItemTapClosure? = nil) {
        self.normalText = normalText
        self.normalIcon = normalIcon
        self.backgroundColor = backgroundColor
    }
}

class ConferenceOptionsDataHelper {
    func generateOptionsData() -> [ConferenceOptionInfo] {
        var options: [ConferenceOptionInfo] = []
        let createRoom = ConferenceOptionInfo(normalText: .createRoomText, normalIcon: "create_conference", backgroundColor: "0x146EFA")
        options.append(createRoom)
        
        let enterRoom = ConferenceOptionInfo(normalText: .joinRoomText, normalIcon: "enter_conference", backgroundColor: "0x146EFA")
        options.append(enterRoom)
        
        let scheduleRoom = ConferenceOptionInfo(normalText: .scheduleRoomText, normalIcon: "schedule_conference", backgroundColor: "0x146EFA")
        options.append(scheduleRoom)
        return options
    }
}

private extension String {
    static var joinRoomText: String {
        RoomDemoLocalize("Join Room")
    }
    static var createRoomText: String {
        RoomDemoLocalize("Create Room")
    }
    static var scheduleRoomText: String {
        RoomDemoLocalize("Schedule Room")
    }
}

