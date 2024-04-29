//
//  RoomMessageManager.swift
//  TUIRoomKit
//
//  Created by janejntang on 2023/5/8.
//  Copyright © 2023 Tencent. All rights reserved.
//  Manage messages, including sending messages and modifying messages
//

import Foundation
import TUICore

class RoomMessageManager {
    static let shared = RoomMessageManager()
    private var engineManager: EngineManager {
        EngineManager.createInstance()
    }
    private lazy var userId: String = {
        return TUILogin.getUserID() ?? engineManager.store.currentUser.userId
    }()
    weak var navigateController: UINavigationController?
    var isReadyToSendMessage: Bool = true
    var groupId: String = ""
    private init() {}
    
    func sendRoomMessageToGroup() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard BusinessSceneUtil.canJoinRoom() else { return }
            if self.engineManager.store.isEnteredRoom {
                RoomManager.shared.exitOrDestroyPreviousRoom() { [weak self] in
                    guard let self = self else { return }
                    self.sendMessage()
                } onError: { [weak self] code, message in
                    guard let self = self else { return }
                    self.sendMessage()
                    debugPrint("exitRoom,code:\(code),message:\(message)")
                }
            } else {
                self.sendMessage()
            }
        }
    }
    
    private func sendMessage() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard self.isReadyToSendMessage else {
                self.changeReadyToSendMessage()
                return
            }
            self.isReadyToSendMessage = false
            FetchRoomId.getRoomId { [weak self] roomId in
                guard let self = self else { return }
                let messageModel = RoomMessageModel()
                messageModel.groupId = self.groupId
                messageModel.roomId = roomId
                messageModel.ownerName = TUILogin.getNickName() ?? ""
                messageModel.owner = self.userId
                let messageDic = messageModel.getDictFromMessageModel()
                guard let jsonString = messageDic.convertToString() else { return }
                let jsonData = jsonString.data(using: String.Encoding.utf8)
                let message = V2TIMManager.sharedInstance().createCustomMessage(jsonData)
                message?.supportMessageExtension = true
                let param = [TUICore_TUIChatService_SendMessageMethod_MsgKey: message]
                TUICore.callService(TUICore_TUIChatService, method: TUICore_TUIChatService_SendMessageMethod, param: param as [AnyHashable : Any])
                RoomManager.shared.roomId = roomId
            }
        }
    }
    
    func resendRoomMessage(message: RoomMessageModel,dic:[String: Any]) {
        if message.messageId == "" {
            self.modifyMessage(message: message, dic: dic)
            return
        }
        V2TIMManager.sharedInstance().findMessages([message.messageId]) { [weak self] messageArray in
            guard let self = self else { return }
            guard let array = messageArray else { return }
            for previousMessage in array where previousMessage.msgID == message.messageId {
                self.modifyMessage(message: message, dic: dic)
            }
        } fail: { [weak self] code, messageString in
            guard let self = self else { return }
            self.modifyMessage(message: message, dic: dic)
        }
    }
    
    private func modifyMessage(message: RoomMessageModel, dic:[String: Any]) {
        guard let message = message.getMessage() else { return }
        guard var dict = TUITool.jsonData2Dictionary(message.customElem.data) as? [String: Any] else { return }
        for (key, value) in dic {
            dict[key] = value
        }
        guard let jsonString = dic.convertToString() else { return }
        let jsonData = jsonString.data(using: String.Encoding.utf8)
        message.customElem.data = jsonData
        V2TIMManager.sharedInstance().modifyMessage(message) { code, desc, msg in
            if code == 0 {
                debugPrint("modifyMessage,success")
            } else {
                debugPrint("modifyMessage,code:\(code),message:\(String(describing: desc))")
            }
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension RoomMessageManager {
    private func changeReadyToSendMessage() {
        DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + 20) { [weak self] in
            guard let self = self else { return }
            self.isReadyToSendMessage = true
        }
    }
}

private extension String {
    static var quickMeetingText: String {
        localized("TUIRoom.quick.meeting")
    }
}

