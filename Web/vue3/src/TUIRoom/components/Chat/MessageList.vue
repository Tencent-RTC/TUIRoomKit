<template>
  <div :class="isMobile ? 'message-list-container-h5':'message-list-container'">
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
import { nextTick, onMounted, onUnmounted } from 'vue';
import MessageText from './MessageTypes/MessageText.vue';
import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import isMobile from '../../utils/useMediaValue';
import useMessageList from '../Chat/useMessageListHook';

const {
  t,
  showLoadMore,
  messageAimId,
  roomEngine,
  messageBottomEl,
  handleMessageListScroll,
  handleGetHistoryMessageList,
  onReceiveTextMessage,
  messageList,
} = useMessageList();

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
      margin-bottom: 10px;
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
      margin-bottom: 10px;
      max-width: 180px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .message-body {
      background-color: var(--message-body-h5);
      display: inline-block;
      padding: 7px;
      font-weight: 400;
      font-size: 14px;
      color: #FFFFFF;
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
