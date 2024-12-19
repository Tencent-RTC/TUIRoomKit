//
//  InvitationObserverEffects.swift
//  Pods
//
//  Created by janejntang on 2024/11/21.
//
import Combine

class InvitationObserverEffects: Effects {
    typealias Environment = ServiceCenter
    
    let playCallingBellAndVibration = Effect<Environment>.nonDispatching { actions, environment in
        actions
            .wasCreated(from: InvitationObserverActions.playCallingBellAndVibration)
            .sink { action in
                InvitationObserverService.shared.playCallingBellAndVibration()
            }
    }
    
    let stopCallingBellAndVibration = Effect<Environment>.nonDispatching { actions, environment in
        actions
            .wasCreated(from: InvitationObserverActions.stopCallingBellAndVibration)
            .sink { action in
                InvitationObserverService.shared.stopCallingBellAndVibration()
            }
    }
}
    
