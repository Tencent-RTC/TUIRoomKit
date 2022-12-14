<template>
  <div id="roomContainer" ref="roomRef" class="tui-room">
    <room-header v-show="showRoomTool" class="header" @log-out="logOut"></room-header>
    <room-content ref="roomContentRef" :show-room-tool="showRoomTool" class="content"></room-content>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, onMounted, onUnmounted, Ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import RoomHeader from './components/RoomHeader/index.vue';
import RoomContent from './components/RoomContent/index.vue';
import RoomFooter from './components/RoomFooter/index.vue';
import RoomSidebar from './components/RoomSidebar/index.vue';
import RoomSetting from './components/RoomSetting/index.vue';
import { isElectronEnv, debounce, throttle } from './utils/utils';
import { useBasicStore } from './stores/basic';
import { useRoomStore } from './stores/room';
import { useChatStore } from './stores/chat';

import TUIRoomEngine, {
  TUIRoomEvents,
  TUIRoomInfo,
  TUIRoomType,
  TRTCDeviceType,
  TRTCDeviceState,
} from '@tencentcloud/tuiroom-engine-js';

import TUIRoomAegis from './utils/aegis';
import { MESSAGE_DURATION } from './constants/message';
import { useI18n } from 'vue-i18n';

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
  'onLogOut',
  'onCreateRoom',
  'onEnterRoom',
  'onExitRoom',
  'onDestroyRoom',
  // 用户被踢出房间
  'onKickedOutOfRoom',
  // 用户被踢下线
  'onKickedOffLine',
  // 用户 userSig 过期
  'onUserSigExpired',
]);

const logPrefix = '[Room]';

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const chatStore = useChatStore();

const { sdkAppId } = storeToRefs(basicStore);
const { localUser, localVideoProfile } = storeToRefs(roomStore);

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
  avatarUrl: string,
}

async function init(option: RoomInitData) {
  const { sdkAppId, userId, userSig, userName, avatarUrl } = option;
  await TUIRoomEngine.init({ sdkAppId, userId, userSig });
  await TUIRoomEngine.setSelfInfo({ userName, avatarUrl });
  basicStore.setBasicInfo(option);
  roomStore.setLocalUser(option);
}

async function createRoom(options: {
  roomId: string,
  roomName: string,
  roomMode: 'FreeSpeech' | 'ApplySpeech',
  roomParam?: RoomParam,
}) {
  const { roomId, roomName, roomMode, roomParam } = options;
  if (!roomEngine.instance) {
    return;
  }
  basicStore.setRoomId(roomId);
  console.debug(`${logPrefix}createRoom:`, roomId, roomMode, roomParam);
  const roomParams = {
    roomId,
    name: roomName,
    roomType: TUIRoomType.kGroup,
  };
  if (roomMode === 'FreeSpeech') {
    Object.assign(roomParams, {
      enableAudio: true,
      enableVideo: true,
      enableMessage: true,
      enableSeatControl: false,
    });
  } else {
    Object.assign(roomParams, {
      enableAudio: true,
      enableVideo: true,
      enableMessage: true,
      enableSeatControl: true,
    });
  }
  await roomEngine.instance?.createRoom(roomParams);
  emit('onCreateRoom', {
    code: 0,
    message: 'create room success',
  });
  await roomEngine.instance?.enterRoom({ roomId });
  emit('onEnterRoom', {
    code: 0,
    message: 'enter room success',
  });
  const roomInfo = await roomEngine.instance?.getRoomInfo();
  roomStore.setRoomInfo(roomInfo);
  // 房主上麦
  await roomEngine.instance?.takeSeat({ seatIndex: -1, timeout: 0 });
  // 及时更新本地用户 onSeat 属性
  roomStore.setLocalUser({ onSeat: true });
  await getUserList();
  await roomEngine.instance?.setLocalVideoProfile({ videoProfile: localVideoProfile.value });
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
  console.debug(`${logPrefix}enterRoom:`, roomId, roomParam);
  const roomInfo = await roomEngine.instance?.enterRoom({ roomId });
  roomStore.setRoomInfo(roomInfo);
  // 自由发言模式
  if (!roomInfo.enableSeatControl) {
    await roomEngine.instance?.takeSeat({ seatIndex: -1, timeout: 0 });
    roomStore.setLocalUser({ onSeat: true });
  }
  await roomEngine.instance?.setLocalVideoProfile({ videoProfile: localVideoProfile.value });
  await getUserList();
  /**
   * setRoomParam must come after setRoomInfo,because roomInfo contains information
   * about whether or not to turn on the no-mac ban.
   *
   * setRoomParam 必须在 setRoomInfo 之后，因为 roomInfo 中有是否开启全员禁麦禁画的信息
  **/
  roomStore.setRoomParam(roomParam);
  emit('onEnterRoom', {
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
    console.error('TUIRoomEngine.getUserList', error.code, error.message);
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
  emit('onLogOut');
};

const onDestroyRoom = (info: { code: number; message: string }) => {
  resetStore();
  emit('onDestroyRoom', info);
};

const onExitRoom = (info: { code: number; message: string }) => {
  resetStore();
  emit('onExitRoom', info);
};

const onError = (error: any) => {
  console.error('roomEngine.onError: ', error);
};

const onUserMuteStateChanged = (data: { userId: string, muted: boolean }) => {
  const { userId, muted } = data;
  if (userId === localUser.value.userId) {
    const tipMessage = muted ? t('You have been banned from text chat by the host') : t('You are allowed to text chat by the host');
    ElMessage({
      type: 'warning',
      message: tipMessage,
      duration: MESSAGE_DURATION.NORMAL,
    });
    chatStore.setIsMuteChatByMater(muted);
  }
};

const onKickedOutOfRoom = async (eventInfo: { roomId: string, message: string }) => {
  const { roomId, message } = eventInfo;
  try {
    resetStore();
    ElMessageBox.alert(t('kicked out of the room by the host'), t('Note'), {
      confirmButtonText: t('Confirm'),
      callback: async () => {
        emit('onKickedOutOfRoom', { roomId, message });
      },
    });
  } catch (error) {
    console.error(`${logPrefix}onKickedOutOfRoom error:`, error);
  }
};

const onUserSigExpired = () => {
  ElMessageBox.alert('userSig 已过期', t('Note'), {
    confirmButtonText: t('Confirm'),
    callback: async () => {
      emit('onUserSigExpired');
    },
  });
};

const onKickedOffLine = (eventInfo: { message: string }) => {
  const { message } = eventInfo;
  ElMessageBox.alert('系统检测到您的账号被踢下线', t('Note'), {
    confirmButtonText: t('Confirm'),
    callback: async () => {
      emit('onKickedOffLine', { message });
    },
  });
};

// todo: 处理禁言所有人和禁画所有人
async function handleEnableAudioChange(enableAudio: boolean) {
  const tipMessage = enableAudio ? t('The host has unmuted all') : t('The host has muted all');
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
  if (!enableAudio) {
    await roomEngine.instance?.closeLocalMicrophone();
    await roomEngine.instance?.stopPushLocalAudio();
  }
}

async function handleEnableVideoChange(enableVideo: boolean) {
  const tipMessage = enableVideo ? t('The host has lifted the ban on all paintings') : t('The host has turned on the ban on all paintings');
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
  if (!enableVideo) {
    await roomEngine.instance?.closeLocalCamera();
    await roomEngine.instance?.stopPushLocalVideo();
  }
}

const onRoomInfoChanged = (eventInfo: { roomId: string, roomInfo: TUIRoomInfo}) => {
  const { roomInfo } = eventInfo;
  const { enableAudio, enableVideo } = roomInfo;
  if (enableAudio !== roomStore.enableAudio) {
    handleEnableAudioChange(enableAudio);
  }
  if (enableVideo !== roomStore.enableVideo) {
    handleEnableVideoChange(enableVideo);
  }
  roomStore.setRoomInfo(roomInfo);
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
    console.log(`onDeviceChange: deviceId: ${deviceId}, type: microphone, state: ${stateList[state]}`);
    const deviceList = await roomEngine.instance?.getMicDevicesList();
    roomStore.setMicrophoneList(deviceList);
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentMicrophoneId(deviceId);
    }
    return;
  }
  if (type === TRTCDeviceType.TRTCDeviceTypeSpeaker) {
    console.log(`onDeviceChange: deviceId: ${deviceId}, type: speaker, state: ${stateList[state]}`);
    const deviceList = await roomEngine.instance?.getSpeakerDevicesList();
    roomStore.setSpeakerList(deviceList);
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentSpeakerId(deviceId);
    }
    return;
  }
  if (type === TRTCDeviceType.TRTCDeviceTypeCamera) {
    console.log(`onDeviceChange: deviceId: ${deviceId}, type: camera, state: ${stateList[state]}`);
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
  roomEngine.instance?.on(TUIRoomEvents.onUserMuteStateChanged, onUserMuteStateChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserSigExpired, onUserSigExpired);
  roomEngine.instance?.on(TUIRoomEvents.onKickedOffLine, onKickedOffLine);
  roomEngine.instance?.on(TUIRoomEvents.onRoomInfoChanged, onRoomInfoChanged);
  roomEngine.instance?.on(TUIRoomEvents.onDeviceChange, onDeviceChange);

  getMediaDeviceList();
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onError, onError);
  roomEngine.instance?.off(TUIRoomEvents.onUserVoiceVolumeChanged, onUserVoiceVolumeChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserNetworkQualityChanged, onUserNetworkQualityChanged);
  roomEngine.instance?.off(TUIRoomEvents.onKickedOutOfRoom, onKickedOutOfRoom);
  roomEngine.instance?.off(TUIRoomEvents.onUserMuteStateChanged, onUserMuteStateChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserSigExpired, onUserSigExpired);
  roomEngine.instance?.off(TUIRoomEvents.onKickedOffLine, onKickedOffLine);
  roomEngine.instance?.off(TUIRoomEvents.onRoomInfoChanged, onRoomInfoChanged);
  roomEngine.instance?.off(TUIRoomEvents.onDeviceChange, onDeviceChange);
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
