# Quick Run of TUIRoom Web Demo

_English | [简体中文](README.md)_

This document describes how to quickly run the TUIRoom demo project to try out group audio/video interaction. For more information on the TUIRoomKit component connection process, **[Integrating TUIRoomKit (Web)](https://trtc.io/document/54845)**.


> [!IMPORTANT]
> The commercial version of TRTC Conference (TUIRoomKit) is coming soon. Please contact us to get a free trial of the powerful features of the commercial SDK (version 2.0). <br>
The default download on GitHub is the 2.0 version SDK. You need to contact us through the following method to activate its use:<br>
·Send an email to: chaooliang@tencent.com, please be sure to include the SDKAPPID in your email, so we can quickly respond and activate it for you.(Recommended for a quick response)<br>
·Join the Telegram group: https://t.me/+EPk6TMZEZMM5OGY1?s_url=https%3A%2F%2Ftrtc.io.

## Directory structure

```
.
├── README.md
├── auto-imports.d.ts
├── components.d.ts
├── index.html
├─ src
│ ├─ App.vue // main page of the sample project
│ ├── TUIRoom // TUIRoom UI component source files
│ ├── assets // public resources
│ ├── config // TUIRoom configuration file
│ ├── env.d.ts
│ ├── main.ts // Example project entry file
│ ├── router // Example project routing configuration
│ └── views // Example project routing page
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
2. Find and open `Web/vue3/src/config/basic-info-config.js`.
3. Configure parameters in `basic-info-config.js`:

	<img src="https://qcloudimg.tencent-cloud.cn/raw/d05a18af04758e352f9afcb0925d105c.png" width="900">
	- SDKAPPID: 0 by default. Set it to the `SDKAppID` obtained in step 1.
	- SECRETKEY: '' by default. Set it to the key obtained in step 1.

### Step 3: Run the example

1. install dependencies

   ```bash
   cd TUIRoomKit/Web/vue3
   
   npm install
   ```

2. Run the sample project in the development environment

   ```bash
   npm run dev
   ```

3. Generate a DIST file

   ```bash
   npm run build
   ```
### Step 4. Try out the demo

Open `http://localhost:3000/#/home` in a browser to try out TUIRoom.

Because Element Plus components are imported manually, it may take a relatively long time for the page to load in the development environment for the first time. This will not be an issue after building.

**Anchor (userId: anchor)**

- 1. On the home page, click **New Room**.
- 2. Enter a room.

| 1 | 2 |
|---------|---------|
| <img src="https://web.sdk.qcloud.com/component/tuiroom/assets/home-create-en.png" width="320"/> | <img src="https://web.sdk.qcloud.com/component/tuiroom/assets/page-room-en.png" width="320"/> |

**Participant (userId: audience)**

- 1. On the home page, enter the ID of the room created by the anchor and click **Join Room**.
- 2. Enter the room.

| 1 | 2 |
|---------|---------|
| <img src="https://web.sdk.qcloud.com/component/tuiroom/assets/home-join-en.png" width="320"/> | <img src="https://web.sdk.qcloud.com/component/tuiroom/assets/page-room-en.png" width="320"/> |

### Step 5: Production Environment Deployment
- 1. Generate a DIST file

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
