## 2023.01.11@1.7.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v1.7.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 支持设置管理员角色。

**Bug Fixed**
- 修复成员被踢出房间时，偶现 dialog 弹框卡住问题。
- 修复移动端小程序上台申请列表样式问题。
- 修复移动端小程序有远端屏幕分享时，会多显示一页视频问题。
- 优化 README.md 文件，简化代码跑通流程。
- 修复移动端小程序举手管理列表中点击全体同意 & 全体拒绝按钮没有响应的问题。
- 修复移动端小程序举手发言模式成员管理中，房主针对普通观众操作菜单展示问题。

## 2023.12.18@1.7.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v1.7.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；
- 新增会中移交主持人功能。
- 新增结束会议及踢出房间确认弹窗。
- 小程序新增视频流懒加载功能。
- 主持人邀请成员开启视频、麦克风增加消息提示。
- 移交主持人新增错误信息提示。
- 优化退房性能。

**Bug Fixed**

- 修复默认头像在小程序无法加载的问题。
- 修复观众端禁止文字聊天区域的展示交互。
- 修复上台发言模式下，第二次上麦打不开麦克风问题。
- 修复被踢出房间 live-pusher 被提前销毁问题。
- 修复小程序成员列表功能点击失效问题。
- 修复设备测试区域，切换扬声器和播放设备不生效的问题。
- 修复移动端小程序镜像设置设置不生效问题。
- 修复移动端小程序成员管理，操作最后一个成员时，样式异常问题。
- 修复移动端小程序下 dialog 文案及字体颜色错误问题。
- 修复移动端小程序点击新的成员管理弹窗，旧弹窗不会被关闭问题。
- 修复小程序收不到 IM 加入群组事件，无法展示 userName 及无法正常移交主持人问题。
- 修复会中切换前后置摄像头，然后关闭摄像头后再打开，前后置摄像头状态显示错误问题。
- 修复小程序首次渲染偶现黑屏问题。
- 增加小程序回退图标按钮区域大小，修复手指点击无响应问题。

## 2023.11.14@1.6.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v1.6.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；
- 新增支持切换黑白主题，更改 svg 的引入方式；

**Bug Fixed**

- 修改举手发言房间名称为上台发言房间；
- 修复 Message、MessageBox 和 Badge 组件的展示问题；
- 修复小程序复制 icon 丢失的问题；
- 修复小程序房间号为空时，未拦截进房问题；

## 2023.10.26@1.6.0

**Feature**
- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.6.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 升级 chat sdk 至 v3 版本。

**Bug Fixed**
- 修复聊天未读数气泡过大问题；
- 修复 RoomInfo 动画抖动问题；
- 修复 chat 模块消息位置显示异常问题；
- 修复转交主持人列表不能滑动问题；
- 修复 userName 过长导致成员管理中音视频状态 icon 错位问题；
- 修复麦克风音量条以及音量高亮区域显示问题；

## 2023.09.25@1.5.1

**Feature**
- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v1.5.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 优化平滑开关麦克风操作

**Bug Fixed**
- 修复举手发言模式下，主持人重新进入房间后没有自动上麦的问题；
- 修复举手发言模式下，主持人侧举手发言列表不是按照举手顺序排列的问题；
- 修复手机浏览器中，上下操作栏收起时，通知 dialog 不显示的问题；
- 修复邀请成员和联系他人的字体不一致问题；
- 修复聊天未读数不居中问题；

## 2023.09.07@Version 1.5.0

**Feature**

- 优化样式细节与 UI 交互

**Bug Fixed**

- 修复偶现推流异常
- 修复不同设备样式兼容问题

## 2023.08.28@Version 1.0.0

**Feature**

- roomkit 支持微信小程序端（使用 uniapp 框架打包到微信小程序，默认使用分包方案）