//
//  VideoSeatCell.swift
//  Pods
//
//  Created by CY zhao on 2024/11/11.
//


import SnapKit
import UIKit
import Combine

class MultiStreamCell: UICollectionViewCell {
    var cancellableSet = Set<AnyCancellable>()
    var videoItem: UserInfo?
    var isSupportedAmplification: Bool {
        return videoItem?.videoStreamType == .screenStream
    }
    private var isBorderHighlighted = false
    private var lastVolumeUpdateTime: TimeInterval = 0
    
    private lazy var scrollRenderView: UIScrollView = {
        let scrollView = UIScrollView()
        scrollView.backgroundColor = UIColor(0x17181F)
        scrollView.layer.cornerRadius = 16
        scrollView.layer.masksToBounds = true
        scrollView.layer.borderWidth = 2
        scrollView.layer.borderColor = UIColor.clear.cgColor
        
        scrollView.showsVerticalScrollIndicator = false
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.maximumZoomScale = 5
        scrollView.minimumZoomScale = 1
        scrollView.isScrollEnabled = false
        scrollView.delegate = self
        return scrollView
    }()
    
    let renderView: UIView = {
        let view = UIView(frame: .zero)
        view.backgroundColor = .clear
        return view
    }()
    
    let backgroundMaskView: UIView = {
        let view = UIView(frame: .zero)
        view.backgroundColor = UIColor(0x17181F)
        view.layer.cornerRadius = 16
        view.layer.masksToBounds = true
        return view
    }()
    
    let userInfoView: VideoUserStatusView = {
        let view = VideoUserStatusView()
        return view
    }()
    
    let avatarImageView: UIImageView = {
        let imageView = UIImageView(frame: .zero)
        imageView.layer.masksToBounds = true
        return imageView
    }()
    
    private var isViewReady = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else {
            return
        }
        isViewReady = true
        constructViewHierarchy()
        activateConstraints()
        contentView.backgroundColor = .clear
    }
    
    private func constructViewHierarchy() {
        scrollRenderView.addSubview(renderView)
        scrollRenderView.addSubview(backgroundMaskView)
        contentView.addSubview(scrollRenderView)
        contentView.addSubview(avatarImageView)
        contentView.addSubview(userInfoView)
    }
    
    private func activateConstraints() {
        scrollRenderView.snp.makeConstraints { make in
            make.edges.equalToSuperview().inset(2)
        }
        renderView.snp.makeConstraints { make in
            make.center.equalToSuperview()
            make.width.equalToSuperview()
            make.height.equalToSuperview()
        }
        backgroundMaskView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        userInfoView.snp.makeConstraints { make in
            make.height.equalTo(24)
            make.bottom.equalToSuperview().offset(-5)
            make.leading.equalToSuperview().offset(5)
            make.width.lessThanOrEqualTo(self).multipliedBy(0.9)
        }
    }
    
    func reset() {
        videoItem = nil
        cancellableSet.removeAll()
        resetBorderColor()
    }
    
    override func prepareForReuse() {
        super.prepareForReuse()
        reset()
        scrollRenderView.zoomScale = 1.0
    }
    
    deinit {
        NSObject.cancelPreviousPerformRequests(withTarget: self)
        debugPrint("deinit \(self)")
    }
}

extension MultiStreamCell: UIScrollViewDelegate {
    func viewForZooming(in scrollView: UIScrollView) -> UIView? {
        return isSupportedAmplification ? renderView : nil
    }
}

// MARK: - Public

extension MultiStreamCell {
    func updateUI(item: UserInfo) {
        videoItem = item
        let placeholder = UIImage(named: "room_default_user", in: tuiRoomKitBundle(), compatibleWith: nil)
        avatarImageView.sd_setImage(with: URL(string: item.avatarUrl), placeholderImage: placeholder)
        avatarImageView.isHidden = item.videoStreamType == .screenStream ? true : item.hasVideoStream
        backgroundMaskView.isHidden = item.videoStreamType == .screenStream ? true : item.hasVideoStream
        userInfoView.updateUserStatus(item)
        scrollRenderView.layer.borderColor = UIColor.clear.cgColor
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            guard let self = self else { return }
            let width = min(self.mm_w / 2, 72)
            self.avatarImageView.layer.cornerRadius = width * 0.5
            guard let _ = self.avatarImageView.superview else { return }
            self.avatarImageView.snp.remakeConstraints { make in
                make.height.width.equalTo(width)
                make.center.equalToSuperview()
            }
        }
    }
    
    func updateUIVolume(item: UserInfo) {
        guard videoItem?.userId == item.userId else { return }
        videoItem?.hasAudioStream = item.hasAudioStream
        userInfoView.updateUserVolume(hasAudio: item.hasAudioStream, volume: item.userVoiceVolume)
        
        lastVolumeUpdateTime = Date().timeIntervalSince1970
        
        if item.userVoiceVolume > 0 && item.hasAudioStream {
            if item.videoStreamType != .screenStream {
                if !isBorderHighlighted {
                    scrollRenderView.layer.borderColor = UIColor(0xA5FE33).cgColor
                    isBorderHighlighted = true
                }
                scheduleBorderReset()
            }
        } else {
            resetBorderColor()
        }
    }
    
    private func scheduleBorderReset() {
         DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
             guard let self = self else { return }
             let now = Date().timeIntervalSince1970
             if now - self.lastVolumeUpdateTime >= 2 {
                 self.resetBorderColor()
             }
         }
     }

    private func resetBorderColor() {
        scrollRenderView.layer.borderColor = UIColor.clear.cgColor
        isBorderHighlighted = false
    }
}

class VideoUserStatusView: UIView {
    private var isShownHomeOwnerImageView: Bool = false
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else {
            return
        }
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

    private let voiceVolumeImageView: VolumeView = {
        let imageView = VolumeView()
        return imageView
    }()

    private func activateConstraints() {
        updateOwnerImageConstraints()
        voiceVolumeImageView.snp.remakeConstraints { make in
            make.leading.equalTo(homeOwnerImageView.snp.trailing).offset(6.scale375())
            make.width.height.equalTo(14)
            make.centerY.equalToSuperview()
        }
        userNameLabel.snp.makeConstraints { make in
            make.leading.equalTo(voiceVolumeImageView.snp.trailing).offset(5)
            make.centerY.equalToSuperview()
            make.trailing.equalToSuperview().offset(-8)
        }
    }

    private func updateOwnerImageConstraints() {
        guard let _ = homeOwnerImageView.superview else { return }
        homeOwnerImageView.snp.remakeConstraints { make in
            make.leading.equalToSuperview()
            make.width.height.equalTo(isShownHomeOwnerImageView ? 24 : 0)
            make.top.bottom.equalToSuperview()
        }
    }
}

// MARK: - Public

extension VideoUserStatusView {
    func updateUserStatus(_ item: UserInfo) {
        if !item.userName.isEmpty {
            userNameLabel.text = item.userName
        } else {
            userNameLabel.text = item.userId
        }
        if item.userRole == .roomOwner {
            homeOwnerImageView.image = UIImage(named: "room_homeowner", in: tuiRoomKitBundle(), compatibleWith: nil)
        } else if item.userRole == .administrator {
            homeOwnerImageView.image = UIImage(named: "room_administrator", in: tuiRoomKitBundle(), compatibleWith: nil)
        }
        isShownHomeOwnerImageView = item.userRole != .generalUser
        homeOwnerImageView.isHidden = !isShownHomeOwnerImageView
        updateOwnerImageConstraints()
        updateUserVolume(hasAudio: item.hasAudioStream, volume: item.userVoiceVolume)
    }

    func updateUserVolume(hasAudio: Bool, volume: Int) {
        voiceVolumeImageView.updateVolume(CGFloat(volume))
        voiceVolumeImageView.updateAudio(hasAudio)
    }
}

