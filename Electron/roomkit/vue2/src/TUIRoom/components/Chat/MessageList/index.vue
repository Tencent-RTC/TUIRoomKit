<template>
  <div :class="isMobile ? 'message-list-container-h5' : 'message-list-container'">
    <div id="messageScrollList" ref="messageListRef" class="message-list">
      <div
        v-for="(item, index) in messageList"
        :key="item.ID"
        ref="messageAimId"
        :class="['message-item', `${'out' === item.flow ? 'is-me' : ''}`]"
      >
        <div v-if="getDisplaySenderName(index)" class="message-header" :title="item.nick || item.from">
          {{ getDisplayName(item.from) }}
        </div>
        <div class="message-body">
          <message-text :data="item.payload.text" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import MessageText from '../MessageTypes/MessageText.vue';
import { isMobile }  from '../../../utils/environment';
import useMessageList from './useMessageListHook';
import { getScrollInfo } from '../../../utils/domOperation';
import { throttle } from '../../../utils/utils';
import { useRoomStore } from '../../../stores/room';

const messageListRef = ref<HTMLElement>();
const roomStore = useRoomStore();
const { getDisplayName } = storeToRefs(roomStore)

const {
  messageList,
  setMessageListInfo,
  handleGetHistoryMessageList,
  isCompleted,
  getDisplaySenderName,
} = useMessageList();

let isScrollAtBottom = true;


const handleMessageListScroll = (e: Event) => {
  const messageContainer = e.target as HTMLElement;
  const bottom = messageContainer.scrollHeight - messageContainer.scrollTop - messageContainer.clientHeight;
  isScrollAtBottom = (bottom <= 80);
  if (messageContainer.scrollTop < 40 && !isCompleted.value) {
    handleGetHistoryMessageList();
  }
};

const handleScroll = throttle(handleMessageListScroll, 1000);


async function scrollToLatestMessage() {
  const { scrollHeight } = await getScrollInfo('#messageScrollList');
  if (messageListRef.value) {
    messageListRef.value.scrollTop = scrollHeight;
  }
}

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

onMounted(() => {
  setMessageListInfo();
  messageListRef.value?.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  messageListRef.value?.removeEventListener('scroll', handleScroll);
});
</script>

<style lang="scss" scoped>
.tui-theme-white .message-body {
  --user-chat-color: rgba(213, 224, 242, 0.4);
  --user-font-color: var(--black-color);
  --host-font-color: var(--white-color);
}
.tui-theme-black .message-body {
  --user-chat-color: rgba(213, 224, 242, 0.1);
  --user-font-color: var(--background-color-4);
  --host-font-color: var(--background-color-4);
}
.message-list-container {
  height: 100%;
  overflow: auto;
  flex: 1;
  .message-list {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  .message-top {
    display: flex;
    justify-content: center;
  }

  .message-item {
    margin-bottom: 8px;
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
        background-color: var(--active-color-1);
        min-width: 24px;
        padding: 10px;
        color: var(--host-font-color);
        border-radius: 8px;
      }
    }
    .message-header {
      font-size: 14px;
      color: var(--font-color-8);
      margin-bottom: 4px;
      max-width: 180px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-weight: 400;
      line-height: 22px;
    }
    .message-body {
      background-color: var(--user-chat-color);
      display: inline-block;
      padding: 10px;
      font-weight: 400;
      font-size: 14px;
      color: var(--user-font-color);
      border-radius: 8px;
    }
  }
}

.message-list-container-h5 {
  padding: 10px 23px 10px 32px;
  background-color: var(--message-list-color-h5);
  height: 100%;
  width: 100%;
  .message-list{
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  .message-top {
    display: flex;
    justify-content: center;
  }
  .message-list {
    overflow-y: scroll;
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
          background-color: #4791ff;
          min-width: 24px;
          border-radius: 8px;
          display: inline-block;
          padding: 7px;
          font-weight: 400;
          font-size: 14px;
          color: #ffffff;
        }
      }
      .message-header {
        margin-bottom: 10px;
        max-width: 180px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        font-style: normal;
        font-weight: 500;
        font-size: 10px;
        color: #ff7200;
        line-height: 14px;
      }
      .message-body {
        background-color: var(--message-body-h5);
        display: inline-block;
        padding: 7px;
        font-weight: 400;
        font-size: 14px;
        color: #ffffff;
        border-radius: 8px;
      }
    }
  }
}
</style>
