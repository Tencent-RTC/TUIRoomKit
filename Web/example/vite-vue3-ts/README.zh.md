# TUIRoomKit Web 示例工程快速跑通

简体中文 | [English](README.md)

本文档主要介绍如何快速跑通 TUIRoomKit 示例工程，体验多人音视频互动，更详细的 TUIRoomKit 组件接入流程，请点击腾讯云官网文档：[TUIRoomKit 组件 Web 接入说明](https://cloud.tencent.com/document/product/647/81962)...

> 提示：<br>
> 本示例工程集成 TUIRoomKit 的 npm 包 [@tencentcloud/roomkit-web-vue3
](https://www.npmjs.com/package/@tencentcloud/roomkit-web-vue3)。该 npm 包提供了会前预览组件、会中组件以及发起会议、加入会议和界面微调的方法。如需了解更多，请参考 [TUIRoomKit API](https://cloud.tencent.com/document/product/647/81969)。若这些 API 无法满足您的业务需求，您可以参考 [TUIRoomKit 源码导出](https://cloud.tencent.com/document/product/647/81965#7076b44f-846d-4b20-90f1-3e2594f20ec3) 方案接入 TUIRoomKit 源码。

## 目录结构

```
.
├── README.md
├── README.zh.md
├── index.html
├── package.json
├── public
│   └── favicon.ico
├── src
│   ├── App.vue         -- 示例工程主页面
│   ├── config          -- 用户信息配置文件及测试 userSig 生成文件
│   ├── hooks           -- 业务公用逻辑
│   ├── i18n            -- 国际化配置，支持中文、英文
│   ├── main.ts         -- 示例工程入口文件
│   ├── router          -- 示例工程路由配置
│   ├── styles          -- 全局样式
│   ├── utils           -- 工具函数
│   └── views           -- 示例工程页面（包括 PC 端和 H5 端的首页及会议页面）
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```
### 第一步：开通服务

在使用 TUIRoomKit 发起会议前，您需要开通 TUIRoomKit 专属的多人音视频互动服务，详细步骤如下：

1. 登录 [腾讯云视立方 SDK 控制台](https://console.cloud.tencent.com/vcube/project/manage)，单击创建项目按钮后，选择多人音视频互动场景和集成方式，这里我们推荐“含 UI 快速集成”，即 TUIRoomKit。<br>
<img src="https://qcloudimg.tencent-cloud.cn/image/document/a7ff9c2e362530504c00afad3f60b443.png" width="900" />

2. 在选定接入场景和集成方式以后，您需要开通多人音视频房间 SDK 使用的两项腾讯云基础的 PaaS 能力，即 [即时通信 IM](https://cloud.tencent.com/document/product/269/1498) 和 [实时音视频 TRTC](https://cloud.tencent.com/document/product/647/16788)，开通后，单击创建项目并下一步按钮。<br>
<img src="https://qcloudimg.tencent-cloud.cn/image/document/c0e9905f8db488e90bb03b168afb42ab.png" width="900" />

3. 在项目创建完成以后，您需要为该项目匹配一个 IM 应用，因为多人音视频房间 SDK 依赖了 IM SDK 提供的基础能力，这里创建或者管理已有的 IM 应用均可，在关联成功后，就可以领取 7天的免费体验版，用于后续的开发调试工作，当然如果您之前已经体验过，也可以直接在该页面单击 [购买正式版本](https://buy.cloud.tencent.com/vcube)。<br>
<img src="https://qcloudimg.tencent-cloud.cn/image/document/77427e4ca940924cd0bb9aefecfd8a40.png" width="900" />

4. 单击前往集成按钮，选择项目配置，查看详细的配置页面，找到 **SDKAppID 和密钥** 并记录下来，它们会在后续步骤用到，至此 **多人音视频房间 SDK 服务** 开通完成。<br>
<img src="https://qcloudimg.tencent-cloud.cn/image/document/d7495fa5c7e26ff861783916655cf9fd.png" width="900" />

### 第二步：下载源码，配置工程

1. 克隆或者直接下载此仓库源码，**欢迎 Star**，感谢~~
2. 找到并打开 `Web/example/vite-vue3-ts/src/config/basic-info-config.js` 文件。
3. 配置 `basic-info-config.js` 文件中的相关参数：
	<img src="https://qcloudimg.tencent-cloud.cn/raw/36fc2cb8a3cc8a90a02d1ab0d9e4ffb7.png" width="900">
	- SDKAPPID：默认为 0，请设置为第一步中记录下的 SDKAppID。
	- SDKSECRETKEY：默认为 ''，请设置为第一步中记录下的密钥信息。

### 第三步：运行示例

1. 确认 node 环境为 v18 版本
   ```bash
   node -v
   ```

2. 安装依赖

   ```bash
   cd TUIRoomKit/Web/example/vite-vue3-ts
   
   npm install
   ```

   > 注意<br>
   > 若在安装过程中遇到报错，请执行 `npm get registry` 检查 npm 源是否为 `https://registry.npmjs.org/`。若不是，请使用 `npm config set registry https://registry.npmjs.org/` 命令将 npm 源还原为默认设置，然后重新执行 `npm install`。

3. 开发环境运行示例工程

   ```bash
   npm run dev
   ```

### 第四步：示例体验

开发环境运行示例工程后，在浏览器中打开页面 http://localhost:3000/#/home 即可体验 TUIRoomKit 功能。

**主持人（userId：anchor）**

- 步骤1、在 home 页面，点击【创建房间】按钮；
- 步骤2、进入 TUIRoomKit 房间；

| 步骤1 | 步骤2 |
|---------|---------|
| <img src="https://qcloudimg.tencent-cloud.cn/raw/cbbbaca43e68dce6aa013010a4c1ec03.png" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/3e613a846143979cdc95518adc6c201c.png" width="320"/> |

**普通成员（userId：audience）**

- 步骤1、在 home 页面，输入主持人创建的房间 Id，点击【加入房间】按钮；
- 步骤2、加入房间；

| 步骤1 | 步骤2 |
|---------|---------|
| <img src="https://qcloudimg.tencent-cloud.cn/raw/499c87056c183d39a41efc95e9bc89ce.png" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/3e613a846143979cdc95518adc6c201c.png" width="320"/> |

### 第五步：生产环境部署
- 步骤一：打包 dist 文件

   ```bash
   npm run build
   ```
- 步骤二： 部署 dist 文件到服务器上

>! 生产环境要求使用 https 域名

<img src="https://qcloudimg.tencent-cloud.cn/raw/a9dc181dd2c9a60852a538de7c477c3e.png" width="100%"/>

## 常见问题

### Q：项目打包之后部署到测试/生产环境，无法正常使用麦克风和摄像头是什么原因呢？

A: 请检查部署的链接是否为 https 协议，出于对用户安全、隐私等问题的考虑，浏览器限制网页在 https 协议下才能正常使用 TRTC Web SDK（WebRTC）的全部功能。


## 交流&反馈

如果您在使用过程中有遇到什么问题，欢迎提交 [**issue**](https://github.com/Tencent-RTC/TUIRoomKit/issues)，或者访问 [腾讯云通信官方社群](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) 进行咨询和反馈。
