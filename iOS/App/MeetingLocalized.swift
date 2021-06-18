//
//  MeetingLocalized.swift
//  TUIMeetingApp
//
//  Created by adams on 2021/6/7.
//

import Foundation

//MARK: Meeting
let MeetingLocalizeTableName = "MeetingLocalized"
func TRTCMeetingLocalize(_ key: String) -> String {
    return localizeFromTable(key: key, table: MeetingLocalizeTableName)
}

