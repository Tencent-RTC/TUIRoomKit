<template>
  <div
    :class="isMobile ? 'message-list-container-h5' : 'message-list-container'"
  >
    <div id="messageScrollList" ref="messageListRef" class="message-list">
      <div
        v-for="(item, index) in messageList"
        :key="item.ID"
        ref="messageAimId"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import MessageText from '../MessageTypes/MessageText.vue';
import { isMobile } from '../../../utils/environment';
import useMessageList from './useMessageListHook';
import { getScrollInfo } from '../../../utils/domOperation';
import { throttle } from '../../../utils/utils';
import { useRoomStore } from '../../../stores/room';

const messageListRef = ref<HTMLElement>();
const roomStore = useRoomStore();
const { getDisplayName } = storeToRefs(roomStore);

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
  const bottom =
    messageContainer.scrollHeight -
    messageContainer.scrollTop -
    messageContainer.clientHeight;
  isScrollAtBottom = bottom <= 80;
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
.message-list-container {
  flex: 1;
  height: 100%;
  overflow: auto;

  .message-list {
    height: 100%;
    overflow: hidden auto;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .message-top {
    display: flex;
    justify-content: center;
  }

  .message-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 8px;
    word-break: break-all;

    &:last-of-type {
      margin-bottom: 0;
    }

    &.is-me {
      align-items: end;

      .message-body {
        min-width: 24px;
        padding: 10px;
        background-color: var(--bg-color-bubble-own);
        color: var(--text-color-primary);
        border-radius: 8px;
      }
    }

    .message-header {
      max-width: 180px;
      margin-bottom: 4px;
      overflow: hidden;
      font-size: 14px;
      font-weight: 400;
      line-height: 22px;
      color: var(--text-color-warning);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .message-body {
      display: inline-block;
      padding: 10px;
      font-size: 14px;
      font-weight: 400;
      background-color: var(--bg-color-bubble-reciprocal);
      color: var(--text-color-primary);
      border-radius: 8px;
    }
  }
}

.message-list-container-h5 {
  width: 100%;
  height: 100%;
  padding: 10px 23px 10px 32px;
  background-color: var(--bg-color-operate);

  .message-list {
    height: 100%;
    overflow: hidden auto;

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
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 20px;
      word-break: break-all;

      &:last-of-type {
        margin-bottom: 0;
      }

      &.is-me {
        align-items: end;

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
        margin-bottom: 10px;
        overflow: hidden;
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
        font-size: 14px;
        font-weight: 400;
        border-radius: 8px;
        background-color: var(--bg-color-bubble-reciprocal);
        color: var(--text-color-primary);
      }
    }
  }
}
</style>
