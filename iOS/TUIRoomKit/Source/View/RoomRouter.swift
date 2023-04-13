//
//  RoomRouter.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2022/9/30.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUICore

// 视图路由上下文
class RouteContext {
    var rootNavigation: UINavigationController? // 当前根视图控制器
    var presentControllers: [UIViewController] = [] // 当前模态弹出的页面
    let appearance: UINavigationBarAppearance = UINavigationBarAppearance()
    let navigationDelegate = RoomRouter.RoomNavigationDelegate()
    weak var chatViewController: UIViewController? // 当前聊天视图控制器
    init() {}
}

class RoomRouter {
    static let shared = RoomRouter()
    private let context: RouteContext = RouteContext()
    private init() {}
    
    class RoomNavigationDelegate: NSObject {
        
    }
    
    var navController: UINavigationController {
        // 这里完善逻辑，如果没有获取到，就取当前window控制器
        assert(context.rootNavigation != nil, "RoomKit路由设置有误，没有初始化根导航控制器")
        return context.rootNavigation ?? UINavigationController()
    }
    
    func pushToChatController(user: UserModel, roomInfo: RoomInfo) {
        let config: [String : Any] = [
            TUICore_TUIChatService_SetChatExtensionMethod_EnableVideoCallKey: false,
            TUICore_TUIChatService_SetChatExtensionMethod_EnableAudioCallKey: false,
            TUICore_TUIChatService_SetChatExtensionMethod_EnableLinkKey: false,
        ]
        TUICore.callService(TUICore_TUIChatService, method: TUICore_TUIChatService_SetChatExtensionMethod, param: config)
        let param : [String : Any] = [
            TUICore_TUIChatService_GetChatViewControllerMethod_TitleKey : roomInfo.name,
            TUICore_TUIChatService_GetChatViewControllerMethod_GroupIDKey: roomInfo.roomId,
            TUICore_TUIChatService_GetChatViewControllerMethod_AvatarUrlKey : user.avatarUrl,
        ]
        if let chatVC = TUICore.callService(TUICore_TUIChatService,
                                            method: TUICore_TUIChatService_GetChatViewControllerMethod,
                                            param: param) as? UIViewController {
            context.chatViewController = chatVC
            let appearance = context.appearance
            appearance.backgroundColor = UIColor.white
            navController.navigationBar.standardAppearance = appearance
            navController.navigationBar.scrollEdgeAppearance = appearance
            navController.navigationBar.tintColor = UIColor.black
            push(viewController: chatVC)
        }
    }
    
    func pushPrePareViewController(enablePrePareView: Bool) {
        let prepareVC = makePrePareViewController(enablePrepareView: enablePrePareView)
        createRootNavigationAndPresent(controller: prepareVC)
    }
    
    func pushMainViewController(roomId: String) {
        let vc = makeMainViewController(roomId: roomId)
        push(viewController: vc)
    }
    
    func pushCreateRoomViewController() {
        let createRoomVC = makeCreateRoomViewController()
        push(viewController: createRoomVC)
    }
    
    func pushJoinRoomViewController() {
        let joinRoomVC = makeJoinRoomViewController()
        push(viewController: joinRoomVC)
    }
    
    func pushUserListViewController() {
        let userListVC = makeUserListViewController()
        push(viewController: userListVC)
    }
    
    func pushQRCodeViewController() {
        let qrCodeVC = makeQRCodeViewController()
        push(viewController: qrCodeVC)
    }
    
    func pushRaiseHandApplicationListViewController() {
        let raiseHandVC = makeRaiseHandApplicationListViewController()
        push(viewController: raiseHandVC)
    }
    
    func pushTransferMasterViewController() {
        let transferMasterViewController = makeTransferMasterViewController()
        push(viewController: transferMasterViewController)
    }
    
    func presentPopUpViewController(viewType: PopUpViewType, height: CGFloat = 0) {
        let vc = makePopUpViewController(viewType: viewType, height: height)
        present(viewController: vc)
    }
    
    func pop(animated: Bool = true) {
        navController.popViewController(animated: animated)
    }
    
    func dismiss(animated: Bool = true, completion: (() -> Void)? = nil) {
        guard context.presentControllers.count > 0 else { return }
        if let controller = context.presentControllers.last {
            controller.dismiss(animated: animated, completion: completion)
            context.presentControllers.removeLast()
        }
    }
    
    func popToRoomEntranceViewController() {
        let controllerArray = navController.viewControllers
        guard let controller = controllerArray.first(where: { $0 is RoomEntranceViewController }) else { return }
        self.navController.popToViewController(controller, animated: true)
    }
    
    // 这个函数要第二波优化掉
    func dismissPopupViewController(animated: Bool = true) {
        guard context.presentControllers.count > 0 else { return }
        guard let controller = context.presentControllers.last else { return }
        guard controller is PopUpViewController else { return }
        controller.dismiss(animated: animated, completion: nil)
        context.presentControllers.removeLast()
    }
    
    func presentAlert(_ alertController: UIAlertController) {
        present(viewController: alertController)
    }
    
    class func makeToast(toast: String) {
        shared.getCurrentWindowViewController()?.view.makeToast(toast)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension RoomRouter {
    
    private func push(viewController: UIViewController, animated: Bool = true) {
        navController.pushViewController(viewController, animated: animated)
    }
    
    private func present(viewController: UIViewController, style: UIModalPresentationStyle = .automatic, animated: Bool = true) {
        context.presentControllers.append(viewController)
        viewController.modalPresentationStyle = style
        navController.present(viewController, animated: animated)
    }
    
    private func createRootNavigationAndPresent(controller: UIViewController) {
        let navigationController = UINavigationController(rootViewController: controller)
        navigationController.modalPresentationStyle = .fullScreen
        context.rootNavigation = navigationController
        if #available(iOS 13.0, *) {
            setupNavigationBarAppearance()
            navigationController.navigationBar.standardAppearance = context.appearance
            navigationController.navigationBar.scrollEdgeAppearance = context.appearance
        }
        navigationController.delegate = context.navigationDelegate
        context.presentControllers.append(navigationController)
        guard let controller = getCurrentWindowViewController() else { return }
        controller.present(navigationController, animated: true)
    }
    
    @available(iOS 13.0, *)
    private func setupNavigationBarAppearance() {
        let barAppearance = context.appearance
        barAppearance.configureWithDefaultBackground()
        barAppearance.shadowColor = nil
        barAppearance.backgroundEffect = nil
        barAppearance.backgroundColor = UIColor(0x1B1E26)
    }
    
    private func getCurrentWindowViewController() -> UIViewController? {
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
    
    private func makePrePareViewController(enablePrepareView: Bool) -> UIViewController {
        let viewController = RoomPrePareViewController(roomPrePareViewModelFactory: self, enablePrepareView: enablePrepareView)
        return viewController
    }
    
    private func makeMainViewController(roomId: String) -> UIViewController {
        let controller = RoomMainViewController(roomMainViewModelFactory: self)
        return controller
    }
    
    private func makeCreateRoomViewController() -> UIViewController {
        let controller = RoomEntranceViewController(roomMainViewModelFactory: self, isCreateRoom: true)
        return controller
    }
    
    private func makeJoinRoomViewController() -> UIViewController {
        let controller = RoomEntranceViewController(roomMainViewModelFactory: self, isCreateRoom: false)
        return controller
    }
    
    private func makeUserListViewController() -> UIViewController {
        let controller = UserListViewController(userListViewModelFactory: self)
        return controller
    }
    
    private func makeQRCodeViewController() -> UIViewController {
        let controller = QRCodeViewController(qrCodeViewModelFactory: self)
        return controller
    }
    
    private func makeRaiseHandApplicationListViewController() -> UIViewController {
        let controller = RaiseHandApplicationListViewController(raiseHandApplicationListViewModelFactory: self)
        return controller
    }
    
    private func makeTransferMasterViewController() -> UIViewController {
        let controller = TransferMasterViewController(transferMasterViewModelFactory: self)
        return controller
    }
    
    private func makePopUpViewController(viewType: PopUpViewType, height: CGFloat = 0) -> UIViewController {
        let controller = PopUpViewController(popUpViewFactory: self, viewType: viewType, height: height)
        return controller
    }
}

extension RoomRouter.RoomNavigationDelegate: UINavigationControllerDelegate {
    func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {
        if viewController is RoomMainViewController {
            let appearance = RoomRouter.shared.context.appearance
            appearance.backgroundColor = UIColor(0x1B1E26)
            navigationController.navigationBar.standardAppearance = appearance
            navigationController.navigationBar.scrollEdgeAppearance = appearance
            navigationController.navigationBar.tintColor = UIColor.white
        }
    }
}

extension RoomRouter: RoomPrePareViewModelFactory {
    func makePrePareViewModel(enablePrepareView: Bool) -> PrePareViewModel {
        let model = PrePareViewModel()
        model.enablePrePareView = enablePrepareView
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

extension RoomRouter: PopUpViewFactory {
    func makeRootView(viewType: PopUpViewType, height: CGFloat = 0) -> UIView {
        let viewModel = PopUpViewModel(viewType: viewType, height: height)
        return PopUpView(viewModel: viewModel)
    }
}
