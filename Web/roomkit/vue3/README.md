# @tencentcloud/roomkit-web-vue3

腾讯云 TUIRoomKit 音视频房间 UI 组件库（Vue3 版本）。提供会前预检与会中两套完整的 UI 视图组件，覆盖桌面端与 H5 移动端，并配套完整的会议生命周期控制 API，帮助开发者快速将多人音视频会议能力集成到现有 Vue3 项目中。

---

## 能力概览

### 会前完整视图组件

| 组件 | 说明 |
|------|------|
| `PreConferenceView` | 桌面端会前预检视图（设备检测、会议信息确认） |
| `PreConferenceViewH5` | H5 移动端会前预检视图 |

<img src="https://qcloudimg.tencent-cloud.cn/image/document/517e4911245e3f73105a000352143c5f.png" width="600" />

### 会中完整视图组件

| 组件 | 说明 |
|------|------|
| `ConferenceMainView` | 桌面端会议主视图，包含完整的音视频、聊天、成员管理等功能 |
| `ConferenceMainViewH5` | H5 移动端会议主视图 |

<img src="https://qcloudimg.tencent-cloud.cn/image/document/f840375dc3be446aff7f48d72e18cc31.png" width="600" />

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

| 事件 | 触发时机 |
|------|---------|
| `RoomEvent.ROOM_DISMISS` | 房间被解散 |
| `RoomEvent.ROOM_LEAVE` | 用户点击离开按钮 |
| `RoomEvent.ROOM_ERROR` | 进房失败或房间内发生错误 |
| `RoomEvent.KICKED_OUT` | 被房主踢出房间 |
| `RoomEvent.KICKED_OFFLINE` | 同账号其他设备登录，当前设备被强制下线 |
| `RoomEvent.USER_SIG_EXPIRED` | UserSig 已过期 |

---

## 快速接入

### 前提条件

- Node.js ≥ 18.19.1
- Vue ≥ 3.4.21
- 支持 [WebRTC APIs](https://cloud.tencent.com/document/product/647/17249#.E6.94.AF.E6.8C.81.E7.9A.84.E5.B9.B3.E5.8F.B0) 的现代浏览器

请参考 [开通服务](https://cloud.tencent.com/document/product/647/104842) 获取 `SDKAppID` 和 `SDKSecretKey`。

---

### 步骤1：安装依赖

```bash
# npm
npm install @tencentcloud/roomkit-web-vue3 tuikit-atomicx-vue3 @tencentcloud/uikit-base-component-vue3 @tencentcloud/universal-api

# pnpm
pnpm install @tencentcloud/roomkit-web-vue3 tuikit-atomicx-vue3 @tencentcloud/uikit-base-component-vue3 @tencentcloud/universal-api

# yarn
yarn add @tencentcloud/roomkit-web-vue3 tuikit-atomicx-vue3 @tencentcloud/uikit-base-component-vue3 @tencentcloud/universal-api
```

---

### 步骤2：引用会议组件

`ConferenceMainView` / `ConferenceMainViewH5` / `PreConferenceView` 会填满父容器（`width/height: 100%`）。请由宿主提供定高容器；全屏场景可使用 `100vh`，或给页面根节点设置宽高并去掉默认边距。

Vite 默认脚手架的 `#app` 常带有 `padding` / `max-width`，接入时请覆盖，例如：

```css
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  max-width: none;
}
```

```vue
<template>
  <UIKitProvider theme="light" language="zh-CN">
    <!-- Fullscreen: size the host; RoomKit fills the parent -->
    <div class="roomkit-host">
      <ConferenceMainView v-if="isPC" />
      <ConferenceMainViewH5 v-else />
    </div>
  </UIKitProvider>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { UIKitProvider } from '@tencentcloud/uikit-base-component-vue3';
import { ConferenceMainView, ConferenceMainViewH5 } from '@tencentcloud/roomkit-web-vue3';
import { getPlatform } from '@tencentcloud/universal-api';

const isPC = ref(getPlatform() === 'pc');
</script>

<style>
.roomkit-host {
  width: 100%;
  height: 100vh;
}
</style>
```

---

### 步骤3：登录

```typescript
import { onMounted } from 'vue';
import { conference } from '@tencentcloud/roomkit-web-vue3';

const SDKAppID = 0;          // 替换为您的 SDKAppID
const userId = 'your_user_id';
const userSig = 'your_dynamic_user_sig';  // 生产环境请从服务端动态获取
const userName = '用户展示昵称';

onMounted(async () => {
  await conference.login({ sdkAppId: SDKAppID, userId, userSig });
  await conference.setSelfInfo({
    userName,
    avatarUrl: 'https://your-avatar-url.com/image.png',
  });
});
```

> **注意**：生产环境请在服务端生成 UserSig，详见 [正式运行阶段如何计算 UserSig](https://cloud.tencent.com/document/product/647/17275#formal)。

**当登录页与进房页分属不同路由时**，可通过监听 `loginUserInfo` 判断登录状态：

```typescript
import { watch } from 'vue';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import { conference } from '@tencentcloud/roomkit-web-vue3';

const { loginUserInfo } = useLoginState();

watch(() => loginUserInfo.value?.userId, async (userId) => {
  if (userId) {
    await conference.createAndJoinRoom({ roomId: '123456' });
  }
}, { immediate: true });
```

---

### 步骤4：创建会议

根据业务场景选择合适的创建方式：

**场景一：客户端快速发起会议**

```typescript
import { conference } from '@tencentcloud/roomkit-web-vue3';

const startQuickMeeting = async () => {
  const myRoomId = `room_${Date.now()}`;
  await conference.createAndJoinRoom({
    roomId: myRoomId,
    options: { roomName: '我的快速会议' },
  });
};
```

**场景二：客户端预约会议**

```typescript
import { useRoomState } from 'tuikit-atomicx-vue3/room';

const { scheduleRoom } = useRoomState();

const createSchedule = async () => {
  const roomId = '123456';
  const startTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后，单位：秒

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

```typescript
import { conference } from '@tencentcloud/roomkit-web-vue3';

await conference.joinRoom({ roomId: 'your-room-id' });
```

**不确定房间是否存在（双向对等场景）**

```typescript
// 双方统一调用，SDK 内部自动处理建房与进房逻辑
await conference.createAndJoinRoom({
  roomId: bizOrderId,
  options: { roomName: `业务沟通：${bizOrderId}` },
});
```

---

### 步骤6：离开与解散房间

```typescript
import { conference } from '@tencentcloud/roomkit-web-vue3';

// 离开房间（任意参会者）
await conference.leaveRoom();

// 解散房间（仅房主）
await conference.endRoom();
```

---

### 步骤7：监听房间状态

```vue
<template>
  <ConferenceMainView />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { ConferenceMainView, conference, RoomEvent } from '@tencentcloud/roomkit-web-vue3';

const backToHome = () => { /* 跳转首页逻辑 */ };
const backToLogin = () => { /* 跳转登录页逻辑 */ };

onMounted(() => {
  conference.on(RoomEvent.ROOM_DISMISS, backToHome);
  conference.on(RoomEvent.ROOM_LEAVE, backToHome);
  conference.on(RoomEvent.ROOM_ERROR, backToHome);
  conference.on(RoomEvent.KICKED_OUT, backToHome);
  conference.on(RoomEvent.KICKED_OFFLINE, backToLogin);
  conference.on(RoomEvent.USER_SIG_EXPIRED, backToLogin);
});

onUnmounted(() => {
  conference.off(RoomEvent.ROOM_DISMISS, backToHome);
  conference.off(RoomEvent.ROOM_LEAVE, backToHome);
  conference.off(RoomEvent.ROOM_ERROR, backToHome);
  conference.off(RoomEvent.KICKED_OUT, backToHome);
  conference.off(RoomEvent.KICKED_OFFLINE, backToLogin);
  conference.off(RoomEvent.USER_SIG_EXPIRED, backToLogin);
});
</script>
```

---

## 进阶配置

### 主题与语言

通过 `UIKitProvider` 的 props 配置全局主题和语言：

| 参数 | 可选值 | 默认值 |
|------|--------|--------|
| `theme` | `"light"` \| `"dark"` | `"light"` |
| `language` | `"zh-CN"` \| `"en-US"` | `"en-US"` |

更多自定义请参考 [UI 自定义 > 主题及语言](https://write.woa.com/document/202390358423633920)。

### 修改房间分享链接

```typescript
import { conference } from '@tencentcloud/roomkit-web-vue3';

conference.setFeatureConfig({
  shareLink: `https://your-domain.com/room?roomId=${roomId}`,
});
```

### 设置视频布局

```typescript
import { conference } from '@tencentcloud/roomkit-web-vue3';
import { RoomLayoutTemplate } from 'tuikit-atomicx-vue3/room';

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

```typescript
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from 'tuikit-atomicx-vue3/room';

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
node ./node_modules/@tencentcloud/roomkit-web-vue3/scripts/eject.js
```

---

## 相关链接

- [产品文档](https://cloud.tencent.com/document/product/647/81962)
- [完整集成指南（含 UI）](https://write.woa.com/document/194132737030885376)
- [无 UI 集成指南](https://write.woa.com/document/197380092150673408)
- [UI 自定义](https://write.woa.com/document/202390358423633920)
- [视频布局及挂件自定义](https://write.woa.com/document/202273351084670976)
- [开通服务](https://cloud.tencent.com/document/product/647/104842)
- [联系我们](https://cloud.tencent.com/document/product/647/19906)
