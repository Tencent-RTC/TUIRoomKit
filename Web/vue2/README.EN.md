# Quick Run of TUIRoom Web Demo

_English | [简体中文](README.md)_

This document describes how to quickly run the TUIRoom demo project to try out group audio/video interaction. 
## Directory structure

```
.
├── README.md
├── public
├── src
│   ├── App.vue  // main page of the sample project
│   ├── TUIRoom  // TUIRoom UI component source files
│   ├── config   // TUIRoom configuration file
│   ├── main.ts  // Example project entry file
│   ├── router          // Example project routing configuration
│   ├── shims-tsx.d.ts
│   ├── shims-vue.d.ts
│   └── views           // Example project routing page
├── tsconfig.json
└── vue.config.js   // vue configuration file
```

### Step 1. Activate the service
1. Please refer to the official documentation at [Integration (TUIRoomKit)](https://trtc.io/document/54845) to obtain your own SDKAppID and SDKSecreKey.

### Step 2: Download the source code and configure the project
1. Clone or download the source code in our repository (**You can start the repository to save it**).
2. Find and open `Web/vue2/src/config/basic-info-config.js`.

3. Configure parameters in `basic-info-config.js`:
	<img src="../../Preview/test-user-sig-web.png" width="900">
	
	- SDKAPPID: 0 by default. Set it to the `SDKAppID` obtained in step 1.
	- SECRETKEY: '' by default. Set it to the key obtained in step 1.

### Step 3: Run the example

1. install dependencies

   ```bash
   cd TUIRoomKit/Web/vue2
   
   npm install
   ```

2. Run the sample project in the development environment

   ```bash
   npm run serve
   ```

3. Generate the dist folder

   ```bash
   npm run build
   ```
### Step 4. Try out the demo

Open `http://localhost:8080/#/home` in a browser to try out TUIRoom.

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
- 1. Generate the dist folder

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
