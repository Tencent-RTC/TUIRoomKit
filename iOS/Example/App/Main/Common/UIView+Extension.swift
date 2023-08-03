//
//  UIView+Extension.swift
//  DemoApp
//
//  Created by 唐佳宁 on 2023/7/24.
//
import Foundation
import UIKit

public extension UIView {
    
    private struct AssociatedKeys {
        static var gradientLayerKey = "gradientLayerKey"
    }
    
    var gradientLayer: CAGradientLayer? {
        get {
            return objc_getAssociatedObject(self, &AssociatedKeys.gradientLayerKey) as? CAGradientLayer
        }
        set {
            objc_setAssociatedObject(self, &AssociatedKeys.gradientLayerKey, newValue, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        }
    }
    
    func removeGradientLayer() {
        guard let glayer = gradientLayer else {
            return
        }
        glayer.removeFromSuperlayer()
        gradientLayer = nil
    }
    
    @discardableResult
    func gradient(colors: [CGColor]) -> CAGradientLayer {
        
        func createGradientLayer() -> CAGradientLayer {
            let gradientLayer = CAGradientLayer()
            gradientLayer.startPoint = .zero
            gradientLayer.endPoint = CGPoint(x: 1, y: 0)
            gradientLayer.locations = [0, 1]
            self.gradientLayer = gradientLayer
            return gradientLayer
        }
        
        guard let sublayers = layer.sublayers else {
            let gradientLayer = createGradientLayer()
            gradientLayer.colors = colors
            gradientLayer.frame = bounds
            layer.insertSublayer(gradientLayer, at: 0)
            self.gradientLayer = gradientLayer
            return gradientLayer
        }
        for sublayer in sublayers {
            if sublayer.isKind(of: CAGradientLayer.self) {
                if let glayer = sublayer as? CAGradientLayer {
                    if let gcolors = glayer.colors as? [CGColor], gcolors == colors {
                        glayer.frame = bounds
                        self.gradientLayer = glayer
                        return glayer
                    }
                }
            }
        }
        let gradientLayer = createGradientLayer()
        gradientLayer.colors = colors
        gradientLayer.frame = bounds
        layer.insertSublayer(gradientLayer, at: 0)
        self.gradientLayer = gradientLayer
        return gradientLayer
    }
}
