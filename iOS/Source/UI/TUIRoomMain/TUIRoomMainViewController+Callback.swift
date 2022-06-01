//
//  TUIRoomMainViewController+Callback.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//
// @escaping
import CoreMedia
import Foundation
import UIKit
extension TUIRoomMainViewController: TUIRoomCoreDelegate, TUIRoomMemberVCDelegate, TUIRoomCellDelegate {
    
    
    /// TUIRoomMemberVCDelegate
    func onKickOffUser(userInfo: TUIRoomUserInfo) {
        // The removed user will become a listener
    }
    
    func getAttendeeList() -> [TUIRoomAttendeeModel] {
        return attendeeList
    }
    
    // TUIRoomCellDelegate
    func getRenderView(model: TUIRoomAttendeeModel, type: TUIRoomStreamType = .camera) -> TUIRoomAttendeeRenderView? {
        return getRenderViewByUserid(userId: model.userId(), type: type)
    }
    
    // TUIRoomCoreDelegate
    func onError(_ code: Int, message: String) {
    }
    
    func onDestroyRoom() {
        interruptClearRoom()
        let alertVC = UIAlertController(title: .destroyAlertText, message: nil, preferredStyle: .alert)
        let sureAction = UIAlertAction(title: .alertOkText, style: .default) { [weak self] _ in
            guard let self = self else { return }
            self.interruptQuitRoom()
        }
        sureAction.setTextColor(UIColor.red)
        alertVC.addAction(sureAction)
        UIViewController.getCurrentViewController()?.present(alertVC, animated: true, completion: nil)
#if RTCube_APPSTORE
        guard roomInfo.ownerId == currentUser.userId() else { return }
        let selector = NSSelectorFromString("showAlertUserLiveTimeOut")
        if UIViewController.responds(to: selector) {
            UIViewController.perform(selector)
        }
#endif
    }
    
    /**
     * Callback for user volume level
     *
     * - parameter userId Local or remote user ID
     * - parameter volume User volume level. Value range: 0–100
     */
    func onUserVoiceVolume(_ userId: String, volume: Int) {
        let render = getRenderViewByUserid(userId: userId)
        render?.attendeeModel.audioVolume = volume
        let volumeState = volume > 20
        if volumeState != render?.attendeeModel.volumeState {
            render?.attendeeModel.volumeState = volumeState
            render?.refreshVolumeProgress()
        }
    }
    
    
    /**
     * The host was changed.
     *
     * - parameter previousUserId Original host
     * - parameter currentUserId  New host
     */
    func onRoomMasterChanged(_ previousUserId: String, currentUserId: String) {
        // Clear the status of the previous room owner
        if let homeownerModel = attendeeMap[previousUserId] {
            homeownerModel.userInfo.role = .anchor
        }
        // Update the status of the current room owner
        if roomInfo.isHomeowner() {
            currentUser.userInfo.isRemoteVideoMuted = false
            currentUser.userInfo.isRemoteAudioMuted = false
            let noti = Notification(name: Notification.Name("kResetView"))
            NotificationCenter.default.post(noti)
        } else {
            attendeeList = attendeeList.filter { (model) -> Bool in
                model.userInfo.userId != currentUserId
            }
            if let userModel = attendeeMap[currentUserId] {
                attendeeList.insert(userModel, at: 0)
            }
        }
        reloadData()
    }
    
    /**
     * A remote user entered the room.
     *
     * - parameter userId User ID of new member
     */
    func onRemoteUserEnter(_ userId: String) {
        userEnterRoom(userId)
    }
    
    /**
     * A user exited the room
     *
     * - parameter userId User ID of exiting member
     */
    func onRemoteUserLeave(_ userId: String) {
        onUserLeaveRoom(userId)
    }
    
    /**
     * A user enabled/disabled the camera
     *
     * - parameter userId    User ID
     * - parameter available  true: The camera is enabled; false: The camera is disabled
     */
    func onRemoteUserCameraAvailable(_ userId: String, available: Bool) {
        let noti = Notification(name: Notification.Name("kMemberStateRefresh"))
        NotificationCenter.default.post(noti)
        let renderView = getRenderViewByUserid(userId: userId)
        if available {
            if (renderView?.superview) != nil {
                if let view =  renderView {
                    TUIRoomCore.shareInstance().startRemoteView(userId, view: view, streamType: .camera) { code, message in
                        debugPrint("startRemoteView" + "\(code)" + message)
                    }
                }
            }
        } else {
            TUIRoomCore.shareInstance().stopRemoteView(userId, streamType: .camera) { code, message in
                debugPrint("stopRemoteView" + "\(code)" + message)
            }
        }
        renderView?.refreshVideo(isVideoAvailable: available)
    }
    
    /**
     * A user enabled/disabled screen sharing.
     *
     * - parameter userId    User ID
     * - parameter available Whether screen sharing data is available
     */
    func onRemoteUserScreenVideoAvailable(_ userId: String, available: Bool) {
        if available {
            if shareAttendeeList.count >= 1 {
                return
            }
            clearUserSource(userId, type: .screen)
            if let userModel = attendeeMap[userId] {
                shareAttendeeList.append(userModel)
            } else if let userInfo = TUIRoomUserManage.getUser(userId) {
                let userModel = TUIRoomAttendeeModel()
                userModel.userInfo = userInfo
                attendeeMap[userId] = userModel
                shareAttendeeList.append(userModel)
            }
            reloadData()
            let noti = Notification(name: Notification.Name("otherShareScreen"))
            NotificationCenter.default.post(noti)
        } else {
            TUIRoomCore.shareInstance().stopRemoteView(userId, streamType: .screen) { code, message in
                debugPrint("stopRemoteView" + "\(code)" + message)
            }
            clearUserSource(userId, type: .screen)
            reloadData()
        }
    }
    
    /**
     * A user enabled/disabled the mic.
     *
     * - parameter userId    User ID
     * - parameter available Whether audio data is available
     */
    func onRemoteUserAudioAvailable(_ userId: String, available: Bool) {
        let noti = Notification(name: Notification.Name("kMemberStateRefresh"))
        NotificationCenter.default.post(noti)
        let renderView = getRenderViewByUserid(userId: userId)
        renderView?.refreshAudio(isAudioAvailable: available)
    }
    
    /**
     * A remote user started speaking (or became a speaker)
     *
     * This notification will be received if a user speaks.
     *
     * - parameter userId User ID
     */
    func onRemoteUserEnterSpeechState(_ userId: String) {
        enterSpeechState(userId)
        let noti = Notification(name: Notification.Name("kMemberListRefresh"))
        NotificationCenter.default.post(noti)
    }
    
    /**
     * A remote user stopped speaking
     *
     * This notification will be received after a user stops speaking.
     *
     * - parameter userId User ID
     */
    func onRemoteUserExitSpeechState(_ userId: String) {
        exitSpeechState(userId)
        let noti = Notification(name: Notification.Name("kMemberListRefresh"))
        NotificationCenter.default.post(noti)
    }
    
    /**
     * The host disabled the mic
     *
     * - parameter muted  true: The user's mic is disabled; false: The user's mic is enabled
     *
     * - parameter userId User ID of host
     */
    func onMicrophoneMuted(_ muted: Bool, userId: String) {
        currentUser.userInfo.isRemoteAudioMuted = muted
        if muted {
            muteAudioButton.isSelected = false
            muteAudioButton.isEnabled = false
            TUIRoomCore.shareInstance().stopLocalAudio()
            view.window?.makeToast(.noticeMicrophoneOffTitleText)
            let render = getRenderViewByUserid(userId: currentUser.userId())
            currentUser.volumeState = false
            render?.refreshVolumeProgress()
        } else {
            if currentUser.isAudioOpen() && !muteAudioButton.isSelected {
                muteAudioButton.isEnabled = true
                return
            }
            view.window?.makeToast(.noticeMicrophoneOnTitleText)
            muteAudioButton.isEnabled = true
            muteAudioButton.isSelected = true
        }
    }
    
    /**
     * The host disabled the camera
     *
     * - parameter muted  true: The user's camera is disabled; false: The user's camera is enabled
     *
     * - parameter userId User ID of host
     */
    func onCameraMuted(_ muted: Bool, userId: String) {
        currentUser.userInfo.isRemoteVideoMuted = muted
        if muted {
            muteVideoButton.isSelected = false
            muteVideoButton.isEnabled = false
            TUIRoomCore.shareInstance().stopCameraPreview()
            view.window?.makeToast(.noticeCameraOffTitleText)
            let render = getRenderViewByUserid(userId: currentUser.userId())
            render?.refreshVideo(isVideoAvailable: currentUser.isVideoOpen())
        } else {
            if currentUser.isVideoOpen() && !muteVideoButton.isSelected {
                muteVideoButton.isEnabled = true
                return
            }
            view.window?.makeToast(.noticeCameraOnTitleText)
            muteVideoButton.isEnabled = true
            muteVideoButton.isSelected = true
        }
    }
    
    /**
     * Callback for user removed by host. The user will receive this callback after the host/admin calls `kickOffUser`.
     *
     * - parameter userId Host/Admin user ID
     */
    func onReceiveKickedOff(_ userId: String) {
        interruptClearRoom()
        let alertVC = UIAlertController(title: .kickOffTitleText, message: nil, preferredStyle: .alert)
        let sureAction = UIAlertAction(title: .alertOkText, style: .default) { [weak self] _ in
            guard let self = self else { return }
            self.interruptQuitRoom()
        }
        alertVC.addAction(sureAction)
        UIViewController.getCurrentViewController()?.present(alertVC, animated: true, completion: nil)
    }
    
    /**
     * Callback for network quality
     *
     * - parameter localQuality  Upstream network quality
     * - parameter remoteQuality Downstream network quality
     */
    func onNetworkQuality(_ localQuality: TRTCQualityInfo, remoteQuality: [TRTCQualityInfo]) {
        let render = getRenderViewByUserid(userId: currentUser.userId())
        render?.attendeeModel.networkQuality = localQuality.quality.rawValue
        render?.refreshSignalView()
        for remote in remoteQuality {
            let render = getRenderViewByUserid(userId: remote.userId ?? "")
            render?.attendeeModel.networkQuality = localQuality.quality.rawValue
            render?.refreshSignalView()
        }
    }
    
    /**
     * Screen sharing started
     */
    func onScreenCaptureStarted() {
        TUIRoomCore.shareInstance().stopCameraPreview()
        currentUser.userInfo.isVideoAvailable = false
        muteVideoButton.isSelected = true
        let renderView = getRenderViewByUserid(userId: currentUser.userId())
        renderView?.refreshVideo(isVideoAvailable: false)
    }
    
    /**
     * Screen sharing stopped
     *
     * - parameter reason Reason for stop. 0: The user stopped screen sharing; 1: Screen sharing stopped due to preemption by another application
     */
    func onScreenCaptureStopped(_ reason: Int) {
        if #available(iOS 11.0, *) {
            TUIRoomCore.shareInstance().stopScreenCapture()
        }
        if !currentUser.userInfo.isRemoteVideoMuted {
            currentUser.userInfo.isVideoAvailable = true
            muteVideoButton.isSelected = false
            guard let renderView = getRenderViewByUserid(userId: currentUser.userId()) else {
                return
            }
            renderView.refreshVideo(isVideoAvailable: true)
            TUIRoomCore.shareInstance().startCameraPreview(!switchCameraButton.isSelected, view: renderView)
        }
    }
    
    /**
     * A text message was received.
     *
     * - parameter userId User ID
     * - parameter message  Text chat message
     */
    func onReceiveChatMessage(_ userId: String, message: String) {
        guard let userInfo = TUIRoomUserManage.getUser(userId) else {
            return
        }
        debugPrint("收到\"\(userInfo.userName)\"发的消息：\(message)")
    }
    
    /// TUIRoomApplySpeech
    /**
     * A user received an invitation to speak from the host.
     *
     * The host called the `sendSpeechInvitation` API to invite the user to speak.
     *
     * - parameter userId User ID of host
     */
    func onReceiveSpeechInvitation(_ userId: String) {
        debugPrint("onReceiveSpeechInvitation:\(userId)")
    }
    
    /**
     * The host canceled the mic-on invitation.
     *
     * The host called the `cancelSpeechInvitation` API to cancel the invitation to speak sent to the user.
     *
     * - parameter userId User ID of host
     */
    func onReceiveInvitationCancelled(_ userId: String) {
        debugPrint("onReceiveInvitationCancelled:\(userId)")
    }
    
    /**
     * Callback for request to speak
     *
     * A user called the `sendSpeechApplication` API to request to speak in `TUIRoomCoreDef.SpeechMode.APPLY_SPEECH` mode.
     * The host needs to process the request and call the `replySpeechApplication` API to respond to the request.
     *
     * - parameter userId User ID
     */
    func onReceiveSpeechApplication(_ userId: String) {
        debugPrint("onReceiveSpeechApplication:\(userId)")
    }
    
    /**
     * A user canceled a request to speak.
     * A user called the `cancelApplication` API to cancel their request to speak in `TUIRoomCoreDef.SpeechMode.APPLY_SPEECH` mode.
     *
     * - parameter userId User ID
     */
    func onSpeechApplicationCancelled(_ userId: String) {
        debugPrint("onSpeechApplicationCancelled:\(userId)")
    }
    
    /**
     * The host disabled requests to speak.
     *
     * - parameter isForbidden true: Users cannot request to speak; false: Requests to speak are allowed
     *
     * - parameter userId User ID of host
     */
    func onSpeechApplicationForbidden(_ isForbidden: Bool, userId: String) {
        debugPrint("onSpeechApplicationForbidden:\(isForbidden)")
    }
    
    /**
     * The host muted/unmuted the room
     *
     * - parameter muted  true: No messages can be sent in the chat room; false: Messages can be sent in the chat room
     *
     * - parameter userId User ID of host
     */
    func onChatRoomMuted(_ muted: Bool, userId: String) {
        debugPrint("onChatRoomMuted:\(muted)")
    }
    
    /**
     * The host started a roll call.
     *
     * - parameter userId User ID of host
     */
    func onCallingRollStarted(_ userId: String) {
        debugPrint("onCallingRollStarted:\(userId)")
    }
    
    /**
     * The anchor ended a roll call.
     *
     * - parameter userId User ID of host
     */
    func onCallingRollStopped(_ userId: String) {
        debugPrint("onCallingRollStopped:\(userId)")
    }
    
    /**
     * A user replied to a roll call.
     *
     * - parameter userId User ID
     */
    func onMemberReplyCallingRoll(_ userId: String) {
        debugPrint("onMemberReplyCallingRoll:\(userId)")
    }
    
    /**
     * A user was asked to stop speaking.
     *
     * The host called the `sendOffSpeaker` API to request the user to stop speaking.
     *
     * - parameter userId User ID of host
     */
    func onOrdered(toExitSpeechState userId: String) {
        debugPrint("onOrdered:\(userId)")
    }
    
    /**
     * Callback for technical metric statistics
     *
     * If you are familiar with audio/video terms, you can use this callback to get all technical metrics of the SDK.
     * If you are developing an audio/video project for the first time, you can focus only on the `onNetworkQuality` callback, which is triggered once every two seconds.
     *
     * - parameter statistics Statistics of local and remote users
     */
    func onStatistics(_ statistics: TRTCStatistics) {
        debugPrint("onStatistics:\(statistics)")
    }
    
}

/// MARK: - internationalization string
private extension String {
    static let destroyAlertText = tuiRoomLocalize("TUIRoom.room.destroy")
    static let alertOkText = tuiRoomLocalize("TUIRoom.ok")
    static let kickOffTitleText = tuiRoomLocalize("TUIRoom.kick.off.title")
    
    static let noticeCameraOffTitleText = tuiRoomLocalize("TUIRoom.homeowners.notice.camera.turned.off")
    static let noticeCameraOnTitleText = tuiRoomLocalize("TUIRoom.homeowners.notice.camera.turned.on")
    static let noticeMicrophoneOffTitleText = tuiRoomLocalize("TUIRoom.homeowners.notice.microphone.turned.off")
    static let noticeMicrophoneOnTitleText = tuiRoomLocalize("TUIRoom.homeowners.notice.microphone.turned.on")
}

private extension UIViewController {
    class func getCurrentViewController(base: UIViewController? = UIApplication.shared.keyWindow?.rootViewController) -> UIViewController? {
        if let nav = base as? UINavigationController {
            return getCurrentViewController(base: nav.visibleViewController)
        }
        if let tab = base as? UITabBarController {
            return getCurrentViewController(base: tab.selectedViewController)
        }
        if let presented = base?.presentedViewController {
            return getCurrentViewController(base: presented)
        }
        return base
    }
}
