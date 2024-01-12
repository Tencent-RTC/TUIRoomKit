简体中文 | [English](ReleaseNotes.md)
## 发布日志

### Version 2.0.0 @ 2024.01.07
#### RoomEngine SDK:
全平台针对 Conference 场景，做出以下优化：
#### 房间管理：
- 独立的房间服务，不再依赖 IM 群组。
- 新增完整的房间列表管理 API。
- 新增预定会议相关的 REST API，完善 REST API 相关的能力。
- 底层 SDK 提供单例接口。
- 优化进房流程，进房更稳定。

#### 成员管理：
- 独立的后台服务，更加精准的成员列表。
- 服务端 REST API 也支持成员管理。
- 与 IM 群组解绑，聊天群和会议房间不再耦合。
- 房间成员离线检测逻辑更新，对齐腾讯会议离线检测业务逻辑。
- 支持将非在线成员主动踢出房间，提供可以操作的服务端 REST API。
- 优化管理员&房主变跟状态通知，修复1.x中关于角色反馈的若干问题。

#### 媒体设备管理：
- 独立的会控信令服务。
- 提供服务端操作相关的 API。
- 会控管理消息从 IM 群组的历史消息中剥离，不再污染 chat 中的聊天记录。
- 麦位（座位管理）独立的麦位服务，提供完整的麦位管理 REST  API。
- 麦位统一业务逻辑，最多支持20个。
- 上麦支持排麦，上麦不在强制要求传入麦位 index。
- 有序麦位无序麦位统一逻辑，不在区分会议和直播。
- 支持随时拉取排麦（上麦请求）列表，解决1.x 版本中，中途退出后，之前的上麦申请会丢失的问题。

#### 接口变更
详情见 
[ios api变更](./iOS/api_change_log.zh.md)
[Android api变更](./Android/api_change_log.zh.md)
[Flutter api变更](./Flutter/api_change_log.zh.md)
[Windows-Mac api变更](./Windows-Mac/api_change_log.zh.md)

### Version 1.7.1 @ 2024.01.05
- Android & iOS：新增管理员功能，房主可以设置/取消管理员，用于辅助房主对会议进行静音、审批上下台等操作；
- Android : 优化简版 Mic 图标的音量提示效果；
- Android : 解决演讲者模式冲突：个人视频秀无法进入屏幕分享；
- Android : 解决快速反复进入/退出会议，可能导致的资源释放不及时问题；

### Version 1.7.0 @ 2023.12.18
- Android & iOS：进一步美化UI，对圆角、背景色、大小等进行了调整；
- Android & iOS：修复了一些特殊场景下的异常问题；
- Android：细化房间内演讲者小画面的刷新内容，将刷新拆分为 用户、视频、音频三部分；
- Android：解决底部菜单栏偶现多次点击出现多个设置面板问题；
- Android：优化开发接入流程，适配了 Gradle 8.0；
- iOS：修改偶现的画面黑屏问题；
- iOS：更改房间号的生成逻辑，修改偶现的创建房间失败问题；

### Version 1.6.1 @ 2023.11.10
- Android & iOS：优化产品体验，进一步美化横屏UI；
- Android & iOS：优化产品体验，解决演讲者模式小画面切换抖动，设置小画面切换间隔为5秒；
- Android & iOS：增加源码可读性，调整 UI 的文件目录及文件命名；

### Version 1.6.0 @ 2023.10.27
- iOS & Android: 优化界面；
- iOS & Android: 增加横竖屏适配；

### Version 1.5.1 @ 2023.09.28
- iOS & Android: 优化开发接入流程，更新 TUIRoomKit 的接口；
- iOS & Android: 优化产品体验，更新 UI 界面；
- iOS & Android: 优化产品体验，让麦克风开关速度更新顺滑；
- iOS & Android: 布局适配 RTL，新增阿拉伯语；

### Version 1.5.0 @ 2023.09.08
- iOS: 删除美颜；

### Version 1.4.5 @ 2023.08.14
- iOS: 修改IM发送的快速会议消息长按可回复问题；

### Version 1.4.4 @ 2023.08.03
- Android：新增视频悬浮窗功能，优先显示屏幕分享画面，其次房主画面；
- Android：优化产品体验，进房默认音频输出改为扬声器；
- Android：优化产品体验，增加账户被踢下线时的提示；
- Android：优化产品体验，增加转让房主成功的提示；
- Android：优化开发接入流程，移除 tuivideoseat 模块，将其功能合并到 tuiroomkit 中；
- iOS: 新增视频悬浮窗功能，优先显示屏幕分享画面，其次房主画面；
- iOS: 优化产品体验，进房默认音频输出改为扬声器；
- iOS: 优化产品体验，增加转让房主成功的提示；
- iOS: 优化开发接入流程，移除 TUIVideoSeat 模块，将其功能合并到 TUIRoomKit 中；

### Version 1.4.3 @ 2023.07.28
- iOS: 修复了两个人同时进行屏幕共享，会面重叠问题；

### Version 1.4.2 @ 2023.07.24
- Android & iOS: 修复了频繁获取用户信息时，偶现Crash；
- Android & iOS: 修复了部分场景下，关闭麦克风导致的音频音量回调异常问题；

### Version 1.3.4 @ 2023.07.12
- Android：增加后台保活逻辑，保证 app 退到后台时，音视频的正常使用；
- Android：去除 Basic 和 TUIBeauty 模块；
- Android：优化视频画面闪烁、多次刷新等问题；
- Android：TUIRoomKit 支持聊天功能；
- iOS：增加后台保活逻辑，解决退到后台不能听到对方声音的问题
- iOS：修改预览设置页面没有横竖屏感应问题
- iOS：系统访问摄像头麦克风权限如果不被允许，之后打开麦克风和摄像头增加权限访问
- iOS：将TUIRoomKit接入IM

### Version 1.3.3 @ 2023.06.21
- iOS：修改举手发言房间收看屏幕共享的问题
- iOS：修改会议二维码

### Version 1.3.2 @ 2023.06.05
- iOS：修改进房时间

### Version 1.3.1 @ 2023.05.30
- iOS：根据是否导入美颜和聊天来显示相应按钮

### Version 1.3.0 @ 2023.05.22
- iOS：修复点击无响应问题
- iOS：适配OC
- iOS：增加中英文切换
- iOS：修复麦克风和摄像头出事状态问题

### Version 1.2.3 @ 2023.05.06
- iOS：修复同时接入TUIRoomKit和TUICallKit产生的问题

### Version 1.2.2 @ 2023.04.28
- iOS：修复路由跳转问题

### Version 1.2.1 @ 2023.04.27
- iOS：修复没有预览页面直接显示创建房间或者进入房间页面时的问题

### Version 1.2.0 @ 2023.04.25
- iOS：TUIRoomKit增加横屏模式
- iOS：TUIRoomKit增加举手发言房间上麦提示
- iOS：TUIVideoSeat增加横屏模式和双指放大功能

### Version 1.1.0 @ 2023.04.14
- iOS&Android: 适配 `RoomEngine`  `V1.2.0` 修改
- iOS：VideoSeat增加演讲者模式
- iOS：修复美颜设置没有保存的问题
- iOS：修复举手发言请求超时却没有从举手列表中删除该请求的问题
- iOS：修复每次点击设置，音频和视频参数都是默认值的问题
- iOS：修复聊天发送图片会崩溃的问题
- iOS：修复转交房主后离开房间页面的跳转问题
- Android: 新增横屏模式，提供更好的观看体验
- Android: 优化UI界面弹窗动画

### Version 1.0.6 @ 2023.03.27
- Android: 双人模式支持视频画面点击切换为对方画面
- Android: 优化视频麦位 `TUIVideoSeat` 布局，提供更好的交互体验

### Version 1.0.5 @ 2023.03.27
- Android: 适配 `RoomEngine`  `V1.0.2` 修改，`requestId` 由 `int` 修改为 `String`
- Android: 更新 `imsdk` 版本为 `7.1.3925`
- iOS：增加 `TUIChat` 聊天功能
- iOS：修复视频显示黑屏问题
- iOS：修复举手发言房间转换房主后无法下台的问题

### Version 1.0.4 @ 2023.03.10
- iOS&Android: 新增 `logout` 接口
- Android: 集成 `TUIChat` 聊天功能
- Android: 修复部分机型上文字显示异常的问题
- Android: 修复特定情况房主转让后视频麦位房主图标显示异常的问题
- Android: 优化部分操作后的 `Toast` 提示
- iOS： 修复房主在成员列表页面对于成员的管理bug
- iOS： 修复上麦后退房，重新进入房间麦克风和摄像头的bug

### Version 1.0.3 @ 2023.03.06
- iOS&Android: 修改 `enterRoom` 回调,删除 `RoomScene` 参数
- iOS&Android: 修改 `onExitRoom` 回调参数为无参
- iOS&Android: 修复进房前后置摄像头、视频镜像设置在房间内不生效的bug
- Android: 修复举手发言模式房主退房后未上麦用户会崩溃的bug
- Android: 升级工程compileSdkVersion与targetSdkVersion为30
- Android: 修复房间内人数较多时无法进房的bug
- Android: gradle版本升级为6.7.1
- iOS: 修复roomEngine内存泄露引发的回调异常
- iOS: 修复房主状态显示的异常bug

### Version 1.0.2 @ 2023.02.24
- iOS&Android: 修改 `setUp` 接口 `login` 接口
- iOS&Android: 新增设置用户头像、昵称接口 `setSelfInfo`
- iOS&Android: 新增登录结果回调onLogin
- iOS&Android: 新增准备页面，进房前可进行视频预览
- iOS&Android: 新增举手发言模式，主持人可对用户进行上下麦控制，观众需要申请上麦之后，才能正常发言
- iOS&Android: 全新UI改版，多处交互ui进行调整，提供更好的音视频交互体验

### Version 1.0.1 @ 2023.02.22
- iOS&Android: 更新 `TUIRoomEngine` 依赖
