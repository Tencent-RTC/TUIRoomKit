## 2023.09.15@1.5.1

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