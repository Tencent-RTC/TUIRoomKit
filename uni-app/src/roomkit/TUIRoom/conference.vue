<template>
  <div
    id="roomContainer" ref="roomRef" class="tui-room"
    :style="{ height: systemScreenHeight + 'px', marginTop: systemStatusBarHeight + 'px'}"
  >
    <room-content
      ref="roomContentRef"
      class="content"
      @tap="handleRoomContentTap"
    ></room-content>
    <room-header
      class="header"
      @log-out="logOut"
      @on-destroy-room="onDestroyRoom"
      @on-exit-room="onExitRoom"
      @touchmove.stop.prevent="() => {}"
    ></room-header>
    <room-footer
      @on-destroy-room="onDestroyRoom"
      @on-exit-room="onExitRoom"
      @touchmove.stop.prevent="() => {}"
    />
    <room-sidebar></room-sidebar>
    <room-setting></room-setting>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, Ref, watch, provide } from 'vue';
import RoomHeader from './components/RoomHeader/index/index.vue';
import RoomFooter from './components/RoomFooter/index/index.vue';
import RoomSidebar from './components/RoomSidebar/index.vue';
import RoomContent from './components/RoomContent/index.vue';
import RoomSetting from './components/RoomSetting/index.vue';
import { debounce, throttle } from './utils/utils';
import { isMobile, isWeChat } from './utils/environment';
import { TUIKickedOutOfRoomReason }  from '@tencentcloud/tuiroom-engine-uniapp-app';

import TUIRoomAegis from './utils/aegis';
import { MESSAGE_DURATION } from './constants/message';

import TUIMessageBox from './components/common/base/MessageBox/index';
import TUIMessage from './components/common/base/Message/index';
import { roomService, EventType, RoomParam, RoomInitData, RoomService } from './services/index';
import useDeviceManager from './hooks/useDeviceManager';
useDeviceManager({ listenForDeviceChange: true });

const { t } = roomService;
const systemScreenHeight = ref(0);
const systemStatusBarHeight = ref(0);
defineExpose({
  init,
  createRoom,
  enterRoom,
  dismissRoom,
  leaveRoom,
  resetStore,
  t,
});

const emit = defineEmits([
  'on-log-out',
  'on-create-room',
  'on-enter-room',
  'on-exit-room',
  'on-destroy-room',
  // 用户被踢出房间
  'on-kicked-out-of-room',
  // 用户被踢下线
  'on-kicked-off-line',
  // 用户 userSig 过期
  'on-userSig-expired',
]);

const showMessageBox = (data: {
  code?: number;
  message: string;
  title: string;
  confirmButtonText: string;
  showCancel?: boolean;
  appendToRoomContainer?: boolean;
  callback?: () => void;
}) => {
  const {
    message,
    showCancel,
    title = roomService.t('Note'),
    confirmButtonText = roomService.t('Sure'),
    appendToRoomContainer = true,
    callback = () => { },
  } = data;
  TUIMessageBox({
    title,
    message,
    showCancel,
    confirmButtonText,
    appendToRoomContainer,
    callback: async () => {
      callback && callback();
    },
  });
};
const showMessage = (data: {
  type: 'warning' | 'success' | 'error' | 'info';
  message: string;
  duration: MESSAGE_DURATION;
}) => {
  const { type, message, duration } = data;
  TUIMessage({
    type,
    message,
    duration,
  });
};

onMounted(() => {
  const { windowHeight, statusBarHeight } = uni.getSystemInfoSync();
  systemScreenHeight.value = windowHeight;
  systemStatusBarHeight.value = statusBarHeight;
  roomService.setComponentConfig({
    InviteControl: { visible: false },
  });
  roomService.on(EventType.ROOM_NOTICE_MESSAGE, showMessage);
  roomService.on(EventType.ROOM_NOTICE_MESSAGE_BOX, showMessageBox);
  roomService.on(EventType.KICKED_OUT, onKickedOutOfRoom);
  roomService.on(EventType.USER_SIG_EXPIRED, onUserSigExpired);
  roomService.on(EventType.KICKED_OFFLINE, onKickedOffLine);
  roomService.on(EventType.ROOM_START, onStartRoom);
  roomService.on(EventType.ROOM_JOIN, onJoinRoom);
  roomService.on(EventType.ROOM_LEAVE, onLeaveRoom);
  roomService.on(EventType.ROOM_DISMISS, onDismissRoom);
  roomService.on(EventType.USER_LOGOUT, onLogout);
});
onUnmounted(() => {
  roomService.off(EventType.ROOM_NOTICE_MESSAGE, showMessage);
  roomService.off(EventType.ROOM_NOTICE_MESSAGE_BOX, showMessageBox);
  roomService.off(EventType.KICKED_OUT, onKickedOutOfRoom);
  roomService.off(EventType.USER_SIG_EXPIRED, onUserSigExpired);
  roomService.off(EventType.KICKED_OFFLINE, onKickedOffLine);
  roomService.off(EventType.ROOM_START, onStartRoom);
  roomService.off(EventType.ROOM_JOIN, onJoinRoom);
  roomService.off(EventType.ROOM_LEAVE, onLeaveRoom);
  roomService.off(EventType.ROOM_DISMISS, onDismissRoom);
  roomService.off(EventType.USER_LOGOUT, onLogout);
  roomService.resetStore();
  RoomService.destroyInstance();
});

const { sdkAppId } = roomService.basicStore;
watch(
  () => sdkAppId,
  (val: number) => {
    if (val) {
      TUIRoomAegis.setSdkAppId(val);
      TUIRoomAegis.reportEvent({
        name: 'loaded',
        ext1: 'loaded-success',
      });
    }
  },
);

/**
 * Handle page mouse hover display toolbar logic
 *
 * 处理页面鼠标悬浮显示工具栏逻辑
 **/
const roomContentRef = ref<InstanceType<typeof RoomContent>>();
const showRoomTool: Ref<boolean> = ref(true);
const roomRef: Ref<Node | undefined> = ref();
function handleHideRoomTool() {
  showRoomTool.value = false;
}
provide('showRoomTool', showRoomTool);

watch(() => roomRef.value, (newValue, oldValue) => {
  // PC 端处理 room 控制栏交互
  if (!isWeChat && !isMobile) {
    if (newValue) {
      addRoomContainerEvent(newValue);
    } else {
      oldValue && removeRoomContainerEvent(oldValue);
    }
  }
});

const handleHideRoomToolDebounce = debounce(handleHideRoomTool, 5000);
const handleHideRoomToolThrottle = throttle(handleHideRoomToolDebounce, 1000);
const showTool = () => {
  showRoomTool.value = true;
  handleHideRoomToolDebounce();
};
const showToolThrottle = () => {
  showRoomTool.value = true;
  handleHideRoomToolThrottle();
};
const hideTool = () => {
  handleHideRoomTool();
};
const addRoomContainerEvent = (container: Node) => {
  container.addEventListener('mouseenter', showTool);
  container.addEventListener('click', showTool);
  container.addEventListener('mousemove', showToolThrottle);
  container.addEventListener('mouseleave', hideTool);
};
const removeRoomContainerEvent = (container: Node) => {
  container.removeEventListener('mouseenter', showTool);
  container.removeEventListener('click', showTool);
  container.removeEventListener('mousemove', showToolThrottle);
  container.removeEventListener('mouseleave', hideTool);
};
// H5 及小程序端处理 room 控制栏交互
function handleRoomContentTap() {
  showRoomTool.value = !showRoomTool.value;
  if (showRoomTool.value) {
    handleHideRoomToolDebounce();
  }
}

async function dismissRoom() {
  await roomService.dismissRoom();
}

async function leaveRoom() {
  await roomService.leaveRoom();
  emit('on-exit-room');
}

async function init(option: RoomInitData) {
  await roomService.initRoomKit(option);
}

async function createRoom(options: {
  roomId: string;
  roomName: string;
  roomMode: 'FreeToSpeak' | 'SpeakAfterTakingSeat';
  roomParam?: RoomParam;
}) {
  await roomService.createRoom(options);
  emit('on-create-room', {
    code: 0,
    message: 'create room success',
  });
  await roomService.enterRoom(options);
  emit('on-enter-room', {
    code: 0,
    message: 'enter room success',
  });
}

async function enterRoom(options: { roomId: string; roomParam?: RoomParam }) {
  await roomService.enterRoom(options);
  emit('on-enter-room', {
    code: 0,
    message: 'enter room success',
  });
}

function resetStore() {
  roomService.resetStore();
}

const logOut = () => {
  roomService.logOut();
};

const onStartRoom = () => {
  emit('on-create-room',  { code: 0, message: 'create room' });
};

const onJoinRoom = () => {
  emit('on-enter-room',  { code: 0, message: 'enter room' });
};


const onLeaveRoom = () => {
  emit('on-exit-room',  { code: 0, message: 'exit room' });
};

const onDismissRoom = () => {
  emit('on-destroy-room', { code: 0, message: 'destroy room' });
};

const onLogout = () => {
  emit('on-log-out', { code: 0, message: 'user logout' });
};

const onKickedOutOfRoom = async (eventInfo: { roomId: string; reason: TUIKickedOutOfRoomReason; message: string }) => {
  const { roomId, reason, message } = eventInfo;
  emit('on-kicked-out-of-room', { roomId, reason, message });
};

const onUserSigExpired = () => {
  emit('on-userSig-expired');
};

const onKickedOffLine = (eventInfo: { message: string }) => {
  const { message } = eventInfo;
  emit('on-kicked-off-line', { message });
};

</script>

<style lang="scss">
.tui-room {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  color: #FFF;
  background-color: #FFF;
}
</style>
