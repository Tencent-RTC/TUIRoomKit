//
//  UserState.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/6/5.
//

import Foundation
import RTCRoomEngine

struct UserState {
    var selfInfo: UserInfo = UserInfo()
    var allUsers: [UserInfo] = []
    
    var hasAudioStreamUsers = Set<String>()
    var hasCameraStreamUsers = Set<String>()
    var hasScreenStreamUsers = Set<String>()
    var disableMessageUsers = Set<String>()
}

struct UserInfo: Codable {
    var userId: String = ""
    var userName: String = ""
    var avatarUrl: String = ""
    var userRole: TUIRole? = .generalUser
    var userVoiceVolume: Int = 0
    var hasAudioStream: Bool = false
    var hasVideoStream: Bool = false
    var videoStreamType: TUIVideoStreamType = .cameraStream
    var isOnSeat: Bool = false
    var disableSendingMessage: Bool = false
    var hasScreenStream: Bool = false
    
    enum CodingKeys: String, CodingKey {
        case userId
        case userName
        case avatarUrl
    }
    
    init() {}
    
    init(loginUserInfo: TUILoginUserInfo) {
        self.userId = loginUserInfo.userId
        self.userName = loginUserInfo.userName
        self.avatarUrl = loginUserInfo.avatarUrl
    }
    
    init(userInfo: TUIUserInfo) {
        self.userId = userInfo.userId
        let userName = userInfo.nameCard.isEmpty ? userInfo.userName : userInfo.nameCard
        self.userName = userName.isEmpty ? userInfo.userId: userName
        self.avatarUrl = userInfo.avatarUrl
        self.userRole = userInfo.userRole
        self.hasAudioStream = userInfo.hasAudioStream
        self.hasVideoStream = userInfo.hasVideoStream
        self.hasScreenStream = userInfo.hasScreenStream
    }
    
    init(userEntity: UserEntity) {
        self.userId = userEntity.userId
        self.userName = userEntity.userName
        self.avatarUrl = userEntity.avatarUrl
        self.userRole = userEntity.userRole
        self.hasAudioStream = userEntity.hasAudioStream
        self.hasVideoStream = userEntity.hasVideoStream
        self.videoStreamType = userEntity.videoStreamType
        self.isOnSeat = userEntity.isOnSeat
        self.hasScreenStream = userEntity.hasScreenStream
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.userId = try container.decode(String.self, forKey: .userId)
        self.userName = try container.decode(String.self, forKey: .userName)
        self.avatarUrl = try container.decode(String.self, forKey: .avatarUrl)
    }
}

extension UserInfo: Hashable {
    static func == (lhs: UserInfo, rhs: UserInfo) -> Bool {
        return lhs.userId == rhs.userId &&
               lhs.userName == rhs.userName &&
               lhs.avatarUrl == rhs.avatarUrl &&
               lhs.userRole == rhs.userRole &&
               lhs.hasAudioStream == rhs.hasAudioStream &&
               lhs.hasVideoStream == rhs.hasVideoStream &&
               lhs.videoStreamType == rhs.videoStreamType &&
               lhs.isOnSeat == rhs.isOnSeat &&
               lhs.hasScreenStream == rhs.hasScreenStream
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(userId)
        hasher.combine(userName)
        hasher.combine(avatarUrl)
        hasher.combine(userRole)
        hasher.combine(hasAudioStream)
        hasher.combine(hasVideoStream)
        hasher.combine(videoStreamType)
        hasher.combine(isOnSeat)
        hasher.combine(hasScreenStream)
    }
}

extension TUIRole: Codable {
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let rawValue = try container.decode(UInt.self)
        self = TUIRole(rawValue: rawValue) ?? .generalUser
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(self.rawValue)
    }
}

extension TUIVideoStreamType: Codable {
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let rawValue = try container.decode(UInt.self)
        self = TUIVideoStreamType(rawValue: rawValue) ?? .cameraStream
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(self.rawValue)
    }
}

extension UserInfo {
    func convertToUser() -> User {
        return User(self)
    }
}

@objc public class User: NSObject, Codable {
    private(set) var userInfo: UserInfo
    
    @objc public var userId: String {
        get { return userInfo.userId}
    }
    @objc public var userName: String {
        get { return userInfo.userName}
    }
    @objc public var avatarUrl: String {
        get { return userInfo.avatarUrl}
    }
    
    @objc public init(userId: String, userName: String, avatarUrl: String) {
        var info = UserInfo()
        info.userId = userId
        info.userName = userName
        info.avatarUrl = avatarUrl
        self.userInfo = info
        super.init()
    }
    
    init(_ userInfo: UserInfo) {
        self.userInfo = userInfo
        super.init()
    }
    
    public required init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        self.userInfo = try container.decode(UserInfo.self)
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(userInfo)
    }
    
    @objc public func setUserId(_ userId: String) {
        userInfo.userId = userId
    }
    @objc public func setUserName(_ userName: String) {
        userInfo.userName = userName
    }
    @objc public func setAvatarUrl(_ avatarUrl: String) {
        userInfo.avatarUrl = avatarUrl
    }

}

@objc public class ConferenceParticipants: NSObject {
    @objc public var selectedList: [User] = []
    @objc public var unSelectableList : [User] = []
    
    @objc public init(selectedList: [User] = [], unSelectableList: [User] = []) {
        self.selectedList = selectedList
        self.unSelectableList = unSelectableList
        super.init()
    }
}
