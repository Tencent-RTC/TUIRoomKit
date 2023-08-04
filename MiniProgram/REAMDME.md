## 简介
本 demo 演示了如何在 uni-app 项目跑通 TUIRoomKit

## 环境准备

- 微信 App iOS 最低版本要求：7.0.9
- 微信 App Android 最低版本要求：7.0.8
- 小程序基础库最低版本要求：2.10.0
- 由于小程序测试号不具备 <live-pusher> 和 <live-player> 的使用权限，请使用企业小程序账号申请相关权限进行开发
- 由于微信开发者工具不支持原生组件（即 <live-pusher> 和 <live-player> 标签），需要在真机上进行运行体验


## 快速跑通
第一步：下载源码，编译运行
1. 克隆或者直接下载此仓库源码。
   ```
   git clone https://github.com/tencentyun/TUIRoomKit.git
   ```
2. 进入 demo 目录
   ```
   cd MiniProgram/
   ```
3. 安装依赖
   ```
   npm install
   ```
4. 跑通项目
```
npm run dev:mp-weixin
//成功后执行 bash wxmini_dev.sh 进入小程序目录安装 npm 依赖
bash wxmini_dev.sh
```

5. 修改 `./MiniProgram/src/config/basic-info-config` 文件 的 SDKAPPID 以及 SECRETKEY（阅读文末 [开通服务](#2)）

6 打开微信开发者工具，导入项目 ./MiniProgram/dist/mp-weixin

7. 构建 npm，微信开发者工具【工具】->【构建 npm】。具体如下图：
   
   <img src="https://web.sdk.qcloud.com/component/trtccalling/images/miniProgram/build-npm.png" width="200" align="middle" />


## 接入指引
### 步骤一：开通小程序权限
由于 TUIRoomKit 所使用的小程序标签有更苛刻的权限要求，因此集成 TUIRoomKit 的第一步就是要开通小程序的类目和标签使用权限，**否则无法使用**，这包括如下步骤：

- 小程序推拉流标签不支持个人小程序，只支持企业类小程序。需要在 [注册](https://developers.weixin.qq.com/community/business/doc/000200772f81508894e94ec965180d) 时填写主体类型为企业，如下图所示：
   <img width="480" height="480" src="https://main.qcloudimg.com/raw/a30f04a8983066fb9fdf179229d3ee31.png">

- 小程序推拉流标签使用权限暂时只开放给有限 [类目](https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html)。
- 符合类目要求的小程序，需要在 **[微信公众平台](https://mp.weixin.qq.com/)** > **开发** > **开发管理** > **接口设置**中自助开通该组件权限，如下图所示：
  <img width="480" height="360" src="https://main.qcloudimg.com/raw/dc6d3c9102bd81443cb27b9810c8e981.png">


### 步骤二：在小程序控制台配置域名
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

[](id:2)
### 步骤三：开通服务

在使用 TUIRoomKit 发起会议前，您需要开通 TUIRoomKit 专属的多人音视频互动服务，详细步骤如下：
1. 登录 [实时音视频 TRTC 控制台](https://console.cloud.tencent.com/trtc)，单击左侧应用管理页面，找到需要开通 TUIRoomKit 的应用（SDKAppID），点击详情按钮，进入应用概览界面。


   ![](https://write-document-release-1258344699.cos.ap-guangzhou.tencentcos.cn/100027212605/d1901a01050411eead3b5254007e6a5b.png?q-sign-algorithm=sha1&q-ak=AKID9wbN-jJZsz-6fp2w-z-zTF90gANKjrXDl7QAxQUYH4l1OjeG1x4MbrUBpPgf3w-b&q-sign-time=1691150083;1691153683&q-key-time=1691150083;1691153683&q-header-list=&q-url-param-list=&q-signature=0d32ce73e705f6c4f91a3d0448db680a34934b39&x-cos-security-token=0YkwUA3rCmJvpfi8JCOKVQ5OwpdWoEQa50e8a9dd69d8cd59709afb007a373468UHHq5Y4RFyNySG5VTXntYqJ-kos3xbuzLjbb1L0nDq3RZy-YJm8zQBjyY-gR0ZGPSRgIg6v4A3cSKj3C8dsZPjElbB6U3RN5LJBH2oP5y7QQg5P3ytMUA2gHZIM492XU0OXF2fTWFNXcVfQxwueUEMAKE63b9KhB4u6_e2c07W4yVnzxf0q4db5kiX9ASBchDJnKAwBIEGFdCq2T57hK4j23ikafDYFQT39H1r2EthPW-2W4I55rZfb3QcWjK4sqy60EkyIvbE76sb4QrbZb0nEY4FkprIgZcntCaiWRJ1h0IhTUM0yE3DTcItJpsFgOG1OmVZ9efZJFXaUzoiIP4W69cBNQ3tbvRRO9L2F7Hn-VD9rhXyh_qobMUPoMrU0z)

2. 在应用概览页面找到**含 UI 低代码集成接入 **卡片，选择**多人音视频（TUIRoomKit）**，点击领取体验按钮，领取7天体验版 TUIRoomKit 进行接入测试。
   

   > **注意：**
   > 
>   - 领取体验版后仅开通 TUIRoomKit 7天的体验资格，测试过程中所产生的音视频时长等资源消耗，仍会按照实时音视频 TRTC 标准计费规则计费；
>   - 新账号首次可前往 [试用中心](https://cloud.tencent.com/act/pro/video_freetrial?from=19654) 免费领取10000分钟音视频时长；
>   - 如果所选 SDKAppID 体验版领取次数已达上限，需要购买 TUIRoomKit 包月套餐才能开通服务，请点击**场景套餐订阅**按钮或前往 [购买页](https://buy.cloud.tencent.com/trtc) 购买；


   ![](https://write-document-release-1258344699.cos.ap-guangzhou.tencentcos.cn/100027212605/d1c9960d050411ee8ec2525400c56988.png?q-sign-algorithm=sha1&q-ak=AKIDQ79WOXQhoXpcCfQZtEErLQ-8PBn5ME2kCj0-WgM1JV1R0mfosDycUA2DbFGNCiDY&q-sign-time=1691150084;1691153684&q-key-time=1691150084;1691153684&q-header-list=&q-url-param-list=&q-signature=3003445a8d6d6ed638bd6efaa4f79b7807ffed64&x-cos-security-token=EcksTM3tpFPfGd7tC6mr4ObMvYQ92Cpa135809379ecd1668cf13bcadc38f16e8-TctpyqmOHr-Dqi0Am3g2xGm7-NVlnT3Yg_SuvJg0S_wdpjNmTf0po2Sk6OPhCQWpice5ekv2_qINYUVRx_M44udV8JAnzMTDEJXZCXhY9J_6dRWJNLKgikUgqE9hGeaajILTG-wueY3NWWVGQxA74znXJZqtKQ0-QFYj2b5TqVh74YuAOnX7F5o9o_lgc2v31gNGYzaZgRr9jwUv3wYRazl6b-isU-Yqz-LLXUvrvyIXmtferm2dfpRWetV16ooA5iIJFc9WdSo3jAXJvInSTdXH4uKAkPJOcWRWAp--PbHPMF14q73p7QENcUVSyePCsa8EKfs8xI1QYUK_7Vy7P57_6i9FD86PcPwd4rUbgIh_qOgvIhnOhxRS3chvbnJ)


   ![](https://write-document-release-1258344699.cos.ap-guangzhou.tencentcos.cn/100027212605/d1c86238050411eea359525400088f3a.png?q-sign-algorithm=sha1&q-ak=AKIDqB3y5X-BJCS2fr5-GhtrfCFcifiTM6OI-4DnqKMlptGxTItOhKDHRW-H7UdHorxm&q-sign-time=1691150084;1691153684&q-key-time=1691150084;1691153684&q-header-list=&q-url-param-list=&q-signature=a54fd4d973e2b19f92e11d4a989237f0e596f8ef&x-cos-security-token=EcksTM3tpFPfGd7tC6mr4ObMvYQ92Cpaf8dd006ff97c11242ca4deb00c691c0d-TctpyqmOHr-Dqi0Am3g2xGm7-NVlnT3Yg_SuvJg0S_wdpjNmTf0po2Sk6OPhCQWpice5ekv2_qINYUVRx_M44udV8JAnzMTDEJXZCXhY9J_6dRWJNLKgikUgqE9hGeaajILTG-wueY3NWWVGQxA74znXJZqtKQ0-QFYj2b5TqVh74YuAOnX7F5o9o_lgc2vEUPwHpA7_1QsjvQEYxSKjmLZUxVwV2TVrTBtORpX9EihDahpMW2IBwnRwObClTeMMYuGd1m2m_7T69J5uR2BhuXJPBwViqv_r7S3tIfa9o1JVo7GrdHsWGYx6rqnHv1Ds6BKdHYDRtpc5cPhPcG0GiIZuHQ5Yz37kHMQUjkH0R0Tomj0kxqhmwOxABxVgcDP)

3. 领取完成后，可以看到体验版的基本信息，包括服务状态、版本信息和功能详情、到期时间。


   ![](https://write-document-release-1258344699.cos.ap-guangzhou.tencentcos.cn/100027212605/d1aa3f7a050411eea359525400088f3a.png?q-sign-algorithm=sha1&q-ak=AKIDywUsTbN07QWDFLsENn44xzFJxTaxyGYkHjwOYOvMGi_krZ8_uxgx8nYk0afVTqkY&q-sign-time=1691150084;1691153684&q-key-time=1691150084;1691153684&q-header-list=&q-url-param-list=&q-signature=0f675386e478957289fd114fb14086eec9623a40&x-cos-security-token=0YkwUA3rCmJvpfi8JCOKVQ5OwpdWoEQaf2aead6752d9ad22d4556a9396e8af34UHHq5Y4RFyNySG5VTXntYpvYphJXTK4fkWSrACSSbFIjd1Yiww0zS4N9V88Gs7V58wpCUWcu8rHuLk6dtjl0QWpM2UqXvCOC7IpsHiHoWj3qMlC5kqUvjspQlzvW73MJop6tO1qlHfAQIdFh1ro4AkDgtQ4gpO6qJ9vvpgPv_H6bwUUN69uQAcuDb6O1lFBjhTq04SER3Z_Q4my6duMtgRHRov4Tg-a_oy07KLRQ_iGhmByelRe9YTapgYiJTtrX0kmjS_bdrqLFokus8oTWzKE28ksIfLQyi18vzsxj-sSXjKTVLMZ8ybleiegEC9AbTYChXNpOkLNwWwuuEaI7DICaZaV1INJtmf70KomTccrX8Y6nqdqR1K454ZgEl7Sb)
