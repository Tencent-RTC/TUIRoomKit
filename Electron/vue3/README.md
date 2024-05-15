# Quick Run of TUIRoom Electron Demo

English | [简体中文](README.zh.md)

This document mainly introduces how to quickly run through the TUIRoomKit Electron sample project, experience multi-person audio and video interaction, more detailed TUIRoomKit Electron component access process, please click on the Tencent Cloud official website documentation!：[TUIRoomKit component Electron access instructions](https://cloud.tencent.com/document/product/647/84238)...


## Directory structure

```
.
├── dist                      After the build, the packages directory is used to generate the
|   ├── main
|   ├── preload
|   └── renderer
|
├── scripts
|   ├── build.mjs             Project Development Scripts npm run build
|   └── watch.mjs             Project development scripts npm run dev
|
├── packages
|   ├── main                  Master process source code
|   |   |── vite.config.ts
|   |   └── index.ts
|   ├── preload               Preloaded script source code
|   |   ├── vite.config.ts
|   |   ├── index.ts
|   |   ├── loading.ts
|   |   └── utils.ts
|   └── renderer              Rendering process source code
|       ├── auto-imports.d.ts
|       ├── components.d.ts
|       ├── tsconfig.json
|       ├── index.html
|       ├── src
│       |   ├── App.vue   // Sample Project Main Page
│       |   ├── TUIRoom   // TUIRoom UI component source files
│       |   ├── assets    // Public resources
│       |   ├── config    // TUIRoom Configuration File
│       |   ├── env.d.ts
│       |   ├── main.ts   // Sample Project Entry File
│       |   ├── router    // Sample Project Routing Configuration
│       |   └── views     // Sample Project Routing Page
|       └── vite.config.ts
```
### Step 1. Create a TRTC application
1. Enter the [Application Management](https://www.tencentcloud.com/account/login) interface of the Tencent Cloud Live Audio/Video Console, select Create Application, enter the application name,click **Create Application**.
2. Find your application in the application list and Click **Application Info**.
    <img src="https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/a12607f338b311ed8088525400463ef7.png" width="900">
		
3. Follow the steps below to get the application’s `SDKAppID` and key.
    <img src="https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/a0eb96e038b311ed8088525400463ef7.png" width="900">

>! This component uses two basic PaaS services of Tencent Cloud: [TRTC](https://intl.cloud.tencent.com/document/product/647/35078) and [IM](https://intl.cloud.tencent.com/document/product/1047). When you activate TRTC, IM will be activated automatically. For information about the billing of IM, see [Pricing](https://intl.cloud.tencent.com/document/product/1047/34350).

### Step 2: Download the source code and configure the project
1. Clone or download the repository source code directly，**Welcome Star**，Thanks~~
2. Find and open ` Electron/vue3/packages/renderer/src/config/basic-info-config.js` file。
3. Configure `basic-info-config.js` Relevant parameters in the document：
	<img src="https://qcloudimg.tencent-cloud.cn/raw/36fc2cb8a3cc8a90a02d1ab0d9e4ffb7.png" width="900">
	- SDKAPPID：The default is 0. Please set it to the SDKAppID recorded in step one.
	- SDKSECRETKEY：The default is ‘’, please set it to the key information recorded in step one.

### Step 3: Run the example

1. Installation of dependencies

   ```bash
   cd TUIRoomKit/Electron/vue3
   
   npm install
   ```

    > **Note**
    >
    > If the dependency installation process is slow or there is a network timeout error, such as ‘ERR_SOCKET_TIMEOUT’ or ‘Error: Socket timeout’, you can set the nearest npm library mirror and the Electron download mirrors, in mainland China, you can create a .npmrc file in the root directory of your project, and add the following mirror settings to the file.
    > ```
    > registry=https://registry.npmmirror.com
    > ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
    > ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
    > ```

2. Development environment to run the sample project

   ```bash
   npm run dev
   ```


3. Build the installer, run
   - Builds an installer that matches the CPU type of the current machine. Suitable for Windows and Mac operating systems.

   ```bash
   npm run build                 // Build mac single-architecture packages, windows packages 
   npm run build:mac-universal   // Building mac dual-architecture packages
   ```
   > Note: The built installer is located in the release directory. By default, you can only build Mac installers using Mac computers, and Windows installers using Windows computers.


### Step 4: Sample Experience

After running the sample project in the development environment, you can experience TUIRoomKit features directly.

Note: Because TUIRoomKit introduces element-plus component on-demand, it will lead to slower response when the development environment routing page is loaded for the first time, wait for element-plus to finish loading on-demand and then you can use it normally. element-plus on-demand will not affect the loading of the packaged page after it is loaded.

Tips: To experience the full functionality of TUIRoomKit, at least two users with different userIds are required. You will need to configure the TUIRoomKit sample project and run the code on both devices as described in step two:

**Host（userId：anchor）**
- Step 1: On the home page, click the [Create Room] button;
- Step 2: Enter the TUIRoom room;

| Step 1 | Step 2 |
|---------|---------|
| <img src="https://qcloudimg.tencent-cloud.cn/raw/caf8a9f6d5322ef5b07420bef0ff9f42.png" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/c3982208a81f5b0f774c5bfadc6e7b99.png" width="320"/> |

**Member（userId：audience）**

- Step 1: On the home page, enter the Room Id created by the host and click the [Join Room] button;
- Step 2: Join the room;

| Step 1 | Step 2 |
|---------|---------|
| <img src="https://qcloudimg.tencent-cloud.cn/raw/6e0db32e8497c00221018a80bd7ceaab.png" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/c3982208a81f5b0f774c5bfadc6e7b99.png" width="320"/> |

## Other

- Welcome to join our Telegram Group to communicate with our professional engineers! We are more than happy to hear from you~
Click to join: [https://t.me/+EPk6TMZEZMM5OGY1](https://t.me/+EPk6TMZEZMM5OGY1)   
Or scan the QR code   
  <img src="https://qcloudimg.tencent-cloud.cn/raw/79cbfd13877704ff6e17f30de09002dd.jpg" width="300px">    
