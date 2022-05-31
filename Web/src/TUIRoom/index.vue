<template>
  <div id="roomContainer" ref="roomRef" class="tui-room">
    <room-header v-show="showRoomTool" class="header" @log-out="logOut"></room-header>
    <room-content ref="roomContentRef" :show-room-tool="showRoomTool" class="content"></room-content>
    <room-footer
      v-show="showRoomTool"
      class="footer"
      @on-room-destroy="onRoomDestroy"
      @on-room-exit="onRoomExit"
    />
    <room-sidebar></room-sidebar>
    <room-setting></room-setting>
  </div>
</template>

<script setup lang="ts">
import RoomHeader from './components/RoomHeader/index.vue';
import RoomContent from './components/RoomContent/index.vue';
import RoomFooter from './components/RoomFooter/index.vue';
import RoomSidebar from './components/RoomSidebar/index.vue';
import RoomSetting from './components/RoomSetting/index.vue';
import { useBasicStore } from './stores/basic';
import { useStreamStore } from './stores/stream';
import { useChatStore } from './stores/chat';
import TUIRoomCore, { ETUIRoomEvents, ETUIRoomRole, ETUISpeechMode, TRTCStatistics } from './tui-room-core';
import { ref, onMounted, onUnmounted, Ref } from 'vue';
import { debounce, throttle } from './utils/utils';
import logger from './tui-room-core/common/logger';

defineExpose({
  init,
  createRoom,
  enterRoom,
});

const emit = defineEmits(['onLogOut', 'onCreateRoom', 'onEnterRoom', 'onRoomExit', 'onRoomDestroy']);

const logPrefix = '[Room]';

const basicStore = useBasicStore();
const streamStore = useStreamStore();
const chatStore = useChatStore();

// 处理页面鼠标悬浮显示工具栏逻辑
const roomContentRef = ref<InstanceType<typeof RoomContent>>();
const showRoomTool: Ref<boolean> = ref(true);
const roomRef: Ref<Node | undefined> = ref();
function handleHideRoomTool() {
  showRoomTool.value = false;
}

const handleHideRoomToolDebounce = debounce(handleHideRoomTool, 5000);
const handleHideRoomToolThrottle = throttle(handleHideRoomToolDebounce, 1000);

onMounted(() => {
  roomRef.value?.addEventListener('mouseenter', () => {
    showRoomTool.value = true;
    handleHideRoomToolDebounce();
  });
  roomRef.value?.addEventListener('click', () => {
    showRoomTool.value = true;
    handleHideRoomToolDebounce();
  }, false);
  roomRef.value?.addEventListener('mousemove', () => {
    showRoomTool.value = true;
    handleHideRoomToolThrottle();
  });
  roomRef.value?.addEventListener('mouseleave', () => {
    showRoomTool.value = false;
  });
});

onUnmounted(() => {
  roomRef.value?.removeEventListener('mouseenter', () => {
    showRoomTool.value = true;
    handleHideRoomToolDebounce();
  });
  roomRef.value?.removeEventListener('click', () => {
    showRoomTool.value = true;
    handleHideRoomToolDebounce();
  }, false);
  roomRef.value?.removeEventListener('mousemove', () => {
    showRoomTool.value = true;
    handleHideRoomToolThrottle();
  });
  roomRef.value?.removeEventListener('mouseleave', () => {
    showRoomTool.value = false;
  });
});

interface RoomParam {
	isOpenCamera: boolean,
	isOpenMicrophone: boolean,
	defaultCameraId: string,
	defaultMicrophoneId: string,
	defaultSpeakerId: string,
}

interface RoomInitData {
  sdkAppId: number,
  userId: string,
  userSig: string,
  userName: string,
  userAvatar: string,
  shareUserId?: string,
  shareUserSig?: string,
}

async function init(option: RoomInitData) {
  basicStore.setBasicInfo(option);
  streamStore.addLocalStream(option);

  const { sdkAppId, userId, userSig, userName, userAvatar } = option;

  await TUIRoomCore.login(sdkAppId, userId, userSig);

  TUIRoomCore.updateMyProfile({
    nick: userName,
    avatar: userAvatar || '',
  });
}

async function createRoom(
  roomId: number,
  roomMode: ETUISpeechMode = ETUISpeechMode.FREE_SPEECH,
  roomParam?: RoomParam,
) {
  basicStore.setRoomId(roomId);
  basicStore.setRole(ETUIRoomRole.MASTER);
  streamStore.setRoomParam(roomParam);
  logger.debug(`${logPrefix}createRoom:`, roomId, roomMode, roomParam);
  await TUIRoomCore.createRoom(roomId, roomMode);
  basicStore.setMasterUserId(basicStore.userId);
  emit('onCreateRoom', {
    code: 0,
    message: 'create room success',
  });
}

async function enterRoom(roomId: number, roomParam?: RoomParam) {
  basicStore.setRoomId(roomId);
  basicStore.setRole(ETUIRoomRole.ANCHOR);
  streamStore.setRoomParam(roomParam);
  logger.debug(`${logPrefix}enterRoom:`, roomId, roomParam);
  await TUIRoomCore.enterRoom(roomId);
  const roomInfo = await TUIRoomCore.getRoomInfo();
  basicStore.setMasterUserId(roomInfo.ownerId);
  emit('onEnterRoom', {
    code: 0,
    message: 'enter room success',
  });
}

const onUserVoiceVolume = (eventInfo: []) => {
  streamStore.setAudioVolume(eventInfo);
};

const onNetworkQuality = (localQuality: Record<string, any>) => {
  basicStore.setLocalQuality(localQuality.quality);
};

const onStatistics = (statistics: TRTCStatistics) => {
  basicStore.setStatistics(statistics);
};

const onReceivedChatMessage = (message: any) => {
  chatStore.updateMessageList(message);
};

function resetStore() {
  basicStore.reset();
  chatStore.reset();
  streamStore.reset();
}

const logOut = () => {
  resetStore();
  emit('onLogOut');
};

const onRoomDestroy = (info: { code: number; message: string }) => {
  resetStore();
  emit('onRoomDestroy', info);
};

const onRoomExit = (info: { code: number; message: string }) => {
  resetStore();
  emit('onRoomExit', info);
};

onMounted(async () => {
  TUIRoomCore.enableAudioVolumeEvaluation(100);
  TUIRoomCore.on(ETUIRoomEvents.onUserVoiceVolume, onUserVoiceVolume);
  TUIRoomCore.on(ETUIRoomEvents.onNetworkQuality, onNetworkQuality);
  TUIRoomCore.on(ETUIRoomEvents.onStatistics, onStatistics);
  TUIRoomCore.on(ETUIRoomEvents.onReceiveChatMessage, onReceivedChatMessage);
});

onUnmounted(async () => {
  TUIRoomCore.off(ETUIRoomEvents.onUserVoiceVolume, onUserVoiceVolume);
  TUIRoomCore.off(ETUIRoomEvents.onNetworkQuality, onNetworkQuality);
  TUIRoomCore.on(ETUIRoomEvents.onStatistics, onStatistics);
  TUIRoomCore.off(ETUIRoomEvents.onReceiveChatMessage, onReceivedChatMessage);
});
</script>

<style lang="scss">
@import './assets/style/var.scss';

.tui-room {
  width: 100%;
  height: 100%;
  position: relative;
  * {
    color: $fontColor;
    box-sizing: border-box;
    text-align: start;
    user-select: none;
  }
  .header {
    width: 100%;
    height: 48px;
    background-color: $toolBarBackgroundColor;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  }
  .content {
    width: 100%;
    height: 100%;
    background-color: $roomBackgroundColor;
  }
  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 80px;
    background-color: $toolBarBackgroundColor;
  }
}
</style>
