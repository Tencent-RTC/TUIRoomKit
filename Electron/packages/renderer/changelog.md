## 2022.09.09

**Updated**

- 新增中英文切换；
- 支持新消息提示和刷新页面拉取历史消息；
- 优化媒体设备插拔时的媒体设备列表更新；
- 优化成员管理页面控制按钮显示；

**Fixed**

- 修复可能出现的远端用户打开摄像头或麦克风未同步的问题；
- 修复切换扬声器设备不起作用的问题；
- 修复举手发言模式下，主持人拒绝所有上台申请，仅对第一个申请上台用户有效的问题；


## 2022.08.10

**Updated**

- 统一 TUIRoom 组件抛出事件的格式为 onCreateRoom, onEnterRoom, onExitRoom, onDestroyRoom, 详情参考 [TUIRoom 事件](https://cloud.tencent.com/document/product/647/74765#tuiroom-.E4.BA.8B.E4.BB.B6)。
- 完善主持人离开房间时的房主权限移交功能；

**Fixed**

- 修复加载页面时可能出现的 "getActivePinia was called with no active Pinia. Did you forget to install pinia? " 错误；
