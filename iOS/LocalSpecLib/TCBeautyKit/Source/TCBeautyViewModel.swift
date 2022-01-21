//
//  TCBeautyViewModel.swift
//  TXLiteAVDemo
//
//  Created by gg on 2021/5/7.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Foundation

@objcMembers
public class TCBeautyViewModel: NSObject {
    
    public let viewModel : NSObject
    public let actionPerformer : TCBeautyPanelActionProxy
    
    @objc public init(viewModel: NSObject) {
        self.viewModel = viewModel
        self.actionPerformer = TCBeautyPanelActionProxy(sdkObject: viewModel)
        super.init()
    }
    
    deinit {
        reset()
    }
    
    public var beautyStyle: Int = 2
    public var beautyLevel: Float = 6
    public var whiteLevel: Float = 0
    public var ruddyLevel: Float = 0
    
    public var currentShowIndexPath: IndexPath = IndexPath(item: -1, section: 0)
    public weak var currentSelectItem: TCBeautyBaseItem?
    
    public func applyDefaultSetting() {
        reset()
    }
    
    public lazy var dataSource: [TCBeautyBasePackage] = {
        
        var res : [TCBeautyBasePackage] = []
        
        let beautyPkg = getBeautyPackage()
        res.append(beautyPkg)
        
        let filterPkg = getFilterPackage()
        res.append(filterPkg)
        
        let motionPkgs = getMotionPackages()
        res.append(contentsOf: motionPkgs)
        
        let greenPkg = getGreenPackage()
        res.append(greenPkg)
        
        currentShowIndexPath = IndexPath(item: 2, section: 0)
        if let pkg = res.first {
            currentSelectItem = pkg.items.count > 3 ? pkg.items[2] : pkg.items.first
        }
        
        return res
    }()
    
    public func reset() {
        for pkg in dataSource {
            for item in pkg.items {
                item.currentValue = item.defaultValue
                switch item.type {
                case .beauty:
                    let item = item as! TCBeautyBeautyItem
                    if item.index <= 4 {
                        beautyStyle = item.index < 3 ? item.index : 2
                        item.sendAction([item.currentValue, beautyStyle, beautyLevel, whiteLevel, ruddyLevel])
                    } else {
                        item.sendAction([0])
                    }
                case .filter:
                    if !item.isClear {
                        let item = item as! TCBeautyFilterItem
                        if item.identifier == "baixi" {
                            item.setFilter()
                            item.setSlider(value: item.currentValue)
                        }
                    }
                case .motion, .koubei, .cosmetic, .gesture:
                    if item.isClear {
                        item.sendAction([])
                    }
                    else {
                        let item = item as! TCBeautyMotionItem
                        item.stopTask()
                    }
                case .green:
                    if item.isClear {
                        item.sendAction([])
                    }
                default:
                    break
                }
            }
        }
    }
    
    // MARK: Green
    func getGreenPackage() -> TCBeautyBasePackage {
        let greenPkg = TCBeautyGreenPackage(enableClearBtn: true, enableSlider: false, title: TCBeautyLocalize("TC.BeautyPanel.Menu.GreenScreen"), type: .green)
        
        if let path = TCBeautyBundle().path(forResource: "goodluck", ofType: "mp4") {
            let item = TCBeautyGreenItem(url: path, title: TCBeautyLocalize("TC.BeautySettingPanel.GoodLuck"), normalIcon: "beautyPanelGoodLuckIcon", package: greenPkg, target: actionPerformer)
            greenPkg.items.append(item)
        }
        
        if let clearItem = greenPkg.clearItem {
            clearItem.add(target: actionPerformer, action: #selector(TCBeautyPanelActionProxy.setGreenScreenFile(_:)))
            greenPkg.items.insert(clearItem, at: 0)
        }
        
        return greenPkg
    }
    
    // MARK: Motion
    func getMotionPackages() -> [TCBeautyBasePackage] {
        
        var pkgs: [TCBeautyBasePackage] = []
        
        let root = readMotionJson()
        
        if root.keys.contains("motion"), let arr = root["motion"] as? [Dictionary<String, Any>] {
            let motionPkg = TCBeautyMotionPackage(enableClearBtn: true, enableSlider: false, title: TCBeautyLocalize("TC.BeautyPanel.Menu.VideoEffect"), type: .motion)
            motionPkg.decodeItems(arr: arr, target: actionPerformer)
            
            if let clearItem = motionPkg.clearItem {
                clearItem.add(target: actionPerformer, action: #selector(TCBeautyPanelActionProxy.setMotionTmpl(_:inDir:)))
                motionPkg.items.insert(clearItem, at: 0)
            }
            
            pkgs.append(motionPkg)
        }
        
        if root.keys.contains("cosmetic"), let arr = root["cosmetic"] as? [Dictionary<String, Any>] {
            let motionPkg = TCBeautyMotionPackage(enableClearBtn: true, enableSlider: false, title: TCBeautyLocalize("TC.BeautyPanel.Menu.Cosmetic"), type: .koubei)
            motionPkg.decodeItems(arr: arr, target: actionPerformer)
            
            if let clearItem = motionPkg.clearItem {
                clearItem.add(target: actionPerformer, action: #selector(TCBeautyPanelActionProxy.setMotionTmpl(_:inDir:)))
                motionPkg.items.insert(clearItem, at: 0)
            }
            
            pkgs.append(motionPkg)
        }
        
        if root.keys.contains("gesture"), let arr = root["gesture"] as? [Dictionary<String, Any>] {
            let motionPkg = TCBeautyMotionPackage(enableClearBtn: true, enableSlider: false, title: TCBeautyLocalize("TC.BeautyPanel.Menu.Gesture"), type: .cosmetic)
            motionPkg.decodeItems(arr: arr, target: actionPerformer)
            
            if let clearItem = motionPkg.clearItem {
                clearItem.add(target: actionPerformer, action: #selector(TCBeautyPanelActionProxy.setMotionTmpl(_:inDir:)))
                motionPkg.items.insert(clearItem, at: 0)
            }
            
            pkgs.append(motionPkg)
        }
        
        if root.keys.contains("bgremove"), let arr = root["bgremove"] as? [Dictionary<String, Any>] {
            let motionPkg = TCBeautyMotionPackage(enableClearBtn: true, enableSlider: false, title: TCBeautyLocalize("TC.BeautyPanel.Menu.BlendPic"), type: .gesture)
            motionPkg.decodeItems(arr: arr, target: actionPerformer)
            
            if let clearItem = motionPkg.clearItem {
                clearItem.add(target: actionPerformer, action: #selector(TCBeautyPanelActionProxy.setMotionTmpl(_:inDir:)))
                motionPkg.items.insert(clearItem, at: 0)
            }
            
            pkgs.append(motionPkg)
        }
        
        return pkgs
    }
    
    func readMotionJson() -> Dictionary<String, Any> {
        
        guard let path = TCBeautyBundle().path(forResource: "TCPituMotion", ofType: "json") else { return [:] }
        
        guard let data = try? Data(contentsOf: URL(fileURLWithPath: path)) else { return [:] }
        
        guard let res = try? JSONSerialization.jsonObject(with: data, options: .mutableContainers) else { return [:] }
        
        guard let root = res as? Dictionary<String, Any> else { return [:] }
        
        guard root.keys.contains("bundle"), root.keys.contains("package") else { return [:] }
        
        guard let bundle = root["bundle"] as? String, bundle == "pitu" else { return [:] }
        
        guard let packages = root["package"] as? Dictionary<String, Any> else { return [:] }
        
        return packages
    }
    
    // MARK: Filter
    func getFilterPackage() -> TCBeautyBasePackage {
        
        let filterPkg = TCBeautyFilterPackage(enableClearBtn: true, enableSlider: true, title: TCBeautyLocalize("TC.BeautyPanel.Menu.Filter"), type: .filter)
        
        let defaultValue = TCBeautyFilterPackage.defaultFilterValue
        
        for (i, filter) in TCFilterManager.default().allFilters.enumerated() {
            let identifier = "TC.Common.Filter_\(filter.identifier.rawValue)"
            var imgName = filter.identifier.rawValue
            if imgName == "white" {
                imgName = "fwhite"
            }
            
            let item = TCBeautyFilterItem(title: TCBeautyLocalize(identifier), normalIcon: UIImage.init(named: imgName, in: TCBeautyBundle(), compatibleWith: nil), package: filterPkg, lookupImagePath: filter.lookupImagePath, target: actionPerformer, currentValue: defaultValue[i], identifier: filter.identifier.rawValue)
            item.index = i
            filterPkg.items.append(item)
        }
        
        if let clearItem = filterPkg.clearItem {
            clearItem.add(target: actionPerformer, action: #selector(TCBeautyPanelActionProxy.setFilter(_:)))
            filterPkg.items.insert(clearItem, at: 0)
        }
        
        return filterPkg
    }
    
    // MARK: Beauty
    private let DefaultBeautyLevel = 6
    private let DefaultWhitnessLevel = 1
    
    func getBeautyPackage() -> TCBeautyBasePackage {
        
        let beautyPkg = TCBeautyBeautyPackage(title: TCBeautyLocalize("TC.BeautyPanel.Menu.Beauty"), type: .beauty)
        
        guard let path = TCBeautyBundle().path(forResource: "TCBeauty", ofType: "json") else { return beautyPkg }
        
        guard let data = try? Data(contentsOf: URL(fileURLWithPath: path)) else { return beautyPkg }
        
        guard let res = try? JSONSerialization.jsonObject(with: data, options: .mutableContainers) else { return beautyPkg }
        
        guard let root = res as? Dictionary<String, Any> else { return beautyPkg }
        
        guard root.keys.contains("package") else { return beautyPkg }
        
        guard let arr = root["item"] as? Array<Dictionary<String, Any>> else { return beautyPkg }
        
        beautyPkg.decodeItems(arr: arr, target: actionPerformer)
        
        if beautyPkg.items.count > 3 {
            beautyPkg.items[2].isSelected = true
        }
        
        if let clearItem = beautyPkg.clearItem {
            beautyPkg.items.insert(clearItem, at: 0)
        }
        
        return beautyPkg
    }
}
