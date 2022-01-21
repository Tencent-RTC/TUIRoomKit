//
//  TUIRoomMemberCell+Action.swift
//  TRTCScenesDemo
//
//  Created by lijie on 2020/5/7.
//  Copyright © 2020 xcoderliu. All rights reserved.
//

import Foundation
import ImSDK_Plus
import Kingfisher
import UIKit

extension TUIRoomMemberCell {
    @objc func kickOffButtonClick() {
        kickOffBlock?(attendeeModel.userInfo, { _, _ in

        })
    }

    @objc func muteAudioBtnClick() {
        let mute = attendeeModel.isAudioOpen()
        let userInfo = attendeeModel.userInfo
        muteAudioBlock?(attendeeModel.userInfo, mute, { code, _ in
            if code == 0 {
                userInfo.isAudioAvailable = mute
                userInfo.isRemoteAudioMuted = mute
            }
        })
    }

    @objc func muteVideoBtnClick() {
        let mute = attendeeModel.userInfo.isVideoOpen()
        let userInfo = attendeeModel.userInfo
        muteVideoBlock?(attendeeModel.userInfo, mute, { code, _ in
            if code == 0 {
                userInfo.isRemoteVideoMuted = mute
            }
        })
    }
}
