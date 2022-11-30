# Quick Run of TUIRoom Demo for iOS
_[中文](README.md) | English_

This document describes how to quickly run the TUIRoom demo project to try out multi-person audio/video interactions. For more information on the TUIRoom component connection process, see **[Integrating TUIRoom (iOS)](https://www.tencentcloud.com/document/product/647/37284)**.


## Directory Structure

```
TUIRoom
├─ Example              // Project module, which provides the TUIRoom testing page
├─ Resources            // Resource files used in TUIRoom
├─ Source               // Encapsulated TUIRoom component logic
├─ TUIBeauty            // Core beauty filter component
├─ TXAppBasic           // Dependent basic components of the project
└─ TUIRoom.podspec      // CocoaPods podspec file of the TUIRoom component

```

## Environment Requirements
- Xcode 11.0 or above
- Operating system: iOS 11.0 or later
- A valid developer signature for your project
  
## Demo Run Example

### Step 1. Create a TRTC application
- You have [signed up for a Tencent Cloud account](https://intl.cloud.tencent.com/document/product/378/17985) and completed [identity verification](https://intl.cloud.tencent.com/document/product/378/3629).
  
### Obtaining `SDKAPPID` and `SECRETKEY`
1. Log in to the TRTC console and select **Development Assistance** to Create Application.
2. Enter an application name such as `TestTRTC` and click **Create**.
<img src="https://main.qcloudimg.com/raw/169391f6711857dca6ed8cfce7b391bd.png" width="650" height="295"/>
3. Click **Next** to view your `SDKAppID` and `SECRETKEY`.

### Step 2. Download the source code and configure the project

1. Clone or directly download the source code in the repository. **Feel free to star our project if you like it.**
2. The project integrates the `TXLiteAVSDK_TRTC` lite SDK by default. For more information on the specific SDK features, see [SDK Download](https://www.tencentcloud.com/document/product/647/34615).
3. Download `TXLiteAVSDK_ReplayKitExt.framework` [here](https://www.tencentcloud.com/document/product/647/34615) and place it in the SDK directory.
4. `pod 'TXLiteAVSDK_TRTC'` depended on by the SDK has been added to the `Example/Podfile` file in the project directory. You only need to open Terminal, enter the project directory, and run `pod install`, and the SDK will be automatically integrated.
5. Open the demo project `Example/DemoApp.xcworkspace` with Xcode 11.0 or later.
6. Find the `Example/Debug/GenerateTestUserSig.swift` file in the project.
7. Set parameters in `GenerateTestUserSig.swift`:

<ul>
<li>SDKAPPID: 0 by default. Replace it with your actual `SDKAPPID`.</li>
<li>SECRETKEY: An empty string by default. Replace it with your actual `SECRETKEY`.</li>
</ul>
<img src="https://liteav.sdk.qcloud.com/doc/res/trtc/picture/zh-cn/sdkappid_secretkey_ios.png" width="650" height="295"/>

>!In this document, the method to obtain UserSig is to configure a SECRETKEY in the client code. In this method, the SECRETKEY is vulnerable to decompilation and reverse engineering. Once your SECRETKEY is leaked, attackers can steal your Tencent Cloud traffic. Therefore, **this method is only suitable for locally running a demo project and feature debugging**.
>The correct `UserSig` distribution method is to integrate the calculation code of `UserSig` into your server and provide an application-oriented API. When `UserSig` is needed, your application can send a request to the business server for a dynamic `UserSig`. For more information, see [How do I calculate `UserSig` during production?](https://intl.cloud.tencent.com/document/product/647/35166).

### Step 3. Compile and run the application

Open the demo project `Example/DemoApp.xcworkspace` with Xcode 11.0 or later and click **Run**.

Note:

You need to prepare at least two devices to try out TUIRoom. Here, users A and B represent two different devices:

`userId` is a string and can contain up to 32 bytes of letters and digits (special symbols are not supported). You can customize it based on your actual account system.

**Device A (userId: 111)**

- Step 1: On the welcome page, enter the username (which must be unique), such as `111`.
- Step 2: Click **Create Room**.
- Step 3: Enter the room creation page, and note down the ID of the newly created room.
- Step 4: Enter the room.


**Device B (userId: 222)**

- Step 1: Enter the username (which must be unique), such as `222`.
- Step 2: Click **Enter Room** and enter the ID of the room created by user A (the room ID that you noted down in step 3 on device A) to enter the room.


## Have any questions?
Welcome to join our Telegram Group to communicate with our professional engineers! We are more than happy to hear from you~
Click to join: https://t.me/+EPk6TMZEZMM5OGY1
Or scan the QR code

<img src="https://qcloudimg.tencent-cloud.cn/raw/9c67ed5746575e256b81ce5a60216c5a.jpg" width="320"/>