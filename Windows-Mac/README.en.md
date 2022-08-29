# Quick Run of TUIRoom Demo for Windows and macOS

_English | [简体中文](README.md)_

This document describes how to quickly run the TUIRoom demo project to make a multi-person audio/video call. For more information on the TUIRoom component connection process, see:
[Integrating TUIRoom (Windows and macOS)](https://cloud.tencent.com/document/product/647/63494)

## Directory Structure

```
TUIRoom
├─ RoomApp              // Main program directory
   ├─ App               // Program source code
   ├─ bin               // Executable files output by the project and program database files required for debugging
   ├─ Resources         // Image source files, QSS style files, and internationalization files required by `RoomApp`
   └─ 3rdParty          // Third-party libraries depended on by `RoomApp`
├─ Common               // General class of `RoomApp`
├─ utils                // Tool class folder
├─ Module               // Data model interaction layer source code of `RoomApp`
└─ SDK                  // Liteav SDK and IM SDK library files depended on by `RoomApp`
```

## Environment Requirements
#### Windows
- Integrated development environment: Visual Studio 2015 or later.
- Qt 5.9.1 or later.
- Qt Visual Studio Tools 2.2.0 or later.
- Operating system: Windows 8 or later.
- Make sure that you can develop the project normally in the integrated development environment.

#### macOS
- Qt 5.9.1 or later.
- QtCreator integrated development environment. To use QtCreator, select it when installing Qt, and its version is the same as that of the Qt official installation package.
- Make sure that you can develop the project normally in the QtCreator integrated development environment.

## Demo Run Example

### Prerequisites
- You have [signed up for a Tencent Cloud account](https://intl.cloud.tencent.com/document/product/378/17985) and completed [identity verification](https://intl.cloud.tencent.com/document/product/378/3629).

### Obtaining `SDKAPPID` and `SECRETKEY`
1. Log in to the TRTC console and select **Development Assistance** > **[Demo Quick Run](https://console.cloud.tencent.com/trtc/quickstart)**.
2. Enter an application name such as `TestTRTC` and click **Create**.
   <img src="https://qcloudimg.tencent-cloud.cn/raw/4f44a7ca70f28807c91b4a04ccc1b960.png" width="650" height="295"/>
3. Click **Next** to view your `SDKAppID` and key.

### Integrating SDK
1. The project integrates the SDKs for Windows and macOS by default. For more information on the specific SDK features, see [SDK Download](https://cloud.tencent.com/document/product/647/32689).
2. After downloading the latest SDKs for Windows/macOS from the official website, you need to move them to the corresponding directory in the SDK folder under the project.

### Downloading source code and configuring the project file
Clone or directly download the source code in the repository. **Feel free to star our project if you like it.**

#### Windows
1. Open the source code project `RoomApp.vcxproj` with Visual Studio 2015 or later.
2. Find the `TUIRoom\Windows-Mac\utils\usersig\win\GenerateTestUserSig.h` file in the project.
3. Set parameters in the `GenerateTestUserSig.h` file.
   <ul>
   <li>SDKAPPID: 0 by default. Replace it with your actual `SDKAPPID`.</li>
   <li>SECRETKEY: An empty string by default. Replace it with your actual `SECRETKEY`.</li>
   </ul>
   <img src="https://qcloudimg.tencent-cloud.cn/raw/95e83fb9f4177baa2ff0d2033001e5ba.png" width="650" height="295"/>
4. Return to the TRTC console and click **Next**.
5. Click **Return to Overview Page**.

#### macOS
1. Use QtCreator to develop `RoomApp.pro` of the source code project.
2. Find the `TUIRoom\Windows-Mac\utils\usersig\mac\UserSigConfig.h` file in the project.
3. Set the relevant parameters in the `UserSigConfig.h` file:
   <ul>
   <li>SDKAPPID_: 0 by default. Replace it with your actual `SDKAPPID`.</li>
   <li>SecretKey_: An empty string by default. Replace it with your actual `SECRETKEY`.</li>
   </ul>
4. Return to the TRTC console and click **Next**.
5. Click **Return to Overview Page**.

>In this document, the method to obtain UserSig is to configure a SECRETKEY in the client code. In this method, the SECRETKEY is vulnerable to decompilation and reverse engineering. Once your SECRETKEY is leaked, attackers can steal your Tencent Cloud traffic. Therefore, **this method is only suitable for locally running a demo project and feature debugging**.
>The correct `UserSig` distribution method is to integrate the calculation code of `UserSig` into your server and provide an application-oriented API. When `UserSig` is needed, your application can send a request to the business server for a dynamic `UserSig`. For more information, see [How do I calculate `UserSig` during production?](https://intl.cloud.tencent.com/document/product/647/35166).

### Running the application
Make sure that the Qt environment configuration is normal.
#### Windows
- On Windows, open the source code project `RoomApp.vcxproj` with Visual Studio 2015 or later.
- Right-click the project and select **Properties** > **QtProjectSetting** > **General** > **QtInstallation** to select an installed Qt environment.

   <img src="https://qcloudimg.tencent-cloud.cn/raw/f7246267e5fbee96e481e6e491f6a3ea.png" width="500" height="280"/>

- Click **Run** to start debugging and running this application.

#### macOS
- On macOS, configure the system environment variable `QTDIR` to point to the Qt installation directory and open the source code project `RoomApp.pro` in QtCreator to build and run the application.

### Trying out application (**at least two devices required**)

<img src="https://qcloudimg.tencent-cloud.cn/raw/bf53f125f17bf697080752eebfe91df4.png" width="600" height="300"/>

<img src="https://qcloudimg.tencent-cloud.cn/raw/1d3a03bed647d33bf1ea91f8333da921.png" width="600" height="340"/>

#### User A
- Step 1: Log in to the application, enter the username and room ID (the username must be unique, such as `user_A`; the room ID can contain up to nine digits, such as `123456`), and click **Enter room**.
- Step 2: Check the device conditions on the device check page, complete the relevant settings, and click **Enter room**.
- Step 3: Enter the room successfully and become the anchor (the first user entering a room will become the anchor).

#### User B
- Step 1: Log in to the application, enter the username and room ID (the username must be unique, such as `user_B`; the room ID can contain up to nine digits, such as `123456`), and then click **Enter room**.
- Step 2: Check the device conditions on the device check page, complete the relevant settings, and click **Enter room**.
- Step 3: Enter the room successfully. The speaker list is displayed, where `user_A` can be viewed and called.

## Have any questions?
Welcome to join our Telegram Group to communicate with our professional engineers! We are more than happy to hear from you~
Click to join: https://t.me/+EPk6TMZEZMM5OGY1
Or scan the QR code

<img src="https://qcloudimg.tencent-cloud.cn/raw/9c67ed5746575e256b81ce5a60216c5a.jpg" width="320"/>