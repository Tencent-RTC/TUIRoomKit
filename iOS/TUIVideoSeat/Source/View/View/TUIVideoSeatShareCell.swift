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
    
    let currentView: UIView = {
        let view = UIView()
        return view
    }()
    
    let shareView: UIView = {
        let view = UIView()
        return view
    }()
    
    override init(frame: CGRect) {
        super.init(frame: frame)
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
        shareView.roundedRect(rect: shareView.bounds, byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight], cornerRadii:
                            CGSize(width: 12, height: 12))
        currentView.roundedRect(rect: currentView.bounds, byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                                 cornerRadii: CGSize(width: 12, height: 12))
        userInfoView.roundedRect(rect: userInfoView.bounds, byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                                 cornerRadii: CGSize(width: userInfoView.frame.width, height: userInfoView.frame.height))
        homeownersImageView.roundedRect(rect: homeownersImageView.bounds, byRoundingCorners: [.topLeft, .topRight, .bottomLeft, .bottomRight],
                                        cornerRadii: CGSize(width: homeownersImageView.frame.width, height: homeownersImageView.frame.height))
        avatarImageView.roundedCircle(rect: avatarImageView.bounds)
    }
    
    func constructViewHierarchy() {
        addSubview(shareView)
        addSubview(currentView)
        currentView.addSubview(avatarImageView)
        currentView.addSubview(userInfoView)
        userInfoView.addSubview(homeownersImageView)
        userInfoView.addSubview(voiceVolumeImageView)
        userInfoView.addSubview(userLabel)
    }
    
    func activateConstraints() {
        shareView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        currentView.snp.makeConstraints { make in
            make.trailing.equalToSuperview().offset(-20)
            make.top.equalToSuperview().offset(68 + 44 + kDeviceSafeTopHeight)
            make.width.equalTo(200)
            make.height.equalTo(170)
        }
        avatarImageView.snp.makeConstraints { make in
            make.width.height.equalTo(72)
            make.centerX.centerY.equalToSuperview()
        }
        userInfoView.snp.makeConstraints { make in
            make.bottom.equalToSuperview().offset(-5)
            make.height.equalTo(24)
            make.left.equalToSuperview().offset(20)
            make.width.equalTo(80)
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
        var image: UIImage?
        if voiceVolume <= 0 {
            image = UIImage(named: "tuiroom_voice_volume1",
                            in: tuiVideoSeatBundle(), compatibleWith: nil)
        } else {
            image = UIImage(named: "tuiroom_voice_volume2",
                            in: tuiVideoSeatBundle(), compatibleWith: nil)
        }
        return image
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
