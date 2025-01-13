# TUIRoomKit Flutter 示例工程快速跑通

_中文 | [English](README.md)_

本文档主要介绍如何快速跑通TUIRoomKit 示例工程，体验高质量多人视频会议，更详细的TUIRoomKit组件接入流程，请点击腾讯云官网文档： [**TUIRoomKit 组件 Flutter 接入说明** ](https://cloud.tencent.com/document/product/1690/94555)...


## 环境准备

| 平台| 版本|
| -------------------- | ------ |
| Flutter|3.22.0 及以上版本。|
|Android|- 最低兼容 Android 4.1（SDK API Level 16），建议使用 Android 5.0 （SDK API Level 21）及以上版本。<br>- Android Studio 3.5 及以上的版本（Gradle 3.5.4 及以上的版本）。<br>- Android 4.1 及以上的手机设备。|
|iOS|iOS 12.0 及更高。|



## 运行并体验 App

### 第一步：开通服务

在使用 `TUIRoomKit` 创建房间前，您需要开通 `TUIRoomKit` 专属的多人音视频互动服务，详细步骤如下：
1. 登录 [实时音视频 TRTC 控制台](https://console.cloud.tencent.com/trtc)，单击左侧应用管理页面，找到需要开通 TUIRoomKit 的应用（SDKAppID），点击详情按钮，进入应用概览界面。

   ![](https://qcloudimg.tencent-cloud.cn/raw/491d2a01203ba3642dedd0967183cbaa.png)

2. 在应用概览页面找到 **含 UI 低代码集成接入 **卡片，选择**多人音视频（TUIRoomKit）**，点击领取体验按钮，领取7天体验版 TUIRoomKit 进行接入测试。
   

> **注意：**
> 
>   - 领取体验版后仅开通 TUIRoomKit 7天的体验资格，测试过程中所产生的音视频时长等资源消耗，仍会按照实时音视频 TRTC 标准计费规则计费；
>   - 新账号首次可前往 [试用中心](https://cloud.tencent.com/act/pro/video_freetrial?from=19654) 免费领取10000分钟音视频时长；
>   - 如果所选 SDKAppID 体验版领取次数已达上限，需要购买 TUIRoomKit 包月套餐才能开通服务，请点击**场景套餐订阅**按钮或前往 [购买页](https://buy.cloud.tencent.com/trtc) 购买；

   ![](https://qcloudimg.tencent-cloud.cn/raw/2b9660e8f29f0ae307241fe003ec234d.png)

3. 领取完成后，可以看到体验版的基本信息，包括服务状态、版本信息和功能详情、到期时间。这里的 `SDKAppID`、`SDKSecretKey` 会在后续步骤中使用到。

   ![](https://qcloudimg.tencent-cloud.cn/raw/f262b385451c2c89dd710f578dc9c4e5.png)

### 第二步：配置工程

1. 打开源码工程，在工程内找到 `example/lib/debug/generate_test_user_sig.dart` 文件。
2. 设置 `generate_test_user_sig.dart` 文件中的相关参数：
<ul style="margin:0"><li/>SDKAPPID：默认为0，请设置为实际的 SDKAppID。
<li/>SDKSECRETKEY：默认为空字符串，请设置为实际的密钥信息。</ul>

![](https://qcloudimg.tencent-cloud.cn/raw/db5b13a64c315bf933c69109355ec872.png)

### 第三步：编译执行

在`example`目录下，执行以下命令以在您的设备上运行。
```
flutter run
```

>? 如果您在使用过程中，有什么建议或者意见，欢迎您加入我们的 TUIKit [开发者社群](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) ，进行技术交流和产品沟通。
