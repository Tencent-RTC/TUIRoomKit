//
//  MainView.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/7/21.
//

import Foundation
import UIKit

class MainView: UIView {
    weak var rootViewController: MainViewController?
    private let navigationView: UIView = {
        let view = UIView(frame: .zero)
        view.backgroundColor = .white
        return view
    }()
    
    private let logoImageView: UIImageView = {
        let imageView = UIImageView(frame: .zero)
        imageView.image = UIImage(named: "tuiroom_logo")
        return imageView
    }()
    
    private let logoutButton: UIButton = {
        let button = UIButton(type: .custom)
        button.backgroundColor = .clear
        button.setTitle(.logoutText, for: .normal)
        button.setTitleColor(.black, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .heavy)
        button.titleLabel?.textAlignment = .center
        return button
    }()
    
    private let containerView: UIView = {
        let view = UIView(frame: .zero)
        view.layer.cornerRadius = 10
        view.layer.masksToBounds = true
        return view
    }()
    
    private let iconImageView: UIImageView = {
        let image = UIImage(named: "tuiroom_main_home")
        let imageView = UIImageView(image: image)
        imageView.contentMode = .scaleAspectFit
        return imageView
    }()
    
    private let titleLabel: UILabel = {
        let label = UILabel(frame: .zero)
        label.font = UIFont.boldSystemFont(ofSize: 17)
        label.text = .videoConferencingText
        label.textColor = UIColor(0x262B32)
        label.textAlignment = .left
        label.numberOfLines = 2
        label.adjustsFontSizeToFitWidth = true
        return label
    }()
    
    private let descLabel: UILabel = {
        let label = UILabel(frame: .zero)
        label.font = UIFont.systemFont(ofSize: 13)
        label.text = .averageLatencyText
        label.textColor = UIColor(0x626E84)
        label.textAlignment = .left
        label.numberOfLines = 0
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.8
        return label
    }()
    
    private var isViewReady = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    override func draw(_ rect: CGRect) {
        super.draw(rect)
        var colors = [UIColor.white.cgColor,UIColor.white.cgColor]
        if let color1 = UIColor(hex: "AECFFF"), let color2 = UIColor(hex: "F4F7FF") {
            colors = [color1.cgColor, color2.cgColor]
        }
        let gradientLayer = containerView.gradient(colors: colors)
        gradientLayer.startPoint = CGPoint(x: 0, y: 0.5)
        gradientLayer.endPoint = CGPoint(x: 1, y: 0.5)
    }
    
    private func constructViewHierarchy() {
        addSubview(navigationView)
        navigationView.addSubview(logoImageView)
        navigationView.addSubview(logoutButton)
        addSubview(containerView)
        containerView.addSubview(iconImageView)
        containerView.addSubview(titleLabel)
        containerView.addSubview(descLabel)
    }
    
    private func activateConstraints() {
        navigationView.snp.makeConstraints { make in
            make.top.equalToSuperview()
            make.leading.equalToSuperview()
            make.trailing.equalToSuperview()
            make.height.equalTo(100)
        }
        logoImageView.snp.makeConstraints { make in
            make.left.equalToSuperview().offset(20)
            make.bottom.equalToSuperview().offset(-10)
            make.width.equalTo(142)
            make.height.equalTo(32)
        }
        logoutButton.snp.makeConstraints { make in
            make.trailing.equalToSuperview().offset(-20)
            make.centerY.equalTo(logoImageView)
            make.width.equalTo(50)
            make.height.equalTo(25)
        }
        containerView.snp.makeConstraints { (make) in
            make.top.equalTo(navigationView.snp.bottom).offset(20)
            make.height.equalTo(130)
            make.leading.equalToSuperview().offset(20)
            make.trailing.equalToSuperview().offset(-20)
        }
        titleLabel.snp.makeConstraints { (make) in
            make.leading.equalToSuperview().offset(20)
            make.top.equalToSuperview().offset(16)
        }
        descLabel.snp.makeConstraints { (make) in
            make.left.equalTo(titleLabel)
            make.right.equalTo(iconImageView.snp.left).offset(-20)
            make.top.equalTo(titleLabel.snp.bottom).offset(10)
        }
        iconImageView.snp.makeConstraints { (make) in
            make.right.equalToSuperview()
            make.width.equalTo(172)
            make.height.equalTo(105.0)
            make.centerY.equalToSuperview()
        }
    }
    
    private func bindInteraction() {
        backgroundColor = UIColor(red: 235, green: 237, blue: 245)
        let tap = UITapGestureRecognizer(target: self, action: #selector(didTap(sender:)))
        containerView.addGestureRecognizer(tap)
        logoutButton.addTarget(self, action: #selector(logout(sender:)), for: .touchUpInside)
    }
    
    @objc func didTap(sender: UIView) {
        rootViewController?.enterPrepareView()
    }
    
    @objc func logout(sender: UIButton) {
        rootViewController?.logout()
    }
}

private extension String {
    static var videoConferencingText: String {
        TRTCDemoLocalize("TUIRoom.video.conferencing")
    }
    static var averageLatencyText: String {
        TRTCDemoLocalize("TUIRoom.average.latency.desc")
    }
    static var logoutText: String {
        TRTCDemoLocalize("TUIRoom.logout")
    }
}
