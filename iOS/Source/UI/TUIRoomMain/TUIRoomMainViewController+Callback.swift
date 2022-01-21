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
    /**
     * 踢人
     *
     */
    func onKickOffUser(userInfo: TUIRoomUserInfo) {
        // 被踢者，会主动下麦
    }

    /**
     * 获取列表
     *
     */
    func getAttendeeList() -> [TUIRoomAttendeeModel] {
        return attendeeList
    }

    // TUIRoomCellDelegate
    /**
     * 获取view
     *
     */
    func getRenderView(model: TUIRoomAttendeeModel, type: TUIRoomStreamType = .camera) -> TUIRoomAttendeeRenderView? {
        return getRenderViewByUserid(userId: model.userId(), type: type)
    }

    // TUIRoomCoreDelegate

    func onError(_ code: Int, message: String) {
    }

    /**
     * 房间被销毁的回调，主持人退房时，房间内的所有用户都会收到此通知
     *
     */
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
    }

    /**
     * 用户音量大小回调通知
     *
     * @param userId 本地或远端的用户标识。
     * @param volume 用户的音量大小，取值范围 0 - 100。
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
     * 主持人更改回调
     *
     * @param previousUserId 更改前的主持人
     * @param currentUserId  更改后的主持人
     */
    func onRoomMasterChanged(_ previousUserId: String, currentUserId: String) {
        // 清理上一个房主状态
        if let homeownerModel = attendeeMap[previousUserId] {
            homeownerModel.userInfo.role = .anchor
        }
        // 更新当前房主状态
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
     * 远端用户进入房间回调
     *
     * @param userId 新进房成员 ID
     */
    func onRemoteUserEnter(_ userId: String) {
        userEnterRoom(userId)
    }

    /**
     * 成员退房通知
     *
     * @param userId 退房成员 ID
     */
    func onRemoteUserLeave(_ userId: String) {
        onUserLeaveRoom(userId)
    }

    /**
     * 成员 开启/关闭 摄像头的通知
     *
     * @param userId    用户ID
     * @param available  true：用户打开摄像头；false：用户关闭摄像头
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
     * 成员 开启/关闭 视频分享的通知
     *
     * @param userId    用户ID
     * @param available 是否有屏幕分享流数据
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
     * 成员开启/关闭麦克风的通知
     *
     * @param userId    用户ID
     * @param available 是否有音频数据
     */
    func onRemoteUserAudioAvailable(_ userId: String, available: Bool) {
        let noti = Notification(name: Notification.Name("kMemberStateRefresh"))
        NotificationCenter.default.post(noti)
        let renderView = getRenderViewByUserid(userId: userId)
        renderView?.refreshAudio(isAudioAvailable: available)
    }

    /**
     * 远端用户开始发言（即麦上）
     *
     * 当您收到此通知时，表示该用户发言成功
     *
     * @param userId 用户ID
     */
    func onRemoteUserEnterSpeechState(_ userId: String) {
        enterSpeechState(userId)
        let noti = Notification(name: Notification.Name("kMemberListRefresh"))
        NotificationCenter.default.post(noti)
    }

    /**
     * 远端用户结束发言
     *
     * 当您收到此通知时，表示该用户已经下麦。
     *
     * @param userId 用户ID
     */
    func onRemoteUserExitSpeechState(_ userId: String) {
        exitSpeechState(userId)
        let noti = Notification(name: Notification.Name("kMemberListRefresh"))
        NotificationCenter.default.post(noti)
    }

    /**
     * 主持人设置禁用麦克风回调
     *
     * @param muted  true,用户麦克风被禁用  false用户麦克风打开
     *
     * @param userId 主持人用户ID
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
     * 主持人设置禁用摄像头回调
     *
     * @param muted  true,用户摄像头被禁用  false用户摄像头打开
     *
     * @param userId 主持人用户ID
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
     * 主持人踢人的回调，主持人/管理员 调用kickOffUser，用户接收到踢人事件的回调
     *
     * @param userId 主持人/管理员 userId
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
     * 网络质量回调
     *
     * @param localQuality  上行网络质量
     * @param remoteQuality 下行网络质量
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
     * 录屏开始通知
     */
    func onScreenCaptureStarted() {
        TUIRoomCore.shareInstance().stopCameraPreview()
        currentUser.userInfo.isVideoAvailable = false
        muteVideoButton.isSelected = true
        let renderView = getRenderViewByUserid(userId: currentUser.userId())
        renderView?.refreshVideo(isVideoAvailable: false)
    }

    /**
     * 录屏停止通知
     *
     * @param reason 停止原因，0：用户主动停止；1：被其他应用抢占导致停止
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
     * 收到文本消息
     *
     * @param userId 用户ID
     * @param message  文本消息
     */
    func onReceiveChatMessage(_ userId: String, message: String) {
        guard let userInfo = TUIRoomUserManage.getUser(userId) else {
            return
        }
        debugPrint("收到\"\(userInfo.userName)\"发的消息：\(message)")
    }

    /// TUIRoomApplySpeech
    /**
     * 用户收到主持人发言邀请回调
     *
     * 主持人调用sendSpeechInvitation接口邀请用户发言后，用户收到的回调，用户需要进行发言
     *
     * @param userId 主持人用户ID
     */
    func onReceiveSpeechInvitation(_ userId: String) {
        debugPrint("onReceiveSpeechInvitation:\(userId)")
    }

    /**
     * 用户收到主持人取消发言邀请回调
     *
     * 主持人调用cancelSpeechInvitation接口取消邀请用户发言后，用户收到的回调
     *
     * @param userId 主持人用户ID
     */
    func onReceiveInvitationCancelled(_ userId: String) {
        debugPrint("onReceiveInvitationCancelled:\(userId)")
    }

    /**
     * 主持人收到用户同意邀请发言的回调
     *
     * 用户调用replySpeechInvitation接口回应主持人发言邀请时，主持人收到的回调
     *
     * @param userId  用户ID
     * @param agree   是否同意发言 true为同意， false为不同意
     */
    func onReceiveReply(toSpeechInvitation userId: String, agree: Bool) {
        debugPrint("onReceiveReply:\(agree)")
    }

    /**
     * 用户申请发言回调
     *
     * TUIRoomCoreDef.SpeechMode.APPLY_SPEECH，用户调用sendSpeechApplication接口向主持人申请发言时，
     * 主持人收到的回调，主持人需要操作并调用replySpeechApplication接口对申请进行回应
     *
     * @param userId 用户ID
     */
    func onReceiveSpeechApplication(_ userId: String) {
        debugPrint("onReceiveSpeechApplication:\(userId)")
    }
    
    /**
     * 用户取消申请发言回调
     * TUIRoomCoreDef.SpeechMode.APPLY_SPEECH，用户调用cancelApplication接口取消申请发言时，主持人收到的回调
     *
     * @param userId 用户ID
    */
    func onSpeechApplicationCancelled(_ userId: String) {
        debugPrint("onSpeechApplicationCancelled:\(userId)")
    }
    
    /**
     * 主持人同意发言申请回调
     *
     * 在TUIRoomCoreDef.SpeechMode.APPLY_SPEECH模式下，主持人调用replySpeechApplication接口回应用户申请发言时，
     * 用户收到的回调，用户根据主持人是否同意决定是否可以发言
     *
     * @param agree  是否同意发言 true为同意， false为不同意
     */
    func onReceiveReply(toSpeechApplication agree: Bool, userId: String) {
        debugPrint("onReceiveReply:\(agree)")
    }

    /**
     * 主持人禁止申请发言回调
     *
     * @param isForbidden true,发言申请被禁用, false 可以申请发言
     *
     * @param userId 主持人用户ID
     */
    func onSpeechApplicationForbidden(_ isForbidden: Bool, userId: String) {
        debugPrint("onSpeechApplicationForbidden:\(isForbidden)")
    }

    /**
     * 主持人更改聊天室是否禁言回调
     *
     * @param muted  true,聊天室不可以发消息  false聊天室可以发消息
     *
     * @param userId 主持人用户ID
     */
    func onChatRoomMuted(_ muted: Bool, userId: String) {
        debugPrint("onChatRoomMuted:\(muted)")
    }

    /**
     * 主持人开始点名，成员收到的回调
     *
     * @param userId 主持人用户ID
     */
    func onCallingRollStarted(_ userId: String) {
        debugPrint("onCallingRollStarted:\(userId)")
    }

    /**
     * 主持人结束点名，成员收到的回调
     *
     * @param userId 主持人用户ID
     */
    func onCallingRollStopped(_ userId: String) {
        debugPrint("onCallingRollStopped:\(userId)")
    }

    /**
     * 成员回复点名，主持人收到的回调
     *
     * @param userId 用户id
     */
    func onMemberReplyCallingRoll(_ userId: String) {
        debugPrint("onMemberReplyCallingRoll:\(userId)")
    }

    /**
     * 成员被请求下麦的回调
     *
     * 主持人调用sendOffSpeaker接口请求用户下麦后，用户收到的回调，用户需要下麦
     *
     * @param userId 主持人用户ID
     */
    func onOrdered(toExitSpeechState userId: String) {
        debugPrint("onOrdered:\(userId)")
    }
    
    /**
     * 技术指标统计回调
     *
     * 如果您是熟悉音视频领域相关术语，可以通过这个回调获取 SDK 的所有技术指标。
     * 如果您是首次开发音视频相关项目，可以只关注 onNetworkQuality 回调，每2秒回调一次。
     *
     * @param statistics 统计数据，包括本地和远程的
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

/// MARK: 获取当前controller
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
