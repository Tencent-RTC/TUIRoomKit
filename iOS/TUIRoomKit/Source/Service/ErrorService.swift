//
//  ErrorService.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/6/13.
//

import Foundation
import RTCRoomEngine

struct RoomError: Error {
    let error: TUIError
    let message: String
    var actions: [Action] = []
    
    init(error: TUIError, message: String = "", showToast: Bool = true) {
        self.error = error
        self.message = message
        if showToast {
            actions.append(ViewActions.showToast(payload: ToastInfo(message: message)))
        }
    }
}

protocol LocalizedError {
    var description: String?{get}
    var isCommon: Bool{get}
}

extension TUIError: LocalizedError {
    var description: String? {
        switch self {
        case .roomIdNotExist:
            return .roomIdNotExist
        case .roomIdOccupied:
            return .roomIdOccupied
        case .roomUserFull:
            return .roomUserFull
        case .roomNameInvalid:
            return .roomNameInvalid
        case .roomIdInvalid:
            return .roomIdInvalid
        case .operationInvalidBeforeEnterRoom:
            return .operationInvalidBeforeEnterRoom
        case .operationNotSupportedInCurrentRoomType:
            return .operationNotSupportedInCurrentRoomType
        case .alreadyInOtherRoom:
            return .alreadyInOtherRoom
        default:
            return nil
        }
    }
    
    var isCommon: Bool {
        switch self {
        case .roomIdNotExist, .roomIdOccupied, .roomUserFull:
            return true
        default:
            return false
        }
    }
}

private extension String {
    static let roomIdNotExist = localized("The room does not exist, please confirm the room ID or create a room!")
    static let operationInvalidBeforeEnterRoom = localized("You need to enter the room to use this function.")
    static let operationNotSupportedInCurrentRoomType = localized("This operation is not supported in the current room type.")
    static let roomIdInvalid = localized("The room number is invalid. It must be printable ASCII characters and cannot exceed 48 bytes.")
    static let roomIdOccupied = localized("The room ID is occupied, please select another room ID.")
    static let roomNameInvalid = localized("The room name is invalid. It cannot exceed 30 bytes. If it contains Chinese characters, the character encoding must be UTF-8.")
    static let alreadyInOtherRoom = localized("You are already in another room and need to leave the room before joining a new room.")
    static let roomUserFull = localized("The room is full and you cannot enter the room temporarily.")
}



