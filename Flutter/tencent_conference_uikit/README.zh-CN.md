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


### 环境准备

|         平台          |  版本   |
| -------------------- | ------ |
| Flutter |3.0.0 及以上版本。|
| Android | 最低兼容 Android 4.1（SDK API Level 16），建议使用 Android 5.0 （SDK API Level 21）及以上版本|
| iOS     |iOS 12.0 及更高。|

### 开通服务
请参考官网文档中 [快速接入](https://cloud.tencent.com/document/product/1690/94555) 中获取自己的`SDKAppID`和`SDKSecretKey`。

### 接入使用
- 步骤一：安装 `tencent_conference_uikit` 依赖

  在您的工程 `pubspec.yaml` 文件中，添加[tencent_conference_uikit](https://pub.dev/packages/tencent_conference_uikit)插件依赖。
  ```
  dependencies:  
   tencent_conference_uikit: 最新版本
  ```
  执行以下命令安装组件
  ```
  flutter pub get
  ```

- 步骤二：完成工程配置

  - 由于`tencent_conference_uikit`组件使用了`GetX`状态管理库的相关功能，您需要在您的应用程序中使用 `GetMaterialApp` 来代替 `MaterialApp`。或者您也可以将您 `MaterialApp` 中的 `navigatorKey` 属性设置为 `Get.key` 以实现相同的效果。
    ```dart
    //此步骤需导入get包后再操作。由于tencent_conference_uikit中已有对get的依赖，您无需再您的pubspec.yaml中进行额外的配置。
    import 'package:get/get.dart';  

    class MyApp extends StatelessWidget {
      @override
      Widget build(BuildContext context) {
        return GetMaterialApp(  // 使用GetMaterialApp来代替MaterialApp
          // 您原先的MaterialApp内容
        );
      }
    }
    ```

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

- 步骤三：登陆 `tencent_conference_uikit` 组件
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
  **参数说明**

  这里详细介绍一下 login 函数中所需要用到的几个关键参数：
  - **SDKAppID**：在 [开通服务](#开通服务) 中的第4步中您已经获取到，这里不再赘述。

  - **UserID**：当前用户的 ID，字符串类型，只允许包含英文字母（a-z 和 A-Z）、数字（0-9）、连词符（-）和下划线（_）。

  - **UserSig**：使用 [开通服务](#开通服务) 的第4步中获取的 SDKSecretKey 对 SDKAppID、UserID 等信息进行加密，就可以得到 UserSig，它是一个鉴权用的票据，用于腾讯云识别当前用户是否能够使用 TRTC 的服务。您可以通过控制台中的 [辅助工具](https://console.cloud.tencent.com/im/tool-usersig) 生成一个临时可用的 UserSig。


    更多信息请参见 [如何计算及使用 UserSig](https://cloud.tencent.com/document/product/647/17275)。
    

  > **注意：**
  > 
  >   - **这个步骤也是目前我们收到的开发者反馈最多的步骤，常见问题如下：**
  >   - `SDKAppID`设置错误，国内站的`SDKAppID`一般是以140开头的10位整数。
  >   - `UserSig`被错配成了加密密钥（`SDKSecretKey`），`UserSig`是用`SDKSecretKey`把`SDKAppID`、`UserID`以及过期时间等信息加密得来的，而不是直接把`SDKSecretKey`配置成`UserSig`。
  >   - `UserID`被设置成“1”、“123”、“111”等简单字符串，由于 **TUIRoomEngine不支持同一个 UserID 多端登录**，所以在多人协作开发时，形如 “1”、“123”、“111” 这样的`UserID`很容易被您的同事占用，导致登录失败，因此我们建议您在调试的时候设置一些辨识度高的`UserID`。
  >   - `Github`中的[示例代码](https://github.com/tencentyun/TUIRoomKit/blob/main/Flutter/room_flutter_example/lib/debug/generate_test_user_sig.dart)使用了`genTestUserSig`函数在本地计算 UserSig 是为了更快地让您跑通当前的接入流程，但该方案会将您的 `SDKSecretKey`暴露在 App 的代码当中，这并不利于您后续升级和保护您的 SDKSecretKey，所以我们强烈建议您将`UserSig`的计算逻辑放在服务端进行，并由 App 在每次使用`TUIRoomKit`组件时向您的服务器请求实时计算出的 UserSig。


  **登录聊天（可选）**

    Flutter **TUIRoomKit**（**tencent_conference_uikit**）自**2.4.1**版本开始引入**弹幕聊天功能**。如您需要使用弹幕聊天功能，需要完成以下初始化及登录：
    ``` dart
    import 'package:tencent_cloud_chat_sdk/enum/V2TimSDKListener.dart';
    import 'package:tencent_cloud_chat_sdk/enum/log_level_enum.dart';
    import 'package:tencent_cloud_chat_sdk/models/v2_tim_callback.dart';
    import 'package:tencent_cloud_chat_sdk/tencent_im_sdk_plugin.dart';

    // 初始化
    var initResult = await TencentImSDKPlugin.v2TIMManager.initSDK(
        sdkAppID: SDKAPPID,                     // 请替换为您的SDKAPPID
        loglevel: LogLevelEnum.V2TIM_LOG_INFO,  // 日志登记等级
        listener: V2TimSDKListener()，          // 事件监听器。使用弹幕聊天时，这里传空对象即可。
    );
        
    if (initResult.code == 0) { // 初始化成功
        // 登录   
        V2TimCallback imLoginResult = await TencentImSDKPlugin.v2TIMManager.login(
          userID: 'userId',   // 请替换为您的UserID
          userSig: 'userSig', // 请替换为您的userSig
        );
    }
    ```

    > **说明：**
    > 
    > 弹幕聊天功能在 TUIRoomKit 中默认开启。如您无需弹幕聊天功能，您无需进行上述初始化及登录操作，并可以通过 **底部栏** -> **设置** -> **开启弹幕聊天**选项来关闭弹幕聊天。
    > 


- 步骤四：使用 `tencent_conference_uikit` 组件

  - 设置自己头像、昵称（可选）
    ```dart
    import 'package:rtc_room_engine/rtc_room_engine.dart';

    TUIRoomEngine.setSelfInfo(userName, avatarURL);
    ```

  - 开始快速会议
    ```dart
    import 'package:tencent_conference_uikit/tencent_conference_uikit.dart';

    ConferenceSession.newInstance('roomId')   //您的room id
      ..onActionSuccess = _quickStartSuccess
      ..onActionError = _quickStartError
      ..quickStart();

    void _quickStartSuccess() {
      //您可以在开始快速会议的成功回调中,自行导航至会议页面。
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ConferenceMainPage(),
        ),
      );
    }

    void _quickStartError(ConferenceError error, String message) {
      debugPrint("code: $error message: $message");
    }
    ```

  - 加入会议
    ```dart
    import 'package:tencent_conference_uikit/tencent_conference_uikit.dart';

    ConferenceSession.newInstance('roomId')   //您的room id
      ..onActionSuccess = _joinSuccess
      ..onActionError = _joinError
      ..join();

    void _joinSuccess() {
      //您可以在加入会议的成功回调中,自行导航至会议页面。
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ConferenceMainPage(),
        ),
      );
    }

    void _joinError(ConferenceError error, String message) {
      debugPrint("code: $error message: $message");
    }
    ```


## 快速访问

- 如果你遇到了困难，可以先参阅 [常见问题](https://cloud.tencent.com/document/product/1690/90103)，这里整理开发者最常出现的问题，覆盖各个平台，希望可以帮助您快速解决问题
- 如果你想了解更多官方示例，可以参考各平台的示例 Demo：[Web](../../Web/)、[Android](../../Android/)、[iOS](../../iOS/)、[Electron](../../Electron/)、[Qt](../../Qt/)
- 如果您想了解我们最新的一些产品特性，可以查看 [更新日志](https://cloud.tencent.com/document/product/1690/89361)，这里有 TUIRoomKit 最新的功能特性，以及历史版本功能迭代
- 完整的 API 文档见 [多人音视频 SDK API 示例](https://cloud.tencent.com/document/product/1690/94557)：包含TUIRoomKit（含 UI）、TUIRoomEngine（无 UI）、以及事件回调等介绍。
- 如果你想了解更多腾讯云音视频团队维护的项目，可以查看我们的 [产品官网](https://cloud.tencent.com/product/rtcube)、[Github Organizations](https://github.com/Tencent-RTC) 等



## 交流&反馈

如果您在使用过程中有遇到什么问题，欢迎提交 [**issue**](https://github.com/tencentyun/TUIRoomKit/issues)，我们也欢迎您加入我们的 [开发者社群](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) 进行技术交流和反馈问题.
