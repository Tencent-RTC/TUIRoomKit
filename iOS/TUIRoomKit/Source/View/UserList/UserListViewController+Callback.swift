//
//  UserListViewController+Callback.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2022/9/22.
//

import Foundation
import TUIRoomEngine

extension UserListViewController: TUIRoomPresenterListener {
    func onPresenterUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        let userInfo = attendeeList.first(where: {$0.userId == userId})
        if streamType == .cameraStream || streamType == .cameraStreamLow {
            userInfo?.hasVideoStream = hasVideo
        } else if streamType == .screenStream {
            userInfo?.hasScreenStream = hasVideo
        }
        let noti = Notification(name: Notification.Name("kUserListRefresh"))
        NotificationCenter.default.post(noti)
    }

    func onPresenterUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        let userInfo = attendeeList.first(where: {$0.userId == userId})
        userInfo?.hasAudioStream = hasAudio
        let noti = Notification(name: Notification.Name("kUserListRefresh"))
        NotificationCenter.default.post(noti)
    }

    func onPresenterSeatListChanged(seatList: [TUISeatInfo], seated: [TUISeatInfo], left: [TUISeatInfo]) {
        if left.count > 0 {
            for seatInfo: TUISeatInfo in left {
                guard let userId = seatInfo.userId else {
                    continue
                }
                clearUserSource(userId)
            }
            clearUserSource(currentUserInfo?.userInfo.userId ?? "")
            let noti = Notification(name: Notification.Name("kUserListRefresh"))
            NotificationCenter.default.post(noti)
        }

        if attendeeList.count <= 1 {
            addUserList(userList: seatList)
        } else {
            addUserList(userList: seated)
        }
    }

    private func addUserList(userList: [TUISeatInfo]) {
        if userList.count > 0 {
            for seatInfo: TUISeatInfo in userList {
                guard let userId = seatInfo.userId else {
                    continue
                }
                if attendeeMap[userId] != nil {
                    continue
                }
                
                if userId == currentUserInfo?.userInfo.userId {
                    continue
                }
                
                let userModel = TUIUserInfo()
                userModel.userId = userId
                attendeeMap[userId] = userModel
                attendeeList.append(userModel)
                
                roomPresenter.getUserInfo(userID: userId) { [weak self] userInfo in
                    guard let user = userInfo else {
                        return
                    }
                    guard let self = self else { return }
                    userModel.userName = user.userName
                    userModel.userRole = user.userRole
                    userModel.avatarUrl = user.avatarUrl
                    if userModel.userName.isEmpty {
                        userModel.userName = userModel.userId
                    }
                    if userModel.userRole == .roomOwner {
                        self.attendeeList = self.attendeeList.filter { model -> Bool in
                            model.userId != userId
                        }
                        self.attendeeList.insert(userModel, at: 0)
                    }
                    let noti = Notification(name: Notification.Name("kUserListRefresh"))
                    NotificationCenter.default.post(noti)
                    
                } onError: { code, message in
                    debugPrint("code:\(code), message:\(message)")
                }
            }
            let noti = Notification(name: Notification.Name("kUserListRefresh"))
            NotificationCenter.default.post(noti)
        }
    }

    /**
     * 清理麦上用户资源
     *
     * @param userId 用户ID
     */
    private func clearUserSource(_ userId: String) {
        attendeeMap.removeValue(forKey: userId)
        attendeeList = attendeeList.filter { model -> Bool in
            model.userId != userId
        }
    }

    func onPresenterRoomInfoChanged(roomId: String, roomInfo: TUIRoomInfo) {
        if roomEngineInfo?.roomId == roomId {
            if roomOwner != roomInfo.owner {
                roomOwner = roomInfo.owner
                let isHomeowner: Bool = (roomOwner == currentUserInfo?.userInfo.userId)
                if isHomeowner {
                    
                    updateView()
                } else {
                }
            }
        }
    }
}
