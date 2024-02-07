# Quick Run of TUIRoomKit Demo for Flutter

_[中文](README.zh-CN.md) | English_

This document describes how to quickly run the TUIRoomKit demo project to make a high-quality audio/video conference. For more information on the TUIRoomKit component connection process, see [**Integrating TUIRoomKit (Flutter)** ](https://trtc.io/document/57508)...


> [!IMPORTANT]
> The commercial version of TRTC Conference (TUIRoomKit) is coming soon. Please contact us to get a free trial of the powerful features of the commercial SDK (version 2.0). <br>
The default download on GitHub is the 2.0 version SDK. You need to contact us through the following method to activate its use:<br>
·Send an email to: chaooliang@tencent.com, please be sure to include the SDKAPPID in your email, so we can quickly respond and activate it for you.(Recommended for a quick response)<br>
·Join the Telegram group: https://t.me/+EPk6TMZEZMM5OGY1?s_url=https%3A%2F%2Ftrtc.io.

## Environment preparation

| Platform | Version                 |
| -------- | ----------------------- |
| Flutter  |3.0.0 And Above Versions.|
| Android  |- Minimum compatibility with Android 4.1 (SDK API Level 16), recommended to use Android 5.0 (SDK API Level 21) and above。                              |
|    iOS   |iOS 12.0 and higher.     |

## Running the Demo

[](id:ui.step1)
### Step 1. Activate the service
1. Please refer to the official documentation at [Integration (TUIRoomKit)](https://trtc.io/document/57508) to obtain your own SDKAppID and SDKSecreKey.

[](id:ui.step2)
### Step 2. Configure the project

1. Open the demo project(room_flutter_example)，Find the `room_flutter_example/lib/debug/generate_test_user_sig.dart` ile in the project.
2. Set the following parameters in `generate_test_user_sig.dart`
<ul style="margin:0"><li/>SDKAPPID: `0` by default. Set it to the actual `SDKAppID`.
<li/>SECRETKEY: Left empty by default. Set it to the actual key.</ul

![](../../Preview/test-user-sig-flutter.png)

[](id:ui.step3)
### Step 3. Compile and run the application

in `room_flutter_example` ,Execute the following command to run the application.
```
flutter run
```

## Communication and feedback

If you have any suggestions or comments in the use process, you are welcome to join our [technical exchange group](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) for technical exchange and product communication.
