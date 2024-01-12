## 2023.01.12@2.0.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v2.0.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；

**Bug Fixed**
- 修复管理员请求打开摄像头的时候，后面几次没有toast提示。
- 修复英文模式部分文案。
- 修复修复麦上用户刷新页面或异常退出等情况回到 room 房间需要重新上麦的问题。

## 2023.01.11@1.7.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.7.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；
- 支持设置管理员角色。

**Bug Fixed**
- 修复最新版 vue3 + vite 脚手架项目中，集成本项目后，字体展示问题。
- 修复成员被踢出房间时，偶现 dialog 弹框卡住问题。
- 修复视频九宫格视图，翻页后切换到侧边栏，有用户离开会导致页面流窗口消失问题。
- 修复移动端 H5 上台申请列表样式问题。
- 修复移动端 H5 有远端屏幕分享时，会多显示一页视频问题。
- 修复 home 页面偶现的视频已出现但是 loading icon 还在显示的问题。
- 修复移动端 H5 举手管理列表中点击全体同意 & 全体拒绝按钮没有响应的问题。
- 修复移动端 H5 举手发言模式成员管理中，房主针对普通观众操作菜单展示问题。

## 2023.12.18@1.7.0

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.7.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；
- 新增会中移交主持人功能。
- 新增结束会议及踢出房间确认弹窗。
- 输入房间号后，支持按回车键进房。
- 主持人邀请成员开启视频、麦克风增加消息提示。
- 优化 H5 TRTC 能力检测和提示信息。
- 移交主持人新增错误信息提示。
- 兼容不支持 getUserMeida API 的浏览器，提示用户摄像头和麦克风不可用。
- 优化退房性能。

**Bug Fixed**

- 修复侧边栏模式下，收起侧边栏并点击全屏按钮，导致的布局错误问题。
- 修复默认头像在 H5 无法加载的问题。
- 修复观众端禁止文字聊天区域的展示交互。
- 修复偶现拉不到进房前历史消息问题。
- 修复上台发言模式下，举手申请 tab 状态错误问题。
- 修复上台发言模式下，第二次上麦打不开麦克风问题。
- 修复九宫格布局，左右翻页按钮显示不明显问题。
- 修复移动端 H5 成员列表功能触发失效问题。
- 修复移动端 H5 镜像设置设置不生效问题。
- 修复设备测试区域，切换扬声器和播放设备不生效的问题。
- 修复移动端 H5 成员管理，操作最后一个成员时，样式异常问题。
- 修复移动端 H5 点击新的成员管理弹窗，旧弹窗不会被关闭问题。
- 修复在 Safari 浏览器下不能退出全屏的问题。
- 修复移动端 H5 v-tap 不支持标签内直接写匿名函数问题。
- 修改移动端荣耀浏览器推小流崩溃问题，改为移动端浏览器只推大流。
- 增加移动端 H5 回退图标按钮区域大小，修复手指点击无响应问题。
- 修复移动端 H5 成员管理界面，移交房主状态显示异常问题。
- 修复会中切换前后置摄像头，然后关闭摄像头后再打开，前后置摄像头状态显示错误问题。
- 修复移动端 H5 下 dialog 文案及字体颜色错误问题。

## 2023.11.14@1.6.1

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.6.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)；
- 新增观众端的查看成员列表功能；
- 调整更多组件内容，移除 QQ 群，新增中文环境下知了社群跳转按钮，支持跳转到知了社群页面；

**Bug Fixed**
- 修改举手发言房间名称为上台发言房间；
- 修复 onChangeEvent 重复触发；
- 修复 Message、MessageBox 和 Badge 组件的展示问题；
- 修复 H5 复制 icon 丢失的问题；
- 修复 Dialog、Setting和 Message 边框阴影的问题；
- 修复 H5 房间号为空时，未拦截进房问题；
- 修复结束按钮间距问题；

## 2023.10.26@1.6.0

**Feature**
- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.6.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 全新 UI 界面。
- 升级 chat sdk 至 v3 版本。如果您同时使用了 Chat TUIKit 需要将其依赖的 sdk 也升级至 v3 版本，详情查看[升级指引](https://web.sdk.qcloud.com/im/doc/v3/zh-cn/tutorial-03-integration.html)

**Bug Fixed**
- 修复 H5 转交主持人列表不能滑动问题。；
- 修复 H5 下邀请成员和联系他人的字体不一致问题；
- 修复聊天未读数不居中问题；

## 2023.09.25@1.5.1

**Feature**
- 升级 [@tencentcloud/tuiroom-engine-js](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-js) 到 v1.5.1 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89361)。
- 优化平滑开关麦克风操作

**Bug Fixed**
- 修复举手发言模式下，主持人重新进入房间后没有自动上麦的问题；
- 修复举手发言模式下，主持人侧举手发言列表不是按照举手顺序排列的问题；
- 修复手机浏览器中，上下操作栏收起时，通知 dialog 不显示的问题；
- 规避移动端 Safari 浏览器中，本地预览流大脸问题；
- 修复 H5 下邀请成员和联系他人的字体不一致问题；
- 修复聊天未读数不居中问题；

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
