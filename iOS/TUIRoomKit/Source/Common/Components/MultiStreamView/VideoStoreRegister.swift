//
//  VideoStoreRegister.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/11/7.
//

import Foundation
import Factory

extension Container {
    var videoStore: Factory<VideoStore> {
        self { VideoStoreProvider() }.shared
    }
}
