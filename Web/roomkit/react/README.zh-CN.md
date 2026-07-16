# @tencentcloud/roomkit-web-react

腾讯云 TUIRoomKit 音视频房间 UI 组件库（React 版本）。提供会前预检与会中两套完整的 UI 视图组件，并配套完整的会议生命周期控制 API，帮助开发者快速将多人音视频会议能力集成到现有 React 项目中。

---

## 能力概览

### 会前完整视图组件

| 组件 | 说明 |
|------|------|
| `PreConferenceView` | 会前预检视图（设备检测、会议信息确认） |

<img src="https://write-document-release-1258344699.cos.ap-guangzhou.tencentcos.cn/100027337918/86cbbbecd73011f09d4452540099c741.png" width="600" />

### 会中完整视图组件

| 组件 | 说明 |
|------|------|
| `ConferenceMainView` | 会议主视图，包含完整的音视频、聊天、成员管理等功能 |

<img src="https://write-document-release-1258344699.cos.ap-guangzhou.tencentcos.cn/100027337918/31045da2d73111f097cb5254005ef0f7.png" width="600" />

### conference API

`conference` 对象提供会议全生命周期的核心控制接口：

| 方法 | 说明 |
|------|------|
| `conference.login(options)` | SDK 登录 |
| `conference.logout()` | SDK 登出 |
| `conference.setSelfInfo(options)` | 设置当前用户昵称和头像 |
| `conference.createAndJoinRoom(options)` | 创建并加入房间 |
| `conference.joinRoom(options)` | 加入已有房间 |
| `conference.leaveRoom()` | 离开房间 |
| `conference.endRoom()` | 解散房间（仅房主） |
| `conference.setFeatureConfig(options)` | 配置功能特性（分享链接、视频布局等） |
| `conference.on(event, handler)` | 注册房间事件监听 |
| `conference.off(event, handler)` | 取消房间事件监听 |

### RoomEvent 事件列表

| 事件 | 触发时机 | 推荐处理 |
|------|---------|---------|
| `RoomEvent.ROOM_DISMISS` | 房间被解散 | 返回首页或会议列表 |
| `RoomEvent.ROOM_LEAVE` | 用户点击离开按钮 | 返回首页或会议列表 |
| `RoomEvent.ROOM_ERROR` | 进房失败或房间内发生错误 | 返回首页或会议列表 |
| `RoomEvent.KICKED_OUT` | 被房主踢出房间 | 返回首页或会议列表 |
| `RoomEvent.KICKED_OFFLINE` | 同账号其他设备登录，当前设备被强制下线 | 跳转登录页 |
| `RoomEvent.USER_SIG_EXPIRED` | UserSig 已过期 | 跳转登录页 |

---

## 快速接入

### 前提条件

- Node.js ≥ 18.19.1
- React ≥ 18.2.0
- 支持 [WebRTC APIs](https://cloud.tencent.com/document/product/647/17249#.E6.94.AF.E6.8C.81.E7.9A.84.E5.B9.B3.E5.8F.B0) 的现代浏览器

请参考 [开通服务](https://cloud.tencent.com/document/product/647/104842) 获取 `SDKAppID` 和 `SDKSecretKey`。

---

### 步骤1：安装依赖

```bash
# npm
npm install @tencentcloud/roomkit-web-react tuikit-atomicx-react @tencentcloud/uikit-base-component-react @tencentcloud/universal-api

# pnpm
pnpm install @tencentcloud/roomkit-web-react tuikit-atomicx-react @tencentcloud/uikit-base-component-react @tencentcloud/universal-api

# yarn
yarn add @tencentcloud/roomkit-web-react tuikit-atomicx-react @tencentcloud/uikit-base-component-react @tencentcloud/universal-api
```

---

### 步骤2：引用会议组件

`ConferenceMainView` / `PreConferenceView` 会填满父容器（`width/height: 100%`）。请由宿主提供定高容器；全屏场景可使用 `100vh`，或给页面根节点设置宽高并去掉默认边距。

Vite / CRA 脚手架的 `#root` / `#app` 常带有 `padding` / `max-width`，接入时请覆盖，例如：

```css
html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  max-width: none;
}
```

```tsx
import { UIKitProvider } from '@tencentcloud/uikit-base-component-react';
import { ConferenceMainView } from '@tencentcloud/roomkit-web-react';

export default function App() {
  return (
    <UIKitProvider theme="light" language="zh-CN">
      {/* Fullscreen: size the host; RoomKit fills the parent */}
      <div className="roomkit-host">
        <ConferenceMainView />
      </div>
    </UIKitProvider>
  );
}
```

```css
.roomkit-host {
  width: 100%;
  height: 100vh;
}
```

---

### 步骤3：登录

登录是使用 TUIRoomKit 一切功能的基础。在业务系统完成鉴权后立即调用 `conference.login`，随后调用 `conference.setSelfInfo` 设置用户昵称和头像。

```tsx
import { useEffect } from 'react';
import { conference } from '@tencentcloud/roomkit-web-react';

const SDKAppID = 0;          // 替换为您的 SDKAppID
const userId = 'your_user_id';
const userSig = 'your_dynamic_user_sig';  // 生产环境请从服务端动态获取
const userName = '用户展示昵称';

export default function App() {
  useEffect(() => {
    const login = async () => {
      await conference.login({ sdkAppId: SDKAppID, userId, userSig });
      await conference.setSelfInfo({
        userName,
        avatarUrl: 'https://your-avatar-url.com/image.png',
      });
    };
    login();
  }, []);
}
```

> **注意**：生产环境请在服务端生成 UserSig，详见 [正式运行阶段如何计算 UserSig](https://cloud.tencent.com/document/product/647/17275#formal)。

**当登录页与进房页分属不同路由时**，可通过监听 `loginUserInfo` 判断登录状态：

```tsx
import { useEffect } from 'react';
import { useLoginState } from 'tuikit-atomicx-react/room';
import { conference } from '@tencentcloud/roomkit-web-react';

export default function RoomPage() {
  const { loginUserInfo } = useLoginState();

  useEffect(() => {
    if (loginUserInfo?.userId) {
      conference.createAndJoinRoom({ roomId: '123456' });
    }
  }, [loginUserInfo?.userId]);
}
```

---

### 步骤4：创建会议

根据业务场景选择合适的创建方式：

**场景一：客户端快速发起会议**

```tsx
import { conference } from '@tencentcloud/roomkit-web-react';

const startQuickMeeting = async () => {
  const myRoomId = `room_${Date.now()}`;
  await conference.createAndJoinRoom({
    roomId: myRoomId,
    options: { roomName: '我的快速会议' },
  });
};
```

**场景二：客户端预约会议**

```tsx
import { useRoomState } from 'tuikit-atomicx-react/room';

const { scheduleRoom } = useRoomState();

const createSchedule = async () => {
  const roomId = '123456';
  // 注意：时间戳单位必须为秒（Date.getTime() 获取的是毫秒，需除以 1000）
  const startTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后

  await scheduleRoom({
    roomId,
    options: {
      roomName: '产品需求评审会',
      scheduleStartTime: startTime,
      scheduleEndTime: startTime + 1800,
      scheduleAttendees: ['userA', 'userB'],
      password: '123',
    },
  });
};
```

**场景三：服务端创建会议**

调用腾讯云 [服务端 REST API 创建房间](https://cloud.tencent.com/document/product/647/104446)，适用于政务、医疗等强管控场景。

---

### 步骤5：加入会议

**已知 roomId 直接加入**

```tsx
import { conference } from '@tencentcloud/roomkit-web-react';

await conference.joinRoom({ roomId: 'your-room-id' });
```

**不确定房间是否存在（双向对等场景）**

```tsx
// 双方统一调用，SDK 内部自动处理建房与进房逻辑
await conference.createAndJoinRoom({
  roomId: bizOrderId,
  options: { roomName: `业务沟通：${bizOrderId}` },
});
```

---

### 步骤6：离开与解散房间

```tsx
import { conference } from '@tencentcloud/roomkit-web-react';

// 离开房间（任意参会者）
await conference.leaveRoom();

// 解散房间（仅房主）
await conference.endRoom();
```

---

### 步骤7：监听房间状态

TUIRoomKit 内部会自动处理底层音视频资源的销毁和 UI 提示，但界面的路由跳转必须由您的业务层来接管。在组件挂载时注册监听，利用 `useEffect` 的清理函数在卸载时移除监听。

```tsx
import { useEffect } from 'react';
import { ConferenceMainView, conference, RoomEvent } from '@tencentcloud/roomkit-web-react';

export default function ConferencePage() {
  useEffect(() => {
    const backToHome = () => { /* 跳转首页逻辑 */ };
    const backToLogin = () => { /* 跳转登录页逻辑 */ };

    conference.on(RoomEvent.ROOM_DISMISS, backToHome);
    conference.on(RoomEvent.ROOM_LEAVE, backToHome);
    conference.on(RoomEvent.ROOM_ERROR, backToHome);
    conference.on(RoomEvent.KICKED_OUT, backToHome);
    conference.on(RoomEvent.KICKED_OFFLINE, backToLogin);
    conference.on(RoomEvent.USER_SIG_EXPIRED, backToLogin);

    return () => {
      conference.off(RoomEvent.ROOM_DISMISS, backToHome);
      conference.off(RoomEvent.ROOM_LEAVE, backToHome);
      conference.off(RoomEvent.ROOM_ERROR, backToHome);
      conference.off(RoomEvent.KICKED_OUT, backToHome);
      conference.off(RoomEvent.KICKED_OFFLINE, backToLogin);
      conference.off(RoomEvent.USER_SIG_EXPIRED, backToLogin);
    };
  }, []);

  return <ConferenceMainView />;
}
```

---

## 进阶配置

### 主题与语言

通过 `UIKitProvider` 的 props 配置全局主题和语言：

| 参数 | 可选值 | 默认值 |
|------|--------|--------|
| `theme` | `"light"` \| `"dark"` | `"light"` |
| `language` | `"zh-CN"` \| `"en-US"` | `"en-US"` |

### 修改房间分享链接

```tsx
import { conference } from '@tencentcloud/roomkit-web-react';

// 在 createAndJoinRoom 或 joinRoom 成功之后调用
conference.setFeatureConfig({
  shareLink: `https://your-domain.com/room?roomId=${roomId}`,
});
```

### 设置视频布局

```tsx
import { conference } from '@tencentcloud/roomkit-web-react';
import { RoomLayoutTemplate } from 'tuikit-atomicx-react/room';

// 侧边栏布局
conference.setFeatureConfig({ layoutTemplate: RoomLayoutTemplate.SidebarLayout });

// 顶部栏布局
conference.setFeatureConfig({ layoutTemplate: RoomLayoutTemplate.CinemaLayout });
```

### iframe 集成

使用 iframe 集成时，需在标签中配置 `allow` 属性：

```html
<iframe
  src="https://your-domain.com/index.html"
  allow="microphone; camera; display-capture; display; fullscreen;"
></iframe>
```

### 内网代理

```tsx
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from 'tuikit-atomicx-react/room';

const { roomEngine } = useRoomEngine();

TUIRoomEngine.once('ready', () => {
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  trtcCloud.callExperimentalAPI(JSON.stringify({
    api: 'setNetworkProxy',
    params: {
      websocketProxy: 'wss://proxy.example.com/ws/',
      turnServer: [{ url: '14.3.3.3:3478', username: 'turn', credential: 'turn' }],
      iceTransportPolicy: 'relay',
    },
  }));
});
```

更多内网代理信息请参考 [应对防火墙受限](https://web.sdk.qcloud.com/trtc/webrtc/doc/zh-cn/tutorial-34-advanced-proxy.html)。

---

## 常见问题

**Q：房主关闭网页后，会议会立即结束吗？**

不会。房主离开后其他成员可继续使用会议功能。系统会在会议结束时间后 6 小时且房间内人数为 0 时自动回收资源。建议会议结束时主动调用 `conference.endRoom()` 销毁房间。

**Q：同一 userId 能否在多设备同时加入同一会议？**

不支持。同一 userId 多端进房时，先进房的设备会被强制下线。如需多端同时参会，请为每个设备分配唯一的 userId。

**Q：部署到线上后无法采集摄像头或麦克风？**

浏览器要求在安全环境（`https://`、`localhost`、`file://`）下才允许访问媒体设备。请确保您的应用部署在 HTTPS 协议下，并具备有效的安全证书。

**Q：是否可以直接修改底层源码？**

我们非常不推荐导出源码，这会导致您脱离 npm 版本升级路径，需自行承担后续维护成本。如需导出，可执行：

```bash
node ./node_modules/@tencentcloud/roomkit-web-react/scripts/eject.js
```

导出后需更新引用路径：

```tsx
- import { ConferenceMainView, conference } from '@tencentcloud/roomkit-web-react';
+ import { ConferenceMainView, conference } from './components/RoomKit/index.ts';
```

---

## 相关链接

- [产品文档](https://cloud.tencent.com/document/product/647/81962)
- [服务端 REST API](https://cloud.tencent.com/document/product/647/104446)
- [开通服务](https://cloud.tencent.com/document/product/647/104842)
- [联系我们](https://cloud.tencent.com/document/product/647/19906)
