//
//  Untitled.swift
//  Pods
//
//  Created by janejntang on 2024/11/21.
//

enum InvitationObserverActions {
    static let key = "action.invitationObserver"
    
    static let playCallingBellAndVibration = ActionTemplate(id: key.appending(".playCallingBellAndVibration"))
    
    static let stopCallingBellAndVibration = ActionTemplate(id: key.appending(".stopCallingBellAndVibration"))
}
