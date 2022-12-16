//
//  TUIExtension.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2022/9/23.
//

import Foundation
import TUICore

extension NSObject {
    @objc class func tuiVideoSeatSwiftLoad() {
        TUICore.registerExtension(gVideoSeatViewKey, object: TUIVideoSeat.shared)
    }
}
