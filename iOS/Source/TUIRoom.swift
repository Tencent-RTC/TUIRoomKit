//
//  TUIRoom.swift
//  TUIRoom
//
//  Created by jack on 2022/4/28.
//

import Foundation

@objc
public protocol TUIRoomDelegate: NSObjectProtocol {
    
    ///
    /// 创建房间结果回调
    ///
    /// @param code 0 为创建成功， 其它为失败
    /// @param message 结果信息
    @objc
    optional func onRoomCreate(code: Int, message: String)
    
    ///  进入房间结果回调
    ///
    ///  @param code 0 为创建成功， 其它为失败
    ///  @param message 结果信息
    @objc
    optional func onRoomEnter(code: Int, message: String)
    
}

@objcMembers
public class TUIRoom: NSObject {
    
    /// TUIRoom
    /// @note TUIRoom 实例（单例模式）
    public static let sharedInstance: TUIRoom = TUIRoom()
    
    /// TUIRoom
    /// @note TUIRoom 创建房间、进房等回调
    public weak var delegate: TUIRoomDelegate? = nil
    
    /// 是否已进入房间
    internal var isEnterRoom: Bool = false
    
    /// 创建房间
    ///
    /// @param roomId String roomID
    /// @param speechMode TUIRoomSpeechMode 发言模式：自由发言，申请发言
    /// @param isOpenCamera Bool 是否打开摄像头
    /// @param isOpenMicrophone Bool 是否打开麦克风
    @objc
    public func createRoom(roomId: String,
                           speechMode: TUIRoomSpeechMode,
                           isOpenCamera: Bool,
                           isOpenMicrophone: Bool) {
        if isEnterRoom {
            delegate?.onRoomCreate?(code: -1, message: .alreadyInRoom)
            return
        }
        if TUIRoomUserManage.currentUserId().isEmpty {
            delegate?.onRoomCreate?(code: -1, message: .noLoginToast)
            return
        }
        if roomId.isEmpty {
            delegate?.onRoomEnter?(code: -1, message: .enterRoomIdErrorToast)
            return
        }
        TUIRoomCore.shareInstance().createRoom(roomId, speechMode: speechMode) { [weak self] (code, message) in
            guard let self = self else { return }
            if code == 0 {
                let vc = TUIRoomMainViewController(roomId: roomId, isVideoOn: isOpenCamera, isAudioOn: isOpenMicrophone)
                TUIRoomCore.shareInstance().setDelegate(vc)
                self.presentRoomController(vc: vc)
            }
            self.delegate?.onRoomCreate?(code: code, message: message)
        }
    }
    
    /// 进入已创建的房间
    ///
    /// @param roomId String roomID
    /// @param isOpenCamera Bool 是否打开摄像头
    /// @param isOpenMicrophone Bool 是否打开麦克风
    @objc
    public func enterRoom(roomId: String,
                          isOpenCamera: Bool,
                          isOpenMicrophone: Bool) {
        if isEnterRoom {
            delegate?.onRoomEnter?(code: -1, message: .alreadyInRoom)
            return
        }
        if TUIRoomUserManage.currentUserId().isEmpty {
            delegate?.onRoomEnter?(code: -1, message: .noLoginToast)
            return
        }
        if roomId.isEmpty {
            delegate?.onRoomEnter?(code: -1, message: .enterRoomIdErrorToast)
            return
        }
        TUIRoomCore.shareInstance().enterRoom(roomId, callback: { [weak self] (code, message) in
            guard let self = self else { return }
            if code == 0 {
                let vc = TUIRoomMainViewController(roomId: roomId, isVideoOn: isOpenCamera, isAudioOn: isOpenMicrophone)
                TUIRoomCore.shareInstance().setDelegate(vc)
                self.presentRoomController(vc: vc)
            }
            self.delegate?.onRoomEnter?(code: code, message: message)
        })
    }
    
}

// MARK: - Private
fileprivate extension TUIRoom {
    
    private func presentRoomController(vc: UIViewController) {
        let current = currentViewController()
        if let nav = current?.navigationController {
            vc.hidesBottomBarWhenPushed = true
            nav.pushViewController(vc, animated: true)
        } else {
            let navRoomVC = UINavigationController(rootViewController: vc)
            navRoomVC.modalPresentationStyle = .fullScreen
            current?.present(navRoomVC, animated: true)
        }
        isEnterRoom = true
    }
    
    private func currentViewController() -> UIViewController? {
        guard let rootController = UIApplication.shared.windows.first?.rootViewController else {
            return nil
        }
        func findCurrentController(from vc: UIViewController?) -> UIViewController? {
            if let nav = vc as? UINavigationController  {
                return findCurrentController(from: nav.topViewController)
            } else if let tabBar = vc as? UITabBarController {
                return findCurrentController(from: tabBar.selectedViewController)
            } else if let presented = vc?.presentedViewController {
                return findCurrentController(from: presented)
            }
            return vc
        }
        return findCurrentController(from: rootController)
    }
}

// MARK: - internationalization string
fileprivate extension String {
    static let alreadyInRoom = tuiRoomLocalize("TUIRoom.enter.error.already")
    static let noLoginToast = tuiRoomLocalize("TUIRoom.not.login.toast")
    static let enterRoomIdErrorToast = tuiRoomLocalize("TUIRoom.input.error.room.num.toast")
}
