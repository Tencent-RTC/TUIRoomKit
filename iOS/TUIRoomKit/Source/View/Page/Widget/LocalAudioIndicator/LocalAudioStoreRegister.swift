//
//  LocalAudioStoreRegister.swift
//  Pods
//
//  Created by janejntang on 2024/12/26.
//

import Foundation
import Factory

extension Container {
    var localAudioStore: Factory<LocalAudioStore> {
        self { LocalAudioProvider() }.shared
    }
}
