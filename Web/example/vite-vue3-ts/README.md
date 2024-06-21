# Quick Run of TUIRoomKit Web Demo

English | [简体中文](README.zh.md)

This document describes how to quickly run the TUIRoomKit demo project to try out group audio/video interaction. If you need to integrate TUIRoomKit into your existing business, please refer to [TUIRoomKit Integration](https://trtc.io/document/54845?platform=web&product=conference).

> Notice：<br>
> This example project integrates with the TUIRoomKit npm package [@tencentcloud/roomkit-web-vue3
](https://www.npmjs.com/package/@tencentcloud/roomkit-web-vue3). This npm package provides a pre-conference preview component, an in-conference component, and methods for starting conference, joining conference, and fine-tuning the interface. For more, see [TUIRoomKit API](https://trtc.io/document/54880?platform=web&product=conference). If these APIs don't meet your business needs, you can refer to [TUIRoomKit source code export](https://trtc.io/document/54851?platform=web&product=conference#method-2.3A-modify-the-uikit-source-code) for accessing the TUIRoomKit source code.

## Directory

```
.
├── README.md
├── README.zh.md
├── index.html
├── package.json
├── public
│   └── favicon.ico
├── src
│   ├── App.vue         -- Sample Project Main Page
│   ├── config          -- User information configuration file and test userSig generation file
│   ├── env.d.ts
│   ├── locales         -- Local language, support English, Chinese
│   ├── main.ts         -- Sample Project Entry File
│   ├── router          -- Sample Project Routing Configuration
│   ├── utils
│   └── views           -- Sample project pages (including pre-conference preview pages and in-conference page)
├── tsconfig.json
├── tsconfig.node.json
├── useRoomExtension.js
└── vite.config.ts
```

### Step 1. Create a TRTC application
1. Enter the [Application Management](https://www.tencentcloud.com/account/login) interface of the Tencent Cloud Live Audio/Video Console, select Create Application, enter the application name,click **Create Application**.
2. Find your application in the application list and Click **Application Info**.
    <img src="https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/a12607f338b311ed8088525400463ef7.png" width="900">
		
3. Follow the steps below to get the application’s `SDKAppID` and key.
    <img src="https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/a0eb96e038b311ed8088525400463ef7.png" width="900">

>! This component uses two basic PaaS services of Tencent Cloud: [TRTC](https://intl.cloud.tencent.com/document/product/647/35078) and [IM](https://intl.cloud.tencent.com/document/product/1047). When you activate TRTC, IM will be activated automatically. For information about the billing of IM, see [Pricing](https://intl.cloud.tencent.com/document/product/1047/34350).

### Step 2: Download the source code and configure the project
1. Clone or download the source code in our repository (**You can start the repository to save it**).
2. Find and open `Web/example/vite-vue3-ts/src/config/basic-info-config.js`.
3. Configure parameters in `basic-info-config.js`:

	<img src="https://qcloudimg.tencent-cloud.cn/raw/36fc2cb8a3cc8a90a02d1ab0d9e4ffb7.png" width="900">
	- SDKAPPID: 0 by default. Set it to the `SDKAppID` obtained in step 1.
	- SDKSECRETKEY: '' by default. Set it to the key obtained in step 1.

### Step 3: Run the example

1. install dependencies

   ```bash
   cd TUIRoomKit/Web/example/vite-vue3-ts
   
   npm install
   ```

2. Run the sample project in the development environment

   ```bash
   npm run dev
   ```

### Step 4. Try out the demo

Open `http://localhost:3000/#/home` in a browser to try out TUIRoomKit.

**Anchor (userId: anchor)**

- 1. On the home page, click **New Room**.
- 2. Enter a room.

| 1 | 2 |
|---------|---------|
| <img src="https://qcloudimg.tencent-cloud.cn/raw/caf8a9f6d5322ef5b07420bef0ff9f42.png" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/c3982208a81f5b0f774c5bfadc6e7b99.png" width="320"/> |

**Participant (userId: audience)**

- 1. On the home page, enter the ID of the room created by the anchor and click **Join Room**.
- 2. Enter the room.

| 1 | 2 |
|---------|---------|
| <img src="https://qcloudimg.tencent-cloud.cn/raw/6e0db32e8497c00221018a80bd7ceaab.png" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/c3982208a81f5b0f774c5bfadc6e7b99.png" width="320"/> |

### Step 5: Production Environment Deployment
- 1. Generate deployment files

   ```bash
   npm run build
   ```
- 2. Deploy the dist file to the server

>! Production environments require the use of https domains

<img src="https://qcloudimg.tencent-cloud.cn/raw/3af0ebbc654340a27ed4a2780f64e510.png" width="100%"/>

## FAQs

### I deployed the demo project in the testing/development environment. The mic and camera did not work. What should I do?

Make sure you used an HTTPS URL. For the sake of data security and privacy protection, your browser may restrict HTTP URLs. To access all features of the TRTC web SDK (WebRTC), please use an HTTPS URL.


## Other

- Welcome to join our Telegram Group to communicate with our professional engineers! We are more than happy to hear from you~
Click to join: [https://t.me/+EPk6TMZEZMM5OGY1](https://t.me/+EPk6TMZEZMM5OGY1)   
Or scan the QR code   
  <img src="https://qcloudimg.tencent-cloud.cn/raw/79cbfd13877704ff6e17f30de09002dd.jpg" width="300px">
