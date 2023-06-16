<template>
  <div>
    <div v-if="isShowLargeStream" ref="enlargedContainerRef" class="enlarged-stream-container">
      <stream-region
        v-show="enlargeStream"
        :key="`${enlargeStream.userId}-${enlargeStream.streamType}`"
        :stream="enlargeStream"
        :status="currentStatus.status"
        :style="enlargedStreamStyle"
        :show-room-tool="showRoomTool"
        :current-choose-stream="currentChooseStream"
        class="large-stream"
      ></stream-region>
    </div>
    <div v-if="isShowCornerStream" ref="enlargedContainerRef" class="top-right-container">
      <stream-region
        v-show="currentSpeakerStream"
        :key="`${currentSpeakerStream.userId}-${currentSpeakerStream.streamType}-${currentStatus.status}`"
        :stream="currentSpeakerStream"
        :status="currentStatus.status"
        :show-room-tool="showRoomTool"
        :current-choose-stream="currentChooseStream"
        class="large-stream"
      ></stream-region>
    </div>
    <div v-if="currentStatus.status !== 'grid'" class="swipe">
      <span class="swipe-current-dots"></span>
      <span class="swipe-dots"></span>
    </div>
    <div v-if="isShowGridStream" :class="streamContainerClass">
      <div :class="['stream-list-container', `${showSideList ? '' : 'hide-list'}`]">
        <div ref="streamListRef" class="stream-list">
          <stream-region
            v-for="(stream) in streamList"
            v-show="showStreamList.indexOf(stream) > -1"
            :key="`${stream.userId}_${stream.streamType}`"
            :stream="stream"
            :status="currentStatus.status"
            :enlarge-dom-id="enlargeDomId"
            :show-room-tool="showRoomTool"
            :class="[currentStatus.status === 'grid' && 'single-stream']"
            :current-choose-stream="currentChooseStream"
            @click="handleChooseCurrentStream(stream)"
            @choose-click="handleEnlargeStreamRegion"
          >
          </stream-region>
        </div>
      </div>
    </div>
    <!--左右滑动控制栏 -->
    <div v-if="showTurnPageControl && showRoomTool && currentStatus.status === 'grid'" class="swipe">
      <span
        v-for="item in showPageDots" :key="item"
        class="swipe-dots" :class="[currentPageIndex === (item - 1) ? 'swipe-current-dots' : '']"
        @click="handleDotsTurnPage(item)"
      ></span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, Ref, ComputedRef, watch, nextTick, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import { LAYOUT } from '../../../constants/render';
import StreamRegion from '../StreamRegion';
import SvgIcon from '../../common/SvgIcon.vue';
import { ElMessage } from '../../../elementComp';
import { MESSAGE_DURATION } from '../../../constants/message';

import TUIRoomEngine, { TUIChangeReason, TUIRoomEvents,  TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import useStreamContainer from './useStreamContainerHooks';

const {
  onRemoteUserEnterRoom,
  onRemoteUserLeaveRoom,
  onSeatListChanged,
  onUserAudioStateChanged,
  t,
} = useStreamContainer();

const roomEngine = useGetRoomEngine();


defineProps<{
  showRoomTool: boolean,
}>();

const streamStyle: Ref<Record<string, any>> = ref({ width: '0', height: '0' });
const enlargedStreamStyle: Ref<Record<string, any>> = ref({ width: '0', height: '0' });
const roomStore = useRoomStore();
const { streamList, streamNumber, remoteStreamList, localStream } = storeToRefs(roomStore);
const basicStore = useBasicStore();
const { layout } = storeToRefs(basicStore);
const showSideList = ref(true);

const enlargeStream: Ref<StreamInfo | null> = ref(null);
const enlargeDomId = computed(() => (enlargeStream.value ? `${enlargeStream.value.userId}_${enlargeStream.value.streamType}` : ''));
const currentSpeakerStream: Ref<StreamInfo | null> = ref(null);
const startX = ref();
const startY = ref();
const largestVoice = ref(0);
const isShowLargeStream = ref(false);
const isShowCornerStream = ref(false);
const isShowGridStream = ref(false);
const currentStatus: Ref<Record<string, any>> = ref({
  status: '',
  showBigStream: null,
  showSmallStream: null,
  // locked: false,  为后续增加“钉住”状态预留字段
});
const currentChooseStream: Ref<StreamInfo | null> = ref(null);


watch(() => remoteStreamList.value.length, (len) => {
  // 当没有远端流的时候，将流布局改为九宫格
  if (len === 0) {
    currentStatus.value.status = 'one';
  }
  if (len === 1) {
    currentStatus.value.status = 'speaker';
    currentStatus.value.showBigStream = remoteStreamList.value[0];
  }
  if (len > 1
    && currentStatus.value.status !== 'aux') {
    currentStatus.value.status = 'grid';
  }
},  { immediate: true });


watch(
  () => currentStatus.value.status,
  (val) => {
    if (val) {
      switch (val) {
        case 'speaker':
          currentSpeakerStream.value = currentStatus.value.showSmallStream === null
            ? localStream.value : currentStatus.value.showSmallStream;
          isShowCornerStream.value = true;
          enlargeStream.value = currentStatus.value.showBigStream;
          // 当查看的流和当前说话的流是同一个人时，小屏幕渲染本地流
          if (enlargeStream.value === currentSpeakerStream.value) {
            if (currentSpeakerStream.value === localStream.value) {
              currentSpeakerStream.value =  remoteStreamList.value[0];
            } else {
              currentSpeakerStream.value = localStream.value;
            }
          }

          isShowLargeStream.value = true;
          isShowGridStream.value = false;
          break;
        case 'aux':
          enlargeStream.value = currentStatus.value.showBigStream;
          if (currentStatus.value.showSmallStream === null) {
            currentSpeakerStream.value = localStream.value;
          } else {
            currentSpeakerStream.value = currentStatus.value.showSmallStream;
          }
          isShowLargeStream.value = true;
          isShowCornerStream.value = true;
          isShowGridStream.value = false;
          break;
        case 'grid':
          enlargeStream.value = null;
          isShowLargeStream.value = false;
          isShowCornerStream.value = false;
          isShowGridStream.value = true;
          break;
        case 'one':
          isShowLargeStream.value = false;
          isShowCornerStream.value = false;
          isShowGridStream.value = true;
        default:
          break;
      }
    }
  },
  { immediate: true },
);


watch(
  () => currentStatus.value.showSmallStream,
  (val, oldVal) => {
    if (currentStatus.value.status !== 'aux') return;
    if (oldVal) {
      if (oldVal.audioVolume !== 0) {
        currentSpeakerStream.value = oldVal;
      } else {
        currentSpeakerStream.value = val;
      }
    }
  },
  { immediate: true },
);
/**
 * ----- The following handles the nine-pane page flip logic -----
 *
 * ----- 以下处理六宫格翻页逻辑 -----
**/
const currentPageIndex = ref(0);
const showStreamList: ComputedRef<StreamInfo[]> = computed(() => streamList.value.slice(currentPageIndex.value * 6, currentPageIndex.value * 6 + 6));

watch(streamNumber, (val) => {
  if (currentPageIndex.value > Math.ceil(val / 6) - 1) {
    currentPageIndex.value = Math.ceil(val / 6) - 1;
    handleSixEqualPointsLayout();
  }
});


/**
 * Show left and right page flip icons
 *
 * 显示左右翻页图标
**/
const showTurnPageControl = computed(() => layout.value === LAYOUT.GRID_VIEW && streamNumber.value > 6);

const showPageDots = computed(() => Math.ceil(streamNumber.value / 6));
function handleTurnPageLeft() {
  currentPageIndex.value = currentPageIndex.value - 1;
}

/**
 * Nine grid layout towards the right to turn the page
 *
 * 九宫格布局朝右翻页
**/
function handleTurnPageRight() {
  if (streamNumber.value === 1) return;
  if (isShowLargeStream.value && streamNumber.value > 1) {
    currentStatus.value.status = 'grid';
    currentPageIndex.value = -1;
  }
  currentPageIndex.value = currentPageIndex.value + 1;
}

function handleDotsTurnPage(item: number) {
  currentPageIndex.value = item - 1;
}
/**
 * ----- The following processing stream layout ---------
 *
 * ----- 以下处理流布局 ---------
**/
const streamContainerClass = ref('');
const enlargedContainerRef = ref();
const streamListRef = ref();


/**
 * Handle nine-pattern layout
 *
 * 处理六宫格布局
**/
async function handleSixEqualPointsLayout() {
  streamContainerClass.value = 'stream-container-flatten';
  const number = showStreamList.value.length;
  let width = 0;
  let height = 0;
  const roomContainerElement = document.getElementById('roomContainer');
  if (!roomContainerElement) {
    return;
  }
  let containerWidth = roomContainerElement!.offsetWidth;
  let containerHeight = roomContainerElement!.offsetHeight;
  containerWidth = number < 2 ? roomContainerElement!.offsetWidth / number : roomContainerElement!.offsetWidth / 2;
  containerHeight = roomContainerElement!.offsetHeight / Math.ceil(number / 2);

  const scaleWidth = containerWidth / 9;
  const scaleHeight = containerHeight / 16;
  if (scaleWidth > scaleHeight) {
    width = (containerHeight / 16) * 9;
    height = containerHeight;
  }
  if (scaleWidth <= scaleHeight) {
    width = containerWidth;
    height = (containerWidth / 9) * 16;
  }
  streamStyle.value.width = `${width}px`;
  streamStyle.value.height = `${height}px`;
}

/**
 * Double-click to switch the stream to the zoom in section
 *
 * 单击切换流到放大区域
**/
function handleEnlargeStreamRegion(event: any) {
  if (streamNumber.value === 1) return;
  if (event.streamType === TUIVideoStreamType.kScreenStream) {
    currentStatus.value.status = 'aux';
  } else {
    currentStatus.value.status = 'speaker';
  }
  if (event !== localStream.value) {
    currentSpeakerStream.value = localStream.value;
  }
  currentStatus.value.showBigStream = event;
}

/**
 * Handle the page layout when the page loads or the layout changes
 *
 * 页面加载或者 layout 改变时，处理页面布局
**/
function handleLayout() {
  switch (layout.value as any) {
    case LAYOUT.GRID_VIEW:
      handleSixEqualPointsLayout();
      break;
    default:
      break;
  }
}

/**
 * Processing stream window size when page rescaling
 *
 * 页面 resize 时，处理流窗口尺寸
**/
function handleResize() {
  switch (layout.value as any) {
    case LAYOUT.GRID_VIEW:
      handleSixEqualPointsLayout();
      break;
    default:
      break;
  }
}
// 选中要放大的流
function handleChooseCurrentStream(stream: StreamInfo) {
  currentChooseStream.value = stream;
}
function handleTouchStart(event:any) {
  startX.value = event.changedTouches[0].pageX;
  startY.value = event.changedTouches[0].pageY;
}

function handleTouchEnd(event:any) {
  const moveDirection = (event.changedTouches[0].pageX - startX.value);
  if (Math.abs(moveDirection) < 5) return;
  if (moveDirection < 0) {
    // 右滑
    if (currentStatus.value.status === 'grid' && currentPageIndex.value === (showPageDots.value - 1)) return;
    handleTurnPageRight();
  }
  if (moveDirection > 0) {
    if (currentPageIndex.value === 0) return;
    handleTurnPageLeft();
  }
}

onMounted(() => {
  handleLayout();
  ['resize', 'pageshow'].forEach((event) => {
    window.addEventListener(event, handleResize);
  });
  document.addEventListener('touchstart', handleTouchStart, false);
  document.addEventListener('touchend', handleTouchEnd, false);
  basicStore.setLayout(LAYOUT.GRID_VIEW);
});

onUnmounted(() => {
  ['resize', 'pageshow'].forEach((event) => {
    window.removeEventListener(event, handleResize);
  });
  document.removeEventListener('touchstart', handleTouchStart, false);
  document.removeEventListener('touchend', handleTouchEnd, false);
});


watch(layout, () => {
  handleLayout();
});


/**
 * --- The following processing stream events ----
 *
 * --- 以下处理流事件 ----
**/


const onUserVideoStateChanged = (eventInfo: {
  userId: string,
  streamType: TUIVideoStreamType,
  hasVideo: boolean,
  reason: TUIChangeReason,
}) => {
  const { userId, streamType, hasVideo, reason } = eventInfo;
  // 更新 roomStore 流状态数据
  roomStore.updateUserVideoState(userId, streamType, hasVideo);

  // 处理状态变更
  if (userId === basicStore.userId && !hasVideo && reason === TUIChangeReason.kChangedByAdmin) {
    // 主持人关闭摄像头
    if (streamType === TUIVideoStreamType.kCameraStream) {
      ElMessage({
        type: 'warning',
        message: t('The host has turned off your camera'),
        duration: MESSAGE_DURATION.NORMAL,
      });
      // When the moderator opens the whole staff forbidden to draw,
      // open and then close the single person's camera alone, at this time
      // the corresponding user's camera status for inoperable
      // 主持人开启全员禁画时，单独打开再关闭单人的摄像头，此时对应用户的摄像头状态为无法操作
      roomStore.setCanControlSelfVideo(!roomStore.isCameraDisableForAllUser);
    }
    // 主持人关闭屏幕分享
    if (streamType === TUIVideoStreamType.kScreenStream) {
      ElMessage({
        type: 'warning',
        message: t('The host has turned off your screen sharing'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    }
  }

  // 当远端屏幕分享变化的时候，处理流布局
  if (userId !== basicStore.userId && streamType === TUIVideoStreamType.kScreenStream) {
    if (hasVideo) {
      currentStatus.value.status = 'aux';
      currentStatus.value.showBigStream = roomStore.remoteStreamObj[`${userId}_${streamType}`] as StreamInfo;
    } else {
      /**
       * Reset the stream playback layout when the remote screen sharing stream is stopped
       *
       * 远端屏幕分享流停止的时候，重新设置流播放布局
      **/
      if (roomStore.remoteStreamList.length === 0) {
        basicStore.setLayout(LAYOUT.GRID_VIEW);
        enlargeStream.value = null;
      } else if (userId === enlargeStream.value?.userId) {
        [enlargeStream.value] = roomStore.remoteStreamList;
      }
    }
  }
};


// 计算音量最大的userid
function handleLargestVoice(userVolumeList: any) {
  const voiceList = [] as any;
  userVolumeList.forEach((volumeList:any) => {
    voiceList.push(volumeList.volume);
  });
  largestVoice.value = Math.max(...voiceList as any);
  if (largestVoice.value === 0) return;
  const currentSpeakerUserId = userVolumeList.find((item : any) => item.volume === largestVoice.value).userId;
  currentStatus.value.showSmallStream = streamList.value.find((item : any) => item.userId === currentSpeakerUserId) as StreamInfo;
}

// 音量变化
const onUserVoiceVolumeChanged = (eventInfo: {
  userVolumeList: any[],
}) => {
  const { userVolumeList } = eventInfo;
  if (userVolumeList.length === 0) return;
  if (streamNumber.value > 1 && currentStatus.value.status !== 'grid') {
    handleLargestVoice(userVolumeList);
  }
};


TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRemoteUserEnterRoom, onRemoteUserEnterRoom);
  roomEngine.instance?.on(TUIRoomEvents.onRemoteUserLeaveRoom, onRemoteUserLeaveRoom);
  roomEngine.instance?.on(TUIRoomEvents.onSeatListChanged, onSeatListChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserVideoStateChanged, onUserVideoStateChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserAudioStateChanged, onUserAudioStateChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserVoiceVolumeChanged, onUserVoiceVolumeChanged);
  // roomEngine.instance?.on(TUIRoomEvents.onUserNetworkQualityChanged, onUserNetworkQualityChanged);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRemoteUserEnterRoom, onRemoteUserEnterRoom);
  roomEngine.instance?.off(TUIRoomEvents.onRemoteUserLeaveRoom, onRemoteUserLeaveRoom);
  roomEngine.instance?.off(TUIRoomEvents.onSeatListChanged, onSeatListChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserVideoStateChanged, onUserVideoStateChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserAudioStateChanged, onUserAudioStateChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserVoiceVolumeChanged, onUserVoiceVolumeChanged);
});
</script>

<style lang="scss" scoped>
@import '../../../assets/style/var.scss';

.stream-container-flatten {
  width: 100%;
  height: 100%;
  background-color: var(--stream-container-flatten-bg-color);
  overflow: hidden;
  .stream-list-container {
    width: 100%;
    height: 100%
  }
  .stream-list {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    align-content: center;
    .single-stream {
      max-width: 50vw !important;
      height: 12.5rem !important;
      padding: 1px;
      border-radius: 10px;
      overflow: hidden;
      transform: rotate(0deg);
      -webkit-transform: rotate(0deg);
    }
  }
}

.icon-control {
  background-color: var(--layout-item);
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
.stream-container{
  width: 100vw;
  height: 100vh;
}
.top-right-container {
  width: 150px;
  height: 235px;
  position: absolute;
  top: 5%;
  right: 20px;
}
.enlarged-stream-container{
  width: 100vw;
  height: 100vh;
}
.large-stream{
  width: 100% !important;
  height: 100% !important;
}
.swipe{
  width: 100%;
  position: absolute;
  bottom: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  }
.swipe-dots{
  width: 8px;
  height: 8px;
  background: #FFFFFF;
  opacity: 0.15;
  border-radius: 20px;
  margin: 5px;
}
.swipe-current-dots{
  width: 8px;
  height: 8px;
  background: #FFFFFF;
  opacity: 1;
  border-radius: 20px;
  margin: 5px;
  }
</style>
