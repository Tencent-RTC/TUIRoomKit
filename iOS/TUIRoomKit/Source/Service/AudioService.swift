//
//  AudioService.swift
//  Pods
//
//  Created by janejntang on 2024/12/26.
//

import RTCRoomEngine
import Combine

class AudioService {
    private let engine = TUIRoomEngine.sharedInstance()
    private let engineManeger = EngineManager.shared //TODO: replace later
    
    func muteLocalAudio() {
        engine.muteLocalAudio()
    }
    
    func unmuteLocalAudio() -> AnyPublisher<Void, RoomError> {
             return Future<Void, RoomError> { [weak self] promise in
                 guard let self = self else { return }
                 engine.unmuteLocalAudio {
                     promise(.success(()))
                 } onError: { err, message in
                     let error = RoomError(error: err, message: message, showToast: false)
                     promise(.failure(error))
                 }
             }
             .eraseToAnyPublisher()
         }
    
    func openLocalMicrophone() -> AnyPublisher<Void, RoomError> {
        return Future<Void, RoomError> { [weak self] promise in
            guard let self = self else { return }
            engineManeger.openLocalMicrophone {
                promise(.success(()))
            } onError: { err, message in
                let error = RoomError(error: err, message: message, showToast: false)
                promise(.failure(error))
            }
        }
        .eraseToAnyPublisher()
    }
}
