# TUIRoomKit Flutter 示例工程快速跑通

_中文 | [English](README.md)_

本文档主要介绍如何快速跑通TUIRoomKit 示例工程，体验高质量多人视频会议，更详细的TUIRoomKit组件接入流程，请点击腾讯云官网文档： [**TUIRoomKit 组件 Flutter 接入说明** ](https://cloud.tencent.com/document/product/1690/94555)...


## 环境准备

| 平台| 版本|
| -------------------- | ------ |
| Flutter|3.0.0 及以上版本。|
|Android|- 最低兼容 Android 4.1（SDK API Level 16），建议使用 Android 5.0 （SDK API Level 21）及以上版本。<br>- Android Studio 3.5 及以上的版本（Gradle 3.5.4 及以上的版本）。<br>- Android 4.1 及以上的手机设备。|
|iOS|iOS 12.0 及更高。|



## 运行并体验 App

[](id:ui.step1)
### 第一步：开通服务

在使用 `TUIRoomKit` 创建房间前，您需要开通 `TUIRoomKit` 专属的多人音视频互动服务，详细步骤如下：
1. 登录  [腾讯云视立方 SDK 控制台](https://console.cloud.tencent.com/vcube/project/manage)，单击**创建项目**，选择**多人音视频互动场景**和**集成方式**。选择**含 UI 集成**。![](https://qcloudimg.tencent-cloud.cn/raw/1b039c84e2e701346c14465312b25841.png)

2. 在选定接入场景和集成方式以后，您需要开通**多人音视频房间 SDK **使用的两项腾讯云基础的 PaaS 能力，即 [即时通信 IM](https://cloud.tencent.com/document/product/269/1498) 和 [实时音视频 TRTC](https://cloud.tencent.com/document/product/647/16788)，开通后，单击**创建项目并下一步**。
   ![](https://qcloudimg.tencent-cloud.cn/raw/68a7b036e19c20d5a4c56d2f064c76b5.png)

3. 在项目创建完成以后，您需要为该项目匹配一个 IM 应用。因为多人音视频房间 SDK 依赖了 IM SDK 提供的基础能力，在这里可以创建或者管理已有的 IM 应用。关联成功后，可以领取**7天的免费体验版**，用于后续的开发调试工作。如果您之前已经体验过，可以直接在该页面单击 [购买正式版本](https://buy.cloud.tencent.com/vcube?type=call&sdkappid=1400590001)。![](https://qcloudimg.tencent-cloud.cn/raw/92d2b15d84e44ac03811f56a9ee97a02.png)

4. 单击**前往集成**，选择**项目配置**查看详细的配置页面，找到 SDKAppID 和密钥并记录下来。它们会在后续的 [第二步：配置工程] 中被用到，至此多人音视频房间 SDK 服务开通完成。![](https://qcloudimg.tencent-cloud.cn/raw/63494d7c655f6fb628aff8889838ec6d.png)


[](id:ui.step2)
### 第二步：配置工程

1. 打开源码工程，在工程内找到 `room_flutter_example/lib/debug/generate_test_user_sig.dart` 文件。
2. 设置 `generate_test_user_sig.dart` 文件中的相关参数：
<ul style="margin:0"><li/>SDKAPPID：默认为0，请设置为实际的 SDKAppID。
<li/>SECRETKEY：默认为空字符串，请设置为实际的密钥信息。</ul>

![](https://qcloudimg.tencent-cloud.cn/raw/db5b13a64c315bf933c69109355ec872.png)

[](id:ui.step3)
### 第三步：编译执行

在`room_flutter_example`目录下，执行以下命令以在您的设备上运行。
```
flutter run
```

>? 如果您在使用过程中，有什么建议或者意见，欢迎您加入我们的 TUIKit [开发者社群](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) ，进行技术交流和产品沟通。








