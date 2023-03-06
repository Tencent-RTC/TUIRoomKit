//
//  UserListViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/4.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine

protocol UserListViewResponder: NSObject {
    func updateUIWhenRoomOwnerChanged(roomOwner:String)
    func reloadUserListView()
}

class UserListViewModel: NSObject {
    var userId: String = ""
    var attendeeList: [UserModel] = []

    weak var viewResponder: UserListViewResponder? = nil
    
    override init() {
        super.init()
        self.attendeeList = EngineManager.shared.store.attendeeList
        EngineEventCenter.shared.subscribeEngine(event: .onUserRoleChanged, observer: self)
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_RenewUserList, responder: self)
    }
    
    deinit {
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserRoleChanged, observer: self)
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_RenewSeatList, responder: self)
        debugPrint("deinit \(self)")
    }
    
    //UserListView的点击事件
    func backAction(sender: UIButton) {
        RoomRouter.shared.currentViewController()?.navigationController?.popViewController(animated: true)
    }
    
    func muteAllAudioAction(sender: UIButton, view: UserListView) {
        sender.isSelected = !sender.isSelected
        let roomInfo = EngineManager.shared.store.roomInfo
        roomInfo.enableAudio = !sender.isSelected
        EngineManager.shared.roomEngine.updateRoomInfo(roomInfo.getEngineRoomInfo()) {
            if sender.isSelected {
                RoomRouter.shared.currentViewController()?.view.makeToast(.allMuteAudioText)
            } else {
                RoomRouter.shared.currentViewController()?.view.makeToast(.allUnMuteAudioText)
            }
        } onError: { _, message in
            RoomRouter.shared.currentViewController()?.view.makeToast(message)
        }
    }
    
    func muteAllVideoAction(sender: UIButton, view: UserListView) {
        sender.isSelected = !sender.isSelected
        let roomInfo = EngineManager.shared.store.roomInfo
        roomInfo.enableVideo = !sender.isSelected
        EngineManager.shared.roomEngine.updateRoomInfo(roomInfo.getEngineRoomInfo()) {
            if sender.isSelected {
                RoomRouter.shared.currentViewController()?.view.makeToast(.allMuteVideoText)
            } else {
                RoomRouter.shared.currentViewController()?.view.makeToast(.allUnMuteVideoText)
            }
        } onError: { _, message in
            RoomRouter.shared.currentViewController()?.view.makeToast(message)
        }
    }
    
    func showUserManageViewAction(userId: String, view: UserListView) {
        self.userId = userId
        if EngineManager.shared.store.currentUser.userRole == .roomOwner || EngineManager.shared.store.currentUser.userId == userId {
            view.userListManagerView.isHidden = false
            view.userListManagerView.viewModel.userId = userId
            view.userListManagerView.viewModel.updateUserItem()
        }
    }
    
    func inviteSeatAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        EngineManager.shared.roomEngine.requestRemoteUserOnSeat(0, userId: userId, timeout: 30) { _, _ in
            //todo
        } onRejected: { _, _, _ in
            //todo
        } onCancelled: { _, _ in
            //todo
        } onTimeout: { _, _ in
            //todo
        } onError: { _, _, _, _ in
            //todo
        }
    }

}

extension UserListViewModel: RoomEngineEventResponder {
    
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        if name == .onUserRoleChanged {
            guard let userRole = param?["userRole"] as? TUIRole, userRole == .roomOwner else { return }
            guard let userId = param?["userId"] as? String else { return }
            viewResponder?.updateUIWhenRoomOwnerChanged(roomOwner: userId)
        }
    }
}


extension UserListViewModel: RoomKitUIEventResponder {
    func onNotifyUIEvent(key: EngineEventCenter.RoomUIEvent, Object: Any?, info: [AnyHashable : Any]?) {
        if key == .TUIRoomKitService_RenewUserList {
            attendeeList = EngineManager.shared.store.attendeeList
            viewResponder?.reloadUserListView()
        }
    }
}


private extension String {
    static let allMuteAudioText = localized("TUIRoom.all.mute")
    static let allMuteVideoText = localized("TUIRoom.all.mute.video")
    static let allUnMuteAudioText = localized("TUIRoom.all.unmute")
    static let allUnMuteVideoText = localized("TUIRoom.all.unmute.video")
}
