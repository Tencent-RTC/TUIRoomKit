//
//  File.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2024/4/15.
//

import Foundation

extension Dictionary {
    func convertToString() -> String?{
        let dicData = try? JSONSerialization.data(withJSONObject: self, options: [])
        guard let data = dicData else { return nil }
        let str = String(data: data, encoding: String.Encoding.utf8)
        return str
    }
}
