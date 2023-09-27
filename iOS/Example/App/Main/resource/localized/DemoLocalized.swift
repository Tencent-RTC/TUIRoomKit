//
//  DemoLocalized.swift
//  DemoApp
//
//  Created by wesley on 2022/1/19.
//

import Foundation

let demoLocalizedTableName = "DemoLocalized"
func RoomDemoLocalize(_ key: String) -> String {
    return localizeFromTable(key: key, table: demoLocalizedTableName)
}
