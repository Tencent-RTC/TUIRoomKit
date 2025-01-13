# Quick Run of TUIRoomKit Demo for Flutter

_[中文](README.zh-CN.md) | English_

This document describes how to quickly run the TUIRoomKit demo project to make a high-quality audio/video conference. For more information on the TUIRoomKit component connection process, see [**Integrating TUIRoomKit (Flutter)** ](https://trtc.io/document/57508)...

## Environment preparation

<table>
<tr>
<td rowspan="1" colSpan="1" >Platform</td>

<td rowspan="1" colSpan="1" >Version</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >Flutter</td>

<td rowspan="1" colSpan="1" >3.22.0 and above versions.</td>
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


## Running the Demo

### Step 1. Active the service

You can follow the steps below to activate the TRTC Conference product service and receive a free 14-day trial version.

> **Note：**
> 
> If you wish to purchase the paid version, please refer to [TRTC Conference Monthly Packages](https://trtc.io/document/59409), follow the [Purchasing Guide](https://trtc.io/document/54634) to complete the purchase.
> 

1. Visit [TRTC Console > Applications](https://console.trtc.io/), select **Create application**.

   ![](https://qcloudimg.tencent-cloud.cn/raw/b3210cf77e12641226cb1bccc78df1d3.png)

2. In the Create application pop-up, select **Conference** and enter the application name, click **Create**.

   ![](https://qcloudimg.tencent-cloud.cn/raw/a0b8f00ed1c7b03d84a2ba3120dd73ab.png)

3. After completing the application creation, you will default entry to the application details page, select the **Free Trail** in the floating window, and click to **Get started for free**.

   ![](https://qcloudimg.tencent-cloud.cn/raw/9e5c3ec74c3e77e8057f7850504a622c.png)

4. After the activation is completed, you can view the edition information on the current page. The `SDKAppID` and `SDKSecretKey` here will be used in the integration guide.

   ![](https://qcloudimg.tencent-cloud.cn/raw/0f6c1af2be80b2a6afebc4ac3e960ea6.png)

### Step 2. Configure the project

1. Open the example project，Find the `example/lib/debug/generate_test_user_sig.dart` ile in the project.
2. Set the following parameters in `generate_test_user_sig.dart`
<ul style="margin:0"><li/>SDKAPPID: `0` by default. Set it to the actual `SDKAppID`.
<li/>SDKSECRETKEY: Left empty by default. Set it to the actual key.</ul

![](https://qcloudimg.tencent-cloud.cn/raw/db5b13a64c315bf933c69109355ec872.png)

### Step 3. Compile and run the application

in `example` ,Execute the following command to run the application.
```
flutter run
```

## Communication and feedback

If you have any suggestions or comments during the use of our product, please feel free to contact us at info_rtc@tencent.com or submit an [issue](https://github.com/tencentyun/TUIRoomKit/issues). Your feedback is greatly appreciated. 
