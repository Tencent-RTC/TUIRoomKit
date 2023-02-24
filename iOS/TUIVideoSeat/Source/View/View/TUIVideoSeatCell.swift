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
    var viewModel: TUIVideoSeatViewModel?
    var attendeeModel: UserModel?
    let userInfoView: UIView = {
        let view = UIView()
        view.backgroundColor = UIColor(0x121723, alpha: 0.8)
        return view
    }()
    
    let homeownersImageView: UIImageView = {
        let imageView = UIImageView(image: UIImage(named: "tuiroom_homeowners_icon", in: tuiVideoSeatBundle(), compatibleWith: nil))
        return imageView
    }()
    
    let userLabel: UILabel = {
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
    
    let avatarImageView: UIImageView = {
        let imageView = UIImageView()
        return imageView
    }()
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        UIEventCenter.shared.subscribeUIEvent(key: .UserVideoStateChanged, responder: self)
        UIEventCenter.shared.subscribeUIEvent(key: .UserVoiceVolumeChanged, responder: self)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    override func draw(_ rect: CGRect) {
        super.draw(rect)
//        self.roundedRect(rect: bounds, byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight], cornerRadii:
//                            CGSize(width: 12, height: 12))
        userInfoView.roundedRect(rect: userInfoView.bounds, byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                                 cornerRadii: CGSize(width: userInfoView.frame.width, height: userInfoView.frame.height))
        homeownersImageView.roundedRect(rect: homeownersImageView.bounds, byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                                        cornerRadii: CGSize(width: homeownersImageView.frame.width, height: homeownersImageView.frame.height))
        avatarImageView.roundedCircle(rect: avatarImageView.bounds)
    }
    
    func constructViewHierarchy() {
        addSubview(avatarImageView)
        addSubview(userInfoView)
        userInfoView.addSubview(homeownersImageView)
        userInfoView.addSubview(voiceVolumeImageView)
        userInfoView.addSubview(userLabel)
    }
    
    func activateConstraints() {
        avatarImageView.snp.makeConstraints { make in
            make.width.height.equalTo(72)
            make.centerX.centerY.equalToSuperview()
        }
        userInfoView.snp.makeConstraints { make in
            make.bottom.equalToSuperview().offset(-5)
            make.height.equalTo(24)
            make.left.equalToSuperview().offset(20)
            make.width.equalTo(140)
        }
        homeownersImageView.snp.makeConstraints { make in
            make.left.equalToSuperview()
            make.height.width.equalTo(24)
            make.centerY.equalToSuperview()
        }
        voiceVolumeImageView.snp.makeConstraints { make in
            make.left.equalTo(homeownersImageView.snp.right).offset(5)
            make.width.height.equalTo(14)
            make.centerY.equalToSuperview()
        }
        userLabel.snp.makeConstraints { make in
            make.left.equalTo(voiceVolumeImageView.snp.right).offset(5)
            make.centerY.equalToSuperview()
        }
    }
    
    func bindInteraction() {
        guard let attendeeModel = attendeeModel else { return }
        setupViewState(item: attendeeModel)
    }
    
    func setupViewState(item: UserModel) {
        let placeholder = UIImage(named: "tuiroom_default_user", in: tuiVideoSeatBundle(), compatibleWith: nil)
        avatarImageView.sd_setImage(with: URL(string: item.avatarUrl), placeholderImage: placeholder)
        userLabel.text = item.userName
        updateUIView(item: item)
    }
    
    func updateUIView(item: UserModel) {
        if item.hasVideoStream {
            avatarImageView.isHidden = true
        } else {
            avatarImageView.isHidden = false
        }
        if viewModel?.currentUser.userId == item.userId {
            homeownersImageView.isHidden = false
        } else {
            homeownersImageView.isHidden = true
        }
        if attendeeModel?.userId == viewModel?.currentUser.userId  && viewModel?.attendeeList.count == 1 {
            userInfoView.isHidden = true
        } else {
            userInfoView.isHidden = false
        }
        voiceVolumeImageView.image = getVoiceVolumeImageView(voiceVolume: item.audioVolume)
    }
    
    func getVoiceVolumeImageView(voiceVolume: Int) -> UIImage? {
        var image = voiceVolume <= 0 ? UIImage(named: "tuiroom_voice_volume1", in: tuiVideoSeatBundle(), compatibleWith: nil) :
        UIImage(named: "tuiroom_voice_volume2", in: tuiVideoSeatBundle(), compatibleWith: nil)
        return image
    }
    
    deinit {
        UIEventCenter.shared.unsubscribeUIEvent(key: .TUIVideoSeatService, responder: self)
        UIEventCenter.shared.unsubscribeUIEvent(key: .TUIVideoSeatService, responder: self)
        debugPrint("deinit \(self)")
    }
}

extension TUIVideoSeatCell: RoomKitUIEventResponder {
    func onNotifyUIEvent(key: UIEventCenter.TUIVideoSeatUIEvent, Object: Any?, info: [AnyHashable : Any]?) {
        if key == .UserVoiceVolumeChanged {
            guard let userId = info?["userId"] as? String else { return }
            guard let audioVolume = info?["audioVolume"] as? Int else { return }
            guard let attendeeModel = attendeeModel else { return }
            guard userId == attendeeModel.userId else { return }
            attendeeModel.audioVolume = audioVolume
            updateUIView(item: attendeeModel)
        }
        if key == .UserVideoStateChanged {
            guard let userId = info?["userId"] as? String else { return }
            guard let hasVideo = info?["hasVideo"] as? Bool else { return }
            guard let attendeeModel = attendeeModel else { return }
            guard userId == attendeeModel.userId else { return }
            attendeeModel.hasVideoStream = hasVideo
            updateUIView(item: attendeeModel)
        }
    }
}
