# TUIRoomKit 小程序 示例工程快速跑通

本文档主要介绍如何快速跑通 TUIRoomKit 示例工程，体验多人音视频互动，更详细的 TUIRoomKit 组件接入流程，请点击腾讯云官网文档：[TUIRoomKit 组件 uniapp（小程序） 接入说明](https://cloud.tencent.com/document/product/647/97754)。

## 环境准备

- 微信 App iOS 最低版本要求：7.0.9
- 微信 App Android 最低版本要求：7.0.8
- 小程序基础库最低版本要求：2.13.0
- 由于小程序测试号不具备 [live-pusher](https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html) 和 [live-player](https://developers.weixin.qq.com/miniprogram/dev/component/live-player.html) 的使用权限，请使用企业小程序账号申请相关权限进行开发（参考：[小程序权限申请](#小程序权限申请)）
- 由于微信开发者工具不支持原生组件（即 [live-pusher](https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html) 和 [live-player](https://developers.weixin.qq.com/miniprogram/dev/component/live-player.html) 标签），需要在真机上进行运行体验
- 配置项目合法域名（参考：[小程序控制台配置合法域名](#小程序控制台配置合法域名)）
## 目录结构

```
.
├── README.md
├── CHANGELOG.md
├── wxmini_dev.bat    // 对 uniapp dev 编译后的小程序进行 npm 依赖安装(Windows)
├── wxmini_prod.bat   // 对 uniapp build 编译后的小程序进行 npm 依赖安装(Windows)
├── wxmini_dev.sh    // 对 uniapp dev 编译后的小程序进行 npm 依赖安装(Mac)
├── wxmini_prod.sh   // 对 uniapp build 编译后的小程序进行 npm 依赖安装(Mac)
├── src
│   └── assets    // 示例工程静态资源
│   └── locales   // i18翻译文本相关内容
│   └── pages     // 示例主包页面
│   └── roomkit   // 示例工程分包内容
│   │   └── config   // TUIRoom 配置文件
│   │   └── pages    // 示例工程分包页面
│   │   └── TUIRoom  // TUIRoom UI 组件源文件
│   ├── router    // 自定义的 router 类
│   └── static    // sdk 资源依赖
│   ├── App.vue   // 示例工程主入口
│   ├── env.d.ts
│   ├── main.ts   // 示例工程入口文件
│   ├── manifest.json   // uniapp 配置文件
│   ├── pages.json      // uniapp 页面配置
│   ├── shime-uni.d.ts
│   ├── uni.scss
└── vite.config.ts
```

### 快速跑通

1. 下载或者克隆源码并安装依赖

   ```bash
   git clone https://github.com/tencentyun/TUIRoomKit.git
   ```
   ```bash
   cd MiniProgram/
   
   npm install
   ```

2. 开发环境运行示例工程

   ```bash
   npm run dev:mp-weixin
   ```
3. 进入小程序目录安装项目依赖
   >  **注意**：因为小程序对主包大小有限制，这里默认采用了分包方案，部分依赖需要进入编译后的目录执行 npm install 进行下载，此处将操作指令集成在 wxmini_dev.sh 脚本中，因此可以在编译完成后直接执行 bash wxmini_dev.sh 安装依赖

   **Windows：**
   ```bash
   # npm run dev:mp-weixin 编译完成后执行该指令
   ./wxmini_dev.bat
   ```
   **Mac：**
   ```bash
   # npm run dev:mp-weixin 编译完成后执行该指令
   bash wxmini_dev.sh
   ```

4. 打开微信开发者工具，导入项目 ./MiniProgram/dist/dev/mp-weixin。

5. 构建 npm，微信开发者工具【工具】->【构建 npm】。具体如下图：
   
   <img src="https://web.sdk.qcloud.com/component/trtccalling/images/miniProgram/build-npm.png" width="200" align="middle" />

6. 找到并打开 `MiniProgram/src/roomkit/config/basic-info-config.js` 文件，配置 `basic-info-config.js` 文件中的相关参数（[获取 SDKAppID 与 SDKSECRETKEY](#开通多人音视频互动服务)）：

 - SDKAPPID：默认为 0
 - SDKSECRETKEY：默认为 ''

	<img src="https://qcloudimg.tencent-cloud.cn/raw/36fc2cb8a3cc8a90a02d1ab0d9e4ffb7.png" width="900">

7. 点击 **预览**，手机扫码进入小程序。
![](https://qcloudimg.tencent-cloud.cn/raw/5e2afbb25ade4cf8e678911e6bca6101.png)

### 开通多人音视频互动服务

在使用 TUIRoomKit 发起会议前，您需要开通 TUIRoomKit 专属的多人音视频互动服务，详细步骤如下：

1. 登录 [实时音视频 TRTC 控制台](https://console.cloud.tencent.com/trtc)，单击左侧应用管理页面，找到需要开通 TUIRoomKit 的应用（SDKAppID），点击**详情**，进入应用概览界面。

   ![](https://qcloudimg.tencent-cloud.cn/image/document/9a4473f562997bd733e47c0351c485b8.png)

2. 在应用概览页面找到**含 UI 低代码集成接入 卡片，选择多人音视频（TUIRoomKit）**，点击**领取体验**，领取7天体验版 TUIRoomKit 进行接入测试。
   

   > **注意：** 
   >   - 领取体验版后仅开通 TUIRoomKit 7天的体验资格，测试过程中所产生的音视频时长等资源消耗，仍会按照实时音视频 TRTC 标准计费规则计费；
   >   - 新账号首次可前往 [试用中心](https://cloud.tencent.com/act/pro/video_freetrial?from=19654) 免费领取10000分钟音视频时长；
   >   - 如果所选 SDKAppID 体验版领取次数已达上限，需要购买 TUIRoomKit 包月套餐才能开通服务，请点击**场景套餐订阅**按钮或前往 [购买页](https://buy.cloud.tencent.com/trtc) 购买；


   ![](https://qcloudimg.tencent-cloud.cn/image/document/d26c14cb1737a5005462025bb1bad645.png)


   ![](https://qcloudimg.tencent-cloud.cn/image/document/3da16ab53e28de33212b46f429ab1fdc.png)

3. 领取完成后，可以看到体验版的基本信息，包括服务状态、版本信息和功能详情、到期时间。


   ![](https://qcloudimg.tencent-cloud.cn/image/document/587965a50a85ce617057ae8b06b609f7.png)

4. 单击**集成指南**，即可参照集成指南开始集成。至此 TUIRoomKit 服务开通完成。


   ![](https://qcloudimg.tencent-cloud.cn/image/document/588a5f1d285398143af1fd15aaef49e2.png)



### 小程序权限申请
由于 TUIRoomKit 所使用的小程序标签有更苛刻的权限要求，因此集成 TUIRoomKit 的第一步就是要开通小程序的类目和标签使用权限，**否则无法使用**，这包括如下步骤：

- 小程序推拉流标签不支持个人小程序，只支持企业类小程序。需要在 [注册](https://developers.weixin.qq.com/community/business/doc/000200772f81508894e94ec965180d) 时填写主体类型为企业，如下图所示：
   <img width="480" height="480" src="https://main.qcloudimg.com/raw/a30f04a8983066fb9fdf179229d3ee31.png">

- 小程序推拉流标签使用权限暂时只开放给有限 [类目](https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html)。
- 符合类目要求的小程序，需要在 **[微信公众平台](https://mp.weixin.qq.com/)** > **开发** > **开发管理** > **接口设置**中自助开通该组件权限，如下图所示：
  <img width="480" height="360" src="https://main.qcloudimg.com/raw/dc6d3c9102bd81443cb27b9810c8e981.png">


### 小程序控制台配置合法域名
在 **[微信公众平台](https://mp.weixin.qq.com/)** > **开发** > **开发管理** > **开发设置** > **服务器域名**中设置 **request 合法域名** 和 **socket 合法域名**，如下图所示：
- **request 合法域名**：
```javascript
https://official.opensso.tencent-cloud.com
https://yun.tim.qq.com
https://cloud.tencent.com
https://webim.tim.qq.com
https://query.tencent-cloud.com
https://web.sdk.qcloud.com
```
- **socket 合法域名**：
```javascript
wss://wss.im.qcloud.com
wss://wss.tim.qq.com
```
<img width="480" height="360" src="https://qcloudimg.tencent-cloud.cn/raw/a79ca9726309bb1fdabb9ef8961ce147.png">

### 联系我们

如果您在接入或使用过程中有任何需要或者反馈，欢迎加入 [TUIRoomKit 技术交流群](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) 进行技术交流和问题反馈。





