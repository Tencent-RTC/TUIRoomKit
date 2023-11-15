_简体中文 | [English](README.md)_
# 腾讯云 · 多人音视频房间解决方案

<img src="https://qcloudimg.tencent-cloud.cn/raw/1539bcd27bb2f03a019d55bf65f6c1f5.png" align="left" width=120 height=120>  TUIRoomKit 是腾讯云推出一款定位 企业会议、在线课堂、网络沙龙等场景的 UI 组件，通过集成该组件，您只需要编写几行代码就可以为您的 App 添加类似视频会议功能，并且支持屏幕分享、成员管理，禁麦禁画、聊天弹幕等功能。TUIRoomKit 支持 Windows、Mac、Android、iOS、Web、Electron 等多个开发平台。

## 产品特性

<p align="center">
  <img src="https://qcloudimg.tencent-cloud.cn/image/document/7be3c2af73da159e6c691010cec31b4a.png"/>
</p>

- 接入方便：提供带 UI 的开源组件，节省90%开发时间，快速上线在线视频会议功能。
- 平台互通：各平台的 TUIRoomKit 组件互联互通，沟通无障碍；
- 屏幕分享：基于3000+家市场应用共同打磨的各平台屏幕采集能力，搭配专属AI 编码算法，更低码率更清晰的画面；
- 成员管理：支持全体静音、单一成员禁言禁画、邀请发言、踢出房间等多个标准的房间管理功能；
- 其他特性：支持房间成员聊天弹幕、音效设置等其他特性，欢迎使用；

## 开始使用

这里以 含 UI 的集成（即TUIRoomKit）为例，这也是我们推荐的集成方式，关键步骤如下：


### 环境准备

|         平台          |  版本   |
| -------------------- | ------ |
| Flutter |3.0.0 及以上版本。|
| Android | 最低兼容 Android 4.1（SDK API Level 16），建议使用 Android 5.0 （SDK API Level 21）及以上版本|
| iOS     |iOS 12.0 及更高。|

### 开通服务

在使用 `rtc_conference_tuikit` 创建房间前，您需要开通 `rtc_conference_tuikit` 专属的多人音视频互动服务，详细步骤如下：

1. 登录  [腾讯云视立方 SDK 控制台](https://console.cloud.tencent.com/vcube/project/manage)，单击**创建项目**，选择**多人音视频互动场景**和**集成方式**。选择**含 UI 集成**。![](https://qcloudimg.tencent-cloud.cn/raw/1b039c84e2e701346c14465312b25841.png)

2. 在选定接入场景和集成方式以后，您需要开通**多人音视频房间 SDK **使用的两项腾讯云基础的 PaaS 能力，即 [即时通信 IM](https://cloud.tencent.com/document/product/269/1498) 和 [实时音视频 TRTC](https://cloud.tencent.com/document/product/647/16788)，开通后，单击**创建项目并下一步**。
   ![](https://qcloudimg.tencent-cloud.cn/raw/68a7b036e19c20d5a4c56d2f064c76b5.png)

3. 在项目创建完成以后，您需要为该项目匹配一个 IM 应用。因为多人音视频房间 SDK 依赖了 IM SDK 提供的基础能力，在这里可以创建或者管理已有的 IM 应用。关联成功后，可以领取**7天的免费体验版**，用于后续的开发调试工作。如果您之前已经体验过，可以直接在该页面单击 [购买正式版本](https://buy.cloud.tencent.com/vcube?type=call&sdkappid=1400590001)。![](https://qcloudimg.tencent-cloud.cn/raw/92d2b15d84e44ac03811f56a9ee97a02.png)

4. 单击**前往集成**，选择**项目配置**查看详细的配置页面，找到 SDKAppID 和密钥并记录下来。它们会在后续的 [第二步：配置工程] 中被用到，至此多人音视频房间 SDK 服务开通完成。![](https://qcloudimg.tencent-cloud.cn/raw/63494d7c655f6fb628aff8889838ec6d.png)


### 接入使用
- 步骤一：安装 `rtc_conference_tuikit` 依赖

  在您的工程 `pubspec.yaml` 文件中，添加rtc_conference_tuikit插件依赖，或进入你的工程目录下执行如下命令添加依赖。
  ```
  dependencies:  
   rtc_conference_tuikit: 最新版本
  ```
  执行以下命令安装组件
  ```
  flutter pub get
  ```

- 步骤二：登陆 `rtc_conference_tuikit` 组件
  ```dart
  import 'package:rtc_room_engine/rtc_room_engine.dart';

  var result = await TUIRoomEngine.login(
  SDKAPPID, // 请替换为您的SDKAPPID
  'userId', // 请替换为您的User ID
  'userSig',// 请替换为您的userSig
  );

  if (result.code == TUIError.success) {
    // login success
  } else {
    // login error
  }
  ```

- 步骤三：使用 `rtc_conference_tuikit` 组件

  - 设置自己头像、昵称
    ```dart
    import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';

    var roomKit = TUIRoomKit.createInstance();
    roomKit.setSelfInfo(userName, avatarURL);
    ```

  - 创建房间
    ```dart
    import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';

    var roomKit = TUIRoomKit.createInstance();
    TUIRoomInfo roomInfo = TUIRoomInfo(roomId: '您的roomId');

    var result = await roomKit.createRoom(roomInfo);
    if (result.code == TUIError.success) {
        // create room success
    } else {
        // create room error
    }
    ```

  - 加入房间(**调用该接口后会为您拉起UI界面进入房间**)
    ```dart
    import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';

    var roomKit = TUIRoomKit.createInstance();
    var result = await roomKit.enterRoom('roomId',         // 您的room id
                                         isOpenMicrophone, // 进房是否开启麦克风
                                         isOpenCamera,     // 进房是否开启摄像头
                                         userSpeaker);     // 进房是否使用扬声器播放声音
    if (result.code == TUIError.success) {
        // enter room success
    } else {
        // enter room success
    }
    ```


## 快速访问

- 如果你遇到了困难，可以先参阅 [常见问题](https://cloud.tencent.com/document/product/1690/90103)，这里整理开发者最常出现的问题，覆盖各个平台，希望可以帮助您快速解决问题
- 如果你想了解更多官方示例，可以参考各平台的示例 Demo：[Web](../../Web/)、[Android](../../Android/)、[iOS](../../iOS/)、[Electron](../../Electron/)、[Windows](../../Windows-Mac/)
- 如果您想了解我们最新的一些产品特性，可以查看 [更新日志](https://cloud.tencent.com/document/product/1690/89361)，这里有 TUIRoomKit 最新的功能特性，以及历史版本功能迭代
- 完整的 API 文档见 [多人音视频 SDK API 示例](https://cloud.tencent.com/document/product/1690/94557)：包含TUIRoomKit（含 UI）、TUIRoomEngine（无 UI）、以及事件回调等介绍。
- 如果你想了解更多腾讯云音视频团队维护的项目，可以查看我们的 [产品官网](https://cloud.tencent.com/product/rtcube)、[Github Organizations](https://github.com/LiteAVSDK) 等



## 交流&反馈

如果您在使用过程中有遇到什么问题，欢迎提交 [**issue**](https://github.com/tencentyun/TUIRoomKit/issues)，我们也欢迎您加入我们的 [开发者社群](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) 进行技术交流和反馈问题.
