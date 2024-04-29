## 2024.04.29@2.3.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v2.3.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；

**Bug Fixed**
- 修复小程序入会时间展示不全的问题;
- 修复小程序上台提示信息出现换行的问题;
- 修复小程序成员管理列表无法滚动问题;
- 修复小程序创建房间后，点击左上角 home 按钮回到主页，再次新建的房间异常;
- 修复小程序转交房主之后 icon 无法切换的问题;
- 修复获取主持人和管理员身份后没有更新申请上麦列表的问题;
- 修复聊天消息未读数不准确的问题;
- 修复 Notification 组件收到其他成员处理事件时显隐展示的问题;
- 修复转交房主或管理员状态下多次点击麦克风和摄像头按钮 disable 状态错误的问题。

## 2024.04.08@2.2.2

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v2.2.2 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；

**Improvement**
- 优化 onKickedOffLine 回调时清理资源并执行 TRTC 退房操作;

**Bug Fixed**
- 修复结束屏幕分享摄像头视频流状态异常;
- 修复收不到 onKickedOffLine 回调;
- 修复主动调用 logout 退房逻辑异常问题;
- 修复 isMobile 状态异常问题;

## 2024.03.22@2.2.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v2.2.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；

**Improvement**
- 更新聊天组件表情包资源;
- 优化上台发言房间 UI;

**Bug Fixed**
- 修复上台发言模式下，普通成员成为新房主，不能处理之前旧房主未处理的上台申请的问题;
- 修复切换前后置摄像头不生效的问题;
- 修复上台发言模式二次上台无法打开麦克风的问题;
- 修复自己发送消息不会跳转到最新的问题；

## 2024.02.29@2.1.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v2.1.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；

**Improvement**
- 新增邀请/举手超时处理以及上麦人数超过 20 个限制处理;
- 优化主持人/管理员重复进行全体静音/禁画的交互体验;
- 优化登录逻辑;
- 新增获取上麦请求列表接口 (getSeatApplicationList), 新增信令被处理回调 (onRequestProcessed), 优化主持人和多管理员处理上台申请逻辑;
- 新增主持人/管理员发送 邀请上台/上麦申请 的 60 秒超时, 普通成员超时未处理弹窗自动消失;

**Bug Fixed**
- 修复时机问题导致的 trtc 角色未切换问题, 调整 getSeatList 与 takeSeat 的调用顺序;
- 修复进会人数拉取不准确的问题;
- 修复创建举手发言房间后不能默认打开摄像头和麦克风的问题;
- 修复 @tencentcloud/tuiroom-engine-wx 版本与 kit 版本不匹配问题;

## 2024.02.02@2.0.3

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v2.0.3 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；

**Improvement**
- 优化转交主持人，同意/拒绝上台，请求打开摄像头/麦克风的 toast 展示时机及文案提示；

**Bug Fixed**
- 修复管理员被撤销后的音视频状态错误问题；
- 修复普通成员被禁言后未同步给其他管理员的问题；
- 小程序端不再展示 scheme 邀请链接；
- 完善 uniapp 打包小程序的拷贝脚本；

## 2024.01.29@2.0.2

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v2.0.2 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；
- 转交房主新增 Dialog 确认框。

**Bug Fixed**

- 修复移动端小程序 IOS 设备中部分 icon 展示模糊的问题。
- 修复将远端用户踢出房间后 Dialog 未消失的问题。
- 修复房主 && 管理员端在上台发言模式下远端用户未上台不展示离开房间选项的问题。
- 修复举手申请处理端 Toast 展示无法区分角色的问题。
- 修复全体静音/取消全体静音 && 全体禁画/取消全体禁画 Toast 无法通知到所有成员的问题。

## 2024.01.19@2.0.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v2.0.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；
- 被撤销管理员增加相关提示&&视频流区域增加管理员icon.

**Bug Fixed**
- 发送信令无操作处理时，增加消息提示。
- 上台发言房间打开邀请摄像头/麦克风文案显示优先级。

## 2024.01.12@2.0.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v2.0.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。

**Bug Fixed**
- 修复小程序头像加载错误没有使用默认头像。
- 修复小程序端上麦关闭摄像头麦克风其它端无法在麦位列表看到小程序用户。
- 修复管理员请求打开摄像头的时候，后面几次没有toast提示。
- 修复英文模式部分文案。

## 2024.01.11@1.7.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-wx](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-wx) 到 v1.7.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 支持设置管理员角色。
- 优化小程序接口调用逻辑，增加异步任务状态机，提高了推拉流稳定性。

**Bug Fixed**
- 修复成员被踢出房间时，偶现 dialog 弹框卡住问题。
- 修复移动端小程序上台申请列表样式问题。
- 修复移动端小程序有远端屏幕分享时，会多显示一页视频问题。
- 优化 README.md 文件，简化代码跑通流程。
- 修复移动端小程序举手管理列表中点击全体同意 & 全体拒绝按钮没有响应的问题。
- 修复移动端小程序举手发言模式成员管理中，房主针对普通观众操作菜单展示问题。
- 修复windows 无 bash 环境执行 wxmini_dev.sh 报错，提供 windows 脚本 wxmini_dev.bat。

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
