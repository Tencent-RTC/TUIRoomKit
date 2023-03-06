//
//  RoomRouter.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2022/9/30.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation

class RoomRouter {
    static let shared = RoomRouter()
    private var enablePrePareView: Bool = true
    private init() {}
    
    func pushPrePareViewController(enablePrePareView: Bool) {
        self.enablePrePareView = enablePrePareView
        let vc = makePrePareViewController()
        let rootVC = UINavigationController(rootViewController: vc)
        rootVC.modalPresentationStyle = .overFullScreen
        currentViewController()?.present(rootVC, animated: true)
    }
    
    func pushCreateRoomViewController() {
        let vc = makeCreateRoomViewController()
        presentRoomController(vc: vc)
    }
    
    func pushJoinRoomViewController() {
        let vc = makeJoinRoomViewController()
        presentRoomController(vc: vc)
    }
    
    func pushUserListViewController() {
        let vc = makeUserListViewController()
        presentRoomController(vc: vc)
    }
    
    func pushQRCodeViewController() {
        let vc = makeQRCodeViewController()
        presentRoomController(vc: vc)
    }
    
    func pushRaiseHandApplicationListViewController() {
        let vc = makeRaiseHandApplicationListViewController()
        presentRoomController(vc: vc)
    }
    
    func pushTransferMasterViewController() {
        let vc = makeTransferMasterViewController()
        presentRoomController(vc: vc)
    }
    
    func presentPopUpViewController(viewType: PopUpViewType, height: CGFloat = 0) {
        let vc = makePopUpViewController(viewType: viewType, height: height)
        currentViewController()?.present(vc, animated: true)
    }
    
    func makePrePareViewController() -> UIViewController {
        let viewController = RoomPrePareViewController(roomPrePareViewModelFactory: self)
        return viewController
    }
    
    func makeMainViewController(roomId: String) -> UIViewController {
        let controller = RoomMainViewController(roomMainViewModelFactory: self)
        return controller
    }
    
    func makeCreateRoomViewController() -> UIViewController {
        let controller = RoomEntranceViewController(roomMainViewModelFactory: self, isCreateRoom: true)
        return controller
    }
    
    func makeJoinRoomViewController() -> UIViewController {
        let controller = RoomEntranceViewController(roomMainViewModelFactory: self, isCreateRoom: false)
        return controller
    }
    
    func makeUserListViewController() -> UIViewController {
        let controller = UserListViewController(userListViewModelFactory: self)
        return controller
    }
    
    func makeQRCodeViewController() -> UIViewController {
        let controller = QRCodeViewController(qrCodeViewModelFactory: self)
        return controller
    }
    
    func makeRaiseHandApplicationListViewController() -> UIViewController {
        let controller = RaiseHandApplicationListViewController(raiseHandApplicationListViewModelFactory: self)
        return controller
    }
    
    func makeTransferMasterViewController() -> UIViewController {
        let controller = TransferMasterViewController(transferMasterViewModelFactory: self)
        return controller
    }
    
    func makePopUpViewController(viewType: PopUpViewType, height: CGFloat = 0) -> UIViewController {
        let controller = PopUpViewController(popUpViewModelFactory: self, viewType: viewType, height: height)
        return controller
    }
    
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
        guard let nav = currentViewController()?.navigationController else { return }
        if nav.viewControllers.first == currentViewController() {
            currentViewController()?.dismiss(animated: true)
        } else {
            nav.popViewController(animated: true)
        }
    }
    
    func popToEntranceViewController() {
        var isEntranceViewController = false
        guard let nav = currentViewController()?.navigationController else { return }
        nav.viewControllers.forEach({ viewController in
            if viewController is RoomEntranceViewController {
                nav.popToViewController(viewController, animated: true)
                isEntranceViewController = true
            }
        })
        if !isEntranceViewController {
            popRoomController()
        }
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
        let viewController = findCurrentController(from: rootController)
        return viewController
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension RoomRouter: RoomPrePareViewModelFactory {
    func makePrePareViewModel() -> PrePareViewModel {
        let model = PrePareViewModel()
        model.enablePrePareView = enablePrePareView
        return model
    }
}

extension RoomRouter: RoomMainViewModelFactory {
    func makeRoomMainViewModel() -> RoomMainViewModel {
        let model = RoomMainViewModel()
        return model
    }
}

extension RoomRouter: RoomEntranceViewModelFactory {
    func makeRootView(isCreateRoom: Bool) -> UIView {
        if isCreateRoom {
            let model = CreateRoomViewModel()
            return CreateRoomView(viewModel: model)
        } else {
            let model = EnterRoomViewModel()
            return EnterRoomView(viewModel: model)
        }
    }
}

extension RoomRouter: UserListViewModelFactory {
    func makeUserListViewModel() -> UserListViewModel {
        let model = UserListViewModel()
        return model
    }
}

extension RoomRouter: QRCodeViewModelFactory {
    func makeQRCodeViewModel() -> QRCodeViewModel {
        //todo房间的链接
        let model = QRCodeViewModel(urlString: "https://web.sdk.qcloud.com/component/tuiroom/index.html#/" + "#/room?roomId=" +
                                    EngineManager.shared.store.roomInfo.roomId)
        return model
    }
}

extension RoomRouter: RaiseHandApplicationListViewModelFactory {
    func makeRaiseHandApplicationListViewModel() -> RaiseHandApplicationListViewModel {
        let model = RaiseHandApplicationListViewModel()
        return model
    }
}

extension RoomRouter: TransferMasterViewModelFactory {
    func makeTransferMasterViewModel() -> TransferMasterViewModel {
        let model = TransferMasterViewModel()
        return model
    }
}

extension RoomRouter: PopUpViewModelFactory {
    func makeRootView(viewType: PopUpViewType, height: CGFloat = 0) -> UIView {
        let viewModel = PopUpViewModel(viewType: viewType, height: height)
        return PopUpView(viewModel: viewModel)
    }
}
