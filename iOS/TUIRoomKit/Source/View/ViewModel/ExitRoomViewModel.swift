//
//  ExitRoomViewModel.swift
//  TUIRoomKit
//
//  Created by krabyu on 2023/8/23.
//

import Foundation

protocol ExitRoomViewModelResponder: AnyObject {
    func makeToast(message: String)
    func dismissView()
}

class ExitRoomViewModel {
    var engineManager: EngineManager {
        EngineManager.shared
    }
    var isRoomOwner: Bool {
        engineManager.store.currentUser.userId == engineManager.store.roomInfo.ownerId
    }
    
    weak var viewResponder: ExitRoomViewModelResponder?
    
    func isShownLeaveRoomButton() -> Bool {
        if isRoomOwner {
            return getFilterRoomOwnerNumber() > 0
        } else {
            return true
        }
    }
    
    func isShownDestroyRoomButton() -> Bool {
        return isRoomOwner
    }
    
    func leaveRoomAction() {
        if isRoomOwner {
            if getFilterRoomOwnerNumber() == 1, let userInfo = getNextRoomOwner() {
                appointMasterAndExitRoom(userId: userInfo.userId)
            } else if getFilterRoomOwnerNumber() > 1 {
                viewResponder?.dismissView()
                RoomRouter.shared.presentPopUpViewController(viewType: .transferMasterViewType, height: 720.scale375Height())
            } else {
                destroyRoom()
            }
        } else {
            exitRoom()
        }
    }
    
    func exitRoom() {
        engineManager.exitRoom { [weak self] in
            guard let self = self else { return }
            self.viewResponder?.dismissView()
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_DismissConferenceViewController, param: [:])
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.viewResponder?.makeToast(message: message)
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_DismissConferenceViewController, param: [:])
        }
    }
    
    func destroyRoom() {
        engineManager.destroyRoom { [weak self] in
            guard let self = self else { return }
            self.viewResponder?.dismissView()
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_DismissConferenceViewController, param: [:])
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.viewResponder?.makeToast(message: message)
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_DismissConferenceViewController, param: [:])
        }
    }
    
    private func getNextRoomOwner() -> UserEntity? {
        let userInfoArray = engineManager.store.attendeeList.filter({ $0.userId != engineManager.store.roomInfo.ownerId })
        return userInfoArray.first
    }
    
    private func getFilterRoomOwnerNumber() -> Int {
        let array = engineManager.store.attendeeList.filter({ $0.userId != engineManager.store.roomInfo.ownerId })
        return array.count
    }
    
    private func appointMasterAndExitRoom(userId: String) {
        engineManager.changeUserRole(userId: userId, role: .roomOwner) { [weak self] in
            guard let self = self else { return }
            self.exitRoom()
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.viewResponder?.makeToast(message: message)
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
