//
//  RoomMainViewModel.swift
//  TUIRoomKit
//
//  Created by aby on 2022/12/27.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUICore
import TUIRoomEngine
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

protocol RoomMainViewResponder: AnyObject {
    func showSelfBecomeRoomOwnerAlert()
    func showBeautyView()
    func makeToast(text: String)
}

class RoomMainViewModel: NSObject {
    let timeoutNumber: Double = 100
    weak var viewResponder: RoomMainViewResponder? = nil
    var engineManager: EngineManager {
        EngineManager.shared
    }
    var roomInfo: RoomInfo {
        engineManager.store.roomInfo
    }
    var currentUser: UserModel {
        engineManager.store.currentUser
    }
    
    override init() {
        super.init()
        applyConfigs()
        getUserList(nextSequence: 0)//获取用户列表
        EngineEventCenter.shared.subscribeEngine(event: .onRoomDismissed, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onKickedOutOfRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRequestReceived, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserVideoStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRequestCancelled, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserRoleChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onSendMessageForUserDisableChanged, observer: self)
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_ShowBeautyView, responder: self)
    }
    
    func applyConfigs() {
        engineManager.roomEngine.getTRTCCloud().setLocalVideoProcessDelegete(self, pixelFormat: ._Texture_2D, bufferType: .texture)
        //如果房间不是自由发言房间并且用户没有上麦，不开启摄像头和麦克风
        if roomInfo.speechMode != .freeToSpeak && !currentUser.isOnSeat {
            return
        }
        let roomEngine = engineManager.roomEngine
        if roomInfo.isOpenCamera && !roomInfo.isCameraDisableForAllUser {
            let params = TRTCRenderParams()
            params.fillMode = .fill
            params.rotation = ._0
            if engineManager.store.videoSetting.isMirror {
                params.mirrorType = .enable
            } else {
                params.mirrorType = .disable
            }
            roomEngine.getTRTCCloud().setLocalRenderParams(params)
            roomEngine.getTRTCCloud().setGSensorMode(.uiFixLayout)
            // FIXME: - 打开摄像头前需要先设置一个view
            roomEngine.setLocalVideoView(streamType: .cameraStream, view: UIView())
            roomEngine.openLocalCamera(isFront:engineManager.store.videoSetting.isFrontCamera, quality:
                                        engineManager.store.videoSetting.videoQuality) {
            } onError: { code, message in
                debugPrint("openLocalCamera:code:\(code),message:\(message)")
            }
            roomEngine.startPushLocalVideo()
        }
        if roomInfo.isOpenMicrophone && !roomInfo.isMicrophoneDisableForAllUser {
            roomEngine.openLocalMicrophone(engineManager.store.audioSetting.audioQuality) { [weak self] in
                guard let self = self else { return }
                self.engineManager.roomEngine.startPushLocalAudio()
            } onError: { code, message in
                debugPrint("openLocalMicrophone:code:\(code),message:\(message)")
            }
        }
    }
    
    private func getUserList(nextSequence: Int) {
        engineManager.roomEngine.getUserList(nextSequence: nextSequence) { [weak self] list, nextSequence in
            guard let self = self else { return }
            list.forEach { userInfo in
                self.addUserList(userInfo: userInfo)
            }
            if nextSequence != 0 {
                self.getUserList(nextSequence: nextSequence)
            }
        } onError: { code, message in
            debugPrint("getUserList:code:\(code),message:\(message)")
        }
    }
    
    private func addUserList(userInfo: TUIUserInfo) {
        if let userItem = getUserItem(userInfo.userId) {
            userItem.update(userInfo: userInfo)
        } else {
            if userInfo.userId == roomInfo.ownerId {
                userInfo.userRole = .roomOwner
            }
            if userInfo.userName.isEmpty {
                userInfo.userName = userInfo.userId
            }
            let userItem = UserModel()
            userItem.update(userInfo: userInfo)
            engineManager.store.attendeeList.append(userItem)
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: [:])
        }
    }
    
    private func getUserItem(_ userId: String) -> UserModel? {
        return engineManager.store.attendeeList.first(where: {$0.userId == userId})
    }
    
    func respondUserOnSeat(isAgree: Bool, requestId: String) {
        engineManager.roomEngine.responseRemoteRequest(requestId, agree: isAgree) { [weak self] in
            guard let self = self else { return }
            self.engineManager.store.inviteSeatMap.removeValue(forKey: self.currentUser.userId)
            self.engineManager.store.inviteSeatList = self.engineManager.store.inviteSeatList.filter { [weak self] userModel in
                guard let self = self else { return false }
                return userModel.userId == self.currentUser.userId
            }
        } onError: { code, message in
            debugPrint("responseRemoteRequest:code:\(code),message:\(message)")
        }
        if isAgree {
            currentUser.isOnSeat = true
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_UserOnSeatChanged, param: ["isOnSeat":true])
        } else {
            currentUser.isOnSeat = false
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_UserOnSeatChanged, param: ["isOnSeat":false])
        }
    }
    
    deinit {
        EngineEventCenter.shared.unsubscribeEngine(event: .onRoomDismissed, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onKickedOutOfRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onRequestReceived, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserVideoStateChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onRequestCancelled, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserRoleChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onSendMessageForUserDisableChanged, observer: self)
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_ShowBeautyView, responder: self)
        debugPrint("deinit \(self)")
    }
}

extension RoomMainViewModel: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        if name == .onRoomDismissed {
            interruptClearRoom()
            let alertVC = UIAlertController(title: .destroyAlertText, message: nil, preferredStyle: .alert)
            let sureAction = UIAlertAction(title: .alertOkText, style: .default) { action in
            }
            alertVC.addAction(sureAction)
            RoomRouter.shared.presentAlert(alertVC)
        }
        
        if name == .onKickedOutOfRoom {
            interruptClearRoom()
            let alertVC = UIAlertController(title: .kickOffTitleText, message: nil, preferredStyle: .alert)
            let sureAction = UIAlertAction(title: .alertOkText, style: .default) { action in
            }
            alertVC.addAction(sureAction)
            RoomRouter.shared.presentAlert(alertVC)
        }
        
        if name == .onRequestReceived {
            guard let request = param?["request"] as? TUIRequest else { return }
            switch request.requestAction {
            case .openRemoteCamera:
                let alertVC = UIAlertController(title: .inviteTurnOnVideoText,
                                                message: "",
                                                preferredStyle: .alert)
                let declineAction = UIAlertAction(title: .declineText, style: .cancel) { [weak self] _ in
                    guard let self = self else { return }
                    self.engineManager.roomEngine.responseRemoteRequest(request.requestId, agree: false) {
                    } onError: { code, message in
                        debugPrint("openLocalCamera:code:\(code),message:\(message)")
                    }
                }
                let sureAction = UIAlertAction(title: .agreeText, style: .default) { [weak self] _ in
                    guard let self = self else { return }
                    // FIXME: - 打开摄像头前需要先设置一个view
                    self.engineManager.roomEngine.setLocalVideoView(streamType: .cameraStream, view: UIView())
                    self.engineManager.roomEngine.responseRemoteRequest(request.requestId, agree: true) {
                    } onError: { code, message in
                        debugPrint("openLocalCamera:code:\(code),message:\(message)")
                    }
                }
                alertVC.addAction(declineAction)
                alertVC.addAction(sureAction)
                RoomRouter.shared.presentAlert(alertVC)
            case .openRemoteMicrophone:
                let alertVC = UIAlertController(title: .inviteTurnOnAudioText,
                                                message: "",
                                                preferredStyle: .alert)
                let declineAction = UIAlertAction(title: .declineText, style: .cancel) { [weak self] _ in
                    guard let self = self else { return }
                    self.engineManager.roomEngine.responseRemoteRequest(request.requestId, agree: false) {
                    } onError: { code, message in
                        debugPrint("openLocalCamera:code:\(code),message:\(message)")
                    }
                }
                let sureAction = UIAlertAction(title: .agreeText, style: .default) { [weak self] _ in
                    guard let self = self else { return }
                    self.engineManager.roomEngine.responseRemoteRequest(request.requestId, agree: true) {
                    } onError: { code, message in
                        debugPrint("openLocalCamera:code:\(code),message:\(message)")
                    }
                }
                alertVC.addAction(declineAction)
                alertVC.addAction(sureAction)
                RoomRouter.shared.presentAlert(alertVC)
            case .invalidAction:
                break
            case .connectOtherRoom:
                engineManager.roomEngine.responseRemoteRequest(request.requestId, agree: true) {
                } onError: { _, _ in
                }
            case .takeSeat:
                switch roomInfo.speechMode {
                case .applySpeakAfterTakingSeat:
                    //如果作为房主收到自己要上麦拿到请求，直接同意
                    if request.userId == currentUser.userId && roomInfo.ownerId == request.userId {
                        engineManager.roomEngine.responseRemoteRequest(request.requestId, agree: true) {
                        } onError: { _, _ in
                        }
                    }
                    guard let userModel = engineManager.store.attendeeList.first(where: {$0.userId == request.userId}) else { return }
                    if (engineManager.store.inviteSeatMap[request.userId] != nil) {
                        break
                    }
                    engineManager.store.inviteSeatList.append(userModel)
                    engineManager.store.inviteSeatMap[request.userId] = request.requestId
                    EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
                default: break
                }
            case .remoteUserOnSeat:
                switch roomInfo.speechMode {
                case .applySpeakAfterTakingSeat:
                    let alertVC = UIAlertController(title: .inviteSpeakOnStageTitle,
                                                    message: .inviteSpeakOnStageMessage,
                                                    preferredStyle: .alert)
                    let declineAction = UIAlertAction(title: .declineText, style: .cancel) { [weak self] _ in
                        guard let self = self else { return }
                        self.respondUserOnSeat(isAgree: false, requestId: request.requestId)
                    }
                    let sureAction = UIAlertAction(title: .agreeText, style: .default) { [weak self] _ in
                        guard let self = self else { return }
                        self.respondUserOnSeat(isAgree: true, requestId: request.requestId)
                    }
                    alertVC.addAction(declineAction)
                    alertVC.addAction(sureAction)
                    RoomRouter.shared.presentAlert(alertVC)
                default: break
                }
            default: break
            }
        }
        if name == .onUserVideoStateChanged {
            guard let userId = param?["userId"] as? String else { return }
            guard let streamType = param?["streamType"] as? TUIVideoStreamType else { return }
            guard let hasVideo = param?["hasVideo"] as? Bool else { return }
            switch streamType {
            case .screenStream:
                engineManager.store.isSomeoneSharing = hasVideo
                EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_SomeoneSharing, param: [:])
            case .cameraStream:
                guard let userModel = engineManager.store.attendeeList.first(where: { $0.userId == userId }) else { return }
                userModel.hasVideoStream = hasVideo
                EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: [:])
            default: break
            }
        }
        if name == .onUserAudioStateChanged {
            guard let userId = param?["userId"] as? String else { return }
            guard let hasAudio = param?["hasAudio"] as? Bool else { return }
            guard let userModel = engineManager.store.attendeeList.first(where: { $0.userId == userId }) else { return }
            userModel.hasAudioStream = hasAudio
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: [:])
        }
        
        if name == .onSendMessageForUserDisableChanged {
            guard let userId = param?["userId"] as? String else { return }
            guard let muted = param?["muted"] as? Bool else { return }
            guard let userModel = engineManager.store.attendeeList.first(where: { $0.userId == userId }) else { return }
            userModel.isMuteMessage = muted
            if userId == currentUser.userId {
                currentUser.isMuteMessage = muted
                viewResponder?.makeToast(text: muted ? .messageTurnedOffText : .messageTurnedOnText)
            }
        }
        
        if name == .onRequestCancelled {
            guard var userId = param?["userId"] as? String else { return }
            guard let requestId = param?["requestId"] as? String else { return }
            //如果是请求超时被取消，userId是房主，需要通过requestId找到用户的userId
            engineManager.store.inviteSeatMap.forEach { (key, value) in
                if value == requestId {
                    userId = key
                }
            }
            engineManager.store.inviteSeatMap.removeValue(forKey: userId)
            engineManager.store.inviteSeatList = engineManager.store.inviteSeatList.filter { userModel in
                userModel.userId != userId
            }
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
        }
        
        if name == .onUserRoleChanged {
            guard let userId = param?["userId"] as? String else { return }
            guard let userRole = param?["userRole"] as? TUIRole else { return }
            let isSelfRoleChanged = userId == currentUser.userId
            let isRoomOwnerChanged = userRole == .roomOwner
            if isSelfRoleChanged {
                currentUser.userRole = userRole
            }
            if isRoomOwnerChanged {
                roomInfo.ownerId = userId
            }
            //转成房主之后需要上麦
            if isSelfRoleChanged, isRoomOwnerChanged {
                if roomInfo.speechMode == .applySpeakAfterTakingSeat {
                    engineManager.roomEngine.takeSeat(-1, timeout: timeoutNumber) { [weak self] _, _ in
                        guard let self = self else { return }
                        self.currentUser.isOnSeat = true
                        debugPrint("")
                    } onRejected: { _, _, _ in
                        debugPrint("")
                    } onCancelled: { _, _ in
                        debugPrint("")
                    } onTimeout: { _, _ in
                        debugPrint("")
                    } onError: { _, _, _, _ in
                        debugPrint("")
                    }
                }
                viewResponder?.showSelfBecomeRoomOwnerAlert()
            }
        }
    }
    
    func interruptClearRoom() {
        let roomEngine = engineManager.roomEngine
        roomEngine.closeLocalCamera()
        roomEngine.closeLocalMicrophone()
        roomEngine.stopPushLocalAudio()
        roomEngine.stopPushLocalVideo()
        roomEngine.stopScreenCapture()
        roomEngine.getTRTCCloud().setLocalVideoProcessDelegete(nil, pixelFormat: ._Texture_2D, bufferType: .texture)
        engineManager.exitRoom()
    }
}

extension RoomMainViewModel: TRTCVideoFrameDelegate {
    public func onProcessVideoFrame(_ srcFrame: TRTCVideoFrame, dstFrame: TRTCVideoFrame) -> UInt32 {
        //todo：美颜组件有bug，xMagicKit初始化不成功，需要更改
        if let dstTextureId = TUICore.callService(TUICore_TUIBeautyService,
                                                  method: TUICore_TUIBeautyService_ProcessVideoFrame,
                                                  param: [
                                                    TUICore_TUIBeautyService_ProcessVideoFrame_SRCTextureIdKey: srcFrame.textureId,
                                                    TUICore_TUIBeautyService_ProcessVideoFrame_SRCFrameWidthKey: srcFrame.width,
                                                    TUICore_TUIBeautyService_ProcessVideoFrame_SRCFrameHeightKey: srcFrame.height,
                                                  ]) as? GLuint {
            dstFrame.textureId = dstTextureId
        } else {
            dstFrame.textureId = srcFrame.textureId
        }
        return 0
    }
}

extension RoomMainViewModel: RoomMainViewFactory {
    func makeBeautyView() -> UIView {
        let beautyManager = engineManager.roomEngine.getTRTCCloud().getBeautyManager()
        var beautyView = UIView()
        let beautyInfo = TUICore.getExtensionInfo(TUICore_TUIBeautyExtension_BeautyView,
                                                  param: [
                                                    TUICore_TUIBeautyExtension_BeautyView_BeautyManager: beautyManager,])
        if let view = beautyInfo[TUICore_TUIBeautyExtension_BeautyView_View] as? UIView {
            view.isHidden = true
            beautyView = view
        }
        return beautyView
    }
    
    func makeTopView() -> UIView {
        let viewModel = TopViewModel()
        let topView = TopView(viewModel: viewModel)
        return topView
    }
    
    func makeBottomView() -> UIView {
        let viewModel = BottomViewModel()
        let bottomView = BottomView(viewModel: viewModel)
        return bottomView
    }
    
    func makeMiddleView() -> UIView {
        let roomEngineMap = TUICore.getExtensionInfo(gRoomEngineKey, param: ["roomId": roomInfo.roomId])
        guard let roomEngine = roomEngineMap[gRoomEngineKey] else { return UIView(frame: .zero) }
        let map = TUICore.getExtensionInfo(gVideoSeatViewKey, param: ["roomEngine": roomEngine, "roomId": roomInfo.roomId])
        guard let view = map[gVideoSeatViewKey] as? UIView else { return UIView(frame: .zero) }
        return view
    }
    
    func makeRaiseHandNoticeView() -> UIView {
        let raiseHandNoticeView = RaiseHandNoticeView()
        //只有举手发言房间，并且用户不是房主时才会显示举手上麦提示
        if roomInfo.speechMode == .applySpeakAfterTakingSeat && currentUser.userRole != .roomOwner {
            raiseHandNoticeView.isHidden = false
        } else {
            raiseHandNoticeView.isHidden = true
        }
        return raiseHandNoticeView
    }
}

extension RoomMainViewModel: RoomKitUIEventResponder {
    func onNotifyUIEvent(key: EngineEventCenter.RoomUIEvent, Object: Any?, info: [AnyHashable : Any]?) {
        switch key{
        case .TUIRoomKitService_ShowBeautyView:
            viewResponder?.showBeautyView()
        default: break
        }
    }
}

private extension String {
    static let alertOkText = localized("TUIRoom.ok")
    static let kickOffTitleText = localized("TUIRoom.kick.off.title")
    static let destroyAlertText = localized("TUIRoom.room.destroy")
    static let inviteTurnOnAudioText = localized("TUIRoom.invite.turn.on.audio")
    static let inviteTurnOnVideoText = localized("TUIRoom.invite.turn.on.video")
    static let declineText = localized("TUIRoom.decline")
    static let agreeText = localized("TUIRoom.agree")
    static let inviteSpeakOnStageTitle = localized("TUIRoom.invite.to.speak")
    static let inviteSpeakOnStageMessage = localized("TUIRoom.agree.to.speak")
    static let messageTurnedOffText = localized("TUIRoom.homeowners.notice.message.turned.off")
    static let messageTurnedOnText = localized("TUIRoom.homeowners.notice.message.turned.on")
}
