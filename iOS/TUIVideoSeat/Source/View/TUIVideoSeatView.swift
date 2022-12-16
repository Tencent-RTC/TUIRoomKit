//
//  TUIVideoSeat.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2022/9/13.
//

import TUIRoomEngine
import UIKit
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class TUIVideoSeatView: UIView {
    var videoSeatPresenter: TUIVideoSeatPresenter
    let videoSeatRoomInfo: TUIRoomInfo
    var renderMapView: [String: TUIRoomAttendeeRenderView] = [:]
    var attendeeList: [TUIVideoSeatAttendeeModel] = []
    var attendeeMap: [String: TUIVideoSeatAttendeeModel] = [:]
    var renderShareMapViews: [String: TUIRoomAttendeeRenderView] = [:]
    var shareAttendeeList: [TUIVideoSeatAttendeeModel] = []
    var roomOwner: String = ""

    init(frame: CGRect, roomEngine: TUIRoomEngine, roomId: String) {
        videoSeatPresenter = TUIVideoSeatPresenter(roomEngine: roomEngine, roomId: roomId)
        videoSeatRoomInfo = TUIRoomInfo()
        super.init(frame: frame)
        self.isUserInteractionEnabled = true
        initAttendeeList()
        videoSeatPresenter.addListener(listener: self)
        setupUI()
        activateConstraints()
        bindInteraction()
    }

    override func layoutSubviews() {
        guard let renderView = getRenderViewByUserid(userId: videoSeatPresenter.currentUser.userId()) else { return }
        videoSeatPresenter.setLocalVideoView(streamType: .cameraStream, view: renderView)
        reloadData()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    var pageControl: UIPageControl = {
        let control = UIPageControl()
        control.currentPage = 0
        control.hidesForSinglePage = true
        control.isUserInteractionEnabled = false
        return control
    }()

    lazy var attendeeCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.minimumLineSpacing = 0
        layout.minimumInteritemSpacing = 0
        layout.scrollDirection = .horizontal
        let collection = UICollectionView(frame: CGRect(x: 0, y: 0, width: self.mm_w, height: self.mm_h), collectionViewLayout: layout)
        collection.register(TUIVideoSeatCell.classForCoder(), forCellWithReuseIdentifier: "TUIVideoSeatCell")
        collection.register(TUIVideoSeatShareCell.classForCoder(), forCellWithReuseIdentifier: "TUIVideoSeatShareCell")

        if #available(iOS 10.0, *) {
            collection.isPrefetchingEnabled = true
        } else {
            // Fallback on earlier versions
        }
        collection.isPagingEnabled = true
        collection.showsVerticalScrollIndicator = false
        collection.showsHorizontalScrollIndicator = false
        collection.isUserInteractionEnabled = true
        if #available(iOS 11.0, *) {
            collection.contentInsetAdjustmentBehavior = .never
        } else {
            // Fallback on earlier versions
        }
        collection.contentMode = .scaleToFill
        collection.backgroundColor = .black
        collection.dataSource = self
        collection.delegate = self
        return collection
    }()

    func setupUI() { // 控件添加
        UIApplication.shared.isIdleTimerDisabled = true
        backgroundColor = .clear
        addSubview(attendeeCollectionView)
        addSubview(pageControl)
        guard let renderView = getRenderViewByUserid(userId: videoSeatPresenter.currentUser.userId()) else { return }
        videoSeatPresenter.setLocalVideoView(streamType: .cameraStream, view: renderView)
        reloadData()
    }

    func activateConstraints() {
        attendeeCollectionView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        let bottomOffset = -kDeviceSafeBottomHeight - 20
        pageControl.snp.makeConstraints { make in
            make.height.equalTo(30)
            make.centerX.equalTo(self)
            make.bottom.equalTo(self).offset(bottomOffset - 52 - 12)
        }
    }
    
    func bindInteraction() {
        UIDevice.current.beginGeneratingDeviceOrientationNotifications()
        NotificationCenter.default.addObserver(self, selector: #selector(didChangeOrientation), name:
                                                UIDevice.orientationDidChangeNotification, object: nil)
    }
    
    @objc func didChangeOrientation() {
        //有人在进行屏幕共享时，如果横竖屏切换需要更改参数
        if shareAttendeeList.count > 0 {
            let videoEncParam = TRTCVideoEncParam()
            if UIScreen.main.bounds.size.width > UIScreen.main.bounds.size.height {
                videoEncParam.videoResolution = ._640_360
                videoEncParam.videoBitrate = 600
                videoEncParam.videoFps = 15
                videoEncParam.resMode = .landscape
            }
            videoSeatPresenter.getTRTCCloud().setSubStreamEncoderParam(videoEncParam)
        }
    }

    func initAttendeeList() {
        attendeeList = [videoSeatPresenter.currentUser]
        attendeeMap[videoSeatPresenter.currentUser.userId()] = videoSeatPresenter.currentUser
        reloadData()
    }

    deinit {
        UIApplication.shared.isIdleTimerDisabled = false
        debugPrint("deinit \(self)")
    }
}

// MARK: - TUIRoomCellDelegate

extension TUIVideoSeatView: TUIRoomCellDelegate {
    func getRenderView(model: TUIVideoSeatAttendeeModel, type: TUIVideoStreamType) -> TUIRoomAttendeeRenderView? {
        return getRenderViewByUserid(userId: model.userInfo.userId, type: type)
    }

    func getRenderViewByUserid(userId: String, type: TUIVideoStreamType = .cameraStream) -> TUIRoomAttendeeRenderView? {
        if type == .cameraStream {
            if let renderView = renderMapView[userId] {
                return renderView
            } else {
                guard let model = attendeeMap[userId] else {
                    return nil
                }
                let renderView = TUIRoomAttendeeRenderView()
                renderView.attendeeModel = model
                renderMapView[model.userId()] = renderView
                return renderView
            }
        } else if type == .screenStream {
            if let renderView = renderShareMapViews[userId] {
                return renderView
            } else {
                guard let model = attendeeMap[userId] else {
                    return nil
                }
                let renderView = TUIRoomAttendeeRenderView()
                renderView.attendeeModel = model
                renderView.enableScale(enable: true)
                renderShareMapViews[model.userId()] = renderView
                return renderView
            }
        }
        return nil
    }
}

// MARK: - VideoSeatPresenterListener

extension TUIVideoSeatView: VideoSeatPresenterListener {
    public func onUserVoiceVolumeChanged(volumeMap: [String: NSNumber]) {
        for (userId, volume) in volumeMap {
            var userId = userId
            if userId == "" {
                userId = videoSeatPresenter.currentUser.userInfo.userId
            }
            let render = getRenderViewByUserid(userId: userId)
            render?.attendeeModel.audioVolume = volume.intValue
            let volumeState = volume.intValue > 20

            if volumeState != render?.attendeeModel.volumeState {
                render?.attendeeModel.volumeState = volumeState
                render?.refreshVolumeProgress()
            }
        }
    }

    public func onUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        guard let model = attendeeMap[userId] else {
            return
        }
        if streamType == .cameraStream {
            attendeeMap[userId]?.userInfo.hasVideoStream = hasVideo
            let renderView = getRenderViewByUserid(userId: userId)
            if hasVideo {
                if (renderView?.superview) != nil {
                    if let view = renderView {
                        videoSeatPresenter.setRemoteVideoView(userId: userId, streamType: .cameraStream, view: view)
                        videoSeatPresenter.startPlayRemoteVideo(userId: userId, streamType: .cameraStream) { _ in

                        } onLoading: { _ in

                        } onError: { _, _, _ in
                        }
                    }
                }
            } else {
                videoSeatPresenter.stopPlayRemoteVideo(userId: userId, streamType: .cameraStream)
            }
            if !model.userInfo.hasScreenStream {
                renderView?.refreshVideo(isVideoAvailable: hasVideo)
            }
        } else if streamType == .screenStream {
            attendeeMap[userId]?.userInfo.hasScreenStream = hasVideo
            if hasVideo {
                videoSeatPresenter.stopPlayRemoteVideo(userId: userId, streamType: .cameraStream)
                if shareAttendeeList.count >= 1 {
                    return
                }
                guard let userModel = attendeeMap[userId] else {
                    return
                }
                shareAttendeeList.append(userModel)
                reloadData()
                let renderView = getRenderViewByUserid(userId: userId, type: .screenStream)
                
                if renderView?.superview != nil {
                    if let view = renderView {
                        videoSeatPresenter.stopPlayRemoteVideo(userId: userId, streamType: .cameraStream)
                        let renderParams = TRTCRenderParams()
                        renderParams.fillMode = .fit
                            let videoEncParam = TRTCVideoEncParam()
                            if UIScreen.main.bounds.size.width < UIScreen.main.bounds.size.height {
                                videoEncParam.resMode = .portrait
                            } else {
                                videoEncParam.videoResolution = ._640_360
                                videoEncParam.videoBitrate = 600
                                videoEncParam.videoFps = 15
                                videoEncParam.resMode = .landscape
                            }
                        videoSeatPresenter.getTRTCCloud().setSubStreamEncoderParam(videoEncParam)
                        videoSeatPresenter.getTRTCCloud().setRemoteRenderParams(userId, streamType: .sub, params: renderParams)
                        videoSeatPresenter.setRemoteVideoView(userId: userId, streamType: .screenStream, view: view)
                        videoSeatPresenter.startPlayRemoteVideo(userId: userId, streamType: .screenStream) { _ in
                            
                        } onLoading: { _ in
                            
                        } onError: { _, _, _ in
                        }
                    }
                }
            } else {
                if model.userInfo.hasVideoStream {
                    let renderView = getRenderViewByUserid(userId: userId)
                    if (renderView?.superview) != nil {
                        if let view = renderView {
                            videoSeatPresenter.setRemoteVideoView(userId: userId, streamType: .cameraStream, view: view)
                            videoSeatPresenter.startPlayRemoteVideo(userId: userId, streamType: .cameraStream) { _ in
                            } onLoading: { _ in
                            } onError: { _, _, _ in
                            }
                        }
                    }
                }
                let renderView = getRenderViewByUserid(userId: userId, type: .screenStream)
                renderView?.refreshVideo(isVideoAvailable: model.userInfo.hasVideoStream)
                clearUserSource(userId: userId, type: .screenStream)
                reloadData()
            }
        }
    }

    public func onUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        let renderView = getRenderViewByUserid(userId: userId)
        renderView?.refreshAudio(isAudioAvailable: hasAudio)
    }

    // seatList: 当前麦位列表  seated: 新增上麦的用户列表 left: 下麦的用户列表
    public func onSeatListChanged(seatList: [TUISeatInfo], seated: [TUISeatInfo], left: [TUISeatInfo]) {
        if left.count > 0 {
            for seatInfo: TUISeatInfo in left {
                guard let userId = seatInfo.userId else {
                    continue
                }
                clearUserSource(userId: userId)
            }
            reloadData()
        }
        if attendeeList.count <= 1 {
            addUserList(userList: seatList)
        } else {
            addUserList(userList: seated)
        }
    }

    /**
     * 清理麦上用户资源
     *
     * @param userId 用户ID
     */
    private func clearUserSource(userId: String, type: TUIVideoStreamType = .cameraStream) {
        let renderView = getRenderViewByUserid(userId: userId, type: type)
        renderView?.removeFromSuperview()
        if type == .cameraStream {
            attendeeMap.removeValue(forKey: userId)
            renderMapView.removeValue(forKey: userId)
            attendeeList = attendeeList.filter { model -> Bool in
                model.userInfo.userId != userId
            }
        } else if type == .screenStream {
            renderShareMapViews.removeValue(forKey: userId)
            shareAttendeeList = shareAttendeeList.filter { model -> Bool in
                model.userInfo.userId != userId
            }
        }
    }

    private func addUserList(userList: [TUISeatInfo]) {
        if userList.count > 0 {
            for seatInfo: TUISeatInfo in userList {
                guard let userId = seatInfo.userId else {
                    continue
                }
                if attendeeMap[userId] != nil {
                    continue
                }

                let userModel = TUIVideoSeatAttendeeModel()
                userModel.userInfo.userId = userId
                attendeeMap[userId] = userModel
                attendeeList.append(userModel)

                videoSeatPresenter.getUserInfo(userId: userId) { [weak self] userInfo in
                    guard let user = userInfo else {
                        return
                    }
                    guard let self = self else { return }
                    userModel.userInfo = user
                    if userModel.userInfo.userName.isEmpty {
                        userModel.userInfo.userName = userModel.userInfo.userId
                    }
                    if userModel.userInfo.userRole == .roomOwner {
                        self.attendeeList = self.attendeeList.filter { model -> Bool in
                            model.userInfo.userId != userId
                        }
                        self.attendeeList.insert(userModel, at: 0)
                    }
                    self.reloadData()
                } onError: { code, message in
                    debugPrint("code:\(code), message:\(message)")
                }
            }
            reloadData()
        }
    }

    public func onUserNetworkQualityChanged(networkList: [TUINetworkInfo]) {
        networkList.forEach { networkInfo in
            guard let userId = networkInfo.userId else { return }
            let userInfo = attendeeList.first(where: {$0.userInfo.userId == userId})
            userInfo?.networkQuality = networkInfo.quality
        }
        reloadData()
    }

    func onRoomInfoChanged(roomId: String, roomInfo: TUIRoomInfo) {
        if roomOwner != roomInfo.owner {
            roomOwner = roomInfo.owner
            let isHomeowner: Bool = (roomInfo.owner == videoSeatPresenter.currentUser.userInfo.userId)
            if isHomeowner {
                videoSeatPresenter.currentUser.userInfo.userRole = .roomOwner
                let userInfo = attendeeList.first(where: {$0.userInfo.userId == videoSeatPresenter.currentUser.userInfo.userId})
                userInfo?.userInfo.userRole = videoSeatPresenter.currentUser.userInfo.userRole
                reloadData()
            }
        }
    }
}

// MARK: - UICollectionViewDataSource&UICollectionViewDelegate&UICollectionViewDelegateFlowLayout

extension TUIVideoSeatView: UICollectionViewDataSource, UICollectionViewDelegate, UICollectionViewDelegateFlowLayout {
    func reloadData(animate: Bool = false) {
        if shareAttendeeList.count > 0 {
            pageControl.numberOfPages = shareAttendeeList.count
        } else {
            if attendeeList.count % max_show_cell_count == 0 {
                pageControl.numberOfPages = attendeeList.count / max_show_cell_count
            } else {
                pageControl.numberOfPages = attendeeList.count / max_show_cell_count + 1
            }
        }
        updatePageControl()
        if pageControl.currentPage >= pageControl.numberOfPages {
            pageControl.currentPage = (pageControl.numberOfPages > 1 ? pageControl.numberOfPages - 1 : 0)
        }
        if shareAttendeeList.count > 0 {
            self.attendeeCollectionView.reloadData()
        }

        UIView.performWithoutAnimation {
            let indexPath = IndexPath(item: pageControl.currentPage, section: 0)
            self.attendeeCollectionView.reloadItems(at: [indexPath])
        }
    }

    func updatePageControl() {
        let offsetYu = Int(attendeeCollectionView.contentOffset.x) % Int(attendeeCollectionView.mm_w)
        let offsetMuti = CGFloat(offsetYu) / attendeeCollectionView.mm_w
        pageControl.currentPage = (offsetMuti > 0.5 ? 1 : 0) + (Int(attendeeCollectionView.contentOffset.x) / Int(attendeeCollectionView.mm_w))
    }

    func videoStateChangedPageControl() {
        let startIndex = pageControl.currentPage * max_show_cell_count
        let endIndex = (startIndex + max_show_cell_count < attendeeList.count ? startIndex + max_show_cell_count : attendeeList.count)
        for index in 0 ..< attendeeList.count {
            let userId = attendeeList[index].userInfo.userId
            let renderView = getRenderViewByUserid(userId: userId)
            guard let hasVideo = attendeeMap[userId]?.userInfo.hasVideoStream else { return }
            if index < endIndex && index >= startIndex {
                if hasVideo {
                    if (renderView?.superview) != nil {
                        if let view = renderView {
                            videoSeatPresenter.setRemoteVideoView(userId: userId, streamType: .cameraStream, view: view)
                            videoSeatPresenter.startPlayRemoteVideo(userId: userId, streamType: .cameraStream) { _ in
                            } onLoading: { _ in
                            } onError: { _, _, _ in
                            }
                        }
                    }
                }
            } else {
                if hasVideo {
                    videoSeatPresenter.stopPlayRemoteVideo(userId: userId, streamType: .cameraStream)
                }
            }
        }
    }

    public func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return pageControl.numberOfPages
    }

    public func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        if shareAttendeeList.count > 0 {
            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: "TUIVideoSeatShareCell",
                for: indexPath) as! TUIVideoSeatShareCell
            cell.delegate = self
            if indexPath.row < shareAttendeeList.count {
                cell.updateByModels(shareAttendeeList[indexPath.row], attendeeModel: videoSeatPresenter.currentUser)
            }
            return cell
        }
        let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: "TUIVideoSeatCell",
            for: indexPath) as! TUIVideoSeatCell

        if indexPath.row < pageControl.numberOfPages {
            let startIndex = indexPath.row * max_show_cell_count
            let endIndex = (startIndex + max_show_cell_count < attendeeList.count ? startIndex + max_show_cell_count : attendeeList.count)

            var attendeeModels = [TUIVideoSeatAttendeeModel]()
            for index in startIndex ..< endIndex where index < attendeeList.count {
                attendeeModels.append(attendeeList[index])
            }
            cell.delegate = self
            cell.isFirstPage = (indexPath.row == 0)
            if attendeeList.count > max_show_cell_count {
                cell.updateByModels(modes: attendeeModels, styleType: .more)
            } else {
                if attendeeList.count == 2 {
                    var firstUser = attendeeModels[0]
                    if videoSeatPresenter.currentUser.userId() == firstUser.userId() {
                        firstUser = attendeeModels[1]
                    }
                    cell.updateByModels(modes: [firstUser, videoSeatPresenter.currentUser],
                                        styleType: TUIVideoSeatCellType(rawValue: attendeeModels.count) ?? .one)
                } else {
                    cell.updateByModels(modes: attendeeModels,
                                        styleType: TUIVideoSeatCellType(rawValue: attendeeModels.count) ?? .one)
                }
            }
        } else {
            cell.updateByModels(modes: [TUIVideoSeatAttendeeModel()], styleType: .one)
        }

        return cell
    }

    public func collectionView(_ collectionView: UICollectionView,
                               layout collectionViewLayout: UICollectionViewLayout,
                               sizeForItemAt indexPath: IndexPath) -> CGSize {
        return collectionView.frame.size
    }

    public func collectionView(_ collectionView: UICollectionView,
                               layout collectionViewLayout: UICollectionViewLayout,
                               minimumLineSpacingForSectionAt section: Int) -> CGFloat {
        return 0
    }

    public func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        updatePageControl()
        videoStateChangedPageControl()
    }

    public func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
        if !decelerate {
            updatePageControl()
            videoStateChangedPageControl()
        }
    }
}
