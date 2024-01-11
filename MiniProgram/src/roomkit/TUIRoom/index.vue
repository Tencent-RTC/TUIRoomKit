<template>
  <div id="roomContainer" ref="roomRef" :class="['tui-room', `tui-theme-${defaultTheme}`]">
    <room-header
      v-show="showRoomTool && showHeaderTool"
      class="header"
      @log-out="logOut"
      @on-destroy-room="onDestroyRoom"
      @on-exit-room="onExitRoom"
    ></room-header>
    <room-content
      ref="roomContentRef"
      @tap="handleRoomContentTap"
      :show-room-tool="showRoomTool"
      class="content"
    ></room-content>
    <room-footer
      v-show="showRoomTool"
      class="footer"
      @on-destroy-room="onDestroyRoom"
      @on-exit-room="onExitRoom"
    />
    <room-sidebar></room-sidebar>
    <room-setting></room-setting>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, Ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import RoomHeader from './components/RoomHeader/index/index.vue';
import RoomFooter from './components/RoomFooter/index/index.vue';
import RoomSidebar from './components/RoomSidebar/index.vue';
import RoomContent from './components/RoomContent/index.vue';
import RoomSetting from './components/RoomSetting/index.vue';
import { debounce, throttle } from './utils/utils';
import { useBasicStore } from './stores/basic';
import { useRoomStore } from './stores/room';
import { useChatStore } from './stores/chat';
import { isMobile, isWeChat }  from './utils/environment';
import {
  TUIRoomEngine,
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
  TUIRole,
  TUIRoomInfo,
} from '@tencentcloud/tuiroom-engine-wx';


import TUIRoomAegis from './utils/aegis';
import { MESSAGE_DURATION } from './constants/message';
import { useI18n } from './locales';

import useGetRoomEngine from './hooks/useRoomEngine';
import logger from './utils/common/logger';
import TUIMessageBox from './components/common/base/MessageBox/index';
import TUIMessage from './components/common/base/Message/index';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();

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

const logPrefix = '[Room]';

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const chatStore = useChatStore();

const { sdkAppId, showHeaderTool, defaultTheme } = storeToRefs(basicStore);
const { localUser } = storeToRefs(roomStore);

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

// PC 端处理 room 控制栏交互
if (!isWeChat && !isMobile) {
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
}

// H5 及小程序端处理 room 控制栏交互
function handleRoomContentTap() {
  showRoomTool.value = !showRoomTool.value;
  if (showRoomTool.value) {
    handleHideRoomToolDebounce();
  }
}

onMounted(async () => {
  const storageCurrentTheme = uni.getStorageSync('tuiRoom-currentTheme');
  storageCurrentTheme && basicStore.setDefaultTheme(storageCurrentTheme);
  // 设置本地视频默认渲染模式
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  const mirrorType = isMobile
    ? TRTCVideoMirrorType.TRTCVideoMirrorType_Auto
    : (basicStore.isLocalStreamMirror
      ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
      : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable);
  await trtcCloud?.setLocalRenderParams({
    mirrorType,
    rotation: TRTCVideoRotation.TRTCVideoRotation0,
    fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
  });
});


async function dismissRoom() {
  try {
    logger.log(`${logPrefix}dismissRoom: enter`);
    closeMediaBeforeLeave();
    await roomEngine.instance?.destroyRoom();
    emit('on-destroy-room');
  } catch (error) {
    logger.error(`${logPrefix}dismissRoom error:`, error);
  }
}

async function leaveRoom() {
  try {
    closeMediaBeforeLeave();
    const response = await roomEngine.instance?.exitRoom();
    emit('on-exit-room');
    logger.log(`${logPrefix}leaveRoom:`, response);
  } catch (error) {
    logger.error(`${logPrefix}leaveRoom error:`, error);
  }
}

function closeMediaBeforeLeave() {
  if (localUser.value.hasAudioStream) {
    roomEngine.instance?.closeLocalMicrophone();
  }
  if (localUser.value.hasVideoStream) {
    roomEngine.instance?.closeLocalCamera();
  }
}

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
const doEnterRoom = async (roomId: string) => {
  const isH5 = isMobile && !isWeChat;
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  trtcCloud.setDefaultStreamRecvMode(true, false);
  trtcCloud.enableSmallVideoStream(!isH5, smallParam);
  const roomInfo = await roomEngine.instance?.enterRoom({ roomId }) as TUIRoomInfo;
  roomEngine.instance?.muteLocalAudio();
  if (roomInfo.speechMode === TUISpeechMode.kFreeToSpeak) {
    roomEngine.instance?.openLocalMicrophone();
    basicStore.setIsOpenMic(true);
  }
  return roomInfo;
};
async function createRoom(options: {
  roomId: string,
  roomName: string,
  roomMode: 'FreeToSpeak' | 'SpeakAfterTakingSeat',
  roomParam?: RoomParam,
}) {
  const { roomId, roomName, roomMode, roomParam } = options;
  try {
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
    const roomInfo = await doEnterRoom(roomId);
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
  } catch (error) {
    logger.error(`${logPrefix}createRoom error:`, error);
    basicStore.reset();
    throw error;
  }
}

async function enterRoom(options: {roomId: string, roomParam?: RoomParam }) {
  const { roomId, roomParam } = options;
  try {
    if (!roomEngine.instance) {
      return;
    }
    basicStore.setRoomId(roomId);
    logger.debug(`${logPrefix}enterRoom:`, roomId, roomParam);
    const roomInfo = await doEnterRoom(roomId);
    roomStore.setRoomInfo(roomInfo);
    if (roomStore.isMaster && roomStore.isSpeakAfterTakingSeatMode) {
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
    emit('on-enter-room', {
      code: 0,
      message: 'enter room success',
    });
    TUIRoomAegis.reportEvent({ name: 'enterRoom', ext1: 'enterRoom-success' });
  } catch (error) {
    logger.error(`${logPrefix}enterRoom error:`, error);
    basicStore.reset();
    throw error;
  }
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
    const tipMessage = isDisable ? t('You have been banned from text chat') : t('You are allowed to text chat');
    TUIMessage({
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
    if (!isWeChat) {
      resetStore();
    }
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
    TUIMessageBox({
      title: t('Note'),
      message: notice,
      confirmButtonText: t('Sure'),
      appendToRoomContainer: true,
      callback: async () => {
        if (isWeChat) {
          resetStore();
        }
        emit('on-kicked-out-of-room', { roomId, reason, message });
      },
    });
  } catch (error) {
    logger.error(`${logPrefix}onKickedOutOfRoom error:`, error);
  }
};

const onUserSigExpired = () => {
  TUIMessageBox({
    title: t('Note'),
    message: t('userSig 已过期'),
    confirmButtonText: t('Sure'),
    appendToRoomContainer: true,
    callback: async () => {
      emit('on-userSig-expired');
    },
  });
};

const onKickedOffLine = (eventInfo: { message: string }) => {
  const { message } = eventInfo;
  TUIMessageBox({
    title: t('Note'),
    message: t('系统检测到您的账号被踢下线'),
    confirmButtonText: t('Sure'),
    appendToRoomContainer: true,
    callback: async () => {
      emit('on-kicked-off-line', { message });
    },
  });
};

// todo: 处理禁言所有人和禁画所有人
async function handleAudioStateChange(isDisableAudio: boolean) {
  const tipMessage = isDisableAudio ? t('Mute has been turned on') : t('All mutes have been lifted');
  TUIMessage({
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
    await roomEngine.instance?.muteLocalAudio();
  }
}

async function handleVideoStateChange(isDisableVideo: boolean) {
  const tipMessage = isDisableVideo ? t('The banning of all paintings has been turned on') : t('The ban on painting has been lifted');
  TUIMessage({
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
  const tipMessage = isDisableMessage ? t('Disabling text chat for all is enabled') : t('Unblocked all text chat');
  TUIMessage({
    type: 'warning',
    message: tipMessage,
    duration: MESSAGE_DURATION.NORMAL,
  });
}

const onAllUserCameraDisableChanged =  async (eventInfo: { roomId: string, isDisable: boolean }) => {
  const { isDisable } = eventInfo;
  if (isDisable !== roomStore.isCameraDisableForAllUser && localUser.value.userRole === TUIRole.kGeneralUser) {
    handleVideoStateChange(isDisable);
    roomStore.setCanControlSelfVideo(!isDisable);
  }
  roomStore.setDisableCameraForAllUserByAdmin(isDisable);
};

const onAllUserMicrophoneDisableChanged = async (eventInfo: { roomId: string, isDisable: boolean }) => {
  const { isDisable } = eventInfo;
  if (isDisable !== roomStore.isMicrophoneDisableForAllUser && localUser.value.userRole === TUIRole.kGeneralUser) {
    handleAudioStateChange(isDisable);
    roomStore.setCanControlSelfAudio(!isDisable);
  }
  roomStore.setDisableMicrophoneForAllUserByAdmin(isDisable);
};

const onSendMessageForAllUserDisableChanged = async (eventInfo: { roomId: string, isDisable: boolean}) => {
  const { isDisable } = eventInfo;
  if (isDisable !== roomStore.isMessageDisableForAllUser && localUser.value.userRole === TUIRole.kGeneralUser) {
    handleMessageStateChange(isDisable);
  }
  roomStore.setDisableMessageAllUserByAdmin(isDisable);
};

// 初始化获取设备列表
async function getMediaDeviceList() {
  const cameraList = await roomEngine.instance?.getCameraDevicesList();
  const microphoneList = await roomEngine.instance?.getMicDevicesList();
  const speakerList = await roomEngine.instance?.getSpeakerDevicesList();
  cameraList && roomStore.setCameraList(cameraList);
  microphoneList && roomStore.setMicrophoneList(microphoneList);
  speakerList && roomStore.setSpeakerList(speakerList);

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
    deviceList && roomStore.setMicrophoneList(deviceList);
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentMicrophoneId(deviceId);
    }
    return;
  }
  if (type === TRTCDeviceType.TRTCDeviceTypeSpeaker) {
    logger.log(`onDeviceChange: deviceId: ${deviceId}, type: speaker, state: ${stateList[state]}`);
    const deviceList = await roomEngine.instance?.getSpeakerDevicesList();
    deviceList && roomStore.setSpeakerList(deviceList);
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentSpeakerId(deviceId);
    }
    return;
  }
  if (type === TRTCDeviceType.TRTCDeviceTypeCamera) {
    logger.log(`onDeviceChange: deviceId: ${deviceId}, type: camera, state: ${stateList[state]}`);
    const deviceList = await roomEngine.instance?.getCameraDevicesList();
    deviceList && roomStore.setCameraList(deviceList);
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

<style lang="scss">
@import './assets/style/global.scss';
@import './assets/style/black-theme.scss';
@import './assets/style/white-theme.scss';

.tui-room :not([class|="el"]) {
    transition: background-color .3s,color .3s, box-shadow .3s;
  }
</style>

<style lang="scss" scoped>
.tui-theme-white .tui-room {
  --header-shadow-color: #E3EAF7;
  --footer-shadow-color: rgba(197, 210, 229, 0.20);
}

.tui-theme-black .tui-room {
  --header-shadow-color: rgba(34, 38, 46, 0.30);
  --footer-shadow-color: rgba(34, 38, 46, 0.30);
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
  .footer {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 76px;
    background-color: var(--background-color-2);
    box-shadow: 0px -8px 30px var(--footer-shadow-color);
  }
}
</style>
