//
//  RoomMainViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import TUICore
import TUIRoomEngine
import UIKit
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class RoomMainViewController: UIViewController {
    var roomId: String
    var roomPresenter: RoomPresenter
    var roomInfo: RoomInfo {
        return EngineManager.shared.getRoomInfo(roomId: roomId)
    }
    
    var userListController: UIViewController?
    var settingViewController: UIViewController?
    var orientation: Bool

    lazy var topMenu: UIView = {
        let map = TUICore.getExtensionInfo(gTopViewKey, param: ["roomId": roomId, "roomPresent": roomPresenter])
        guard var view = map[gTopViewKey] as? UIView else { return UIView() }
        return view
    }()

    lazy var bottomMenu: UIView = {
        let map = TUICore.getExtensionInfo(gBottomViewKey, param: ["roomId": roomId, "roomPresent": roomPresenter])
        guard var view = map[gBottomViewKey] as? UIView else { return UIView() }
        return view
    }()

    lazy var videoSeat: UIView? = {
        let roomEngineMap = TUICore.getExtensionInfo(gRoomEngineKey, param: ["roomId": roomId])
        guard let roomEngine = roomEngineMap[gRoomEngineKey] else { return nil }
        let map = TUICore.getExtensionInfo(gVideoSeatViewKey, param: ["roomEngine": roomEngine, "roomId": roomId])
        guard let view = map[gVideoSeatViewKey] as? UIView else { return nil }
        return view
    }()

    lazy var barrageSendView: UIView? = {
        let roomEngineMap = TUICore.getExtensionInfo(gRoomEngineKey, param: ["roomId": roomId])
        if let roomEngine = roomEngineMap[gRoomEngineKey] as? TUIRoomEngine {
            let frameValue = NSValue(cgRect: view.frame)
            let barrageInfo = TUICore.getExtensionInfo(TUICore_TUIBarrageExtension_GetTUIBarrageSendView, param:
                                                        ["frame": String(describing: frameValue), "groupId": roomId,])
            if let view = barrageInfo[TUICore_TUIBarrageExtension_GetTUIBarrageSendView] as? UIView {
                view.isHidden = true
                return view
            }
        }
        return nil
    }()

    lazy var barragePlayView: UIView? = {
        let roomEngineMap = TUICore.getExtensionInfo(gRoomEngineKey, param: ["roomId": roomId])
        if let roomEngine = roomEngineMap[gRoomEngineKey] as? TUIRoomEngine {
            let frame = CGRect(x: 20, y: view.mm_h - 420, width: view.mm_w - 40, height: 0)
            let frameValue = NSValue(cgRect: frame)
            let kDeviceSafeBottomHeight = kDeviceIsIphoneX ? 34 : 0
            let maxHeight: CGFloat = CGFloat(view.mm_h - frame.origin.y - CGFloat((kDeviceSafeBottomHeight + 20 + 52)))
            let barrageInfo = TUICore.getExtensionInfo(TUICore_TUIBarrageExtension_TUIBarrageDisplayView, param:
                                                        ["frame": String(describing: frameValue),"maxHeight": String(format:"%.1f", maxHeight),
                                                         "groupId": roomId,])
            if let view = barrageInfo[TUICore_TUIBarrageExtension_TUIBarrageDisplayView] as? UIView {
                return view
            }
        }

        return nil
    }()

    lazy var beautyView: UIView = {
        let beautyManager = roomPresenter.getTRTCCloud().getBeautyManager()
        let beautyInfo = TUICore.getExtensionInfo(TUICore_TUIBeautyExtension_BeautyView,
                                                  param: [
                                                      TUICore_TUIBeautyExtension_BeautyView_BeautyManager: beautyManager,])
        let roomEngineMap = TUICore.getExtensionInfo(gRoomEngineKey, param: ["roomId": roomId])
        if let roomEngine = roomEngineMap[gRoomEngineKey] as? TUIRoomEngine {
            roomEngine.getTRTCCloud().setLocalVideoProcessDelegete(self, pixelFormat: ._Texture_2D, bufferType: .texture)
        }
        if let view = beautyInfo[TUICore_TUIBeautyExtension_BeautyView_View] as? UIView {
            view.isHidden = true
            return view
        }
        return UIView()
    }()

    var topPadding: CGFloat = {
        if #available(iOS 11.0, *) {
            if let window = UIApplication.shared.keyWindow {
                return window.safeAreaInsets.top
            }
        }
        return 0
    }()

    let kDeviceIsIphoneX: Bool = {
        if UIDevice.current.userInterfaceIdiom == .pad {
            return false
        }
        let size = UIScreen.main.bounds.size
        let notchValue = Int(size.width / size.height * 100)
        if notchValue == 216 || notchValue == 46 {
            return true
        }
        return false
    }()

    init(roomId: String) {
        self.roomId = roomId
        roomPresenter = RoomPresenter(roomId: roomId)
        orientation = (UIScreen.main.bounds.size.width < UIScreen.main.bounds.size.height)
        super.init(nibName: nil, bundle: nil)
        initUIView()
        _ = videoSeat
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        applyConfigs()
        setupUI()
        activateConstraints()
        bindInteraction()
        roomPresenter.addListener(listener: self)
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(true, animated: true)
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        navigationController?.setNavigationBarHidden(false, animated: true)
        if UIApplication.shared.statusBarOrientation.isLandscape {
            setNewOrientation(fullScreen: false)
        }
    }
    
    func initUIView() {
        userListController = UserListViewController(roomId: roomId, roomPresent: roomPresenter)
        settingViewController = ExtensionViewController(roomPresenter: roomPresenter)
        settingViewController?.modalPresentationStyle = .custom
        settingViewController?.transitioningDelegate = self
    }

    func setupUI() {
        view.backgroundColor = .gray
        if let videoSeat = videoSeat {
            view.addSubview(videoSeat)
        }
        videoSeat?.backgroundColor = .green
        view.addSubview(topMenu)
        if let barragePlayView = barragePlayView {
            view.addSubview(barragePlayView)
        }
        view.addSubview(bottomMenu)
        if let barrageSendView = barrageSendView {
            view.addSubview(barrageSendView)
        }
        
        view.addSubview(beautyView)
    }

    func activateConstraints() {
        topMenu.snp.remakeConstraints { make in
            make.top.equalTo(topPadding + 12)
            make.width.equalTo(view)
            make.height.equalTo(32)
            make.left.equalTo(view)
        }

        let kDeviceSafeBottomHeight = kDeviceIsIphoneX ? 34 : 0
        let bottomOffset = -kDeviceSafeBottomHeight - 20
        bottomMenu.snp.remakeConstraints { make in
            make.width.equalTo(view)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.height.equalTo(52)
        }
        
        videoSeat?.snp.remakeConstraints { make in
            make.width.equalTo(view)
            make.height.equalTo(view)
        }
    }

    func bindInteraction() {
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(userListControllerPush),
                                               name: NSNotification.Name("kUserListControllerPush"),
                                               object: nil)
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(barrageSendViewShow),
                                               name: NSNotification.Name("kBarrageSendViewShow"),
                                               object: nil)
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(roomSetControllerShow),
                                               name: NSNotification.Name("kRoomSetControllerShow"),
                                               object: nil)
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(exitButtonClick),
                                               name: NSNotification.Name("kExitRoomController"),
                                               object: nil)

        NotificationCenter.default.addObserver(self,
                                               selector: #selector(beautyButtonClick),
                                               name: NSNotification.Name("kBeautyViewShow"),
                                               object: nil)
        UIDevice.current.beginGeneratingDeviceOrientationNotifications()
        NotificationCenter.default.addObserver(self, selector: #selector(didChangeOrientation), name:
                                                UIDevice.orientationDidChangeNotification, object: nil)
    }
    
    func setNewOrientation(fullScreen: Bool) {
        if fullScreen {
            UIDevice.current.setValue(UIInterfaceOrientation.landscapeLeft.rawValue, forKey: "orientation")
        }else {
            UIDevice.current.setValue(UIInterfaceOrientation.portrait.rawValue, forKey: "orientation")
        }
    }

    @objc func userListControllerPush() {
        guard let userListController = userListController else { return }
        navigationController?.pushViewController(userListController, animated: true)
    }

    @objc func barrageSendViewShow() {
        barrageSendView?.isHidden = false
        barrageSendView?.snp.remakeConstraints { make in
            make.width.equalTo(view)
            make.height.equalTo(view)
        }
    }

    @objc func roomSetControllerShow() {
        guard let settingViewController = settingViewController else { return }
        present(settingViewController, animated: true)
    }

    @objc func exitButtonClick() {
        let isHomeowner: Bool = roomInfo.owner == TUILogin.getUserID()
        let alertVC = UIAlertController(title: isHomeowner ? .homeownersLogoutTitle : .audienceLogoutTitle,
                                        message: nil,
                                        preferredStyle: .alert)
        let cancelAction = UIAlertAction(title: .destroyRoomCancelTitle, style: .cancel, handler: nil)
        let sureAction = UIAlertAction(title: isHomeowner ?.destroyRoomOkTitle : .logoutOkText, style: .default) { [weak self] _ in
            guard let self = self else { return }
            self.exitRoomLogic(isHomeowner)
        }
        alertVC.addAction(cancelAction)
        alertVC.addAction(sureAction)
        present(alertVC, animated: true, completion: nil)
    }

    @objc func beautyButtonClick() {
        beautyView.isHidden = false
        beautyView.snp.remakeConstraints { make in
            make.width.equalTo(view)
            make.height.equalTo(view)
        }
    }
    
    @objc func didChangeOrientation() {
        let currentTation: Bool = (UIScreen.main.bounds.size.width < UIScreen.main.bounds.size.height)
        if orientation != currentTation {
            settingViewController?.dismiss(animated: false, completion: nil)
            barrageSendView?.isHidden = true
            beautyView.isHidden = true
            orientation = currentTation
        }
       }

    private func exitRoomLogic(_ isHomeowner: Bool) {
        roomPresenter.stopScreenCapture()
        roomPresenter.getTRTCCloud().setLocalVideoProcessDelegete(nil, pixelFormat: ._Texture_2D, bufferType: .texture)
        if isHomeowner {
            roomPresenter.stopPushLocalAudio()
            roomPresenter.stopPushLocalVideo()
            roomPresenter.destroyRoom { [weak self] in
                guard let self = self else { return }
                if self.navigationController?.viewControllers.first == self {
                    self.dismiss(animated: true)
                } else {
                    self.navigationController?.popViewController(animated: true)
                }
            } onError: { _, _ in
                if self.navigationController?.viewControllers.first == self {
                    self.dismiss(animated: true)
                } else {
                    self.navigationController?.popViewController(animated: true)
                }
            }
        } else {
            roomPresenter.stopPushLocalVideo()
            roomPresenter.stopPushLocalAudio()
            roomPresenter.exitRoom { [weak self] in
                guard let self = self else { return }
                if self.navigationController?.viewControllers.first == self {
                    self.dismiss(animated: true)
                } else {
                    self.navigationController?.popViewController(animated: true)
                }
            } onError: { _, _ in
                if self.navigationController?.viewControllers.first == self {
                    self.dismiss(animated: true)
                } else {
                    self.navigationController?.popViewController(animated: true)
                }
            }
        }
    }

    private func applyConfigs() {
        if roomInfo.isOpenMicrophone && roomPresenter.currentUser.isAllowVideoTurnedOn {
            roomPresenter.localMicrophone(isOpen: true) {
            } onError: { _, _ in
            }
            roomPresenter.startPushLocalAudio()
        }

        if roomInfo.isOpenCamera && roomPresenter.currentUser.isAllowVideoTurnedOn {
            roomPresenter.localCamera(isOpen: true, isFront: true) {
            } onError: { _, _ in
            }
            roomPresenter.startPushLocalVideo()
        }
    }

    func interruptClearRoom() {
        if #available(iOS 11.0, *) {
            roomPresenter.stopScreenCapture()
        }
        roomPresenter.stopPushLocalAudio()
        roomPresenter.stopPushLocalVideo()
        roomPresenter.exitRoom {
        } onError: { _, _ in
        }
    }

    func interruptQuitRoom() {
        settingViewController?.dismiss(animated: false, completion: nil)
        navigationController?.popToRootViewController(animated: true)
    }
}

extension RoomMainViewController: TUIRoomPresenterListener {
    func onPresenterKickedOutRoom(message: String) {
        interruptClearRoom()
        let alertVC = UIAlertController(title: .kickOffTitleText, message: nil, preferredStyle: .alert)
        let sureAction = UIAlertAction(title: .alertOkText, style: .default) { [weak self] _ in
            guard let self = self else { return }
            self.interruptQuitRoom()
        }
        alertVC.addAction(sureAction)
        present(alertVC, animated: true)
    }

    func onPresenterRoomDismissed() {
        interruptClearRoom()
        let alertVC = UIAlertController(title: .destroyAlertText, message: nil, preferredStyle: .alert)
        let sureAction = UIAlertAction(title: .alertOkText, style: .default) { [weak self] _ in
            guard let self = self else { return }
            self.interruptQuitRoom()
        }
        alertVC.addAction(sureAction)
        present(alertVC, animated: true)
        #if RTCube_APPSTORE
        guard roomInfo.owner == roomPresenter.currentUser.userInfo.userId else { return }
            let selector = NSSelectorFromString("showAlertUserLiveTimeOut")
            if UIViewController.responds(to: selector) {
                UIViewController.perform(selector)
            }
        #endif
    }
}

extension RoomMainViewController: TRTCVideoFrameDelegate {
    public func onProcessVideoFrame(_ srcFrame: TRTCVideoFrame, dstFrame: TRTCVideoFrame) -> UInt32 {
        if let dstTextureId = TUICore.callService(TUICore_TUIBeautyService,
                                                  method: TUICore_TUIBeautyService_ProcessVideoFrame,
                                                  param: [
                                                      TUICore_TUIBeautyService_ProcessVideoFrame_SRCTextureIdKey: srcFrame.textureId,
                                                      TUICore_TUIBeautyService_ProcessVideoFrame_SRCFrameWidthKey: srcFrame.width,
                                                      TUICore_TUIBeautyService_ProcessVideoFrame_SRCFrameHeightKey: srcFrame.height,
                                                  ]) as? GLuint {
            dstFrame.textureId = dstTextureId
        }
        return 0
    }
}

fileprivate extension String {
    static let alertOkText = tuiRoomKitLocalize("TUIRoom.ok")
    static let kickOffTitleText = tuiRoomKitLocalize("TUIRoom.kick.off.title")
    static let destroyAlertText = tuiRoomKitLocalize("TUIRoom.room.destroy")

    static let homeownersLogoutTitle = tuiRoomKitLocalize("TUIRoom.sure.destroy.room")
    static let destroyRoomOkTitle = tuiRoomKitLocalize("TUIRoom.destroy.room.ok")
    static let destroyRoomCancelTitle = tuiRoomKitLocalize("TUIRoom.destroy.room.cancel")
    static let audienceLogoutTitle = tuiRoomKitLocalize("TUIRoom.sure.leave.room")
    static let logoutOkText = tuiRoomKitLocalize("TUIRoom.ok")
    static let logoutCancelText = tuiRoomKitLocalize("TUIRoom.cancel")
    static let copySuccessText = tuiRoomKitLocalize("TUIRoom.copy.success")
}
