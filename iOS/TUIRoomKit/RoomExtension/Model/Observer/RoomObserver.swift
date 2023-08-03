//
//  RoomObserver.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/7/3.
//  监听TUIRoomEngine，并且处理回调

import Foundation
import TUIRoomEngine
import TUICore

@objc public protocol RoomObserverListener {
    @objc optional func onRoomEnter(messageId: String, code: Int, message: String) -> Void
    @objc optional func onRoomExit(messageId: String) -> Void
}

class RoomObserver: NSObject {
    var messageModel = RoomMessageModel()
    private let messageManager = RoomMessageManager.shared
    var engineManager: EngineManager {
        EngineManager.shared
    }
    lazy var userList: [[String: Any]] = {
        return messageModel.userList
    }()
    private lazy var userId: String = {
        return TUILogin.getUserID() ?? EngineManager.shared.store.currentLoginUser.userId
    }()
    typealias Weak<T> = () -> T?
    private var listenerArray: [Weak<RoomObserverListener>] = []
    override init() {
        super.init()
    }
    
    func registerObserver() {
        EngineManager.shared.roomEngine.addObserver(self)
        TUIRoomKit.sharedInstance.addListener(listener: self)
    }
    
    func unregisterObserver() {
        EngineManager.shared.roomEngine.removeObserver(self)
        TUIRoomKit.sharedInstance.removeListener(listener: self)
    }
    
    func addListener(listener: RoomObserverListener) {
        let weakObserver = { [weak listener] in return listener }
        self.listenerArray.append(weakObserver)
    }
    
    func removeListener(listener: RoomObserverListener) {
        listenerArray.removeAll(where: {$0() === listener})
    }
    
    private func refreshSource() {
        RoomManager.shared.roomId = nil
        TUILogin.setCurrentBusinessScene(.None)
        engineManager.roomEngine.removeObserver(self)
        TUIRoomKit.sharedInstance.removeListener(listener: self)
        userList = []
        unregisterObserver()
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension RoomObserver: TUIRoomObserver {
    func onRemoteUserEnterRoom(roomId: String, userInfo: TUIUserInfo) {
        addUserList(userInfo: userInfo)
        guard userList.count > 1 else { return }
        if messageModel.owner == userId {
            let prefixUserList = Array(userList.prefix(5))
            messageManager.resendRoomMessage(message: messageModel, dic: ["userList":prefixUserList,"memberCount":userList.count])
        }
    }
    
    func onRemoteUserLeaveRoom(roomId: String, userInfo: TUIUserInfo) {
        userList = userList.filter { userDic in
            if let userId = userDic["userId"] as? String, userId != userInfo.userId {
                return true
            }
            return false
        }
        if messageModel.owner == userId {
            let prefixUserList = Array(userList.prefix(5))
            messageManager.resendRoomMessage(message: messageModel, dic: ["memberCount":userList.count,"userList":prefixUserList])
        }
    }
    
    func onUserRoleChanged(userId: String, userRole: TUIRole) {
        if userId == userId, userRole == .roomOwner {
            messageManager.resendRoomMessage(message: messageModel, dic: ["owner": userId])
        }
    }
}

extension RoomObserver: TUIRoomKitListener {
    func onRoomCreate(code: Int, message: String) {
        if code == 0 {
            TUILogin.setCurrentBusinessScene(.InMeetingRoom)
            messageModel.roomState = .created
            let userInfo = TUIUserInfo()
            userInfo.userId = userId
            userInfo.avatarUrl = TUILogin.getFaceUrl() ?? ""
            userInfo.userName = TUILogin.getNickName() ?? ""
            addUserList(userInfo: userInfo)
            let prefixUserList = Array(userList.prefix(5))
            messageManager.resendRoomMessage(message: messageModel, dic: ["userList":prefixUserList,
                                                                          "memberCount":userList.count,
                                                                          "roomState":RoomMessageModel.RoomState.created.rawValue,])
        }
    }
    
    func onRoomEnter(code: Int, message: String) {
        if code == 0 {
            TUILogin.setCurrentBusinessScene(.InMeetingRoom)
            if messageModel.owner != userId {
                getUserList(nextSequence: 0)
            }
        }
        for weakObserver in listenerArray {
            if let listener = weakObserver() {
                listener.onRoomEnter?(messageId: self.messageModel.messageId, code: code, message: message)
            }
        }
    }
    
    func onExitRoom() {
        userList = userList.filter { userDic in
            if let userId = userDic["userId"] as? String, userId != userId {
                return true
            }
            return false
        }
        if messageModel.owner == userId {
            let prefixUserList = Array(userList.prefix(5))
            messageManager.resendRoomMessage(message: messageModel, dic: ["userList":prefixUserList, "memberCount":userList.count])
        }
        for weakObserver in listenerArray {
            if let listener = weakObserver() {
                listener.onRoomExit?(messageId: self.messageModel.messageId)
            }
        }
        messageManager.isReadyToSendMessage = true
        refreshSource()
    }
    
    func onDestroyRoom() {
        messageModel.roomState = .destroyed
        if messageModel.owner == userId {
            messageManager.resendRoomMessage(message: messageModel, dic: ["roomState":RoomMessageModel.RoomState.destroyed.rawValue])
        }
        messageManager.isReadyToSendMessage = true
        refreshSource()
    }
}

extension RoomObserver {
    private func getUserList(nextSequence: Int) {
        engineManager.roomEngine.getUserList(nextSequence: nextSequence) { [weak self] list, nextSequence in
            guard let self = self else { return }
            list.forEach { userInfo in
                self.addUserList(userInfo: userInfo)
            }
            if nextSequence != 0 {
                self.getUserList(nextSequence: nextSequence)
            }
        } onError: { code, message in
            debugPrint("getUserList:code:\(code),message:\(message)")
        }
    }
    
    private func addUserList(userInfo: TUIUserInfo) {
        if getUserItem(userInfo.userId) == nil {
            let userDic: [String: Any] = ["userId":userInfo.userId,"userName":userInfo.userName,"faceUrl": userInfo.avatarUrl]
            userList.append(userDic)
        }
    }
    
    private func getUserItem(_ userId: String) -> String? {
        for userDic in userList {
            if let userIdString = userDic["userId"] as? String, userIdString == userId {
                return userIdString
            }
        }
        return nil
    }
}
