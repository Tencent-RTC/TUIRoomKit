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

class TUIVideoSeatViewModel: NSObject {
    var rootView: TUIVideoSeatView?
    private var roomEngine: TUIRoomEngine
    let currentUser: UserModel = UserModel()
    var roomInfo: TUIRoomInfo
    var renderMapView: [String: UIView] = [:]
    var shareRenderMapView: [String: UIView] = [:]
    var attendeeList: [UserModel] = []
    var attendeeMap: [String: UserModel] = [:]
    var shareAttendeeModel: UserModel?
    
    init(roomEngine: TUIRoomEngine, roomId: String) {
        self.roomEngine = roomEngine
        self.roomInfo = TUIRoomInfo()
        roomInfo.roomId = roomId
        currentUser.update(userInfo: TUIRoomEngine.getSelfInfo())
        super.init()
        initRoomInfo()
        getSeatList()
        roomEngine.addObserver(self)
    }
    
    deinit {
        roomEngine.removeObserver(self)
    }
    
    func initRoomInfo() {
        roomEngine.getRoomInfo { [weak self ] roomInfo in
            guard let self = self, let roomInfo = roomInfo else { return }
            self.roomInfo = roomInfo
        } onError: { code, message in
            debugPrint("getRoomInfo:code:\(code),message:\(message)")
        }
    }
    
    func setLocalVideoView(streamType: TUIVideoStreamType, view: UIView) {
        roomEngine.setLocalVideoView(streamType: streamType, view: view)
    }
    
    func getSeatList() {
        roomEngine.getSeatList { seatInfo in
            self.addUserList(userList: seatInfo)
        } onError: { code, message in
            debugPrint("getSeatList:code:\(code),message:\(message)")
        }
    }
    
    private func removeUserList(userId: String, type: TUIVideoStreamType = .cameraStream) {
        if type == .cameraStream {
            attendeeList = attendeeList.filter { model -> Bool in
                model.userId != userId
            }
            attendeeMap.removeValue(forKey: userId)
        }else if type == .screenStream {
            shareAttendeeModel = nil
        }
        rootView?.attendeeCollectionView.reloadData()
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
                let userModel = UserModel()
                userModel.userId = userId
                attendeeMap[userId] = userModel
                attendeeList.append(userModel)
                roomEngine.getUserInfo(userId) { [weak self] userInfo in
                    guard let user = userInfo else {
                        return
                    }
                    guard let self = self else { return }
                    userModel.update(userInfo: user)
                    if userModel.userName.isEmpty {
                        userModel.userName = userModel.userId
                    }
                    if userModel.userRole == .roomOwner {
                        self.attendeeList = self.attendeeList.filter { model -> Bool in
                            model.userId != userId
                        }
                        self.attendeeList.insert(userModel, at: 0)
                    }
                    if userModel.hasScreenStream {
                        self.shareAttendeeModel = userModel
                    }
                    self.rootView?.attendeeCollectionView.reloadData()
                } onError: { code, message in
                    debugPrint("code:\(code), message:\(message)")
                }
            }
            rootView?.attendeeCollectionView.reloadData()
        }
    }
    
    func playRemoteVideo(userId: String, streamType: TUIVideoStreamType) {
        guard let renderView = getRenderViewByUserid(userId: userId, streamType: streamType) else { return }
        guard let userModel = attendeeList.first(where: { $0.userId == userId }) else { return }
        if streamType == .cameraStream {
            if userModel.hasVideoStream && roomInfo.enableVideo {
                if userId == currentUser.userId {
                    roomEngine.setLocalVideoView(streamType: .cameraStream, view: renderView)
                } else {
                    roomEngine.setRemoteVideoView(userId: userId, streamType: .cameraStream, view: renderView)
                    roomEngine.startPlayRemoteVideo(userId: userId, streamType: .cameraStream) { _ in
                        
                    } onLoading: { _ in
                        
                    } onError: { _, _, _ in
                    }
                }
            }
        } else {
            if userModel.hasScreenStream {
                let renderParams = TRTCRenderParams()
                renderParams.fillMode = .fit
                roomEngine.getTRTCCloud().setRemoteRenderParams(userId, streamType: .sub, params: renderParams)
                roomEngine.setRemoteVideoView(userId: userId, streamType: .screenStream, view: renderView)
                roomEngine.startPlayRemoteVideo(userId: userId, streamType: .screenStream) { _ in
                    debugPrint("")
                } onLoading: { _ in
                    debugPrint("")
                } onError: { _, _, _ in
                    debugPrint("")
                }
            }
        }
    }
    
    func getRenderViewByUserid(userId: String, streamType: TUIVideoStreamType) -> UIView? {
        if streamType == .cameraStream {
            guard let renderView = renderMapView[userId] else {
                return nil
            }
            return renderView
        } else {
            guard let renderView = shareRenderMapView[userId] else {
                return nil
            }
            return renderView
        }
    }
}

extension TUIVideoSeatViewModel: TUIRoomObserver {
    public func onRemoteUserLeaveRoom(roomId: String, userInfo: TUIUserInfo) {
        if roomId == roomInfo.roomId {
            removeUserList(userId: userInfo.userId)
        }
    }
    
    public func onUserVoiceVolumeChanged(volumeMap: [String: NSNumber]) {
        for (userId, volume) in volumeMap {
            var userId = userId
            if userId == "" {
                userId = currentUser.userId
            }
            let attendModel = attendeeList.first(where: { $0.userId == userId })
            attendModel?.audioVolume = volume.intValue
            UIEventCenter.shared.notifyUIEvent(key: .UserVoiceVolumeChanged, param: ["userId": userId, "audioVolume": volume.intValue])
        }
    }
    
    public func onUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        guard let model = attendeeMap[userId] else {
            return
        }
        if streamType == .cameraStream {
            attendeeMap[userId]?.hasVideoStream = hasVideo
            let attendModel = attendeeList.first(where: { $0.userId == userId })
            attendModel?.hasVideoStream = hasVideo
            guard let renderView = getRenderViewByUserid(userId: userId, streamType: .cameraStream) else { return }
            guard renderView.superview != nil else { return }
            if hasVideo {
                if userId == currentUser.userId {
                    roomEngine.setLocalVideoView(streamType: .cameraStream, view: renderView)
                } else {
                    roomEngine.setRemoteVideoView(userId: userId, streamType: .cameraStream, view: renderView)
                    roomEngine.startPlayRemoteVideo(userId: userId, streamType: .cameraStream) { _ in
                        
                    } onLoading: { _ in
                        
                    } onError: { _, _, _ in
                    }
                }
            } else {
                roomEngine.stopPlayRemoteVideo(userId: userId, streamType: .cameraStream)
            }
            if !model.hasScreenStream {
                //                renderView?.refreshVideo(isVideoAvailable: hasVideo)
            }
            UIEventCenter.shared.notifyUIEvent(key: .UserVideoStateChanged, param: ["userId": userId, "hasVideo": hasVideo])
        } else if streamType == .screenStream {
            attendeeMap[userId]?.hasScreenStream = hasVideo
            let attendModel = attendeeList.first(where: { $0.userId == userId })
            attendModel?.hasScreenStream = hasVideo
            if hasVideo {
                roomEngine.stopPlayRemoteVideo(userId: userId, streamType: .cameraStream)
                if shareAttendeeModel != nil {
                    return
                }
                guard let userModel = attendeeMap[userId] else {
                    return
                }
                shareAttendeeModel = userModel
                rootView?.attendeeCollectionView.reloadData()
                let renderView = getRenderViewByUserid(userId: userId, streamType: .screenStream)
                if renderView?.superview != nil {
                    if let view = renderView {
                        let renderParams = TRTCRenderParams()
                        renderParams.fillMode = .fit
                        roomEngine.getTRTCCloud().setRemoteRenderParams(userId, streamType: .sub, params: renderParams)
                        roomEngine.setRemoteVideoView(userId: userId, streamType: .screenStream, view: view)
                        roomEngine.startPlayRemoteVideo(userId: userId, streamType: .screenStream) { _ in
                            
                        } onLoading: { _ in
                            
                        } onError: { _, _, _ in
                        }
                    }
                }
            } else {
                if model.hasVideoStream {
                    let renderView = getRenderViewByUserid(userId: userId, streamType: .cameraStream)
                    if (renderView?.superview) != nil {
                        if let view = renderView {
                            roomEngine.setRemoteVideoView(userId: userId, streamType: .cameraStream, view: view)
                            roomEngine.startPlayRemoteVideo(userId: userId, streamType: .cameraStream) { _ in
                            } onLoading: { _ in
                            } onError: { _, _, _ in
                            }
                        }
                    }
                }
                removeUserList(userId: userId, type: .screenStream)
                rootView?.attendeeCollectionView.reloadData()
            }
        }
    }
    
    // seatList: 当前麦位列表  seated: 新增上麦的用户列表 left: 下麦的用户列表
    public func onSeatListChanged(seatList: [TUISeatInfo], seated: [TUISeatInfo], left: [TUISeatInfo]) {
        if left.count > 0 {
            for seatInfo: TUISeatInfo in left {
                guard let userId = seatInfo.userId else {
                    continue
                }
                removeUserList(userId: userId)
            }
        }
        if attendeeList.count <= 1 {
            addUserList(userList: seatList)
        } else {
            addUserList(userList: seated)
        }
    }
}
