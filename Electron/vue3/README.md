# TUIRoomKit Electron 示例工程快速跑通

本文档主要介绍如何快速跑通 TUIRoomKit Electron 示例工程，体验多人音视频互动，更详细的 TUIRoomKit Electron 组件接入流程，请点击腾讯云官网文档：[TUIRoomKit 组件 Electron 接入说明](https://cloud.tencent.com/document/product/647/84238)...

> **限免公测说明：**
>
> 产品目前处于**限免公测期，暂不收取额外费用**，目前服务计费与即时通信 IM、实时音视频 TRTC 产品计费服务保持一致 ，您可限时免费下载 SDK 并接入体验多人音视频会话能力。若**未来多人音视频 SDK 的计费方式、功能和限免公测时间等有所变更，我们将提前在官网发布公告进行说明，并通过站内信、短信、邮件等方式提前通知您，敬请关注。**
产品计费如下：
>
> ![](https://qcloudimg.tencent-cloud.cn/raw/d7cc415af767a462efef414849255ea9.svg)

## 目录结构

```
.
├── dist                      构建后，根据 packages 目录生成
|   ├── main
|   ├── preload
|   └── renderer
|
├── scripts
|   ├── build.mjs             项目开发脚本 npm run build
|   └── watch.mjs             项目开发脚本 npm run dev
|
├── packages
|   ├── main                  主进程源码
|   |   |── vite.config.ts
|   |   └── index.ts
|   ├── preload               预加载脚本源码
|   |   ├── vite.config.ts
|   |   ├── index.ts
|   |   ├── loading.ts
|   |   └── utils.ts
|   └── renderer              渲染进程源码
|       ├── auto-imports.d.ts
|       ├── components.d.ts
|       ├── tsconfig.json
|       ├── index.html
|       ├── src
│       |   ├── App.vue   // 示例工程主页面
│       |   ├── TUIRoom   // TUIRoom UI 组件源文件
│       |   ├── assets    // 公共资源
│       |   ├── config    // TUIRoom 配置文件
│       |   ├── env.d.ts
│       |   ├── main.ts   // 示例工程入口文件
│       |   ├── router    // 示例工程路由配置
│       |   └── views     // 示例工程路由页面
|       └── vite.config.ts
```
### 第一步：创建TRTC的应用

1. 进入腾讯云实时音视频控制台的 [应用管理](https://console.cloud.tencent.com/trtc/app) 界面，选择创建应用，输入应用名称，例如 `TUIKitDemo` ，单击 **创建**；
2. 点击对应应用条目后**应用信息**，具体位置如下下图所示：
    <img src="https://qcloudimg.tencent-cloud.cn/raw/62f58d310dde3de2d765e9a460b8676a.png" width="900">
3. 进入应用信息后，按下图操作，记录SDKAppID和密钥：
    <img src="https://qcloudimg.tencent-cloud.cn/raw/bea06852e22a33c77cb41d287cac25db.png" width="900">

>! 本功能同时使用了腾讯云 [实时音视频 TRTC](https://cloud.tencent.com/document/product/647/16788) 和 [即时通信 IM](https://cloud.tencent.com/document/product/269) 两个基础 PaaS 服务，开通实时音视频后会同步开通即时通信 IM 服务。 即时通信 IM 属于增值服务，详细计费规则请参见 [即时通信 IM 价格说明](https://cloud.tencent.com/document/product/269/11673)。

### 第二步：下载源码，配置工程
1. 克隆或者直接下载此仓库源码，**欢迎 Star**，感谢~~
2. 找到并打开 ` Electron/vue3/packages/renderer/src/config/basic-info-config.js` 文件。
3. 配置 `basic-info-config.js` 文件中的相关参数：
	<img src="https://qcloudimg.tencent-cloud.cn/raw/d05a18af04758e352f9afcb0925d105c.png" width="900">
	- SDKAPPID：默认为 0，请设置为步骤一中记录下的 SDKAppID。
	- SECRETKEY：默认为 ''，请设置为步骤一中记录下的密钥信息。

### 第三步：运行示例

1. 安装依赖

   ```bash
   cd TUIRoomKit/Electron/vue3
   
   npm install
   ```

    > **注意**
    >
    > 如果依赖安装过程缓慢或者出现网络超时报错，如 “ERR_SOCKET_TIMEOUT” 或者 “Error: Socket timeout”，可设置就近的 npm 库镜像和 Electron 下载镜像，中国大陆地区，可在项目根目录下创建 .npmrc 文件，文件中增加如下镜像设置。
    > ```
    > registry=https://registry.npmmirror.com
    > ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
    > ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
    > ```

2. 开发环境运行示例工程

   ```bash
   npm run dev
   ```


3. 构建安装包、运行
   - 构建符合当前机器 CPU 类型的安装包。适合 Windows 和 Mac 操作系统。

   ```bash
   npm run build                 // 构建 mac 单架构包、windows 包 
   npm run build:mac-universal   // 构建 mac 双架构包
   ```
   > 注意：构建好的安装包位于 release 目录下。默认只能使用 Mac 电脑构建 Mac 安装包，使用 Windows 电脑构建 Windows 安装包。


### 第四步：示例体验

开发环境运行示例工程后，可直接体验 TUIRoomKit 功能。

注意：因 TUIRoomKit 按需引入 element-plus 组件，会导致开发环境路由页面第一次加载时反应较慢，等待 element-plus 按需加载完成即可正常使用。element-plus 按需加载不会影响打包之后的页面加载。

Tips：TUIRoomKit 完整功能体验，至少需要两个 userId 不同的用户。需要您在两台设备上参考第二步配置 TUIRoomKit 示例工程并运行代码：

**主持人（userId：anchor）**
- 步骤1、在 home 页面，点击【创建房间】按钮；
- 步骤2、进入 TUIRoom 房间；

| 步骤1 | 步骤2 |
|---------|---------|
| <img src="https://qcloudimg.tencent-cloud.cn/raw/8acad0f524c325e1f62ca0fcf9e9f54b.png" width="320"/> | <img src="https://web.sdk.qcloud.com/component/tuiroom/assets/page-room.png" width="320"/> |

**普通成员（userId：audience）**

- 步骤1、在 home 页面，输入主持人创建的房间 Id，点击【加入房间】按钮；
- 步骤2、加入房间；

| 步骤1 | 步骤2 |
|---------|---------|
| <img src="https://web.sdk.qcloud.com/component/tuiroom/assets/page-home.png" width="320"/> | <img src="https://web.sdk.qcloud.com/component/tuiroom/assets/page-room.png" width="320"/> |
## 常见问题

- 欢迎加入 QQ 群：695855795，进行技术交流和反馈~
