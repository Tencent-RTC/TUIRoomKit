## 2023.09.07@1.5.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.5.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89378)。
- 优化手机浏览器中，结束会议退出时，增加一个暗灰色背景蒙层。
- 优化手机浏览器中，远端用户结束屏幕分享时，视频分页显示。
- 优化手机浏览器中，房间页面 header 栏显示。
- 优化手机浏览器中，弹框展示和交互。
- 优化远端用户退房或关闭视频流时，本地视频布局变更逻辑，优化交互体验。

**Bug Fixed**
- 修复桌面浏览器中，大画面显示的用户直接退房时，观看端因视频显示切换异常，导致大画面显示黑屏问题。
- 修复顶部栏布局下，新增用户视频流播放黑屏的问题。
- 修复手机浏览器中，在画面全屏状态下，收不到房主邀请开启麦克风和摄像的权限弹窗问题。
- 修复举手发言房间进房，非默认打开摄像头进房打开摄像头时，使用的摄像头与设备列表中选择的摄像头不一致的问题。

## 2023.08.17@1.4.5

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.4.5 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89378)。

## 2023.08.09@1.4.4

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.4.4 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89378)。

## 2023.08.02@1.4.3

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.4.3 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89378)。
- 拉 chat 消息时向上滑动会预加载消息列表, 避免出现【加载更多字样】。
- 当房间中有人在屏幕分享时，阻止新的屏幕分享。

## 2023.07.18@1.4.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.4.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89378)。
- 支持仅播放可视区域视频流，降低下行带宽消耗。
- 支持大小流能力，当播放超过 5 个远端流时，小窗口区域自动播放远端用户的小流视频。
- 优化移动端浏览器举手发言列表的样式。

**Bug Fixed**

- 修复举手发言模式下转移主持人给麦下用户，该用户无法进行媒体操作的问题。
- onKickedOutOfRoom 事件细分被踢出房的原因。
- 修复头像图片资源无法加载时使用默认头像。
- 修复移交主持人时出现多个提示的问题。

## 2023.06.20@1.4.0

**Feature**

- 进房前预览页面监听的 onTestMicVolume 事件抛出的数据修改为本地音量 volume, 兼容此问题需要重新安装 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 以更新依赖包 [trtc-cloud-js-sdk](https://www.npmjs.com/package/trtc-cloud-js-sdk) 的版本到 v1.0.13 以上。

## 2023.06.19@1.3.1

**Feature**

- Web RoomKit 支持移动端浏览器。
- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.3.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89378)。

**Bug Fixed**

- 更新进房前预览页面使用媒体测试接口，避免进房后偶现的本地音视频状态和远端不同步的问题。

## 2023.05.26@1.3.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.3.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89378)。

**Bug Fixed**

- 修复偶现的侧边栏布局下收起侧边栏并点击页面全屏时页面布局错乱问题。
- 修复偶现的用户进入房间后，远端用户屏幕分享没有自动切换到大窗口显示的问题。

## 2022.12.14@1.0.0


**Feature**

- 基于 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) SDK 提供的房间管理，成员管理，音视频互通，即时通信的能力，使用 vue3 开发 [多人音视频房间 (Web)](https://cloud.tencent.com/document/product/647/81959) 场景。
- [在线体验 Demo](https://web.sdk.qcloud.com/component/tuiroom/index.html)
