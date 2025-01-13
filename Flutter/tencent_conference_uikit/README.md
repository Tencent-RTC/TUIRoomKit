_English | [简体中文](README.zh-CN.md)_
# Tencent Cloud UIKit for Video Conference

<img src="https://qcloudimg.tencent-cloud.cn/raw/1539bcd27bb2f03a019d55bf65f6c1f5.png" align="left" width=120 height=120>  TUIRoomKit (tencent_conference_uikit) is Tencent Cloud launched a positioning enterprise meeting, online class, network salon and other scenes of the UI component, through the integration of the component, you only need to write a few lines of code can add similar video conference functions for your App, and support screen sharing, member management, ban the ban painting, chat and other functions. TUIRoomKit supports Windows, Mac, Android, iOS, Flutter, Web, Electron and other development platforms.

<a href="https://apps.apple.com/cn/app/%E8%85%BE%E8%AE%AF%E4%BA%91%E9%9F%B3%E8%A7%86%E9%A2%91/id1400663224"><img src="https://qcloudimg.tencent-cloud.cn/raw/348148fb6fd16423c03b7c6de2929c2e.svg" height=40></a> <a href="https://dldir1.qq.com/hudongzhibo/liteav/TRTCDemo.apk"><img src="https://qcloudimg.tencent-cloud.cn/raw/83597d40f8aded40a65b801392fdc724.svg" height=40></a> <a href="https://trtc.io/demo/homepage/#/detail?scene=roomkit"><img src="https://qcloudimg.tencent-cloud.cn/raw/623bd0e0c83a4762155f8363e845b052.svg" height=40></a>



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

### Environment preparation

<table>
<tr>
<td rowspan="1" colSpan="1" >Platform</td>

<td rowspan="1" colSpan="1" >Version</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >Flutter</td>

<td rowspan="1" colSpan="1" >3.7.0 and above versions.</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >Android</td>

<td rowspan="1" colSpan="1" >- Android 4.1 (SDK API level 16) or later (Android 5.0 (SDK API level 21) or later is recommended).<br>- Android Studio 3.5 or later (Gradle 3.5.4 or later). <br>- Mobile phone on Android 4.1 or later.</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >iOS</td>

<td rowspan="1" colSpan="1" >iOS 12.0 and higher.</td>
</tr>
</table>

## Active the service

You can follow the steps below to activate the TRTC Conference product service and receive a free 14-day trial version.

> **Note：**
> 
> If you wish to purchase the paid version, please refer to [TRTC Conference Monthly Packages](https://trtc.io/document/59409), follow the [Purchasing Guide](https://trtc.io/document/54634) to complete the purchase.
> 

1. Visit [TRTC Console > Applications](https://console.trtc.io/), select **Create application**.

   ![](https://qcloudimg.tencent-cloud.cn/raw/b3210cf77e12641226cb1bccc78df1d3.png)

2. In the Create application pop-up, select **Conference** and enter the application name, click **Create**.

   ![](https://qcloudimg.tencent-cloud.cn/raw/a0b8f00ed1c7b03d84a2ba3120dd73ab.png)

3. After completing the application creation, you will default entry to the application details page, select the **Free Trail** in the floating window, and click to** Get started for free**.

   ![](https://qcloudimg.tencent-cloud.cn/raw/9e5c3ec74c3e77e8057f7850504a622c.png)

4. After the activation is completed, you can view the edition information on the current page. The `SDKAppID` and `SDKSecretKey` here will be used in the integration guide.

    ![](https://qcloudimg.tencent-cloud.cn/raw/0f6c1af2be80b2a6afebc4ac3e960ea6.png)

### Access and use

- Step 1: Add the dependency

  Add the [tencent_conference_uikit](https://pub.dev/packages/tencent_conference_uikit) plugin dependency in `pubspec.yaml` file in your project.
  ```
  dependencies:  
   tencent_conference_uikit: latest release version
  ```
  Execute the following command to install the plugin.
  ```
  flutter pub get
  ```

- Step 2: Complete Project Configuration

  - Since the `tencent_conference_uikit` has utilized the relevant features of the `GetX` state management library,, you need to use `GetMaterialApp` instead of `MaterialApp` in your application. Or you can set the `navigatorKey` property in your `MaterialApp` to `Get.key` to achieve the same effect.
    ```dart
    // This step requires importing the get package before proceeding. 
    // Since the tencent_conference_uikit already has a dependency on get, you don't need to make any additional configurations in your pubspec.yaml.
    import 'package:get/get.dart';  

    class MyApp extends StatelessWidget {
      @override
      Widget build(BuildContext context) {
        return GetMaterialApp(  // Use GetMaterialApp to replace MaterialApp
          // Your original MaterialApp content
        );
      }
    }
    ```

  - Use `Xcode` to open your project, select [Project] -> [Building Settings] -> [Deployment], and set the [Strip Style] to **Non-Global Symbols** to retain all global symbol information.

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

- Step 3: Login `tencent_conference_uikit` plugin

  Add the following code to your project, which serves to log in to the component by calling the relevant APIs in TUIRoomKit. This step is extremely critical, as only after logging in can you use the various functions of TUIRoomKit, so please be patient and check if the relevant parameters are configured correctly:
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
  - **SDKAppID**：Obtained it in [Active the service](#active-the-service).

  - **UserID**：The ID of the current user, which is a string that can only contain English letters (a-z and A-Z), numbers (0-9), hyphens (-), and underscores (_).

  - **UserSig**：The authentication credential used by Tencent Cloud to verify whether the current user is allowed to use the TRTC service. You can get it by using the SDKSecretKey to encrypt information such as SDKAppID and UserID. You can generate a temporary UserSig on the [UserSig Tools](https://console.trtc.io/usersig) page in the TRTC console.
  ![](https://qcloudimg.tencent-cloud.cn/raw/1a7924c7e94b4f32b3d4d99053850a56.png)

  - For more information, please refer to the [UserSig](https://trtc.io/document/35166).
    

  > **Note:**
  > 
  >   - **Many developers have contacted us with questions regarding this step. Below are some of the frequently encountered problems:**
  >     - The `SDKAppID` is set incorrectly.
  >     - `UserSig` is set to the value of `SDKSecretKey` mistakenly. The `UserSig` is generated by using the `SDKSecretKey` for the purpose of encrypting information such as `SDKAppID`, `UserID`, and the expiration time. But the value of the `UserSig` cannot be directly substituted with the value of the `SDKSecretKey`.
  >     - The `UserID` is set to a simple string such as 1, 123, or 111, and your colleague may be using the same UserID while working on a project simultaneously. In this case, login will fail as TUIRoomKit doesn't support login on multiple terminals with the same UserID. Therefore, we recommend you use some distinguishable UserID values during debugging.
  >   - The [sample code](https://github.com/tencentyun/TUIRoomKit/blob/main/Flutter/room_flutter_example/lib/debug/generate_test_user_sig.dart) on GitHub uses the `genTestUserSig` function to calculate `UserSig` locally, so as to help you complete the current integration process more quickly. However, this scheme exposes your `SDKSecretKey` in the application code, which makes it difficult for you to upgrade and protect your `SDKSecretKey` subsequently. Therefore, we strongly recommend you run the `UserSig` calculation logic on the server and make the application request the `UserSig` calculated in real time every time the application uses the TUIRoomKit component from the server.


  **Log in to Floating Chat (optional)**

    Flutter **TUIRoomKit** (**tencent_conference_uikit**) introduced the **floating chat feature** starting from version **2.4.1**. If you need to use the floating chat feature, you need to complete the following initialization and login (If you also need to use the [In-Conference Chat](https://trtc.io/document/61632) page, you can Ignore this step and complete the [initialization and login for In-Conference Chat](https://trtc.io/document/61632#3d0fd007-2189-48e0-8391-27d840e075f4)):
    ``` dart
    import 'package:tencent_cloud_chat_sdk/enum/V2TimSDKListener.dart';
    import 'package:tencent_cloud_chat_sdk/enum/log_level_enum.dart';
    import 'package:tencent_cloud_chat_sdk/models/v2_tim_callback.dart';
    import 'package:tencent_cloud_chat_sdk/tencent_im_sdk_plugin.dart';

    // Initialize
    var initResult = await TencentImSDKPlugin.v2TIMManager.initSDK(
        sdkAppID: SDKAPPID,                     // Replace with your SDKAPPID
        loglevel: LogLevelEnum.V2TIM_LOG_INFO,  // Log registration level
        listener: V2TimSDKListener(),           // Event listener. When using the floating chat, pass an empty object here.
    );
        
    if (initResult.code == 0) { // Initialized successfully
        // Login   
        V2TimCallback imLoginResult = await TencentImSDKPlugin.v2TIMManager.login(
          userID: 'userId',   // Replace with your userID
          userSig: 'userSig', // Replace with your userSig
        );
    }
    ```

    > **Note:**
    > 
    > The floating chat feature is enabled by default in TUIRoomKit. If you do not need the floating chat feature, you do not need to perform the above initialization and login steps. You can disable the floating chat feature through the **Bottom toolbar** -> **Setting** -> **Open Floating Chat** option.
    > 

- Step 4: User `tencent_conference_uikit` plugin

  - Set self username and profile photo (optional)

    ```dart
    import 'package:rtc_room_engine/rtc_room_engine.dart';

    TUIRoomEngine.setSelfInfo(userName, avatarURL);
    ```

  - Start a quick conference

    ```dart
    import 'package:tencent_conference_uikit/tencent_conference_uikit.dart';

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
    import 'package:tencent_conference_uikit/tencent_conference_uikit.dart';

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
- If you would like to see more official examples, you can refer to the example Demo of each platform: [Web](../../Web/), [Android](../../Android/), [iOS](../../iOS/), [Electron](../../Electron/), [Qt](../../Qt/).

- If you would like to see some of our latest product features, you can check the [Update Log](https://pub.dev/packages/tencent_conference_uikit/changelog), here are the latest features of tencent_conference_uikit, as well as the historical version features iterate
- For complete API documentation, see [API reference](https://trtc.io/document/57512): including TUIRoomKit (with UIKit), TUIRoomEngine (without UIKit), and events Callbacks, etc.
- If you want to learn more about the projects maintained by Tencent Cloud  Media Services Team, you can check our [Product Official Website](https://trtc.io/products/conference), [Github Organizations](https://github.com/Tencent-RTC) etc.

## Communication and feedback

If you have any suggestions or comments during the use of our product, please feel free to contact us at info_rtc@tencent.com or submit an [issue](https://github.com/Tencent-RTC/TUIRoomKit/issues). Your feedback is greatly appreciated. 
