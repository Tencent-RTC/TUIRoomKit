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
    var rootNavigation: RoomKitNavigationController? // 当前根视图控制器
    typealias WeakArray<T> = [() -> T?]
    var presentControllerMap: [PopUpViewType:WeakArray<UIViewController>] = [:] //当前模态弹出的页面
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
    
    var navController: RoomKitNavigationController {
        // 这里完善逻辑，如果没有获取到，就取当前window控制器
        assert(context.rootNavigation != nil, "RoomKit路由设置有误，没有初始化根导航控制器")
        return context.rootNavigation ?? RoomKitNavigationController(rootViewController: UIViewController())
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
    
    func presentPopUpViewController(viewType: PopUpViewType, height: CGFloat?, backgroundColor: UIColor = UIColor(0x1B1E26)) {
        let vc = makePopUpViewController(viewType: viewType, height: height, backgroundColor: backgroundColor)
        let weakObserver = { [weak vc] in return vc }
        if var observerArray = context.presentControllerMap[viewType] {
            observerArray.append(weakObserver)
            context.presentControllerMap[viewType] = observerArray
        } else {
            context.presentControllerMap[viewType] = [weakObserver]
        }
        present(viewController: vc)
    }
    
    func dismissPopupViewController(viewType: PopUpViewType, animated: Bool = true) {
        guard var observerArray = context.presentControllerMap[viewType] else { return }
        guard observerArray.count > 0 else {
            context.presentControllerMap.removeValue(forKey: viewType)
            return
        }
        guard let observer = observerArray.last, let vc = observer() else { return }
        vc.dismiss(animated: animated)
        observerArray.removeLast()
        if observerArray.count == 0 {
            context.presentControllerMap.removeValue(forKey: viewType)
        }
    }
    
    func dismissAllRoomPopupViewController() {
        for viewType in context.presentControllerMap.keys {
            if viewType == .prepareViewType { continue } //预览页面不属于进房后的页面，在退出房间时不被销毁
            guard let observerArray = context.presentControllerMap[viewType] else { continue }
            guard observerArray.count > 0 else {
                context.presentControllerMap.removeValue(forKey: viewType)
                continue
            }
            observerArray.forEach { observer in
                observer()?.dismiss(animated: true)
            }
            context.presentControllerMap.removeValue(forKey: viewType)
        }
    }
    
    func pop(animated: Bool = true) {
        navController.popViewController(animated: animated)
    }
    
    func popToRoomEntranceViewController() {
        let controllerArray = navController.viewControllers
        guard let controller = controllerArray.first(where: { $0 is RoomEntranceViewController }) else { return }
        self.navController.popToViewController(controller, animated: true)
    }
    
    func presentAlert(_ alertController: UIAlertController) {
        getCurrentWindowViewController()?.present(alertController, animated: true)
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
        viewController.modalPresentationStyle = style
        navController.present(viewController, animated: animated)
    }
    
    private func createRootNavigationAndPresent(controller: UIViewController) {
        let navigationController = RoomKitNavigationController(rootViewController: controller)
        navigationController.modalPresentationStyle = .fullScreen
        context.rootNavigation = navigationController
        if #available(iOS 13.0, *) {
            setupNavigationBarAppearance()
            navigationController.navigationBar.standardAppearance = context.appearance
            navigationController.navigationBar.scrollEdgeAppearance = context.appearance
        }
        navigationController.delegate = context.navigationDelegate
        let weakObserver = { [weak navigationController] in
            return navigationController
        }
        if var observerArray = context.presentControllerMap[.prepareViewType] {
            observerArray.append(weakObserver)
            context.presentControllerMap[.prepareViewType] = observerArray
        } else {
            context.presentControllerMap[.prepareViewType] = [weakObserver]
        }
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
    
    private func makePopUpViewController(viewType: PopUpViewType, height: CGFloat?, backgroundColor: UIColor) -> UIViewController {
        let controller = PopUpViewController(popUpViewModelFactory: self, viewType: viewType, height: height, backgroundColor: backgroundColor)
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

extension RoomRouter: PopUpViewModelFactory {
    func makeRootView(viewType: PopUpViewType, height: CGFloat?, backgroundColor: UIColor) -> PopUpView {
        let viewModel = PopUpViewModel(viewType: viewType, height: height)
        viewModel.backgroundColor = backgroundColor
        return PopUpView(viewModel: viewModel)
    }
}
