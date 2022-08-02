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
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, onMounted, onUnmounted, Ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import RoomHeader from './components/RoomHeader/index.vue';
import RoomContent from './components/RoomContent/index.vue';
import RoomFooter from './components/RoomFooter/index.vue';
import RoomSidebar from './components/RoomSidebar/index.vue';
import RoomSetting from './components/RoomSetting/index.vue';
import { useBasicStore } from './stores/basic';
import { useRoomStore } from './stores/room';
import { useChatStore } from './stores/chat';

import TUIRoomCore, {
  ETUIRoomEvents, ETUIRoomRole, ETUISpeechMode, TRTCStatistics, ETUIRoomMuteType,
} from './tui-room-core';

import { debounce, throttle } from './utils/utils';
import logger from './tui-room-core/common/logger';
import TUIRoomAegis from './utils/aegis';
import { MESSAGE_DURATION } from './constants/message';

defineExpose({
  init,
  createRoom,
  enterRoom,
});

const emit = defineEmits([
  'onLogOut', 'onCreateRoom', 'onEnterRoom',
  'onRoomExit', 'onRoomDestroy', 'onKickOff',
]);

const logPrefix = '[Room]';

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const chatStore = useChatStore();

const { sdkAppId } = storeToRefs(basicStore);

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
  roomStore.setLocalUser(option);

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
  logger.debug(`${logPrefix}createRoom:`, roomId, roomMode, roomParam);
  await TUIRoomCore.createRoom(roomId, roomMode);
  const roomInfo = await TUIRoomCore.getRoomInfo();
  basicStore.setRoomInfo(roomInfo);
  // setRoomParam 必须在 setRoomInfo 之后，因为 roomInfo 中有是否开启全员禁麦禁画的信息
  roomStore.setRoomParam(roomParam);
  emit('onCreateRoom', {
    code: 0,
    message: 'create room success',
  });
  TUIRoomAegis.reportEvent({ name: 'createRoom', ext1: 'createRoom-success' });
}

async function enterRoom(roomId: number, roomParam?: RoomParam) {
  basicStore.setRoomId(roomId);
  logger.debug(`${logPrefix}enterRoom:`, roomId, roomParam);
  await TUIRoomCore.enterRoom(roomId);
  const roomInfo = await TUIRoomCore.getRoomInfo();
  basicStore.setRoomInfo(roomInfo);
  // setRoomParam 必须在 setRoomInfo 之后，因为 roomInfo 中有是否开启全员禁麦禁画的信息
  roomStore.setRoomParam(roomParam);
  emit('onEnterRoom', {
    code: 0,
    message: 'enter room success',
  });
  TUIRoomAegis.reportEvent({ name: 'enterRoom', ext1: 'enterRoom-success' });
}

const onUserVoiceVolume = (eventInfo: []) => {
  roomStore.setAudioVolume(eventInfo);
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
  roomStore.reset();
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

const onMicrophoneMuted = (data: {mute: boolean, muteType: ETUIRoomMuteType}) => {
  if (data.muteType === ETUIRoomMuteType.MasterMuteAll) {
    const tipMessage = data.mute ? '主持人已开启全体静音' : '主持人已解除全体静音';
    ElMessage({
      type: 'warning',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    basicStore.setIsMuteAllAudio(data.mute);
    // 如果主持人解除全员禁言，不主动调起用户麦克风
    if (data.mute) {
      roomStore.setIsLocalAudioMuted(true);
      TUIRoomCore.muteLocalMicrophone(true);
    }
    basicStore.setCanControlSelfAudio(!data.mute);
  }

  if (data.muteType === ETUIRoomMuteType.MasterMuteCurrentUser) {
    const tipMessage = data.mute ? '主持人已关闭您的麦克风' : '主持人已允许您开启麦克风';
    ElMessage({
      type: 'warning',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    if (data.mute) {
      roomStore.setIsLocalAudioMuted(true);
      TUIRoomCore.muteLocalMicrophone(true);
      // 主持人开启全员禁言时，单独打开再关闭单人的麦克风，此时对应用户的麦克风状态为无法操作
      basicStore.setCanControlSelfAudio(!basicStore.isMuteAllAudio);
    } else {
      basicStore.setCanControlSelfAudio(true);
    }
  }
};

const onCameraMuted = (data: {mute: boolean; muteType: ETUIRoomMuteType}) => {
  if (data.muteType === ETUIRoomMuteType.MasterMuteAll) {
    basicStore.setIsMuteAllVideo(data.mute);
    const tipMessage = data.mute ? '主持人已开启全体禁画' : '主持人已解除全体禁画';
    ElMessage({
      type: 'warning',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    // 如果主持人解除全员禁画，不主动调起用户摄像头
    if (data.mute) {
      roomStore.setIsLocalVideoMuted(true);
      TUIRoomCore.stopCameraPreview();
    }
    basicStore.setCanControlSelfVideo(!data.mute);
  }

  if (data.muteType === ETUIRoomMuteType.MasterMuteCurrentUser) {
    const tipMessage = data.mute ? '主持人已关闭您的摄像头' : '主持人已允许你开启摄像头';
    ElMessage({
      type: 'warning',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    if (data.mute) {
      roomStore.setIsLocalVideoMuted(true);
      TUIRoomCore.stopCameraPreview();
      // 主持人开启全员禁画时，单独打开再关闭单人的摄像头，此时对应用户的摄像头状态为无法操作
      basicStore.setCanControlSelfVideo(!basicStore.isMuteAllVideo);
    } else {
      basicStore.setCanControlSelfVideo(true);
    }
  }
};

const onUserChatRoomMuted = (data: {mute: boolean; muteType: ETUIRoomMuteType}) => {
  const tipMessage = data.mute ? '您被主持人禁止文字聊天' : '您被主持人允许文字聊天';
  ElMessage({
    type: 'warning',
    message: tipMessage,
    duration: MESSAGE_DURATION.NORMAL,
  });
  if (data.muteType === ETUIRoomMuteType.MasterMuteCurrentUser) {
    chatStore.setIsMuteChatByMater(data.mute);
  }
};

const onUserKickOff = async () => {
  try {
    const response = await TUIRoomCore.exitRoom();
    await TUIRoomCore.logout();
    logger.log(`${logPrefix}leaveRoom:`, response);
    resetStore();
    ElMessageBox.alert('被主持人踢出房间', '通知', {
      confirmButtonText: '确认',
      callback: async () => {
        emit('onKickOff', { code: 0, message: '' });
      },
    });
  } catch (error) {
    logger.error(`${logPrefix}onUserKickOff error:`, error);
  }
};

function handlePageLeave() {
  if (!basicStore.isMaster) {
    TUIRoomCore.exitRoom();
  }
}

// 页面刷新或者管理
function beforeunloadFn() {
  handlePageLeave();
}

onMounted(async () => {
  TUIRoomCore.enableAudioVolumeEvaluation(100);
  TUIRoomCore.on(ETUIRoomEvents.onUserVoiceVolume, onUserVoiceVolume);
  TUIRoomCore.on(ETUIRoomEvents.onNetworkQuality, onNetworkQuality);
  TUIRoomCore.on(ETUIRoomEvents.onStatistics, onStatistics);
  TUIRoomCore.on(ETUIRoomEvents.onReceiveChatMessage, onReceivedChatMessage);
  TUIRoomCore.on(ETUIRoomEvents.onMicrophoneMuted, onMicrophoneMuted);
  TUIRoomCore.on(ETUIRoomEvents.onCameraMuted, onCameraMuted);
  TUIRoomCore.on(ETUIRoomEvents.onUserChatRoomMuted, onUserChatRoomMuted);
  TUIRoomCore.on(ETUIRoomEvents.onUserKickOff, onUserKickOff);
  window.addEventListener('beforeunload', beforeunloadFn);
});

onUnmounted(() => {
  handlePageLeave();
  TUIRoomCore.off(ETUIRoomEvents.onUserVoiceVolume, onUserVoiceVolume);
  TUIRoomCore.off(ETUIRoomEvents.onNetworkQuality, onNetworkQuality);
  TUIRoomCore.off(ETUIRoomEvents.onStatistics, onStatistics);
  TUIRoomCore.off(ETUIRoomEvents.onReceiveChatMessage, onReceivedChatMessage);
  TUIRoomCore.off(ETUIRoomEvents.onMicrophoneMuted, onMicrophoneMuted);
  TUIRoomCore.off(ETUIRoomEvents.onCameraMuted, onCameraMuted);
  TUIRoomCore.off(ETUIRoomEvents.onUserChatRoomMuted, onUserChatRoomMuted);
  TUIRoomCore.off(ETUIRoomEvents.onUserKickOff, onUserKickOff);
  window.removeEventListener('beforeunload', beforeunloadFn);
});

watch(sdkAppId, (val) => {
  if (val) {
    TUIRoomAegis.setSdkAppId(val);
    TUIRoomAegis.reportEvent({
      name: 'loaded',
      ext1: 'loaded-success',
    });
  }
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
