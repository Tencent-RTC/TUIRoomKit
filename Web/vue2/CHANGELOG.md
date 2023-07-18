## 2023.07.18

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