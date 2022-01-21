//
//  TUIRoomSetViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import UIKit

final class TUIRoomSetViewController: TUIRoomSetBaseViewController {
    var audioModel: TUIRoomSetAudioModel = TUIRoomSetAudioModel()
    var videoModel: TUIRoomSetVideoModel = TUIRoomSetVideoModel()
    var isSomeoneSharing: Bool = false
    var volumePromptCallback: ((Bool) -> Void)?

    let screenHeight = UIScreen.main.bounds.size.height
    let screenWidth = UIScreen.main.bounds.size.width

    // 当前选中分页的视图下标
    var selectIndex = 0

    lazy var segView: TUIRoomSetSegmentView = {
        let nameArray: [String] = [.videoText, .audioText, .shareText]
        let vcVideo = TUIRoomSetVideoVC()
        let vcAudio = TUIRoomSetAudioVC()
        vcVideo.videoModel = videoModel
        vcAudio.audioModel = audioModel
        vcAudio.volumePromptCallback = { [weak self] isOn in
            guard let `self` = self else { return }
            if let volumePromptCallback = self.volumePromptCallback {
                volumePromptCallback(isOn)
            }
        }

        let vcShare = TUIRoomSetShareScreenVC()
        vcShare.isSomeoneSharing = isSomeoneSharing
        let controllers = [vcVideo, vcAudio, vcShare]

        let view = TUIRoomSetSegmentView(frame:
                                            CGRect(x: 0,
                                                   y: 16,
                                                   width: self.view.bounds.size.width,
                                                   height: self.view.bounds.size.height),
                                         controllers: controllers,
                                         titleArray: nameArray,
                                         selectIndex: self.selectIndex,
                                         lineHeight: 4)

        view.lineSelectedColor = UIColor(hex: "006EFF") ?? .blue
        view.titleSelectColor = UIColor(hex: "006EFF") ?? .blue
        view.lineHeight = 4

        return view
    }()

    override var controllerHeight: CGFloat {
        return screenHeight / 2.0 - 50
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.layer.masksToBounds = true
        view.layer.cornerRadius = 10
        view.backgroundColor = .white
        view.addSubview(segView)
    }

    deinit {
        debugPrint("deinit \(self)")
    }
}

// MARK: - internationalization string

fileprivate extension String {
    static let videoText = tuiRoomLocalize("TUIRoom.video")
    static let audioText = tuiRoomLocalize("TUIRoom.audio")
    static let shareText = tuiRoomLocalize("TUIRoom.share")
    static let settingText = tuiRoomLocalize("TUIRooms.setting")
}
