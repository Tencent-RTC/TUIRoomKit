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
        return engineManager.store.currentUser.userRole == .roomOwner
    }
    
    weak var viewResponder: ExitRoomViewModelResponder?
    
    func isShownLeaveRoomButton() -> Bool {
        return true
    }
    
    func isShownDestroyRoomButton() -> Bool {
        return isRoomOwner
    }
    
    func isAbleToTransferTheOwner() -> Bool {
        return isRoomOwner && getFilterOwnerUserList().count > 0
    }
    
    func leaveRoomAction() {
        if isRoomOwner {
            let filterOwnerList = getFilterOwnerUserList()
            if filterOwnerList.count == 1, let userInfo = filterOwnerList.first {
                appointMasterAndExitRoom(userId: userInfo.userId)
            } else if filterOwnerList.count > 1 {
                viewResponder?.dismissView()
                RoomRouter.shared.presentPopUpViewController(viewType: .transferMasterViewType, height: 720.scale375Height())
            } else {
                exitRoom()
            }
        } else {
            exitRoom()
        }
    }
    
    func exitRoom() {
        engineManager.exitRoom()
        viewResponder?.dismissView()
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_DismissConferenceViewController, param: [:])
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
    
    private func getFilterOwnerUserList() -> [UserEntity] {
        return engineManager.store.attendeeList.filter({ $0.userRole != .roomOwner })
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
