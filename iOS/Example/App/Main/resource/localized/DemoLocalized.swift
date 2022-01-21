//
//  DemoLocalized.swift
//  DemoApp
//
//  Created by wesley on 2022/1/19.
//

import Foundation

let demoLocalizedTableName = "DemoLocalized"
func TRTCDemoLocalize(_ key: String) -> String {
    return localizeFromTable(key: key, table: demoLocalizedTableName)
}
