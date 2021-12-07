//
//  TRTCMeetingIMManager.swift
//  TRTCMeeting
//
//  Created by gg on 2021/5/18.
//

import Foundation
import ImSDK_Plus

class TRTCMeetingIMManager: NSObject {
    static let shared = TRTCMeetingIMManager()
    
    var curUserID: String = ""
    
    var curUserName: String = ""
    var curUserAvatar: String = ""
    
    var isLoaded = false
    
    func loadData() {
        curUserID = V2TIMManager.sharedInstance()?.getLoginUser() ?? ""
        V2TIMManager.sharedInstance()?.getUsersInfo([curUserID], succ: { [weak self] (infos) in
            guard let `self` = self else { return }
            guard let info = infos?.first else {
                return
            }
            self.isLoaded = true
            self.curUserName = info.nickName ?? ""
            self.curUserAvatar = info.faceURL ?? ""
            
        }, fail: { (code, msg) in
            
        })
    }
}
