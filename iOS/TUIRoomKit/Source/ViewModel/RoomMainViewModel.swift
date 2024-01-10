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
    func makeToast(text: String)
    func changeToolBarHiddenState()
    func setToolBarDelayHidden(isDelay: Bool)
    func showExitRoomView()
    func showAlert(title: String?, message: String?, sureTitle:String?, declineTitle: String?, sureBlock: (() -> ())?, declineBlock: (() -> ())?)
    func showBeautyView()
}

class RoomMainViewModel: NSObject {
    weak var viewResponder: RoomMainViewResponder? = nil
    var engineManager: EngineManager {
        EngineManager.createInstance()
    }
    var store: RoomStore {
        engineManager.store
    }
    var roomInfo: TUIRoomInfo {
        store.roomInfo
    }
    var currentUser: UserEntity {
        store.currentUser
    }
    let roomRouter: RoomRouter = RoomRouter.shared
    private var isShownOpenCameraInviteAlert = false
    private var isShownOpenMicrophoneInviteAlert = false
    private var isShownTakeSeatInviteAlert = false
    private weak var localAudioViewModel: LocalAudioViewModel?
    
    override init() {
        super.init()
        subscribeEngine()
    }
    
    func applyConfigs() {
        //如果房间不是自由发言房间并且用户没有上麦，不开启摄像头
        if roomInfo.isSeatEnabled && !currentUser.isOnSeat {
            store.videoSetting.isCameraOpened = false
            return
        }
        let openLocalCameraActionBlock = { [weak self] in
            guard let self = self else { return }
            // FIXME: - 打开摄像头前需要先设置一个view
            self.engineManager.setLocalVideoView(streamType: .cameraStream, view: nil)
            self.engineManager.openLocalCamera()
        }
        if store.videoSetting.isCameraOpened && !roomInfo.isCameraDisableForAllUser {
            if RoomCommon.checkAuthorCamaraStatusIsDenied() {
                openLocalCameraActionBlock()
            } else {
                RoomCommon.cameraStateActionWithPopCompletion { granted in
                    if granted {
                        openLocalCameraActionBlock()
                    }
                }
            }
        }
    }
    
    private func subscribeEngine() {
        EngineEventCenter.shared.subscribeEngine(event: .onRoomDismissed, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onKickedOutOfRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRequestReceived, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onAllUserMicrophoneDisableChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onAllUserCameraDisableChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onKickedOffSeat, observer: self)
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_CurrentUserRoleChanged, responder: self)
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_CurrentUserMuteMessage, responder: self)
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_SetToolBarDelayHidden, responder: self)
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_ChangeToolBarHiddenState, responder: self)
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_ShowExitRoomView, responder: self)
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_ShowBeautyView, responder: self)
    }
    
    private func unsubscribeEngine() {
        EngineEventCenter.shared.unsubscribeEngine(event: .onRoomDismissed, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onKickedOutOfRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onRequestReceived, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onAllUserMicrophoneDisableChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onAllUserCameraDisableChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onKickedOffSeat, observer: self)
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_CurrentUserRoleChanged, responder: self)
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_CurrentUserMuteMessage, responder: self)
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_SetToolBarDelayHidden, responder: self)
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_ChangeToolBarHiddenState, responder: self)
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_ShowExitRoomView, responder: self)
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_ShowBeautyView, responder: self)
    }
    
    func respondUserOnSeat(isAgree: Bool, requestId: String) {
        engineManager.responseRemoteRequest(requestId, agree: isAgree) { [weak self] in
            guard let self = self else { return }
            self.engineManager.deleteInviteSeatUser(self.currentUser.userId)
        } onError: { code, message in
            debugPrint("responseRemoteRequest:code:\(code),message:\(message)")
        }
    }
    
    func hideLocalAudioView() {
        localAudioViewModel?.hideLocalAudioView()
    }
    
    func showLocalAudioView() {
        localAudioViewModel?.showLocalAudioView()
    }
    
    deinit {
        unsubscribeEngine()
        debugPrint("deinit \(self)")
    }
}

extension RoomMainViewModel: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        if name == .onRoomDismissed {
            engineManager.destroyEngineManager()
            viewResponder?.showAlert(title: .destroyAlertText, message: nil, sureTitle: .alertOkText, declineTitle: nil, sureBlock: { [weak self] in
                guard let self = self else { return }
                self.roomRouter.dismissAllRoomPopupViewController()
                self.roomRouter.popToRoomEntranceViewController()
            }, declineBlock: nil)
        }
        
        if name == .onKickedOutOfRoom {
            engineManager.destroyEngineManager()
            viewResponder?.showAlert(title: .kickOffTitleText, message: nil, sureTitle: .alertOkText, declineTitle: nil , sureBlock: { [weak self] in
                guard let self = self else { return }
                self.roomRouter.dismissAllRoomPopupViewController()
                self.roomRouter.popToRoomEntranceViewController()
            }, declineBlock: nil)
        }
        
        if name == .onAllUserMicrophoneDisableChanged {
            guard let isDisable = param?["isDisable"] as? Bool else { return }
            if isDisable {
                RoomRouter.makeToastInCenter(toast: .allMuteAudioText, duration: 1.5)
            } else {
                RoomRouter.makeToastInCenter(toast: .allUnMuteAudioText, duration: 1.5)
            }
        }
        
        if name == .onAllUserCameraDisableChanged {
            guard let isDisable = param?["isDisable"] as? Bool else { return }
            if isDisable {
                RoomRouter.makeToastInCenter(toast: .allMuteVideoText, duration: 1.5)
            } else {
                RoomRouter.makeToastInCenter(toast: .allUnMuteVideoText, duration: 1.5)
            }
        }
        
        if name == .onKickedOffSeat {
            guard let userId = param?["userId"] as? String else { return }
            viewResponder?.makeToast(text: .kickedOffSeat)
        }
        
        if name == .onRequestReceived {
            guard let request = param?["request"] as? TUIRequest else { return }
            switch request.requestAction {
            case .openRemoteCamera:
                guard !isShownOpenCameraInviteAlert else { return }
                viewResponder?.showAlert(title: .inviteTurnOnVideoText, message: nil, sureTitle: .agreeText, declineTitle: .declineText, sureBlock: { [weak self] in
                    guard let self = self else { return }
                    self.isShownOpenCameraInviteAlert = false
                    // FIXME: - 打开摄像头前需要先设置一个view
                    self.engineManager.setLocalVideoView(streamType: .cameraStream, view: nil)
                    // 需要先判断是否有摄像头权限
                    if RoomCommon.checkAuthorCamaraStatusIsDenied() {
                        self.engineManager.responseRemoteRequest(request.requestId, agree: true)
                    } else {
                        //如果没有摄像头权限，需要先去打开摄像头权限
                        RoomCommon.cameraStateActionWithPopCompletion { [weak self] granted in
                            guard let self = self else { return }
                            self.engineManager.responseRemoteRequest(request.requestId, agree: granted)
                        }
                    }
                }, declineBlock: { [weak self] in
                    guard let self = self else { return }
                    self.isShownOpenCameraInviteAlert = false
                    self.engineManager.responseRemoteRequest(request.requestId, agree: false)
                })
                isShownOpenCameraInviteAlert = true
            case .openRemoteMicrophone:
                guard !isShownOpenMicrophoneInviteAlert else { return }
                viewResponder?.showAlert(title: .inviteTurnOnAudioText, message: nil, sureTitle: .agreeText, declineTitle: .declineText, sureBlock: { [weak self] in
                    guard let self = self else { return }
                    self.isShownOpenMicrophoneInviteAlert = false
                    if RoomCommon.checkAuthorMicStatusIsDenied() {
                        self.engineManager.responseRemoteRequest(request.requestId, agree: true)
                    } else {
                        RoomCommon.micStateActionWithPopCompletion { [weak self] granted in
                            guard let self = self else { return }
                            self.engineManager.responseRemoteRequest(request.requestId, agree: granted)
                        }
                    }
                }, declineBlock: { [weak self] in
                    guard let self = self else { return }
                    self.isShownOpenMicrophoneInviteAlert = false
                    self.engineManager.responseRemoteRequest(request.requestId, agree: false)
                })
                isShownOpenMicrophoneInviteAlert = true
            case .invalidAction:
                break
            case .connectOtherRoom:
                engineManager.responseRemoteRequest(request.requestId, agree: true)
            case .remoteUserOnSeat:
                    guard roomInfo.isSeatEnabled && !isShownTakeSeatInviteAlert else { return }
                    viewResponder?.showAlert(title: .inviteSpeakOnStageTitle, message: .inviteSpeakOnStageMessage, sureTitle: .agreeSeatText, declineTitle: .declineText, sureBlock: { [weak self] in
                        guard let self = self else { return }
                        self.isShownTakeSeatInviteAlert = false
                        self.respondUserOnSeat(isAgree: true, requestId: request.requestId)
                    }, declineBlock: { [weak self] in
                        guard let self = self else { return }
                        self.isShownTakeSeatInviteAlert = false
                        self.respondUserOnSeat(isAgree: false, requestId: request.requestId)
                    })
                    isShownTakeSeatInviteAlert = true
                
            default: break
            }
        }
    }
}

extension RoomMainViewModel: RoomMainViewFactory {
    func makeTopView() -> TopView {
        let viewModel = TopViewModel()
        let topView = TopView(viewModel: viewModel)
        topView.backgroundColor = UIColor(0x0F1014)
        return topView
    }
    
    func makeBottomView() -> BottomView {
        let viewModel = BottomViewModel()
        let bottomView = BottomView(viewModel: viewModel)
        return bottomView
    }
    
    func makeVideoSeatView() -> UIView {
        let videoSeatView = TUIVideoSeatView()
        videoSeatView.backgroundColor = UIColor(0x0F1014)
        return videoSeatView
    }
    
    func makeRaiseHandNoticeView() -> UIView {
        let raiseHandNoticeView = RaiseHandNoticeView()
        //只有举手发言房间，并且用户不是房主时才会显示举手上麦提示
        if roomInfo.isSeatEnabled, currentUser.userId != roomInfo.ownerId, store.isShownRaiseHandNotice {
            raiseHandNoticeView.isHidden = false
        } else {
            raiseHandNoticeView.isHidden = true
        }
        return raiseHandNoticeView
    }
    
    func makeLocalAudioView() -> UIView {
        let localAudioViewModel  = LocalAudioViewModel()
        localAudioViewModel.hideLocalAudioView()
        let view = LocalAudioView(viewModel: localAudioViewModel)
        self.localAudioViewModel = localAudioViewModel
        return view
    }
    
    func makeBeautyView() -> UIView? {
        let beautyManager = engineManager.getBeautyManager()
        let beautyList = TUICore.getExtensionList(TUICore_TUIBeautyExtension_BeautyView, param: [
            TUICore_TUIBeautyExtension_BeautyView_BeautyManager: beautyManager,])
        guard beautyList.count > 0 else { return nil }
        guard let view = beautyList[0].data?[TUICore_TUIBeautyExtension_BeautyView_View] as? UIView else { return nil }
        view.isHidden = true
        return view
    }
}

extension RoomMainViewModel: RoomKitUIEventResponder {
    func onNotifyUIEvent(key: EngineEventCenter.RoomUIEvent, Object: Any?, info: [AnyHashable : Any]?) {
        switch key{
        case .TUIRoomKitService_CurrentUserRoleChanged:
            guard let userRole = info?["userRole"] as? TUIRole else { return }
            switch userRole {
            case .roomOwner:
                viewResponder?.showAlert(title: .haveBecomeMasterText, message: nil,sureTitle: .alertOkText, declineTitle: nil, sureBlock: nil, declineBlock: nil)
            case .administrator:
                if roomInfo.isSeatEnabled, !currentUser.isOnSeat {
                    viewResponder?.showAlert(title: .haveBecomeAdministratorText, message: .setAsAdministratorMessageText, sureTitle: .joinStageImmediatelyText, declineTitle: .notYetJoinStageText, sureBlock: { [weak self] in
                        guard let self = self else { return }
                        self.engineManager.takeSeat()
                    }, declineBlock: nil)
                } else {
                    viewResponder?.showAlert(title: .haveBecomeAdministratorText, message: nil,sureTitle: .alertOkText, declineTitle: nil, sureBlock: nil, declineBlock: nil)
                }
            default: break
            }
        case .TUIRoomKitService_CurrentUserMuteMessage:
            guard let isMute = info?["isMute"] as? Bool else { return }
            viewResponder?.makeToast(text: isMute ? .messageTurnedOffText : .messageTurnedOnText)
        case .TUIRoomKitService_ChangeToolBarHiddenState:
            viewResponder?.changeToolBarHiddenState()
        case .TUIRoomKitService_SetToolBarDelayHidden:
            guard let isDelay = info?["isDelay"] as? Bool else { return }
            viewResponder?.setToolBarDelayHidden(isDelay: isDelay)
        case .TUIRoomKitService_ShowExitRoomView:
            viewResponder?.showExitRoomView()
        case .TUIRoomKitService_ShowBeautyView:
            viewResponder?.showBeautyView()
        default: break
        }
    }
}

private extension String {
    static var kickOffTitleText: String {
        localized("TUIRoom.kick.off.title")
    }
    static var destroyAlertText: String {
        localized("TUIRoom.room.destroy")
    }
    static var inviteTurnOnAudioText: String {
        localized("TUIRoom.invite.turn.on.audio")
    }
    static var inviteTurnOnVideoText: String {
        localized("TUIRoom.invite.turn.on.video")
    }
    static var inviteSpeakOnStageTitle: String {
        localized("TUIRoom.invite.to.speak")
    }
    static var inviteSpeakOnStageMessage: String {
        localized("TUIRoom.agree.to.speak")
    }
    static var messageTurnedOffText: String {
        localized("TUIRoom.homeowners.notice.message.turned.off")
    }
    static var messageTurnedOnText: String {
        localized("TUIRoom.homeowners.notice.message.turned.on")
    }
    static var haveBecomeMasterText: String {
        localized("TUIRoom.have.become.master")
    }
    static var haveBecomeAdministratorText: String {
        localized("TUIRoom.have.become.administrator")
    }
    static var kickedOffLineText: String {
        localized("TUIRoom.kicked.off.line")
    }
    static var alertOkText: String {
        localized("TUIRoom.ok")
    }
    static var declineText: String {
        localized("TUIRoom.decline")
    }
    static var agreeText: String {
        localized("TUIRoom.agree")
    }
    static var agreeSeatText: String {
        localized("TUIRoom.agree.seat")
    }
    static var allMuteAudioText: String {
        localized("TUIRoom.all.mute.audio.prompt")
    }
    static var allMuteVideoText: String {
        localized("TUIRoom.all.mute.video.prompt")
    }
    static var allUnMuteAudioText: String {
        localized("TUIRoom.all.unmute.audio.prompt")
    }
    static var allUnMuteVideoText: String {
        localized("TUIRoom.all.unmute.video.prompt")
    }
    static var notYetJoinStageText: String {
        localized("TUIRoom.not.yet.join.stage")
    }
    static var joinStageImmediatelyText: String {
        localized("TUIRoom.join.stage.immediately")
    }
    static var setAsAdministratorMessageText: String {
        localized("TUIRoom.set.as.administrator.message")
    }
    static var kickedOffSeat: String {
        localized("TUIRoom.kicked.off.seat")
    }
}
