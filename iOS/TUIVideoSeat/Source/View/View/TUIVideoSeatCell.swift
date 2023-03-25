//
//  TUIVideoSeatCell.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import SnapKit
import TUIRoomEngine
import UIKit

class TUIVideoSeatCell: UICollectionViewCell {

    let cameraRenderView: UIView = {
        let view = UIView(frame: .zero)
        view.backgroundColor = UIColor(0x17181F)
        view.layer.cornerRadius = 16
        view.layer.masksToBounds = true
        view.layer.borderWidth = 2
        view.layer.borderColor = UIColor.clear.cgColor
        return view
    }()

    let userInfoView: TUIVideoSeatUserStatusView = {
        let view = TUIVideoSeatUserStatusView()
        return view
    }()
        
    let avatarImageView: UIImageView = {
        let imageView = UIImageView(frame: .zero)
        imageView.layer.cornerRadius = 36
        imageView.layer.masksToBounds = true
        return imageView
    }()
    
    var seatItem: VideoSeatItem? = nil

    override init(frame: CGRect) {
        super.init(frame: frame)
        constructViewHierarchy()
        activateConstraints()
        contentView.backgroundColor = .clear
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func constructViewHierarchy() {
        contentView.addSubview(cameraRenderView)
        contentView.addSubview(avatarImageView)
        contentView.addSubview(userInfoView)
    }
    
    func activateConstraints() {
        cameraRenderView.snp.makeConstraints { make in
            make.edges.equalToSuperview().inset(3)
        }
        avatarImageView.snp.makeConstraints { make in
            make.width.height.equalTo(72)
            make.centerX.centerY.equalToSuperview()
        }
        userInfoView.snp.makeConstraints { make in
            make.bottom.equalToSuperview().offset(-5)
            make.leading.equalToSuperview().offset(20)
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

// MARK: - Public
extension TUIVideoSeatCell {

    func updateUI(item: VideoSeatItem) {
        seatItem = item
        let placeholder = UIImage(named: "tuiroom_default_user", in: tuiVideoSeatBundle(), compatibleWith: nil)
        avatarImageView.sd_setImage(with: URL(string: item.avatarUrl), placeholderImage: placeholder)
        avatarImageView.isHidden = item.hasVideoStream
        userInfoView.updateUserStatus(item)
    }

    func updateUIVolume(item: VideoSeatItem) {
        userInfoView.updateUserVolume(hasAudio: item.hasAudioStream, volume: item.audioVolume)
//        if item.audioVolume > 0 {
//            cameraRenderView.layer.borderColor = UIColor(0xA5FE33).cgColor
//        } else {
//            cameraRenderView.layer.borderColor = UIColor.clear.cgColor
//        }
    }
}
