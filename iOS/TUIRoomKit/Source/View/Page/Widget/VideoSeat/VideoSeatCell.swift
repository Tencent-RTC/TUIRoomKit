//
//  VideoSeatCell.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import SnapKit
import UIKit

class VideoSeatCell: UICollectionViewCell {
    var seatItem: VideoSeatItem?
    var isSupportedAmplification: Bool {
        return seatItem?.videoStreamType == .screenStream
    }
    
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
    
    let userInfoView: VideoSeatUserStatusView = {
        let view = VideoSeatUserStatusView()
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
    
    @objc private func resetVolumeView() {
        guard let seatItem = seatItem else { return }
        userInfoView.updateUserVolume(hasAudio: seatItem.hasAudioStream, volume: 0)
        scrollRenderView.layer.borderColor = UIColor.clear.cgColor
    }
    
    override func prepareForReuse() {
        scrollRenderView.zoomScale = 1.0
    }
    
    deinit {
        NSObject.cancelPreviousPerformRequests(withTarget: self)
        debugPrint("deinit \(self)")
    }
}

extension VideoSeatCell: UIScrollViewDelegate {
    func viewForZooming(in scrollView: UIScrollView) -> UIView? {
        return isSupportedAmplification ? renderView : nil
    }
}

// MARK: - Public

extension VideoSeatCell {
    func updateUI(item: VideoSeatItem) {
        seatItem = item
        let placeholder = UIImage(named: "room_default_user", in: tuiRoomKitBundle(), compatibleWith: nil)
        avatarImageView.sd_setImage(with: URL(string: item.avatarUrl), placeholderImage: placeholder)
        avatarImageView.isHidden = item.videoStreamType == .screenStream ? true : item.hasVideoStream
        backgroundMaskView.isHidden = item.videoStreamType == .screenStream ? true : item.hasVideoStream
        userInfoView.updateUserStatus(item)
        resetVolumeView()
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
    
    func updateUIVolume(item: VideoSeatItem) {
        userInfoView.updateUserVolume(hasAudio: item.hasAudioStream, volume: item.userVoiceVolume)
        if item.userVoiceVolume > 0 && item.hasAudioStream {
            if item.videoStreamType != .screenStream {
                scrollRenderView.layer.borderColor = UIColor(0xA5FE33).cgColor
            }
        } else {
            scrollRenderView.layer.borderColor = UIColor.clear.cgColor
        }
        resetVolume()
    }
    
    func resetVolume() {
        NSObject.cancelPreviousPerformRequests(withTarget: self, selector: #selector(resetVolumeView), object: nil)
        perform(#selector(resetVolumeView), with: nil, afterDelay: 1)
    }
}

class TUIVideoSeatDragCell: VideoSeatCell {
    typealias DragCellClickBlock = () -> Void
    var clickBlock: DragCellClickBlock?
    
    private var isViewReady = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else {
            return
        }
        isViewReady = true
        bindInteraction()
    }
    
    private func bindInteraction() {
        addGesture()
    }
    
    func updateSize(size: CGSize) {
        var frame = self.frame
        frame.size = size
        self.frame = frame
        center = adsorption(centerPoint: center)
    }
}

// MARK: - gesture

extension TUIVideoSeatDragCell {
    private func addGesture() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(click))
        addGestureRecognizer(tap)
        let dragGesture = UIPanGestureRecognizer(target: self, action: #selector(dragViewDidDrag(gesture:)))
        addGestureRecognizer(dragGesture)
    }
    
    @objc private func click() {
        clickBlock?()
    }
    
    @objc private func dragViewDidDrag(gesture: UIPanGestureRecognizer) {
        guard let viewSuperview = superview else { return }
        let moveState = gesture.state
        let viewCenter = center
        switch moveState {
        case .changed:
            let point = gesture.translation(in: viewSuperview)
            center = CGPoint(x: viewCenter.x + point.x, y: viewCenter.y + point.y)
            break
        case .ended:
            let point = gesture.translation(in: viewSuperview)
            let newPoint = CGPoint(x: viewCenter.x + point.x, y: viewCenter.y + point.y)
            UIView.animate(withDuration: 0.2) {
                self.center = self.adsorption(centerPoint: newPoint)
            }
            break
        default: break
        }
        gesture.setTranslation(.zero, in: viewSuperview)
    }
    
    private func adsorption(centerPoint: CGPoint) -> CGPoint {
        guard let viewSuperview = superview else { return centerPoint }
        let limitMargin = 5.0
        let frame = self.frame
        let point = CGPoint(x: centerPoint.x - frame.width / 2, y: centerPoint.y - frame.height / 2)
        var newPoint = point
        if centerPoint.x < (viewSuperview.frame.width / 2) {
            newPoint.x = limitMargin
        } else {
            newPoint.x = viewSuperview.frame.width - frame.width - limitMargin
        }
        if point.y <= limitMargin {
            newPoint.y = limitMargin
        } else if (point.y + frame.height) > (viewSuperview.frame.height - limitMargin) {
            newPoint.y = viewSuperview.frame.height - frame.height - limitMargin
        }
        return CGPoint(x: newPoint.x + frame.width / 2, y: newPoint.y + frame.height / 2)
    }
}
