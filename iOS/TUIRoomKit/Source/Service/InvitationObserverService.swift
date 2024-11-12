//
//  InvitationObserverService.swift
//  TUIRoomKit
//
//  Created by jeremiawang on 2024/8/23.
//

import Foundation
import RTCRoomEngine
import Factory
import TUICore

public class InvitationObserverService: NSObject {
    @objc public static let shared = InvitationObserverService()
    private var invitationWindow: UIWindow?
    private var getInvitationListCursor: String = ""
    private let singleFetchCount: Int = 20
    
    private override init() {
    }
    
    @objc public func show(extString: String) {
        let store = Container.shared.conferenceStore()
        let isEnteredRoom = store.selectCurrent(RoomSelectors.getIsEnteredRoom)
        if isEnteredRoom || invitationWindow != nil {
            return
        }
        guard let dict = extString.convertToDic() else { return }
        guard let roomId = dict["RoomId"] as? String else { return }
        guard let roomName = dict["RoomName"] as? String else { return }
        guard let ownerName = dict["OwnerName"] as? String else { return }
        guard let memberCount = dict["MemberCount"] as? Int else { return }
        var roomInfo = RoomInfo()
        roomInfo.roomId = roomId
        roomInfo.name = roomName
        roomInfo.ownerName = ownerName
        roomInfo.memberCount = memberCount
        self.getInvitationList(roomInfo: roomInfo)
    }
    
    func showInvitationWindow(roomInfo: RoomInfo, invitation: TUIInvitation) {
        DispatchQueue.main.async {
            let invitationViewController = ConferenceInvitationViewController(roomInfo: roomInfo, invitation: invitation)
            self.invitationWindow = UIWindow()
            self.invitationWindow?.windowLevel = .alert + 1
            self.invitationWindow?.rootViewController = invitationViewController
            self.invitationWindow?.isHidden = false
            self.invitationWindow?.t_makeKeyAndVisible()
        }
    }

    func dismissInvitationWindow() {
        DispatchQueue.main.async {
            self.invitationWindow?.isHidden = true
            self.invitationWindow = nil
        }
    }
    
    private func getInvitationList(roomInfo: RoomInfo) {
        let invitationManager = TUIRoomEngine.sharedInstance().getExtension(extensionType: .conferenceInvitationManager) as? TUIConferenceInvitationManager
        let selfUserId = TUILogin.getUserID()
        invitationManager?.getInvitationList(roomInfo.roomId, cursor: getInvitationListCursor, count: singleFetchCount) { [weak self] invitations, cursor in
            for invitation in invitations {
                if invitation.invitee.userId != selfUserId {
                    continue
                }
                if invitation.status == .pending {
                    self?.showInvitationWindow(roomInfo: roomInfo, invitation: invitation)
                    return
                }
            }
            self?.getInvitationListCursor = cursor
            if !cursor.isEmpty {
                self?.getInvitationList(roomInfo: roomInfo)
            }
        } onError: { error, message in
        }
    }
}

extension InvitationObserverService: TUIConferenceInvitationObserver {
    public func onReceiveInvitation(roomInfo: TUIRoomInfo, invitation: TUIInvitation, extensionInfo: String) {
        let store = Container.shared.conferenceStore()
        store.dispatch(action: ConferenceInvitationActions.onReceiveInvitation(payload: (roomInfo, invitation)))
    }

    public func onInvitationHandledByOtherDevice(roomInfo: TUIRoomInfo, accepted: Bool) {
    }

    public func onInvitationCancelled(roomInfo: TUIRoomInfo, invitation: TUIInvitation) {
    }

    public func onInvitationAccepted(roomInfo: TUIRoomInfo, invitation: TUIInvitation) {
    }

    public func onInvitationRejected(roomInfo: TUIRoomInfo, invitation: TUIInvitation, reason: TUIInvitationRejectedReason) {
    }

    public func onInvitationTimeout(roomInfo: TUIRoomInfo, invitation: TUIInvitation) {
    }

    public func onInvitationRevokedByAdmin(roomInfo: TUIRoomInfo, invitation: TUIInvitation, admin: TUIUserInfo) {
    }

    public func onInvitationAdded(roomId: String, invitation: TUIInvitation) {
    }

    public func onInvitationRemoved(roomId: String, invitation: TUIInvitation) {
    }

    public func onInvitationStatusChanged(roomId: String, invitation: TUIInvitation) {
    }
}

extension UIWindow {
    public func t_makeKeyAndVisible() {
        if #available(iOS 13.0, *) {
            for windowScene in UIApplication.shared.connectedScenes {
                if windowScene.activationState == UIScene.ActivationState.foregroundActive ||
                    windowScene.activationState == UIScene.ActivationState.background {
                    self.windowScene = windowScene as? UIWindowScene
                    break
                }
            }
        }
        self.makeKeyAndVisible()
    }
}
