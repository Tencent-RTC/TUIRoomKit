# TUIRoom iOS 示例工程快速跑通
_中文 | [English](README.en.md)_

本文档主要介绍如何快速跑通TUIRoom 示例工程，体验多人音视频互动，更详细的TUIRoom组件接入流程，请点击腾讯云官网文档： [**TUIRoom 组件 iOS 接入说明** ](https://cloud.tencent.com/document/product/647/45681)


## 目录结构

```
TUIRoom
├─ Example              // 工程模块，主要提供 TUIRoom 的测试页面
├─ Resources            // TUIRoom 中所用的资源文件
├─ SDK                  // 依赖的本地库
├─ Source               // TUIRoom 组件的逻辑封装
└─ TUIRoom.podspec      // TUIRoom 组件 pod 接入文件

```

## 环境准备
- Xcode 11.0及以上版本
- 最低支持系统：iOS 11.0
- 请确保您的项目已设置有效的开发者签名
  
## 运行示例

### 第一步：创建TRTC的应用
- 您已 [注册腾讯云](https://cloud.tencent.com/document/product/378/17985) 账号，并完成 [实名认证](https://cloud.tencent.com/document/product/378/3629)。
  
### 申请 SDKAPPID 和 SECRETKEY
1. 登录实时音视频控制台，选择【开发辅助】>【[快速跑通Demo](https://console.cloud.tencent.com/trtc/quickstart)】。
2. 单击【立即开始】，输入您的应用名称，例如`TestTRTC`，单击【创建应用】。
<img src="https://main.qcloudimg.com/raw/169391f6711857dca6ed8cfce7b391bd.png" width="650" height="295"/>
3. 创建应用完成后，单击【我已下载，下一步】，可以查看 SDKAppID 和SECRETKEY。

### 第二步：下载源码，配置工程

1. 克隆或者直接下载此仓库源码，**欢迎 Star**，感谢~~
2. 工程默认集成的是`TXLiteAVSDK_TRTC`精简版SDK，您可通过【[官网链接](https://cloud.tencent.com/document/product/647/32689)】了解此版本SDK的具体功能。
3. 通过【[官网链接](https://cloud.tencent.com/document/product/647/32689)】去下载TXLiteAVSDK_ReplayKitExt.framework，然后放到SDK目录下
4. 工程目录下`Podfile`文件内已帮您添加了SDK的依赖`pod 'TXLiteAVSDK_TRTC'`，您只需要打开终端进入到工程目录下执行`pod install`，SDK就会自动集成。
5. 使用Xcode(11.0及以上)打开源码工程`DemoApp.xcworkspace`。
6. 工程内找到`TUIRoom/Debug/GenerateTestUserSig.swift`文件 。
7. 设置`GenerateTestUserSig.swift`文件中的相关参数：

<ul>
<li>SDKAPPID：默认为 0 ，请设置为实际申请的SDKAPPID。</li>
<li>SECRETKEY：默认为空字符串，请设置为实际申请的SECRETKEY。</li>
</ul>
<img src="https://liteav.sdk.qcloud.com/doc/res/trtc/picture/zh-cn/sdkappid_secretkey_ios.png" width="650" height="295"/>

>!本文提到的生成 UserSig 的方案是在客户端代码中配置 SECRETKEY，该方法中 SECRETKEY 很容易被反编译逆向破解，一旦您的密钥泄露，攻击者就可以盗用您的腾讯云流量，因此**该方法仅适合本地跑通工程和功能调试**。
>正确的 UserSig 签发方式是将 UserSig 的计算代码集成到您的服务端，并提供面向 App 的接口，在需要 UserSig 时由您的 App 向业务服务器发起请求获取动态 UserSig。更多详情请参见 [服务端生成 UserSig](https://cloud.tencent.com/document/product/647/17275#Server)。

### 第三步：编译运行

使用 Xcode（11.0及以上的版本）打开源码工程 `Example/DemoApp.xcworkspace`，单击【运行】即可开始调试本 App。

Tips：

TUIRoom 使用体验，至少需要两台设备，如果用户A/B分别代表两台不同的设备：

userId字符串类型，长度不超过32字节，不支持使用特殊字符，建议使用英文或数字，可结合业务实际账号体系自行设置

**设备 A（userId：111）**

- 步骤1、在欢迎页，输入用户名(请确保用户名唯一性，不能与其他用户重复)，比如111；
- 步骤2、点击创建房间；
- 步骤3、进入到创建房间界面，可以将创建的房间号记录下来；
- 步骤4、进入房间;

| 步骤1 | 步骤2 | 步骤3 | 步骤4 |
|---------|---------|---------|---------|
| <img src="https://liteav.sdk.qcloud.com/doc/res/trtc/picture/zh-cn/user_a.png" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/85ab7ea0a66aba5b9ddf23594bf04ea0.png" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/b36383baff761bdaf26da5f191902800.png" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/5f8b51e76d044c03af9e579a66fcaa1a.png" width="320"/> |

**设备 B（userId：222）**

- 步骤1：输入用户名(请确保用户名唯一性，不能与其他用户重复)，比如222；
- 步骤2、点击“加入房间”，输入用户 A 创建的房间号（设备A第3步记录的房间号），加入房间；

| 步骤1 | 步骤2 |
|---------|---------|
|<img src="https://qcloudimg.tencent-cloud.cn/raw/0349a16cf0f442016d1262d602327a67.png" width="320"/>|<img src="https://qcloudimg.tencent-cloud.cn/raw/a5f86a91670b56ed39bb40d6d4ea0d24.png" width="320"/>|
## 常见问题

- [TUI 场景化解决方案常见问题](https://cloud.tencent.com/developer/article/1952880)
- 欢迎加入 QQ 群：592465424，进行技术交流和反馈~

    
