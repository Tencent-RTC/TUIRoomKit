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
    override init() {
        super.init()
        EngineEventCenter.shared.subscribeEngine(event: .onRoomDismissed, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onKickedOutOfRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRequestReceived, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserVideoStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRequestCancelled, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserRoleChanged, observer: self)
    }
    
    func applyConfigs() {
        guard EngineManager.shared.store.currentUser.isOnSeat else { return }
        let roomEngine = EngineManager.shared.roomEngine
        if EngineManager.shared.store.roomInfo.isOpenMicrophone && EngineManager.shared.store.roomInfo.enableAudio {
            roomEngine.openLocalMicrophone {
                roomEngine.startPushLocalAudio()
            } onError: { code, message in
                debugPrint("openLocalMicrophone:code:\(code),message:\(message)")
            }
        }
        if EngineManager.shared.store.roomInfo.isOpenCamera && EngineManager.shared.store.roomInfo.enableVideo {
            let params = TRTCRenderParams()
            params.fillMode = .fill
            params.rotation = ._0
            if EngineManager.shared.store.videoSetting.isMirror {
                params.mirrorType = .enable
            } else {
                params.mirrorType = .disable
            }
            roomEngine.getTRTCCloud().setLocalRenderParams(params)
            roomEngine.openLocalCamera(isFront: EngineManager.shared.store.videoSetting.isFrontCamera) {
                roomEngine.startPushLocalVideo()
            } onError: { code, message in
                debugPrint("openLocalCamera:code:\(code),message:\(message)")
            }
        }
        EngineManager.shared.roomEngine.getTRTCCloud().setLocalVideoProcessDelegete(self, pixelFormat: ._Texture_2D, bufferType: .texture)
    }
    
    func respondUserOnSeat(isAgree: Bool, requestId: Int) {
        EngineManager.shared.roomEngine.responseRemoteRequest(requestId, agree: isAgree) {
            EngineManager.shared.store.inviteSeatMap.removeValue(forKey: EngineManager.shared.store.currentUser.userId)
            EngineManager.shared.store.inviteSeatList = EngineManager.shared.store.inviteSeatList.filter { userModel in
                userModel.userId == EngineManager.shared.store.currentUser.userId
            }
        } onError: { code, message in
            debugPrint("responseRemoteRequest:code:\(code),message:\(message)")
        }
        if isAgree {
            EngineManager.shared.store.currentUser.isOnSeat = true
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_UserOnSeat, param: [:])
        } else {
            EngineManager.shared.store.currentUser.isOnSeat = false
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_UserDownSeat, param: [:])
        }
    }
    
    func respondTurnOnAudio(isAgree: Bool, requestId: Int) {
        EngineManager.shared.roomEngine.responseRemoteRequest(requestId, agree: isAgree) {
            if isAgree {
                EngineManager.shared.roomEngine.openLocalMicrophone {
                    EngineManager.shared.roomEngine.startPushLocalAudio()
                } onError: { code, message in
                    debugPrint("openLocalMicrophone:code:\(code),message:\(message)")
                }
                EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_MuteLocalAudio, param: ["select" : false, "enabled": true])
            }
        } onError: { code, message in
            debugPrint("responseRemoteRequest:code:\(code),message:\(message)")
        }
    }
    
    func respondTurnOnVideo(isAgree: Bool, requestId: Int) {
        EngineManager.shared.roomEngine.responseRemoteRequest(requestId, agree: isAgree) {
        } onError: { code, message in
            debugPrint("openLocalCamera:code:\(code),message:\(message)")
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
            let sureAction = UIAlertAction(title: .alertOkText, style: .default) { _ in
                guard let navigationController = RoomRouter.shared.currentViewController()?.navigationController else { return }
                navigationController.viewControllers.forEach({ viewController in
                    if viewController is RoomEntranceViewController {
                        navigationController.popToViewController(viewController, animated: true)
                        return
                    }
                })
                return
            }
            alertVC.addAction(sureAction)
            RoomRouter.shared.currentViewController()?.present(alertVC, animated: true)
        }
        
        if name == .onKickedOutOfRoom {
            interruptClearRoom()
            let alertVC = UIAlertController(title: .kickOffTitleText, message: nil, preferredStyle: .alert)
            let sureAction = UIAlertAction(title: .alertOkText, style: .default) { _ in
                guard let navigationController = RoomRouter.shared.currentViewController()?.navigationController else { return }
                navigationController.viewControllers.forEach({ viewController in
                    if viewController is RoomEntranceViewController {
                        navigationController.popToViewController(viewController, animated: true)
                        return
                    }
                })
                return
            }
            alertVC.addAction(sureAction)
            RoomRouter.shared.currentViewController()?.present(alertVC, animated: true)
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
                    self.respondTurnOnVideo(isAgree: false, requestId: Int(request.requestId))
                }
                let sureAction = UIAlertAction(title: .agreeText, style: .default) { [weak self] _ in
                    guard let self = self else { return }
                    self.respondTurnOnVideo(isAgree: true, requestId: Int(request.requestId))
                }
                alertVC.addAction(declineAction)
                alertVC.addAction(sureAction)
                RoomRouter.shared.currentViewController()?.present(alertVC, animated: true, completion: nil)
            case .openRemoteMicrophone:
                let alertVC = UIAlertController(title: .inviteTurnOnAudioText,
                                                message: "",
                                                preferredStyle: .alert)
                let declineAction = UIAlertAction(title: .declineText, style: .cancel) { [weak self] _ in
                    guard let self = self else { return }
                    self.respondTurnOnAudio(isAgree: false, requestId: Int(request.requestId))
                }
                let sureAction = UIAlertAction(title: .agreeText, style: .default) { [weak self] _ in
                    guard let self = self else { return }
                    self.respondTurnOnAudio(isAgree: true, requestId: Int(request.requestId))
                }
                alertVC.addAction(declineAction)
                alertVC.addAction(sureAction)
                RoomRouter.shared.currentViewController()?.present(alertVC, animated: true, completion: nil)
            case .invalidAction:
                break
            case .connectOtherRoom:
                EngineManager.shared.roomEngine.responseRemoteRequest(Int(request.requestId), agree: true) {
                } onError: { _, _ in
                }
            case .takeSeat:
                if EngineManager.shared.store.roomInfo.enableSeatControl {
                    //如果作为房主收到自己要上麦拿到请求，直接同意
                    if request.userId == EngineManager.shared.store.currentUser.userId && EngineManager.shared.store.roomInfo.owner ==
                        request.userId {
                        EngineManager.shared.roomEngine.responseRemoteRequest(Int(request.requestId), agree: true) {
                        } onError: { _, _ in
                        }
                    }
                    guard let userModel = EngineManager.shared.store.attendeeList.first(where: {$0.userId == request.userId}) else { return }
                    if (EngineManager.shared.store.inviteSeatMap[request.userId] != nil) {
                        break
                    }
                    EngineManager.shared.store.inviteSeatList.append(userModel)
                    EngineManager.shared.store.inviteSeatMap[request.userId] = Int(request.requestId)
                    EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
                }
                else {
                    EngineManager.shared.roomEngine.responseRemoteRequest(Int(request.requestId), agree: true) {
                    } onError: { _, _ in
                    }
                }
            case .remoteUserOnSeat:
                if EngineManager.shared.store.roomInfo.enableSeatControl {
                    //                    if request.userId == EngineManager.shared.store.currentUser.userId {
                    let alertVC = UIAlertController(title: .inviteSpeakOnStageTitle,
                                                    message: .inviteSpeakOnStageMessage,
                                                    preferredStyle: .alert)
                    let declineAction = UIAlertAction(title: .declineText, style: .cancel) { [weak self] _ in
                        guard let self = self else { return }
                        self.respondUserOnSeat(isAgree: false, requestId: Int(request.requestId))
                    }
                    let sureAction = UIAlertAction(title: .agreeText, style: .default) { [weak self] _ in
                        guard let self = self else { return }
                        self.respondUserOnSeat(isAgree: true, requestId: Int(request.requestId))
                    }
                    alertVC.addAction(declineAction)
                    alertVC.addAction(sureAction)
                    RoomRouter.shared.currentViewController()?.present(alertVC, animated: true, completion: nil)
                    
                    //                    }
                } else {
                    EngineManager.shared.roomEngine.responseRemoteRequest(Int(request.requestId), agree: true) {
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
            guard let reason = param?["reason"] as? TUIChangeReason else { return }
            switch streamType {
            case .cameraStream:
                if userId == EngineManager.shared.store.currentUser.userId {
                    if !hasVideo {
                        if !EngineManager.shared.store.roomInfo.enableVideo && EngineManager.shared.store.currentUser.userRole != .roomOwner {
                            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_MuteLocalVideo,
                                                                   param: ["select": true, "enabled": false])
                        } else {
                            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_MuteLocalVideo, param: ["select": true])
                        }
                        if reason == .byAdmin {
                            RoomRouter.shared.currentViewController()?.view.window?.makeToast(.noticeCameraOffTitleText)
                        }
                    } else {
                        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_MuteLocalVideo, param: ["select": false])
                    }
                }
            case .screenStream:
                EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_SomeoneSharing, param: ["isSomeoneSharing" : hasVideo])
            case .cameraStreamLow: break
            @unknown default: break
            }
        }
        if name == .onUserAudioStateChanged {
            guard let userId = param?["userId"] as? String else { return }
            guard let hasAudio = param?["hasAudio"] as? Bool else { return }
            guard let reason = param?["reason"] as? TUIChangeReason else { return }
            if userId == EngineManager.shared.store.currentUser.userId {
                if !hasAudio {
                    if !EngineManager.shared.store.roomInfo.enableAudio && EngineManager.shared.store.currentUser.userRole != .roomOwner {
                        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_MuteLocalAudio, param: ["select": true, "enabled": false])
                    } else {
                        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_MuteLocalAudio, param: ["select": true])
                    }
                    if reason == .byAdmin {
                        RoomRouter.shared.currentViewController()?.view.window?.makeToast(.noticeMicrophoneOffTitleText)
                    }
                } else {
                    EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_MuteLocalAudio, param: ["select": false])
                }
            }
        }
        
        if name == .onRequestCancelled {
            guard let userId = param?["userId"] as? String else { return }
            EngineManager.shared.store.inviteSeatMap.removeValue(forKey: userId)
            EngineManager.shared.store.inviteSeatList = EngineManager.shared.store.inviteSeatList.filter { userModel in
                userModel.userId != userId
            }
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
        }
        
        if name == .onUserRoleChanged {
            guard let userId = param?["userId"] as? String else { return }
            guard let userRole = param?["userRole"] as? TUIRole else { return }
            let isSelfRoleChanged = userId == EngineManager.shared.store.currentUser.userId
            let isRoomOwnerChanged = userRole == .roomOwner
            if isSelfRoleChanged {
                EngineManager.shared.store.currentUser.userRole = userRole
            }
            if isRoomOwnerChanged {
                EngineManager.shared.store.roomInfo.owner = userId
            }
            if isSelfRoleChanged, isRoomOwnerChanged {
                if EngineManager.shared.store.roomInfo.enableSeatControl {
                    EngineManager.shared.roomEngine.takeSeat(-1, timeout: timeoutNumber) { _, _ in
                        EngineManager.shared.store.currentUser.isOnSeat = true
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
        EngineManager.shared.roomEngine.closeLocalCamera()
        EngineManager.shared.roomEngine.closeLocalMicrophone()
        EngineManager.shared.roomEngine.stopPushLocalAudio()
        EngineManager.shared.roomEngine.stopPushLocalVideo()
        EngineManager.shared.exitRoom {
        } onError: { _, _ in
        }
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
        let roomEngineMap = TUICore.getExtensionInfo(gRoomEngineKey, param: ["roomId": EngineManager.shared.store.roomInfo.roomId])
        guard let roomEngine = roomEngineMap[gRoomEngineKey] else { return UIView(frame: .zero) }
        let map = TUICore.getExtensionInfo(gVideoSeatViewKey, param: ["roomEngine": roomEngine, "roomId": EngineManager.shared.store.roomInfo.roomId])
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
