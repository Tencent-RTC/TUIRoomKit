//
//  UserListViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/4.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

enum MuteAllUserType {
    case muteAllVideo
    case muteAllAudio
}

class UserListViewModel {
    var userId: String = ""
    var muteAllUserType: MuteAllUserType = .muteAllAudio
   
    //UserListView的点击事件
    func backAction(sender: UIButton) {
        RoomRouter.shared.currentViewController()?.navigationController?.popViewController(animated: true)
    }
    
    func muteAllAudioAction(sender: UIButton, view: UserListView) {
        if !sender.isSelected {
            showUserListMuteViewAction(muteAllUserType: .muteAllAudio, view: view)
        } else {
            sender.isSelected = false
            muteAllUserAudio(mute: false)
        }
    }
    
    func muteAllVideoAction(sender: UIButton, view: UserListView) {
        if !sender.isSelected {
            showUserListMuteViewAction(muteAllUserType: .muteAllVideo, view: view)
        } else {
            sender.isSelected = false
            muteAllUserVideo(mute: false)
        }
    }
    
    func showUserListMuteViewAction(muteAllUserType: MuteAllUserType, view: UserListView) {
        self.muteAllUserType = muteAllUserType
        view.userListMuteView.isHidden = false
        view.userListMuteView.setupViewState(item: self)
    }
    
    func showUserManageViewAction(userId: String, view: UserListView) {
        self.userId = userId
        if EngineManager.shared.store.currentUser.userRole == .roomOwner || EngineManager.shared.store.currentUser.userId == userId {
            view.userListManagerView.isHidden = false
            view.userListManagerView.viewModel.userId = userId
            view.userListManagerView.viewModel.updateUserItem()
        }
    }
    
    func muteAllUserAudio(mute: Bool) {
        if let view = RoomRouter.shared.currentViewController()?.view as? UserListView, mute {
            view.muteAllAudioButton.isSelected = true
        }
        let roomInfo = EngineManager.shared.store.roomInfo
        roomInfo.enableAudio = !mute
        EngineManager.shared.roomEngine.updateRoomInfo(roomInfo.getEngineRoomInfo()) {
            if mute {
                RoomRouter.shared.currentViewController()?.view.makeToast(.allMuteAudioText)
            } else {
                RoomRouter.shared.currentViewController()?.view.makeToast(.allUnMuteAudioText)
            }
        } onError: { _, message in
            RoomRouter.shared.currentViewController()?.view.makeToast(message)
        }
    }
    
    func muteAllUserVideo(mute: Bool) {
        if let view = RoomRouter.shared.currentViewController()?.view as? UserListView, mute {
            view.muteAllVideoButton.isSelected = true
        }
        let roomInfo = EngineManager.shared.store.roomInfo
        roomInfo.enableVideo = !mute
        EngineManager.shared.roomEngine.updateRoomInfo(roomInfo.getEngineRoomInfo()) {
            if mute {
                RoomRouter.shared.currentViewController()?.view.makeToast(.allMuteVideoText)
            } else {
                RoomRouter.shared.currentViewController()?.view.makeToast(.allUnMuteVideoText)
            }
        } onError: { _, message in
            RoomRouter.shared.currentViewController()?.view.makeToast(message)
        }
    }
    
    func muteAction(sender: UIButton) {
        if muteAllUserType == .muteAllAudio {
            muteAllUserAudio(mute: true)
        } else {
            muteAllUserVideo(mute: true)
        }
        if let view = RoomRouter.shared.currentViewController()?.view as? UserListView {
            view.userListMuteView.isHidden = true
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
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let allMuteAudioText = localized("TUIRoom.all.mute")
    static let allMuteVideoText = localized("TUIRoom.all.mute.video")
    static let allUnMuteAudioText = localized("TUIRoom.all.unmute")
    static let allUnMuteVideoText = localized("TUIRoom.all.unmute.video")
}
