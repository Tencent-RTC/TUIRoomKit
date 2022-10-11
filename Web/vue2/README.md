# TUIRoom Web sample project quick run-through

_English | [简体中文](README.zh.md)_

This document mainly introduces how to quickly run through the TUIRoom sample project to experience multiplayer audio and video interaction, for more detailed access process of TUIRoom components, please click the Tencent Cloud official website document: [TUIRoom component Web access instructions](https://www.tencentcloud.com/document/product/647/47636)

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
### Step 1: Create the TRTC application

1. Enter the [Application Management](https://www.tencentcloud.com/account/login) interface of the Tencent Cloud Live Audio/Video Console, select Create Application, enter the application name,click **Create Application**.
2. Click on the corresponding application entry and **Application Information**, as shown in the following image.
    <img src="https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/a12607f338b311ed8088525400463ef7.png" width="900">
3. Once in the application information, record the SDKAppID and key as shown below.
    <img src="https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/a0eb96e038b311ed8088525400463ef7.png" width="900">

>! This function uses both Tencent Cloud [Real-time Audio and Video TRTC](https://www.tencentcloud.com/document/product/647/35078) and [Instant Messaging IM](https://www.tencentcloud.com/document/product/1047) two basic PaaS services, and the instant messaging IM service will be opened simultaneously after real-time audio and video is opened. IM is a value-added service, please refer to [IM Price Description](https://www.tencentcloud.com/document/product/1047/34350) for detailed billing rules.

### Step 2: Download the source code and configure the project
1. Clone or download this repository source code directly, **Welcome Star**, thanks~~
2. find and open the ` Web/vue2/src/config/basic-info-config.js` file.
3. Configure the relevant parameters in the `basic-info-config.js` file.
	<img src="https://qcloudimg.tencent-cloud.cn/raw/d05a18af04758e352f9afcb0925d105c.png" width="900">
	- SDKAPPID: default is 0, please set it to the SDKAppID recorded in step 1.
	- SECRETKEY: default is '', please set it to the key information recorded in step 1.

### Step 3: Run the example

1. install dependencies

   ```bash
   cd TUIRoom/Web/vue2
   
   npm install
   ```

2. Run the sample project in the development environment

   ```bash
   npm run serve
   ```

3. package the dist file

   ```bash
   npm run build
   ```
### Step 4: Sample experience

After the development environment runs the sample project, open the page http://localhost:8080/#/home in the browser to experience the TUIRoom functionality.

**Moderator (userId:anchor)**

- Step 1: In the home page, click the [Create Room] button.
- Step 2. enter the TUIRoom room.

| Step 1 | Step 2 |
|---------|---------|
| <img src="https://qcloudimg.tencent-cloud.cn/raw/4eb4ddf45906edf9d2bf3f604531653f.jpg" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/0148dda4945ec2b4adf277fde30c0ff8.jpg" width="320"/> |

**General member (userId: audience)**

- Step 1. On the home page, enter the room Id created by the host and click the [Join Room] button.
- Step 2. join the room.

| Step 1 | Step 2 |
|---------|---------|
| <img src="https://qcloudimg.tencent-cloud.cn/raw/35a7890d45ef7decd8b3e439e51d753b.jpg" width="320"/> | <img src="https://qcloudimg.tencent-cloud.cn/raw/0148dda4945ec2b4adf277fde30c0ff8.jpg" width="320"/> |
## Frequently Asked Questions

### Q: What is the reason why the microphone and camera are not working properly after the project is packaged and deployed to the test/production environment?

A: Please check if the deployment link is https protocol, for user security, privacy and other issues, the browser restricts the web page under https protocol to use all the functions of TRTC Web SDK (WebRTC) normally.


## Other

- Welcome to join our Telegram Group to communicate with our professional engineers! We are more than happy to hear from you~
Click to join: [https://t.me/+EPk6TMZEZMM5OGY1](https://t.me/+EPk6TMZEZMM5OGY1)   
Or scan the QR code   
  <img src="https://qcloudimg.tencent-cloud.cn/raw/79cbfd13877704ff6e17f30de09002dd.jpg" width="300px">    
