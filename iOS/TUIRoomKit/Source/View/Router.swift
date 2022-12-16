//
//  Router.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2022/9/30.
//

import Foundation

class Router {
    static let shared = Router()

    func presentRoomController(vc: UIViewController) {
        guard let current = currentViewController() else{ return}
        if let nav = current.navigationController {
            vc.hidesBottomBarWhenPushed = true
            nav.pushViewController(vc, animated: true)
        } else {
            let navRoomVC = UINavigationController(rootViewController: vc)
            navRoomVC.modalPresentationStyle = .fullScreen
            current.present(navRoomVC, animated: true)
        }
    }

    func popRoomController() {
        guard let nav = currentViewController()?.navigationController else{ return}
        nav.popViewController(animated: true)
    }

    func currentViewController() -> UIViewController? {
        var keyWindow: UIWindow?
        for window in UIApplication.shared.windows {
            if window.isMember(of: UIWindow.self), window.isKeyWindow {
                keyWindow = window
                break
            }
        }
        guard let rootController = keyWindow?.rootViewController else {
            return nil
        }
        func findCurrentController(from vc: UIViewController?) -> UIViewController? {
            if let nav = vc as? UINavigationController {
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

    private var roomController: [String: UIViewController] = [:]
    func roomIdBindController(roomId: String) -> UIViewController? {
        if let controller = Router.shared.roomController[roomId] {
            return controller
        } else {
            let controller = RoomMainViewController(roomId: roomId)
            Router.shared.roomController[roomId] = controller
            return controller
        }
    }

    func roomIdRemoveBindController(roomId: String) {
        Router.shared.roomController.removeValue(forKey: roomId)
    }
}
