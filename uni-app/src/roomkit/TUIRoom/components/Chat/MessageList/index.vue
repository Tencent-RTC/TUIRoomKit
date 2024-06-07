<template>
  <div class="message-list-container-wx">
<!--    <scroll-view
      id="messageScrollList" ref="messageListRef" class="message-list" scroll-y="true"
      :scroll-top="scrollTop" @scroll="handleScroll"
    >
      <div
        v-for="(item, index) in messageList"
        :key="item.ID"
        :class="['message-item', `${'out' === item.flow ? 'is-me' : ''}`]"
      >
        <div v-if="getDisplaySenderName(index)" class="message-header" :title="item.nick || item.from">
          {{ item.nick || item.from }}
        </div>
        <div class="message-body">
          <message-text :data="item.payload.text" />
        </div>
      </div>
    </scroll-view> -->
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue';
import MessageText from '../MessageTypes/MessageText.vue';
import useMessageList from './useMessageListHook';
import { getBoundingClientRect, getScrollInfo, instanceMapping } from '../../../utils/domOperation';
import { throttle } from '../../../utils/utils';
const thisInstance = getCurrentInstance()?.proxy || getCurrentInstance();
const scrollTop = ref();
let isScrollAtBottom = true;
const {
  setMessageListInfo,
  messageList,
  handleGetHistoryMessageList,
  getDisplaySenderName,
  isCompleted,
} = useMessageList();

async function scrollToLatestMessage() {
  const { scrollHeight } = await getScrollInfo('#messageScrollList', 'messageList');
  scrollTop.value = scrollHeight;
}

const handleMessageListScroll = async (e: any) => {
  const messageContainer = e.target as HTMLElement;
  const { scrollTop } = await getScrollInfo('#messageScrollList', 'messageList');
  const { height } = await getBoundingClientRect('#messageScrollList', 'messageList');
  isScrollAtBottom = (scrollTop > height);
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
  background-color: #d4d4d4;
  height: 100%;
  width: 100%;
  overflow: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
  .message-top {
    display: flex;
    justify-content: center;
  }
  .message-list {
    overflow-y: scroll;
    height: 100%;
  .message-item {
    padding: 0 20px;
    word-break: break-all;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    &:last-of-type {
      margin-bottom: 0;
    }
    &.is-me {
      align-items: flex-end;
      .message-body {
        background-color: #4791FF;
        min-width: 24px;
        border-radius: 8px;
        display: inline-block;
        padding: 7px;
        font-weight: 400;
        font-size: 14px;
        color: #FFFFFF;
      }
    }
    .message-header {
      max-width: 180px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 10px;
      color: #ff7200;
      line-height: 14px;
      max-width: 180px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .message-body {
      background-color: #817e7e;
      display: inline-block;
      padding: 7px;
      font-weight: 400;
      font-size: 14px;
      color: #FFFFFF;
      border-radius: 8px;
      margin-top: 10px
    }
  }
}
}
</style>
