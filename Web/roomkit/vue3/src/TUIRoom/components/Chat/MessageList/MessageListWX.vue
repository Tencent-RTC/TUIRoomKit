<template>
  <div class="message-list-container-wx">
    <scroll-view
      id="messageScrollList"
      ref="messageListRef"
      class="message-list"
      scroll-y="true"
      :scroll-top="scrollTop"
      @scroll="handleScroll"
    >
      <div
        v-for="(item, index) in messageList"
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
        <div class="message-body">
          <message-text :data="item.payload.text" />
        </div>
      </div>
    </scroll-view>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import MessageText from '../MessageTypes/MessageText.vue';
import useMessageList from './useMessageListHook';
import {
  getBoundingClientRect,
  getScrollInfo,
  instanceMapping,
} from '../../../utils/domOperation';
import { throttle } from '../../../utils/utils';
import { useRoomStore } from '../../../stores/room';

const thisInstance = getCurrentInstance()?.proxy || getCurrentInstance();
const scrollTop = ref();
const roomStore = useRoomStore();
const { getDisplayName } = storeToRefs(roomStore);
let isScrollAtBottom = true;
const {
  setMessageListInfo,
  messageList,
  handleGetHistoryMessageList,
  getDisplaySenderName,
  isCompleted,
} = useMessageList();

async function scrollToLatestMessage() {
  const { scrollHeight } = await getScrollInfo(
    '#messageScrollList',
    'messageList'
  );
  scrollTop.value = scrollHeight;
}

const handleMessageListScroll = async (e: any) => {
  const messageContainer = e.target as HTMLElement;
  const { scrollTop } = await getScrollInfo(
    '#messageScrollList',
    'messageList'
  );
  const { height } = await getBoundingClientRect(
    '#messageScrollList',
    'messageList'
  );
  isScrollAtBottom = scrollTop > height;
  if (messageContainer.scrollTop < 40 && !isCompleted.value) {
    handleGetHistoryMessageList();
  }
};

const handleScroll = throttle(handleMessageListScroll, 1000);

watch(messageList, async (newMessageList, oldMessageList) => {
  if ((newMessageList as any).length === 0) return;
  const lastMessage = (newMessageList as any).slice(-1);
  const oldLastMessage = (oldMessageList as any).slice(-1);
  const isSendByMe = lastMessage[0].flow === 'out';
  const isNewMessage = lastMessage[0].ID !== oldLastMessage[0]?.ID;
  await nextTick();
  if (isScrollAtBottom) {
    scrollToLatestMessage();
    return;
  }
  if (isSendByMe && isNewMessage) {
    scrollToLatestMessage();
  }
});

onMounted(async () => {
  instanceMapping.set('messageList', thisInstance);
  setMessageListInfo();
});
</script>

<style lang="scss" scoped>
.message-list-container-wx {
  width: 100%;
  height: 100%;
  overflow: scroll;
  background-color: var(--message-list-color-h5);

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
          color: #fff;
          background-color: #4791ff;
          border-radius: 8px;
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
        color: #ff7200;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .message-body {
        display: inline-block;
        padding: 7px;
        margin-top: 10px;
        font-size: 14px;
        font-weight: 400;
        color: #fff;
        background-color: #817e7e;
        border-radius: 8px;
      }
    }
  }
}
</style>
