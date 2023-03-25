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
        let cameraRenderView = renderView ?? viewResponder?.getSeatVideoRenderView(item)
        if item.userId == currentUserId {
            roomEngine?.setLocalVideoView(streamType: .cameraStream, view: cameraRenderView)
        } else {
            roomEngine?.setRemoteVideoView(userId: item.userId, streamType: .cameraStream, view: cameraRenderView)
            roomEngine?.startPlayRemoteVideo(userId: item.userId, streamType: .cameraStream, onPlaying: { _ in
                
            }, onLoading: { _ in
                
            }, onError: { _, _, _ in
                
            })
        }
    }
    
    func stopPlayCameraVideo(item: VideoSeatItem) {
        if item.userId == currentUserId {
            roomEngine?.setLocalVideoView(streamType: .cameraStream, view: nil)
        } else {
            roomEngine?.setRemoteVideoView(userId: item.userId, streamType: .cameraStream, view: nil)
            roomEngine?.stopPlayRemoteVideo(userId: item.userId, streamType: .cameraStream)
        }
    }
    
    func startPlayScreenVideo(item: VideoSeatItem, renderView: UIView? = nil) {
        let screenRenderView = renderView ?? viewResponder?.getSeatVideoRenderView(item)
        let renderParams = TRTCRenderParams()
        renderParams.fillMode = .fit
        roomEngine?.getTRTCCloud().setRemoteRenderParams(item.userId, streamType: .sub, params: renderParams)
        if item.userId == currentUserId {
            roomEngine?.setLocalVideoView(streamType: .screenStream, view: screenRenderView)
        } else {
            roomEngine?.setRemoteVideoView(userId: item.userId, streamType: .screenStream, view: screenRenderView)
            roomEngine?.startPlayRemoteVideo(userId: item.userId, streamType: .screenStream, onPlaying: { _ in
                
            }, onLoading: { _ in
                
            }, onError: { _, _, _ in
                
            })
        }
    }
    
    func stopPlayScreenVideo(item: VideoSeatItem) {
        if item.userId == currentUserId {
            roomEngine?.setLocalVideoView(streamType: .screenStream, view: nil)
        } else {
            roomEngine?.setRemoteVideoView(userId: item.userId, streamType: .screenStream, view: nil)
            roomEngine?.stopPlayRemoteVideo(userId: item.userId, streamType: .screenStream)
        }
    }
    
    func asyncUserInfo(_ seatItem: VideoSeatItem) {
        guard !seatItem.isAsyncUserInfo else { return }
        roomEngine?.getUserInfo(seatItem.userId, onSuccess: { [weak self] userInfo in
            guard let self = self, let userInfo = userInfo else { return }
            seatItem.isAsyncUserInfo = true
            seatItem.updateUserInfo(userInfo)
            self.viewResponder?.updateSeatItem(seatItem)
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
            self.initSeatList()
        } onError: { code, message in
            debugPrint("getRoomInfo:code:\(code),message:\(message)")
        }
    }
    
    private func initSeatList() {
        roomEngine?.getSeatList { [weak self] seatList in
            guard let self = self else { return }
            var localSeatList = [VideoSeatItem]()
            for seatInfo in seatList {
                let seatItem = VideoSeatItem(seatInfo: seatInfo)
                if seatItem.userId == self.roomInfo.owner {
                    seatItem.userRole = .roomOwner
                }
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
            let seatItem = VideoSeatItem(seatInfo: seatInfo)
            if seatItem.userId == roomInfo.owner {
                seatItem.userRole = .roomOwner
            }
            seatItems.append(seatItem)
            reloadSeatItems()
        }
    }
    
    private func removeSeatItem(_ userId: String) {
        guard let seatItemIndex = seatItems.firstIndex(where: {$0.userId == userId}) else { return }
        let seatItem = seatItems.remove(at: seatItemIndex)
        if shareSeatItem?.userId == userId {
            shareSeatItem = nil
        }
        stopPlayCameraVideo(item: seatItem)
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
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            // 1. 查找屏幕分享 item
            self.reloadShareSeatItem()
            // 2. 自己在第二位
            if let currentItemIndex = self.seatItems.firstIndex(where: { $0.userId == self.currentUserId }) {
                let currentItem = self.seatItems.remove(at: currentItemIndex)
                self.seatItems.insert(currentItem, at: 0)
            }
            // 3. 房主永远在第一位
            if let roomOwnerItemIndex = self.seatItems.firstIndex(where: {$0.userRole == .roomOwner}) {
                let roomOwnerItem = self.seatItems.remove(at: roomOwnerItemIndex)
                self.seatItems.insert(roomOwnerItem, at: 0)
            }
            CATransaction.begin()
            CATransaction.setDisableActions(true)
            self.viewResponder?.reloadData()
            CATransaction.commit()
        }
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
        viewResponder?.updateSeatItem(seatItem)
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
            viewResponder?.updateSeatItem(seatItem)
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
        guard let seatItem = getSeatItem(userId) else { return }
        seatItem.userRole = userRole
        switch userRole {
        case .roomOwner:
            reloadSeatItems()
        case .generalUser:
            viewResponder?.updateSeatItem(seatItem)
        default: break
        }
    }
}
