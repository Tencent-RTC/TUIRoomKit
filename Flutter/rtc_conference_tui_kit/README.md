_English | [简体中文](README.zh-CN.md)_
# Tencent Cloud UIKit for Video Conference

<img src="https://qcloudimg.tencent-cloud.cn/raw/1539bcd27bb2f03a019d55bf65f6c1f5.png" align="left" width=120 height=120>  TUIRoomKit is Tencent Cloud launched a positioning enterprise meeting, online class, network salon and other scenes of the UI component, through the integration of the component, you only need to write a few lines of code can add similar video conference functions for your App, and support screen sharing, member management, ban the ban painting, chat and other functions. TUIRoomKit supports Windows, Mac, Android, iOS, Web, Electron and other development platforms.

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

### Active the service

First, please Create an application in the [TRTC Console](https://console.tencentcloud.com/trtc/allapp) and record the SDKAppID and SecretKey parameters. These parameters will be used in the subsequent integration process. The location of the application creation and parameters is shown in the following figure:
   ![](https://qcloudimg.tencent-cloud.cn/raw/aa6cb270cefd189f07db51dce83c7052.png)

>! This component uses two basic PaaS services of Tencent Cloud: [TRTC](https://intl.cloud.tencent.com/document/product/647/35078) and [IM](https://intl.cloud.tencent.com/document/product/1047). When you activate TRTC, IM will be activated automatically. For information about the billing , see [Pricing](https://www.tencentcloud.com/document/product/647/34610).

### Access and use

- Step 1:Add the dependency

  Add the rtc_conference_tuikit plugin dependency in `pubspec.yaml` file in your project
  ```
  dependencies:  
   rtc_conference_tuikit: latest release version
  ```
  Execute the following command to install the plugin
  ```
  flutter pub get
  ```

- Step 2:Login `rtc_conference_tuikit` plugin

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

- Step 3:User `rtc_conference_tuikit` plugin

  - Set self nickName and avatar

    ```dart
    import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';

    var roomKit = TUIRoomKit.createInstance();
    roomKit.setSelfInfo('nickName', 'avatarURL');
    ```

  - Create room

    ```dart
    import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';

    var roomKit = TUIRoomKit.createInstance();
    TUIRoomInfo roomInfo = TUIRoomInfo(roomId: 'your roomId');

    var result = await roomKit.createRoom(roomInfo);
    if (result.code == TUIError.success) {
        // create room success
    } else {
        // create room error
    }
    ```

  - Enter room(**After calling this interface, the UI interface will be pulled up for you to enter the room.**)

    ```dart
    import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';

    var roomKit = TUIRoomKit.createInstance();
    var result = await roomKit.enterRoom('roomId',         // Please replace with your room id
                                         isOpenMicrophone, // Whether to turn on the microphone when entering the room
                                         isOpenCamera,     // Whether to turn on the microphone when entering the room
                                         userSpeaker);     // Whether to use speakers to play sound when entering the room
    if (result.code == TUIError.success) {
        // enter room success
    } else {
        // enter room success
    }
    ```


## Quick link

- If you encounter difficulties, you can refer to [FAQs](https://www.tencentcloud.com/document/product/647/52820), here are the most frequently encountered problems of developers, covering various platforms, I hope it can Help you solve problems quickly.
- If you would like to see more official examples, you can refer to the example Demo of each platform: [Web](../../Web/)、[Android](../../Android/)、[iOS](../../iOS/)、[Electron](../../Electron/)、[Windows](../../Windows-Mac/).

- If you would like to see some of our latest product features, you can check the [Update Log](https://cloud.tencent.com/document/product/1690/89361), here are the latest features of TUIRoomKit, as well as the historical version features iterate
- For complete API documentation, see [API reference](https://cloud.tencent.com/document/product/1690/94557): including TUIRoomKit、 (with UIKit), TUIRoomEngine (without UIKit), and events Callbacks, etc.
- If you want to learn more about the projects maintained by Tencent Cloud  Media Services Team, you can check our [Product Official Website](https://cloud.tencent.com/product/rtcube), [Github Organizations](https://github.com/LiteAVSDK) etc.

## Communication and feedback

If you have any suggestions or comments in the use process, you are welcome to join our [technical exchange group](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) for technical exchange and product communication.
