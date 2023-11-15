# Quick Run of TUIRoomKit Demo for Flutter

_[中文](README.zh-CN.md) | English_

This document describes how to quickly run the TUIRoomKit demo project to make a high-quality audio/video conference. For more information on the TUIRoomKit component connection process, see [**Integrating TUIRoomKit (Flutter)** ](https://cloud.tencent.com/document/product/1690/94555)...

## Environment preparation

| Platform | Version                 |
| -------- | ----------------------- |
| Flutter  |3.0.0 And Above Versions.|
| Android  |- Minimum compatibility with Android 4.1 (SDK API Level 16), recommended to use Android 5.0 (SDK API Level 21) and above。                              |
|    iOS   |iOS 12.0 and higher.     |

## Running the Demo

[](id:ui.step1)
### Step 1. Active the service

First, please Create an application in the [TRTC Console](https://console.tencentcloud.com/trtc/allapp) and record the SDKAppID and SecretKey parameters. These parameters will be used in the subsequent integration process. The location of the application creation and parameters is shown in the following figure:
   ![](https://qcloudimg.tencent-cloud.cn/raw/aa6cb270cefd189f07db51dce83c7052.png)

>! This component uses two basic PaaS services of Tencent Cloud: [TRTC](https://intl.cloud.tencent.com/document/product/647/35078) and [IM](https://intl.cloud.tencent.com/document/product/1047). When you activate TRTC, IM will be activated automatically. For information about the billing , see [Pricing](https://www.tencentcloud.com/document/product/647/34610).

[](id:ui.step2)
### Step 2. Configure the project

1. Open the demo project(room_flutter_example)，Find the `room_flutter_example/lib/debug/generate_test_user_sig.dart` ile in the project.
2. Set the following parameters in `generate_test_user_sig.dart`
<ul style="margin:0"><li/>SDKAPPID: `0` by default. Set it to the actual `SDKAppID`.
<li/>SECRETKEY: Left empty by default. Set it to the actual key.</ul

![](https://qcloudimg.tencent-cloud.cn/raw/db5b13a64c315bf933c69109355ec872.png)

[](id:ui.step3)
### Step 3. Compile and run the application

in `room_flutter_example` ,Execute the following command to run the application.
```
flutter run
```

## Communication and feedback

If you have any suggestions or comments in the use process, you are welcome to join our [technical exchange group](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) for technical exchange and product communication.
