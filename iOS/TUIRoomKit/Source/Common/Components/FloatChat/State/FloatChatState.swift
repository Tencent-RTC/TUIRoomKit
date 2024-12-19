//
//  FloatChatState.swift
//  TUIRoomKit
//
//  Created by aby on 2024/5/17.
//

import Foundation
import RTCRoomEngine
import ImSDK_Plus

struct FloatChatState: Codable {
    var isFloatInputViewShow = false
    var roomId: String = ""
    var latestMessage = FloatChatMessage()
}

enum FloatChatMessageType: Codable, Equatable {
    case text
    case image
    case video
    case file
}

struct FloatChatMessage: Codable, Equatable {
    var id = UUID()
    var user = FloatChatUser()
    var type: FloatChatMessageType = .text
    var content: String = ""
    var fileName: String = ""
    var extInfo: [String: AnyCodable] = [:]
    
    init() {}
    
    init(user: FloatChatUser, content: String) {
        self.user = user
        self.content = content
    }
    
    init(msg: V2TIMMessage) {
        self.user = FloatChatUser(userId: msg.sender ?? "", userName: msg.nickName ?? "", avatarUrl: msg.faceURL ?? "")
        switch msg.elemType {
        case .ELEM_TYPE_TEXT:
            self.type = .text
            self.content = msg.textElem.text
        case .ELEM_TYPE_IMAGE:
            self.type = .image
        case .ELEM_TYPE_VIDEO:
            self.type = .video
        case .ELEM_TYPE_FILE:
            self.type = .file
            self.fileName = msg.fileElem.filename
        default: break
        }
    }
}

struct FloatChatUser: Codable, Equatable {
    var userId: String = ""
    var userName: String = ""
    var avatarUrl: String?
    
    init() {}
    
    init(loginInfo: TUILoginUserInfo) {
        self.userId = loginInfo.userId
        self.userName = loginInfo.userName
        self.avatarUrl = loginInfo.avatarUrl
    }
    
    init(userId: String, userName: String, avatarUrl: String?) {
        self.userId = userId
        self.userName = userName
        self.avatarUrl = avatarUrl
    }
    
    init(memberInfo: V2TIMGroupMemberInfo) {
        self.userId = memberInfo.userID ?? ""
        self.userName = memberInfo.nickName ?? userId
        self.avatarUrl = memberInfo.faceURL
    }
}
