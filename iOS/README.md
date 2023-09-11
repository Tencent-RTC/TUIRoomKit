# TUIRoomKit iOS 示例工程快速跑通

_中文 | [English](README.en.md)_

本文档主要介绍如何快速跑通TUIRoomKit 示例工程，体验高质量多人视频会议，更详细的TUIRoomKit组件接入流程，请点击腾讯云官网文档： [**TUIRoomKit 组件 iOS 接入说明** ](https://cloud.tencent.com/document/product/647/84237)...

## 目录结构

```
TUIRoomKit
├─ Example                      // 多人视频会议Demo工程
│   ├─ App                      // 进入/创建多人视频会议UI代码以及用到的图片及国际化字符串资源文件夹
│   ├─ Debug                    // 工程调试运行所需的关键业务代码文件夹
│   ├─ Login                    // 登录UI及业务逻辑代码文件夹
│   └─ TXReplayKit_Screen       // 共享屏幕逻辑代码文件夹
└─ TUIRoomKit                   // 多人视频会议主要UI代码以及所需的图片、国际化字符串资源文件夹
```

## 环境准备

iOS 12.0及更高。

## 运行并体验 App

[](id:ui.step1)
### 第一步：创建TRTC的应用
在使用 TUIRoomKit 发起会议前，您需要开通 TUIRoomKit 专属的多人音视频互动服务，详细步骤如下：
1. 登录[实时音视频 TRTC 控制台](https://console.cloud.tencent.com/trtc/app) ，单击左侧应用管理页面，找到需要开通 TUIRoomKit 的应用（SDKAppID），点击详情按钮，进入应用概览界面。
![](https://qcloudimg.tencent-cloud.cn/raw/f6f6507a9742933841db75f01ee989a6.png)

2.在应用概览页面找到**含 UI 低代码集成接入**卡片，选择**多人音视频（TUIRoomKit）**，点击领取体验按钮，领取7天体验版 TUIRoomKit 进行接入测试。
>! 领取体验版后仅开通 TUIRoomKit 7天的体验资格，测试过程中所产生的音视频时长等资源消耗，仍会按照实时音视频 TRTC 标准计费规则计费；
新账号首次可前往[试用中心](https://cloud.tencent.com/act/pro/video_freetrial?from=19654) 免费领取10000分钟音视频时长；
如果所选 SDKAppID 体验版领取次数已达上限，需要购买 TUIRoomKit 包月套餐才能开通服务，请点击**场景套餐订阅**按钮或前往 [购买页](https://buy.cloud.tencent.com/trtc) 购买；

![](https://qcloudimg.tencent-cloud.cn/raw/586cdb7b01bdc9de5a3671b6c122bcde.png)

![](https://qcloudimg.tencent-cloud.cn/raw/a05bf6de320ba9dadade2389a4ba4937.png)

3.领取完成后，可以看到体验版的基本信息，包括服务状态、版本信息和功能详情、到期时间。
![](https://qcloudimg.tencent-cloud.cn/raw/75719608854e2effe98a98d23f68bc0a.png)

4.单击**集成指南**按钮，即可参照集成指南开始集成。至此 TUIRoomKit 服务开通完成。
![](https://qcloudimg.tencent-cloud.cn/raw/fe8c949a53261febc3212a0c6f014070.png)

### 第二步：配置工程
1. 使用Xcode(12.0及以上)打开源码工程`DemoApp.xcworkspace`。
2. 工程内找到 `iOS/Example/Debug/GenerateTestUserSig.swift` 文件。
3. 设置 `GenerateTestUserSig.swift` 文件中的相关参数：
<ul style="margin:0"><li/>SDKAPPID：默认为0，请设置为实际的 SDKAppID。
<li/>SECRETKEY：默认为空字符串，请设置为实际的密钥信息。</ul>

![](https://qcloudimg.tencent-cloud.cn/raw/1c4eb799c7e06aa2da54ece87ccf993e.png)

[](id:ui.step3)
### 第三步：编译运行

1. 打开Terminal（终端）进入到工程目录下执行`pod install`指令，等待完成。
2. Xcode（12.0及以上的版本）打开源码工程 `TUIRoomKit/iOS/Example/DemoApp.xcworkspace`，单击 **运行** 即可开始调试本 App。

[](id:ui.step4)

>? 如果您在使用过程中，有什么建议或者意见，欢迎您加入我们的 TUIKit 组件交流群 QQ 群：592465424，进行技术交流和产品沟通。








