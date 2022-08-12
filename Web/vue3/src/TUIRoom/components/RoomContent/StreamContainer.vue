<template>
  <div :class="streamContainerClass">
    <div v-show="showIconControl" ref="enlargedContainerRef" class="enlarged-stream-container">
      <stream-region
        v-if="enlargeStream"
        :stream="enlargeStream"
        :style="enlargedStreamStyle"
      ></stream-region>
    </div>
    <div :class="['stream-list-container', `${showSideList ? '' : 'hide-list'}`]">
      <div ref="streamListRef" class="stream-list">
        <stream-region
          v-for="(stream, index) in streamList"
          v-show="showStreamList.indexOf(stream) > -1"
          :key="index"
          :stream="stream"
          :enlarge-dom-id="enlargeDomId"
          class="single-stream"
          :style="streamStyle"
          @dblclick="handleEnlargeStreamRegion(stream)"
        ></stream-region>
      </div>
    </div>
    <!-- 侧边栏和上边栏箭头 -->
    <div v-if="showIconControl && showRoomTool" :class="arrowClass" @click="handleClickIcon">
      <svg-icon icon-name="line-arrow-up" size="medium"></svg-icon>
    </div>
    <!-- 九宫格左右翻页控制栏 -->
    <div v-if="showTurnPageControl && showRoomTool" class="turn-page-container">
      <div
        v-show="showTurnPageLeftArrow"
        class="turn-page-arrow-container left-container"
        @click="handleTurnPageLeft"
      >
        <div class="turn-page-arrow"></div>
      </div>
      <div
        v-show="showTurnPageRightArrow"
        class="turn-page-arrow-container right-container"
        @click="handleTurnPageRight"
      >
        <div class="turn-page-arrow turn-page-right"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, Ref, ComputedRef, watch, nextTick, computed } from 'vue';
import TUIRoomCore, {
  TRTCVideoResolution,
  ETUIRoomEvents,
  TRTCVideoResolutionMode,
  ETUIStreamType,
  TRTCVideoEncParam,
} from '../../tui-room-core';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../stores/room';
import { useBasicStore } from '../../stores/basic';
import { LAYOUT } from '../../constants/render';
import StreamRegion from './StreamRegion.vue';
import SvgIcon from '../common/SvgIcon.vue';

defineProps<{
  showRoomTool: boolean,
}>();

const streamStyle: Ref<Record<string, any>> = ref({});
const enlargedStreamStyle: Ref<Record<string, any>> = ref({});
const roomStore = useRoomStore();
const { streamList, streamNumber } = storeToRefs(roomStore);
const basicStore = useBasicStore();
const { layout } = storeToRefs(basicStore);
const showSideList = ref(true);

const enlargeStream: Ref<StreamInfo | null> = ref(null);
const enlargeDomId = computed(() => (enlargeStream.value ? `${enlargeStream.value.userId}_${enlargeStream.value.type}` : ''));

// ----- 以下处理九宫格翻页逻辑 -----
const currentPageIndex = ref(0);
const showStreamList: ComputedRef<StreamInfo[]> = computed(() => {
  if (layout.value !== LAYOUT.NINE_EQUAL_POINTS) {
    return streamList.value;
  }
  return streamList.value.slice(currentPageIndex.value * 9, currentPageIndex.value * 9 + 9);
});

watch(streamNumber, (val) => {
  if (currentPageIndex.value > Math.ceil(val / 9) - 1) {
    currentPageIndex.value = Math.ceil(val / 9) - 1;
    handleNineEqualPointsLayout();
  }
});

// 显示左右翻页图标
const showTurnPageControl = computed(() => layout.value === LAYOUT.NINE_EQUAL_POINTS && streamNumber.value > 9);
// 是否展示九宫格朝左翻页按钮
const showTurnPageLeftArrow = computed(() => currentPageIndex.value > 0);
// 是否展示九宫格朝右翻页按钮
const showTurnPageRightArrow = computed(() => streamNumber.value > currentPageIndex.value * 9 + 9);

// 九宫格布局朝左翻页
function handleTurnPageLeft() {
  currentPageIndex.value = currentPageIndex.value - 1;
  handleNineEqualPointsLayout();
}

// 九宫格布局朝右翻页
function handleTurnPageRight() {
  currentPageIndex.value = currentPageIndex.value + 1;
  handleNineEqualPointsLayout();
}

// ----- 以下处理流布局 ---------
const streamContainerClass = ref('');
const enlargedContainerRef = ref();
const streamListRef = ref();

const arrowClass = computed(() => {
  let arrowDirection = '';
  if (layout.value === LAYOUT.TOP_SIDE_LIST) {
    arrowDirection = showSideList.value ? 'up' : 'down';
  }
  if (layout.value === LAYOUT.RIGHT_SIDE_LIST) {
    arrowDirection = showSideList.value ? 'right' : 'left';
  }
  return `icon-control arrow-${arrowDirection}`;
});

function handleClickIcon() {
  showSideList.value = !showSideList.value;
  if (!showSideList.value) {
    let width = 0;
    let height = 0;
    const containerWidth = document.getElementById('roomContainer')!.offsetWidth;
    const containerHeight = document.getElementById('roomContainer')!.offsetHeight;
    const scaleWidth = containerWidth / 16;
    const scaleHeight = containerHeight / 9;
    if (scaleWidth > scaleHeight) {
      width = (containerHeight / 9) * 16;
      height = containerHeight;
    }
    if (scaleWidth < scaleHeight) {
      width = containerWidth;
      height = (containerWidth / 16) * 9;
    }
    enlargedStreamStyle.value.width = `${width}px`;
    enlargedStreamStyle.value.height = `${height}px`;
    // 修改 enlargedContainer 的宽和高
    if (layout.value === LAYOUT.RIGHT_SIDE_LIST) {
      enlargedContainerRef.value.style.width = '100%';
      enlargedContainerRef.value.style.height = '100%';
      return;
    }
    if (layout.value === LAYOUT.TOP_SIDE_LIST) {
      enlargedContainerRef.value.style.top = '0px';
      enlargedContainerRef.value.style.width = '100%';
      enlargedContainerRef.value.style.height = '100%';
      return;
    }
  } else {
    if (layout.value  === LAYOUT.RIGHT_SIDE_LIST) {
      handleRightSideListLayout();
      enlargedContainerRef.value.style.width = 'calc(100% - 260px)';
      enlargedContainerRef.value.style.height = '100%';
      return;
    }
    if (layout.value === LAYOUT.TOP_SIDE_LIST) {
      handleTopSideListLayout();
      enlargedContainerRef.value.style.top = '175px';
      enlargedContainerRef.value.style.width = '100%';
      enlargedContainerRef.value.style.height = 'calc(100% - 175px)';
      return;
    }
  }
}

// 处理九宫格布局
async function handleNineEqualPointsLayout() {
  streamContainerClass.value = 'stream-container-flatten';

  enlargeStream.value = null;

  await nextTick();

  const number = showStreamList.value.length;
  let width = 0;
  let height = 0;
  const roomContainerElement = document.getElementById('roomContainer');
  let containerWidth = roomContainerElement!.offsetWidth;
  let containerHeight = roomContainerElement!.offsetHeight;
  if (number <= 4) {
    containerWidth = number < 2 ? roomContainerElement!.offsetWidth / number : roomContainerElement!.offsetWidth / 2;
    containerHeight = roomContainerElement!.offsetHeight / Math.ceil(number / 2);
  } else if (number > 4) {
    containerWidth = number < 3 ? roomContainerElement!.offsetWidth / number : roomContainerElement!.offsetWidth / 3;
    containerHeight = roomContainerElement!.offsetHeight / Math.ceil(number / 3);
  }

  const scaleWidth = containerWidth / 16;
  const scaleHeight = containerHeight / 9;
  if (scaleWidth > scaleHeight) {
    width = (containerHeight / 9) * 16;
    height = containerHeight;
  }
  if (scaleWidth <= scaleHeight) {
    width = containerWidth;
    height = (containerWidth / 16) * 9;
  }
  streamStyle.value.width = `${width}px`;
  streamStyle.value.height = `${height}px`;
}

// 处理侧边栏布局
async function handleRightSideListLayout() {
  streamContainerClass.value = 'stream-container-right';

  if (!enlargeStream.value) {
    [enlargeStream.value] = streamList.value;
  }

  await nextTick();

  streamStyle.value = {};

  if (enlargedContainerRef.value) {
    const containerWidth = enlargedContainerRef.value.offsetWidth;
    const containerHeight = enlargedContainerRef.value.offsetHeight;
    let width = 0;
    let height = 0;
    const scaleWidth = containerWidth / 16;
    const scaleHeight = containerHeight / 9;
    if (scaleWidth > scaleHeight) {
      width = (containerHeight / 9) * 16;
      height = containerHeight;
    }
    if (scaleWidth < scaleHeight) {
      width = containerWidth;
      height = (containerWidth / 16) * 9;
    }
    enlargedStreamStyle.value.width = `${width}px`;
    enlargedStreamStyle.value.height = `${height}px`;
  }
}

// 处理顶部栏布局
async function handleTopSideListLayout() {
  streamContainerClass.value = 'stream-container-top';

  if (!enlargeStream.value) {
    [enlargeStream.value] = streamList.value;
  }

  await nextTick();

  streamStyle.value = {};

  if (enlargedContainerRef.value) {
    const containerWidth = enlargedContainerRef.value.offsetWidth;
    const containerHeight = enlargedContainerRef.value.offsetHeight;
    let width = 0;
    let height = 0;
    const scaleWidth = containerWidth / 16;
    const scaleHeight = containerHeight / 9;
    if (scaleWidth > scaleHeight) {
      width = (containerHeight / 9) * 16;
      height = containerHeight;
    }
    if (scaleWidth < scaleHeight) {
      width = containerWidth;
      height = (containerWidth / 16) * 9;
    }
    enlargedStreamStyle.value.width = `${width}px`;
    enlargedStreamStyle.value.height = `${height}px`;
  }
}

function handleEnlargeStreamRegion(stream: StreamInfo) {
  if (layout.value === LAYOUT.NINE_EQUAL_POINTS) {
    return;
  }
  enlargeStream.value = stream;
}

// 页面加载或者 layout 改变时，处理页面布局
function handleLayout() {
  switch (layout.value as any) {
    case LAYOUT.NINE_EQUAL_POINTS:
      handleNineEqualPointsLayout();
      break;
    case LAYOUT.RIGHT_SIDE_LIST:
      showSideList.value = true;
      enlargedContainerRef.value.style.width = 'calc(100% - 260px)';
      enlargedContainerRef.value.style.height = '100%';
      handleRightSideListLayout();
      break;
    case LAYOUT.TOP_SIDE_LIST:
      showSideList.value = true;
      enlargedContainerRef.value.style.width = '100%';
      enlargedContainerRef.value.style.height = 'calc(100% - 175px)';
      handleTopSideListLayout();
      break;
    default:
      break;
  }
}

// 页面 resize 时，处理流窗口尺寸
function handleResize() {
  switch (layout.value as any) {
    case LAYOUT.NINE_EQUAL_POINTS:
      handleNineEqualPointsLayout();
      break;
    case LAYOUT.RIGHT_SIDE_LIST:
      handleRightSideListLayout();
      break;
    case LAYOUT.TOP_SIDE_LIST:
      handleTopSideListLayout();
      break;
    default:
      break;
  }
}

onMounted(() => {
  handleLayout();
  ['resize', 'pageshow'].forEach((event) => {
    window.addEventListener(event, handleResize);
  });
});

onUnmounted(() => {
  ['resize', 'pageshow'].forEach((event) => {
    window.removeEventListener(event, handleResize);
  });
});

watch(streamNumber, () => {
  if (layout.value === LAYOUT.NINE_EQUAL_POINTS) {
    handleNineEqualPointsLayout();
  }
});

watch(layout, () => {
  handleLayout();
});

const showIconControl = computed(() => [LAYOUT.RIGHT_SIDE_LIST, LAYOUT.TOP_SIDE_LIST].indexOf(layout.value) >= 0);

// --- 以下处理流事件 ----

const onUserEnterRoom = (streamInfo: any) => {
  roomStore.addRemoteUser(streamInfo);
};

const onUserLeaveRoom = (streamInfo: { userId: string }) => {
  roomStore.removeRemoteUser(streamInfo.userId);
};

// 收到远端 trtc 的 peer-join 事件
const onUserAVEnabled = (userInfo: any) => {
  roomStore.updateUserAVAbility(userInfo, true);
};

// 收到远端 trtc 的 peer-leave 事件
const onUserAVDisabled = (userInfo: any) => {
  roomStore.updateUserAVAbility(userInfo, false);
  if (userInfo.userId === enlargeStream.value?.userId || roomStore.remoteStreamList.length === 0) {
    basicStore.setLayout(LAYOUT.NINE_EQUAL_POINTS);
    enlargeStream.value = null;
  }
};

const onUserVideoAvailable = (eventInfo: { userId: string, available: number, streamType: number }) => {
  const { userId, available, streamType } = eventInfo;
  if (userId === basicStore.userId) {
    roomStore.updateLocalStream({ isVideoStreamAvailable: !!available });
    return;
  }
  if (streamType === ETUIStreamType.CAMERA) {
    roomStore.updateRemoteVideoStream(eventInfo);
    // 处理 web 端屏幕分享
    if (userId.indexOf('share_') === 0 && userId !== `share_${basicStore.userId}`) {
      enlargeStream.value = roomStore.remoteStreamMap.get(`${userId}_main`) as StreamInfo;
      if (layout.value !== LAYOUT.RIGHT_SIDE_LIST && layout.value !== LAYOUT.TOP_SIDE_LIST) {
        basicStore.setLayout(LAYOUT.RIGHT_SIDE_LIST);
      }
      return;
    }
    // 当远端流视频位 available 为 true，主持人端修改该用户的禁画提示为【禁画】
    if (basicStore.isMaster && available) {
      roomStore.setMuteUserVideo(userId, false);
    }
  } else if (streamType === ETUIStreamType.SCREEN) {
    roomStore.updateRemoteScreenStream(eventInfo);
    enlargeStream.value = roomStore.remoteStreamMap.get(`${userId}_screen`) as StreamInfo;
    if (layout.value !== LAYOUT.RIGHT_SIDE_LIST && layout.value !== LAYOUT.TOP_SIDE_LIST) {
      basicStore.setLayout(LAYOUT.RIGHT_SIDE_LIST);
    }
  }
};


const onUserAudioAvailable = (eventInfo: { userId: string, available: number}) => {
  const { userId, available } = eventInfo;
  if (userId === basicStore.userId) {
    roomStore.updateLocalStream({ isAudioStreamAvailable: !!available });
    return;
  }
  roomStore.updateRemoteAudioStream(eventInfo);
  // 当远端流音频位 available 为 true，主持人端修改该用户的禁画提示为【禁言】
  if (basicStore.isMaster && available) {
    roomStore.setMuteUserAudio(userId, false);
  }
};

const { isDefaultOpenCamera, isDefaultOpenMicrophone } = storeToRefs(roomStore);
const { isLocalAudioIconDisable, isLocalVideoIconDisable } = storeToRefs(basicStore);

watch(isDefaultOpenCamera, async (val) => {
  if (val && !isLocalVideoIconDisable.value) {
    const previewDom = document.getElementById(`${roomStore.localStream.userId}_main`);
    if (previewDom) {
      // 设置设备id
      if (!roomStore.currentCameraId) {
        const cameraList = await TUIRoomCore.getCameraList();
        roomStore.setCurrentCameraId(cameraList[0].deviceId);
      }
      await TUIRoomCore.setCurrentCamera(roomStore.currentCameraId);
      // 设置视频参数
      const param = new TRTCVideoEncParam();
      param.videoResolution = TRTCVideoResolution.TRTCVideoResolution_1280_720;
      param.videoFps = 15;
      param.videoBitrate = 1500;
      param.resMode = TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape;
      param.minVideoBitrate = 0;
      param.enableAdjustRes = true;
      TUIRoomCore.setVideoEncoderParam(param);
      // 开启本地摄像头
      await TUIRoomCore.startCameraPreview(previewDom);
      roomStore.setHasStartedCamera(true);
    }
  }
});

watch(isDefaultOpenMicrophone, async (val) => {
  if (val && !isLocalAudioIconDisable.value) {
    // 提前 startMicrophone 的时机，保证在 startCameraPreview 之前执行
    await TUIRoomCore.startMicrophone();
    roomStore.setHasStartedMicrophone(true);
    const microphoneList = await TUIRoomCore.getMicrophoneList();
    if (!roomStore.currentMicrophoneId) {
      roomStore.setCurrentMicrophoneId(microphoneList[0].deviceId);
    }
    if (!roomStore.currentSpeakerId) {
      roomStore.setCurrentSpeakerId(microphoneList[0].deviceId);
    }
    await TUIRoomCore.setCurrentMicrophone(roomStore.currentMicrophoneId);
  }
});

onMounted(async () => {
  TUIRoomCore.on(ETUIRoomEvents.onUserEnterRoom, onUserEnterRoom);
  TUIRoomCore.on(ETUIRoomEvents.onUserLeaveRoom, onUserLeaveRoom);
  TUIRoomCore.on(ETUIRoomEvents.onUserAVEnabled, onUserAVEnabled);
  TUIRoomCore.on(ETUIRoomEvents.onUserAVDisabled, onUserAVDisabled);
  TUIRoomCore.on(ETUIRoomEvents.onUserVideoAvailable, onUserVideoAvailable);
  TUIRoomCore.on(ETUIRoomEvents.onUserAudioAvailable, onUserAudioAvailable);
});

onUnmounted(() => {
  TUIRoomCore.off(ETUIRoomEvents.onUserEnterRoom, onUserEnterRoom);
  TUIRoomCore.off(ETUIRoomEvents.onUserLeaveRoom, onUserLeaveRoom);
  TUIRoomCore.off(ETUIRoomEvents.onUserAVEnabled, onUserAVEnabled);
  TUIRoomCore.off(ETUIRoomEvents.onUserAVDisabled, onUserAVDisabled);
  TUIRoomCore.off(ETUIRoomEvents.onUserVideoAvailable, onUserVideoAvailable);
  TUIRoomCore.off(ETUIRoomEvents.onUserAudioAvailable, onUserAudioAvailable);
});
</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.stream-container-flatten {
  width: 100%;
  height: 100%;
  background-color: $roomBackgroundColor;
  overflow: hidden;
  .stream-list-container {
    width: 100%;
    height: 100%
  }
  .stream-list {
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    align-content: center;
    .single-stream {
      padding: 4px;
    }
  }
}

.icon-control {
  background-color: $toolBarBackgroundColor;
  position: absolute;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}
.arrow-up {
  width: 52px;
  height: 20px;
  position: fixed;
  left: 50%;
  transform: translate(-50%);
  top: 175px;
  border-radius: 0 0 4px 4px;
}
.arrow-down {
  width: 52px;
  height: 20px;
  position: fixed;
  left: 50%;
  transform: translate(-50%);
  top: 48px;
  border-radius: 0 0 4px 4px;
  * {
    transform: rotate(180deg);
  }
}
.arrow-right {
  width: 20px;
  height: 52px;
  position: fixed;
  right: 250px;
  transform: translate(-50%);
  top: calc((100% - 148px) / 2 + 58px);
  border-radius: 4px 0 0 4px;
  * {
    transform: rotate(90deg);
  }
}
.arrow-left {
  width: 20px;
  height: 52px;
  position: fixed;
  right: -10px;
  transform: translate(-50%);
  top: calc((100% - 148px) / 2 + 58px);
  border-radius: 4px 0 0 4px;
  * {
    transform: rotate(270deg);
  }
}

.stream-container-top {
  width: 100%;
  height: 100%;
  background-color: $roomBackgroundColor;
  overflow: hidden;
  position: relative;
  .enlarged-stream-container {
    width: 100%;
    height: calc(100% - 175px);
    position: absolute;
    top: 175px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .stream-list-container {
    width: 100%;
    height: 175px;
    background-color: $toolBarBackgroundColor;
    position: absolute;
    top: 0;
    left: 0;
    padding: 20px 40px;
    display: flex;
    justify-content: center;
    &.hide-list {
      transform: translateY(-175px);
    }
    .stream-list {
      display: flex;
      overflow-x: scroll;
      max-width: 100%;
      max-height: 100%;
      &::-webkit-scrollbar {
        display: none;
      }
      .single-stream {
        width: 240px;
        height: 135px;
        border-radius: 4px;
        overflow: hidden;
        flex-shrink: 0;
        &:not(:first-child) {
          margin-left: 14px;
        }
      }
    }
  }
}

.stream-container-right {
  width: 100%;
  height: 100%;
  background-color: $roomBackgroundColor;
  overflow: hidden;
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-content: center;
  .enlarged-stream-container {
    width: calc(100% - 260px);
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .stream-list-container {
    width: 260px;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    padding: 48px 10px 80px;
    background-color: $toolBarBackgroundColor;
    display: flex;
    align-items: center;
    &.hide-list {
      transform: translateX(260px);
    }
    &::before {
      content: '';
      width: 100%;
      height: 40px;
      position: absolute;
      top: 48px;
      left: 0;
      opacity: 0.1;
    }
  }
  .stream-list {
    max-width: 100%;
    max-height: 100%;
    overflow-y: scroll;
    padding: 10px 0;
    &::-webkit-scrollbar {
      display: none;
    }
    .single-stream {
      width: 240px;
      height: 135px;
      border-radius: 4px;
      overflow: hidden;
      &:not(:first-child) {
        margin-top: 14px;
      }
    }
  }
}

.turn-page-container {
  width: 100%;
  height: 86px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  .turn-page-arrow-container {
    width: 40px;
    height: 86px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4.21px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  .left-container {
    position: absolute;
    left: 24px;
  }
  .right-container {
    position: absolute;
    right: 24px;
  }
  .turn-page-arrow {
    background-image: url(../../assets/icons/svg/turn-page-arrow-left.svg);
    width: 14px;
    height: 23px;
    background-size: 100% 100%;
  }
  .turn-page-right {
    transform: rotateY(180deg);
  }
}
</style>
