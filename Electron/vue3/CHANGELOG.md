
## 2023.05.26

**Feature**

- 升级 [@tencentcloud/tuiroom-engine-electron](https://www.npmjs.com/package/@tencentcloud/tuiroom-engine-electron) 到 v1.3.0 版本，详情请查看 [发布日志](https://cloud.tencent.com/document/product/1690/89380)。

**Bug Fixed**

- 修复偶现的侧边栏布局下收起侧边栏并点击页面全屏时页面布局错乱问题。
- 修复偶现的用户进入房间后，远端用户屏幕分享没有自动切换到大窗口显示的问题。


## 2023.07.18

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
