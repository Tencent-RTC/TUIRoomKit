//
//  TUIVideoSeatPresenter.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2022/9/28.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

protocol TUIVideoSeatViewResponder: NSObject {

    func reloadData()

    func getSeatVideoRenderView(_ item: VideoSeatItem) -> UIView?
    func getSeatShareRenderView(_ item: VideoSeatItem) -> UIView?

    func updateSeatItem(_ item: VideoSeatItem)
    func updateSeatVolume(_ item: VideoSeatItem)
}

class TUIVideoSeatViewModel: NSObject {

    weak var viewResponder: TUIVideoSeatViewResponder? = nil

    var seatItems: [VideoSeatItem] = []
    var shareSeatItem: VideoSeatItem? = nil

    var roomInfo: RoomInfo = RoomInfo()
    var currentUserId: String {
        return TUIRoomEngine.getSelfInfo().userId
    }
    
    private weak var roomEngine: TUIRoomEngine?
    init(roomEngine: TUIRoomEngine, roomId: String) {
        super.init()
        self.roomEngine = roomEngine
        roomInfo.roomId = roomId
        initRoomInfo()
        initSeatList()
        roomEngine.addObserver(self)
    }
    
    deinit {
        roomEngine?.removeObserver(self)
    }
}

// MARK: - Public
extension TUIVideoSeatViewModel {

    func isHomeOwner(_ userId: String) -> Bool {
        return roomInfo.owner == userId
    }
    
    func startPlayCameraVideo(item: VideoSeatItem, renderView: UIView? = nil) {
        var videoRenderView = renderView
        if videoRenderView == nil {
            videoRenderView = viewResponder?.getSeatVideoRenderView(item)
        }
        guard let view = videoRenderView else { return }
        if item.userId == currentUserId {
            roomEngine?.setLocalVideoView(streamType: .cameraStream, view: view)
        } else {
            roomEngine?.setRemoteVideoView(userId: item.userId, streamType: .cameraStream, view: view)
            roomEngine?.startPlayRemoteVideo(userId: item.userId, streamType: .cameraStream, onPlaying: { _ in
                
            }, onLoading: { _ in
                
            }, onError: { _, _, _ in
                
            })
        }
    }
    
    func stopPlayCameraVideo(item: VideoSeatItem) {
        roomEngine?.stopPlayRemoteVideo(userId: item.userId, streamType: .cameraStream)
    }
    
    func startPlayScreenVideo(item: VideoSeatItem, renderView: UIView? = nil) {
        var videoRenderView = renderView
        if videoRenderView == nil {
            videoRenderView = viewResponder?.getSeatVideoRenderView(item)
        }
        guard let view = videoRenderView else { return }
        let renderParams = TRTCRenderParams()
        renderParams.fillMode = .fit
        roomEngine?.getTRTCCloud().setRemoteRenderParams(item.userId, streamType: .sub, params: renderParams)
        if item.userId == currentUserId {
            roomEngine?.setLocalVideoView(streamType: .screenStream, view: view)
        } else {
            roomEngine?.setRemoteVideoView(userId: item.userId, streamType: .screenStream, view: view)
            roomEngine?.startPlayRemoteVideo(userId: item.userId, streamType: .screenStream, onPlaying: { _ in
                
            }, onLoading: { _ in
                
            }, onError: { _, _, _ in
                
            })
        }
    }
    
    func stopPlayScreenVideo(item: VideoSeatItem) {
        roomEngine?.stopPlayRemoteVideo(userId: item.userId, streamType: .cameraStream)
    }
    
    func asyncUserInfo(_ userId: String) {
        roomEngine?.getUserInfo(userId, onSuccess: { [weak self] userInfo in
            guard let self = self, let userInfo = userInfo else { return }
            guard let seatItem = self.getSeatItem(userId) else { return }
            seatItem.updateUserInfo(userInfo)
            if userInfo.userRole == .roomOwner || userInfo.hasScreenStream {
                self.reloadSeatItems()
            } else {
                self.viewResponder?.updateSeatItem(seatItem)
            }
            if userInfo.hasVideoStream {
                self.startPlayCameraVideo(item: seatItem)
            } else {
                self.stopPlayCameraVideo(item: seatItem)
            }
        }, onError: { _, msg in
            debugPrint("asyncUserInfo error: \(msg)")
        })
    }
}


// MARK: - Private
extension TUIVideoSeatViewModel {

    private func initRoomInfo() {
        roomEngine?.getRoomInfo { [weak self] roomInfo in
            guard let self = self, let roomInfo = roomInfo else { return }
            self.roomInfo = RoomInfo(roomInfo: roomInfo)
        } onError: { code, message in
            debugPrint("getRoomInfo:code:\(code),message:\(message)")
        }
    }
    
    private func initSeatList() {
        roomEngine?.getSeatList { [weak self] seatList in
            guard let self = self else { return }
            var localSeatList = [VideoSeatItem]()
            for seatInfo in seatList {
                let seatItem = VideoSeatItem(seatInfo: seatInfo, viewModel: self)
                self.asyncUserInfo(seatItem.userId)
                localSeatList.append(seatItem)
            }
            self.seatItems = localSeatList
            self.reloadSeatItems()
        } onError: { code, message in
            debugPrint("getSeatList:code:\(code),message:\(message)")
        }
    }
    
    private func addSeatItem(_ item: VideoSeatItem) {
        if !seatItems.contains(where: {$0.userId == item.userId}) {
            seatItems.append(item)
        }
    }
    
    private func addSeatInfo(_ seatInfo: TUISeatInfo) {
        if let userId = seatInfo.userId, let seatItem = getSeatItem(userId) {
            seatItem.updateSeatInfo(seatInfo)
        } else {
            let seatItem = VideoSeatItem(seatInfo: seatInfo, viewModel:self)
            asyncUserInfo(seatItem.userId)
            seatItems.append(seatItem)
        }
    }
    
    private func removeSeatItem(_ userId: String) {
        seatItems.removeAll(where: {$0.userId == userId})
        if shareSeatItem?.userId == userId {
            shareSeatItem = nil
        }
    }
    
    private func getSeatItem(_ userId: String) -> VideoSeatItem? {
        if let item = shareSeatItem, item.userId == userId {
            return item
        }
        return seatItems.first(where: {$0.userId == userId})
    }
    
    private func reloadShareSeatItem() {
        if let oldItem = shareSeatItem, !oldItem.hasScreenStream {
            shareSeatItem = nil
            addSeatItem(oldItem)
        }
        if let newShareItemIndex = seatItems.firstIndex(where: {$0.hasScreenStream}) {
            shareSeatItem = seatItems.remove(at: newShareItemIndex)
        }
    }
    
    private func reloadSeatItems() {
        // 1. 查找屏幕分享 item
        reloadShareSeatItem()
        // 2. 排序，有视频在前面
        seatItems = seatItems.sorted(by: { (item1, item2) in
            if item1.hasVideoStream {
                return false
            } else if item2.hasVideoStream {
                return true
            }
            return false
        })
        // 3. 房主永远在第一位
        if let roomOwnerItemIndex = seatItems.firstIndex(where: {$0.userRole == .roomOwner}) {
            let roomOwnerItem = seatItems.remove(at: roomOwnerItemIndex)
            seatItems.insert(roomOwnerItem, at: 0)
        }
        self.viewResponder?.reloadData()
    }
}

extension TUIVideoSeatViewModel: TUIRoomObserver {

    func onRoomInfoChanged(roomId: String, roomInfo: TUIRoomInfo) {
        // FIXME: 修复转让房主原房主收不到回调问题
        let oldRoomOwner = self.roomInfo.owner
        if !oldRoomOwner.isEmpty, oldRoomOwner != roomInfo.owner {
            self.onUserRoleChanged(userId: oldRoomOwner, userRole: .generalUser)
        }
        self.roomInfo.update(engineRoomInfo: roomInfo)
    }
    
    func onUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        guard let seatItem = getSeatItem(userId) else {
            return
        }
        seatItem.hasAudioStream = hasAudio
        viewResponder?.updateSeatVolume(seatItem)
    }
    
    public func onUserVoiceVolumeChanged(volumeMap: [String: NSNumber]) {
        for (userId, volume) in volumeMap {
            guard let seatItem = getSeatItem(userId) else { return }
            seatItem.audioVolume = volume.intValue
            viewResponder?.updateSeatVolume(seatItem)
        }
    }
    
    public func onUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        guard let seatItem = getSeatItem(userId) else {
            return
        }
        if streamType == .cameraStream {
            seatItem.hasVideoStream = hasVideo
            reloadSeatItems()
            if hasVideo {
                startPlayCameraVideo(item: seatItem)
            } else {
                stopPlayCameraVideo(item: seatItem)
            }
        }
        if streamType == .screenStream {
            seatItem.hasScreenStream = hasVideo
            reloadSeatItems()
            if hasVideo {
                startPlayScreenVideo(item: seatItem)
            } else {
                stopPlayScreenVideo(item: seatItem)
            }
        }
    }
    
    // seatList: 当前麦位列表  seated: 新增上麦的用户列表 left: 下麦的用户列表
    public func onSeatListChanged(seatList: [TUISeatInfo], seated: [TUISeatInfo], left: [TUISeatInfo]) {
        for leftSeat in left {
            if let userId = leftSeat.userId {
                removeSeatItem(userId)
            }
        }
        for seatInfo in seatList {
            addSeatInfo(seatInfo)
        }
        reloadSeatItems()
    }
    
    public func onUserRoleChanged(userId: String, userRole: TUIRole) {
        let isSelfRoleChanged = userId == currentUserId
        let isRoomOwnerChanged = userRole == .roomOwner
        if isRoomOwnerChanged {
            roomInfo.owner = userId
        }
        if isSelfRoleChanged, let seatItem = getSeatItem(userId) {
            seatItem.userRole = userRole
        }
        reloadSeatItems()
    }
}
