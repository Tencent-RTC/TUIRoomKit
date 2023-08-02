<template>
  <div id="roomContainer" ref="roomRef" class="tui-room">
    <room-header
      v-show="showRoomTool && showHeaderTool"
      class="header"
      @log-out="logOut"
      @on-destroy-room="onDestroyRoom"
      @on-exit-room="onExitRoom"
    ></room-header>
    <room-content ref="roomContentRef" :show-room-tool="showRoomTool" class="content"></room-content>
    <!-- <chat-room-content v-if="isMobile"></chat-room-content> -->
    <room-footer
      v-show="showRoomTool"
      class="footer"
      @on-destroy-room="onDestroyRoom"
      @on-exit-room="onExitRoom"
    />
    <room-sidebar
      @on-exit-room="onExitRoom"
    ></room-sidebar>
    <room-setting></room-setting>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from './elementComp';
import { ref, onMounted, onUnmounted, Ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import RoomHeader from './components/RoomHeader/index';
import RoomFooter from './components/RoomFooter/index';
import RoomSidebar from './components/RoomSidebar';
import RoomContent from './components/RoomContent/index.vue';
import RoomSetting from './components/RoomSetting/index.vue';
// import chatRoomContent from './components/RoomContent/ChatRoomContent.vue';
import { isElectronEnv, debounce, throttle } from './utils/utils';
import { useBasicStore } from './stores/basic';
import { useRoomStore } from './stores/room';
import { useChatStore } from './stores/chat';
import isMobile from './utils/useMediaValue';
import logger from '../TUIRoom/utils/common/logger';
import TUIRoomEngine, {
  TRTCVideoMirrorType,
  TRTCVideoRotation,
  TRTCVideoFillMode,
  TUIRoomEvents,
  TUIRoomType,
  TRTCDeviceType,
  TRTCDeviceState,
  TUISpeechMode,
  TUIKickedOutOfRoomReason,
  TRTCVideoResolution,
  TRTCVideoEncParam,
} from '@tencentcloud/tuiroom-engine-js';


import TUIRoomAegis from './utils/aegis';
import { MESSAGE_DURATION } from './constants/message';
import { useI18n } from './locales';

import useGetRoomEngine from './hooks/useRoomEngine';

const isElectron = isElectronEnv();
const roomEngine = useGetRoomEngine();
const { t } = useI18n();

defineExpose({
  init,
  createRoom,
  enterRoom,
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

const logPrefix = '[Room]';

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const chatStore = useChatStore();

const { sdkAppId, showHeaderTool } = storeToRefs(basicStore);
const { localUser, localVideoQuality } = storeToRefs(roomStore);

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

const handleHideRoomToolDebounce = debounce(handleHideRoomTool, 5000);
const handleHideRoomToolThrottle = throttle(handleHideRoomToolDebounce, 1000);

const smallParam =  new TRTCVideoEncParam();
smallParam.videoResolution = TRTCVideoResolution.TRTCVideoResolution_640_360;
smallParam.videoFps = 10;
smallParam.videoBitrate = 550;

onMounted(async () => {
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
  const defaults = basicStore.defaultTheme;
  const storageCurrentTheme = localStorage.getItem('tuiRoom-currentTheme') || defaults;
  basicStore.setDefaultTheme(storageCurrentTheme);
  document.body.setAttribute('data-theme', storageCurrentTheme);
  if (isMobile) {
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    await trtcCloud?.setLocalRenderParams({
      mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Auto,
      rotation: TRTCVideoRotation.TRTCVideoRotation0,
      fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
    });
  }
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
  avatarUrl: string,
  showHeaderTool: boolean,
  theme?: {
    defaultTheme: 'black' | 'white',
    isSupportSwitchTheme: boolean,
  },
}

async function init(option: RoomInitData) {
  basicStore.setBasicInfo(option);
  roomStore.setLocalUser(option);
  const { sdkAppId, userId, userSig, userName, avatarUrl } = option;
  await TUIRoomEngine.login({ sdkAppId, userId, userSig });
  await TUIRoomEngine.setSelfInfo({ userName, avatarUrl });
}

async function createRoom(options: {
  roomId: string,
  roomName: string,
  roomMode: 'FreeToSpeak' | 'SpeakAfterTakingSeat',
  roomParam?: RoomParam,
}) {
  const { roomId, roomName, roomMode, roomParam } = options;
  if (!roomEngine.instance) {
    return;
  }
  basicStore.setRoomId(roomId);
  logger.debug(`${logPrefix}createRoom:`, roomId, roomMode, roomParam);
  const roomParams = {
    roomId,
    name: roomName,
    roomType: TUIRoomType.kConference,
  };
  if (roomMode === 'FreeToSpeak') {
    Object.assign(roomParams, {
      speechMode: TUISpeechMode.kFreeToSpeak,
    });
  } else {
    Object.assign(roomParams, {
      speechMode: TUISpeechMode.kSpeakAfterTakingSeat,
    });
  }
  await roomEngine.instance?.createRoom(roomParams);
  emit('on-create-room', {
    code: 0,
    message: 'create room success',
  });
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  trtcCloud.setDefaultStreamRecvMode(true, false);
  trtcCloud.enableSmallVideoStream(true, smallParam);
  const roomInfo = await roomEngine.instance?.enterRoom({ roomId });
  emit('on-enter-room', {
    code: 0,
    message: 'enter room success',
  });
  roomStore.setRoomInfo(roomInfo);
  // 申请发言模式房主上麦
  if (roomInfo.speechMode === TUISpeechMode.kSpeakAfterTakingSeat) {
    await roomEngine.instance?.takeSeat({ seatIndex: -1, timeout: 0 });
  }

  await getUserList();
  /**
   * setRoomParam must come after setRoomInfo,because roomInfo contains information
   * about whether or not to turn on the no-mac ban.
   *
   * setRoomParam 必须在 setRoomInfo 之后，因为 roomInfo 中有是否开启全员禁麦禁画的信息
  **/
  roomStore.setRoomParam(roomParam);
  TUIRoomAegis.reportEvent({ name: 'createRoom', ext1: 'createRoom-success' });
}

async function enterRoom(options: {roomId: string, roomParam?: RoomParam }) {
  const { roomId, roomParam } = options;
  if (!roomEngine.instance) {
    return;
  }
  basicStore.setRoomId(roomId);
  logger.debug(`${logPrefix}enterRoom:`, roomId, roomParam);
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  trtcCloud.setDefaultStreamRecvMode(true, false);
  trtcCloud.enableSmallVideoStream(true, smallParam);
  const roomInfo = await roomEngine.instance?.enterRoom({ roomId });
  roomStore.setRoomInfo(roomInfo);
  await getUserList();
  /**
   * setRoomParam must come after setRoomInfo,because roomInfo contains information
   * about whether or not to turn on the no-mac ban.
   *
   * setRoomParam 必须在 setRoomInfo 之后，因为 roomInfo 中有是否开启全员禁麦禁画的信息
  **/
  roomStore.setRoomParam(roomParam);
  emit('on-enter-room', {
    code: 0,
    message: 'enter room success',
  });
  TUIRoomAegis.reportEvent({ name: 'enterRoom', ext1: 'enterRoom-success' });
}

async function getUserList() {
  try {
    const { userInfoList } = await roomEngine.instance?.getUserList() as any;
    roomStore.setUserList(userInfoList);
  } catch (error: any) {
    logger.error('TUIRoomEngine.getUserList', error.code, error.message);
  }
}

const onUserVoiceVolumeChanged = (eventInfo: { userVolumeList: []}) => {
  const { userVolumeList } = eventInfo;
  roomStore.setAudioVolume(userVolumeList);
};

const onUserNetworkQualityChanged = (eventInfo: { userNetworkList: [] }) => {
  basicStore.setLocalQuality(eventInfo.userNetworkList);
};

// To do 临时注释，待放开
// const onStatistics = (statistics: TRTCStatistics) => {
//   basicStore.setStatistics(statistics);
// };

function resetStore() {
  basicStore.reset();
  chatStore.reset();
  roomStore.reset();
}

const logOut = () => {
  resetStore();
  emit('on-log-out');
};

const onDestroyRoom = (info: { code: number; message: string }) => {
  resetStore();
  emit('on-destroy-room', info);
};

const onExitRoom = (info: { code: number; message: string }) => {
  resetStore();
  emit('on-exit-room', info);
};

const onError = (error: any) => {
  logger.error('roomEngine.onError: ', error);
};

const onSendMessageForUserDisableChanged = (data: { userId: string, isDisable: boolean }) => {
  const { userId, isDisable } = data;
  if (userId === localUser.value.userId) {
    const tipMessage = isDisable ? t('You have been banned from text chat by the host') : t('You are allowed to text chat by the host');
    ElMessage({
      type: 'warning',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    chatStore.setSendMessageDisableChanged(isDisable);
  }
};

const onKickedOutOfRoom = async (eventInfo: { roomId: string, reason: TUIKickedOutOfRoomReason, message: string }) => {
  const { roomId, reason, message } = eventInfo;
  try {
    resetStore();
    let notice = '';
    switch (reason) {
      case TUIKickedOutOfRoomReason.kKickedByAdmin:
        notice = t('kicked out of the room by the host');
        break;
      case TUIKickedOutOfRoomReason.kKickedByLoggedOnOtherDevice:
        notice = t('kicked out of the room by other device');
        break;
      case TUIKickedOutOfRoomReason.kKickedByServer:
        notice = t('kicked out of the room by serve');
        break;
    }
    ElMessageBox.alert(notice, t('Note'), {
      confirmButtonText: t('Confirm'),
      customClass: 'custom-element-class',
      appendTo: '#roomContainer',
      callback: async () => {
        emit('on-kicked-out-of-room', { roomId, reason, message });
      },
    });
  } catch (error) {
    logger.error(`${logPrefix}onKickedOutOfRoom error:`, error);
  }
};

const onUserSigExpired = () => {
  ElMessageBox.alert('userSig 已过期', t('Note'), {
    confirmButtonText: t('Confirm'),
    customClass: 'custom-element-class',
    appendTo: '#roomContainer',
    callback: async () => {
      emit('on-userSig-expired');
    },
  });
};

const onKickedOffLine = (eventInfo: { message: string }) => {
  const { message } = eventInfo;
  ElMessageBox.alert('系统检测到您的账号被踢下线', t('Note'), {
    confirmButtonText: t('Confirm'),
    customClass: 'custom-element-class',
    appendTo: '#roomContainer',
    callback: async () => {
      emit('on-kicked-off-line', { message });
    },
  });
};

// todo: 处理禁言所有人和禁画所有人
async function handleAudioStateChange(isDisableAudio: boolean) {
  const tipMessage = isDisableAudio ? t('The host has muted all') : t('The host has unmuted all');
  ElMessage({
    type: 'warning',
    message: tipMessage,
    duration: MESSAGE_DURATION.NORMAL,
  });
  /**
   * If the host lifts the full ban and does not actively turn up the user microphone
   *
   * 如果主持人解除全员禁言，不主动调起用户麦克风
  **/
  if (isDisableAudio) {
    await roomEngine.instance?.closeLocalMicrophone();
  }
}

async function handleVideoStateChange(isDisableVideo: boolean) {
  const tipMessage = isDisableVideo ? t('The host has turned on the ban on all paintings') : t('The host has lifted the ban on all paintings');
  ElMessage({
    type: 'warning',
    message: tipMessage,
    duration: MESSAGE_DURATION.NORMAL,
  });
  /**
   * If the host lifts the full ban on drawing and does not actively turn up the user camera
   *
   * 如果主持人解除全员禁画，不主动调起用户摄像头
  **/
  if (isDisableVideo) {
    await roomEngine.instance?.closeLocalCamera();
  }
}

async function handleMessageStateChange(isDisableMessage: boolean) {
  const tipMessage = isDisableMessage ? t('The host has turned on the ban on all chat') : t('The host has lifted the ban on all chat');
  ElMessage({
    type: 'warning',
    message: tipMessage,
    duration: MESSAGE_DURATION.NORMAL,
  });
}

const onAllUserCameraDisableChanged =  async (eventInfo: { roomId: string, isDisable: boolean }) => {
  const { isDisable } = eventInfo;
  if (isDisable !== roomStore.isCameraDisableForAllUser) {
    handleVideoStateChange(isDisable);
  }
  roomStore.setDisableCameraForAllUserByAdmin(isDisable);
  roomStore.setCanControlSelfVideo(!roomStore.isCameraDisableForAllUser);
};

const onAllUserMicrophoneDisableChanged = async (eventInfo: { roomId: string, isDisable: boolean }) => {
  const { isDisable } = eventInfo;
  if (isDisable !== roomStore.isMicrophoneDisableForAllUser) {
    handleAudioStateChange(isDisable);
  }
  roomStore.setDisableMicrophoneForAllUserByAdmin(isDisable);
  roomStore.setCanControlSelfAudio(!roomStore.isMicrophoneDisableForAllUser);
};

const onSendMessageForAllUserDisableChanged = async (eventInfo: { roomId: string, isDisable: boolean}) => {
  const { isDisable } = eventInfo;
  if (isDisable !== roomStore.isMessageDisableForAllUser) {
    handleMessageStateChange(isDisable);
  }
  roomStore.setDisableMessageAllUserByAdmin(isDisable);
};
// 初始化获取设备列表
async function getMediaDeviceList() {
  const cameraList = await roomEngine.instance?.getCameraDevicesList();
  const microphoneList = await roomEngine.instance?.getMicDevicesList();
  const speakerList = await roomEngine.instance?.getSpeakerDevicesList();
  roomStore.setCameraList(cameraList);
  roomStore.setMicrophoneList(microphoneList);
  roomStore.setSpeakerList(speakerList);

  if (isElectron) {
    const cameraInfo = roomEngine.instance?.getCurrentCameraDevice();
    const micInfo = roomEngine.instance?.getCurrentMicDevice();
    const speakerInfo = roomEngine.instance?.getCurrentSpeakerDevice();
    if (cameraInfo && cameraInfo.deviceId) {
      roomStore.setCurrentCameraId(cameraInfo.deviceId);
    }
    if (micInfo && micInfo.deviceId) {
      roomStore.setCurrentMicrophoneId(micInfo.deviceId);
    }
    if (speakerInfo && speakerInfo.deviceId) {
      roomStore.setCurrentSpeakerId(speakerInfo.deviceId);
    }
  } else {
    if (cameraList.length > 0) {
      await roomEngine.instance?.setCurrentCameraDevice({ deviceId: cameraList[0].deviceId });
    }
    if (microphoneList.length > 0) {
      await roomEngine.instance?.setCurrentMicDevice({ deviceId: microphoneList[0].deviceId });
    }
    if (speakerList.length > 0) {
      await roomEngine.instance?.setCurrentSpeakerDevice({ deviceId: speakerList[0].deviceId });
    }
  }
}

/**
 * Device changes: device switching, device plugging and unplugging events
 *
 * 设备变化：设备切换、设备插拔事件
**/
async function onDeviceChange(eventInfo: {deviceId: string, type: number, state: number}) {
  const stateList = ['add', 'remove', 'active'];
  const { deviceId, type, state } = eventInfo;
  if (type === TRTCDeviceType.TRTCDeviceTypeMic) {
    logger.log(`onDeviceChange: deviceId: ${deviceId}, type: microphone, state: ${stateList[state]}`);
    const deviceList = await roomEngine.instance?.getMicDevicesList();
    roomStore.setMicrophoneList(deviceList);
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentMicrophoneId(deviceId);
    }
    return;
  }
  if (type === TRTCDeviceType.TRTCDeviceTypeSpeaker) {
    logger.log(`onDeviceChange: deviceId: ${deviceId}, type: speaker, state: ${stateList[state]}`);
    const deviceList = await roomEngine.instance?.getSpeakerDevicesList();
    roomStore.setSpeakerList(deviceList);
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentSpeakerId(deviceId);
    }
    return;
  }
  if (type === TRTCDeviceType.TRTCDeviceTypeCamera) {
    logger.log(`onDeviceChange: deviceId: ${deviceId}, type: camera, state: ${stateList[state]}`);
    const deviceList = await roomEngine.instance?.getCameraDevicesList();
    roomStore.setCameraList(deviceList);
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentCameraId(deviceId);
    }
  }
}

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onError, onError);
  roomEngine.instance?.on(TUIRoomEvents.onUserVoiceVolumeChanged, onUserVoiceVolumeChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserNetworkQualityChanged, onUserNetworkQualityChanged);
  roomEngine.instance?.on(TUIRoomEvents.onKickedOutOfRoom, onKickedOutOfRoom);
  roomEngine.instance?.on(TUIRoomEvents.onSendMessageForUserDisableChanged, onSendMessageForUserDisableChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserSigExpired, onUserSigExpired);
  roomEngine.instance?.on(TUIRoomEvents.onKickedOffLine, onKickedOffLine);
  roomEngine.instance?.on(TUIRoomEvents.onAllUserCameraDisableChanged, onAllUserCameraDisableChanged);
  roomEngine.instance?.on(TUIRoomEvents.onAllUserMicrophoneDisableChanged, onAllUserMicrophoneDisableChanged);
  roomEngine.instance?.on(TUIRoomEvents.onSendMessageForAllUserDisableChanged, onSendMessageForAllUserDisableChanged);
  roomEngine.instance?.on(TUIRoomEvents.onDeviceChange, onDeviceChange);
  getMediaDeviceList();
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onError, onError);
  roomEngine.instance?.off(TUIRoomEvents.onUserVoiceVolumeChanged, onUserVoiceVolumeChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserNetworkQualityChanged, onUserNetworkQualityChanged);
  roomEngine.instance?.off(TUIRoomEvents.onKickedOutOfRoom, onKickedOutOfRoom);
  roomEngine.instance?.off(TUIRoomEvents.onSendMessageForUserDisableChanged, onSendMessageForUserDisableChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserSigExpired, onUserSigExpired);
  roomEngine.instance?.off(TUIRoomEvents.onKickedOffLine, onKickedOffLine);
  roomEngine.instance?.off(TUIRoomEvents.onAllUserCameraDisableChanged, onAllUserCameraDisableChanged);
  roomEngine.instance?.off(TUIRoomEvents.onAllUserMicrophoneDisableChanged, onAllUserMicrophoneDisableChanged);
  roomEngine.instance?.off(TUIRoomEvents.onSendMessageForAllUserDisableChanged, onSendMessageForAllUserDisableChanged);
  roomEngine.instance?.off(TUIRoomEvents.onDeviceChange, onDeviceChange);
});

watch(sdkAppId, (val: number) => {
  if (val) {
    TUIRoomAegis.setSdkAppId(val);
    TUIRoomAegis.reportEvent({
      name: 'loaded',
      ext1: 'loaded-success',
    });
  }
});
</script>

<style>
@import './assets/style/black-theme.scss';
@import './assets/style/white-theme.scss';

.tui-room :not([class|="el"]) {
    transition: background-color .5s,color .5s;
  }
</style>

<style lang="scss" scoped>
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
    font-family: PingFangSC-Medium;
  }
  .header {
    width: 100%;
    height: 48px;
    background-color: var(--room-header-bg-color);
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
    position: relative;
    bottom: 80px;
    width: 100%;
    height: 80px;
    background-color: var(--room-footer-bg-color);
  }
}
</style>
