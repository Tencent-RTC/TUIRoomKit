//
//  TRTCObserver.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2024/4/1.
//

import Foundation
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class TRTCObserver: NSObject, TRTCCloudDelegate {
    var roomId: String {
        EngineManager.createInstance().store.roomInfo.roomId
    }
    func onExitRoom(_ reason: Int) {
        guard reason == 2 else { return }
        EngineEventCenter.shared.notifyEngineEvent(event: .onRoomDismissed, param: ["roomId": roomId])
    }
}
