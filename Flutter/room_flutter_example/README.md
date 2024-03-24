# Quick Run of TUIRoomKit Demo for Flutter

_[中文](README.zh-CN.md) | English_

This document describes how to quickly run the TUIRoomKit demo project to make a high-quality audio/video conference. For more information on the TUIRoomKit component connection process, see [**Integrating TUIRoomKit (Flutter)** ](https://trtc.io/document/57508)...

## Environment preparation

| Platform | Version                 |
| -------- | ----------------------- |
| Flutter  |3.0.0 And Above Versions.|
| Android  |- Minimum compatibility with Android 4.1 (SDK API Level 16), recommended to use Android 5.0 (SDK API Level 21) and above。                              |
|    iOS   |iOS 12.0 and higher.     |

## Running the Demo

### Step 1. Activate the service
1. Please refer to the official documentation at [Integration (TUIRoomKit)](https://trtc.io/document/57508) to obtain your own SDKAppID and SDKSecretKey.

### Step 2. Configure the project

1. Open the demo project(room_flutter_example)，Find the `room_flutter_example/lib/debug/generate_test_user_sig.dart` ile in the project.
2. Set the following parameters in `generate_test_user_sig.dart`
<ul style="margin:0"><li/>SDKAPPID: `0` by default. Set it to the actual `SDKAppID`.
<li/>SDKSECRETKEY: Left empty by default. Set it to the actual key.</ul

![](../../Preview/test-user-sig-flutter.png)

### Step 3. Compile and run the application

in `room_flutter_example` ,Execute the following command to run the application.
```
flutter run
```

## Communication and feedback

If you have any suggestions or comments during the use of our product, please feel free to contact us at info_rtc@tencent.com or submit an [issue](https://github.com/tencentyun/TUIRoomKit/issues). Your feedback is greatly appreciated. 
