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

protocol RoomMainViewResponder: NSObject {
    func showSelfBecomeRoomOwnerAlert()
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
        getUserList()//获取用户列表
        EngineEventCenter.shared.subscribeEngine(event: .onRoomDismissed, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onKickedOutOfRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRequestReceived, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserVideoStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRequestCancelled, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserRoleChanged, observer: self)
    }
    
    func applyConfigs() {
        guard currentUser.isOnSeat else { return }
        let roomEngine = engineManager.roomEngine
        if roomInfo.isOpenMicrophone && roomInfo.enableAudio {
            roomEngine.openLocalMicrophone { [weak self] in
                guard let self = self else { return }
                self.engineManager.roomEngine.startPushLocalAudio()
            } onError: { code, message in
                debugPrint("openLocalMicrophone:code:\(code),message:\(message)")
            }
        }
        if roomInfo.isOpenCamera && roomInfo.enableVideo {
            let params = TRTCRenderParams()
            params.fillMode = .fill
            params.rotation = ._0
            if engineManager.store.videoSetting.isMirror {
                params.mirrorType = .enable
            } else {
                params.mirrorType = .disable
            }
            roomEngine.getTRTCCloud().setLocalRenderParams(params)
            // FIXME: - 打开摄像头前需要先设置一个view
            roomEngine.setLocalVideoView(streamType: .cameraStream, view: UIView())
            roomEngine.openLocalCamera(isFront:engineManager.store.videoSetting.isFrontCamera) { [weak self] in
                guard let self = self else { return }
                self.engineManager.roomEngine.startPushLocalVideo()
            } onError: { code, message in
                debugPrint("openLocalCamera:code:\(code),message:\(message)")
            }
        }
        roomEngine.getTRTCCloud().setLocalVideoProcessDelegete(self, pixelFormat: ._Texture_2D, bufferType: .texture)
    }
    
    private func getUserList() {
        engineManager.roomEngine.getUserList(nextSequence: 0) { [weak self] list, nextSequence in
            guard let self = self else { return }
            if nextSequence != 0 {
                self.getUserList()
            }
            list.forEach { userIndo in
                let userModel = UserModel()
                userModel.update(userInfo: userIndo)
                self.addUserList(userModel: userModel)
            }
        } onError: { code, message in
            debugPrint("getUserList:code:\(code),message:\(message)")
        }
    }
    
    private func addUserList(userModel: UserModel) {
        if engineManager.store.attendeeMap[userModel.userId] != nil {
            return
        }
        engineManager.store.attendeeMap[userModel.userId] = userModel
        engineManager.store.attendeeList.append(userModel)
        if engineManager.store.attendeeMap[userModel.userId] != nil {
            return
        }
        engineManager.store.attendeeMap[userModel.userId] = userModel
        engineManager.store.attendeeList.append(userModel)
        if userModel.userName.isEmpty {
            userModel.userName = userModel.userId
        }
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: [:])
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
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_UserOnSeat, param: [:])
        } else {
            currentUser.isOnSeat = false
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_UserDownSeat, param: [:])
        }
    }
    
    func respondTurnOnAudio(isAgree: Bool, requestId: String) {
        let roomEngine = engineManager.roomEngine
        roomEngine.responseRemoteRequest(requestId, agree: isAgree) {
        } onError: { code, message in
            debugPrint("responseRemoteRequest:code:\(code),message:\(message)")
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
        debugPrint("deinit \(self)")
    }
}

extension RoomMainViewModel: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        if name == .onRoomDismissed {
            interruptClearRoom()
            let alertVC = UIAlertController(title: .destroyAlertText, message: nil, preferredStyle: .alert)
            let sureAction = UIAlertAction(title: .alertOkText, style: .default) { action in
                // TODO: 这里需要补充弹到主页面的方法
                RoomRouter.shared.navController.popToRootViewController(animated: true)
            }
            alertVC.addAction(sureAction)
            RoomRouter.shared.presentAlert(alertVC)
        }
        
        if name == .onKickedOutOfRoom {
            interruptClearRoom()
            let alertVC = UIAlertController(title: .kickOffTitleText, message: nil, preferredStyle: .alert)
            let sureAction = UIAlertAction(title: .alertOkText, style: .default) { action in
                // TODO: 这里需要补充弹到主页面的方法
                RoomRouter.shared.navController.popToRootViewController(animated: true)
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
                    self.respondTurnOnAudio(isAgree: false, requestId: request.requestId)
                }
                let sureAction = UIAlertAction(title: .agreeText, style: .default) { [weak self] _ in
                    guard let self = self else { return }
                    self.respondTurnOnAudio(isAgree: true, requestId: request.requestId)
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
                if roomInfo.enableSeatControl {
                    //如果作为房主收到自己要上麦拿到请求，直接同意
                    if request.userId == currentUser.userId && roomInfo.owner == request.userId {
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
                }
                else {
                    engineManager.roomEngine.responseRemoteRequest(request.requestId, agree: true) {
                    } onError: { _, _ in
                    }
                }
            case .remoteUserOnSeat:
                if roomInfo.enableSeatControl {
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
                } else {
                    engineManager.roomEngine.responseRemoteRequest(request.requestId, agree: true) {
                    } onError: { _, _ in
                    }
                }
            @unknown default:
                break
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
        
        if name == .onRequestCancelled {
            guard let userId = param?["userId"] as? String else { return }
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
                roomInfo.owner = userId
            }
            if isSelfRoleChanged, isRoomOwnerChanged {
                if roomInfo.enableSeatControl {
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
        //        if let dstTextureId = TUICore.callService(TUICore_TUIBeautyService,
        //                                                  method: TUICore_TUIBeautyService_ProcessVideoFrame,
        //                                                  param: [
        //                                                      TUICore_TUIBeautyService_ProcessVideoFrame_SRCTextureIdKey: srcFrame.textureId,
        //                                                      TUICore_TUIBeautyService_ProcessVideoFrame_SRCFrameWidthKey: srcFrame.width,
        //                                                      TUICore_TUIBeautyService_ProcessVideoFrame_SRCFrameHeightKey: srcFrame.height,
        //                                                  ]) as? GLuint {
        //            dstFrame.textureId = dstTextureId
        //        }
        dstFrame.textureId = srcFrame.textureId
        return 0
    }
}

extension RoomMainViewModel: RoomMainViewFactory {
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
}

private extension String {
    static let alertOkText = localized("TUIRoom.ok")
    static let kickOffTitleText = localized("TUIRoom.kick.off.title")
    static let destroyAlertText = localized("TUIRoom.room.destroy")
    static let noticeCameraOnTitleText = localized("TUIRoom.homeowners.notice.camera.turned.on")
    static let noticeMicrophoneOnTitleText = localized("TUIRoom.homeowners.notice.microphone.turned.on")
    static let noticeCameraOffTitleText = localized("TUIRoom.homeowners.notice.camera.turned.off")
    static let noticeMicrophoneOffTitleText = localized("TUIRoom.homeowners.notice.microphone.turned.off")
    static let inviteTurnOnAudioText = localized("TUIRoom.invite.turn.on.audio")
    static let inviteTurnOnVideoText = localized("TUIRoom.invite.turn.on.video")
    static let declineText = localized("TUIRoom.decline")
    static let agreeText = localized("TUIRoom.agree")
    static let inviteSpeakOnStageTitle = localized("TUIRoom.invite.to.speak")
    static let inviteSpeakOnStageMessage = localized("TUIRoom.agree.to.speak")
}
