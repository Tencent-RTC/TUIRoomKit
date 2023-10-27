//
//  ExitRoomViewModel.swift
//  TUIRoomKit
//
//  Created by krabyu on 2023/8/23.
//

import Foundation
import TUIRoomEngine

class ExitRoomViewModel {
    var engineManager: EngineManager
    var currentUser: UserEntity
    var isRoomOwner: Bool
    var isOnlyOneUserInRoom: Bool
    
    init() {
        engineManager = EngineManager.createInstance()
        currentUser =  engineManager.store.currentUser
        isRoomOwner = currentUser.userId == engineManager.store.roomInfo.ownerId
        isOnlyOneUserInRoom = engineManager.store.attendeeList.count == 1
    }
    
    func isShowLeaveRoomButton() -> Bool {
        if currentUser.userId == engineManager.store.roomInfo.ownerId {
            return engineManager.store.attendeeList.count > 1
        } else {
            return true
        }
    }
    
    func leaveRoomAction(sender: UIView) {
        if isRoomOwner && !isOnlyOneUserInRoom {
            RoomRouter.shared.dismissPopupViewController(viewType: .exitRoomViewType, animated: true)
            RoomRouter.shared.presentPopUpViewController(viewType: .transferMasterViewType, height: 720.scale375Height())
        }else {
            exitRoom()
        }
    }
    
    func exitRoomAction(sender: UIView) {
        exitRoom()
    }
    
    func exitRoom() {
        if isRoomOwner {
            engineManager.destroyRoom(onSuccess: nil, onError: nil)
        } else {
            engineManager.exitRoom(onSuccess: nil, onError: nil)
        }
        RoomRouter.shared.dismissAllRoomPopupViewController()
        RoomRouter.shared.popToRoomEntranceViewController()
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
