//
//  ConferenceSession.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/8/9.
//

import Foundation

@objcMembers public class ConferenceSession: NSObject {
    @objc public static let sharedInstance = ConferenceSession()
    private let implementation = ConferenceSessionImp()
    
    @objc public func addObserver(observer: ConferenceObserver) {
        implementation.addObserver(observer: observer)
    }
    
    @objc public func removeObserver(observer: ConferenceObserver) {
        implementation.removeObserver(observer: observer)
    }
    
    @objc public static func destroySharedInstance() {
        sharedInstance.implementation.destroy()
    }
    
    
}
