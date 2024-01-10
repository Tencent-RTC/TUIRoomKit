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
请参考官网文档中 [快速接入](https://cloud.tencent.com/document/product/1690/94555) 中获取自己的SDKAppID和SDKSecreKey。


[](id:ui.step2)
### 第二步：配置工程

1. 打开源码工程，在工程内找到 `room_flutter_example/lib/debug/generate_test_user_sig.dart` 文件。
2. 设置 `generate_test_user_sig.dart` 文件中的相关参数：
<ul style="margin:0"><li/>SDKAPPID：默认为0，请设置为实际的 SDKAppID。
<li/>SECRETKEY：默认为空字符串，请设置为实际的密钥信息。</ul>

![](../../Preview/test-user-sig-flutter.png)

[](id:ui.step3)
### 第三步：编译执行

在`room_flutter_example`目录下，执行以下命令以在您的设备上运行。
```
flutter run
```

>? 如果您在使用过程中，有什么建议或者意见，欢迎您加入我们的 TUIKit [开发者社群](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) ，进行技术交流和产品沟通。







