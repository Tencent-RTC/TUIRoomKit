# TUIRoom Web 示例工程快速跑通

本文档主要介绍如何快速跑通 TUIRoom Vue2 示例工程，体验多人音视频互动，更详细的TUIRoom组件接入流程，请点击腾讯云官网文档：[TUIRoom 组件 Web 接入说明](https://cloud.tencent.com/document/product/647/74765)...

## 目录结构

```
.
├── README.md
├── public
├── src
│   ├── App.vue  // 示例工程主页面
│   ├── TUIRoom  // TUIRoom UI 组件源文件
│   ├── config   // TUIRoom 配置文件
│   ├── main.ts  // 示例工程入口文件
│   ├── router          // 示例工程路由配置
│   ├── shims-tsx.d.ts
│   ├── shims-vue.d.ts
│   └── views           // 示例工程路由页面
├── tsconfig.json
├── vue.config.js
└── yarn.lock
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
2. 找到并打开 `Web/vue2/src/config/basic-info-config.js` 文件。
3. 配置 `basic-info-config.js` 文件中的相关参数：
	<img src="https://qcloudimg.tencent-cloud.cn/raw/d05a18af04758e352f9afcb0925d105c.png" width="900">
	- SDKAPPID：默认为 0，请设置为步第一步中记录下的 SDKAppID。
	- SECRETKEY：默认为 ''，请设置为步第一步中记录下的密钥信息。

### 第三步：运行示例

1. 安装依赖

   ```bash
   cd TUIRoom/Web/vue2
   
   npm install
   ```

2. 开发环境运行示例工程

   ```bash
   npm run serve
   ```

3. 打包 dist 文件

   ```bash
   npm run build
   ```
### 第四步：示例体验

开发环境运行示例工程后，在浏览器中打开页面 http://localhost:8080/#/home 即可体验 TUIRoom 功能。

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

### Q：项目打包之后部署到测试/生产环境，无法正常使用麦克风和摄像头是什么原因呢？

A: 请检查部署的链接是否为 https 协议，出于对用户安全、隐私等问题的考虑，浏览器限制网页在 https 协议下才能正常使用 TRTC Web SDK（WebRTC）的全部功能。


## 其他

- 欢迎加入 QQ 群：592465424，进行技术交流和反馈~