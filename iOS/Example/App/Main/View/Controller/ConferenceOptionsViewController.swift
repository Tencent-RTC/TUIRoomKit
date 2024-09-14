//
//  ConferenceOptionsViewController.swift
//  Alamofire
//
//  Created by aby on 2022/12/26.
//  Copyright © 2022 Tencent. All rights reserved.
//

import UIKit
import RTCRoomEngine
import Factory
import Combine
import TUIRoomKit

class ConferenceOptionsViewController: UIViewController {
    private var cancellableSet = Set<AnyCancellable>()
    override var shouldAutorotate: Bool {
        return false
    }
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .portrait
    }
    
    init() {
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        guard let optionsView = view as? ConferenceOptionsView else {
            return
        }
        UIApplication.shared.isIdleTimerDisabled = false
        navigationController?.setNavigationBarHidden(true, animated: false)
        optionsView.reloadConferenceList()
    }
        
    override func loadView() {
        let view = ConferenceOptionsView(viewController: self)
        self.view = view
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        ConferenceSession.sharedInstance.setContactsViewProvider { participants in
            return SelectMemberViewController(participants: participants)
        }
        ConferenceSession.sharedInstance.enableWaterMark()
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension ConferenceOptionsViewController {
    func didBackButtonClicked(in optionsView: ConferenceOptionsView) {
        if let navigationController = self.navigationController {
            if navigationController.viewControllers.first != self {
                navigationController.popViewController(animated: true)
            } else if presentingViewController != nil {
                navigationController.dismiss(animated: true, completion: nil)
            }
        } else if presentingViewController != nil {
            dismiss(animated: true, completion: nil)
        }

    }
    
    func didDebugButtonClicked() {
        let debugVC = RoomFileBrowserViewController(bathPath: NSHomeDirectory())
        navigationController?.pushViewController(debugVC, animated: true)
    }
    
    func joinRoom() {
        navigationController?.pushViewController(EnterRoomViewController(), animated: true)
    }
    
    func createRoom() {
        navigationController?.pushViewController(CreateRoomViewController(), animated: true)
    }
    
    func scheduleRoom() {
        let scheduleViewController = ScheduleConferenceViewController { selectedList in
            let participants = ConferenceParticipants(selectedList: selectedList)
            return SelectMemberViewController(participants: participants)
        }
        navigationController?.pushViewController(scheduleViewController, animated: true)
    }
}
