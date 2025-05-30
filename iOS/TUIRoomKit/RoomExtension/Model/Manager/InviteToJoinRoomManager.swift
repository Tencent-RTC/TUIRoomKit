//
//  InviteToJoinRoomManager.swift
//  TUIRoomKit
//
//  Created by janejntang on 2023/7/3.
//  You can choose to invite members and send invitations.

import Foundation
import RTCRoomEngine
import TUICore

class InviteToJoinRoomManager {
    class func startInviteToJoinRoom(message: RoomMessageModel, inviter: TUILoginUserInfo) {
        let inviteJoinModel = InviteJoinModel(message: message, inviter: inviter)
        pushSelectGroupMemberViewController(groupId: message.groupId) { responseData in
            guard let modelList =
                    responseData[TUICore_TUIContactObjectFactory_SelectGroupMemberVC_ResultUserList] as? [TUIUserModel]
            else { return }
            var invitedList: [String] = []
            for userModel in modelList {
                invitedList.append(userModel.userId)
            }
            inviteToJoinRoom(inviteJoinModel: inviteJoinModel, invitedList: invitedList)
        }
    }
    
    class func pushSelectGroupMemberViewController(groupId: String, callback: @escaping TUIValueResultCallback) {
        let param = [TUICore_TUIContactObjectFactory_SelectGroupMemberVC_GroupID: groupId]
        if let navigateController = RoomMessageManager.shared.navigateController {
            navigateController.push(TUICore_TUIContactObjectFactory_SelectGroupMemberVC_Classic, param: param) { responseData in
                callback(responseData)
            }
        } else {
            let nav = UINavigationController()
            let currentViewController = getCurrentWindowViewController()
            currentViewController?.present(TUICore_TUIContactObjectFactory_SelectGroupMemberVC_Classic,
                                           param: param, embbedIn: nav,
                                           forResult: { responseData in
                callback(responseData)
            })
        }
    }
    
    class func inviteToJoinRoom(inviteJoinModel: InviteJoinModel, invitedList: [String]) {
        guard invitedList.count > 0 else { return }
        let dataDict = inviteJoinModel.getDicFromInviteJoinModel(inviteJoinModel: inviteJoinModel)
        guard let dataString = dataDict.convertToString() else { return }
        let pushInfo = V2TIMOfflinePushInfo()
        invitedList.forEach { userId in
            V2TIMManager.sharedInstance().invite(invitee: userId,
                                                 data: dataString,
                                                 onlineUserOnly: true,
                                                 offlinePushInfo: pushInfo,
                                                 timeout: 60) {
                debugPrint("invite,success")
            } fail: { code, message in
                debugPrint("invite,code:\(code),message:\(String(describing: message))")
            }
        }
    }
    
    class private func getCurrentWindowViewController() -> UIViewController? {
        var keyWindow: UIWindow?
        for window in UIApplication.shared.windows {
            if window.isMember(of: UIWindow.self), window.isKeyWindow {
                keyWindow = window
                break
            }
        }
        guard let rootController = keyWindow?.rootViewController else {
            return nil
        }
        func findCurrentController(from vc: UIViewController?) -> UIViewController? {
            if let nav = vc as? UINavigationController {
                return findCurrentController(from: nav.topViewController)
            } else if let tabBar = vc as? UITabBarController {
                return findCurrentController(from: tabBar.selectedViewController)
            } else if let presented = vc?.presentedViewController {
                return findCurrentController(from: presented)
            }
            return vc
        }
        let viewController = findCurrentController(from: rootController)
        return viewController
    }
}
