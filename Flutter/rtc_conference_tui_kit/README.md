_English | [简体中文](README.zh-CN.md)_
# Tencent Cloud UIKit for Video Conference

<img src="https://qcloudimg.tencent-cloud.cn/raw/1539bcd27bb2f03a019d55bf65f6c1f5.png" align="left" width=120 height=120>  TUIRoomKit (rtc_conference_tui_kit) is Tencent Cloud launched a positioning enterprise meeting, online class, network salon and other scenes of the UI component, through the integration of the component, you only need to write a few lines of code can add similar video conference functions for your App, and support screen sharing, member management, ban the ban painting, chat and other functions. TUIRoomKit supports Windows, Mac, Android, iOS, Flutter, Web, Electron and other development platforms.

<a href="https://apps.apple.com/cn/app/%E8%85%BE%E8%AE%AF%E4%BA%91%E9%9F%B3%E8%A7%86%E9%A2%91/id1400663224"><img src="https://qcloudimg.tencent-cloud.cn/raw/348148fb6fd16423c03b7c6de2929c2e.svg" height=40></a> <a href="https://dldir1.qq.com/hudongzhibo/liteav/TRTCDemo.apk"><img src="https://qcloudimg.tencent-cloud.cn/raw/83597d40f8aded40a65b801392fdc724.svg" height=40></a> <a href="https://web.sdk.qcloud.com/trtc/webrtc/demo/api-sample/login.html"><img src="https://qcloudimg.tencent-cloud.cn/raw/623bd0e0c83a4762155f8363e845b052.svg" height=40></a>



## Features

<p align="center">
  <img src="https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/9d93360651fc11ee974d5254005f490f.png"/>
</p>

- Easy access: Provide open source components with UI, save 90% development time, fast online video conference function.
- Platform connectivity: TUIRoomKit components of all platforms are interconnected and accessible.
- Screen sharing: Based on the screen acquisition capability of each platform jointly polished by 3000+ market applications, with exclusive AI coding algorithm, lower bit rate and clearer picture.
- Member management: It supports multiple standard room management functions such as all mute, single member gag, drawing, inviting to speak, kicking out of the room, etc.
- Other features: Support room members chat screen, sound Settings and other features, welcome to use.

## Make a first video Conference 

Here is an example of integration with UI (ie TUIRoomKit), which is also our recommended integration method. The key steps are as follows:

### Environment preparation

| Platform | Version|
| -------------------- | ------ |
| Flutter  |3.0.0 And Above Versions.|
| Android  |- Minimum compatibility with Android 4.1 (SDK API Level 16), recommended to use Android 5.0 (SDK API Level 21) and above。       |
|  iOS     |iOS 12.0 and higher.     |

###  Activate the service
1. Please refer to the official documentation at [Integration (TUIRoomKit)](https://trtc.io/document/57508) to obtain your own SDKAppID and SDKSecreKey.

### Access and use

- Step 1: Add the dependency

  Add the rtc_conference_tui_kit plugin dependency in `pubspec.yaml` file in your project
  ```
  dependencies:  
   rtc_conference_tui_kit: latest release version
  ```
  Execute the following command to install the plugin
  ```
  flutter pub get
  ```

- Step 2: Complete Project Configuration

  - Since the `rtc_conference_tui_kit` component uses the `GetX` state management library for navigation, you need to use `GetMaterialApp` instead of `MaterialApp` in your application. Or you can set the `navigatorKey` property in your `MaterialApp` to `Get.key` to achieve the same effect.

  - Use `Xcode` to open your project, select [Project] -> [Building Settings] -> [Deployment], and set the [Strip Style] to `Non-Global Symbols` to retain all global symbol information.

  - To use the audio and video functions on **iOS**, you need to authorize the use of the mic and camera (For Android, the relevant permissions have been declared in the SDK, so you do not need to manually configure them). 
    
    Add the following two items to the `Info.plist` of the App, which correspond to the prompt messages of the mic and camera when the system pops up the authorization dialog box. 
    ```
    <key>NSCameraUsageDescription</key>
    <string>TUIRoom needs access to your Camera permission</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>TUIRoom needs access to your Mic permission</string>
    ```
    After completing the above additions, add the following preprocessor definitions in your `ios/Podfile` to enable camera and microphone permissions.
    ```ruby
    post_install do |installer|
      installer.pods_project.targets.each do |target|
        flutter_additional_ios_build_settings(target)
          target.build_configurations.each do |config|
            config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= [
          '$(inherited)',
          'PERMISSION_MICROPHONE=1',
          'PERMISSION_CAMERA=1',
          ]
        end
      end
    end
    ```

- Step 3: Login `rtc_conference_tui_kit` plugin

  ```dart
  import 'package:rtc_room_engine/rtc_room_engine.dart';

  var result = await TUIRoomEngine.login(
  SDKAPPID, // Please replace with your SDKAPPID
  'userId', // Please replace with your user ID
  'userSig',// Please replace with your userSig
  );

  if (result.code == TUIError.success) {
    // login success
  } else {
    // login error
  }
  ```

**Parameter Description**

Here is a detailed introduction to the key parameters used in the login function:
- **SDKAppID**：You have already obtained it in [Active the service](#active-the-service), so it will not be repeated here.

- **UserID**：The ID of the current user, string type, only allows to contain English letters (a-z and A-Z), numbers (0-9), hyphens (-), and underscores (_).

- **UserSig**：Encrypt the SDKAppID, UserID, etc. with the SDKSecretKey obtained in [Active the service](#active-the-service) to get the UserSig, which is a ticket for authorization and is used for Tencent Cloud to recognize whether the current user can use the TRTC service. You can create a temporarily available UserSig through the [UserSig Tools](https://console.trtc.io/usersig) through the project sidebar in the console.![](https://qcloudimg.tencent-cloud.cn/raw/1a7924c7e94b4f32b3d4d99053850a56.png)

- For more information, please refer to the [UserSig related](https://trtc.io/document/35166).
   

> **Note:**
> 
>   - **This step is also the step with the most feedback from developers we have received so far. Common problems are as follows:**
>   - `SDKAppID` is set incorrectly. Please use the `SDKAppID` of the international site correctly, otherwise, you will not be able to access it.
>   - `UserSig` is misconfigured as an encryption key (`SDKSecretKey`). `UserSig` is obtained by encrypting the `SDKAppID`, `UserID`, and expiration time with the SDKSecretKey, not by directly configuring the `SDKSecretKey` as `UserSig`.
>   - `UserID` is set to simple strings like "1", "123", "111", etc. **Since TUIRoomEngine does not support multi-terminal login with the same UserID**, simple UserIDs like "1", "123", "111" are easily occupied by your colleagues, causing login failure. Therefore, we recommend that you set some UserIDs with high identifiability when debugging.
>   - The [sample code](https://github.com/tencentyun/TUIRoomKit/blob/main/Flutter/room_flutter_example/lib/debug/generate_test_user_sig.dart) in Github uses the `genTestUserSig` function to calculate UserSig locally to quickly get you through the current access process. However, this solution exposes your SDKSecretKey in the App code, which is not conducive to your subsequent upgrades and protection of your` SDKSecretKey`. Therefore, we strongly recommend that you put the calculation logic of `UserSig `on the server side and have the app request the real-time calculated UserSig from your server every time it uses the TUIRoomKit Component.


- Step 4: User `rtc_conference_tui_kit` plugin

  - Set self nickName and avatar (optional)

    ```dart
    import 'package:rtc_room_engine/rtc_room_engine.dart';

    TUIRoomEngine.setSelfInfo(userName, avatarURL);
    ```

  - Start a quick conference

    ```dart
    import 'package:rtc_conference_tui_kit/rtc_conference_tui_kit.dart';

    ConferenceSession.newInstance('your roomId') 
      ..onActionSuccess = _quickStartSuccess
      ..onActionError = _quickStartError
      ..quickStart();

    void _quickStartSuccess() {
      //You can navigate to the conference page on your own in this success callback of starting a quick conference.
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ConferenceMainPage(),
        ),
      );
    }

    void _quickStartError(ConferenceError error, String message) {
      debugPrint("code: $error message: $message");
    }
    ```

  - Join a conference

    ```dart
    import 'package:rtc_conference_tui_kit/rtc_conference_tui_kit.dart';

    ConferenceSession.newInstance('your roomId') 
      ..onActionSuccess = _joinSuccess
      ..onActionError = _joinError
      ..join();

    void _joinSuccess() {
      //You can navigate to the conference page on your own in this success callback of joining a conference.
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ConferenceMainPage(),
        ),
      );
    }

    void _joinError(ConferenceError error, String message) {
      debugPrint("code: $error message: $message");
    }
    ```


## Quick link

- If you encounter difficulties, you can refer to [FAQs](https://trtc.io/document/57598), here are the most frequently encountered problems of developers, covering various platforms, I hope it can Help you solve problems quickly.
- If you would like to see more official examples, you can refer to the example Demo of each platform: [Web](../../Web/), [Android](../../Android/), [iOS](../../iOS/), [Electron](../../Electron/), [Windows](../../Windows-Mac/).

- If you would like to see some of our latest product features, you can check the [Update Log](https://pub.dev/packages/rtc_conference_tui_kit/changelog), here are the latest features of rtc_conference_tui_kit, as well as the historical version features iterate
- For complete API documentation, see [API reference](https://trtc.io/document/57512): including TUIRoomKit、 (with UIKit), TUIRoomEngine (without UIKit), and events Callbacks, etc.
- If you want to learn more about the projects maintained by Tencent Cloud  Media Services Team, you can check our [Product Official Website](https://trtc.io/), [Github Organizations](https://github.com/LiteAVSDK) etc.

## Communication and feedback

If you have any suggestions or comments during the use of our product, please feel free to contact us at info_rtc@tencent.com or submit an [issue](https://github.com/tencentyun/TUIRoomKit/issues). Your feedback is greatly appreciated. 
