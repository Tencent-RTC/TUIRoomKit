//
//  RoomUserStatusView.swift
//  TUIRoomKit
//
//  Created by janejntang on 2023/7/24.
//

import Foundation

class RoomUserStatusView: UIView {
    private var isShownUserRoleFlag = false
    private var isViewReady: Bool = false
    private var isShownMuteFlag = true
    private let homeOwnerImageView: UIImageView = {
        let imageView = UIImageView(image: UIImage(named: "room_homeowner", in: tuiRoomKitBundle(), compatibleWith: nil))
        imageView.layer.cornerRadius = 12
        imageView.layer.masksToBounds = true
        return imageView
    }()

    private let userNameLabel: UILabel = {
        let user = UILabel()
        user.textColor = .white
        user.backgroundColor = UIColor.clear
        user.textAlignment = isRTL ? .right : .left
        user.numberOfLines = 1
        user.font = UIFont(name: "PingFangSC-Regular", size: 12)
        return user
    }()

    private let voiceVolumeImageView: UIImageView = {
        let imageView = UIImageView()
        return imageView
    }()
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        isViewReady = true
        constructViewHierarchy()
        activateConstraints()
        backgroundColor = UIColor(0x22262E, alpha: 0.8)
        layer.cornerRadius = 12
        layer.masksToBounds = true
    }

    private func constructViewHierarchy() {
        addSubview(homeOwnerImageView)
        addSubview(voiceVolumeImageView)
        addSubview(userNameLabel)
    }

    private func activateConstraints() {
        updateViewConstraints()
        userNameLabel.snp.makeConstraints { make in
            make.leading.equalTo(voiceVolumeImageView.snp.trailing).offset(5)
            make.centerY.equalToSuperview()
            make.trailing.equalToSuperview().offset(-8)
        }
        voiceVolumeImageView.snp.makeConstraints { make in
            make.leading.equalTo(homeOwnerImageView.snp.trailing).offset(6.scale375())
            make.width.height.equalTo(14)
            make.centerY.equalToSuperview()
        }
    }
    
    private func updateViewConstraints() {
        guard homeOwnerImageView.superview != nil else { return }
        homeOwnerImageView.snp.remakeConstraints { make in
            make.leading.equalToSuperview()
            make.height.equalTo(24)
            make.top.bottom.equalToSuperview()
            make.width.equalTo(isShownUserRoleFlag ? 24 : 0)
        }
    }
}

extension RoomUserStatusView {
    func updateUserStatus(userModel: UserEntity) {
        if !userModel.userName.isEmpty {
            userNameLabel.text = userModel.userName
        } else {
            userNameLabel.text = userModel.userId
        }
        if userModel.userRole == .roomOwner {
            homeOwnerImageView.image = UIImage(named: "room_homeowner", in: tuiRoomKitBundle(), compatibleWith: nil)
        } else if userModel.userRole == .administrator {
            homeOwnerImageView.image = UIImage(named: "room_administrator", in: tuiRoomKitBundle(), compatibleWith: nil)
        }
        isShownUserRoleFlag = userModel.userRole != .generalUser
        updateViewConstraints()
        updateUserAudio(userModel.hasAudioStream)
        updateUserVolume(volume: userModel.userVoiceVolume)
    }
    
    func updateUserAudio(_ hasAudio: Bool) {
        let volumeImageName = hasAudio ? "room_voice_volume1" : "room_mute_audio"
        voiceVolumeImageView.image = UIImage(named: volumeImageName, in: tuiRoomKitBundle(), compatibleWith: nil)?.checkOverturn()
        isShownMuteFlag = !hasAudio
    }

    func updateUserVolume(volume: Int) {
        guard !isShownMuteFlag else { return }
        let volumeImageName = volume <= 0 ? "room_voice_volume1" : "room_voice_volume2"
        voiceVolumeImageView.image = UIImage(named: volumeImageName, in: tuiRoomKitBundle(), compatibleWith: nil)
    }
}
