# TUIRoom Window-Mac 示例工程快速跑通
本文档主要介绍如何快速跑通TUIRoom 示例工程，多人音视频通话，更详细的TUIRoom组件接入流程，请点击腾讯云官网文档:
[TUIRoom组件Windows-Mac接入说明](https://cloud.tencent.com/document/product/647/63494)

## 目录结构

```
TUIRoom
├─ RoomApp              // 程序的主目录
   ├─ App               // 程序的源代码
   ├─ bin               // 工程输出的可执行文件和调试所需的程序数据库文件
   ├─ Resources         // RoomApp所需的图片资源文件、QSS样式文件以及国际化翻译文件
   └─ 3rdParty          // RoomApp所依赖的第三方库
├─ Common               // RoomApp的通用类
├─ utils                // 工具类文件夹
├─ Module               // RoomApp的数据模型交互层源代码
└─ SDK                  // RoomApp所依赖的Liteav SDK库文件和IM SDK库文件
```

## 环境准备
#### Windows环境 ：
- Visual Studio 2015及以上集成开发环境。
- QT5.9.1及以上版本的Qt开发库。
- VS下的QT开发插件Qt Visual Studio Tools 2.2.0及以上。
- 最低支持系统：Windows 8。
- 请确保您的集成开发环境能够正常开发。

#### Mac环境：
- QT5.9.1及以上版本的QT开发库。
- QtCreator集成开发环境，在安装QT时选择同时安装QtCreator即可，版本跟随QT官方安装包。
- 请确保您的QtCreator集成开发环境能够正常开发。

## 运行示例

### 前提条件
- 您已 [注册腾讯云](https://cloud.tencent.com/document/product/378/17985) 账号，并完成 [实名认证](https://cloud.tencent.com/document/product/378/3629)。

### 申请 SDKAPPID 和 SECRETKEY
1. 登录实时音视频控制台，选择【开发辅助】>【[快速跑通Demo](https://console.cloud.tencent.com/trtc/quickstart)】。
2. 单击【立即开始】，输入您的应用名称，例如`TestTRTC`，单击【创建应用】。
   <img src="https://qcloudimg.tencent-cloud.cn/raw/4f44a7ca70f28807c91b4a04ccc1b960.png" width="650" height="295"/>
3. 创建应用完成后，单击【我已下载，下一步】，可以查看 SDKAppID 和密钥信息。

### 集成SDK
1. 工程默认集成了Windows/Mac端的SDK，您可通过【[官网链接](https://cloud.tencent.com/document/product/647/32689)】了解此版本SDK的具体功能。
2. 从官网下载了其他版本的SDK后，需要将其放到工程下SDK文件夹对应的目录里。

### 下载源码，配置工程文件
克隆或者直接下载此仓库源码，欢迎 Star，感谢~~

#### Windows端的配置
1. 使用Visual Studio(VS 2015及以上)打开源码工程`RoomApp.vcxproj`。
2. 工程内找到`TUIRoom\Windows-Mac\utils\usersig\win\GenerateTestUserSig.h`文件 。
3. 设置`GenerateTestUserSig.h`文件中的相关参数：
   <ul>
   <li>SDKAPPID：默认为 0 ，请设置为实际申请的SDKAPPID。</li>
   <li>SECRETKEY：默认为空字符串，请设置为实际申请的SECRETKEY。</li>
   </ul>
   <img src="https://qcloudimg.tencent-cloud.cn/raw/95e83fb9f4177baa2ff0d2033001e5ba.png" width="650" height="295"/>
4. 返回实时音视频控制台，单击【粘贴完成，下一步】。
5. 单击【关闭指引，进入控制台管理应用】。

#### Mac端的配置
1. 使用QtCreator开发源码工程的`RoomApp.pro`。
2. 工程内找到`TUIRoom\Windows-Mac\utils\usersig\mac\UserSigConfig.h`文件 。
3. 设置`UserSigConfig.h`文件中的相关参数：
   <ul>
   <li>SDKAPPID_：默认为 0 ，请设置为实际申请的SDKAPPID。</li>
   <li>SecretKey_：默认为空字符串，请设置为实际申请的SECRETKEY。</li>
   </ul>
4. 返回实时音视频控制台，单击【粘贴完成，下一步】。
5. 单击【关闭指引，进入控制台管理应用】。

>本文提到的生成 UserSig 的方案是在客户端代码中配置 SECRETKEY，该方法中 SECRETKEY 很容易被反编译逆向破解，一旦您的密钥泄露，攻击者就可以盗用您的腾讯云流量，因此**该方法仅适合本地跑通工程和功能调试**。
>正确的 UserSig 签发方式是将 UserSig 的计算代码集成到您的服务端，并提供面向 App 的接口，在需要 UserSig 时由您的 App 向业务服务器发起请求获取动态 UserSig。更多详情请参见 [服务端生成 UserSig](https://cloud.tencent.com/document/product/647/17275#Server)。

### 运行 App
请先确保qt环境配置正常
#### Windows端:
- Windows端使用Visual Studio（VS 2015及以上版本）打开源码工程 `RoomApp.vcxproj`，
- 在项目右键>>属性>>QtProjectSetting>>General>>QtInstallation 重新选择一下目前已经安装的Qt环境

   <img src="https://qcloudimg.tencent-cloud.cn/raw/f7246267e5fbee96e481e6e491f6a3ea.png" width="500" height="280"/>

- 单击【运行】即可开始调试运行本App。

#### Mac端:
- Mac端先配置系统环境变量 QTDIR 指向QT的安装目录，然后使用QtCreator打开源码工程`RoomApp.pro`，构建并运行本App。

### 体验应用（**体验应用至少需要两台设备**）

<img src="https://qcloudimg.tencent-cloud.cn/raw/13e8da39567148855f38bb9c4542f87e.png" width="600" height="300"/>

<img src="https://qcloudimg.tencent-cloud.cn/raw/b1ea46a940b51ed51a5ef8ba350f9a34.png" width="600" height="340"/>

#### 用户 A
- 步骤一：登录输入用户名与房间号，点击进入房间按钮。(用户名请保证唯一性，例如：user_A，房间号为数字组合，最多不超过9位，例如：123456)
- 步骤二：设备检测页面检查设备，进房前设置完成后点击进入房间按钮。
- 步骤三：进入房间成功，成为主持人。(第一个进入房间的为主持人)

#### 用户 B
- 步骤一：登录输入用户名与房间号，点击进入房间按钮。(用户名请保证唯一性，例如：user_B，房间号为数字组合，最多不超过9位，例如：123456)
- 步骤二：设备检测页面检查设备，进房前设置完成后点击进入房间按钮。
- 步骤三：进入房间成功，显示麦上列表，可以看到user_A并进行会话。

## 常见问题

>? 更多帮助信息，详见 [TUI 场景化解决方案常见问题](https://cloud.tencent.com/developer/article/1952880)，欢迎加入 QQ 群：592465424，进行技术交流和反馈~