//
//  TUIVideoSeatUserStatusView.swift
//  TUIVideoSeat
//
//  Created by jack on 2023/3/6.
//  Copyright © 2023 Tencent. All rights reserved.

import Foundation

class TUIVideoSeatUserStatusView: UIView {
    
    let homeOwnerImageView: UIImageView = {
        let imageView = UIImageView(image: UIImage(named: "tuiroom_homeowners_icon", in: tuiVideoSeatBundle(), compatibleWith: nil))
        imageView.layer.cornerRadius = 12
        imageView.layer.masksToBounds = true
        return imageView
    }()
    
    let userNameLabel: UILabel = {
        let user = UILabel()
        user.textColor = .white
        user.backgroundColor = UIColor.clear
        user.textAlignment = .center
        user.numberOfLines = 1
        return user
    }()
    
    let voiceVolumeImageView: UIImageView = {
        let imageView = UIImageView()
        return imageView
    }()
    
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        isViewReady = true
        backgroundColor = UIColor(0x121723, alpha: 0.8)
        layer.cornerRadius = 12
        layer.masksToBounds = true
    }
    
    private func constructViewHierarchy() {
        addSubview(homeOwnerImageView)
        addSubview(voiceVolumeImageView)
        addSubview(userNameLabel)
    }
    
    private func activateConstraints() {
        homeOwnerImageView.snp.makeConstraints { make in
            make.leading.equalToSuperview()
            make.height.equalTo(24)
            make.width.equalTo(24)
            make.top.bottom.equalToSuperview()
        }
        voiceVolumeImageView.snp.makeConstraints { make in
            make.leading.equalTo(homeOwnerImageView.snp.trailing).offset(5)
            make.width.height.equalTo(14)
            make.centerY.equalToSuperview()
        }
        userNameLabel.snp.makeConstraints { make in
            make.leading.equalTo(voiceVolumeImageView.snp.trailing).offset(5)
            make.centerY.equalToSuperview()
            make.width.lessThanOrEqualTo(80)
            make.trailing.equalTo(-8)
        }
    }
}

// MARK: - Public
extension TUIVideoSeatUserStatusView {
    
    func updateUserStatus(_ item: VideoSeatItem) {
        if !item.userName.isEmpty {
            userNameLabel.text = item.userName
        } else {
            userNameLabel.text = item.userId
        }
        homeOwnerImageView.isHidden = !item.isRoomOwner
        let width = item.isRoomOwner ? 24:0
        homeOwnerImageView.snp.updateConstraints { make in
            make.width.equalTo(width)
        }
        updateUserVolume(hasAudio: item.hasAudioStream, volume: item.audioVolume)
        layoutIfNeeded()
    }
    
    func updateUserVolume(hasAudio:Bool, volume: Int) {
        if hasAudio {
            let volumeImageName = volume <= 0 ? "tuiroom_voice_volume1":"tuiroom_voice_volume2"
            voiceVolumeImageView.image = UIImage(named: volumeImageName, in: tuiVideoSeatBundle(), compatibleWith: nil)
        } else {
            voiceVolumeImageView.image = UIImage(named: "tuiroom_audio_none", in: tuiVideoSeatBundle(), compatibleWith: nil)
        }
    }
}
