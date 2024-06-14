<template>
  <div v-if="conferenceShow" id="roomContainer" ref="roomRef" :class="tuiRoomClass">
    <room-header
      v-show="showRoomTool && showHeaderTool"
      class="header"
      @log-out="logOut"
    ></room-header>
    <room-content
      ref="roomContentRef"
      v-tap="handleRoomContentTap"
      :show-room-tool="showRoomTool"
      class="content"
    ></room-content>
    <room-footer v-show="showRoomTool" class="footer" />
    <room-sidebar></room-sidebar>
    <room-setting></room-setting>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, Ref, watch, computed, withDefaults, defineProps } from 'vue';
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

import { MESSAGE_DURATION } from './constants/message';

import TUIMessageBox from './components/common/base/MessageBox/index';
import TUIMessage from './components/common/base/Message/index';
import { roomService, EventType, RoomParam, RoomInitData } from './services/index';
import useDeviceManager from './hooks/useDeviceManager';

const props = withDefaults(defineProps<{
  displayMode: 'permanent' | 'wake-up'
}>(), {
  displayMode: 'permanent',
});

const conferenceShow = computed(() => (props.displayMode === 'permanent' || !!basicStore.roomId));

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
  'on-kicked-out-of-room',
  'on-kicked-off-line',
  'on-userSig-expired',
]);

const basicStore = useBasicStore();

const showMessageBox = (data: {
  code?: number;
  message: string;
  title: string;
  confirmButtonText: string;
  callback?: () => void;
}) => {
  const {
    message,
    title = roomService.t('Note'),
    confirmButtonText = roomService.t('Sure'),
    callback = () => { },
  } = data;
  TUIMessageBox({
    title,
    message,
    confirmButtonText,
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
});

const { sdkAppId, showHeaderTool } = roomService.basicStore;
const tuiRoomClass = computed(() => {
  const roomClassList = ['tui-room', `tui-theme-${roomService.basicStore.defaultTheme}`];
  if (isMobile) {
    roomClassList.push('tui-room-h5');
  }
  if (basicStore.scene === 'chat') {
    roomClassList.push('chat-room');
  }
  return roomClassList;
});

/**
 * Handle page mouse hover display toolbar logic
 *
 **/
const roomContentRef = ref<InstanceType<typeof RoomContent>>();
const showRoomTool: Ref<boolean> = ref(true);
const roomRef: Ref<Node | undefined> = ref();
function handleHideRoomTool() {
  showRoomTool.value = false;
}

watch(() => roomRef.value, (newValue, oldValue) => {
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
  const { roomId, roomName, roomMode, roomParam } = options;
  roomService.createRoom({
    roomId,
    roomName,
    roomMode,
    roomParam,
  });
}

async function enterRoom(options: { roomId: string; roomParam?: RoomParam }) {
  await roomService.enterRoom(options);
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
  min-width: 850px;
  min-height: 400px;
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

  &.tui-room-h5 {
    width: 100%;
    height: 100%;
    min-width: initial;
    min-height: initial;
  }
}

#roomContainer {
  &.chat-room {
    position: absolute;
    margin: auto;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 999;
    height: 80%;
    width: 80%;
    border-radius: 10px;
  }
  &.tui-room-h5,.chat-room {
    width: 100%;
    height: 100%;
  }
}
</style>
