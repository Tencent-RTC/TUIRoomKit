## 2024.04.08@2.2.2

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v2.2.2 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；

**Improvement**
- 优化 onKickedOffLine 回调时清理资源并执行 TRTC 退房操作;

**Bug Fixed**
- 修复结束屏幕分享摄像头视频流状态异常;
- 修复收不到 onKickedOffLine 回调;
- 修复主动调用 logout 退房逻辑异常问题;
- 修复 isMobile 状态异常问题;
- 修复邀请上台和下台 dialog 组件显示问题;

## 2024.03.22@2.2.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v2.2.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；

**Improvement**
- 新增网络状态组件;
- 更新聊天组件表情包资源;
- 优化上台发言房间 UI

**Bug Fixed**
- 修复上台发言模式下，普通成员成为新房主，不能处理之前旧房主未处理的上台申请的问题;
- 修复进房前音量条不显示的问题;
- 修复上台发言模式二次上台无法打开麦克风的问题;

## 2024.02.29@2.1.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v2.1.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；

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

## 2024.02.02@2.0.3

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) v2.0.3 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；

**Improvement**
- 优化转交主持人，同意/拒绝上台，请求打开摄像头/麦克风的 toast 展示时机及文案提示；

**Bug Fixed**
- 修复管理员被撤销后的音视频状态错误问题；
- 修复普通成员被禁言后未同步给其他管理员的问题；
- 修复 electron 环境判断不准确的问题；

## 2024.01.29@2.0.2

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v2.0.2 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；
- 转交房主新增 Dialog 确认框。

**Bug Fixed**

- 修复将远端用户踢出房间后 Dialog 未消失的问题。
- 修复房主 && 管理员端在上台发言模式下远端用户未上台不展示离开房间选项的问题。
- 修复举手申请处理端 Toast 展示无法区分角色的问题。
- 修复全体静音/取消全体静音 && 全体禁画/取消全体禁画 Toast 无法通知到所有成员的问题。

## 2024.01.19@2.0.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v2.0.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；
- 被撤销管理员增加相关提示&&视频流区域增加管理员icon.

**Bug Fixed**
- 发送信令无操作处理时，增加消息提示。
- 上台发言房间打开邀请摄像头/麦克风文案显示优先级。
- 更正英文模式下 “退出全屏”文案。

## 2024.01.12@2.0.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v2.0.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。

**Bug Fixed**
- 修复管理员请求打开摄像头的时候，后面几次没有toast提示。
- 修复英文模式部分文案。
- 修复修复麦上用户刷新页面或异常退出等情况回到 room 房间需要重新上麦的问题。

## 2024.01.11@1.7.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.7.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 支持设置管理员角色。

**Bug Fixed**
- 修复最新版 vue3 + vite 脚手架项目中，集成本项目后，字体展示问题。
- 修复成员被踢出房间时，偶现 dialog 弹框卡住问题。
- 修复视频九宫格视图，翻页后切换到侧边栏，有用户离开会导致页面流窗口消失问题。
- 修复 home 页面偶现的视频已出现但是 loading icon 还在显示的问题。

## 2023.12.18@1.7.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.7.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 新增会中移交主持人功能。
- 新增结束会议及踢出房间确认弹窗。
- 输入房间号后，支持按回车键进房。
- 主持人邀请成员开启视频、麦克风增加消息提示。
- 移交主持人新增错误信息提示。
- 优化退房性能。

**Bug Fixed**

- 修复上台发言模式下，屏幕分享状态错误问题。
- 修复侧边栏模式下，收起侧边栏并点击全屏按钮，导致的布局错误问题。
- 修复观众端禁止文字聊天区域的展示交互。
- 修复偶现拉不到进房前历史消息问题。
- 修复上台发言模式下，举手申请 tab 状态错误问题。
- 修复上台发言模式下，第二次上麦打不开麦克风问题。
- 修复九宫格布局，左右翻页按钮显示不明显问题。
- 修复设备测试区域，切换扬声器和播放设备不生效的问题。


## 2023.11.14@1.6.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.6.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 新增观众端的查看成员列表功能；
- 调整更多组件内容，移除 QQ 群，新增中文环境下知了社群跳转按钮，支持跳转到知了社群页面

**Bug Fixed**

- 修改举手发言房间名称为上台发言房间；
- 修复 onChangeEvent 重复触发；
- 修复 Message、MessageBox 和 Badge 组件的展示问题；
- 修复 Dialog、Setting 和 Message 边框阴影的问题；
- 修复结束按钮间距问题；

## 2023.10.26@1.6.0

**Feature**
- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.6.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 全新 UI 界面。
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

**Bug Fixed**

- 修复拉 chat 消息时向上滑动会预加载消息列表, 避免出现【加载更多字样】的问题；
- 修复偶现的用户进入房间后，远端用户屏幕分享没有自动切换到大窗口显示的问题；
- 修复屏幕分享时，最小化窗口预览尺寸被拉伸的问题；
- trtc-electron-sdk 升级至 11.3.502-beta.2 修复如下问题：
  - 规避 mac 链接 iphone 麦克风自动切换
  - 优化 mac 启动 system loopback 失败率高问题。
  - 解决 mac 分享窗口，上行帧率为零问题

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


## 2023.05.26@1.3.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.3.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89380)。

**Bug Fixed**

- 修复偶现的侧边栏布局下收起侧边栏并点击页面全屏时页面布局错乱问题。
- 修复偶现的用户进入房间后，远端用户屏幕分享没有自动切换到大窗口显示的问题。
