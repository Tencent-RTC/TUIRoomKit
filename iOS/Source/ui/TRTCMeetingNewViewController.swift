//
//  TRTCMeetingNewViewController.swift
//  TRTCScenesDemo
//
//  Created by xcoderliu on 4/22/20.
//  Copyright © 2020 xcoderliu. All rights reserved.
//

import UIKit

public class TRTCMeetingNewViewController: UIViewController {
    
    public var navigationToPopCallback: (() -> Void)? = nil
    
    let roomInput = UITextField()
    let openCameraSwitch = UISwitch()
    let openMicSwitch = UISwitch()
    
    let speechQualityButton = UIButton()
    let defaultQualityButton = UIButton()
    let musicQualityButton = UIButton()
    var audioQuality: Int = 1
    
    let distinctVideoButton = UIButton()
    let fluencyVideoButton = UIButton()
    var videoQuality: Int = 1 // 1 流畅, 2清晰
    
    let btnSize = CGSize(width: 76, height: 38)
    
    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        TRTCMeetingIMManager.shared.loadData()
        setupUI()
    }
    
    public override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: false)
    }
    
    deinit {
        debugPrint("TRTCMeetingNewViewController deinit")
    }
}
