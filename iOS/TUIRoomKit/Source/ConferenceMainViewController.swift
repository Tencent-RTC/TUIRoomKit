//
//  ConferenceMainViewController.swift
//  TUIRoomKit
//
//  Created by janejntang on 2024/3/6.
//

import UIKit

@objcMembers public class ConferenceMainViewController: UIViewController {
    private var viewModel: ConferenceMainViewModel = ConferenceMainViewModel()
    public override var shouldAutorotate: Bool {
        return true
    }
    
    public override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .allButUpsideDown
    }
    
    public override func loadView() {
        self.view = ConferenceMainView(viewModel: viewModel, viewFactory: viewModel)
    }
    
    public override func viewDidLoad() {
        super.viewDidLoad()
        RoomRouter.shared.initializeNavigationController(rootViewController: self)
#if RTCube_APPSTORE
        let selector = NSSelectorFromString("showAlertUserLiveTips")
        if responds(to: selector) {
            perform(selector)
        }
#endif
        viewModel.onViewDidLoadAction()
    }
    
    public override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(true, animated: false)
        UIApplication.shared.isIdleTimerDisabled = true
    }
    
    public override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
    }
    
    public func setStartConferenceParams(params: StartConferenceParams) {
        viewModel.setStartConferenceParams(params: params)
    }
    
    public func setJoinConferenceParams(params: JoinConferenceParams) {
        viewModel.setJoinConferenceParams(params: params)
    }
        
    var startConferenceParams: StartConferenceParams? {
        get {
            return viewModel.startConferenceParams
        }
    }
    
    var joinConferenceParams: JoinConferenceParams? {
        get {
            return viewModel.joinConferenceParams
        }
    }

    
    deinit {
        debugPrint("deinit \(self)")
    }
}
