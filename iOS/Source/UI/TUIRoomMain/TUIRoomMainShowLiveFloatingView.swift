//
//  TUIRoom.swift
//  TUIRoomShowLiveFloatingManager
//
//  Created by xzyMacEnd on 2022/9/21.
//
import UIKit

fileprivate let ScreenWidth = UIScreen.main.bounds.width
fileprivate let ScreenHeight = UIScreen.main.bounds.height

fileprivate let kDeviceIsIphoneX : Bool = {
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

fileprivate let TabBarHeight: CGFloat = kDeviceIsIphoneX ? (49.0 + 34.0) : (49.0)

fileprivate let FloatWindowSize = CGSize(width: 150.0, height: 200.0)

fileprivate var WindowDefaultFrame: CGRect = CGRect(x: ScreenWidth - FloatWindowSize.width - 10,
                                                    y: ScreenHeight - FloatWindowSize.height - TabBarHeight,
                                                    width: FloatWindowSize.width, height: FloatWindowSize.height)

// MARK: - ShowLiveFloatingManager
class ShowLiveFloatingManager {
    /// 单例
    static let shared: ShowLiveFloatingManager = ShowLiveFloatingManager()
    /// 是否支持悬浮框，Default is true
    var enableFloating: Bool = true
    /// 是否显示悬浮框
    private(set) var isFloating: Bool = false
    /// 悬浮框视图
    private var floatWindow: ShowLiveFloatingWindow? = nil
    /// 房间信息
    private var roomMSGInfo: TUIRoomInfo? = nil
    /// 原直播视图控制器
    private var sourceViewController: TUIRoomMainViewController? = nil
    /// 初始化默认数据
    private func initData() {
        sourceViewController = nil
        floatWindow = nil
        isFloating =  false
    }
}

// MARK: - 悬浮框视图控制
extension ShowLiveFloatingManager {
    /// 展示悬浮框-直播间挂起
    public func showFloating(from viewController: TUIRoomMainViewController , roomInfo : TUIRoomInfo) {
        if let oldSource = sourceViewController {
            if oldSource == viewController {
                return
            } else {
                closeWindowAndExitRoom()
            }
        }

        guard let sourceSnapshot = viewController.view.snapshotView(afterScreenUpdates: false) else {
            return
        }
        viewController.hideIcon()
        sourceViewController = viewController
        roomMSGInfo = roomInfo

        var sourceWindow: UIWindow? = makeSnapshotWindow(snapshot: sourceSnapshot)
        sourceWindow?.frame.size = sourceSnapshot.frame.size
        sourceWindow?.frame.origin = .zero
        sourceWindow?.makeKeyAndVisible()
        let targetWindow = ShowLiveFloatingWindow(frame: WindowDefaultFrame,
                                                  roomInfo: roomInfo,
                                                  playerView: viewController.view,
                                                  delegate: self)
        targetWindow.makeKeyAndVisible()
        floatWindow = targetWindow
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut) {
            sourceWindow?.frame = WindowDefaultFrame
            sourceWindow?.alpha = 0.0
        } completion: { _ in
            sourceWindow = nil
        }
        if let nav = viewController.navigationController {
            nav.popViewController(animated: false)
        } else {
            viewController.dismiss(animated: false, completion: nil)
        }
        isFloating = true
    }
    
    public func closeWindowAndExitRoom() {
        guard let newSourceViewController = sourceViewController ,let newRoomMSGInfo = roomMSGInfo else{
            return
        }
        newSourceViewController.exitRoomLogic(newRoomMSGInfo.isHomeowner())
        initData()
    }
}

// MARK: - ShowLiveFloatingWindowDelegate
extension ShowLiveFloatingManager: ShowLiveFloatingWindowDelegate {
    func showLiveFloatingDidClickView() {
        guard currentViewController() != nil else { return }
    }
    func showLiveFloatingDidChangedFrame() {
        guard let window = floatWindow else {
            return
        }
        WindowDefaultFrame = window.frame
    }
    func showLiveFloatingDidClickClose() {
        closeWindowAndExitRoom()
    }
}

// MARK: - Private
extension ShowLiveFloatingManager {
    private func makeSnapshotWindow(snapshot: UIView) -> UIWindow {
        let window = UIWindow(frame: .zero)
        window.backgroundColor = .clear
        window.clipsToBounds = true
        window.windowLevel = .statusBar - 1
        snapshot.frame.origin = .zero
        window.addSubview(snapshot)
        return window
    }

    private func currentViewController() -> UIViewController? {
        guard let rootViewController = UIApplication.shared.delegate?.window??.rootViewController else {
            return nil
        }
        if let nav = rootViewController as? UINavigationController {
            return nav.topViewController
        }
        if let tabBarViewController = rootViewController as? UITabBarController  {
            if let nav = tabBarViewController.selectedViewController as? UINavigationController {
                return nav.topViewController
            }
            return tabBarViewController.selectedViewController
        }
        return rootViewController
    }
}

// MARK: - ShowLiveFloatingWindowDelegate 悬浮框视图事件代理
protocol ShowLiveFloatingWindowDelegate: AnyObject {
    func showLiveFloatingDidClickClose()
   
    func showLiveFloatingDidChangedFrame()
   
    func showLiveFloatingDidClickView()
}

// MARK: - 悬浮框视图
class ShowLiveFloatingWindow: UIWindow {
    private var roomInfo: TUIRoomInfo? = nil
    private weak var playerView: UIView? = nil
    /// 便利构造器 ShowLiveFloatingWindow
    /// - Parameters:
    ///   - windowScene: UIWindowScene
    ///   - frame: 悬浮框视图Frame
    ///   - roomInfo: 房间信息
    ///   - playerView: UIView
    ///   - delegate: 悬浮框事件回调
    ///
    convenience init(frame: CGRect,
                     roomInfo: TUIRoomInfo,
                     playerView: UIView,
                     delegate: ShowLiveFloatingWindowDelegate?) {
        self.init(frame: frame)
        if #available(iOS 13.0, *) {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }
            self.windowScene = windowScene
        }
        self.clipsToBounds = true
        self.windowLevel = .statusBar - 2
        self.backgroundColor = .clear
        self.delegate = delegate
        self.playerView = playerView
        self.constructViewHierarchy()
        self.activateConstraints()
        self.bindInteraction()
    }
    
    private weak var delegate: ShowLiveFloatingWindowDelegate? = nil
    private lazy var closeBtn: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_exit_room", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()
    private var beganPoint: CGPoint?
    
    private func constructViewHierarchy() {
        if let playerView = self.playerView {
            if playerView.superview != nil {
                playerView.removeFromSuperview()
            }
            addSubview(playerView)
        }
        addSubview(closeBtn)
    }
    
    private func activateConstraints() {
        playerView?.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        closeBtn.snp.makeConstraints { make in
            make.width.height.equalTo(32)
            make.trailing.equalTo(-10)
            make.top.equalTo(10)
        }
    }
    
    private func bindInteraction() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(viewDidClick))
        addGestureRecognizer(tap)
        let pan = UIPanGestureRecognizer(target: self, action: #selector(viewDidDrag(pan:)))
        addGestureRecognizer(pan)
        tap.require(toFail: pan)
        
        closeBtn.addTarget(self, action: #selector(closeDidClick), for: .touchUpInside)
    }
    
    deinit {
        print("this demo is destory")
    }
}

// MARK: - UITouch Event
extension ShowLiveFloatingWindow {
    @objc
    private func viewDidClick() {
        delegate?.showLiveFloatingDidClickView()
    }
    @objc
    private func closeDidClick() {
        delegate?.showLiveFloatingDidClickClose()
    }
    @objc
    private func viewDidDrag(pan: UIPanGestureRecognizer) {
        switch pan.state {
        case .began:
            beganPoint = pan.location(in: self)
        case .changed:
            guard let beganPoint = beganPoint else {
                return
            }
            let point = pan.location(in: self)
            let offsetX = point.x - beganPoint.x
            let offsetY = point.y - beganPoint.y
            let coefficient: CGFloat = 1.01
            let origin = self.frame.origin
            self.frame.origin = CGPoint(x: origin.x + offsetX * coefficient, y: origin.y + offsetY * coefficient)
        case .cancelled, .ended:
            let currentCenterX = self.frame.origin.x + self.frame.width/2.0
            let finalOriginX = (currentCenterX <= ScreenWidth/2.0) ? 10 : (ScreenWidth - 10 - self.frame.width)
            UIView.animate(withDuration: 0.2) { [weak self] in
                guard let self = self else { return }
                self.frame.origin.x = finalOriginX
            } completion: { [weak self] (_) in
                guard let self = self else { return }
                self.delegate?.showLiveFloatingDidChangedFrame()
            }
        default:
            break
        }
    }
}
