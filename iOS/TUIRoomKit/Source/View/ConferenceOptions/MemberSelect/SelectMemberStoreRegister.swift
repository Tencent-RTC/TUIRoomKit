//
//  SelectMemberStoreRegister.swift
//  Pods
//
//  Created by janejntang on 2024/12/31.
//

import Foundation
import Factory

extension Container {
    var selectMemberStore: Factory<SelectMemberStore> {
        self { SelectMemberProvider() }.shared
    }
}
