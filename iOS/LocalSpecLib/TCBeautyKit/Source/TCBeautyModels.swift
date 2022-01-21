//
//  TCBeautyModels.swift
//  TXLiteAVDemo
//
//  Created by gg on 2021/5/13.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Foundation
import SSZipArchive
import Toast_Swift

// MARK: Base
public enum TCBeautyType {
    case none
    case beauty
    case filter
    case motion
    case koubei
    case cosmetic
    case gesture
    case green
}
public class TCBeautyBaseItem: NSObject {
    
    public weak var package: TCBeautyBasePackage?
    
    public var isSelected: Bool = false
    
    public let isClear: Bool
    
    public var type: TCBeautyType {
        get {
            return package?.type ?? .none
        }
    }
    
    public let title: String
    public let normalIcon: UIImage?
    public var selectIcon: UIImage?
    
    public var defaultValue: Float = 6
    public var currentValue: Float = 6
    public var minValue: Float = 0
    public var maxValue: Float = 10
    
    public var target: AnyObject?
    public var action: Selector?
    
    public var index: Int = 0
    
    public init(title: String, normalIcon: UIImage?, package: TCBeautyBasePackage? = nil, isClear: Bool = false, selIcon: UIImage? = nil) {
        self.title = title
        self.normalIcon = normalIcon
        self.package = package
        self.isClear = isClear
        self.selectIcon = selIcon
        super.init()
    }
    
    public func setValue(current: Float, min: Float, max: Float) {
        defaultValue = current
        currentValue = current
        minValue = min
        maxValue = max
    }
    
    public func add(target: AnyObject?, action: Selector?) {
        self.target = target
        self.action = action
    }
    
    public func sendAction(_ args: [Any]) {
        guard let target = target, let action = action else {
            return
        }
        if target.responds(to: action) {
            if args.count == 0 {
                _ = target.perform(action, with: nil)
            }
            else if args.count == 1 {
                _ = target.perform(action, with: args.first)
            }
            else if args.count == 2 {
                _ = target.perform(action, with: args.first, with: args.last)
            }
            else {
                _ = target.perform(action, with: args)
            }
        }
    }
}

public class TCBeautyBasePackage: NSObject {
    
    public let title: String
    
    public let enableClearBtn: Bool
    public let enableSlider: Bool
    
    public let type: TCBeautyType
    
    public var typeStr: String {
        get {
            switch type {
            case .beauty:
                return "beauty"
            case .filter:
                return "filter"
            case .motion:
                return "motion"
            case .koubei:
                return "koubei"
            case .cosmetic:
                return "cosmetic"
            case .gesture:
                return "gesture"
            case .green:
                return "green"
            default:
                return "none"
            }
        }
    }
    
    public var items: [TCBeautyBaseItem] = []
    
    public init(enableClearBtn: Bool = false, enableSlider: Bool = true, title: String, type: TCBeautyType) {
        
        self.title = title
        
        self.enableClearBtn = enableClearBtn
        self.enableSlider = enableSlider
        self.type = type
        
        super.init()
    }
    
    public var clearItem: TCBeautyBaseItem? {
        get {
            if enableClearBtn {
                return TCBeautyBaseItem(title: TCBeautyLocalize("TC.Common.Clear"), normalIcon:UIImage.init(named:"clear_nor", in: TCBeautyBundle(), compatibleWith: nil), package: self, isClear: true, selIcon: UIImage.init(named:"clear_nor", in: TCBeautyBundle(), compatibleWith: nil))
            }
            return nil
        }
    }
}

// MARK: Beauty
public class TCBeautyBeautyItem: TCBeautyBaseItem {
    public var beautyStyle: Int = 2
    public var beautyLevel: Float = 6
    public var whiteLevel: Float = 0
    public var ruddyLevel: Float = 0
    
    public init(title: String, normalIcon: UIImage?, package: TCBeautyBasePackage?, target: AnyObject?, action: Selector? = nil, currentValue: Float = 0, minValue: Float = 0, maxValue: Float = 10) {
        
        super.init(title: title, normalIcon: normalIcon, package: package)
        add(target: target, action: action)
        setValue(current: currentValue, min: minValue, max: maxValue)
    }
    
    public override func sendAction(_ args: [Any]) {
        if let curVal = args.first as? Float {
            currentValue = curVal
        }
        if args.count == 5 {
            if let beautyStyleValue = args[1] as? Int {
                beautyStyle = beautyStyleValue
            }
            if let beautyLevelValue = args[2] as? Float {
                beautyLevel = beautyLevelValue
            }
            if let whiteLevelValue = args[3] as? Float {
                whiteLevel = whiteLevelValue
            }
            if let ruddyLevelValue = args[4] as? Float {
                ruddyLevel = ruddyLevelValue
            }
        }
        if index <= 4 {
            applyBeautySettings()
        }
        else if args.count == 1 {
            if let target = target, let action = action, target.responds(to: action) {
                _ = target.perform(action, with: args.first!)
            }
        }
        else {
            super.sendAction(args)
        }
    }
    
    public func applyBeautySettings() {
        if let target = target {
            if target.responds(to: #selector(TCBeautyPanelActionProxy.setBeautyStyle(_:))) {
                target.setBeautyStyle(beautyStyle)
            }
            if target.responds(to: #selector(TCBeautyPanelActionProxy.setBeautyLevel(_:))) {
                target.setBeautyLevel(beautyLevel)
            }
            if target.responds(to: #selector(TCBeautyPanelActionProxy.setWhitenessLevel(_:))) {
                target.setWhitenessLevel(whiteLevel)
            }
            if target.responds(to: #selector(TCBeautyPanelActionProxy.setRuddyLevel(_:))) {
                target.setRuddyLevel(ruddyLevel)
            }
        }
    }
}

public class TCBeautyBeautyPackage: TCBeautyBasePackage {
    
    public func decodeItems(arr: [Dictionary<String, Any>], target: AnyObject?) {
        for (i, dic) in arr.enumerated() {
            guard let title = dic["title"] as? String else { continue }
            guard let normalIcon = dic["normalIcon"] as? String else { continue }
            var selIcon: String = ""
            var action: Selector? = nil
            var minValue: Float = 0
            var maxValue: Float = 10
            var currentValue: Float = 6
            if dic.keys.contains("selector") {
                if let selectorStr = dic["selector"] as? String {
                    action = Selector(selectorStr)
                }
            }
            if dic.keys.contains("selIcon") {
                if let iconStr = dic["selIcon"] as? String {
                    selIcon = iconStr
                }
            }
            if dic.keys.contains("minValue") {
                if let min = dic["minValue"] as? NSNumber {
                    minValue = min.floatValue
                }
            }
            if dic.keys.contains("maxValue") {
                if let max = dic["maxValue"] as? NSNumber {
                    maxValue = max.floatValue
                }
            }
            if dic.keys.contains("currentValue") {
                if let current = dic["currentValue"] as? NSNumber {
                    currentValue = current.floatValue
                }
            }
            
            let item = TCBeautyBeautyItem(title: TCBeautyLocalize(title), normalIcon:UIImage.init(named:normalIcon, in: TCBeautyBundle(), compatibleWith: nil), package: self, target: target, action: action, currentValue: currentValue, minValue: minValue, maxValue: maxValue)
            item.selectIcon = UIImage.init(named:selIcon, in: TCBeautyBundle(), compatibleWith: nil)
            item.index = i
            items.append(item)
        }
    }
}

// MARK: Filter
public class TCBeautyFilterItem: TCBeautyBaseItem {
    
    public let lookupImagePath: String
    public let identifier: String
    
    public init(title: String, normalIcon: UIImage?, package: TCBeautyBasePackage? = nil, lookupImagePath: String, target: AnyObject? = nil, currentValue: Float = 0, minValue: Float = 0, maxValue: Float = 9, identifier: String) {
        self.lookupImagePath = lookupImagePath
        self.identifier = identifier
        super.init(title: title, normalIcon: normalIcon, package: package)
        add(target: target, action: nil)
        setValue(current: currentValue, min: minValue, max: maxValue)
    }
    
    public func setFilter() {
        guard let target = target else {
            return
        }
        let img: UIImage? = UIImage(contentsOfFile: lookupImagePath)
        if target.responds(to: #selector(TCBeautyPanelActionProxy.setFilter(_:))) {
            target.setFilter(img)
        }
    }
    
    public func setSlider(value: Float) {
        currentValue = value
        guard let target = target else {
            return
        }
        if target.responds(to: #selector(TCBeautyPanelActionProxy.setFilterStrength(_:))) {
            target.setFilterStrength(value / 10.0)
        }
        else if target.responds(to: #selector(TCBeautyPanelActionProxy.setFilterConcentration(_:))) {
            target.setFilterConcentration(value / 10.0)
        }
    }
    
    public override func sendAction(_ args: [Any] = []) {
        if args.count > 0 {
            if let value = args.first! as? Float {
                setSlider(value: value)
            }
        }
        else {
            setFilter()
        }
    }
}

public class TCBeautyFilterPackage: TCBeautyBasePackage {
    static let defaultFilterValue: [Float] = [5, 5, 5, 8, 8, 7, 10, 8, 10, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3]
}

// MARK: Motion
public class TCBeautyMotionItem: TCBeautyBaseItem {
    
    public let identifier: String
    public let url: String
    
    public var isDownloading = false
    
    public var isDownloaded: Bool {
        get {
            if isClear {
                return true
            }
            if var files = FileManager.default.subpaths(atPath: floderPath) {
                if files.contains(".DS_Store"), let index = files.firstIndex(of: ".DS_Store") {
                    files.remove(at: index)
                }
                return files.count > 0
            }
            return false
        }
    }
    
    public lazy var session: URLSession = {
        let config = URLSessionConfiguration.default
        let session = URLSession(configuration: config, delegate: self, delegateQueue: .main)
        return session
    }()
    
    public var progressBlock: ((_ progress: Float)->())?
    public var completeBlock: ((_ success: Bool, _ message: String)->())?
    
    deinit {
        stopTask()
        flushRefrence()
    }
    
    public func stopTask() {
        if isDownloading {
            session.invalidateAndCancel()
            isDownloading = false
        }
    }
    
    var floderPath: String {
        get {
            var path = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first ?? NSHomeDirectory().appending("Documents")
            guard let package = package else { return path }
            path.append("/packages")
            try? FileManager.default.createDirectory(at: URL(fileURLWithPath: path), withIntermediateDirectories: true, attributes: nil)
            path.append("/\(package.typeStr)")
            try? FileManager.default.createDirectory(at: URL(fileURLWithPath: path), withIntermediateDirectories: true, attributes: nil)
            path.append("/\(identifier)")
            try? FileManager.default.createDirectory(at: URL(fileURLWithPath: path), withIntermediateDirectories: true, attributes: nil)
            return path
        }
    }
    
    var packagePath: String {
        get {
            var path = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first ?? NSHomeDirectory().appending("Documents")
            guard let package = package else { return path }
            path.append("/packages")
            try? FileManager.default.createDirectory(at: URL(fileURLWithPath: path), withIntermediateDirectories: true, attributes: nil)
            path.append("/\(package.typeStr)")
            try? FileManager.default.createDirectory(at: URL(fileURLWithPath: path), withIntermediateDirectories: true, attributes: nil)
            return path
        }
    }
    
    public init(identifier: String, title: String, url: String, package: TCBeautyBasePackage, target: AnyObject? = nil) {
        self.identifier = identifier
        self.url = url
        super.init(title: title, normalIcon:UIImage.init(named:identifier, in: TCBeautyBundle(), compatibleWith: nil), package: package)
        add(target: target, action: nil)
    }
    
    public override func sendAction(_ args: [Any]) {
        if isDownloaded {
            apply()
        }
        else {
            download { (progress) in
                
            } complete: { [weak self] (success, message) in
                guard let `self` = self else { return }
                if self.isSelected && success {
                    self.apply()
                }
                else if !success {
                    if let window = UIApplication.shared.windows.first {
                        window.makeToast(message)
                    }
                }
            }
        }
    }
    
    public func apply() {
        guard let target = target else {
            return
        }
        if target.responds(to: #selector(TCBeautyPanelActionProxy.setMotionTmpl(_:inDir:))) {
            if isClear {
                target.setMotionTmpl(nil, inDir: packagePath)
            }
            else {
                target.setMotionTmpl(identifier, inDir: packagePath)
            }
        }
    }
    
    public func download(progress: @escaping (_ progress: Float)->(), complete: @escaping (_ success: Bool, _ message: String)->()) {
        if isDownloading {
            return
        }
        guard let url = URL(string: url) else {
            complete(false, "Url error")
            return
        }
        isDownloading = true
        progressBlock = progress
        completeBlock = complete
        progress(0)
        let downloadPath = floderPath.appending("/\(identifier)_download.zip")
        if FileManager.default.fileExists(atPath: downloadPath) {
            try? FileManager.default.removeItem(at: URL(fileURLWithPath: downloadPath))
        }
        let req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30)
        let downloadTask = session.downloadTask(with: req)
        downloadTask.resume()
    }
}
extension TCBeautyMotionItem: URLSessionDownloadDelegate {
    public func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error as? URLError {
            isDownloading = false
            if error.errorCode == -999 {
                return
            }
            guard let action = completeBlock else {
                return
            }
            action(false, error.localizedDescription)
            flushRefrence()
        }
    }
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        guard let action = progressBlock else {
            return
        }
        let progress = Float(totalBytesWritten) / Float(totalBytesExpectedToWrite)
        action(progress)
    }
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        
        let res = SSZipArchive.unzipFile(atPath: location.path, toDestination: self.packagePath)
        
        self.isDownloading = false
        
        if self.isDownloaded && res {
            if let action = self.completeBlock {
                action(true, "")
            }
        }
        else {
            if let action = self.completeBlock {
                action(false, "Unzip failed")
            }
        }
        self.flushRefrence()
    }
    func flushRefrence() {
        completeBlock = nil
        progressBlock = nil
    }
}
public class TCBeautyMotionPackage: TCBeautyBasePackage {
    public func decodeItems(arr: [Dictionary<String, Any>], target: AnyObject?) {
        for (i, dic) in arr.enumerated() {
            guard let title = dic["title"] as? String else { continue }
            guard let identifier = dic["id"] as? String else { continue }
            guard let url = dic["url"] as? String else { continue }
            let item = TCBeautyMotionItem(identifier: identifier, title: TCBeautyLocalize(title), url: url, package: self, target: target)
            item.index = i
            items.append(item)
        }
    }
}

// MARK: Green
public class TCBeautyGreenItem: TCBeautyBaseItem {
    public let url: String
    public init(url: String, title: String, normalIcon: String, package: TCBeautyBasePackage, target: AnyObject?) {
        self.url = url
        super.init(title: title, normalIcon:UIImage.init(named:"beautyPanelGoodLuckIcon", in: TCBeautyBundle(), compatibleWith: nil), package: package, isClear: false)
        add(target: target, action: nil)
    }
    
    public override func sendAction(_ args: [Any]) {
        guard let target = target else {
            return
        }
        if target.responds(to: #selector(TCBeautyPanelActionProxy.setGreenScreenFile(_:))) {
            target.setGreenScreenFile(url)
        }
    }
}

public class TCBeautyGreenPackage: TCBeautyBasePackage {
    
}
