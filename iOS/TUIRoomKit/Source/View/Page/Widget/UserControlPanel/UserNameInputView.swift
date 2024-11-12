//
//  ChangeUserNameView.swift
//  TUIRoomKit
//
//  Created by janejntang on 2024/9/10.
//

import UIKit
import SnapKit

protocol UserNameInputViewResponder: AnyObject {
    func changeUserName(name: String)
    func onEndEditing()
}

class UserNameInputView: UIView {
    weak var viewResponder: UserNameInputViewResponder?
    private let maxInputBytes = 32
    var userName: String?
    private let topView: UIView = {
        let view = UIView()
        view.backgroundColor = UIColor(0x22262E)
        return view
    }()
    
    private let backgroundView: UIVisualEffectView = {
        let blurEffect = UIBlurEffect(style: .dark)
        let view = UIVisualEffectView(effect: blurEffect)
        view.frame = UIScreen.main.bounds
        return view
    }()
    
    private lazy var inputTextView: UITextView = {
        let view = UITextView(frame: .zero)
        view.font = UIFont.systemFont(ofSize: 17.5, weight: .regular)
        view.returnKeyType = .done
        view.layer.cornerRadius = view.sizeThatFits(.zero).height / 2
        view.layer.masksToBounds = true
        view.textColor = UIColor(0xD5E0F2).withAlphaComponent(0.6)
        view.backgroundColor = UIColor(0x4F586B).withAlphaComponent(0.3)
        view.text = userName
        view.contentInset = UIEdgeInsets(top: 0, left: 16, bottom: 0, right: 16)
        return view
    }()
    
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        isViewReady = true
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
    }
    
    private func constructViewHierarchy() {
        addSubview(backgroundView)
        topView.addSubview(inputTextView)
        addSubview(topView)
    }
    
    private func activateConstraints() {
        backgroundView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        topView.snp.makeConstraints { make in
            make.leading.trailing.equalToSuperview()
            make.height.equalTo(60.scale375Height())
            make.bottom.equalToSuperview()
        }
        inputTextView.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(16.scale375())
            make.trailing.equalToSuperview().offset(-16.scale375())
            make.height.equalTo(36.scale375Height())
            make.center.equalToSuperview()
        }
    }
    
    private func bindInteraction() {
        isHidden = true
        inputTextView.delegate = self
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(keyboardWillShow(notification: )),
                                               name: UIResponder.keyboardWillShowNotification,
                                               object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillHide(notification:)), name: UIResponder.keyboardWillHideNotification, object: nil)
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(endEdit))
        backgroundView.addGestureRecognizer(tapGesture)
    }
    
    func showInputView(userName: String?) {
        inputTextView.text = userName
        isHidden = false
        inputTextView.becomeFirstResponder()
    }
    
    @objc func endEdit() {
        inputTextView.endEditing(true)
        viewResponder?.onEndEditing()
    }
    
    func hideInputView() {
        inputTextView.endEditing(true)
        isHidden = true
    }
    
    @objc func keyboardWillShow(notification: NSNotification) {
        guard let keyboardRect: CGRect = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
              let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double
        else {
            return
        }
        UIView.animate(withDuration: duration, delay: 0, options: .curveEaseInOut) { [weak self] in
            guard let self = self else { return }
            self.topView.transform = CGAffineTransform(translationX: 0, y: -keyboardRect.height)
        }
    }
    
    @objc func keyboardWillHide(notification: NSNotification) {
        if let keyboardRect: CGRect = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
           let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double {
            UIView.animate(withDuration: duration, delay: 0, options: .curveEaseInOut) { [weak self] in
                guard let self = self else { return }
                self.topView.transform = CGAffineTransform(translationX: 0, y: keyboardRect.height)
            } completion: { [weak self] _ in
                guard let self = self else { return }
                self.isHidden = true
            }
        } else {
            isHidden = true
        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.removeObserver(self, name: UIResponder.keyboardWillHideNotification, object: nil)
    }
}

extension UserNameInputView: UITextViewDelegate {
    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        if text == "\n" {
            if !textView.text.isEmpty {
                viewResponder?.changeUserName(name: textView.text)
            }
            endEdit()
            return false
        }
        let newText = (textView.text as NSString).replacingCharacters(in: range, with: text)
        if let newTextData = newText.data(using: .utf8), newTextData.count <= maxInputBytes {
            return true
        } else {
            return false
        }
    }
}
