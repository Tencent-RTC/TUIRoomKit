//
//  TUIVideoSeatShareCell.swift
//  TUIVideoSeat
//
//  Created by 唐佳宁 on 2023/2/22.
//

import SnapKit
import TUIRoomEngine
import UIKit

class TUIVideoSeatShareCell: UICollectionViewCell {

    let userInfoView: TUIVideoSeatUserStatusView = {
        let view = TUIVideoSeatUserStatusView()
        return view
    }()

    let avatarImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.layer.cornerRadius = 36
        imageView.layer.masksToBounds = true
        return imageView
    }()
    
    let screenShareRenderView: UIView = {
        let view = UIView()
        view.backgroundColor = UIColor(0x17181F)
        return view
    }()
    
    let cameraRenderView: UIView = {
        let view = UIView(frame: .zero)
        view.backgroundColor = UIColor(0x17181F)
        view.layer.cornerRadius = 16
        view.layer.masksToBounds = true
        view.layer.borderWidth = 2
        view.layer.borderColor = UIColor.clear.cgColor
        return view
    }()
    
    var seatItem: VideoSeatItem? = nil

    override init(frame: CGRect) {
        super.init(frame: frame)
        constructViewHierarchy()
        activateConstraints()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func constructViewHierarchy() {
        contentView.addSubview(screenShareRenderView)
        contentView.addSubview(cameraRenderView)
        cameraRenderView.addSubview(avatarImageView)
        cameraRenderView.addSubview(userInfoView)
    }
    
    func activateConstraints() {
        screenShareRenderView.snp.makeConstraints { make in
            make.edges.equalToSuperview().inset(3)
        }
        cameraRenderView.snp.makeConstraints { make in
            make.trailing.equalToSuperview().offset(-9)
            make.top.equalToSuperview().offset(9 + kDeviceSafeTopHeight)
            make.width.equalTo(100)
            make.height.equalTo(192)
        }
        avatarImageView.snp.makeConstraints { make in
            make.width.height.equalTo(72)
            make.centerX.centerY.equalToSuperview()
        }
        userInfoView.snp.makeConstraints { make in
            make.bottom.equalToSuperview()
            make.height.equalTo(24)
            make.leading.equalToSuperview()
            make.trailing.lessThanOrEqualToSuperview()
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

// MARK: - Public
extension TUIVideoSeatShareCell {

    func updateUI(item: VideoSeatItem) {
        seatItem = item
        let placeholder = UIImage(named: "tuiroom_default_user", in: tuiVideoSeatBundle(), compatibleWith: nil)
        avatarImageView.sd_setImage(with: URL(string: item.avatarUrl), placeholderImage: placeholder)
        avatarImageView.isHidden = item.hasVideoStream
        userInfoView.updateUserStatus(item)
    }

    func updateUIVolume(item: VideoSeatItem) {
        userInfoView.updateUserVolume(hasAudio: item.hasAudioStream, volume: item.audioVolume)
        if item.audioVolume > 0 {
            cameraRenderView.layer.borderColor = UIColor(0xA5FE33).cgColor
        } else {
            cameraRenderView.layer.borderColor = UIColor.clear.cgColor
        }
    }
}
