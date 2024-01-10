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

### 第一步：开通服务
请参考官网文档中 [快速接入](https://cloud.tencent.com/document/product/1690/94555) 中获取自己的SDKAppID和SDKSecreKey。

### 接入使用
- 步骤一：安装 `rtc_conference_tui_kit` 依赖

  在您的工程 `pubspec.yaml` 文件中，添加rtc_conference_tui_kit插件依赖，或进入你的工程目录下执行如下命令添加依赖。
  ```
  dependencies:  
   rtc_conference_tui_kit: 最新版本
  ```
  执行以下命令安装组件
  ```
  flutter pub get
  ```

- 步骤二：完成工程配置

  - 由于`rtc_conference_tui_kit`组件使用了`GetX`状态管理库进行导航，您需要在您的应用程序中使用 `GetMaterialApp` 来代替 `MaterialApp`。或者您也可以将您 `MaterialApp` 中的 `navigatorKey` 属性设置为 `Get.key` 以实现相同的效果。

  - 使用`Xcode`打开您的工程，选择【项目】->【Building Settings】->【Deployment】，将其下的【Strip Style】设置为`Non-Global Symbols`，以保留所需要的全局符号信息。

  - 如您需要在iOS端使用音视频功能，需要授权麦克风和摄像头的使用权限（Android端已在SDK中声明相关权限，您无需手动进行相关配置）。
    
    在 App 的`Info.plist`中添加以下两项，分别对应麦克风和摄像头在系统弹出授权对话框时的提示信息。
    ```
    <key>NSCameraUsageDescription</key>
    <string>TUIRoom需要访问您的相机权限</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>TUIRoom需要访问您的麦克风权限</string>
    ```
    完成以上添加后，在您的`ios/Podfile`中添加以下预处理器定义，用于启用相机与麦克风权限。
    ```ruby
    post_install do |installer|
      installer.pods_project.targets.each do |target|
        flutter_additional_ios_build_settings(target)
          target.build_configurations.each do |config|
            config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= [
          '$(inherited)',
          'PERMISSION_MICROPHONE=1',
          'PERMISSION_CAMERA=1',
          ]
        end
      end
    end
    ```

- 步骤三：登陆 `rtc_conference_tui_kit` 组件
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

- 步骤四：使用 `rtc_conference_tui_kit` 组件

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
