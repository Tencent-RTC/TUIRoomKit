## 2023.11.14@1.6.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.6.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；
- 全新 UI 界面；
- 新增观众端的查看成员列表功能；
- 调整更多组件内容，移除 QQ 群，新增中文环境下知了社群跳转按钮，支持跳转到知了社群页面；

**Bug Fixed**

- 修改举手发言房间名称为上台发言房间；
- 修复 onChangeEvent 重复触发；
- 修复 Message、MessageBox 和 Badge 组件的展示问题；
- 修复 Dialog、Setting 和 Message 边框阴影的问题；
- 修复结束按钮间距问题；

## 2023.10.26@1.6.0

**Feature**
- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.6.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 升级 chat sdk 至 v3 版本。

## 2023.09.25@1.5.1

**Feature**
- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.5.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 优化平滑开关麦克风操作

**Bug Fixed**
- 修复举手发言模式下，主持人重新进入房间后没有自动上麦的问题；
- 修复举手发言模式下，主持人侧举手发言列表不是按照举手顺序排列的问题；
- 修复 Electron 端下拉框 hover UI 错误问题；
- 修复聊天未读数不居中问题；

## 2023.09.07@1.5.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.5.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89380)。
- 优化远端用户退房或关闭视频流时，本地视频布局变更逻辑，优化交互体验。

**Bug Fixed**
- 修复 Windows 下 WPS 全屏分享异常问题。
- 修复 Electron 下，大画面显示的用户直接退房时，观看端因视频显示切换异常，导致大画面显示黑屏问题。
- 修复顶部栏布局下，新增用户视频流播放黑屏的问题。

## 2023.08.28@1.4.6

**Feature**

- 升级 [@tencentyun/TUIRoomKit/Electron](https://github.com/tencentyun/TUIRoomKit) 到 v1.4.6 版本。

- 修复邀请链接错误的问题。
- 新增屏幕分享中禁止他人进行屏幕分享。

## 2023.08.17@1.4.5

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.4.5 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89380)。

## 2023.08.09@1.4.4

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.4.4 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89380)。

## 2023.08.02@1.4.3

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.4.3 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89380)。

- 新增本地日志优化，移除冗余信息，增加时间戳打印；

## 2023.07.18@1.4.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.4.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89380)。

**Bug Fixed**
- 新增视频可视区域渲染功能；
- 新增多节点渲染功能；
- 新增大小流功能；
- 修复web转让房主给electron， electron端解散房间后台报错的问题；
- 修复反馈安装后第一次启动，创建房间弹窗提示错误，重启后正常的问题；
- 修复麦克风按钮为禁用，单击无反应的问题；
- 修复主持人并没有禁言所有人，但是用户被禁言的问题；
- 修复聊天界面有有 “加载更多” 不合理的文案的问题； 
- 修复点击左上角的切换皮肤按钮，本地视频画面的大小发生变化，偏差几个像素的问题；
- 修复windows屏幕分享窗口列表被拉伸的问题；
- 修复进房后摄像头打不开的问题；
- 修复windows下屏幕分享窗口里没有最小化窗口的问题；
- 修复首次安装后，点击自由创建房间，没反应的问题；
- 修复默认头像加载失败的问题；
- 修复结束房间后，视频预览无法渲染的问题；
- 修复进房后左下角userInfo区域浮动的问题；
- 修复远端用户未开启大小流，本地拉取该用户大小流时，SDK 默认拉大流，但是本地显示黑屏的问题；
- 修复屏幕分享从切换另外一个人后，部分观众观看屏幕分享黑屏的问题。

**Bug Fixed**

- 修复拉 chat 消息时向上滑动会预加载消息列表, 避免出现【加载更多字样】的问题；
- 修复偶现的用户进入房间后，远端用户屏幕分享没有自动切换到大窗口显示的问题；
- 修复屏幕分享时，最小化窗口预览尺寸被拉伸的问题；
- trtc-electron-sdk 升级至 11.3.502-beta.2 修复如下问题：
  - 规避 mac 链接 iphone 麦克风自动切换
  - 优化 mac 启动 system loopback 失败率高问题。
  - 解决 mac 分享窗口，上行帧率为零问题



## 2023.05.26@1.3.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.3.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89380)。

**Bug Fixed**

- 修复偶现的侧边栏布局下收起侧边栏并点击页面全屏时页面布局错乱问题。
- 修复偶现的用户进入房间后，远端用户屏幕分享没有自动切换到大窗口显示的问题。
