<template>
  <div :class="isMobile ? 'message-list-container-h5' : 'message-list-container'">
    <div class="message-list">
      <div
        v-for="(item, index) in messageList"
        :key="item.ID"
        ref="messageAimId"
        :class="['message-item', `${'out' === item.flow ? 'is-me' : ''}`]"
      >
        <div v-if="handleDisplaySenderName(index)" class="message-header" :title="item.nick || item.from">
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
import { nextTick, onMounted, onUnmounted } from 'vue';
import MessageText from '../MessageTypes/MessageText.vue';
import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { isMobile }  from '../../../utils/environment';
import useMessageList from '../useMessageListHook';
import { useChatStore } from '../../../stores/chat';
const chatStore = useChatStore();

const {
  messageAimId,
  roomEngine,
  messageBottomEl,
  handleMessageListScroll,
  onReceiveTextMessage,
  messageList,
  getMessageList,
} = useMessageList();

function handleDisplaySenderName(index: number) {
  if (index === 0) return true;
  return messageList.value[index].from !== messageList.value[index - 1].from;
}

onMounted(async () => {
  const { currentMessageList, isCompleted, nextReqMessageId } = await getMessageList();
  const filterCurrentMessageList = currentMessageList.filter((item: any) => item.type === 'TIMTextElem');
  chatStore.setMessageListInfo(filterCurrentMessageList, isCompleted, nextReqMessageId);

  await nextTick(() => {
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
  overflow: auto;
  flex: 1;

  &::-webkit-scrollbar {
    display: none;
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
  .message-bottom {
    width: 0;
    height: 0;
  }
}

.message-list-container-h5 {
  padding: 10px 23px 10px 32px;
  background-color: var(--message-list-color-h5);
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

  .message-bottom {
    width: 0;
    height: 0;
  }
}
</style>
