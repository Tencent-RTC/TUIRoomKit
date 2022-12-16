//
//  ExtensionViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import TUIRoomEngine
import UIKit

public class ExtensionViewController: ExtensionBaseViewController {
    var audioModel: AudioModel
    var videoModel: VideoModel
    var isSomeoneSharing: Bool = false
    var volumePromptCallback: ((Bool) -> Void)?

    let screenHeight = UIScreen.main.bounds.size.height
    let screenWidth = UIScreen.main.bounds.size.width

    var selectIndex = 0
    var roomPresenter: RoomPresenter
    var segView: UIView?

    init(roomPresenter: RoomPresenter) {
        self.roomPresenter = roomPresenter
        audioModel = AudioModel()
        videoModel = VideoModel()
        super.init(nibName: nil, bundle: nil)
        setUpView()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override public var controllerHeight: CGFloat {
        return screenHeight / 2.0 - 50
    }
    

    override public func viewDidLoad() {
        super.viewDidLoad()
        view.layer.masksToBounds = true
        view.layer.cornerRadius = 10
        view.backgroundColor = .white
        constructViewHierarchy()
        activateConstraints()
        
    }
    
    func constructViewHierarchy() {
        if let segView = segView {
            view.addSubview(segView)
        }
    }
    
    func activateConstraints() {
        segView?.snp.makeConstraints { make in
            make.width.equalTo(view)
            make.height.equalTo(view)
        }
    }
    
    func setUpView() {
        let nameArray: [String] = [.videoText, .audioText, .shareText]
        let vcVideo = ExtensionVideoController(roomPresenter: roomPresenter, videoModel: videoModel)
        let vcAudio = ExtensionAudioController(roomPresenter: roomPresenter, audioModel: audioModel)
        vcAudio.volumePromptCallback = { [weak self] isOn in
            guard let `self` = self else { return }
            if let volumePromptCallback = self.volumePromptCallback {
                volumePromptCallback(isOn)
            }
        }
        
        let vcShare = ExtensionShareScreenController(roomPresenter: roomPresenter)
        vcShare.isSomeoneSharing = isSomeoneSharing
        let controllers = [vcVideo, vcAudio, vcShare]
        
        let view = ExtensionSegmentView(frame:
            CGRect(x: 0,
                   y: 16,
                   width: UIScreen.main.bounds.width,
                   height: UIScreen.main.bounds.height),
            controllers: controllers,
            titleArray: nameArray,
            selectIndex: self.selectIndex,
            lineHeight: 4)

        view.lineSelectedColor = UIColor(hex: "006EFF") ?? .blue
        view.titleSelectColor = UIColor(hex: "006EFF") ?? .blue
        view.lineHeight = 4
        segView = view
    }

    deinit {
        debugPrint("deinit \(self)")
    }
}

// MARK: - internationalization string

fileprivate extension String {
    static let videoText = tuiRoomKitLocalize("TUIRoom.video")
    static let audioText = tuiRoomKitLocalize("TUIRoom.audio")
    static let shareText = tuiRoomKitLocalize("TUIRoom.share")
}
