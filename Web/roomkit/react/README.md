# @tencentcloud/roomkit-web-react

TUIRoomKit is a UI solution for audio/video conferencing rooms provided by Tencent Cloud (React version). It provides two complete sets of UI view components — pre-conference and in-conference — along with a full conference lifecycle control API to help developers quickly integrate multi-party audio/video conferencing into existing React projects.

---

## Overview

### Pre-Conference View

| Component | Description |
|-----------|-------------|
| `PreConferenceView` | Pre-conference view for device check and meeting info confirmation |

<img src="https://write-document-release-1258344699.cos.ap-guangzhou.tencentcos.cn/100027337918/1d63817938c911f1b557525400370dda.png" width="600" />

### In-Conference View

| Component | Description |
|-----------|-------------|
| `ConferenceMainView` | Conference main view with full audio/video, chat, and member management |

<img src="https://write-document-release-1258344699.cos.ap-guangzhou.tencentcos.cn/100027337918/b09250de38c911f18c7152540097cba1.png" width="600" />

### conference API

The `conference` object provides core lifecycle control methods:

| Method | Description |
|--------|-------------|
| `conference.login(options)` | SDK authentication |
| `conference.logout()` | SDK logout |
| `conference.setSelfInfo(options)` | Set current user display name and avatar |
| `conference.createAndJoinRoom(options)` | Create and join a room |
| `conference.joinRoom(options)` | Join an existing room |
| `conference.leaveRoom()` | Leave the room |
| `conference.endRoom()` | End the room (host only) |
| `conference.setFeatureConfig(options)` | Configure features (share link, video layout, etc.) |
| `conference.on(event, handler)` | Register a room event listener |
| `conference.off(event, handler)` | Remove a room event listener |

### RoomEvent Reference

| Event | Trigger | Recommended Handling |
|-------|---------|----------------------|
| `RoomEvent.ROOM_DISMISS` | Room ended, triggers for all participants | Navigate to home or meeting list |
| `RoomEvent.ROOM_LEAVE` | User clicks "Leave" in TUIRoomKit UI | Navigate to home or meeting list |
| `RoomEvent.ROOM_ERROR` | Join room failure or unhandled in-room error | Navigate to home or meeting list |
| `RoomEvent.KICKED_OUT` | Kicked out by host | Navigate to home or meeting list |
| `RoomEvent.KICKED_OFFLINE` | Same account logged in on another device | Redirect to login page |
| `RoomEvent.USER_SIG_EXPIRED` | UserSig expired | Redirect to login page |

---

## Quick Integration

### Prerequisites

- Node.js ≥ 18.19.1
- React ≥ 18.2.0
- Modern browsers supporting [WebRTC APIs](https://trtc.io/document/41664?product=rtcengine&menulabel=core%20sdk&platform=web#supported-platforms)

See [Activate the Service](https://trtc.io/document/59973?platform=web&product=conference) to obtain your `SDKAppID` and `SDKSecretKey`.

---

### Step 1: Install Dependencies

```bash
# npm
npm install @tencentcloud/roomkit-web-react tuikit-atomicx-react @tencentcloud/uikit-base-component-react @tencentcloud/universal-api

# pnpm
pnpm install @tencentcloud/roomkit-web-react tuikit-atomicx-react @tencentcloud/uikit-base-component-react @tencentcloud/universal-api

# yarn
yarn add @tencentcloud/roomkit-web-react tuikit-atomicx-react @tencentcloud/uikit-base-component-react @tencentcloud/universal-api
```

---

### Step 2: Import TUIRoomKit Components

`ConferenceMainView` / `PreConferenceView` fill their parent (`width/height: 100%`). Provide a sized host container; for fullscreen use `100vh`, or set root width/height and clear default page margins.

Vite / CRA scaffolds often style `#root` / `#app` with `padding` / `max-width`. Override them when integrating, for example:

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
    <UIKitProvider theme="light" language="en-US">
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

### Step 3: User Authentication

Authentication is required to access all TUIRoomKit features. Call `conference.login` as soon as your user is authenticated. After login, call `conference.setSelfInfo` to set the user's display name and avatar, which appear in the participant video area and member list.

```tsx
import { useEffect } from 'react';
import { conference } from '@tencentcloud/roomkit-web-react';

const SDKAppID = 0;           // Replace with your SDKAppID
const userId = 'your_user_id';
const userSig = 'your_dynamic_user_sig'; // Generate on your server in production
const userName = 'Display Name';

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

> **Note**: In production, generate UserSig on your server and fetch it dynamically on the client. See [How to calculate UserSig for production](https://trtc.io/document/35166?product=conference&menulabel=uikit&platform=web).

**When authentication and Enter Room pages are on different routes**, monitor `loginUserInfo` to detect when login is complete:

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

### Step 4: Create a Room

The **Room ID** must be generated and managed by your business system (globally unique). Choose the creation method that fits your scenario:

**Scenario 1: Quick Meeting from Client**

```tsx
import { conference } from '@tencentcloud/roomkit-web-react';

const startQuickMeeting = async () => {
  const myRoomId = `room_${Date.now()}`;
  await conference.createAndJoinRoom({
    roomId: myRoomId,
    options: { roomName: 'My Quick Meeting' },
  });
};
```

**Scenario 2: Scheduled Meeting from Client**

```tsx
import { useRoomState } from 'tuikit-atomicx-react/room';

const { scheduleRoom } = useRoomState();

const createSchedule = async () => {
  const roomId = '123456';
  // Note: timestamp must be in seconds (divide Date.getTime() by 1000)
  const startTime = Math.floor(Date.now() / 1000) + 3600; // starts in 1 hour

  await scheduleRoom({
    roomId,
    options: {
      roomName: 'Product Requirement Review',
      scheduleStartTime: startTime,
      scheduleEndTime: startTime + 1800,
      scheduleAttendees: ['userA', 'userB'],
      password: '123',
    },
  });
};
```

**Scenario 3: Server-Side Room Creation**

Your backend calls the [Server REST API to create a room](https://trtc.io/document/60707?product=conference&menulabel=uikit&platform=web). Suitable for government, healthcare, and large enterprise environments.

---

### Step 5: Join a Room

**Join by Room ID (room already exists)**

```tsx
import { conference } from '@tencentcloud/roomkit-web-react';

await conference.joinRoom({ roomId: 'your-room-id' });
```

**Peer-to-peer scenario (room existence unknown)**

```tsx
// Both parties call the same API; SDK handles create-or-join internally
await conference.createAndJoinRoom({
  roomId: bizOrderId,
  options: { roomName: `Business Communication: ${bizOrderId}` },
});
```

---

### Step 6: Leave or End a Room

```tsx
import { conference } from '@tencentcloud/roomkit-web-react';

// Leave room (any participant)
await conference.leaveRoom();

// End room (host only)
await conference.endRoom();
```

---

### Step 7: Listen to Room State

TUIRoomKit handles audio/video cleanup and UI prompts internally, but route transitions must be managed by your application layer. Register listeners on mount and remove them on unmount.

```tsx
import { useEffect } from 'react';
import { ConferenceMainView, conference, RoomEvent } from '@tencentcloud/roomkit-web-react';

export default function ConferencePage() {
  useEffect(() => {
    const backToHome = () => { /* navigate to home */ };
    const backToLogin = () => { /* navigate to login */ };

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

## Advanced Configuration

### Theme and Language

Configure the global theme and language via `UIKitProvider` props:

| Prop | Options | Default |
|------|---------|---------|
| `theme` | `"light"` \| `"dark"` | `"light"` |
| `language` | `"zh-CN"` \| `"en-US"` | `"en-US"` |

### Customize Room Share Link

```tsx
import { conference } from '@tencentcloud/roomkit-web-react';

// Call after createAndJoinRoom or joinRoom succeeds
conference.setFeatureConfig({
  shareLink: `https://your-domain.com/room?roomId=${roomId}`,
});
```

### Configure Video Layout

```tsx
import { conference } from '@tencentcloud/roomkit-web-react';
import { RoomLayoutTemplate } from 'tuikit-atomicx-react/room';

// Sidebar layout
conference.setFeatureConfig({ layoutTemplate: RoomLayoutTemplate.SidebarLayout });

// Top bar layout
conference.setFeatureConfig({ layoutTemplate: RoomLayoutTemplate.CinemaLayout });
```

### iframe Integration

Configure the `allow` attribute to grant necessary browser permissions:

```html
<iframe
  src="https://your-domain.com/index.html"
  allow="microphone; camera; display-capture; display; fullscreen;"
></iframe>
```

### Intranet Proxy

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

For more details, see [Firewall Restrictions](https://trtc.io/document/59667?product=rtcengine&menulabel=core%20sdk&platform=web).

---

## FAQs

**Q: Does the meeting end immediately if the host closes the browser?**

No. The meeting continues and other participants can interact as usual. The system reclaims resources 6 hours after the scheduled end time, provided the room is empty. Proactively call `conference.endRoom()` to release resources when the meeting is over.

**Q: Can multiple devices use the same userId to join the same meeting?**

No. If a second device joins with the same userId, the first device is forcibly logged out. Assign a unique userId to each device for multi-device support.

**Q: Works locally but camera/microphone fails after deployment?**

Browsers only allow media device access in secure contexts: `https://`, `localhost`, `file://`. Ensure your application is served over HTTPS with a valid certificate. See [URL domain and protocol restrictions](https://trtc.io/document/59733?product=rtcengine&menulabel=core%20sdk&platform=web#url-protocol-support).

**Q: Can I export and modify the TUIRoomKit source code?**

We recommend using the built-in customization APIs first, as exporting source code removes you from the standard npm upgrade path. If deep customization is truly necessary, run:

```bash
node ./node_modules/@tencentcloud/roomkit-web-react/scripts/eject.js
```

After export, update the import paths:

```tsx
- import { ConferenceMainView, conference } from '@tencentcloud/roomkit-web-react';
+ import { ConferenceMainView, conference } from './components/RoomKit/index.ts';
```

---

## Related Links

- [Product Documentation](https://trtc.io/document/59973?platform=web&product=conference)
- [Server REST API](https://trtc.io/document/60707?product=conference&menulabel=uikit&platform=web)
- [Activate the Service](https://trtc.io/document/59973?platform=web&product=conference)
- [Contact Us](https://trtc.io/contact)
