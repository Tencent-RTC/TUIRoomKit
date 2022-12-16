//
//  VideoModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2022/10/27.
//

import Foundation
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class VideoModel {
    var frameText: String = "15"
    var frameIndex: Int = 0
    var bitrate: TUIRoomBitrateTable = TUIRoomBitrateTable(resolutionName: "540 * 960",
                                                           resolution: TRTCVideoResolution._960_540.rawValue,
                                                           defaultBitrate: 900,
                                                           minBitrate: 400,
                                                           maxBitrate: 1_600,
                                                           stepBitrate: 50)
    var bitrateIndex: Int = 0
    var isMirror: Bool = true
}
