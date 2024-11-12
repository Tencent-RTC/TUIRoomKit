//
//  TRTCObserver.swift
//  TUIRoomKit
//
//  Created by janejntang on 2024/4/1.
//

import Foundation
#if canImport(TXLiteAVSDK_TRTC)
    import TXLiteAVSDK_TRTC
#elseif canImport(TXLiteAVSDK_Professional)
    import TXLiteAVSDK_Professional
#endif

class TRTCObserver: NSObject, TRTCCloudDelegate {
    func onExitRoom(_ reason: Int) {
        guard reason == 2 else { return }
        let param: [String : Any] = [
            "roomInfo" : EngineManager.shared.store.roomInfo,
            "reason" : ConferenceFinishedReason.finishedByServer
        ]
        EngineEventCenter.shared.notifyEngineEvent(event: .onRoomDismissed, param: param)
    }
    
    func onStatistics(_ statistics: TRTCStatistics) {
        EngineEventCenter.shared.notifyEngineEvent(event: .onStatistics, param: ["statistics": statistics])
    }
}
