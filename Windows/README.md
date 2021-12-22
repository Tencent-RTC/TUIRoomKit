本文档主要介绍如何快速集成实时音视频（TRTC）SDK，运行 TRTC 场景化解决方案，实现多人音视频通话。

## 目录结构

```
TUIRoom
├─ RoomApp              // 程序的主目录
	├─ App                // 程序的源代码
	├─ bin                // 工程输出的可执行文件和调试所需的程序数据库文件
	├─ utils              // 工具类文件夹
	├─ Resources          // RoomApp所需的图片资源文件、QSS样式文件以及国际化翻译文件
	└─ 3rdParty           // RoomApp所依赖的第三方库
├─ Module               // RoomApp的数据模型交互层源代码
└─ SDK                  // RoomApp所依赖的Liteav SDK库文件和IM SDK库文件
```

## 环境准备
- Visual Studio 2015及以上集成开发环境。
- Qt5.9.1及以上版本的Qt开发库。
- VS下的Qt开发插件Qt Visual Studio Tools 2.2.0及以上。
- 最低支持系统：Windows 8
- 请确保您的集成开发环境能够正常开发

## 运行示例

### 前提条件
- 您已 [注册腾讯云](https://cloud.tencent.com/document/product/378/17985) 账号，并完成 [实名认证](https://cloud.tencent.com/document/product/378/3629)。

### 申请 SDKAPPID 和 SECRETKEY
1. 登录实时音视频控制台，选择【开发辅助】>【[快速跑通Demo](https://console.cloud.tencent.com/trtc/quickstart)】。
2. 单击【立即开始】，输入您的应用名称，例如`TestTRTC`，单击【创建应用】。
<img src="https://qcloudimg.tencent-cloud.cn/raw/4f44a7ca70f28807c91b4a04ccc1b960.png" width="650" height="295"/>
3. 创建应用完成后，单击【我已下载，下一步】，可以查看 SDKAppID 和密钥信息。

### 集成SDK
1. 工程默认集成了Windows端的SDK，您可通过【[官网链接](https://cloud.tencent.com/document/product/647/32689)】了解此版本SDK的具体功能。
2. 从官网下载了其他版本的SDK后，需要将其放到工程下SDK文件夹对应的目录里。

### 配置工程文件
1. 使用Visual Studio(VS 2015及以上)打开源码工程`RoomApp.vcxproj`。
2. 工程内找到`TUIRoom/RoomApp/utils/usersig/win/GenerateTestUserSig.h`文件 。
3. 设置`GenerateTestUserSig.h`文件中的相关参数：
<ul>
<li>SDKAPPID：默认为 0 ，请设置为实际申请的SDKAPPID。</li>
<li>SECRETKEY：默认为空字符串，请设置为实际申请的SECRETKEY。</li>
</ul>
<img src="https://qcloudimg.tencent-cloud.cn/raw/95e83fb9f4177baa2ff0d2033001e5ba.png" width="650" height="295"/>
4. 返回实时音视频控制台，单击【粘贴完成，下一步】。
5. 单击【关闭指引，进入控制台管理应用】。

>本文提到的生成 UserSig 的方案是在客户端代码中配置 SECRETKEY，该方法中 SECRETKEY 很容易被反编译逆向破解，一旦您的密钥泄露，攻击者就可以盗用您的腾讯云流量，因此**该方法仅适合本地跑通工程和功能调试**。
>正确的 UserSig 签发方式是将 UserSig 的计算代码集成到您的服务端，并提供面向 App 的接口，在需要 UserSig 时由您的 App 向业务服务器发起请求获取动态 UserSig。更多详情请参见 [服务端生成 UserSig](https://cloud.tencent.com/document/product/647/17275#Server)。

### 运行 App
1.配置环境变量QTDIR到您安装的Qt目录。

2.使用Visual Studio(VS 2015及以上)打开源码工程 `RoomApp.vcxproj`，单击【运行】即可开始调试本 App。

### 体验应用（**体验应用至少需要两台设备**）
#### 用户 A

步骤1、输入用户名(<font color=red>请确保用户名唯一性，不能与其他用户重复</font>)和会议号，点击进入房间，如图示：

![](https://qcloudimg.tencent-cloud.cn/raw/cc79d2596de5d14b3d487b403511cb1d.png)

步骤2、设备检测页面，您可以进行设备检测，或根据需要，设置进入房间使用的设备，设置美颜效果等。

![](https://qcloudimg.tencent-cloud.cn/raw/684ce3ce91252ccd7f2361e6ceccbfeb.png)

步骤3、点击【进入房间】后到主界面，第一个进入房间的为主持人，主界面包括麦上列表，底部工具栏，顶部工具栏等，如图示：

![](https://qcloudimg.tencent-cloud.cn/raw/b8d8098423b4a0694c584cebe408cbd0.png)

点击底部工具栏的【成员】按钮，可以查看成员列表，主持人对进入房间的成员有麦控权限，如图示：

![](https://qcloudimg.tencent-cloud.cn/raw/21c4285d9c02e2d0aef926b6ac68361f.png)

步骤4、点击底部工具栏的【分享】按钮，进行屏幕或应用的分享，如图示：

![](https://qcloudimg.tencent-cloud.cn/raw/6a16a3ac47b2b24a7ac0cca557b70a9b.png)

选择要分享的桌面或应用进行分享。

步骤5、在退出房间时，可以选择直接解散房间，或选择离开房间。

如果选择解散房间，则房间内的所有人都会收到房间解散通知，并退出房间；如果选择离开房间，此时房间内还有其他成员的话，则需要指定某人作为后续的主持人，如图示：

![](https://qcloudimg.tencent-cloud.cn/raw/83aafc6631c04927c9d16a5c0b4f8247.png)

#### 用户 B

步骤1、登录和设备检测的步骤同用户 A 的步骤1和步骤2。

步骤2、点击【进入房间】后，以成员身份进入房间，如图示：

![](https://qcloudimg.tencent-cloud.cn/raw/ad003b9e43f578200d63946450e0355b.png)

步骤3、点击底部工具栏的【成员】按钮，可以查看房间中的成员，但是不能对其他成员进行麦控，如图示：

![](https://qcloudimg.tencent-cloud.cn/raw/2e8c69c2730335a494535141154224a0.png)

步骤4、接收到有成员分享后，显示如下：

![](https://qcloudimg.tencent-cloud.cn/raw/16d1c02ae121bd15b992a9ef760cd55c.png)

## 常见问题
#### 1. 查看密钥时只能获取公钥和私钥信息，该如何获取密钥？
TRTC SDK 6.6 版本（2019年08月）开始启用新的签名算法 HMAC-SHA256。在此之前已创建的应用，需要先升级签名算法才能获取新的加密密钥。如不升级，您也可以继续使用 [老版本算法 ECDSA-SHA256](https://cloud.tencent.com/document/product/647/17275#.E8.80.81.E7.89.88.E6.9C.AC.E7.AE.97.E6.B3.95)，如已升级，您按需切换为新旧算法。

升级/切换操作：

 1. 登录 [实时音视频控制台](https://console.cloud.tencent.com/trtc)。
 2. 在左侧导航栏选择【应用管理】，单击目标应用所在行的【应用信息】。
 3. 选择【快速上手】页签，单击【第二步 获取签发UserSig的密钥】区域的【点此升级】、【非对称式加密】或【HMAC-SHA256】。

  - 升级：

   ![](https://main.qcloudimg.com/raw/69bd0957c99e6a6764368d7f13c6a257.png)

  - 切换回老版本算法 ECDSA-SHA256：

   ![](https://main.qcloudimg.com/raw/f89c00f4a98f3493ecc1fe89bea02230.png)

  - 切换为新版本算法 HMAC-SHA256：

   ![](https://main.qcloudimg.com/raw/b0412153935704abc9e286868ad8a916.png)

#### 2. 两台PC同时运行工程，为什么看不到彼此的画面？
请确保两台手机在运行工程时使用的是不同的 UserID，TRTC 不支持同一个 UserID （除非 SDKAppID 不同）在两个终端同时使用。

#### 3. 防火墙有什么限制？
由于 SDK 使用 UDP 协议进行音视频传输，所以在对 UDP 有拦截的办公网络下无法使用。如遇到类似问题，请参考 [应对公司防火墙限制](https://cloud.tencent.com/document/product/647/34399) 排查并解决。
