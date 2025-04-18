//
//  RoomMessageViewModel.swift
//  TUIRoomKit
//
//  Created by janejntang on 2023/5/10.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation
import RTCRoomEngine
import TUICore
import TIMCommon

protocol RoomMessageViewResponder: NSObject {
    func updateStackView()
    func updateRoomStatus()
    func updateEnteredRoom()
    func updateExitRoom()
}

class RoomMessageViewModel: NSObject {
    var message: RoomMessageModel
    private var engineManager: EngineManager {
        EngineManager.shared
    }
    lazy var userId: String = {
        return TUILogin.getUserID() ?? EngineManager.shared.store.currentUser.userId
    }()
    var messageManager: RoomMessageManager {
        RoomMessageManager.shared
    }
    let roomManager = RoomManager.shared
    weak var viewResponder: RoomMessageViewResponder?
    init(message: RoomMessageModel) {
        self.message = message
        super.init()
        roomManager.roomObserver.addListener(listener: self)
    }
    
    deinit {
        roomManager.roomObserver.removeListener(listener: self)
        debugPrint("deinit \(self)")
    }
    
    func changeMessage(message: RoomMessageModel) {
        self.message = message
        viewResponder?.updateStackView()
        viewResponder?.updateRoomStatus()
    }
    
    func enterRoomAction() {
        guard BusinessSceneUtil.canJoinRoom() else { return }
        if roomManager.isEnteredOtherRoom(roomId: message.roomId) {
            roomManager.exitOrDestroyPreviousRoom { [weak self] in
                guard let self = self else { return }
                self.enterRoom()
            } onError: { [weak self] code, message in
                debugPrint("exitRoom,code:\(code),message:\(message)")
                guard let self = self else { return }
                self.enterRoom()
            }
        } else {
            enterRoom()
        }
    }
    
    private func enterRoom() {
        if !engineManager.store.isEnteredRoom {
            roomManager.enterRoom(roomId: message.roomId) {_ in
                let vc = ConferenceMainViewController()
                RoomRouter.shared.push(viewController: vc)
            } onError: { [weak self] code, errorMessage in
                if let self = self, code == .roomIdNotExist {
                    self.messageManager.resendRoomMessage(message: self.message, dic: ["roomState": RoomMessageModel.RoomState.destroyed.rawValue])
                }
                RoomRouter.makeToast(toast: code.description ?? errorMessage)
            }
        } else {
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_ShowRoomMainView, param: [:])
        }
    }
    
    func inviteUserAction() {
        guard message.groupId.count > 0 else { return }
        let inviter = TUILoginUserInfo()
        inviter.userId = userId
        inviter.userName = TUILogin.getNickName() ?? ""
        inviter.avatarUrl = TUILogin.getFaceUrl() ?? ""
        InviteToJoinRoomManager.startInviteToJoinRoom(message: message, inviter: inviter)
    }
}

extension RoomMessageViewModel: RoomObserverListener {
    func onRoomEnter(messageId: String, code: Int, message: String) {
        if code == 0, messageId == self.message.messageId {
            viewResponder?.updateEnteredRoom()
        }
    }
    func onRoomExit(messageId: String) {
        if messageId == self.message.messageId {
            viewResponder?.updateExitRoom()
        }
    }
}
