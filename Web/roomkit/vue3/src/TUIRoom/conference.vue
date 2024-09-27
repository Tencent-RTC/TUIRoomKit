<template>
  <div
    v-if="conferenceShow"
    id="roomContainer"
    ref="roomRef"
    :class="tuiRoomClass"
  >
    <room-header
      v-show="showRoomTool && showHeaderTool"
      class="header"
      @log-out="logOut"
    />
    <room-content
      ref="roomContentRef"
      v-tap.lazy="handleRoomContentTap"
      :show-room-tool="showRoomTool"
      class="content"
    />
    <room-footer
      v-show="showRoomTool"
      class="footer"
      @show-overlay="handleShowOverlay"
    />
    <room-sidebar />
    <room-setting />
    <AISubtitlesOverlay v-if="overlayMap.AISubtitlesOverlay.visible" />
    <loading-overlay v-if="isShowLoading" />
    <password-dialog
      :visible="isShowPasswordContainer"
      @join-conference="enterRoom"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  Ref,
  watch,
  computed,
  withDefaults,
  defineProps,
  defineExpose,
  defineEmits,
} from 'vue';
import RoomHeader from './components/RoomHeader/index';
import RoomFooter from './components/RoomFooter/index';
import RoomSidebar from './components/RoomSidebar';
import RoomContent from './components/RoomContent/index.vue';
import RoomSetting from './components/RoomSetting/index.vue';
import LoadingOverlay from './components/PreRoom/LoadingOverlay.vue';
import PasswordDialog from './components/PreRoom/PasswordDialog.vue';
import AISubtitlesOverlay from './components/AITools/AISubtitles.vue';
import { debounce, throttle } from './utils/utils';
import { useBasicStore } from './stores/basic';
import { isMobile, isWeChat } from './utils/environment';
import vTap from './directives/vTap';
import {
  TUIKickedOutOfRoomReason,
  TUIErrorCode,
} from '@tencentcloud/tuiroom-engine-js';

import { MESSAGE_DURATION } from './constants/message';

import TUIMessageBox from './components/common/base/MessageBox/index';
import TUIMessage from './components/common/base/Message/index';
import useTRTCDetect from './hooks/useTRTCDetect';
import {
  roomService,
  EventType,
  RoomParam,
  RoomInitData,
} from './services/index';
import useDeviceManager from './hooks/useDeviceManager';
import useCustomizedAutoPlayDialog from './hooks/useCustomizedAutoPlayDialog';

const isShowPasswordContainer = ref(false);
const isShowLoading = ref(true);
const props = withDefaults(
  defineProps<{
    displayMode: 'permanent' | 'wake-up';
  }>(),
  {
    displayMode: 'permanent',
  }
);

const overlayMap = ref<{
  AISubtitlesOverlay: { visible: boolean };
  [key: string]: { visible: boolean };
}>({
  AISubtitlesOverlay: { visible: false },
});

const conferenceShow = computed(
  () => props.displayMode === 'permanent' || !!basicStore.roomId
);

useCustomizedAutoPlayDialog();
useTRTCDetect();
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
  duration?: number;
  cancelButtonText: string;
  confirmButtonText: string;
  callback?: () => void;
}) => {
  const {
    message,
    title = roomService.t('Note'),
    duration,
    cancelButtonText,
    confirmButtonText = roomService.t('Sure'),
    callback = () => {},
  } = data;
  TUIMessageBox({
    title,
    message,
    duration,
    cancelButtonText,
    confirmButtonText,
    callback,
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

const handleShowOverlay = (data: { name: string; visible: boolean }) => {
  if (overlayMap.value[data.name]) {
    overlayMap.value[data.name].visible = data.visible;
  }
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
  roomService.on(EventType.ROOM_NEED_PASSWORD, onRoomNeedPassword);
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
  roomService.off(EventType.ROOM_NEED_PASSWORD, onRoomNeedPassword);
  roomService.resetStore();
});

const { showHeaderTool } = roomService.basicStore;
const tuiRoomClass = computed(() => {
  const roomClassList = [
    'tui-room',
    `tui-theme-${roomService.basicStore.defaultTheme}`,
  ];
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

watch(
  () => roomRef.value,
  (newValue, oldValue) => {
    if (!isWeChat && !isMobile) {
      if (newValue) {
        addRoomContainerEvent(newValue);
      } else {
        oldValue && removeRoomContainerEvent(oldValue);
      }
    }
  }
);

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

function onRoomNeedPassword(code: TUIErrorCode) {
  if (code === TUIErrorCode.ERR_NEED_PASSWORD) {
    isShowPasswordContainer.value = true;
  }
}

function resetStore() {
  roomService.resetStore();
}

const logOut = () => {
  roomService.logOut();
};

const onStartRoom = () => {
  isShowLoading.value = false;
  emit('on-create-room', { code: 0, message: 'create room' });
};

const onJoinRoom = () => {
  isShowLoading.value = false;
  isShowPasswordContainer.value = false;
  emit('on-enter-room', { code: 0, message: 'enter room' });
};

const onLeaveRoom = () => {
  emit('on-exit-room', { code: 0, message: 'exit room' });
};

const onDismissRoom = () => {
  emit('on-destroy-room', { code: 0, message: 'destroy room' });
};

const onLogout = () => {
  emit('on-log-out', { code: 0, message: 'user logout' });
};

const onKickedOutOfRoom = async (eventInfo: {
  roomId: string;
  reason: TUIKickedOutOfRoomReason;
  message: string;
}) => {
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
  transition:
    background-color 0.3s,
    color 0.3s,
    box-shadow 0.3s;
}
</style>

<style lang="scss" scoped>
.tui-room {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 850px;
  height: 100%;
  min-height: 400px;
  color: var(--font-color-1);
  text-align: left;
  background-color: var(--background-color-1);

  .header {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
    width: 100%;
    height: 64px;
    background-color: var(--background-color-2);
    box-shadow: 0 1px 0 var(--header-shadow-color);
  }

  .content {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: var(--background-color-1);
  }

  &.tui-room-h5 {
    width: 100%;
    min-width: 350px;
    height: 100%;
    min-height: 525px;
  }
}

#roomContainer {
  &.chat-room {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 999;
    width: 80%;
    height: 80%;
    margin: auto;
    border-radius: 10px;
  }

  &.tui-room-h5,
  .chat-room {
    width: 100%;
    height: 100%;
  }
}

.tui-theme-white .tui-room {
  --header-shadow-color: #e3eaf7;
  --footer-shadow-color: rgba(197, 210, 229, 0.2);
}

.tui-theme-black .tui-room {
  --header-shadow-color: rgba(34, 38, 46, 0.3);
  --footer-shadow-color: rgba(34, 38, 46, 0.3);
}

.tui-theme-white.tui-room {
  --header-shadow-color: #e3eaf7;
  --footer-shadow-color: rgba(197, 210, 229, 0.2);
}

.tui-theme-black.tui-room {
  --header-shadow-color: rgba(34, 38, 46, 0.3);
  --footer-shadow-color: rgba(34, 38, 46, 0.3);
}
</style>
