<template>
  <div class="message-list-container-wx">
    <scroll-view
      id="messageScrollList"
      class="message-list"
      scroll-y="true"
      scroll-with-animation="true"
      :scroll-into-view="scrollIntoViewId"
      :upper-threshold="40"
      :lower-threshold="150"
      @scroll="handleScroll"
      @scrolltoupper="handleScrollToUpper"
      @scrolltolower="handleScrollToLower"
    >
      <div v-if="historyTip" class="message-tip">{{ historyTip }}</div>
      <div
        v-for="(item, index) in messageList"
        :id="getMessageDomId(item.ID)"
        :key="item.ID"
        :class="['message-item', `${'out' === item.flow ? 'is-me' : ''}`]"
      >
        <div
          v-if="getDisplaySenderName(index)"
          class="message-header"
          :title="item.nick || item.from"
        >
          {{ getDisplayName(item.from) }}
        </div>
        <div :class="['message-body', { 'is-image': isImageMessage(item) }]">
          <message-image
            v-if="isImageMessage(item)"
            :data="item.payload.imageInfoArray"
            :progress="item.progress"
            @load="handleImageLoad"
          />
          <message-file
            v-else-if="isFileMessage(item)"
            :data="item.payload"
            :progress="item.progress"
          />
          <message-text v-else :data="item.payload.text" />
        </div>
      </div>
    </scroll-view>
    <div
      v-if="!isStickyBottom"
      class="back-to-bottom"
      @tap="handleBackToBottom"
    >
      {{ backToBottomText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  ref,
  watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import MessageText from '../MessageTypes/MessageText.vue';
import MessageImage from '../MessageTypes/MessageImage.vue';
import MessageFile from '../MessageTypes/MessageFile.vue';
import useMessageList from './useMessageListHook';
import { MESSAGE_TYPE } from '../util';
import { getFields, instanceMapping } from '../../../utils/domOperation';
import { throttle } from '../../../utils/utils';
import { useRoomStore } from '../../../stores/room';
import { useChatStore } from '../../../stores/chat';

const MESSAGE_DOM_ID_PREFIX = 'message-';
// Distance to the bottom that still counts as reading the latest messages.
const STICKY_BOTTOM_THRESHOLD = 150;
// Fallback when the viewport height is unavailable: only a clear swipe up counts.
const SCROLL_UP_TOLERANCE = 60;
// The viewport shrinks when the keyboard shows up, so the height is re-measured.
const CONTAINER_HEIGHT_CACHE_TIME = 2000;
// Animated scrolling keeps firing scroll events after the target is reached.
const AUTO_SCROLL_SETTLE_TIME = 500;
// Time the keyboard takes to finish sliding in or out.
const KEYBOARD_ANIMATION_TIME = 300;

const thisInstance = getCurrentInstance()?.proxy || getCurrentInstance();
const roomStore = useRoomStore();
const chatStore = useChatStore();
const { getDisplayName } = storeToRefs(roomStore);
const { keyboardHeight } = storeToRefs(chatStore);
const {
  t,
  setMessageListInfo,
  messageList,
  handleGetHistoryMessageList,
  getDisplaySenderName,
  isCompleted,
} = useMessageList();

const scrollIntoViewId = ref('');
const isStickyBottom = ref(true);
const newMessageCount = ref(0);
const isLoadingHistory = ref(false);
const hasReachedTop = ref(false);
let lastScrollTop = 0;
let isFirstScreenReady = false;
let containerHeight = 0;
let containerHeightMeasuredAt = 0;
let isAutoScrolling = false;
let autoScrollTimer: ReturnType<typeof setTimeout> | null = null;

const isImageMessage = (message: Record<string, any>) =>
  message.type === MESSAGE_TYPE.IMAGE;

const isFileMessage = (message: Record<string, any>) =>
  message.type === MESSAGE_TYPE.FILE;

/**
 * Message IDs may contain characters that are invalid in a dom id,
 * which would break scroll-into-view.
 **/
const getMessageDomId = (ID: string) =>
  `${MESSAGE_DOM_ID_PREFIX}${String(ID).replace(/[^\w-]/g, '_')}`;

const historyTip = computed(() => {
  if (isLoadingHistory.value) {
    return t('Loading');
  }
  if (
    isCompleted.value &&
    hasReachedTop.value &&
    messageList.value.length > 0
  ) {
    return t('No more messages');
  }
  return '';
});

const backToBottomText = computed(() =>
  newMessageCount.value > 0
    ? t('n new messages', { count: newMessageCount.value })
    : t('Back to bottom')
);

async function getContainerHeight() {
  const isCacheValid =
    containerHeight > 0 &&
    Date.now() - containerHeightMeasuredAt < CONTAINER_HEIGHT_CACHE_TIME;
  if (isCacheValid) {
    return containerHeight;
  }
  try {
    const { height } = await getFields('#messageScrollList', 'messageList');
    containerHeight = height || 0;
    containerHeightMeasuredAt = Date.now();
  } catch (e) {
    containerHeight = 0;
  }
  return containerHeight;
}

function markAutoScrolling() {
  isAutoScrolling = true;
  if (autoScrollTimer) {
    clearTimeout(autoScrollTimer);
  }
  autoScrollTimer = setTimeout(() => {
    isAutoScrolling = false;
  }, AUTO_SCROLL_SETTLE_TIME);
}

async function scrollToMessage(ID: string) {
  markAutoScrolling();
  const messageDomId = getMessageDomId(ID);
  if (scrollIntoViewId.value === messageDomId) {
    /**
     * scroll-view only reacts when the target changes, so the previous target
     * has to be cleared before scrolling to the same message again.
     **/
    scrollIntoViewId.value = '';
    await nextTick();
  }
  scrollIntoViewId.value = messageDomId;
}

async function scrollToLatestMessage() {
  await nextTick();
  const lastMessage = messageList.value[messageList.value.length - 1];
  if (!lastMessage) {
    return;
  }
  await scrollToMessage(lastMessage.ID);
}

const handleMessageListScroll = async (e: any) => {
  const { scrollTop = 0, scrollHeight = 0 } = e?.detail || {};
  const previousScrollTop = lastScrollTop;
  lastScrollTop = scrollTop;
  // Our own animated scrolling must not be mistaken for the user scrolling away.
  if (isAutoScrolling) {
    return;
  }
  const height = await getContainerHeight();
  if (height > 0) {
    isStickyBottom.value =
      scrollHeight - scrollTop - height <= STICKY_BOTTOM_THRESHOLD;
  } else if (scrollTop < previousScrollTop - SCROLL_UP_TOLERANCE) {
    isStickyBottom.value = false;
  }
  if (isStickyBottom.value) {
    newMessageCount.value = 0;
  }
};

const handleScroll = throttle(handleMessageListScroll, 100);

const handleScrollToLower = () => {
  isStickyBottom.value = true;
  newMessageCount.value = 0;
};

async function handleBackToBottom() {
  isStickyBottom.value = true;
  newMessageCount.value = 0;
  await scrollToLatestMessage();
}

async function handleImageLoad() {
  if (!isStickyBottom.value) {
    return;
  }
  await scrollToLatestMessage();
}

async function handleScrollToUpper() {
  // scroll-view may fire this once on the first render, before any user scroll.
  if (!isFirstScreenReady || isLoadingHistory.value) {
    return;
  }
  hasReachedTop.value = true;
  if (isCompleted.value || messageList.value.length === 0) {
    return;
  }
  const previousTopMessageId = messageList.value[0].ID;
  isLoadingHistory.value = true;
  try {
    await handleGetHistoryMessageList();
    // Keep the reading position on the message that used to be on top.
    await nextTick();
    await scrollToMessage(previousTopMessageId);
  } catch (e) {
    // Keep the current list when loading history fails.
  } finally {
    isLoadingHistory.value = false;
  }
}

watch(messageList, async (newMessageList, oldMessageList) => {
  const lastMessage = newMessageList[newMessageList.length - 1];
  if (!lastMessage) {
    return;
  }
  const oldLastMessage = oldMessageList?.[oldMessageList.length - 1];
  if (lastMessage.ID === oldLastMessage?.ID) {
    return;
  }
  if (isStickyBottom.value || lastMessage.flow === 'out') {
    isStickyBottom.value = true;
    newMessageCount.value = 0;
    await scrollToLatestMessage();
    return;
  }
  const oldMessageIds = (oldMessageList || []).map(message => message.ID);
  newMessageCount.value += newMessageList.filter(
    message => !oldMessageIds.includes(message.ID)
  ).length;
});

/**
 * The keyboard shrinks the list, so the cached height is dropped and the
 * reading position is kept at the latest message.
 **/
watch(keyboardHeight, async () => {
  containerHeight = 0;
  if (!isStickyBottom.value) {
    return;
  }
  await scrollToLatestMessage();
  // The list keeps resizing while the keyboard slides in, so anchor it again.
  setTimeout(scrollToLatestMessage, KEYBOARD_ANIMATION_TIME);
});

onMounted(async () => {
  instanceMapping.set('messageList', thisInstance);
  await setMessageListInfo();
  isFirstScreenReady = true;
});
</script>

<style lang="scss" scoped>
.message-list-container-wx {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: scroll;
  background-color: var(--bg-color-operate);

  &::-webkit-scrollbar {
    display: none;
  }

  .message-top {
    display: flex;
    justify-content: center;
  }

  .message-list {
    height: 100%;
    overflow-y: scroll;

    .message-tip {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px 0;
      font-size: 12px;
      color: var(--text-color-secondary);
    }

    .message-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 0 20px;
      word-break: break-all;

      &:last-of-type {
        margin-bottom: 0;
      }

      &.is-me {
        align-items: flex-end;

        .message-body {
          display: inline-block;
          min-width: 24px;
          padding: 7px;
          font-size: 14px;
          font-weight: 400;
          border-radius: 8px;
          background-color: var(--bg-color-bubble-own);
          color: var(--text-color-primary);
        }
      }

      .message-header {
        max-width: 180px;
        overflow: hidden;
        font-family: 'PingFang SC';
        font-size: 10px;
        font-style: normal;
        font-weight: 500;
        line-height: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text-color-warning);
      }

      .message-body {
        display: inline-block;
        padding: 7px;
        margin-top: 10px;
        font-size: 14px;
        font-weight: 400;
        border-radius: 8px;
        background-color: var(--bg-color-bubble-reciprocal);
        color: var(--text-color-primary);
      }

      .message-body.is-image {
        padding: 0;
        background-color: transparent;
      }
    }
  }

  .back-to-bottom {
    position: absolute;
    right: 16px;
    bottom: 12px;
    padding: 6px 12px;
    font-size: 12px;
    line-height: 16px;
    border-radius: 14px;
    box-shadow: 0 2px 8px var(--uikit-color-black-7);
    background-color: var(--bg-color-function);
    color: var(--text-color-link);
  }
}
</style>
