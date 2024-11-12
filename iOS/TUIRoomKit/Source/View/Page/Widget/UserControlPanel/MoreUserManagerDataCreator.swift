//
//  MoreUserManagerDataCreator.swift
//  TUIRoomKit
//
//  Created by janejntang on 2024/10/15.
//

import Foundation

class MoreUserManagerDataCreator {
    class func generateMoreUserManagerItems(operation: ConferenceStore) -> [ButtonItemData] {
        return [MoreUserManagerDataCreator.getmMuteAllUsersShareScreenItem(operation: operation)]
    }
    
    class func getmMuteAllUsersShareScreenItem(operation: ConferenceStore) -> ButtonItemData {
        let item = ButtonItemData()
        item.normalIcon = "room_mute_share_screen"
        item.normalTitle = .onlyHostOrAdminCanShareScreen
        item.selectedIcon = "room_unmute_share_screen"
        item.selectedTitle = .allParticipantsCanShareScreen
        item.resourceBundle = tuiRoomKitBundle()
        item.hasLineView = true
        item.action = { sender in
            let getIsScreenShareDisableForAllUser = operation.selectCurrent(RoomSelectors.getIsScreenShareDisableForAllUser)
            MoreUserManagerDataCreator.muteAllShareScreen(isMute: !getIsScreenShareDisableForAllUser, operation: operation)
        }
        item.bindStateClosure = { button, cancellableSet in
            operation.select(RoomSelectors.getIsScreenShareDisableForAllUser)
                .receive(on: RunLoop.main)
                .sink { [weak button] isScreenShareDisableForAllUser in
                    guard let button = button else { return }
                    button.updateSelectState(isScreenShareDisableForAllUser)
                }
                .store(in: &cancellableSet)
        }
        return item
    }
    
    class func muteAllShareScreen(isMute: Bool, operation: ConferenceStore) {
        if isMute, isGeneralUserSharingScreen(operation: operation) {
            RoomRouter.presentAlert(title: .muteAllShareScreenAlertTitle, message: .muteAllShareScreenAlertMessage, sureTitle: .open, declineTitle: .cancel, sureBlock: {
                EngineManager.shared.muteAllShareScreenAction(isMute: true)
            }, declineBlock: nil)
        } else {
            EngineManager.shared.muteAllShareScreenAction(isMute: isMute)
        }
    }
    
    class func isGeneralUserSharingScreen(operation: ConferenceStore) -> Bool {
        let hasScreenStreamUsers = operation.selectCurrent(UserSelectors.getHasScreenStreamUsers)
        let allUsers = EngineManager.shared.store.attendeeList
        let hasScreenStreamUserItems = allUsers.filter({ hasScreenStreamUsers.contains($0.userId) })
        return hasScreenStreamUserItems.contains(where: { $0.userRole == .generalUser })
    }
}

private extension String {
    static let onlyHostOrAdminCanShareScreen = localized("Only the host/admin can share screen")
    static let allParticipantsCanShareScreen = localized("All participants can share screen")
    static let cancel = localized("Cancel")
    static let open = localized("Open")
    static let muteAllShareScreenAlertTitle = localized("Is it turned on that only the host/admin can share the screen?")
    static let muteAllShareScreenAlertMessage = localized("A member is currently sharing the screen, the member's sharing will be terminated after turning on")
}
