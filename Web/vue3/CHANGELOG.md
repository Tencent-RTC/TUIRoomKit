## 2023.06.20

**Feature**

- 进房前预览页面监听的 onTestMicVolume 事件抛出的数据修改为本地音量 volume, 兼容此问题需要重新安装 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 以更新依赖包 [trtc-cloud-js-sdk](https://www.npmjs.com/package/trtc-cloud-js-sdk) 的版本到 v1.0.13 以上。

## 2023.06.19

**Feature**

- Web RoomKit 支持移动端浏览器。
- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.3.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89378)。

**Bug Fixed**

- 更新进房前预览页面使用媒体测试接口，避免进房后偶现的本地音视频状态和远端不同步的问题。

## 2023.05.26

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.3.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89378)。

**Bug Fixed**

- 修复偶现的侧边栏布局下收起侧边栏并点击页面全屏时页面布局错乱问题。
- 修复偶现的用户进入房间后，远端用户屏幕分享没有自动切换到大窗口显示的问题。

## 2022.12.14


**Feature**

- 基于 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) SDK 提供的房间管理，成员管理，音视频互通，即时通信的能力，使用 vue3 开发 [多人音视频房间 (Web)](https://cloud.tencent.com/document/product/647/81959) 场景。
- [在线体验 Demo](https://web.sdk.qcloud.com/component/tuiroom/index.html)
