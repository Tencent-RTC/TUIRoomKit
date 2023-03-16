<template>
  <div class="message-list-container">
    <div class="message-list">
      <p v-if="showLoadMore" class="message-top" @click="handleGetHistoryMessageList">{{ t('Load More') }}</p>
      <div
        v-for="item in messageList"
        :key="item.ID"
        ref="messageAimId"
        :class="['message-item', `${'out' === item.flow ? 'is-me' : ''}`]"
      >
        <div class="message-header" :title="item.nick || item.from">
          {{ item.nick || item.from }}
        </div>
        <div class="message-body">
          <message-text v-if="item.type === 'TIMTextElem'" :data="item.payload.text" />
        </div>
      </div>
    </div>
    <div ref="messageBottomEl" class="message-bottom" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../../stores/chat';
import { useBasicStore } from '../../stores/basic';
import MessageText from './MessageTypes/MessageText.vue';
import { useI18n } from '../../locales';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';


const { t } = useI18n();
const roomEngine = useGetRoomEngine();
const chatStore = useChatStore();
const basicStore = useBasicStore();
const { roomId } = storeToRefs(basicStore);
const { messageList, isCompleted, nextReqMessageId } = storeToRefs(chatStore);
const historyMessageList = ref([]);
const showLoadMore = ref(false);
const messageAimId = ref();
const messageBottomEl = ref<HTMLInputElement | null>(null);
/**
 * To solve the problem of scrolling up the message yourself,
 * to prevent others from sending messages keep scrolling down the message list
 *
 * 为了解决自己向上滚动浏览消息, 防止别人发的消息不停向下滚消息列表
**/
let isScrollNotAtBottom = false;
let isScrollToTop = false;
const handleMessageListScroll = (e: Event) => {
  const messageContainer = e.target as HTMLElement;
  const bottom = messageContainer.scrollHeight - messageContainer.scrollTop - messageContainer.clientHeight;
  if (bottom > 80) {
    /**
     * 30 is the threshold for determining whether to scroll up through the messages
     *
     * 30 为判断是否向上滚动浏览消息的阈值
    **/
    isScrollNotAtBottom = true;
  } else {
    isScrollNotAtBottom = false;
  }
  if (isScrollToTop) {
    messageContainer.scrollTop = 0;
    isScrollToTop = false;
  }
};

watch(isCompleted, (value) => {
  showLoadMore.value = !value;
}, { immediate: true, deep: true });

watch(messageList, async (newMessageList, oldMessageList) => { // eslint-disable-line
  await nextTick();
  if (isScrollNotAtBottom) {
    if (newMessageList.length >= 1) {
      const lastMessage = newMessageList[newMessageList.length - 1];
      if ((lastMessage as any).flow === 'out') {
        /**
         * The latest one was sent by myself
         *
         * 最新一条是自己发送的
        **/
        messageBottomEl.value && messageBottomEl.value.scrollIntoView();
      }
    }
    return;
  }
  /**
   * If you don't scroll all the way to the bottom, show the latest news directly
   *
   * 如果没进行滚动一直在底部, 直接展示最新消息
  **/
  messageBottomEl.value && messageBottomEl.value.scrollIntoView();
});

async function handleGetHistoryMessageList() {
  const tim = roomEngine.instance?.getTIM();
  const imResponse = await tim.getMessageList({
    conversationID: `GROUP${roomId.value}`,
    nextReqMessageID: nextReqMessageId.value,
  });
  const { nextReqMessageID: middleReqMessageId, messageList: historyMessageList, isCompleted } = imResponse.data;
  messageList.value.splice(0, 0, ...historyMessageList);
  const currentMessageList = messageList.value.filter(item => item.type === 'TIMTextElem');
  chatStore.setMessageListInfo(currentMessageList, isCompleted, middleReqMessageId);
  isScrollToTop = true;
}

const onReceiveTextMessage = (data: { roomId: string, message: any }) => {
  const { message } = data;
  chatStore.updateMessageList({
    ID: message.messageId,
    type: 'TIMTextElem',
    payload: {
      text: message.message,
    },
    nick: message?.userName || message.userId,
    from: message.userId,
    flow: 'in',
    sequence: Math.random(),
  });
};

onMounted(() => {
  nextTick(() => {
    if (messageAimId?.value?.length > 0) {
      const target = messageAimId?.value[messageAimId?.value?.length - 1];
      target.scrollIntoView();
    }
  });
  window.addEventListener('scroll', handleMessageListScroll, true);
});

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onReceiveTextMessage, onReceiveTextMessage);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleMessageListScroll, true);
  roomEngine.instance?.off(TUIRoomEvents.onReceiveTextMessage, onReceiveTextMessage);
});
</script>

<style lang="scss" scoped>
.message-list-container {
  height: calc(100% - 188px);
  ;
  padding: 10px 23px 10px 32px;
  background-color: var(--message-list-color);
  overflow: auto;

  &::-webkit-scrollbar {
    display: none;
  }
  .message-top {
    display: flex;
    justify-content: center;
  }
  .message-item {
    margin-bottom: 20px;
    word-break: break-all;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    &:last-of-type {
      margin-bottom: 0;
    }
    &.is-me {
      align-items: end;
      .message-body {
        background-color: var(--message-color);
        min-width: 24px;
      }
    }
    .message-header {
      font-size: 14px;
      color: #7C85A6;
      margin-bottom: 10px;
      max-width: 180px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .message-body {
      background-color: #1883FF;
      display: inline-block;
      padding: 7px;
      font-weight: 400;
      font-size: 14px;
      color: #FFFFFF;
    }
  }
  .message-bottom {
    width: 0;
    height: 0;
  }
}
</style>
