//
//  SingleStreamView.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/11/19.
//

import Foundation
import SnapKit
import UIKit
import Combine
import RTCRoomEngine
import Factory
#if canImport(TXLiteAVSDK_TRTC)
    import TXLiteAVSDK_TRTC
#elseif canImport(TXLiteAVSDK_Professional)
    import TXLiteAVSDK_Professional
#endif

protocol SingleStreamViewDelegate: AnyObject {
    func singleViewDidClick(_ view: SingleStreamView, videoItem: UserInfo?)
}

class SingleStreamView: UIView {
    @Injected(\.videoStore) var videoStore: VideoStore
    weak var delegate: SingleStreamViewDelegate?
    private(set) var videoItem: UserInfo?
    private var isDraggable: Bool = false
    private var isBorderHighlighted = false
    private var lastVolumeUpdateTime: TimeInterval = 0
    var cancellableSet = Set<AnyCancellable>()
    private(set) var originalX: CGFloat = 0
    var isSupportedAmplification: Bool {
        return videoItem?.videoStreamType == .screenStream
    }
    var engineManager: EngineManager {
        EngineManager.shared
    }
    var currentUserId: String {
        engineManager.store.currentUser.userId
    }
    
    init(isDraggable: Bool = false) {
        self.isDraggable = isDraggable
        super.init(frame: .zero)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func updateVideoItem(item: UserInfo?) {
        cancellableSet.removeAll()
        
        if let oldItem = self.videoItem, oldItem.userId != item?.userId {
            stopPlayVideoStream()
        }
        videoItem = item
        updateBindind(with: item)
    }
    
    func createVideoItemPublisher(for userId: String, item: UserInfo) -> AnyPublisher<UserInfo, Never> {
            let seatItemsPublisher = videoStore.subscribe(Selector(keyPath: \VideoSeatState.videoSeatItems))
                .map { items -> UserInfo? in
                    items.first { $0.userId == userId}
                }
                .eraseToAnyPublisher()
        
            let shareItemPublisher = videoStore.subscribe(Selector(keyPath: \VideoSeatState.shareItem))
                .map { shareItem -> UserInfo? in
                    if let shareItem = shareItem, shareItem.userId == userId {
                        return shareItem
                    }
                    return nil
                }
                .eraseToAnyPublisher()
            
        return (item.videoStreamType == .screenStream ? shareItemPublisher : seatItemsPublisher)
            .compactMap { $0 }
            .receive(on: RunLoop.main)
            .share()
            .eraseToAnyPublisher()
        }
    
    private func updateBindind(with userInfo: UserInfo?) {
        guard let userInfo = userInfo else { return }
        let userId = userInfo.userId
        let videoItemPublisher = createVideoItemPublisher(for: userId, item: userInfo)
        
        videoItemPublisher
            .removeDuplicates { oldItem, newItem in
                oldItem.hasAudioStream == newItem.hasAudioStream &&
                oldItem.userVoiceVolume == newItem.userVoiceVolume
            }
            .receive(on: RunLoop.main)
            .sink { [weak self] userInfo in
                guard let self = self else { return }
                self.handleAudioUpdate(userInfo: userInfo)
            }
            .store(in: &cancellableSet)
        
        videoItemPublisher
            .removeDuplicates { oldItem, newItem in
                oldItem.userName == newItem.userName &&
                oldItem.userRole == newItem.userRole &&
                oldItem.hasVideoStream == newItem.hasVideoStream &&
                oldItem.videoStreamType == newItem.videoStreamType
            }
            .receive(on: RunLoop.main)
            .sink { [weak self] userInfo in
                guard let self = self else { return }
                self.handleInfoUpdate(userInfo: userInfo)
            }
            .store(in: &cancellableSet)
        
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
        bindInteraction()
        self.backgroundColor = .clear
    }
    
    private func constructViewHierarchy() {
        scrollRenderView.addSubview(renderView)
        scrollRenderView.addSubview(backgroundMaskView)
        self.addSubview(scrollRenderView)
        self.addSubview(avatarImageView)
        self.addSubview(userInfoView)
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
    
    private func handleAudioUpdate(userInfo: UserInfo?) {
        guard let item = userInfo else { return }
        updateUIVolume(item: item)
    }
    
    private func handleInfoUpdate(userInfo: UserInfo?) {
        guard let item = userInfo else { return }
        if !self.isHidden && self.alpha > 0 {
            if item.hasVideoStream || item.videoStreamType == .screenStream {
                self.startPlayVideoStream(item: item)
            } else {
                self.stopPlayVideoStream(item: item)
            }
        }
        updateUI(item: item)
    }
    
    func startPlayVideoStream() {
        if let videoItem = self.videoItem {
            if videoItem.hasVideoStream || videoItem.videoStreamType == .screenStream {
                self.startPlayVideoStream(item: videoItem)
            } else {
                self.stopPlayVideoStream(item: videoItem)
            }
        }
    }
    
    func stopPlayVideoStream() {
        if let videoItem = self.videoItem {
            stopPlayVideoStream(item: videoItem)
        }
    }
    
    private func bindInteraction() {
        if isDraggable {
            addGesture()
        }
    }
    
    func reset() {
        scrollRenderView.zoomScale = 1.0
        cancellableSet.removeAll()
        resetBorderColor()
    }
    
    func updateSize(size: CGSize) {
        var frame = self.frame
        frame.size = size
        self.frame = frame
        center = adsorption(centerPoint: center)
    }
    
    deinit {
        NSObject.cancelPreviousPerformRequests(withTarget: self)
        debugPrint("deinit \(self)")
    }
}

extension SingleStreamView: UIScrollViewDelegate {
    func viewForZooming(in scrollView: UIScrollView) -> UIView? {
        return isSupportedAmplification ? renderView : nil
    }
}

extension SingleStreamView {
    private func startPlayVideoStream(item: UserInfo) {
        if item.userId != currentUserId {
            engineManager.setRemoteVideoView(userId: item.userId, streamType: item.videoStreamType, view: renderView)
            engineManager.startPlayRemoteVideo(userId: item.userId, streamType: item.videoStreamType)
        } else if item.videoStreamType == .cameraStream || item.videoStreamType == .cameraStreamLow {
            engineManager.setLocalVideoView(renderView)
        }
    }
    
    private func stopPlayVideoStream(item: UserInfo) {
        if item.userId == currentUserId {
            engineManager.setLocalVideoView(nil)
        } else if item.videoStreamType == .cameraStream || item.videoStreamType == .cameraStreamLow {
            engineManager.setRemoteVideoView(userId: item.userId, streamType: item.videoStreamType, view: nil)
            engineManager.stopPlayRemoteVideo(userId: item.userId, streamType: item.videoStreamType)
        }
    }
    
}

// MARK: - Public

extension SingleStreamView {
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

// MARK: - gesture

extension SingleStreamView {
    private func addGesture() {
        let dragGesture = UIPanGestureRecognizer(target: self, action: #selector(dragViewDidDrag(gesture:)))
        addGestureRecognizer(dragGesture)
        
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(singleViewDidTapped))
        addGestureRecognizer(tapGesture)
    }
    
    @objc private func singleViewDidTapped() {
        delegate?.singleViewDidClick(self, videoItem: videoItem)
    }
    
    func setupFrame(_ frame: CGRect) {
        self.frame = frame
        self.originalX = frame.origin.x
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
            originalX = frame.origin.x
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

