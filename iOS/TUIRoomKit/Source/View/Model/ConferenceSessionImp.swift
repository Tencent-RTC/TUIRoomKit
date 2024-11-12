//
//  ConferenceSessionImp.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/8/13.
//

import Foundation
import RTCRoomEngine
import Factory

class ConferenceSessionImp: NSObject {
    private(set) var isEnableWaterMark = false;
    private(set) var waterMarkText     = "";
    
    private var observers = NSHashTable<ConferenceObserver>.weakObjects()
    
    // MARK: - Public
    override init() {
        super.init()
        subscribeEngine()
    }
    
    func addObserver(observer: ConferenceObserver) {
        guard !observers.contains(observer) else { return }
        observers.add(observer)
    }
    
    func removeObserver(observer: ConferenceObserver) {
        guard observers.contains(observer) else { return }
        observers.remove(observer)
    }
    
    func destroy() {
        unsubscribeEngine()
        observers.removeAllObjects()
    }

    func enableWaterMark() {
        self.isEnableWaterMark = true
    }

    func setWaterMarkText(waterMarkText: String) {
        self.waterMarkText = waterMarkText
    }
    
    func setContactsViewProvider(_ provider: @escaping (ConferenceParticipants) -> ContactViewProtocol) {
        Container.shared.contactViewController.register { participants in
            provider(participants)
        }
    }
    
    deinit {
        unsubscribeEngine()
    }
    
    // MARK: - Private
    private func subscribeEngine() {
        EngineEventCenter.shared.subscribeEngine(event: .onExitedRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onDestroyedRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onStartedRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onJoinedRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRoomDismissed, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onKickedOutOfRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onKickedOffLine, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserSigExpired, observer: self)
    }
    
    private func unsubscribeEngine() {
        EngineEventCenter.shared.unsubscribeEngine(event: .onExitedRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onDestroyedRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onStartedRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onJoinedRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onRoomDismissed, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onKickedOutOfRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onKickedOffLine, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserSigExpired, observer: self)
    }
}

// MARK: - callback
extension ConferenceSessionImp: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        switch name {
            case .onStartedRoom:
                guard let roomInfo = param?["roomInfo"] as? TUIRoomInfo else { return }
                guard let error = param?["error"] as? TUIError else { return }
                guard let message = param?["mesasge"] as? String else { return }
                handleRoomStarted(roomInfo: roomInfo, error: error, message: message)
            case .onJoinedRoom:
                guard let roomInfo = param?["roomInfo"] as? TUIRoomInfo else { return }
                guard let error = param?["error"] as? TUIError else { return }
                guard let message = param?["mesasge"] as? String else { return }
                handleRoomJoined(roomInfo: roomInfo, error: error, message: message)
            case .onDestroyedRoom, .onRoomDismissed:
                handleRoomFinished(param: param)
            case .onExitedRoom, .onKickedOutOfRoom, .onKickedOffLine, .onUserSigExpired:
                handleRoomExited(param: param)
            default: break
        }
    }
    
    
    private func handleRoomStarted(roomInfo: TUIRoomInfo, error: TUIError, message: String) {
        for observer in observers.allObjects {
            observer.onConferenceStarted?(roomInfo: roomInfo, error: error, message: message)
        }
    }
    
    private func handleRoomJoined(roomInfo: TUIRoomInfo, error: TUIError, message: String) {
        for observer in observers.allObjects {
            observer.onConferenceJoined?(roomInfo: roomInfo, error: error, message: message)
        }
    }
    
    private func handleRoomFinished(param: [String : Any]?) {
        guard let roomInfo = param?["roomInfo"] as? TUIRoomInfo else { return }
        guard let reason = param?["reason"] as? ConferenceFinishedReason else { return }
        for observer in observers.allObjects {
            observer.onConferenceFinished?(roomInfo: roomInfo, reason: reason)
        }
    }
    
    private func handleRoomExited(param: [String : Any]?) {
        guard let roomInfo = param?["roomInfo"] as? TUIRoomInfo else { return }
        guard let reason = param?["reason"] as? ConferenceExitedReason else { return }
        for observer in observers.allObjects {
            observer.onConferenceExited?(roomInfo: roomInfo, reason: reason)
        }
    }
}

extension Container {
    var contactViewController: ParameterFactory<ConferenceParticipants, ContactViewProtocol?> {
        promised().scope(.unique)
    }
}
