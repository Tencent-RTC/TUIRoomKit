# Quick Run of TUIRoomKit Demo for iOS

_[中文](README.md) | English_

This document describes how to quickly run the TUIRoomKit demo project to make a high-quality audio/video call. For more information on the TUIRoomKit component connection process, see **[Integrating TUIRoomKit (iOS)](https://trtc.io/document/54842)**.

## Directory Structure
```
TUIRoomKit
├─ Example                    // multi-person video conferencing demo project
│   ├─ App                    // Folder of entering/creating multi-person video conferencing UI code and used images and internationalization string resources
│   ├─ Debug                  // Folder of the key business code required for project debugging and running
│   ├─ Login                  // Folder of the login UI and business logic code
│   └─ TXReplayKit_Screen     // Folder of sharing screen
└─ TUIRoomKit                 // Folder of multi-person video conferencing UI code and used images and internationalization string resources
```

## Environment Requirements
- Xcode 13.0 or above

## Running the Demo

[](id:ui.step1)
### Step 1. Activate the service
1. Please refer to the official documentation at [Integration (TUIRoomKit)](https://trtc.io/document/54842) to obtain your own SDKAppID and SDKSecreKey.

[](id:ui.step2)
### Step 2. Download the source code and configure the project
1. Clone or directly download the source code in the repository. **Feel free to star our project if you like it.**
2. Find and open the `iOS/Example/Debug/GenerateTestUserSig.swift` file.
3. Set parameters in `GenerateTestUserSig.swift`:
	<img src="../Preview/test-user-sig-ios.png" width="900">
	- SDKAPPID: A placeholder by default. Set it to the `SDKAppID` that you noted down in step 1.
	- SECRETKEY: A placeholder by default. Set it to the key information that you noted down in step 1.

[](id:ui.step3)
### Step 3. Compile and run the application

1. Open Terminal, enter the project directory, run the `pod install` command, and wait for it to complete.
2. Open the demo project `TUIRoomKit/Example/DemoApp.xcworkspace` with Xcode 12.0 or later and click **Run**.

[](id:ui.step4)

## Have any questions?
Welcome to join our Telegram Group to communicate with our professional engineers! We are more than happy to hear from you~
Click to join: https://t.me/+EPk6TMZEZMM5OGY1
Or scan the QR code

<img src="https://qcloudimg.tencent-cloud.cn/raw/9c67ed5746575e256b81ce5a60216c5a.jpg" width="320"/>
