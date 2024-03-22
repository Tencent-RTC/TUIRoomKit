<template>
  <div v-if="basicStore.roomId" id="roomContainer" ref="roomRef" :class="tuiRoomClass">
    <room-header
      v-show="showRoomTool && showHeaderTool"
      class="header"
      @log-out="logOut"
      @on-destroy-room="onDestroyRoom"
      @on-exit-room="onExitRoom"
    ></room-header>
    <room-content
      ref="roomContentRef"
      v-tap="handleRoomContentTap"
      :show-room-tool="showRoomTool"
      class="content"
    ></room-content>
    <room-footer v-show="showRoomTool" class="footer" @on-destroy-room="onDestroyRoom" @on-exit-room="onExitRoom" />
    <room-sidebar></room-sidebar>
    <room-setting></room-setting>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, Ref, watch, computed } from 'vue';
import RoomHeader from './components/RoomHeader/index/index.vue';
import RoomFooter from './components/RoomFooter/index/index.vue';
import RoomSidebar from './components/RoomSidebar/index.vue';
import RoomContent from './components/RoomContent/index.vue';
import RoomSetting from './components/RoomSetting/index.vue';
import { debounce, throttle } from './utils/utils';
import { useBasicStore } from './stores/basic';
import { isMobile, isWeChat } from './utils/environment';
import './directives/vTap';
import { TUIKickedOutOfRoomReason } from '@tencentcloud/tuiroom-engine-electron';

import TUIRoomAegis from './utils/aegis';
import { MESSAGE_DURATION } from './constants/message';

import TUIMessageBox from './components/common/base/MessageBox/index';
import TUIMessage from './components/common/base/Message/index';
import { roomService, EventType, RoomParam, RoomInitData } from './services/index';
import useDeviceManager from './hooks/useDeviceManager';

useDeviceManager({ listenForDeviceChange: true });

const { t } = roomService;
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

const basicStore = useBasicStore();

const showMessageBox = (data: {
  code?: number;
  message: string;
  title: string;
  confirmButtonText: string;
  appendToRoomContainer?: boolean;
  callback?: () => void;
}) => {
  const {
    message,
    title = roomService.t('Note'),
    confirmButtonText = roomService.t('Sure'),
    appendToRoomContainer = true,
    callback = () => { },
  } = data;
  TUIMessageBox({
    title,
    message,
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
  roomService.on(EventType.ROOM_NOTICE_MESSAGE, showMessage);
  roomService.on(EventType.ROOM_NOTICE_MESSAGE_BOX, showMessageBox);
  roomService.on(EventType.ROOM_KICKED_OUT, onKickedOutOfRoom);
  roomService.on(EventType.ROOM_USER_SIG_EXPIRED, onUserSigExpired);
  roomService.on(EventType.ROOM_KICKED_OFFLINE, onKickedOffLine);
});
onUnmounted(() => {
  roomService.off(EventType.ROOM_NOTICE_MESSAGE, showMessage);
  roomService.off(EventType.ROOM_NOTICE_MESSAGE_BOX, showMessageBox);
  roomService.off(EventType.ROOM_KICKED_OUT, onKickedOutOfRoom);
  roomService.off(EventType.ROOM_USER_SIG_EXPIRED, onUserSigExpired);
  roomService.off(EventType.ROOM_KICKED_OFFLINE, onKickedOffLine);
});

const { sdkAppId, showHeaderTool } = roomService.basicStore;
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
const tuiRoomClass = computed(() => (isMobile ? ['tui-room', `tui-theme-${roomService.basicStore.defaultTheme}`, 'tui-room-h5'] : ['tui-room', `tui-theme-${roomService.basicStore.defaultTheme}`]));
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
  emit('on-destroy-room');
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

// To do 临时注释，待放开
// const onStatistics = (statistics: TRTCStatistics) => {
//   basicStore.setStatistics(statistics);
// };

function resetStore() {
  roomService.resetStore();
}

const logOut = () => {
  roomService.logOut();
  emit('on-log-out');
};

const onDestroyRoom = (info: { code: number; message: string }) => {
  roomService.emit(EventType.ROOM_DESTROY);
  roomService.resetStore();
  emit('on-destroy-room', info);
};

const onExitRoom = (info: { code: number; message: string }) => {
  roomService.resetStore();
  emit('on-exit-room', info);
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
@import './assets/style/global.scss';
@import './assets/style/black-theme.scss';
@import './assets/style/white-theme.scss';

.tui-room :not([class|='el']) {
  transition: background-color 0.3s, color 0.3s, box-shadow 0.3s;
}
</style>

<style lang="scss" scoped>
.tui-theme-white .tui-room {
  --header-shadow-color: #e3eaf7;
  --footer-shadow-color: rgba(197, 210, 229, 0.2);
}

.tui-theme-black .tui-room {
  --header-shadow-color: rgba(34, 38, 46, 0.3);
  --footer-shadow-color: rgba(34, 38, 46, 0.3);
}

.tui-room {
  width: 100%;
  height: 100%;
  position: relative;
  color: var(--font-color-1);
  background-color: var(--background-color-1);
  display: flex;
  flex-direction: column;
  text-align: left;

  .header {
    width: 100%;
    height: 64px;
    background-color: var(--background-color-2);
    box-shadow: 0px 1px 0px var(--header-shadow-color);
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }

  .content {
    width: 100%;
    height: 100%;
    background-color: var(--background-color-1);
    position: absolute;
    top: 0;
  }
}
</style>
