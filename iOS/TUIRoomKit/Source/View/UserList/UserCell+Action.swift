//
//  UserCell+Action.swift
//  TRTCScenesDemo
//
//  Created by lijie on 2020/5/7.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import ImSDK_Plus
import Kingfisher
import UIKit

extension UserCell {
    @objc func kickOffButtonClick() {
        kickOffBlock?(attendeeModel, {
        }, { _, _ in

        })
    }

    @objc func muteAudioBtnClick() {
        let mute = attendeeModel.hasAudioStream
        muteAudioBlock?(attendeeModel, mute, { [weak self] in
            guard let self = self else { return }
            if mute {
                self.attendeeModel.hasAudioStream = !mute
            }
        }, { _, _ in

        })
    }

    @objc func muteVideoBtnClick() {
        let mute = attendeeModel.hasVideoStream
        muteVideoBlock?(attendeeModel, mute, { [weak self] in
            guard let self = self else { return }
            if mute {
                self.attendeeModel.hasVideoStream = !mute
            }
        }, { _, _ in

        })
    }
}
